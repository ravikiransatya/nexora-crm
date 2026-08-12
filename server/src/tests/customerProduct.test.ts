import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { createUser, createProduct } from "./factories";

const app = createApp();

describe("Customer creation", () => {
  it("creates a customer with valid data", async () => {
    const { token } = await createUser("SALES");
    const res = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Kiran Traders", mobile: "9825011111", customerType: "WHOLESALE" });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Kiran Traders");
  });

  it("rejects a customer with an invalid mobile number", async () => {
    const { token } = await createUser("SALES");
    const res = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Bad Mobile Co", mobile: "abc" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a customer with a missing name", async () => {
    const { token } = await createUser("SALES");
    const res = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({ mobile: "9825011111" });

    expect(res.status).toBe(422);
  });
});

describe("Product creation", () => {
  it("creates a product and computes stock status", async () => {
    const { token } = await createUser("WAREHOUSE");
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "LED Bulb 9W", sku: "SKU-9001", unitPrice: 85, stock: 5, minStock: 10 });

    expect(res.status).toBe(201);
    expect(res.body.data.stockStatus).toBe("LOW_STOCK");
  });
});

describe("Pagination", () => {
  it("paginates the product list correctly", async () => {
    const { token } = await createUser("WAREHOUSE");
    for (let i = 0; i < 25; i++) {
      await createProduct({ sku: `SKU-PAGE-${i}` });
    }

    const res = await request(app)
      .get("/api/products?page=2&limit=10")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(10);
    expect(res.body.data.page).toBe(2);
    expect(res.body.data.total).toBe(25);
    expect(res.body.data.totalPages).toBe(3);
  });
});
