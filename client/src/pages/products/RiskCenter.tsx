import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, XCircle, CheckCircle2, RefreshCw, ShoppingCart, ArrowRight, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StockVisualizer } from "@/components/ui/StockVisualizer";

interface RiskItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
  stockStatus: string;
  riskLevel: "CRITICAL" | "WARNING" | "HEALTHY";
  deficit: number;
  daysRemaining: number;
  dailyOutRate: number;
  recommendedAction: string;
  category?: { name: string };
  warehouse?: { name: string };
}

interface RiskCenterData {
  summary: {
    criticalCount: number;
    warningCount: number;
    healthyCount: number;
    totalCount: number;
  };
  critical: RiskItem[];
  warning: RiskItem[];
  healthy: RiskItem[];
}

export default function RiskCenter() {
  const [activeTab, setActiveTab] = useState<"CRITICAL" | "WARNING" | "HEALTHY">("CRITICAL");
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useQuery<RiskCenterData>({
    queryKey: ["inventory-risk-center"],
    queryFn: async () => (await api.get<{ data: RiskCenterData }>("/products/risk/center")).data.data,
  });

  if (isLoading || !data) return <TableSkeleton />;

  const { summary, critical, warning, healthy } = data;
  const currentList = activeTab === "CRITICAL" ? critical : activeTab === "WARNING" ? warning : healthy;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Inventory Risk Command Center
            </h1>
            <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
              {summary.criticalCount} Critical Action Required
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time stockout risk analysis & 30-day movement velocity forecasting.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Analysis
        </Button>
      </div>

      {/* Metric Surfaces */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setActiveTab("CRITICAL")}
          className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
            activeTab === "CRITICAL"
              ? "border-red-500 bg-red-50/50 ring-2 ring-red-500/20 dark:border-red-400 dark:bg-red-950/20"
              : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Critical (Stockout)</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summary.criticalCount}</p>
            <p className="text-[11px] text-slate-500">Zero available stock</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("WARNING")}
          className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
            activeTab === "WARNING"
              ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 dark:border-amber-400 dark:bg-amber-950/20"
              : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Warning (Below Min)</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summary.warningCount}</p>
            <p className="text-[11px] text-slate-500">Below safety buffer</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("HEALTHY")}
          className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
            activeTab === "HEALTHY"
              ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 dark:border-emerald-400 dark:bg-emerald-950/20"
              : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Healthy Buffer</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summary.healthyCount}</p>
            <p className="text-[11px] text-slate-500">Optimal stock levels</p>
          </div>
        </button>
      </div>

      {/* Luminous Table Surface */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-brand-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              {activeTab} Category ({currentList.length} Items)
            </h2>
          </div>
          <Button size="sm" onClick={() => navigate("/stock-movements")}>
            <ShoppingCart className="h-3.5 w-3.5" /> Log Stock Receipt
          </Button>
        </div>

        {currentList.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No products currently categorized in this risk tier.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950/50">
                  <th className="px-5 py-3 font-semibold">Product & SKU</th>
                  <th className="px-5 py-3 font-semibold w-48">Stock Visualization</th>
                  <th className="px-5 py-3 font-semibold">Min Stock</th>
                  <th className="px-5 py-3 font-semibold">Deficit</th>
                  <th className="px-5 py-3 font-semibold">Forecast Action</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {currentList.map((p) => (
                  <tr key={p.id} className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                      <div>{p.name}</div>
                      <div className="text-[11px] text-slate-400">{p.sku} {p.warehouse ? `· ${p.warehouse.name}` : ""}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StockVisualizer stock={p.stock} minStock={p.minStock} dailyOutRate={p.dailyOutRate} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{p.minStock} units</td>
                    <td className="px-5 py-3.5 font-semibold text-red-600 dark:text-red-400">
                      {p.deficit > 0 ? `-${p.deficit} units` : "0"}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={p.riskLevel === "CRITICAL" ? "red" : p.riskLevel === "WARNING" ? "amber" : "green"}>
                        {p.recommendedAction}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/stock-movements?product=${p.id}`)}
                      >
                        Restock <ArrowRight className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
