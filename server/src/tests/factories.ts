import bcrypt from "bcryptjs";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { signToken } from "../utils/jwt";

export async function createUser(role: Role = "ADMIN", email?: string) {
  const uniqueEmail = email || `${role.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 100000)}@test.demo`;
  const passwordHash = await bcrypt.hash("Passw0rd!", 10);
  const user = await prisma.user.create({
    data: { name: `Test ${role}`, email: uniqueEmail, passwordHash, role },
  });
  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  return { user, token };
}

export async function createProduct(overrides: Partial<{ name: string; sku: string; unitPrice: number; stock: number; minStock: number }> = {}) {
  return prisma.product.create({
    data: {
      name: overrides.name ?? "Test Product",
      sku: overrides.sku ?? `SKU-TEST-${Math.floor(Math.random() * 1000000)}`,
      unitPrice: new Prisma.Decimal(overrides.unitPrice ?? 100),
      stock: overrides.stock ?? 10,
      minStock: overrides.minStock ?? 2,
      stockStatus: (overrides.stock ?? 10) <= 0 ? "OUT_OF_STOCK" : "HEALTHY",
    },
  });
}

export async function createCustomer(overrides: Partial<{ name: string; mobile: string }> = {}) {
  return prisma.customer.create({
    data: {
      name: overrides.name ?? "Test Customer",
      mobile: overrides.mobile ?? "9800000000",
    },
  });
}
