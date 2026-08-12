import { prisma } from "../config/prisma";

export async function getAnalyticsOverview() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    confirmedChallans30Days,
    draftChallansCount,
    topSellingItems,
    customerTypeDistribution,
    stockHealthStats,
    recentMovementsCount,
  ] = await Promise.all([
    prisma.challan.findMany({
      where: { status: "CONFIRMED", confirmedAt: { gte: thirtyDaysAgo } },
      select: { totalAmount: true, confirmedAt: true, totalQuantity: true },
    }),
    prisma.challan.count({ where: { status: "DRAFT" } }),
    prisma.challanItem.groupBy({
      by: ["productId", "productName", "sku"],
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.customer.groupBy({
      by: ["customerType"],
      _count: true,
    }),
    prisma.product.groupBy({
      by: ["stockStatus"],
      _count: true,
    }),
    prisma.stockMovement.groupBy({
      by: ["type"],
      _sum: { quantity: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
  ]);

  const totalRevenue30Days = confirmedChallans30Days.reduce((acc, c) => acc + Number(c.totalAmount), 0);
  const totalUnitsMoved30Days = confirmedChallans30Days.reduce((acc, c) => acc + c.totalQuantity, 0);

  return {
    salesOps: {
      totalRevenue30Days,
      confirmedCount30Days: confirmedChallans30Days.length,
      totalUnitsMoved30Days,
      draftChallansCount,
      avgChallanValue: confirmedChallans30Days.length > 0 ? totalRevenue30Days / confirmedChallans30Days.length : 0,
    },
    topProducts: topSellingItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      totalQuantity: item._sum.quantity ?? 0,
      totalRevenue: Number(item._sum.subtotal ?? 0),
    })),
    customerSegments: customerTypeDistribution.map((c) => ({
      type: c.customerType,
      count: c._count,
    })),
    inventoryHealth: stockHealthStats.map((s) => ({
      status: s.stockStatus,
      count: s._count,
    })),
    stockMovementSummary: recentMovementsCount.map((m) => ({
      type: m.type,
      totalQuantity: m._sum.quantity ?? 0,
    })),
  };
}
