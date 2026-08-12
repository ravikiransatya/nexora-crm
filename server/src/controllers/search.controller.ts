import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/apiResponse";
import { prisma } from "../config/prisma";

// Powers the Ctrl+K global command search across customers/products/challans.
export const globalSearchHandler = asyncHandler(async (req: Request, res: Response) => {
  const q = String(req.query.q ?? "").trim();
  if (!q) return ok(res, { customers: [], products: [], challans: [] });

  const [customers, products, challans] = await Promise.all([
    prisma.customer.findMany({
      where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { mobile: { contains: q, mode: "insensitive" } }] },
      take: 5,
      select: { id: true, name: true, mobile: true, status: true },
    }),
    prisma.product.findMany({
      where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] },
      take: 5,
      select: { id: true, name: true, sku: true, stockStatus: true },
    }),
    prisma.challan.findMany({
      where: { challanNumber: { contains: q, mode: "insensitive" } },
      take: 5,
      select: { id: true, challanNumber: true, status: true },
    }),
  ]);

  return ok(res, { customers, products, challans });
});
