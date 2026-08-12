import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/apiResponse";
import * as userService from "../services/user.service";

export const listUsersHandler = asyncHandler(async (_req: Request, res: Response) => {
  const users = await userService.listUsers();
  return ok(res, users);
});

export const createUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  return ok(res, user, "User created successfully", 201);
});

export const updateUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateUser(req.params.id, req.body);
  return ok(res, user, "User updated successfully");
});
