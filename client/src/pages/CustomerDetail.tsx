import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Edit2, Phone, Mail, Building2, MapPin, Hash, Plus,
  DollarSign, ShoppingBag, CheckCircle2, Clock, Calendar, Activity
} from "lucide-react";
import toast from "react-hot-toast";
import { api, apiErrorMessage } from "@/lib/api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate, formatDateTime, formatInr } from "@/lib/format";
import { CustomerFormModal } from "./customers/CustomerFormModal";

interface Customer360Data {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  businessName?: string | null;
  gstNumber?: string | null;
  customerType: string;
  address?: string | null;
  status: string;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalChallans: number;
    confirmedChallans: number;
    totalSpend: number;
    draftChallans: number;
    draftValue: number;
  };
  followups?: { id: string; note: string; createdAt: string; createdBy?: { name: string } }[];
  challans?: { id: string; challanNumber: string; status: string; totalQuantity: number; totalAmount: number; createdAt: string; createdBy?: { name: string } }[];
  auditLogs?: { id: string; action: string; description: string; createdAt: string; user?: { name: string } }[];
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [note, setNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  const { data: customer, isLoading } = useQuery<Customer360Data>({
    queryKey: ["customer", id],
    queryFn: async () => (await api.get<{ data: Customer360Data }>(`/customers/${id}`)).data.data,
    enabled: !!id,
  });

  async function addFollowup() {
    if (!note.trim()) return;
    setSubmittingNote(true);
    try {
      await api.post(`/customers/${id}/followups`, { note });
      setNote("");
      toast.success("Follow-up note added.");
      queryClient.invalidateQueries({ queryKey: ["customer", id] });
    } catch (err) {
      toast.error(apiErrorMessage(err, "Unable to add follow-up"));
    } finally {
      setSubmittingNote(false);
    }
  }

  if (isLoading || !customer) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const stats = customer.stats ?? {
    totalChallans: 0,
    confirmedChallans: 0,
    totalSpend: 0,
    draftChallans: 0,
    draftValue: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/customers")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{customer.name}</h1>
              <Badge tone={statusTone(customer.status)}>{customer.status}</Badge>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {customer.customerType}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {customer.businessName ? `${customer.businessName} · ` : ""}Customer 360 CRM Hub
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Edit2 className="h-3.5 w-3.5" /> Edit Profile
          </Button>
          <Button size="sm" onClick={() => navigate(`/challans/new?customer=${customer.id}`)}>
            <Plus className="h-3.5 w-3.5" /> Create Challan
          </Button>
        </div>
      </div>

      {/* Business Statistics Banner */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatInr(stats.totalSpend)}</p>
              <p className="text-xs text-slate-500">Total Realized Billing</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats.totalChallans}</p>
              <p className="text-xs text-slate-500">Total Challans Created</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats.confirmedChallans}</p>
              <p className="text-xs text-slate-500">Confirmed Orders</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatInr(stats.draftValue)}</p>
              <p className="text-xs text-slate-500">Draft Value ({stats.draftChallans} Pending)</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Main 360 Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Contact & Business Details */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader><h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Contact Details</h2></CardHeader>
            <CardBody className="space-y-3.5 text-xs">
              <InfoRow icon={Phone} label="Mobile Phone" value={customer.mobile} />
              <InfoRow icon={Mail} label="Email Address" value={customer.email || "—"} />
              <InfoRow icon={MapPin} label="Delivery / Billing Address" value={customer.address || "—"} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Business Profile</h2></CardHeader>
            <CardBody className="space-y-3.5 text-xs">
              <InfoRow icon={Building2} label="Business Name" value={customer.businessName || "Individual Customer"} />
              <InfoRow icon={Hash} label="GSTIN Number" value={customer.gstNumber || "Not Provided"} />
              <InfoRow icon={Hash} label="Customer Segment" value={customer.customerType} />
              <InfoRow icon={Calendar} label="Next Scheduled Follow-up" value={customer.followUpDate ? formatDate(customer.followUpDate) : "None scheduled"} />
            </CardBody>
          </Card>

          {customer.notes && (
            <Card>
              <CardHeader><h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Account Notes</h2></CardHeader>
              <CardBody className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{customer.notes}</CardBody>
            </Card>
          )}
        </div>

        {/* Right Column: Follow-up Timeline & Challan History */}
        <div className="space-y-6 lg:col-span-2">
          {/* CRM Follow-up Timeline */}
          <Card>
            <CardHeader><h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">CRM Interaction Timeline</h2></CardHeader>
            <CardBody className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Log a customer call, meeting notes, or follow-up update…"
                  className="min-h-[60px] flex-1 text-xs"
                />
                <Button onClick={addFollowup} loading={submittingNote} className="self-end" size="sm">
                  <Plus className="h-4 w-4" /> Add Note
                </Button>
              </div>

              {(!customer.followups || customer.followups.length === 0) ? (
                <p className="py-6 text-center text-xs text-slate-400">No interaction notes recorded yet.</p>
              ) : (
                <ol className="relative space-y-4 border-l border-slate-200 pl-4 dark:border-slate-800">
                  {customer.followups.map((f) => (
                    <li key={f.id} className="relative">
                      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-white dark:ring-slate-900" />
                      <p className="text-xs text-slate-800 dark:text-slate-200">{f.note}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {formatDateTime(f.createdAt)} {f.createdBy && `· ${f.createdBy.name}`}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>

          {/* Challans History Table */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Challan & Order History</h2>
              <Button size="sm" variant="outline" onClick={() => navigate(`/challans/new?customer=${customer.id}`)}>
                + New Challan
              </Button>
            </CardHeader>
            <CardBody className="p-0">
              {(!customer.challans || customer.challans.length === 0) ? (
                <p className="py-8 text-center text-xs text-slate-400">No sales challans created for this customer.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950/50">
                        <th className="px-4 py-3 font-semibold">Challan #</th>
                        <th className="px-4 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold">Qty</th>
                        <th className="px-4 py-3 font-semibold">Total Amount</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {customer.challans.map((c) => (
                        <tr
                          key={c.id}
                          onClick={() => navigate(`/challans/${c.id}`)}
                          className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <td className="px-4 py-3 font-semibold text-brand-600 dark:text-brand-400">{c.challanNumber}</td>
                          <td className="px-4 py-3 text-slate-500">{formatDate(c.createdAt)}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{c.totalQuantity} items</td>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{formatInr(c.totalAmount)}</td>
                          <td className="px-4 py-3"><Badge tone={statusTone(c.status)}>{c.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Customer Activity Audit Feed */}
          {customer.auditLogs && customer.auditLogs.length > 0 && (
            <Card>
              <CardHeader className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-brand-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Customer Activity Audit Feed</h2>
              </CardHeader>
              <CardBody className="space-y-3">
                {customer.auditLogs.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-xs border-b border-slate-100 pb-2 last:border-0 dark:border-slate-800">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{a.description}</p>
                      <p className="text-[10px] text-slate-400">{a.user?.name ?? "System"}</p>
                    </div>
                    <span className="text-[10px] text-slate-400">{formatDateTime(a.createdAt)}</span>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <CustomerFormModal
        open={editOpen}
        customer={customer as any}
        onClose={() => setEditOpen(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["customer", id] })}
      />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
      <div>
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="font-medium text-slate-800 dark:text-slate-200">{value}</p>
      </div>
    </div>
  );
}
