import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { paginated } from "../utils/apiResponse";
import { prisma } from "../config/prisma";
import { getPagination } from "../utils/pagination";

export const listAuditLogsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { action, entity } = req.query as { action?: string; entity?: string };

  const where = {
    ...(action ? { action: action as any } : {}),
    ...(entity ? { entity } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return paginated(res, items, page, limit, total);
});
