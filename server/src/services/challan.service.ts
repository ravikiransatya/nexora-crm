import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiResponse";
import { recordAudit } from "./auditLog.service";
import { computeStockStatus } from "./product.service";
import { challanNumber } from "../utils/pagination";

interface ChallanItemInput {
  productId: string;
  quantity: number;
}

async function buildItemSnapshots(tx: Prisma.TransactionClient, items: ChallanItemInput[]) {
  const productIds = items.map((i) => i.productId);
  const products = await tx.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  return items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw ApiError.badRequest(`Product ${item.productId} does not exist`, "PRODUCT_NOT_FOUND");
    }
    const unitPrice = product.unitPrice;
    const subtotal = unitPrice.mul(item.quantity);
    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      unitPrice,
      quantity: item.quantity,
      subtotal,
    };
  });
}

/**
 * Creates a challan in DRAFT status. No stock is touched at this stage —
 * stock is only reduced when the challan is CONFIRMED (see confirmChallan).
 * Product data (name/sku/price) is snapshotted onto the items now so that
 * later edits to the product catalog never rewrite challan history.
 */
export async function createChallan(data: { customerId: string; items: ChallanItemInput[] }, userId: string) {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) throw ApiError.notFound("Customer not found");

    const itemSnapshots = await buildItemSnapshots(tx, data.items);

    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const countThisYear = await tx.challan.count({ where: { createdAt: { gte: yearStart } } });
    const number = challanNumber(countThisYear + 1);

    const totalQuantity = itemSnapshots.reduce((sum, i) => sum + i.quantity, 0);
    const totalAmount = itemSnapshots.reduce((sum, i) => sum.add(i.subtotal), new Prisma.Decimal(0));

    const challan = await tx.challan.create({
      data: {
        challanNumber: number,
        customerId: data.customerId,
        status: "DRAFT",
        totalQuantity,
        totalAmount,
        createdById: userId,
        items: { create: itemSnapshots },
      },
      include: { items: true, customer: true },
    });

    await recordAudit(tx, {
      userId,
      action: "CHALLAN_CREATED",
      entity: "Challan",
      entityId: challan.id,
      description: `Challan ${challan.challanNumber} created for ${customer.name}`,
    });

    return challan;
  });
}

export async function updateChallan(id: string, data: { customerId?: string; items?: ChallanItemInput[] }, userId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.challan.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Challan not found");
    if (existing.status !== "DRAFT") {
      throw ApiError.conflict("Only DRAFT challans can be edited", "INVALID_STATUS");
    }

    let updateData: Prisma.ChallanUpdateInput = {};

    if (data.items) {
      const itemSnapshots = await buildItemSnapshots(tx, data.items);
      const totalQuantity = itemSnapshots.reduce((sum, i) => sum + i.quantity, 0);
      const totalAmount = itemSnapshots.reduce((sum, i) => sum.add(i.subtotal), new Prisma.Decimal(0));

      await tx.challanItem.deleteMany({ where: { challanId: id } });
      updateData = {
        ...updateData,
        totalQuantity,
        totalAmount,
        items: { create: itemSnapshots },
      };
    }

    if (data.customerId) {
      const customer = await tx.customer.findUnique({ where: { id: data.customerId } });
      if (!customer) throw ApiError.notFound("Customer not found");
      updateData.customer = { connect: { id: data.customerId } };
    }

    const challan = await tx.challan.update({
      where: { id },
      data: updateData,
      include: { items: true, customer: true },
    });

    return challan;
  });
}

/**
 * Confirms a challan: validates stock for every line item, deducts stock,
 * writes an OUT stock movement per item, and marks the challan CONFIRMED —
 * all inside a single serializable transaction. If ANY item has
 * insufficient stock, the entire transaction rolls back and nothing is
 * partially applied. Product rows are locked (SELECT ... FOR UPDATE) in a
 * stable order to prevent race conditions and deadlocks when two challans
 * for overlapping products are confirmed concurrently.
 */
export async function confirmChallan(id: string, userId: string) {
  return prisma.$transaction(
    async (tx) => {
      const challan = await tx.challan.findUnique({ where: { id }, include: { items: true, customer: true } });
      if (!challan) throw ApiError.notFound("Challan not found");
      if (challan.status !== "DRAFT") {
        throw ApiError.conflict(`Challan is already ${challan.status.toLowerCase()}`, "INVALID_STATUS");
      }

      // Lock product rows in a deterministic order (sorted by id) to avoid deadlocks.
      const sortedItems = [...challan.items].sort((a, b) => a.productId.localeCompare(b.productId));

      for (const item of sortedItems) {
        const locked = await tx.$queryRaw<{ id: string; stock: number; sku: string; minStock: number }[]>`
          SELECT id, stock, sku, "minStock" FROM "Product" WHERE id = ${item.productId} FOR UPDATE
        `;
        const product = locked[0];
        if (!product) {
          throw ApiError.notFound(`Product ${item.sku} no longer exists`);
        }
        if (product.stock < item.quantity) {
          throw ApiError.conflict(
            `Insufficient stock for ${product.sku}. Available: ${product.stock}, Requested: ${item.quantity}.`,
            "INSUFFICIENT_STOCK",
            { sku: product.sku, available: product.stock, requested: item.quantity }
          );
        }

        const newStock = product.stock - item.quantity;
        await tx.product.update({
          where: { id: product.id },
          data: { stock: newStock, stockStatus: computeStockStatus(newStock, product.minStock) },
        });

        await tx.stockMovement.create({
          data: {
            productId: product.id,
            quantity: item.quantity,
            type: "OUT",
            reason: `Challan ${challan.challanNumber} confirmed`,
            createdById: userId,
          },
        });
      }

      const confirmed = await tx.challan.update({
        where: { id },
        data: { status: "CONFIRMED", confirmedAt: new Date() },
        include: { items: true, customer: true },
      });

      await recordAudit(tx, {
        userId,
        action: "CHALLAN_CONFIRMED",
        entity: "Challan",
        entityId: confirmed.id,
        description: `Challan ${confirmed.challanNumber} confirmed — stock deducted for ${sortedItems.length} item(s)`,
      });

      return confirmed;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

/**
 * Cancels a challan. If it was already CONFIRMED, stock is reversed
 * (IN movements created) inside the same transaction so inventory stays
 * accurate.
 */
export async function cancelChallan(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const challan = await tx.challan.findUnique({ where: { id }, include: { items: true } });
    if (!challan) throw ApiError.notFound("Challan not found");
    if (challan.status === "CANCELLED") {
      throw ApiError.conflict("Challan is already cancelled", "INVALID_STATUS");
    }

    if (challan.status === "CONFIRMED") {
      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;
        const newStock = product.stock + item.quantity;
        await tx.product.update({
          where: { id: product.id },
          data: { stock: newStock, stockStatus: computeStockStatus(newStock, product.minStock) },
        });
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            quantity: item.quantity,
            type: "IN",
            reason: `Challan ${challan.challanNumber} cancelled — stock reversed`,
            createdById: userId,
          },
        });
      }
    }

    const cancelled = await tx.challan.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
      include: { items: true, customer: true },
    });

    await recordAudit(tx, {
      userId,
      action: "CHALLAN_CANCELLED",
      entity: "Challan",
      entityId: cancelled.id,
      description: `Challan ${cancelled.challanNumber} cancelled`,
    });

    return cancelled;
  });
}

export async function listChallans(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  from?: Date;
  to?: Date;
}) {
  const { page, limit, search, status, from, to } = params;
  const where: Prisma.ChallanWhereInput = {
    ...(status ? { status: status as any } : {}),
    ...(from || to
      ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}),
    ...(search
      ? {
          OR: [
            { challanNumber: { contains: search, mode: "insensitive" } },
            { customer: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.challan.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true, businessName: true } }, items: true },
    }),
    prisma.challan.count({ where }),
  ]);

  return { items, total };
}

export async function getChallanById(id: string) {
  const challan = await prisma.challan.findUnique({
    where: { id },
    include: { customer: true, items: { include: { product: { select: { name: true, sku: true } } } }, createdBy: { select: { name: true } } },
  });
  if (!challan) throw ApiError.notFound("Challan not found");
  return challan;
}
