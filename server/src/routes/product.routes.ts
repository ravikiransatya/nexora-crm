import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createProductSchema,
  updateProductSchema,
  listProductQuerySchema,
  idParamSchema,
  stockMovementQuerySchema,
  createStockMovementSchema,
} from "../validators/product.validators";
import {
  listProductsHandler,
  getProductHandler,
  createProductHandler,
  updateProductHandler,
  listStockMovementsHandler,
  createStockMovementHandler,
  getInventoryRiskHandler,
} from "../controllers/product.controller";

const router = Router();

// Products & inventory: Admin, Warehouse manage; Sales/Accounts can read for challans/invoices.
const canRead = requireRole("ADMIN", "WAREHOUSE", "SALES", "ACCOUNTS");
const canWrite = requireRole("ADMIN", "WAREHOUSE");

router.use(requireAuth());

// NOTE: static routes must be registered before the dynamic "/:id" route
router.get("/risk/center", canRead, getInventoryRiskHandler);
router.get(
  "/stock/movements",
  canRead,
  validate({ query: stockMovementQuerySchema }),
  listStockMovementsHandler
);
router.post(
  "/stock/movements",
  canWrite,
  validate({ body: createStockMovementSchema }),
  createStockMovementHandler
);

router.get("/", canRead, validate({ query: listProductQuerySchema }), listProductsHandler);
router.get("/:id", canRead, validate({ params: idParamSchema }), getProductHandler);
router.post("/", canWrite, validate({ body: createProductSchema }), createProductHandler);
router.patch("/:id", canWrite, validate({ params: idParamSchema, body: updateProductSchema }), updateProductHandler);

export default router;
