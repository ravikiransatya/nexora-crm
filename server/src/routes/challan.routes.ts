import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createChallanSchema,
  updateChallanSchema,
  listChallanQuerySchema,
  idParamSchema,
} from "../validators/challan.validators";
import {
  listChallansHandler,
  getChallanHandler,
  createChallanHandler,
  updateChallanHandler,
  confirmChallanHandler,
  cancelChallanHandler,
  downloadChallanPdfHandler,
} from "../controllers/challan.controller";

const router = Router();

// Challans/sales: Admin, Sales, Accounts. Warehouse fulfils but doesn't create sales docs.
const canAccess = requireRole("ADMIN", "SALES", "ACCOUNTS");

router.use(requireAuth(), canAccess);

router.get("/", validate({ query: listChallanQuerySchema }), listChallansHandler);
router.get("/:id", validate({ params: idParamSchema }), getChallanHandler);
router.get("/:id/pdf", validate({ params: idParamSchema }), downloadChallanPdfHandler);
router.post("/", validate({ body: createChallanSchema }), createChallanHandler);
router.patch("/:id", validate({ params: idParamSchema, body: updateChallanSchema }), updateChallanHandler);
router.post("/:id/confirm", validate({ params: idParamSchema }), confirmChallanHandler);
router.post("/:id/cancel", validate({ params: idParamSchema }), cancelChallanHandler);

export default router;
