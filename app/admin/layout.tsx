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
  "saved-builds": "Saved Builds",
  billing: "Billing & Invoices",
  "builder-config": "Builder Config",
} as const;

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

  return (
    <div className="flex min-h-screen bg-transparent px-2.5 py-2.5 sm:px-4 sm:py-3">
      <div className="mx-auto flex w-full max-w-[1600px] gap-3 lg:gap-4">
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-3 lg:gap-4">
          <AdminHeader
            onLogout={handleLogout}
            onMenuClick={() => setIsSidebarOpen(true)}
            title={TAB_LABELS[activeTab] ?? "Admin"}
          />

          <main className="admin-workspace min-h-0 flex-1 overflow-hidden rounded-[1.75rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,246,242,0.9))] p-2.5 shadow-[0_30px_80px_-56px_rgba(20,30,59,0.36)] sm:p-3 lg:p-4">
            <div className="h-full min-h-0 rounded-[1.3rem] bg-white/56 p-1.5 sm:p-2 lg:p-2.5">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
});

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}
