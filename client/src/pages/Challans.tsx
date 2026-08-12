import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Receipt } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Challan, PaginatedResponse } from "@/types";
import { formatDate, formatInr } from "@/lib/format";

export default function Challans() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const page = parseInt(params.get("page") ?? "1", 10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["challans", page, search, status],
    queryFn: async () =>
      (
        await api.get<{ data: PaginatedResponse<Challan> }>("/challans", {
          params: { page, limit: 10, search: search || undefined, status: status || undefined },
        })
      ).data.data,
  });

  function updatePage(p: number) {
    params.set("page", String(p));
    setParams(params);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Sales Challans</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Create, confirm, and track outgoing sales challans.</p>
        </div>
        <Button onClick={() => navigate("/challans/new")}>
          <Plus className="h-4 w-4" /> New Challan
        </Button>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4 dark:border-gray-800">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by challan number or customer…"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No challans found"
            description="Create your first sales challan to get started."
            actionLabel="New Challan"
            onAction={() => navigate("/challans/new")}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400 dark:border-gray-800">
                  <th className="px-5 py-3 font-medium">Challan #</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Total Qty</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/challans/${c.id}`)}
                    className="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50 dark:border-gray-800/60 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{c.challanNumber}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{c.customer.name}</td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{c.totalQuantity}</td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{formatInr(c.totalAmount)}</td>
                    <td className="px-5 py-3"><Badge tone={statusTone(c.status)}>{c.status}</Badge></td>
                    <td className="px-5 py-3 text-gray-400">{formatDate(c.createdAt)}</td>
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
    </div>
  );
}
