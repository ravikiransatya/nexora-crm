import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getAnalyticsHandler } from "../controllers/analytics.controller";

const router = Router();

router.use(requireAuth());
router.get("/", getAnalyticsHandler);

export default router;
