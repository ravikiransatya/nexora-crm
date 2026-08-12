import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, AlertTriangle, Clock, FileText, ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

interface NotificationItem {
  id: string;
  type: "CRITICAL_STOCK" | "OVERDUE_FOLLOWUP" | "PENDING_CHALLAN";
  title: string;
  message: string;
  severity: "high" | "medium" | "info";
  link: string;
  createdAt: string;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { data: notifications = [] } = useQuery<NotificationItem[]>({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get<{ data: NotificationItem[] }>("/notifications")).data.data,
    refetchInterval: 30000,
  });

  const highSeverityCount = notifications.filter((n) => n.severity === "high").length;

  function handleItemClick(link: string) {
    setOpen(false);
    navigate(link);
  }

  function getIcon(type: NotificationItem["type"]) {
    switch (type) {
      case "CRITICAL_STOCK":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "OVERDUE_FOLLOWUP":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "PENDING_CHALLAN":
        return <FileText className="h-4 w-4 text-blue-500" />;
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        aria-label="System Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${highSeverityCount > 0 ? "bg-red-400 opacity-75" : "bg-amber-400 opacity-75"}`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${highSeverityCount > 0 ? "bg-red-500" : "bg-amber-500"}`} />
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-30 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  System Activity Alerts
                </h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {notifications.length}
                </span>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 py-1 dark:divide-slate-800/60">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  All systems operational. No active alerts.
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleItemClick(n.link)}
                    className="flex w-full items-start gap-3 p-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl"
                  >
                    <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{n.title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{n.message}</p>
                    </div>
                    <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
