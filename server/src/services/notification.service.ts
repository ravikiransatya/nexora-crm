import { prisma } from "../config/prisma";

export interface SystemNotification {
  id: string;
  type: "CRITICAL_STOCK" | "OVERDUE_FOLLOWUP" | "PENDING_CHALLAN";
  title: string;
  message: string;
  severity: "high" | "medium" | "info";
  link: string;
  createdAt: string;
}

export async function getSystemNotifications(): Promise<SystemNotification[]> {
  const notifications: SystemNotification[] = [];
  const now = new Date();

  // 1. Critical Stock Notifications
  const lowStockProducts = await prisma.product.findMany({
    where: { isActive: true, stockStatus: { in: ["OUT_OF_STOCK", "LOW_STOCK"] } },
    take: 5,
    orderBy: { stock: "asc" },
  });

  for (const p of lowStockProducts) {
    notifications.push({
      id: `stock-${p.id}`,
      type: "CRITICAL_STOCK",
      title: p.stock === 0 ? `Out of Stock: ${p.sku}` : `Low Stock: ${p.sku}`,
      message: `${p.name} currently has ${p.stock} units (min: ${p.minStock}).`,
      severity: p.stock === 0 ? "high" : "medium",
      link: `/products?search=${encodeURIComponent(p.sku)}`,
      createdAt: p.updatedAt.toISOString(),
    });
  }

  // 2. Overdue Follow-up Notifications
  const overdueFollowups = await prisma.customer.findMany({
    where: {
      followUpDate: { lt: now },
      status: { in: ["LEAD", "ACTIVE"] },
    },
    take: 5,
    orderBy: { followUpDate: "asc" },
  });

  for (const c of overdueFollowups) {
    if (!c.followUpDate) continue;
    notifications.push({
      id: `followup-${c.id}`,
      type: "OVERDUE_FOLLOWUP",
      title: `Overdue Follow-up: ${c.name}`,
      message: `Follow-up was scheduled for ${c.followUpDate.toISOString().split("T")[0]}.`,
      severity: "high",
      link: `/customers/${c.id}`,
      createdAt: c.followUpDate.toISOString(),
    });
  }

  // 3. Pending Draft Challans Notifications
  const draftChallans = await prisma.challan.findMany({
    where: { status: "DRAFT" },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { name: true } } },
  });

  for (const ch of draftChallans) {
    notifications.push({
      id: `challan-${ch.id}`,
      type: "PENDING_CHALLAN",
      title: `Draft Challan: ${ch.challanNumber}`,
      message: `Created for ${ch.customer.name} awaiting confirmation.`,
      severity: "info",
      link: `/challans/${ch.id}`,
      createdAt: ch.createdAt.toISOString(),
    });
  }

  return notifications;
}
