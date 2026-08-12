import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { globalSearchHandler } from "../controllers/search.controller";

const router = Router();

router.get("/", requireAuth(), globalSearchHandler);

export default router;
