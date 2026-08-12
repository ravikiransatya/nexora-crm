import { prisma } from "../config/prisma";

export interface SmartInsight {
  id: string;
  type: "CRITICAL" | "WARNING" | "INFO" | "SUCCESS";
  category: "INVENTORY" | "CRM" | "SALES" | "FINANCE";
  title: string;
  description: string;
  metric?: string;
  actionText?: string;
  actionLink?: string;
}

export async function getDashboardSummary() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    totalCustomers,
    activeCustomers,
    totalProducts,
    lowStockProducts,
    outOfStockProducts,
    draftChallans,
    confirmedChallans,
    todayConfirmedChallans,
    upcomingFollowups,
    overdueFollowups,
    todayFollowups,
    customersByStatus,
    recentMovements,
    criticalStockItems,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { status: "ACTIVE" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { stockStatus: "LOW_STOCK" } }),
    prisma.product.count({ where: { stockStatus: "OUT_OF_STOCK" } }),
    prisma.challan.count({ where: { status: "DRAFT" } }),
    prisma.challan.count({ where: { status: "CONFIRMED" } }),
    prisma.challan.count({ where: { status: "CONFIRMED", confirmedAt: { gte: startOfToday } } }),
    prisma.customer.findMany({
      where: { followUpDate: { gte: new Date() } },
      orderBy: { followUpDate: "asc" },
      take: 5,
      select: { id: true, name: true, followUpDate: true, status: true, mobile: true },
    }),
    prisma.customer.findMany({
      where: { followUpDate: { lt: startOfToday }, status: { in: ["LEAD", "ACTIVE"] } },
      orderBy: { followUpDate: "asc" },
      take: 5,
      select: { id: true, name: true, followUpDate: true, status: true },
    }),
    prisma.customer.count({
      where: { followUpDate: { gte: startOfToday, lte: endOfToday } },
    }),
    prisma.customer.groupBy({ by: ["status"], _count: true }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        product: { select: { name: true, sku: true } },
        createdBy: { select: { name: true } },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true, stockStatus: { in: ["OUT_OF_STOCK", "LOW_STOCK"] } },
      take: 5,
      orderBy: { stock: "asc" },
      select: { id: true, name: true, sku: true, stock: true, minStock: true, stockStatus: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true, role: true } } },
    }),
  ]);

  // 14-day challan trend
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const recentChallans = await prisma.challan.findMany({
    where: { status: "CONFIRMED", confirmedAt: { gte: fourteenDaysAgo } },
    select: { confirmedAt: true, totalAmount: true },
  });

  const trendMap = new Map<string, { count: number; amount: number }>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(fourteenDaysAgo);
    d.setDate(d.getDate() + i);
    trendMap.set(d.toISOString().slice(0, 10), { count: 0, amount: 0 });
  }
  for (const c of recentChallans) {
    if (!c.confirmedAt) continue;
    const key = c.confirmedAt.toISOString().slice(0, 10);
    const entry = trendMap.get(key);
    if (entry) {
      entry.count += 1;
      entry.amount += Number(c.totalAmount);
    }
  }

  // Calculate Rule-Based Smart Insights
  const smartInsights: SmartInsight[] = [];

  if (outOfStockProducts > 0) {
    smartInsights.push({
      id: "insight-stockout",
      type: "CRITICAL",
      category: "INVENTORY",
      title: "Stockout Alert",
      description: `${outOfStockProducts} product(s) are completely out of stock. Delivery delays may occur for new challans.`,
      metric: `${outOfStockProducts} SKU(s)`,
      actionText: "View Risk Center",
      actionLink: "/products?tab=risk",
    });
  }

  if (lowStockProducts > 0) {
    smartInsights.push({
      id: "insight-lowstock",
      type: "WARNING",
      category: "INVENTORY",
      title: "Inventory Replenishment Required",
      description: `${lowStockProducts} product(s) have fallen below their minimum stock thresholds.`,
      metric: `${lowStockProducts} SKU(s)`,
      actionText: "Restock Inventory",
      actionLink: "/stock-movements",
    });
  }

  if (overdueFollowups.length > 0) {
    smartInsights.push({
      id: "insight-overdue-crm",
      type: "CRITICAL",
      category: "CRM",
      title: "Overdue Customer Follow-ups",
      description: `${overdueFollowups.length} scheduled CRM follow-up(s) have passed their due date without interaction.`,
      metric: `${overdueFollowups.length} Overdue`,
      actionText: "View Follow-up Center",
      actionLink: "/followups",
    });
  }

  if (draftChallans > 0) {
    smartInsights.push({
      id: "insight-draft-challans",
      type: "INFO",
      category: "SALES",
      title: "Unconfirmed Challans Pending",
      description: `${draftChallans} sales challan(s) are in DRAFT status waiting for final stock verification & confirmation.`,
      metric: `${draftChallans} Pending`,
      actionText: "Review Challans",
      actionLink: "/challans?status=DRAFT",
    });
  }

  if (todayConfirmedChallans > 0) {
    smartInsights.push({
      id: "insight-today-sales",
      type: "SUCCESS",
      category: "SALES",
      title: "Active Fulfillment Today",
      description: `${todayConfirmedChallans} challan(s) confirmed today with inventory updated in real-time.`,
      metric: `${todayConfirmedChallans} Confirmed`,
      actionText: "View Challans",
      actionLink: "/challans",
    });
  }

  // Calculate Nexora Operational Health Score (0.0 - 100.0%)
  const inventoryHealthScore = totalProducts > 0
    ? Math.max(0, ((totalProducts - outOfStockProducts - lowStockProducts) / totalProducts) * 100)
    : 100;
  const crmHealthScore = overdueFollowups.length === 0 ? 100 : Math.max(0, 100 - overdueFollowups.length * 15);
  const salesHealthScore = draftChallans === 0 ? 100 : Math.max(0, 100 - draftChallans * 10);
  const overallHealth = Number((inventoryHealthScore * 0.4 + crmHealthScore * 0.3 + salesHealthScore * 0.3).toFixed(1));

  let systemStatus: "SYSTEM NORMAL" | "ATTENTION REQUIRED" | "CRITICAL EVENT" = "SYSTEM NORMAL";
  if (outOfStockProducts > 0 || overdueFollowups.length >= 3) {
    systemStatus = "CRITICAL EVENT";
  } else if (lowStockProducts > 0 || overdueFollowups.length > 0 || draftChallans > 0) {
    systemStatus = "ATTENTION REQUIRED";
  }

  return {
    operationalHealth: {
      overallHealth,
      inventoryHealthScore: Number(inventoryHealthScore.toFixed(1)),
      crmHealthScore: Number(crmHealthScore.toFixed(1)),
      salesHealthScore: Number(salesHealthScore.toFixed(1)),
      systemStatus,
    },
    totals: {
      totalCustomers,
      activeCustomers,
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      draftChallans,
      confirmedChallans,
      todayConfirmedChallans,
      todayFollowups,
      overdueFollowupsCount: overdueFollowups.length,
    },
    smartInsights,
    criticalStockItems,
    upcomingFollowups,
    overdueFollowups,
    customerStatusDistribution: customersByStatus.map((c) => ({ status: c.status, count: c._count })),
    challanTrend: Array.from(trendMap.entries()).map(([date, v]) => ({ date, ...v })),
    recentStockMovements: recentMovements,
    recentAuditLogs,
  };
}
