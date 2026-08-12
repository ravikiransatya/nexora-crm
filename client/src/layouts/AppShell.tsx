import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { NavRail } from "./NavRail";
import { HeaderBar } from "./HeaderBar";
import { api } from "@/lib/api";

interface DashboardHealthResponse {
  operationalHealth?: {
    systemStatus: "SYSTEM NORMAL" | "ATTENTION REQUIRED" | "CRITICAL EVENT";
  };
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");

  // Fetch real-time system status for header status indicator
  const { data } = useQuery<DashboardHealthResponse>({
    queryKey: ["command-dashboard-health"],
    queryFn: async () => (await api.get<{ data: DashboardHealthResponse }>("/dashboard")).data.data,
    refetchInterval: 30000,
  });

  const systemStatus = data?.operationalHealth?.systemStatus ?? "SYSTEM NORMAL";

  // Global Keyboard Shortcut: Ctrl + Shift + F for Focus Mode
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setFocusMode((v) => !v);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900 selection:bg-brand-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
      {/* 68px Control Rail */}
      {!focusMode && <NavRail mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />}

      <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${!focusMode ? "lg:pl-16" : ""}`}>
        {/* Top Operational Header */}
        {!focusMode && (
          <HeaderBar
            systemStatus={systemStatus}
            focusMode={focusMode}
            onToggleFocusMode={() => setFocusMode((v) => !v)}
            density={density}
            onToggleDensity={() => setDensity((d) => (d === "comfortable" ? "compact" : "comfortable"))}
            onOpenMobile={() => setMobileOpen(true)}
          />
        )}

        {/* Focus Mode Notification Banner */}
        {focusMode && (
          <div className="flex items-center justify-between border-b border-brand-500/20 bg-brand-50/80 px-6 py-2 text-xs font-semibold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
            <span>FOCUS MODE ACTIVE — Distraction-free operational workspace</span>
            <button
              onClick={() => setFocusMode(false)}
              className="rounded-lg bg-brand-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-brand-600"
            >
              Exit Focus Mode (Ctrl + Shift + F)
            </button>
          </div>
        )}

        {/* Main Content Spatial Canvas */}
        <main className={`flex-1 overflow-y-auto ${density === "compact" ? "p-4" : "p-6 sm:p-8"}`}>
          <Outlet context={{ focusMode, density }} />
        </main>
      </div>
    </div>
  );
}
