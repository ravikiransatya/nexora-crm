import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/auth.routes";
import customerRoutes from "./routes/customer.routes";
import productRoutes from "./routes/product.routes";
import challanRoutes from "./routes/challan.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import auditLogRoutes from "./routes/auditLog.routes";
import userRoutes from "./routes/user.routes";
import searchRoutes from "./routes/search.routes";
import metaRoutes from "./routes/meta.routes";
import notificationRoutes from "./routes/notification.routes";
import analyticsRoutes from "./routes/analytics.routes";

export function createApp() {
  const app = express();

  const allowedOrigin =
    env.CLIENT_URL === "*"
      ? true
      : env.CLIENT_URL.includes(",")
      ? env.CLIENT_URL.split(",").map((s) => s.trim())
      : env.CLIENT_URL;
  app.use(cors({ origin: allowedOrigin, credentials: true }));
  app.use(express.json());
  if (env.NODE_ENV !== "test") {
    app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
  }

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "nexora-erp-api" }));

  const openapiDocument = YAML.load(path.join(__dirname, "docs/openapi.yaml"));
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

  app.use("/api/auth", authRoutes);
  app.use("/api/customers", customerRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/challans", challanRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/audit-logs", auditLogRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/search", searchRoutes);
  app.use("/api/meta", metaRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/analytics", analyticsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
