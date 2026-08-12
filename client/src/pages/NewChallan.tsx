import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Plus, Trash2, AlertTriangle, CheckCircle2, User, Package,
  Receipt, ArrowRight, ShieldCheck, FileCheck
} from "lucide-react";
import toast from "react-hot-toast";
import { api, apiErrorMessage } from "@/lib/api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select, Input } from "@/components/ui/Field";
import { Customer, Product, PaginatedResponse } from "@/types";
import { formatInr } from "@/lib/format";

interface LineItem {
  productId: string;
  quantity: number;
}

export default function NewChallan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCustomer = searchParams.get("customer") ?? "";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [customerId, setCustomerId] = useState(initialCustomer);
  const [items, setItems] = useState<LineItem[]>([{ productId: "", quantity: 1 }]);
  const [submitting, setSubmitting] = useState<"draft" | "confirm" | null>(null);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-all-wizard"],
    queryFn: async () => (await api.get<{ data: PaginatedResponse<Customer> }>("/customers", { params: { limit: 100 } })).data.data.items,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-all-challan-wizard"],
    queryFn: async () => (await api.get<{ data: PaginatedResponse<Product> }>("/products", { params: { limit: 100 } })).data.data.items,
  });

  const selectedCustomer = useMemo(() => customers.find((c) => c.id === customerId), [customers, customerId]);
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const validItems = items.filter((i) => i.productId && i.quantity > 0);
  const totalQuantity = validItems.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const totalAmount = validItems.reduce((sum, i) => {
    const p = productMap.get(i.productId);
    return sum + (p ? Number(p.unitPrice) * (i.quantity || 0) : 0);
  }, 0);

  const hasStockWarning = validItems.some((i) => {
    const p = productMap.get(i.productId);
    return p && i.quantity > p.stock;
  });

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, { productId: "", quantity: 1 }]);
  }
  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveChallan(confirmAfter: boolean) {
    if (!customerId) return toast.error("Please select a customer first");
    if (validItems.length === 0) return toast.error("Add at least one product line item");

    setSubmitting(confirmAfter ? "confirm" : "draft");
    try {
      const res = await api.post("/challans", { customerId, items: validItems });
      const challanId = res.data.data.id;
      toast.success("Sales Challan created as Draft.");

      if (confirmAfter) {
        try {
          await api.post(`/challans/${challanId}/confirm`);
          toast.success("Challan confirmed! Stock deducted in database transaction.");
        } catch (err) {
          toast.error(apiErrorMessage(err, "Draft saved, but confirmation failed due to stock limits."));
        }
      }
      navigate(`/challans/${challanId}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Unable to save sales challan"));
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/challans")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Sales Challan Creation Wizard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Multi-step guided workflow with transactional stock impact verification.
          </p>
        </div>
      </div>

      {/* Wizard Step Progress Bar */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition ${
            step === 1
              ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 dark:border-brand-400 dark:bg-brand-950/30"
              : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
            step >= 1 ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-400"
          }`}>
            1
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Select Customer</p>
            <p className="text-[11px] text-slate-400 truncate">{selectedCustomer ? selectedCustomer.name : "Step 1"}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => customerId && setStep(2)}
          disabled={!customerId}
          className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition ${
            step === 2
              ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 dark:border-brand-400 dark:bg-brand-950/30"
              : "border-slate-200 bg-white disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
            step >= 2 ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-400"
          }`}>
            2
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Line Items & Stock</p>
            <p className="text-[11px] text-slate-400 truncate">{validItems.length} Product(s)</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => customerId && validItems.length > 0 && setStep(3)}
          disabled={!customerId || validItems.length === 0}
          className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition ${
            step === 3
              ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 dark:border-brand-400 dark:bg-brand-950/30"
              : "border-slate-200 bg-white disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
            step === 3 ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-400"
          }`}>
            3
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Review & Confirm</p>
            <p className="text-[11px] text-slate-400 truncate">Stock impact verification</p>
          </div>
        </button>
      </div>

      {/* STEP 1: CUSTOMER SELECTION */}
      {step === 1 && (
        <Card>
          <CardHeader className="flex items-center gap-2">
            <User className="h-4 w-4 text-brand-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Step 1: Choose Customer Account</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              label="Customer Account"
              required
            >
              <option value="">Select a customer from database…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.businessName ? `— (${c.businessName})` : ""} [{c.customerType}]
                </option>
              ))}
            </Select>

            {selectedCustomer && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs dark:border-slate-800 dark:bg-slate-950/40">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <p className="text-slate-400">Customer Name</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Mobile Phone</p>
                    <p className="font-medium text-slate-700 dark:text-slate-300">{selectedCustomer.mobile}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">GSTIN Number</p>
                    <p className="font-medium text-slate-700 dark:text-slate-300">{selectedCustomer.gstNumber || "Unregistered"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Account Type</p>
                    <p className="font-medium text-slate-700 dark:text-slate-300">{selectedCustomer.customerType}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button disabled={!customerId} onClick={() => setStep(2)}>
                Continue to Line Items <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* STEP 2: PRODUCT LINE ITEMS */}
      {step === 2 && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Step 2: Add Product Line Items</h2>
            </div>
            <Button size="sm" variant="outline" onClick={addItem}>
              <Plus className="h-3.5 w-3.5" /> Add Product
            </Button>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-3">
              {items.map((item, idx) => {
                const product = productMap.get(item.productId);
                const isInsufficient = product && item.quantity > product.stock;
                return (
                  <div key={idx} className="grid grid-cols-12 items-end gap-3 rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
                    <div className="col-span-12 sm:col-span-5">
                      <Select
                        label="Product"
                        value={item.productId}
                        onChange={(e) => updateItem(idx, { productId: e.target.value })}
                      >
                        <option value="">Select product…</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku}) — Available: {p.stock}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="col-span-6 sm:col-span-2">
                      <Input
                        label="Quantity"
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, { quantity: parseInt(e.target.value || "0", 10) })}
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-2 text-xs">
                      <p className="text-slate-400">Unit Price</p>
                      <p className="py-2.5 font-medium text-slate-800 dark:text-slate-200">
                        {product ? formatInr(product.unitPrice) : "—"}
                      </p>
                    </div>

                    <div className="col-span-10 sm:col-span-2 text-xs">
                      <p className="text-slate-400">Subtotal</p>
                      <p className="py-2.5 font-semibold text-slate-900 dark:text-slate-100">
                        {product ? formatInr(Number(product.unitPrice) * item.quantity) : "—"}
                      </p>
                    </div>

                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {isInsufficient && (
                      <div className="col-span-12 flex items-center gap-1.5 rounded-lg bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        Requested {item.quantity} units, but only {product?.stock} available in stock. Confirmation will fail unless restocked.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button disabled={validItems.length === 0} onClick={() => setStep(3)}>
                Review & Stock Impact <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* STEP 3: REVIEW & STOCK IMPACT PREVIEW */}
      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Step 3: Pre-Transaction Review & Stock Impact
                </h2>
              </div>
              <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold text-brand-600 dark:text-brand-400">
                Customer: {selectedCustomer?.name}
              </span>
            </CardHeader>
            <CardBody className="space-y-5">
              {/* Stock Impact Table */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Real-time Stock Deduction Impact Preview
                </p>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950/50">
                        <th className="px-4 py-3 font-semibold">Product</th>
                        <th className="px-4 py-3 font-semibold">SKU</th>
                        <th className="px-4 py-3 font-semibold">Current Stock</th>
                        <th className="px-4 py-3 font-semibold">Deduction</th>
                        <th className="px-4 py-3 font-semibold">Stock After Confirmation</th>
                        <th className="px-4 py-3 font-semibold text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {validItems.map((i, idx) => {
                        const p = productMap.get(i.productId);
                        const initialStock = p?.stock ?? 0;
                        const finalStock = initialStock - i.quantity;
                        const subtotal = (Number(p?.unitPrice) || 0) * i.quantity;
                        return (
                          <tr key={idx}>
                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{p?.name}</td>
                            <td className="px-4 py-3 text-slate-400">{p?.sku}</td>
                            <td className="px-4 py-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                              {initialStock} → <span className={finalStock < 0 ? "text-red-500 font-bold" : "text-emerald-600 dark:text-emerald-400"}>{finalStock}</span> units
                            </td>
                            <td className="px-4 py-3 font-bold text-red-500">-{i.quantity} units</td>
                            <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                              {finalStock < 0 ? (
                                <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                                  INSUFFICIENT STOCK
                                </span>
                              ) : (
                                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                  VALID TRANSACTION
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                              {formatInr(subtotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {hasStockWarning && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  One or more items exceed current stock. Saving as **Draft** will succeed, but **Confirm** will be rejected by database row-locking verification.
                </div>
              )}

              {/* Totals Breakdown */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-950/50">
                <div className="flex gap-6 text-xs">
                  <div>
                    <p className="text-slate-400">Total Quantity</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{totalQuantity} items</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Grand Total Amount</p>
                    <p className="text-base font-bold text-brand-600 dark:text-brand-400">{formatInr(totalAmount)}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)}>Back to Edit</Button>
                  <Button
                    variant="outline"
                    loading={submitting === "draft"}
                    onClick={() => saveChallan(false)}
                  >
                    Save as Draft Only
                  </Button>
                  <Button
                    loading={submitting === "confirm"}
                    onClick={() => saveChallan(true)}
                  >
                    <ShieldCheck className="h-4 w-4" /> Save & Confirm Now
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
