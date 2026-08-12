import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Boxes,
  ShieldCheck,
  TrendingUp,
  Package,
  Receipt,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Check,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { apiErrorMessage } from "@/lib/api";

interface DemoRole {
  id: string;
  roleName: string;
  title: string;
  description: string;
  email: string;
  icon: React.ElementType;
  badgeStyle: string;
  activeStyle: string;
}

const DEMO_ROLES: DemoRole[] = [
  {
    id: "admin",
    roleName: "Admin",
    title: "Ravi (Admin)",
    description: "Full system control & logs",
    email: "admin@nexora.demo",
    icon: ShieldCheck,
    badgeStyle: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    activeStyle: "border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20 dark:border-indigo-400 dark:bg-indigo-950/30",
  },
  {
    id: "sales",
    roleName: "Sales",
    title: "Kiran (Sales)",
    description: "Customers & challan creation",
    email: "sales@nexora.demo",
    icon: TrendingUp,
    badgeStyle: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    activeStyle: "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 dark:border-emerald-400 dark:bg-emerald-950/30",
  },
  {
    id: "warehouse",
    roleName: "Warehouse",
    title: "Satya (Warehouse)",
    description: "Products & stock movements",
    email: "warehouse@nexora.demo",
    icon: Package,
    badgeStyle: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    activeStyle: "border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 dark:border-amber-400 dark:bg-amber-950/30",
  },
  {
    id: "accounts",
    roleName: "Accounts",
    title: "Tulasi (Accounts)",
    description: "Billing & audit compliance",
    email: "accounts@nexora.demo",
    icon: Receipt,
    badgeStyle: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    activeStyle: "border-purple-500 bg-purple-50/70 ring-2 ring-purple-500/20 dark:border-purple-400 dark:bg-purple-950/30",
  },
];

export default function Login() {
  const [email, setEmail] = useState("admin@nexora.demo");
  const [password, setPassword] = useState("Passw0rd!");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const selectedRole = DEMO_ROLES.find((r) => r.email === email);

  async function handleLogin(targetEmail = email, targetPassword = password) {
    setLoading(true);
    try {
      await login(targetEmail, targetPassword);
      toast.success(`Logged in as ${targetEmail}`);
      navigate("/");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Invalid email or password"));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleLogin();
  }

  function handleSelectRole(role: DemoRole) {
    setEmail(role.email);
    setPassword("Passw0rd!");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Background glowing gradients */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl dark:bg-brand-600/20" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl dark:bg-purple-600/20" />

      {/* Theme Toggle Button (Top Right) */}
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-600 shadow-sm backdrop-blur-md transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100 sm:top-6 sm:right-6"
        aria-label="Toggle theme"
        title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {theme === "dark" ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-slate-700" />}
      </button>

      <div className="relative w-full max-w-lg space-y-6">
        {/* Branding Header */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-lg shadow-brand-500/25 ring-1 ring-white/20">
            <Boxes className="h-7 w-7" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Nexora Enterprises</h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-600 dark:text-brand-400">
              <Sparkles className="h-3 w-3" /> Enterprise
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Operations, Inventory & Customer Intelligence Portal
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-2xl sm:p-8">
          {/* Department / Role Quick Select Buttons */}
          <div className="mb-6 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Select Department to Auto-Fill
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {DEMO_ROLES.map((r) => {
                const isSelected = email === r.email;
                const RoleIcon = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectRole(r)}
                    className={`relative flex items-start gap-3 rounded-xl border p-3 text-left transition-all duration-200 ${
                      isSelected
                        ? r.activeStyle
                        : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${r.badgeStyle}`}>
                      <RoleIcon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{r.roleName}</p>
                        {isSelected && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-white">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{r.title}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative my-5 flex items-center justify-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            <span className="absolute bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider dark:bg-slate-900 dark:text-slate-500">
              Or Login Manually
            </span>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Work Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@nexora.demo"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition dark:text-slate-500 dark:hover:text-slate-300"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:from-brand-500 hover:to-indigo-500 active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Authenticating…
                </span>
              ) : (
                <>
                  Sign in as {selectedRole ? selectedRole.roleName : "User"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span>Protected by 256-bit SSL encryption</span>
          <span>Nexora ERP v1.0</span>
        </div>
      </div>
    </div>
  );
}
