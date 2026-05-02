"use client";

import { useState, useCallback, memo, type ReactNode } from "react";
import { AdminProvider, useAdmin } from "@/context/AdminContext";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { AdminHeader } from "@/components/dashboard/AdminHeader";
import { useRouter } from "next/navigation";

const TAB_LABELS: Record<string, string> = {
  overview: "Overview",
  orders: "Orders",
  products: "Products",
  inventory: "Inventory",
  categories: "Categories",
  brands: "Brands",

  billing: "Billing & Invoices",
  "builder-config": "Builder Config",
  compatibility: "Compatibility Rules",
} as const;



export const AdminShell = memo(function AdminShell({
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

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          onLogout={handleLogout}
          onMenuClick={() => setIsSidebarOpen(true)}
          title={TAB_LABELS[activeTab] ?? "Admin"}
        />

        {/* 
          Main workspace: 
          - bg-slate-50/50 gives a very subtle contrast against the white header/sidebar 
          - Standardized, consistent padding replaces the nested rounded containers
        */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
});

AdminShell.displayName = "AdminShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}
