// app/admin/layout.tsx
'use client';

import { useState, useCallback, memo, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ADMIN_TAB_LABELS, getAdminTab } from "@/components/admin/adminTabs";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { AdminHeader } from "@/components/dashboard/AdminHeader";

// ── Constants (module scope — never recreated) ────────────────────────────────

const SHELL_STYLE = {
    fontFamily: "'DM Sans', 'Geist', 'system-ui', sans-serif",
} as const;

// ── AdminShell ────────────────────────────────────────────────────────────────

const AdminShell = memo(function AdminShell({ children }: { children: ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeTab = getAdminTab(searchParams.get('tab'));

    const handleLogout = useCallback(async () => {
        await fetch("/api/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    }, [router]);

    const handleMenuClick = useCallback(() => setIsSidebarOpen(true), []);

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
});

// ── AdminLayout ───────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: ReactNode }) {
    return <AdminShell>{children}</AdminShell>;
}
