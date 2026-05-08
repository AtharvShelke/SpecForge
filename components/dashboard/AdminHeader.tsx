// components/dashboard/AdminHeader.tsx
'use client';

import React, { memo } from 'react';
import {
    Bell,
    Menu,
    LogOut,
    ChevronDown,
    RefreshCw,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface AdminHeaderProps {
    onLogout: () => void;
    onMenuClick: () => void;
    title: string;
}

export const AdminHeader = memo<AdminHeaderProps>(({ onLogout, onMenuClick, title }) => {
    return (
        <header className="h-[60px] bg-white border-b border-stone-100 sticky top-0 z-30 px-5 lg:px-6 flex items-center justify-between gap-4">

            {/* Left: hamburger + live badge + Sync */}
            <div className="flex items-center gap-3 min-w-0">
                <button
                    onClick={onMenuClick}
                    className="p-1.5 -ml-1 rounded-lg hover:bg-stone-100 lg:hidden text-stone-500 transition-colors"
                >
                    <Menu size={18} strokeWidth={1.75} />
                </button>

                {/* Page title (mobile only — desktop shows in sidebar) */}
                <h2 className="text-sm font-bold text-stone-900 tracking-tight lg:hidden truncate">
                    {title}
                </h2>

                {/* Live indicator */}
                <div className="hidden lg:flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-bold text-emerald-600 tracking-tight">Live</span>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-50 border border-stone-200 text-stone-500">
                    <RefreshCw size={13} className={cn("transition-transform duration-500")} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Live Data</span>
                </div>
            </div>

            {/* Right: bell + user */}
            <div className="flex items-center gap-2">

                {/* Notification bell */}
                <button className="relative p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors">
                    <Bell size={15} strokeWidth={1.75} />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full ring-2 ring-white" />
                </button>

                <div className="w-px h-5 bg-stone-200 mx-1" />

                {/* User dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-stone-100 transition-colors focus:outline-none">
                            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shrink-0">
                                <span className="text-[10px] font-bold text-white tracking-wider">AD</span>
                            </div>
                            <span className="hidden sm:block text-xs font-semibold text-stone-700 tracking-tight">
                                Admin User
                            </span>
                            <ChevronDown size={12} className="text-stone-400 hidden sm:block" />
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        className="w-48 mt-2 bg-white border border-stone-200 shadow-lg rounded-xl p-1.5"
                    >
                        <DropdownMenuLabel className="px-2.5 py-2">
                            <p className="text-xs font-bold text-stone-900">Admin User</p>
                            <p className="text-[10px] text-stone-400 font-mono mt-0.5">admin@specforge.com</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-stone-100 my-1" />
                        <DropdownMenuItem
                            onClick={onLogout}
                            className="flex items-center gap-2 px-2.5 py-2 cursor-pointer rounded-lg text-xs font-semibold text-rose-600 focus:text-rose-600 hover:bg-rose-50 focus:bg-rose-50 transition-colors"
                        >
                            <LogOut size={13} strokeWidth={2} />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
});
AdminHeader.displayName = 'AdminHeader';
