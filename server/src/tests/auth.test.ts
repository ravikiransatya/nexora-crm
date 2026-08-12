import { describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../app";
import { prisma } from "../config/prisma";
import { createUser } from "./factories";

const app = createApp();

describe("Authentication", () => {
  it("logs in with valid credentials and returns a token + role", async () => {
    const passwordHash = await bcrypt.hash("Passw0rd!", 10);
    await prisma.user.create({
      data: { name: "Admin User", email: "admin@test.demo", passwordHash, role: "ADMIN" },
    });

    const res = await request(app).post("/api/auth/login").send({ email: "admin@test.demo", password: "Passw0rd!" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.role).toBe("ADMIN");
  });

  it("rejects invalid credentials", async () => {
    const passwordHash = await bcrypt.hash("Passw0rd!", 10);
    await prisma.user.create({
      data: { name: "Admin User", email: "admin@test.demo", passwordHash, role: "ADMIN" },
    });

    const res = await request(app).post("/api/auth/login").send({ email: "admin@test.demo", password: "wrong" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("rejects requests without a token", async () => {
    const res = await request(app).get("/api/customers");
    expect(res.status).toBe(401);
  });
});

describe("Role-based authorization", () => {
  it("forbids WAREHOUSE role from accessing the customers module", async () => {
    const { token } = await createUser("WAREHOUSE");
    const res = await request(app).get("/api/customers").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("allows SALES role to access the customers module", async () => {
    const { token } = await createUser("SALES");
    const res = await request(app).get("/api/customers").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("forbids non-ADMIN from listing audit logs", async () => {
    const { token } = await createUser("SALES");
    const res = await request(app).get("/api/audit-logs").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
