import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  CalendarClock,
  Package,
  ShieldAlert,
  Receipt,
  ShieldCheck,
  Settings,
  Boxes,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Role } from "@/types";
import { cn } from "@/lib/format";

interface NavRailItem {
  label: string;
  to: string;
  icon: React.ElementType;
  roles?: Role[];
}

const NAV_ITEMS: NavRailItem[] = [
  { label: "Command Center", to: "/", icon: LayoutDashboard },
  { label: "Executive Analytics", to: "/analytics", icon: BarChart3 },
  { label: "Customer CRM", to: "/customers", icon: Users, roles: ["ADMIN", "SALES", "ACCOUNTS"] },
  { label: "Follow-up Agenda", to: "/followups", icon: CalendarClock, roles: ["ADMIN", "SALES", "ACCOUNTS"] },
  { label: "Inventory", to: "/products", icon: Package, roles: ["ADMIN", "WAREHOUSE", "SALES", "ACCOUNTS"] },
  { label: "Risk Center", to: "/products?tab=risk", icon: ShieldAlert, roles: ["ADMIN", "WAREHOUSE", "SALES", "ACCOUNTS"] },
  { label: "Sales Challans", to: "/challans", icon: Receipt, roles: ["ADMIN", "SALES", "ACCOUNTS"] },
  { label: "Administration", to: "/admin/users", icon: ShieldCheck, roles: ["ADMIN"] },
];

export function NavRail({ mobileOpen, onCloseMobile }: { mobileOpen?: boolean; onCloseMobile?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuth();

  const visibleItems = NAV_ITEMS.filter((i) => !i.roles || (user && i.roles.includes(user.role)));

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden" onClick={onCloseMobile} />
      )}

      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={cn(
          "group fixed inset-y-0 left-0 z-50 border-r border-slate-200 bg-white transition-all duration-300 ease-out dark:border-slate-800 dark:bg-slate-900 flex flex-col",
          // Mobile state
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
          // Desktop state
          expanded ? "lg:w-60 shadow-xl" : "lg:w-16"
        )}
      >
        {/* Brand Icon Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-xs">
              <Boxes className="h-5 w-5" />
            </div>
            <div className={cn("leading-tight transition-opacity duration-200 overflow-hidden whitespace-nowrap", (expanded || mobileOpen) ? "opacity-100" : "opacity-0 w-0 lg:opacity-0")}>
              <p className="text-xs font-bold tracking-tight text-slate-900 dark:text-slate-100">Nexora Enterprises</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Operations & CRM</p>
            </div>
          </div>
          {mobileOpen && (
            <button onClick={onCloseMobile} className="text-slate-400 hover:text-slate-600 lg:hidden">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nav List */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  cn(
                    "relative flex h-10 items-center gap-3 rounded-xl px-2.5 text-xs font-semibold transition-colors duration-150",
                    isActive
                      ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  )
                }
                title={!expanded && !mobileOpen ? item.label : undefined}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span className={cn("transition-opacity duration-200 overflow-hidden whitespace-nowrap", (expanded || mobileOpen) ? "opacity-100" : "opacity-0 w-0")}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}

          <div className="mt-auto">
            <NavLink
              to="/settings"
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  "relative flex h-10 items-center gap-3 rounded-xl px-2.5 text-xs font-semibold transition-colors duration-150",
                  isActive
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                )
              }
              title={!expanded && !mobileOpen ? "Settings" : undefined}
            >
              <Settings className="h-4.5 w-4.5 shrink-0" />
              <span className={cn("transition-opacity duration-200 overflow-hidden whitespace-nowrap", (expanded || mobileOpen) ? "opacity-100" : "opacity-0 w-0")}>
                Settings
              </span>
            </NavLink>
          </div>
        </nav>
      </aside>
    </>
  );
}
