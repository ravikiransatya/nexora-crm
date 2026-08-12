import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Calendar, CheckCircle2, User, Phone, ArrowRight, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, statusTone } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/format";

interface CustomerFollowupItem {
  id: string;
  name: string;
  mobile: string;
  businessName?: string | null;
  status: string;
  customerType: string;
  followUpDate: string;
  notes?: string | null;
}

export default function FollowupCenter() {
  const [filter, setFilter] = useState<"OVERDUE" | "TODAY" | "UPCOMING">("OVERDUE");
  const navigate = useNavigate();

  const { data: customers = [], isLoading } = useQuery<CustomerFollowupItem[]>({
    queryKey: ["followup-center-customers"],
    queryFn: async () => (await api.get<{ data: { items: CustomerFollowupItem[] } }>("/customers", { params: { limit: 100 } })).data.data.items,
  });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const followUpCustomers = customers.filter((c) => c.followUpDate);

  const overdueList = followUpCustomers.filter((c) => new Date(c.followUpDate) < startOfToday);
  const todayList = followUpCustomers.filter((c) => {
    const d = new Date(c.followUpDate);
    return d >= startOfToday && d <= endOfToday;
  });
  const upcomingList = followUpCustomers.filter((c) => new Date(c.followUpDate) > endOfToday);

  const currentList = filter === "OVERDUE" ? overdueList : filter === "TODAY" ? todayList : upcomingList;

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            CRM Follow-Up Command Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage customer touchpoints, scheduled calls, and lead conversion timelines.
          </p>
        </div>
        <Button onClick={() => navigate("/customers?new=1")}>
          <Plus className="h-4 w-4" /> Add Customer Profile
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setFilter("OVERDUE")}
          className={`flex items-center justify-between rounded-2xl border p-5 text-left transition ${
            filter === "OVERDUE"
              ? "border-red-500 bg-red-50/50 ring-2 ring-red-500/20 dark:border-red-400 dark:bg-red-950/20"
              : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overdue</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{overdueList.length}</p>
            <p className="text-[11px] text-slate-400">Action required past due</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilter("TODAY")}
          className={`flex items-center justify-between rounded-2xl border p-5 text-left transition ${
            filter === "TODAY"
              ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 dark:border-amber-400 dark:bg-amber-950/20"
              : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Due Today</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{todayList.length}</p>
            <p className="text-[11px] text-slate-400">Scheduled for today</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilter("UPCOMING")}
          className={`flex items-center justify-between rounded-2xl border p-5 text-left transition ${
            filter === "UPCOMING"
              ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 dark:border-brand-400 dark:bg-brand-950/20"
              : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Upcoming Agenda</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{upcomingList.length}</p>
            <p className="text-[11px] text-slate-400">Future scheduled touchpoints</p>
          </div>
        </button>
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {filter} Follow-ups ({currentList.length})
          </h2>
        </CardHeader>
        <CardBody className="p-0">
          {currentList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No follow-ups scheduled under the {filter.toLowerCase()} category.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentList.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{c.name}</p>
                        <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {c.businessName ? `${c.businessName} · ` : ""}{c.customerType}
                      </p>
                      {c.notes && <p className="mt-1 text-xs text-slate-400 line-clamp-1">"{c.notes}"</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {formatDate(c.followUpDate)}
                      </p>
                      <p className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Phone className="h-3 w-3" /> {c.mobile}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/customers/${c.id}`)}>
                      Open 360 Profile <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
