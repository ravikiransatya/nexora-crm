import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createUserSchema, updateUserSchema, idParamSchema } from "../validators/user.validators";
import { listUsersHandler, createUserHandler, updateUserHandler } from "../controllers/user.controller";

const router = Router();

// User administration is Admin-only.
router.use(requireAuth(), requireRole("ADMIN"));

router.get("/", listUsersHandler);
router.post("/", validate({ body: createUserSchema }), createUserHandler);
router.patch("/:id", validate({ params: idParamSchema, body: updateUserSchema }), updateUserHandler);

export default router;
