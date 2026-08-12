import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Plus, ArrowDownCircle, ArrowUpCircle, X, ArrowLeftRight } from "lucide-react";
import toast from "react-hot-toast";
import { api, apiErrorMessage } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { StockMovement, Product, PaginatedResponse } from "@/types";
import { formatDateTime } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";

interface MovementForm {
  productId: string;
  quantity: number;
  type: "IN" | "OUT";
  reason: string;
}

export default function StockMovements() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["stock-movements", page, typeFilter],
    queryFn: async () =>
      (
        await api.get<{ data: PaginatedResponse<StockMovement> }>("/products/stock/movements", {
          params: { page, limit: 10, type: typeFilter || undefined },
        })
      ).data.data,
  });

  const { data: products } = useQuery({
    queryKey: ["products-all"],
    queryFn: async () => (await api.get<{ data: PaginatedResponse<Product> }>("/products", { params: { limit: 100 } })).data.data.items,
    enabled: modalOpen,
  });

  const canWrite = user?.role === "ADMIN" || user?.role === "WAREHOUSE";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Stock Movements</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Every inventory change is logged and auditable.</p>
        </div>
        {canWrite && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Record Movement
          </Button>
        )}
      </div>

      <Card>
        <div className="flex items-center gap-3 border-b border-gray-100 p-4 dark:border-gray-800">
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-44">
            <option value="">All Movements</option>
            <option value="IN">IN only</option>
            <option value="OUT">OUT only</option>
          </Select>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : !data || data.items.length === 0 ? (
          <EmptyState icon={ArrowLeftRight} title="No stock movements yet" description="Movements will appear here as stock changes." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400 dark:border-gray-800">
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">SKU</th>
                  <th className="px-5 py-3 font-medium">Movement</th>
                  <th className="px-5 py-3 font-medium">Quantity</th>
                  <th className="px-5 py-3 font-medium">Reason</th>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 last:border-0 dark:border-gray-800/60">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{m.product.name}</td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{m.product.sku}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${m.type === "IN" ? "text-emerald-600" : "text-red-600"}`}>
                        {m.type === "IN" ? <ArrowDownCircle className="h-3.5 w-3.5" /> : <ArrowUpCircle className="h-3.5 w-3.5" />}
                        {m.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{m.quantity}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{m.reason}</td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{m.createdBy?.name ?? "System"}</td>
                    <td className="px-5 py-3 text-gray-400">{formatDateTime(m.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.total > 0 && (
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={setPage} />
        )}
      </Card>

      {modalOpen && (
        <MovementModal
          products={products ?? []}
          onClose={() => setModalOpen(false)}
          onSaved={() => { refetch(); setModalOpen(false); }}
        />
      )}
    </div>
  );
}

function MovementModal({ products, onClose, onSaved }: { products: Product[]; onClose: () => void; onSaved: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit } = useForm<MovementForm>({ defaultValues: { type: "IN" } });

  async function onSubmit(values: MovementForm) {
    setSubmitting(true);
    try {
      await api.post("/products/stock/movements", { ...values, quantity: Number(values.quantity) });
      toast.success("Stock movement recorded successfully.");
      onSaved();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Unable to confirm challan."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Record Stock Movement</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5">
          <Select label="Product" required {...register("productId", { required: true })}>
            <option value="">Select a product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.sku}) — stock: {p.stock}</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" {...register("type")}>
              <option value="IN">IN (stock received)</option>
              <option value="OUT">OUT (stock removed)</option>
            </Select>
            <Input label="Quantity" type="number" min={1} required {...register("quantity", { required: true, min: 1 })} />
          </div>
          <Input label="Reason" required placeholder="e.g. Supplier delivery, damage write-off" {...register("reason", { required: true })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={submitting}>Record Movement</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
