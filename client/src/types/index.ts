export type Role = "ADMIN" | "SALES" | "WAREHOUSE" | "ACCOUNTS";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive?: boolean;
}

export type CustomerType = "RETAIL" | "WHOLESALE" | "DISTRIBUTOR";
export type CustomerStatus = "LEAD" | "ACTIVE" | "INACTIVE";

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  businessName?: string | null;
  gstNumber?: string | null;
  customerType: CustomerType;
  address?: string | null;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  followups?: CustomerFollowup[];
  challans?: Challan[];
}

export interface CustomerFollowup {
  id: string;
  note: string;
  createdAt: string;
  createdBy?: { name: string };
}

export type StockStatus = "HEALTHY" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface Product {
  id: string;
  name: string;
  sku: string;
  unitPrice: string | number;
  stock: number;
  minStock: number;
  stockStatus: StockStatus;
  category?: { id: string; name: string } | null;
  warehouse?: { id: string; name: string } | null;
  createdAt: string;
}

export type MovementType = "IN" | "OUT";

export interface StockMovement {
  id: string;
  quantity: number;
  type: MovementType;
  reason: string;
  createdAt: string;
  product: { name: string; sku: string };
  createdBy: { name: string };
}

export type ChallanStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

export interface ChallanItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: string | number;
  quantity: number;
  subtotal: string | number;
  product?: { name: string; sku: string };
}

export interface Challan {
  id: string;
  challanNumber: string;
  status: ChallanStatus;
  totalQuantity: number;
  totalAmount: string | number;
  createdAt: string;
  confirmedAt?: string | null;
  customer: { id?: string; name: string; businessName?: string | null };
  items: ChallanItem[];
  createdBy?: { name: string };
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  description: string;
  createdAt: string;
  user?: { name: string; email: string; role: Role } | null;
}

export interface DashboardSummary {
  totals: {
    totalCustomers: number;
    activeCustomers: number;
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    draftChallans: number;
    confirmedChallans: number;
    todayConfirmedChallans: number;
  };
  upcomingFollowups: { id: string; name: string; followUpDate: string; status: string }[];
  customerStatusDistribution: { status: string; count: number }[];
  challanTrend: { date: string; count: number; amount: number }[];
  recentStockMovements: StockMovement[];
}
