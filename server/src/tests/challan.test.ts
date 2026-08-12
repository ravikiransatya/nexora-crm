import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../config/prisma";
import { createUser, createProduct, createCustomer } from "./factories";
import * as challanService from "../services/challan.service";

const app = createApp();

describe("Challan confirmation — critical business logic", () => {
  it("REJECTS confirmation when requested quantity exceeds available stock (stock=5, requested=8)", async () => {
    const { token } = await createUser("SALES");
    const product = await createProduct({ stock: 5 });
    const customer = await createCustomer();

    const draftRes = await request(app)
      .post("/api/challans")
      .set("Authorization", `Bearer ${token}`)
      .send({ customerId: customer.id, items: [{ productId: product.id, quantity: 8 }] });
    expect(draftRes.status).toBe(201);

    const confirmRes = await request(app)
      .post(`/api/challans/${draftRes.body.data.id}/confirm`)
      .set("Authorization", `Bearer ${token}`);

    expect(confirmRes.status).toBe(409);
    expect(confirmRes.body.error.code).toBe("INSUFFICIENT_STOCK");
    expect(confirmRes.body.error.message).toContain("Available: 5");
    expect(confirmRes.body.error.message).toContain("Requested: 8");

    // Stock must remain untouched, and the challan must remain DRAFT — no partial application.
    const unchangedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    expect(unchangedProduct?.stock).toBe(5);

    const unchangedChallan = await prisma.challan.findUnique({ where: { id: draftRes.body.data.id } });
    expect(unchangedChallan?.status).toBe("DRAFT");
  });

  it("deducts stock correctly and records an OUT movement when stock is sufficient (stock=10, requested=4 -> stock=6)", async () => {
    const { token } = await createUser("SALES");
    const product = await createProduct({ stock: 10 });
    const customer = await createCustomer();

    const draftRes = await request(app)
      .post("/api/challans")
      .set("Authorization", `Bearer ${token}`)
      .send({ customerId: customer.id, items: [{ productId: product.id, quantity: 4 }] });

    const confirmRes = await request(app)
      .post(`/api/challans/${draftRes.body.data.id}/confirm`)
      .set("Authorization", `Bearer ${token}`);

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe("CONFIRMED");

    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updatedProduct?.stock).toBe(6);

    const movement = await prisma.stockMovement.findFirst({ where: { productId: product.id, type: "OUT" } });
    expect(movement).not.toBeNull();
    expect(movement?.quantity).toBe(4);
  });

  it("never allows stock to go negative even with a multi-item challan where one item is insufficient (full rollback)", async () => {
    const { user } = await createUser("SALES");
    const productA = await createProduct({ stock: 100 }); // plenty
    const productB = await createProduct({ stock: 2 }); // insufficient for requested 5
    const customer = await createCustomer();

    const challan = await challanService.createChallan(
      {
        customerId: customer.id,
        items: [
          { productId: productA.id, quantity: 10 },
          { productId: productB.id, quantity: 5 },
        ],
      },
      user.id
    );

    await expect(challanService.confirmChallan(challan.id, user.id)).rejects.toMatchObject({
      statusCode: 409,
      code: "INSUFFICIENT_STOCK",
    });

    // Product A must NOT have been deducted even though it had enough stock —
    // the whole transaction rolls back together.
    const unchangedA = await prisma.product.findUnique({ where: { id: productA.id } });
    expect(unchangedA?.stock).toBe(100);

    const unchangedB = await prisma.product.findUnique({ where: { id: productB.id } });
    expect(unchangedB?.stock).toBe(2);
  });

  it("stores a product snapshot on challan items so later product edits don't rewrite history", async () => {
    const { token, user } = { ...(await createUser("SALES")) } as any;
    const product = await createProduct({ name: "Original Name", sku: "SKU-SNAP-1", unitPrice: 100, stock: 20 });
    const customer = await createCustomer();

    const draftRes = await request(app)
      .post("/api/challans")
      .set("Authorization", `Bearer ${token}`)
      .send({ customerId: customer.id, items: [{ productId: product.id, quantity: 2 }] });

    // Edit the product after the challan snapshot was taken.
    await prisma.product.update({ where: { id: product.id }, data: { name: "Renamed Product", unitPrice: 999 } });

    const challan = await prisma.challan.findUnique({
      where: { id: draftRes.body.data.id },
      include: { items: true },
    });

    expect(challan?.items[0].productName).toBe("Original Name");
    expect(Number(challan?.items[0].unitPrice)).toBe(100);
  });

  it("prevents a DRAFT challan from being edited once it is CONFIRMED", async () => {
    const { token, user } = { ...(await createUser("SALES")) } as any;
    const product = await createProduct({ stock: 20 });
    const customer = await createCustomer();

    const draftRes = await request(app)
      .post("/api/challans")
      .set("Authorization", `Bearer ${token}`)
      .send({ customerId: customer.id, items: [{ productId: product.id, quantity: 2 }] });

    await request(app).post(`/api/challans/${draftRes.body.data.id}/confirm`).set("Authorization", `Bearer ${token}`);

    const editRes = await request(app)
      .patch(`/api/challans/${draftRes.body.data.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ items: [{ productId: product.id, quantity: 1 }] });

    expect(editRes.status).toBe(409);
  });
});
