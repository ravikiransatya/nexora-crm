import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/apiResponse";
import { prisma } from "../config/prisma";

// Lightweight lookups for frontend dropdowns (categories, warehouses).
export const listCategoriesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return ok(res, categories);
});

export const listWarehousesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const warehouses = await prisma.warehouse.findMany({ orderBy: { name: "asc" } });
  return ok(res, warehouses);
});
