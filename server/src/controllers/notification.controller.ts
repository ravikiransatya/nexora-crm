import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/apiResponse";
import { getSystemNotifications } from "../services/notification.service";

export const getNotificationsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const notifications = await getSystemNotifications();
  ok(res, notifications);
});
