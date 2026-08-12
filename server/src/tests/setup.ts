import "dotenv/config";
import { beforeEach, afterAll } from "vitest";
import { prisma } from "../config/prisma";

// These tests run against a real PostgreSQL database (see README —
// "Running tests"). We truncate all tables before each test so every test
// starts from a clean, deterministic state.
beforeEach(async () => {
  const tables = [
    "AuditLog",
    "ChallanItem",
    "Challan",
    "StockMovement",
    "CustomerFollowup",
    "Customer",
    "Product",
    "Category",
    "Warehouse",
    "User",
  ];
  await prisma.$transaction(tables.map((t) => prisma.$executeRawUnsafe(`TRUNCATE TABLE "${t}" CASCADE`)));
});

afterAll(async () => {
  await prisma.$disconnect();
});
