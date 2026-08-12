import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiResponse";

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });
}

export async function createUser(data: { name: string; email: string; password: string; role: string }) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw ApiError.conflict("A user with this email already exists", "DUPLICATE_EMAIL");

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, passwordHash, role: data.role as any },
  });
  return { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive };
}

export async function updateUser(id: string, data: { name?: string; role?: string; isActive?: boolean }) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("User not found");

  const user = await prisma.user.update({
    where: { id },
    data: { ...data, role: data.role as any },
  });
  return { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive };
}
