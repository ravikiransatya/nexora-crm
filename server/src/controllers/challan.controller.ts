import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ok, paginated } from "../utils/apiResponse";
import * as challanService from "../services/challan.service";
import { streamChallanPdf } from "../services/pdf.service";

export const listChallansHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, status, from, to } = req.query as any;
  const { items, total } = await challanService.listChallans({ page, limit, search, status, from, to });
  return paginated(res, items, page, limit, total);
});

export const getChallanHandler = asyncHandler(async (req: Request, res: Response) => {
  const challan = await challanService.getChallanById(req.params.id);
  return ok(res, challan);
});

export const createChallanHandler = asyncHandler(async (req: Request, res: Response) => {
  const challan = await challanService.createChallan(req.body, req.user!.sub);
  return ok(res, challan, "Challan saved as draft", 201);
});

export const updateChallanHandler = asyncHandler(async (req: Request, res: Response) => {
  const challan = await challanService.updateChallan(req.params.id, req.body, req.user!.sub);
  return ok(res, challan, "Challan updated");
});

export const confirmChallanHandler = asyncHandler(async (req: Request, res: Response) => {
  const challan = await challanService.confirmChallan(req.params.id, req.user!.sub);
  return ok(res, challan, "Challan confirmed and stock updated");
});

export const cancelChallanHandler = asyncHandler(async (req: Request, res: Response) => {
  const challan = await challanService.cancelChallan(req.params.id, req.user!.sub);
  return ok(res, challan, "Challan cancelled");
});

export const downloadChallanPdfHandler = asyncHandler(async (req: Request, res: Response) => {
  const challan = await challanService.getChallanById(req.params.id);
  streamChallanPdf(res, challan as any);
});
