// app/admin/page.tsx
"use client";

import { lazy, Suspense, memo } from "react";
import { useAdmin } from "@/context/AdminContext";

// ── Lazy-loaded tab components ────────────────────────────────────────────────
// Each tab becomes its own JS chunk — only downloaded when first visited.

const Overview = lazy(() => import("@/components/dashboard/Overview"));
const OrderManager = lazy(() => import("@/components/dashboard/OrderManager"));
const ProductManager = lazy(
  () => import("@/components/dashboard/ProductManager"),
);
const InventoryManager = lazy(
  () => import("@/components/dashboard/InventoryManager"),
);
const CategoryManager = lazy(
  () => import("@/components/dashboard/CategoryManager"),
);
const BrandManager = lazy(() => import("@/components/dashboard/BrandManager"));
const SavedBuildsManager = lazy(
  () => import("@/components/dashboard/SavedBuildsManager"),
);
const BillingInvoices = lazy(
  () => import("@/components/dashboard/BillingInvoices"),
);

// ── Constants ─────────────────────────────────────────────────────────────────

// Pre-built skeleton keys — avoids Array(4) allocation on every render
const SKELETON_KEYS = [0, 1, 2, 3] as const;

const SKELETON_STYLE = {
  fontFamily: "'DM Sans', 'Geist', 'system-ui', sans-serif",
} as const;

// ── TabSkeleton ───────────────────────────────────────────────────────────────

const TabSkeleton = memo(function TabSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" style={SKELETON_STYLE}>
      <div className="h-6 w-40 rounded-full bg-slate-200" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {SKELETON_KEYS.map((i) => (
          <div key={i} className="h-28 rounded-[1.5rem] bg-slate-200" />
        ))}
      </div>
      <div className="h-64 rounded-[1.75rem] bg-slate-200" />
    </div>
  );
});

// ── AdminDashboardContent ─────────────────────────────────────────────────────

const AdminDashboardContent = memo(function AdminDashboardContent() {
  const { activeTab } = useAdmin();

  return (
    <div className="space-y-5">
      {activeTab === "overview" && <Overview />}
      {activeTab === "orders" && <OrderManager />}
      {activeTab === "products" && <ProductManager />}
      {activeTab === "inventory" && <InventoryManager />}
      {activeTab === "categories" && <CategoryManager />}
      {activeTab === "brands" && <BrandManager />}
      {activeTab === "saved-builds" && <SavedBuildsManager />}
      {activeTab === "billing" && <BillingInvoices />}
    </div>
  );
});

// ── AdminDashboard ────────────────────────────────────────────────────────────

const AdminDashboard = memo(function AdminDashboard() {
  return (
    <Suspense fallback={<TabSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  );
});

export default AdminDashboard;
