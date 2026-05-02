"use client";

import { memo } from "react";
import { useAdmin } from "@/context/AdminContext";
import { Bell, Menu, LogOut, ChevronDown, RefreshCw } from "lucide-react";
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

export const AdminHeader = memo<AdminHeaderProps>(
  ({ onLogout, onMenuClick, title }) => {
    const { syncData, isLoading } = useAdmin();

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