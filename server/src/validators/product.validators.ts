import { z } from "zod";

export const stockStatusEnum = z.enum(["HEALTHY", "LOW_STOCK", "OUT_OF_STOCK"]);

export const createProductSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  categoryId: z.string().uuid().optional(),
  categoryName: z.string().optional(), // convenience: create category by name if provided
  warehouseId: z.string().uuid().optional(),
  warehouseName: z.string().optional(),
  unitPrice: z.coerce.number().positive("Unit price must be positive"),
  stock: z.coerce.number().int().min(0).default(0),
  minStock: z.coerce.number().int().min(0).default(0),
});

export const updateProductSchema = createProductSchema.partial();

export const listProductQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  stockStatus: stockStatusEnum.optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid("Invalid id") });

export const stockMovementQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  productId: z.string().uuid().optional(),
  type: z.enum(["IN", "OUT"]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const createStockMovementSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  type: z.enum(["IN", "OUT"]),
  reason: z.string().min(1, "Reason is required"),
});
