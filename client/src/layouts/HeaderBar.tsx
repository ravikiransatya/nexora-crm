import { useState } from "react";
import {
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Sparkles,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  Menu,
} from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

interface HeaderBarProps {
  systemStatus?: "SYSTEM NORMAL" | "ATTENTION REQUIRED" | "CRITICAL EVENT";
  focusMode: boolean;
  onToggleFocusMode: () => void;
  density: "comfortable" | "compact";
  onToggleDensity: () => void;
  onOpenMobile?: () => void;
}

export function HeaderBar({
  systemStatus = "SYSTEM NORMAL",
  focusMode,
  onToggleFocusMode,
  density,
  onToggleDensity,
  onOpenMobile,
}: HeaderBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
      {/* Left: System Status & Command Bar */}
      <div className="flex items-center gap-3">
        {onOpenMobile && (
          <button
            onClick={onOpenMobile}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        {/* Ambient System Status Indicator */}
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950/60">
          <span className={`h-2 w-2 rounded-full ${
            systemStatus === "CRITICAL EVENT"
              ? "bg-red-500 animate-pulse"
              : systemStatus === "ATTENTION REQUIRED"
              ? "bg-amber-500"
              : "bg-emerald-500"
          }`} />
          <span className="text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {systemStatus}
          </span>
        </div>

        <div className="hidden sm:block">
          <GlobalSearch />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Density Mode Toggle */}
        <button
          type="button"
          onClick={onToggleDensity}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
          title={`Switch to ${density === "comfortable" ? "Compact" : "Comfortable"} density`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden md:inline uppercase text-[10px] tracking-wide">{density}</span>
        </button>

        {/* Focus Mode Toggle */}
        <button
          type="button"
          onClick={onToggleFocusMode}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
            focusMode
              ? "border-brand-500 bg-brand-50 text-brand-600 dark:border-brand-400 dark:bg-brand-500/20 dark:text-brand-400"
              : "border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
          title="Focus Mode (Ctrl + Shift + F)"
        >
          {focusMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          <span className="hidden md:inline text-[10px] uppercase tracking-wide">Focus Mode</span>
        </button>

        <NotificationCenter />

        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v: boolean) => !v)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-2.5 py-1.5 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500 text-xs font-bold text-white">
              {user?.name?.charAt(0) ?? "U"}
            </div>
            <span className="hidden text-xs font-semibold text-slate-800 dark:text-slate-200 sm:inline">
              {user?.name}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{user?.name}</p>
                  <p className="text-[10px] text-slate-400">{user?.role} Role</p>
                </div>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
