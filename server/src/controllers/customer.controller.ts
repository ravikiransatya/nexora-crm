import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ok, paginated } from "../utils/apiResponse";
import * as customerService from "../services/customer.service";

export const listCustomersHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, status, customerType } = req.query as any;
  const { items, total } = await customerService.listCustomers({ page, limit, search, status, customerType });
  return paginated(res, items, page, limit, total);
});

export const getCustomerHandler = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.getCustomerById(req.params.id);
  return ok(res, customer);
});

export const createCustomerHandler = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.createCustomer(req.body, req.user!.sub);
  return ok(res, customer, "Customer created successfully", 201);
});

export const updateCustomerHandler = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body, req.user!.sub);
  return ok(res, customer, "Customer updated successfully");
});

export const addFollowupHandler = asyncHandler(async (req: Request, res: Response) => {
  const followup = await customerService.addFollowup(req.params.id, req.body.note, req.user!.sub);
  return ok(res, followup, "Follow-up added successfully", 201);
});
