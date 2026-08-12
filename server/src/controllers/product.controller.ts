import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ok, paginated } from "../utils/apiResponse";
import * as productService from "../services/product.service";

export const listProductsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, categoryId, stockStatus } = req.query as any;
  const { items, total } = await productService.listProducts({ page, limit, search, categoryId, stockStatus });
  return paginated(res, items, page, limit, total);
});

export const getProductHandler = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductById(req.params.id);
  return ok(res, product);
});

export const createProductHandler = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.createProduct(req.body, req.user!.sub);
  return ok(res, product, "Product created successfully", 201);
});

export const updateProductHandler = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.updateProduct(req.params.id, req.body, req.user!.sub);
  return ok(res, product, "Product updated successfully");
});

export const listStockMovementsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, productId, type, from, to } = req.query as any;
  const { items, total } = await productService.listStockMovements({ page, limit, productId, type, from, to });
  return paginated(res, items, page, limit, total);
});

export const createStockMovementHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await productService.createStockMovement(req.body, req.user!.sub);
  return ok(res, result, "Stock movement recorded successfully", 201);
});

export const getInventoryRiskHandler = asyncHandler(async (_req: Request, res: Response) => {
  const riskData = await productService.getInventoryRiskCenter();
  return ok(res, riskData);
});

