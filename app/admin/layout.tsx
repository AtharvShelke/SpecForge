"use client";

<<<<<<< HEAD
import { useState, useCallback, memo, type ReactNode } from "react";
import { AdminProvider, useAdmin } from "@/context/AdminContext";
=======
import { useState, useCallback, memo, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ADMIN_TAB_LABELS, getAdminTab } from "@/components/admin/adminTabs";
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { AdminHeader } from "@/components/dashboard/AdminHeader";

<<<<<<< HEAD
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

=======
// ── Constants (module scope — never recreated) ────────────────────────────────

const SHELL_STYLE = {
    fontFamily: "'DM Sans', 'Geist', 'system-ui', sans-serif",
} as const;
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50


<<<<<<< HEAD
export const AdminShell = memo(function AdminShell({
  children,
}: {
  children: ReactNode;
}) {
  const { activeTab, setActiveTab } = useAdmin();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
=======
const AdminShell = memo(function AdminShell({ children }: { children: ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeTab = getAdminTab(searchParams.get('tab'));
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50

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

<<<<<<< HEAD
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
=======
    const handleTabChange = useCallback((tab: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (tab === 'overview') params.delete('tab');
        else params.set('tab', tab);
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
    }, [pathname, router, searchParams]);

    return (
        <div
            className="flex h-screen bg-stone-50 overflow-hidden antialiased"
            style={SHELL_STYLE}
        >
            <AdminSidebar
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                onLogout={handleLogout}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <AdminHeader
                    onLogout={handleLogout}
                    onMenuClick={handleMenuClick}
                    title={ADMIN_TAB_LABELS[activeTab] ?? 'Admin'}
                />

                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-stone-50">
                    <div className="p-5 lg:p-6 max-w-[1400px] mx-auto 2xl:max-w-[1600px]">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
});

AdminShell.displayName = "AdminShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
<<<<<<< HEAD
  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
=======
    return <AdminShell>{children}</AdminShell>;
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
}
