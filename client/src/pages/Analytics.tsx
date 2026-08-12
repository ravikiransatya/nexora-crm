import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, Package, Users, DollarSign, ArrowUpRight, BarChart2 } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatInr } from "@/lib/format";

interface AnalyticsData {
  salesOps: {
    totalRevenue30Days: number;
    confirmedCount30Days: number;
    totalUnitsMoved30Days: number;
    draftChallansCount: number;
    avgChallanValue: number;
  };
  topProducts: {
    productId: string;
    productName: string;
    sku: string;
    totalQuantity: number;
    totalRevenue: number;
  }[];
  customerSegments: { type: string; count: number }[];
  inventoryHealth: { status: string; count: number }[];
  stockMovementSummary: { type: string; totalQuantity: number }[];
}

const SEGMENT_COLORS: Record<string, string> = {
  RETAIL: "#3b82f6",
  WHOLESALE: "#10b981",
  DISTRIBUTOR: "#8b5cf6",
};

export default function Analytics() {
  const { data, isLoading, isError, refetch } = useQuery<AnalyticsData>({
    queryKey: ["executive-analytics"],
    queryFn: async () => (await api.get<{ data: AnalyticsData }>("/analytics")).data.data,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardBody><Skeleton className="h-16 w-full" /></CardBody></Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Unable to load analytics metrics.
        </p>
        <button
          onClick={() => refetch()}
          className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  const { salesOps, topProducts, customerSegments, inventoryHealth } = data;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-brand-500" />
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Executive Analytics & Operations Intelligence
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          30-day transactional performance metrics derived directly from database records.
        </p>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">30-Day Confirmed Revenue</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {formatInr(salesOps.totalRevenue30Days)}
              </p>
              <p className="text-[11px] text-emerald-500 font-medium mt-0.5">Realized billing</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Avg Challan Value</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {formatInr(salesOps.avgChallanValue)}
              </p>
              <p className="text-[11px] text-brand-500 font-medium mt-0.5">Per order metric</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Units Dispatched (30d)</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {salesOps.totalUnitsMoved30Days} units
              </p>
              <p className="text-[11px] text-purple-500 font-medium mt-0.5">Inventory turnover</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <Package className="h-5 w-5" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Draft Challans Pending</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {salesOps.draftChallansCount}
              </p>
              <p className="text-[11px] text-amber-500 font-medium mt-0.5">Unconfirmed orders</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <Users className="h-5 w-5" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Top Products Bar Chart & Customer Segmentation Pie Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Top 5 Selling Products by Quantity (30 Days)
            </h2>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topProducts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="sku" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(val: number) => [`${val} units`, "Units Sold"]}
                  labelFormatter={(sku) => {
                    const p = topProducts.find((x) => x.sku === sku);
                    return p ? `${p.productName} (${sku})` : sku;
                  }}
                />
                <Bar dataKey="totalQuantity" fill="#3B5BFF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Customer Segment Distribution
            </h2>
          </CardHeader>
          <CardBody className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={customerSegments} dataKey="count" nameKey="type" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {customerSegments.map((entry) => (
                    <Cell key={entry.type} fill={SEGMENT_COLORS[entry.type] ?? "#9ca3af"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
              {customerSegments.map((s) => (
                <div key={s.type} className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[s.type] ?? "#9ca3af" }} />
                  {s.type} ({s.count})
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
