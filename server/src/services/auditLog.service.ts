import { AuditAction, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../config/prisma";

type TxClient = Prisma.TransactionClient | PrismaClient;

export async function recordAudit(
  client: TxClient = prisma,
  params: {
    userId?: string;
    action: AuditAction;
    entity: string;
    entityId?: string;
    description: string;
  }
) {
  return client.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      description: params.description,
    },
  });
}
