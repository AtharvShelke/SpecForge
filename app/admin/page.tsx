// app/admin/page.tsx
"use client";

import { lazy, Suspense, memo, type ReactNode } from "react";
import { useAdmin } from "@/context/AdminContext";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const BillingInvoices = lazy(
  () => import("@/components/dashboard/BillingInvoices"),
);
const BuilderConfigManager = lazy(
  () => import("@/components/dashboard/builder-config/BuilderConfigManager"),
);
const CompatibilityManager = lazy(
  () => import("@/components/dashboard/CompatibilityManager"),
);
const TaxSettingsTab = lazy(
  () => import("@/components/dashboard/TaxSettingsTab"),
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
    <div className="space-y-3.5 animate-pulse" style={SKELETON_STYLE}>
      <div className="h-8 w-56 rounded-full bg-stone-200/80" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SKELETON_KEYS.map((i) => (
          <div
            key={i}
            className="h-32 rounded-[1.75rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(237,233,227,0.92))]"
          />
        ))}
      </div>
      <div className="h-72 rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(237,233,227,0.94))]" />
    </div>
  );
});

const TabViewport = memo(function TabViewport({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="admin-panel h-full min-h-0 overflow-hidden">
      <ScrollArea className="admin-scroll">
        <div className="admin-module">{children}</div>
      </ScrollArea>
    </div>
  );
});

// ── AdminDashboardContent ─────────────────────────────────────────────────────

const AdminDashboardContent = memo(function AdminDashboardContent() {
  const { activeTab } = useAdmin();

  return (
    <div className="h-full min-h-0">
      {activeTab === "overview" && (
        <TabViewport>
          <Overview />
        </TabViewport>
      )}
      {activeTab === "orders" && (
        <TabViewport>
          <OrderManager />
        </TabViewport>
      )}
      {activeTab === "products" && (
        <TabViewport>
          <ProductManager />
        </TabViewport>
      )}
      {activeTab === "inventory" && (
        <TabViewport>
          <InventoryManager />
        </TabViewport>
      )}
      {activeTab === "categories" && (
        <TabViewport>
          <CategoryManager />
        </TabViewport>
      )}
      {activeTab === "brands" && (
        <TabViewport>
          <BrandManager />
        </TabViewport>
      )}
      {activeTab === "billing" && (
        <TabViewport>
          <BillingInvoices />
        </TabViewport>
      )}
      {activeTab === "builder-config" && (
        <TabViewport>
          <BuilderConfigManager />
        </TabViewport>
      )}
      {activeTab === "compatibility" && (
        <TabViewport>
          <CompatibilityManager />
        </TabViewport>
      )}
      {activeTab === "tax-settings" && (
        <TabViewport>
          <TaxSettingsTab />
        </TabViewport>
      )}
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
