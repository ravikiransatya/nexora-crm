import { z } from "zod";

export const challanStatusEnum = z.enum(["DRAFT", "CONFIRMED", "CANCELLED"]);

export const challanItemSchema = z.object({
  productId: z.string().uuid("Invalid product id"),
  quantity: z.coerce.number().int().positive("Quantity must be greater than zero"),
});

export const createChallanSchema = z.object({
  customerId: z.string().uuid("Invalid customer id"),
  items: z.array(challanItemSchema).min(1, "A challan must contain at least one product"),
});

export const updateChallanSchema = z.object({
  customerId: z.string().uuid().optional(),
  items: z.array(challanItemSchema).min(1).optional(),
});

export const listChallanQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: challanStatusEnum.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid("Invalid id") });
