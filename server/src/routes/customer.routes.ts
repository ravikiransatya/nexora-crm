import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomerQuerySchema,
  idParamSchema,
  addFollowupSchema,
} from "../validators/customer.validators";
import {
  listCustomersHandler,
  getCustomerHandler,
  createCustomerHandler,
  updateCustomerHandler,
  addFollowupHandler,
} from "../controllers/customer.controller";

const router = Router();

// Customers module: Admin, Sales, Accounts. Warehouse has no CRM access.
const canAccessCustomers = requireRole("ADMIN", "SALES", "ACCOUNTS");

router.use(requireAuth(), canAccessCustomers);

router.get("/", validate({ query: listCustomerQuerySchema }), listCustomersHandler);
router.get("/:id", validate({ params: idParamSchema }), getCustomerHandler);
router.post("/", validate({ body: createCustomerSchema }), createCustomerHandler);
router.patch("/:id", validate({ params: idParamSchema, body: updateCustomerSchema }), updateCustomerHandler);
router.post(
  "/:id/followups",
  validate({ params: idParamSchema, body: addFollowupSchema }),
  addFollowupHandler
);

export default router;
