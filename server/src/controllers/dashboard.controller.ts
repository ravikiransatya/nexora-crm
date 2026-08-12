import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/apiResponse";
import { getDashboardSummary } from "../services/dashboard.service";

export const getDashboardHandler = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await getDashboardSummary();
  return ok(res, summary);
});
