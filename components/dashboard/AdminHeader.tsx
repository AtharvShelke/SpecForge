"use client";

<<<<<<< HEAD
import { memo } from "react";
import { useAdmin } from "@/context/AdminContext";
import { Bell, Menu, LogOut, ChevronDown, RefreshCw } from "lucide-react";
=======
import React, { memo } from 'react';
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface AdminHeaderProps {
  onLogout: () => void;
  onMenuClick: () => void;
  title: string;
}

<<<<<<< HEAD
export const AdminHeader = memo<AdminHeaderProps>(
  ({ onLogout, onMenuClick, title }) => {
    const { syncData, isLoading } = useAdmin();

=======
export const AdminHeader = memo<AdminHeaderProps>(({ onLogout, onMenuClick, title }) => {
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
    return (
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="flex rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Toggle Menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex flex-col">
            <p className="text-[0.65rem] font-medium uppercase tracking-wider text-slate-500">
              Admin panel
            </p>
            <h2 className="truncate text-lg font-semibold tracking-tight text-slate-900">
              {title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={syncData}
            disabled={isLoading}
            className="hidden h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 sm:inline-flex"
            title="Sync Data"
          >
            <RefreshCw
              size={14}
              className={cn(
                "transition-transform duration-500",
                isLoading && "animate-spin",
              )}
            />
            Refresh
          </button>

          <button className="relative flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900">
            <Bell size={16} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 transition-colors hover:bg-slate-50 sm:px-3">
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium text-slate-700">
                    Admin User
                  </p>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
            </DropdownMenuTrigger>

<<<<<<< HEAD
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-md border border-slate-200 bg-white p-1 shadow-md"
            >
              <DropdownMenuLabel className="px-3 py-2.5">
                <p className="text-sm font-medium text-slate-900">
                  Admin User
                </p>
                <p className="text-xs text-slate-500">
                  admin@mdcomputers.com
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100" />
              <div className="p-1">
                <DropdownMenuItem
                  onClick={syncData}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100 focus:bg-slate-100"
                >
                  <RefreshCw
                    size={14}
                    className={cn(isLoading && "animate-spin")}
                  />
                  Refresh data
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onLogout}
                  className="mt-1 flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 focus:bg-rose-50 focus:text-rose-700"
                >
                  <LogOut size={14} />
                  Sign out
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    );
  },
);

AdminHeader.displayName = "AdminHeader";
=======
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
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
