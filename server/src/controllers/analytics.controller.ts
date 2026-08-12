import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/apiResponse";
import { getAnalyticsOverview } from "../services/analytics.service";

export const getAnalyticsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getAnalyticsOverview();
  ok(res, data);
});
