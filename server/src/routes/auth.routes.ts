import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../middleware/validate";
import { loginSchema } from "../validators/auth.validators";
import { loginHandler } from "../controllers/auth.controller";

const router = Router();

// Basic brute-force protection on the login endpoint.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many login attempts, try again later" } },
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Log in and obtain a JWT access token
 *     tags: [Auth]
 */
router.post("/login", loginLimiter, validate({ body: loginSchema }), loginHandler);

export default router;
