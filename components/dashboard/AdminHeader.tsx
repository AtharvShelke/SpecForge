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
      <header className="app-surface rounded-[1.75rem] px-4 py-2 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={onMenuClick}
              className="flex size-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white hover:text-slate-950 lg:hidden"
            >
              <Menu size={18} strokeWidth={1.75} />
            </button>

            <div className="min-w-0">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Admin panel
              </p>
              <h2 className="truncate text-xl font-semibold tracking-[-0.04em] text-slate-950">
                {title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={syncData}
              disabled={isLoading}
              className="hidden h-10 items-center gap-2 rounded-full border border-slate-200 bg-white/84 px-4 text-sm font-semibold text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950 sm:inline-flex"
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

            <button className="relative flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white/84 text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950">
              <Bell size={15} strokeWidth={1.75} />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-emerald-500" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/84 px-2 py-1.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300">

                  <div className="hidden text-left sm:block">
                    <p className="text-xs font-semibold text-slate-900">
                      Admin User
                    </p>

                  </div>
                  <ChevronDown
                    size={14}
                    className="hidden text-slate-400 sm:block"
                  />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-52 rounded-[1.25rem] border border-white/80 bg-white/94 p-2 shadow-[0_28px_70px_-48px_rgba(20,30,59,0.45)]"
              >
                <DropdownMenuLabel className="px-3 py-2">
                  <p className="text-sm font-semibold text-slate-950">
                    Admin User
                  </p>
                  <p className="text-xs text-slate-400">
                    admin@mdcomputers.com
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem
                  onClick={syncData}
                  className="mt-1 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:bg-slate-50"
                >
                  <RefreshCw
                    size={14}
                    className={cn(isLoading && "animate-spin")}
                  />
                  Refresh data
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onLogout}
                  className="mt-1 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 focus:bg-rose-50"
                >
                  <LogOut size={14} />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    );
  },
);
AdminHeader.displayName = "AdminHeader";
