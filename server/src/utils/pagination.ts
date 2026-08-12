import { Request } from "express";

export function getPagination(req: Request) {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function challanNumber(sequence: number, year = new Date().getFullYear()) {
  return `CH-${year}-${String(sequence).padStart(5, "0")}`;
}
