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
    <div className="flex min-h-screen bg-transparent px-3 py-3 sm:px-5 sm:py-4">
      <div className="mx-auto flex w-full max-w-[1600px] gap-4 lg:gap-5">
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-5">
          <AdminHeader
            onLogout={handleLogout}
            onMenuClick={() => setIsSidebarOpen(true)}
            title={TAB_LABELS[activeTab] ?? "Admin"}
          />

          <main className="min-h-0 flex-1 overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,246,242,0.9))] p-4 shadow-[0_30px_80px_-56px_rgba(20,30,59,0.36)] sm:p-5 lg:p-6">
            <div className="h-full overflow-y-auto rounded-[1.5rem] bg-white/56 p-3 sm:p-4 lg:p-5">
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
