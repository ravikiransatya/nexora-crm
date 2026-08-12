import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/layouts/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Analytics from "@/pages/Analytics";
import Customers from "@/pages/Customers";
import CustomerDetail from "@/pages/CustomerDetail";
import FollowupCenter from "@/pages/customers/FollowupCenter";
import Products from "@/pages/Products";
import StockMovements from "@/pages/StockMovements";
import Challans from "@/pages/Challans";
import NewChallan from "@/pages/NewChallan";
import ChallanDetail from "@/pages/ChallanDetail";
import Users from "@/pages/admin/Users";
import AuditLogs from "@/pages/admin/AuditLogs";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />

          <Route element={<ProtectedRoute roles={["ADMIN", "SALES", "ACCOUNTS"]} />}>
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/followups" element={<FollowupCenter />} />
          </Route>

          <Route path="/products" element={<Products />} />
          <Route path="/stock-movements" element={<StockMovements />} />

          <Route element={<ProtectedRoute roles={["ADMIN", "SALES", "ACCOUNTS"]} />}>
            <Route path="/challans" element={<Challans />} />
            <Route path="/challans/new" element={<NewChallan />} />
            <Route path="/challans/:id" element={<ChallanDetail />} />
          </Route>

          <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/audit-logs" element={<AuditLogs />} />
          </Route>

          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
