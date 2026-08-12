import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Package, ShieldAlert, ListFilter } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Product, PaginatedResponse } from "@/types";
import { formatInr } from "@/lib/format";
import { ProductFormModal } from "./products/ProductFormModal";
import RiskCenter from "./products/RiskCenter";

export default function Products() {
  const [params, setParams] = useSearchParams();
  const page = parseInt(params.get("page") ?? "1", 10);
  const activeTab = params.get("tab") === "risk" ? "risk" : "catalog";

  const [search, setSearch] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(params.get("new") === "1");
  const [editing, setEditing] = useState<Product | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["products", page, search, stockStatus],
    queryFn: async () =>
      (
        await api.get<{ data: PaginatedResponse<Product> }>("/products", {
          params: { page, limit: 10, search: search || undefined, stockStatus: stockStatus || undefined },
        })
      ).data.data,
    enabled: activeTab === "catalog",
  });

  function updateTab(t: "catalog" | "risk") {
    if (t === "risk") params.set("tab", "risk");
    else params.delete("tab");
    setParams(params);
  }

  function updatePage(p: number) {
    params.set("page", String(p));
    setParams(params);
  }

  return (
    <div className="space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => updateTab("catalog")}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === "catalog"
                  ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" /> Product Catalog
            </button>
            <button
              onClick={() => updateTab("risk")}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === "risk"
                  ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5 text-red-500" /> Inventory Risk Center
            </button>
          </div>
        </div>

        {activeTab === "catalog" && (
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus className="h-4 w-4" /> New Product
          </Button>
        )}
      </div>

      {activeTab === "risk" ? (
        <RiskCenter />
      ) : (
        <>
          <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4 dark:border-gray-800">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU…"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <Select value={stockStatus} onChange={(e) => setStockStatus(e.target.value)} className="w-44">
            <option value="">All Stock Status</option>
            <option value="HEALTHY">Healthy</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </Select>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products match your filters"
            description="Try a different search, or add a new product."
            actionLabel="Add Product"
            onAction={() => setModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400 dark:border-gray-800">
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">SKU</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Unit Price</th>
                  <th className="px-5 py-3 font-medium">Stock</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => { setEditing(p); setModalOpen(true); }}
                    className="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50 dark:border-gray-800/60 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{p.name}</td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{p.sku}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{p.category?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{formatInr(p.unitPrice)}</td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{p.stock}</td>
                    <td className="px-5 py-3"><Badge tone={statusTone(p.stockStatus)}>{p.stockStatus.replace("_", " ")}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.total > 0 && (
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={updatePage} />
        )}
      </Card>

      <ProductFormModal
        open={modalOpen}
        product={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSaved={refetch}
      />
        </>
      )}
    </div>
  );
}
