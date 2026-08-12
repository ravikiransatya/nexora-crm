import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  Package,
  ArrowLeftRight,
  Receipt,
  ShieldCheck,
  ScrollText,
  Settings,
  Boxes,
  BarChart3,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Role } from "@/types";
import { cn } from "@/lib/format";

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  roles?: Role[];
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    items: [
      { label: "Command Center", to: "/", icon: LayoutDashboard },
      { label: "Executive Analytics", to: "/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "CRM",
    items: [
      { label: "Customers", to: "/customers", icon: Users, roles: ["ADMIN", "SALES", "ACCOUNTS"] },
      { label: "Follow-up Agenda", to: "/followups", icon: CalendarClock, roles: ["ADMIN", "SALES", "ACCOUNTS"] },
    ],
  },
  {
    title: "Inventory",
    items: [
      { label: "Products", to: "/products", icon: Package, roles: ["ADMIN", "WAREHOUSE", "SALES", "ACCOUNTS"] },
      { label: "Risk Center", to: "/products?tab=risk", icon: ShieldAlert, roles: ["ADMIN", "WAREHOUSE", "SALES", "ACCOUNTS"] },
      { label: "Stock Movements", to: "/stock-movements", icon: ArrowLeftRight, roles: ["ADMIN", "WAREHOUSE", "SALES", "ACCOUNTS"] },
    ],
  },
  {
    title: "Sales",
    items: [{ label: "Challans", to: "/challans", icon: Receipt, roles: ["ADMIN", "SALES", "ACCOUNTS"] }],
  },
  {
    title: "Administration",
    items: [
      { label: "Users", to: "/admin/users", icon: ShieldCheck, roles: ["ADMIN"] },
      { label: "Audit Logs", to: "/admin/audit-logs", icon: ScrollText, roles: ["ADMIN"] },
    ],
  },
];

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const { user } = useAuth();

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform border-r border-gray-200 bg-white transition-transform dark:border-gray-800 dark:bg-gray-900 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-5 dark:border-gray-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
            <Boxes className="h-4.5 w-4.5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-gray-900 dark:text-gray-100">Nexora ERP</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Operations & CRM</p>
          </div>
        </div>

        <nav className="flex flex-col gap-5 overflow-y-auto px-3 py-4" style={{ height: "calc(100% - 4rem)" }}>
          {sections.map((section) => {
            const visibleItems = section.items.filter((i) => !i.roles || (user && i.roles.includes(user.role)));
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.title ?? "root"}>
                {section.title && (
                  <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {section.title}
                  </p>
                )}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                            : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="mt-auto space-y-0.5">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                )
              }
            >
              <Settings className="h-4 w-4" />
              Settings
            </NavLink>
          </div>
        </nav>
      </aside>
    </>
  );
}
