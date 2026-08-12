import { Prisma, StockStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiResponse";
import { recordAudit } from "./auditLog.service";

export function computeStockStatus(stock: number, minStock: number): StockStatus {
  if (stock <= 0) return "OUT_OF_STOCK";
  if (stock <= minStock) return "LOW_STOCK";
  return "HEALTHY";
}

export async function listProducts(params: {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  stockStatus?: string;
}) {
  const { page, limit, search, categoryId, stockStatus } = params;
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(categoryId ? { categoryId } : {}),
    ...(stockStatus ? { stockStatus: stockStatus as any } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { category: true, warehouse: true },
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, warehouse: true },
  });
  if (!product) throw ApiError.notFound("Product not found");
  return product;
}

async function resolveCategoryId(categoryId?: string, categoryName?: string) {
  if (categoryId) return categoryId;
  if (categoryName) {
    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });
    return category.id;
  }
  return undefined;
}

async function resolveWarehouseId(warehouseId?: string, warehouseName?: string) {
  if (warehouseId) return warehouseId;
  if (warehouseName) {
    const warehouse = await prisma.warehouse.upsert({
      where: { name: warehouseName },
      update: {},
      create: { name: warehouseName },
    });
    return warehouse.id;
  }
  return undefined;
}

export async function createProduct(data: any, userId: string) {
  const categoryId = await resolveCategoryId(data.categoryId, data.categoryName);
  const warehouseId = await resolveWarehouseId(data.warehouseId, data.warehouseName);
  const stock = data.stock ?? 0;
  const minStock = data.minStock ?? 0;

  const product = await prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku,
      unitPrice: data.unitPrice,
      stock,
      minStock,
      stockStatus: computeStockStatus(stock, minStock),
      categoryId,
      warehouseId,
    },
  });

  await recordAudit(prisma, {
    userId,
    action: "PRODUCT_CREATED",
    entity: "Product",
    entityId: product.id,
    description: `Product '${product.name}' (${product.sku}) created`,
  });

  return product;
}

export async function updateProduct(id: string, data: any, userId: string) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Product not found");

  const categoryId = await resolveCategoryId(data.categoryId, data.categoryName);
  const warehouseId = await resolveWarehouseId(data.warehouseId, data.warehouseName);

  const nextStock = data.stock ?? existing.stock;
  const nextMinStock = data.minStock ?? existing.minStock;

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(data.name ? { name: data.name } : {}),
      ...(data.sku ? { sku: data.sku } : {}),
      ...(data.unitPrice !== undefined ? { unitPrice: data.unitPrice } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(warehouseId ? { warehouseId } : {}),
      stock: nextStock,
      minStock: nextMinStock,
      stockStatus: computeStockStatus(nextStock, nextMinStock),
    },
  });

  await recordAudit(prisma, {
    userId,
    action: "PRODUCT_UPDATED",
    entity: "Product",
    entityId: product.id,
    description: `Product '${product.name}' (${product.sku}) updated`,
  });

  return product;
}

/**
 * Manual stock adjustment (outside the challan workflow), e.g. warehouse
 * receiving new stock (IN) or writing off damaged goods (OUT).
 * Runs inside a transaction so the stock value and the movement record
 * are always consistent, and stock can never go negative.
 */
export async function createStockMovement(
  data: { productId: string; quantity: number; type: "IN" | "OUT"; reason: string },
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: data.productId } });
    if (!product) throw ApiError.notFound("Product not found");

    const delta = data.type === "IN" ? data.quantity : -data.quantity;
    const newStock = product.stock + delta;

    if (newStock < 0) {
      throw ApiError.conflict(
        `Insufficient stock for ${product.sku}. Available: ${product.stock}, Requested: ${data.quantity}.`,
        "INSUFFICIENT_STOCK",
        { sku: product.sku, available: product.stock, requested: data.quantity }
      );
    }

    const updated = await tx.product.update({
      where: { id: product.id },
      data: { stock: newStock, stockStatus: computeStockStatus(newStock, product.minStock) },
    });

    const movement = await tx.stockMovement.create({
      data: {
        productId: product.id,
        quantity: data.quantity,
        type: data.type,
        reason: data.reason,
        createdById: userId,
      },
    });

    await recordAudit(tx, {
      userId,
      action: data.type === "IN" ? "STOCK_IN" : "STOCK_OUT",
      entity: "Product",
      entityId: product.id,
      description: `${data.type} ${data.quantity} of ${product.sku}: ${data.reason}`,
    });

    return { movement, product: updated };
  });
}

export async function listStockMovements(params: {
  page: number;
  limit: number;
  productId?: string;
  type?: string;
  from?: Date;
  to?: Date;
}) {
  const { page, limit, productId, type, from, to } = params;
  const where: Prisma.StockMovementWhereInput = {
    ...(productId ? { productId } : {}),
    ...(type ? { type: type as any } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { product: { select: { name: true, sku: true } }, createdBy: { select: { name: true } } },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return { items, total };
}

export async function getInventoryRiskCenter() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [products, movements30Days] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      include: { category: true, warehouse: true },
      orderBy: { stock: "asc" },
    }),
    prisma.stockMovement.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      where: { type: "OUT", createdAt: { gte: thirtyDaysAgo } },
    }),
  ]);

  const outMap = new Map<string, number>();
  for (const m of movements30Days) {
    outMap.set(m.productId, m._sum.quantity ?? 0);
  }

  const critical: any[] = [];
  const warning: any[] = [];
  const healthy: any[] = [];

  for (const p of products) {
    const totalOut30Days = outMap.get(p.id) ?? 0;
    const dailyOutRate = totalOut30Days / 30;
    const daysRemaining = dailyOutRate > 0 ? Math.round(p.stock / dailyOutRate) : 999;
    const deficit = Math.max(0, p.minStock - p.stock);

    let riskLevel: "CRITICAL" | "WARNING" | "HEALTHY" = "HEALTHY";
    let recommendedAction = "Maintain current stock level";

    if (p.stock === 0) {
      riskLevel = "CRITICAL";
      recommendedAction = `Immediate order required: Reorder ${Math.max(p.minStock, 20)} units`;
    } else if (p.stock <= p.minStock) {
      riskLevel = "WARNING";
      recommendedAction = `Reorder ${deficit + Math.max(10, p.minStock)} units to reach safe buffer`;
    }

    const item = {
      ...p,
      riskLevel,
      deficit,
      daysRemaining: daysRemaining > 365 ? 365 : daysRemaining,
      dailyOutRate: Math.round(dailyOutRate * 10) / 10,
      recommendedAction,
    };

    if (riskLevel === "CRITICAL") critical.push(item);
    else if (riskLevel === "WARNING") warning.push(item);
    else healthy.push(item);
  }

  return {
    summary: {
      criticalCount: critical.length,
      warningCount: warning.length,
      healthyCount: healthy.length,
      totalCount: products.length,
    },
    critical,
    warning,
    healthy,
  };
}

