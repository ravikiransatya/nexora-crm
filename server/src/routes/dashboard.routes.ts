import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getDashboardHandler } from "../controllers/dashboard.controller";

const router = Router();

router.get("/", requireAuth(), getDashboardHandler);

export default router;
