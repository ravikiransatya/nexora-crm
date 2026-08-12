import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { listAuditLogsHandler } from "../controllers/auditLog.controller";

const router = Router();

// Audit logs are admin-only visibility.
router.get("/", requireAuth(), requireRole("ADMIN"), listAuditLogsHandler);

export default router;
