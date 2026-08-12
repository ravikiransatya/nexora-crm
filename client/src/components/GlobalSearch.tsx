import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  User as UserIcon,
  Package,
  Receipt,
  X,
  PlusCircle,
  BarChart3,
  AlertTriangle,
  LayoutDashboard,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";

interface SearchResults {
  customers: { id: string; name: string; mobile: string }[];
  products: { id: string; name: string; sku: string }[];
  challans: { id: string; challanNumber: string; status: string }[];
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else setQuery("");
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await api.get("/search", { params: { q: query } });
        setResults(res.data.data);
      } catch {
        // ignore search error
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  function handleNavigate(path: string) {
    setOpen(false);
    navigate(path);
  }

  const QUICK_ACTIONS = [
    { label: "New Sales Challan", path: "/challans/new", icon: PlusCircle, category: "Create" },
    { label: "Add Customer Profile", path: "/customers?new=1", icon: UserIcon, category: "Create" },
    { label: "Add Product Item", path: "/products?new=1", icon: Package, category: "Create" },
    { label: "Inventory Risk Center", path: "/products?tab=risk", icon: AlertTriangle, category: "Intelligence" },
    { label: "Executive Analytics", path: "/analytics", icon: BarChart3, category: "Intelligence" },
  ];

  const NAVIGATION_LINKS = [
    { label: "Operations Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Customer CRM", path: "/customers", icon: UserIcon },
    { label: "Products & Stock", path: "/products", icon: Package },
    { label: "Sales Challans", path: "/challans", icon: Receipt },
    { label: "Follow-up Agenda", path: "/followups", icon: UserIcon },
  ];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-64 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-slate-700 dark:hover:bg-slate-800"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search or type command…</span>
        <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          ⌘K
        </kbd>
      </button>
    );
  }

  const hasResults =
    results && (results.customers.length > 0 || results.products.length > 0 || results.challans.length > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 p-4 pt-20 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
          <Search className="h-4.5 w-4.5 text-brand-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, page, or search customers/products/challans…"
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none dark:text-slate-100"
          />
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {!query.trim() && (
            <div className="space-y-4 p-2">
              <div>
                <p className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Actions
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_ACTIONS.map((act) => {
                    const Icon = act.icon;
                    return (
                      <button
                        key={act.path}
                        onClick={() => handleNavigate(act.path)}
                        className="flex items-center gap-2.5 rounded-xl border border-slate-100 p-2.5 text-left text-xs font-medium text-slate-700 hover:border-brand-500/30 hover:bg-brand-50/50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/60"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="truncate">{act.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Navigation Shortcuts
                </p>
                <div className="space-y-0.5">
                  {NAVIGATION_LINKS.map((nav) => {
                    const Icon = nav.icon;
                    return (
                      <button
                        key={nav.path}
                        onClick={() => handleNavigate(nav.path)}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4 text-slate-400" />
                          <span>{nav.label}</span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {query.trim() && !hasResults && (
            <p className="py-8 text-center text-xs text-slate-400">No matching records found for "{query}"</p>
          )}

          {results && results.customers.length > 0 && (
            <div className="px-2 py-1">
              <p className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Customers</p>
              {results.customers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleNavigate(`/customers/${c.id}`)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-3.5 w-3.5 text-brand-500" />
                    <span>{c.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{c.mobile}</span>
                </button>
              ))}
            </div>
          )}

          {results && results.products.length > 0 && (
            <div className="px-2 py-1">
              <p className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Products</p>
              {results.products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleNavigate(`/products?search=${encodeURIComponent(p.sku)}`)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-purple-500" />
                    <span>{p.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{p.sku}</span>
                </button>
              ))}
            </div>
          )}

          {results && results.challans.length > 0 && (
            <div className="px-2 py-1">
              <p className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Challans</p>
              {results.challans.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleNavigate(`/challans/${c.id}`)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <Receipt className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{c.challanNumber}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{c.status}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
