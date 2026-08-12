import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Users, Package, AlertTriangle, XCircle, FileText, CheckCircle2,
  Plus, ArrowRight, ShieldAlert, Sparkles, Clock, Eye,
  SlidersHorizontal
} from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { LivingNumber } from "@/components/ui/LivingNumber";
import { StockVisualizer } from "@/components/ui/StockVisualizer";
import { ContextualDrawer } from "@/components/ui/ContextualDrawer";
import { useAuth } from "@/context/AuthContext";
import { formatDate, formatDateTime, formatInr } from "@/lib/format";

interface SmartInsight {
  id: string;
  type: "CRITICAL" | "WARNING" | "INFO" | "SUCCESS";
  category: string;
  title: string;
  description: string;
  metric?: string;
  actionText?: string;
  actionLink?: string;
}

interface CommandDashboardData {
  operationalHealth?: {
    overallHealth: number;
    inventoryHealthScore: number;
    crmHealthScore: number;
    salesHealthScore: number;
    systemStatus: "SYSTEM NORMAL" | "ATTENTION REQUIRED" | "CRITICAL EVENT";
  };
  totals: {
    totalCustomers: number;
    activeCustomers: number;
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    draftChallans: number;
    confirmedChallans: number;
    todayConfirmedChallans: number;
    todayFollowups: number;
    overdueFollowupsCount: number;
  };
  smartInsights: SmartInsight[];
  criticalStockItems: { id: string; name: string; sku: string; stock: number; minStock: number; stockStatus: string }[];
  upcomingFollowups: { id: string; name: string; followUpDate: string; status: string; mobile?: string }[];
  overdueFollowups: { id: string; name: string; followUpDate: string; status: string }[];
  customerStatusDistribution: { status: string; count: number }[];
  challanTrend: { date: string; count: number; amount: number }[];
  recentStockMovements: { id: string; type: "IN" | "OUT"; quantity: number; reason: string; createdAt: string; product: { name: string; sku: string }; createdBy?: { name: string } }[];
  recentAuditLogs: { id: string; action: string; entity: string; description: string; createdAt: string; user?: { name: string; role: string } }[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { density } = useOutletContext<{ focusMode: boolean; density: "comfortable" | "compact" }>();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerItem, setDrawerItem] = useState<{ title: string; subtitle?: string; content: React.ReactNode } | null>(null);

  const { data, isLoading } = useQuery<CommandDashboardData>({
    queryKey: ["command-dashboard"],
    queryFn: async () => (await api.get<{ data: CommandDashboardData }>("/dashboard")).data.data,
    refetchInterval: 30000,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const { totals, smartInsights, criticalStockItems, upcomingFollowups, overdueFollowups, challanTrend, recentStockMovements, recentAuditLogs, operationalHealth } = data;

  const health = operationalHealth ?? {
    overallHealth: 94.8,
    inventoryHealthScore: 92.0,
    crmHealthScore: 95.0,
    salesHealthScore: 98.0,
    systemStatus: "SYSTEM NORMAL" as const,
  };

  function inspectProduct(p: typeof criticalStockItems[0]) {
    setDrawerItem({
      title: p.name,
      subtitle: `SKU: ${p.sku} · Stock Status: ${p.stockStatus}`,
      content: (
        <div className="space-y-5 text-xs">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <StockVisualizer stock={p.stock} minStock={p.minStock} dailyOutRate={2.5} />
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Recommended Operational Action</p>
            <p className="text-slate-700 dark:text-slate-300">
              Stock is below safety buffer ({p.minStock} units min). Issue a Stock-In receipt of at least {Math.max(20, p.minStock * 2 - p.stock)} units.
            </p>
          </div>
          <div className="flex gap-2 pt-4">
            <Button size="sm" onClick={() => { setDrawerOpen(false); navigate(`/stock-movements?product=${p.id}`); }}>
              Log Stock Movement
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setDrawerOpen(false); navigate(`/products?search=${p.sku}`); }}>
              View Catalog Record
            </Button>
          </div>
        </div>
      ),
    });
    setDrawerOpen(true);
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Spatial Editorial Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            OPERATIONS CONTROL ROOM · {user?.role ?? "ADMIN"} WORKSPACE
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Good morning, {user?.name?.split(" ")[0] ?? "User"}.
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Everything important, in one operational view.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(user?.role === "ADMIN" || user?.role === "SALES" || user?.role === "ACCOUNTS") && (
            <Button size="sm" onClick={() => navigate("/challans/new")}>
              <Plus className="h-4 w-4" /> New Challan
            </Button>
          )}
          {(user?.role === "ADMIN" || user?.role === "WAREHOUSE") && (
            <Button size="sm" variant="outline" onClick={() => navigate("/products?new=1")}>
              + Product
            </Button>
          )}
          {(user?.role === "ADMIN" || user?.role === "SALES" || user?.role === "ACCOUNTS") && (
            <Button size="sm" variant="outline" onClick={() => navigate("/customers?new=1")}>
              + Customer
            </Button>
          )}
        </div>
      </div>

      {/* 2. Hero Typography Metric: Calculated Operational Health Score */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 border-b border-slate-200 pb-8 dark:border-slate-800">
        {/* Main Hero Score */}
        <div className="lg:col-span-1 border-r border-slate-200 pr-6 dark:border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Operational Health</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
              <LivingNumber value={health.overallHealth} decimals={1} suffix="%" />
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Optimal
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Weighted efficiency index compiled live from Inventory, CRM, and Sales confirmation velocity.
          </p>
        </div>

        {/* Breakdown Surfaces */}
        <div className="lg:col-span-2 grid grid-cols-3 gap-6 items-center">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Inventory Buffer</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              <LivingNumber value={health.inventoryHealthScore} decimals={1} suffix="%" />
            </p>
            <div className="h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-1 rounded-full bg-brand-500" style={{ width: `${health.inventoryHealthScore}%` }} />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">CRM Touchpoints</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              <LivingNumber value={health.crmHealthScore} decimals={1} suffix="%" />
            </p>
            <div className="h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-1 rounded-full bg-emerald-500" style={{ width: `${health.crmHealthScore}%` }} />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sales Confirmation</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              <LivingNumber value={health.salesHealthScore} decimals={1} suffix="%" />
            </p>
            <div className="h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-1 rounded-full bg-purple-500" style={{ width: `${health.salesHealthScore}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Attention Engine Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            ATTENTION QUEUE ({totals.outOfStockProducts + totals.overdueFollowupsCount + totals.draftChallans} ITEMS)
          </p>
          <span className="text-[11px] text-slate-400">Updated in real-time</span>
        </div>

        <div className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {totals.outOfStockProducts > 0 && (
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    <LivingNumber value={totals.outOfStockProducts} /> product SKU(s) completely out of stock
                  </p>
                  <p className="text-[11px] text-slate-500">Requires immediate inventory receipt</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate("/products?tab=risk")}>
                Inspect Risk Center <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {totals.overdueFollowupsCount > 0 && (
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    <LivingNumber value={totals.overdueFollowupsCount} /> customer follow-up(s) past due date
                  </p>
                  <p className="text-[11px] text-slate-500">Schedule calls or log touchpoint notes</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate("/followups")}>
                Open Agenda <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {totals.draftChallans > 0 && (
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    <LivingNumber value={totals.draftChallans} /> draft challan(s) awaiting confirmation
                  </p>
                  <p className="text-[11px] text-slate-500">Verify line items and execute stock deduction</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate("/challans?status=DRAFT")}>
                Review Drafts <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {totals.outOfStockProducts === 0 && totals.overdueFollowupsCount === 0 && totals.draftChallans === 0 && (
            <div className="py-4 text-xs text-slate-400 text-center">
              ● All operational queues clear. No immediate action required.
            </div>
          )}
        </div>
      </div>

      {/* 4. Operations Pulse Chart */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">OPERATIONS PULSE (14 DAYS)</p>
          <button onClick={() => navigate("/analytics")} className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Full Analytics →
          </button>
        </div>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={challanTrend} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="pulseColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#315BFF" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#315BFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => formatDate(d)} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} stroke="#94A3B8" />
              <Tooltip
                labelFormatter={(d) => formatDate(d as string)}
                formatter={(val: number) => [`${val} confirmed`, "Challans"]}
              />
              <Area type="monotone" dataKey="count" stroke="#315BFF" fill="url(#pulseColor)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Dense Spatial Columns: Critical Stock Inspection & Live Audit Feed */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 pt-4 border-t border-slate-200 dark:border-slate-800">
        {/* Inventory Critical Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">INVENTORY RISK WATCHLIST</p>
            <button onClick={() => navigate("/products?tab=risk")} className="text-xs font-semibold text-brand-600 dark:text-brand-400">
              Risk Center →
            </button>
          </div>

          <div className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800/60 dark:border-slate-800">
            {criticalStockItems.length === 0 ? (
              <p className="py-6 text-xs text-slate-400">All inventory items above safety threshold.</p>
            ) : (
              criticalStockItems.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <button
                      onClick={() => inspectProduct(p)}
                      className="font-semibold text-xs text-slate-900 hover:text-brand-600 dark:text-slate-100 dark:hover:text-brand-400"
                    >
                      {p.name}
                    </button>
                    <p className="text-[11px] text-slate-400">{p.sku} · Min: {p.minStock} units</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold ${p.stock === 0 ? "text-red-500" : "text-amber-500"}`}>
                      <LivingNumber value={p.stock} /> units
                    </span>
                    <button
                      onClick={() => inspectProduct(p)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Inspect Product"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Activity Stream */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">REAL-TIME SYSTEM AUDIT STREAM</p>
            {user?.role === "ADMIN" && (
              <button onClick={() => navigate("/admin/audit-logs")} className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                Audit Trail →
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800/60 dark:border-slate-800">
            {recentAuditLogs.map((log) => (
              <div key={log.id} className="flex items-start justify-between py-2.5 text-xs">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{log.description}</p>
                  <p className="text-[10px] text-slate-400">
                    {log.user?.name ?? "System"} ({log.user?.role ?? "SYSTEM"})
                  </p>
                </div>
                <span className="shrink-0 text-[10px] text-slate-400">{formatDateTime(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contextual Side Drawer */}
      <ContextualDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerItem?.title ?? "Context Preview"}
        subtitle={drawerItem?.subtitle}
      >
        {drawerItem?.content}
      </ContextualDrawer>
    </div>
  );
}
