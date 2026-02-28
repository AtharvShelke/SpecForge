'use client';

import { useRouter } from "next/navigation";
import { AdminProvider } from "@/context/AdminContext";
import { LogOut } from "lucide-react";

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
            <div className="flex items-center justify-end px-4 sm:px-8 pt-4">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-red-600 cursor-pointer"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
            {children}
        </AdminProvider>
    );
}
