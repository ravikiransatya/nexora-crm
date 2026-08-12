import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getNotificationsHandler } from "../controllers/notification.controller";

const router = Router();

router.use(requireAuth());
router.get("/", getNotificationsHandler);

export default router;
