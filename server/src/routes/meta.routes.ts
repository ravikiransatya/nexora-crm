import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { listCategoriesHandler, listWarehousesHandler } from "../controllers/meta.controller";

const router = Router();

router.get("/categories", requireAuth(), listCategoriesHandler);
router.get("/warehouses", requireAuth(), listWarehousesHandler);

export default router;
