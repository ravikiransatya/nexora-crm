import { z } from "zod";

export const roleEnum = z.enum(["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"]);

export const createUserSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: roleEnum,
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: roleEnum.optional(),
  isActive: z.boolean().optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid("Invalid id") });
