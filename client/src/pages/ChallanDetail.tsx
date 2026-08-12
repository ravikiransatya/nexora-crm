import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { api, apiErrorMessage } from "@/lib/api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, statusTone } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { Challan } from "@/types";
import { formatDate, formatDateTime, formatInr } from "@/lib/format";

export default function ChallanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmDialog, setConfirmDialog] = useState<"confirm" | "cancel" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { data: challan, isLoading } = useQuery({
    queryKey: ["challan", id],
    queryFn: async () => (await api.get<{ data: Challan }>(`/challans/${id}`)).data.data,
    enabled: !!id,
  });

  async function handleConfirm() {
    setActionLoading(true);
    try {
      await api.post(`/challans/${id}/confirm`);
      toast.success("Challan confirmed and stock updated.");
      queryClient.invalidateQueries({ queryKey: ["challan", id] });
    } catch (err) {
      toast.error(apiErrorMessage(err, "Unable to confirm challan."));
    } finally {
      setActionLoading(false);
      setConfirmDialog(null);
    }
  }

  async function handleCancel() {
    setActionLoading(true);
    try {
      await api.post(`/challans/${id}/cancel`);
      toast.success("Challan cancelled.");
      queryClient.invalidateQueries({ queryKey: ["challan", id] });
    } catch (err) {
      toast.error(apiErrorMessage(err, "Unable to cancel challan."));
    } finally {
      setActionLoading(false);
      setConfirmDialog(null);
    }
  }

  async function downloadPdf() {
    const res = await api.get(`/challans/${id}/pdf`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${challan?.challanNumber ?? "challan"}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  if (isLoading || !challan) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/challans")} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{challan.challanNumber}</h1>
              <Badge tone={statusTone(challan.status)}>{challan.status}</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Created {formatDate(challan.createdAt)} {challan.createdBy && `by ${challan.createdBy.name}`}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadPdf}>
            <Download className="h-3.5 w-3.5" /> Download PDF
          </Button>
          {challan.status === "DRAFT" && (
            <Button size="sm" onClick={() => setConfirmDialog("confirm")}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Confirm
            </Button>
          )}
          {challan.status !== "CANCELLED" && (
            <Button size="sm" variant="danger" onClick={() => setConfirmDialog("cancel")}>
              <XCircle className="h-3.5 w-3.5" /> Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><h2 className="text-sm font-semibold">Customer</h2></CardHeader>
          <CardBody className="space-y-1 text-sm">
            <p className="font-medium text-gray-900 dark:text-gray-100">{challan.customer.name}</p>
            {challan.customer.businessName && <p className="text-gray-500 dark:text-gray-400">{challan.customer.businessName}</p>}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><h2 className="text-sm font-semibold">Summary</h2></CardHeader>
          <CardBody className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400">Total Quantity</p>
              <p className="font-semibold text-gray-800 dark:text-gray-200">{challan.totalQuantity}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Amount</p>
              <p className="font-semibold text-gray-800 dark:text-gray-200">{formatInr(challan.totalAmount)}</p>
            </div>
            {challan.confirmedAt && (
              <div>
                <p className="text-xs text-gray-400">Confirmed At</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{formatDateTime(challan.confirmedAt)}</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Line Items ({challan.items.length})</h2></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 uppercase tracking-wider text-slate-400 dark:border-slate-800">
                  <th className="px-4 py-3 font-semibold">SKU</th>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Qty</th>
                  <th className="px-4 py-3 font-semibold">Unit Price</th>
                  <th className="px-4 py-3 font-semibold text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {challan.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-slate-400 font-mono">{item.sku}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{item.productName}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">{item.quantity}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatInr(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">{formatInr(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Business Event Timeline */}
        <Card className="lg:col-span-1">
          <CardHeader><h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Business Event Timeline</h2></CardHeader>
          <CardBody className="space-y-4 text-xs">
            <ol className="relative space-y-4 border-l border-slate-200 pl-4 dark:border-slate-800">
              <li className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <p className="font-semibold text-slate-800 dark:text-slate-200">Challan Draft Created</p>
                <p className="text-[11px] text-slate-400">{formatDateTime(challan.createdAt)} · {challan.createdBy?.name ?? "System"}</p>
              </li>

              {challan.status === "CONFIRMED" && (
                <>
                  <li className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">Challan Confirmed & Stock Deducted</p>
                    <p className="text-[11px] text-slate-400">{formatDateTime(challan.confirmedAt ?? challan.createdAt)}</p>
                  </li>
                  <li className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Stock Movement & Audit Log Recorded</p>
                    <p className="text-[11px] text-slate-400">{formatDateTime(challan.confirmedAt ?? challan.createdAt)}</p>
                  </li>
                </>
              )}

              {challan.status === "CANCELLED" && (
                <li className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                  <p className="font-semibold text-red-600 dark:text-red-400">Challan Cancelled & Stock Reversed</p>
                </li>
              )}
            </ol>
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDialog === "confirm"}
        title="Confirm this challan?"
        description="Stock will be deducted for every line item. This cannot be undone if stock runs out for other orders."
        confirmLabel="Confirm Challan"
        loading={actionLoading}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
      <ConfirmDialog
        open={confirmDialog === "cancel"}
        title="Cancel this challan?"
        description={challan.status === "CONFIRMED" ? "Stock will be reversed back into inventory." : "This draft will be marked as cancelled."}
        confirmLabel="Cancel Challan"
        danger
        loading={actionLoading}
        onConfirm={handleCancel}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
}
