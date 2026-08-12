import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Users } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Customer, PaginatedResponse } from "@/types";
import { CustomerFormModal } from "./customers/CustomerFormModal";

export default function Customers() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const page = parseInt(params.get("page") ?? "1", 10);
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [customerType, setCustomerType] = useState(params.get("customerType") ?? "");
  const [modalOpen, setModalOpen] = useState(params.get("new") === "1");
  const [editing, setEditing] = useState<Customer | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["customers", page, search, status, customerType],
    queryFn: async () =>
      (
        await api.get<{ data: PaginatedResponse<Customer> }>("/customers", {
          params: { page, limit: 10, search: search || undefined, status: status || undefined, customerType: customerType || undefined },
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
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Customers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your CRM pipeline and customer relationships.</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4" /> New Customer
        </Button>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4 dark:border-gray-800">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, mobile, business…"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
            <option value="">All Statuses</option>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
          <Select value={customerType} onChange={(e) => setCustomerType(e.target.value)} className="w-44">
            <option value="">All Types</option>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </Select>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers found"
            description="Try adjusting your filters, or add your first customer."
            actionLabel="Add Customer"
            onAction={() => setModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400 dark:border-gray-800">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Mobile</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/customers/${c.id}`)}
                    className="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50 dark:border-gray-800/60 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
                      {c.businessName && <p className="text-xs text-gray-400">{c.businessName}</p>}
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{c.mobile}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{c.customerType}</td>
                    <td className="px-5 py-3"><Badge tone={statusTone(c.status)}>{c.status}</Badge></td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                      {c.followUpDate ? new Date(c.followUpDate).toLocaleDateString("en-IN") : "—"}
                    </td>
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

      <CustomerFormModal
        open={modalOpen}
        customer={editing}
        onClose={() => setModalOpen(false)}
        onSaved={refetch}
      />
    </div>
  );
}
