import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { createUser } from "./factories";

const app = createApp();

describe("Analytics API", () => {
  it("returns analytics data overview successfully", async () => {
    const { token } = await createUser("ADMIN");
    const res = await request(app)
      .get("/api/analytics")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("salesOps");
    expect(res.body.data).toHaveProperty("topProducts");
    expect(res.body.data).toHaveProperty("customerSegments");
  });
});
