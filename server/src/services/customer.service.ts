import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiResponse";
import { recordAudit } from "./auditLog.service";

export async function listCustomers(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  customerType?: string;
}) {
  const { page, limit, search, status, customerType } = params;
  const where: Prisma.CustomerWhereInput = {
    ...(status ? { status: status as any } : {}),
    ...(customerType ? { customerType: customerType as any } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { mobile: { contains: search, mode: "insensitive" } },
            { businessName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.count({ where }),
  ]);

  return { items, total };
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      followups: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { name: true } } } },
      challans: { orderBy: { createdAt: "desc" }, take: 20, include: { createdBy: { select: { name: true } } } },
    },
  });
  if (!customer) throw ApiError.notFound("Customer not found");

  const [confirmedAgg, draftAgg, totalChallanCount, customerAuditLogs] = await Promise.all([
    prisma.challan.aggregate({
      where: { customerId: id, status: "CONFIRMED" },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.challan.aggregate({
      where: { customerId: id, status: "DRAFT" },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.challan.count({ where: { customerId: id } }),
    prisma.auditLog.findMany({
      where: { OR: [{ entityId: id }, { description: { contains: customer.name } }] },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const stats = {
    totalChallans: totalChallanCount,
    confirmedChallans: confirmedAgg._count,
    totalSpend: Number(confirmedAgg._sum.totalAmount ?? 0),
    draftChallans: draftAgg._count,
    draftValue: Number(draftAgg._sum.totalAmount ?? 0),
  };

  return { ...customer, stats, auditLogs: customerAuditLogs };
}

export async function createCustomer(data: any, userId: string) {
  const customer = await prisma.customer.create({
    data: { ...data, email: data.email || null },
  });
  await recordAudit(prisma, {
    userId,
    action: "CUSTOMER_CREATED",
    entity: "Customer",
    entityId: customer.id,
    description: `Customer '${customer.name}' created`,
  });
  return customer;
}

export async function updateCustomer(id: string, data: any, userId: string) {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Customer not found");

  const customer = await prisma.customer.update({
    where: { id },
    data: { ...data, email: data.email === "" ? null : data.email },
  });

  await recordAudit(prisma, {
    userId,
    action: "CUSTOMER_UPDATED",
    entity: "Customer",
    entityId: customer.id,
    description: `Customer '${customer.name}' updated`,
  });
  return customer;
}

export async function addFollowup(customerId: string, note: string, userId: string) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw ApiError.notFound("Customer not found");

  return prisma.customerFollowup.create({
    data: { customerId, note, createdById: userId },
    include: { createdBy: { select: { name: true } } },
  });
}
