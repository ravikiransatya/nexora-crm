import { useMemo } from "react";

interface StockVisualizerProps {
  stock: number;
  minStock: number;
  dailyOutRate?: number;
  compact?: boolean;
}

export function StockVisualizer({
  stock,
  minStock,
  dailyOutRate = 0,
  compact = false,
}: StockVisualizerProps) {
  const maxCap = Math.max(stock, minStock * 2.5, 100);
  const percentage = Math.min(100, Math.max(0, (stock / maxCap) * 100));

  const daysRemaining = useMemo(() => {
    if (stock <= 0) return 0;
    if (!dailyOutRate || dailyOutRate <= 0) return 99;
    return Math.round((stock / dailyOutRate) * 10) / 10;
  }, [stock, dailyOutRate]);

  const tone = stock === 0 ? "red" : stock <= minStock ? "amber" : "emerald";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="font-semibold text-slate-900 dark:text-slate-100">{stock} units</span>
        {!compact && (
          <span className="text-[10px] text-slate-400">
            {stock === 0
              ? "STOCKED OUT"
              : daysRemaining > 90
              ? ">90d coverage"
              : `${daysRemaining}d est. coverage`}
          </span>
        )}
      </div>

      {/* Precision 1px thin stock progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            tone === "red"
              ? "bg-red-500"
              : tone === "amber"
              ? "bg-amber-500"
              : "bg-emerald-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
