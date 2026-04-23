// app/admin/layout.tsx
"use client";

import { useState, useCallback, memo, type ReactNode } from "react";
import { AdminProvider, useAdmin } from "@/context/AdminContext";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { AdminHeader } from "@/components/dashboard/AdminHeader";
import { useRouter } from "next/navigation";

// ── Constants (module scope — never recreated) ────────────────────────────────

const TAB_LABELS: Record<string, string> = {
  overview: "Overview",
  orders: "Orders",
  products: "Products",
  inventory: "Inventory",
  categories: "Categories",
  brands: "Brands",
  "saved-builds": "Saved Builds",
  billing: "Billing & Invoices",
} as const;

const SHELL_STYLE = {
  fontFamily: "'DM Sans', 'Geist', 'system-ui', sans-serif",
} as const;

// ── AdminShell ────────────────────────────────────────────────────────────────

const AdminShell = memo(function AdminShell({
  children,
}: {
  children: ReactNode;
}) {
  const { activeTab, setActiveTab } = useAdmin();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }, [router]);

  const handleMenuClick = useCallback(() => setIsSidebarOpen(true), []);

  return (
    <div
      className="flex h-screen bg-stone-50 overflow-hidden antialiased"
      style={SHELL_STYLE}
    >
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader
          onLogout={handleLogout}
          onMenuClick={handleMenuClick}
          title={TAB_LABELS[activeTab] ?? "Admin"}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-stone-50">
          <div className="p-5 lg:p-6 max-w-[1400px] mx-auto 2xl:max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
});

// ── AdminLayout ───────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}
