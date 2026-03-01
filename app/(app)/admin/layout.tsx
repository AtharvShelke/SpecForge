'use client';

import { useRouter } from "next/navigation";
import { AdminProvider } from "@/context/AdminContext";
import { LogOut } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Container } from "@/components/layout/Container";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    async function handleLogout() {
        await fetch("/api/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    }

    return (
        <AdminProvider>
            <PageLayout bgClass="bg-gray-50">
                <PageLayout.Header border={false} className="py-4 !pb-0 bg-transparent">
                    <div className="flex justify-end w-full">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-red-600 cursor-pointer"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                </PageLayout.Header>
                {children}
            </PageLayout>
        </AdminProvider>
    );
}
