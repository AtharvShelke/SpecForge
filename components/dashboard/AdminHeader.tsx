"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { Bell, Menu, LogOut, ChevronDown, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiFetch } from "@/lib/helpers";
import { cn } from "@/lib/utils";

interface AdminHeaderProps {
  onLogout: () => void;
  onMenuClick: () => void;
  title: string;
}

export const AdminHeader = memo<AdminHeaderProps>(
  ({ onLogout, onMenuClick, title }) => {
    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [readIds, setReadIds] = useState<string[]>([]);
    const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

    const syncData = () => {
      window.location.reload();
    };
    const isLoading = false;

    useEffect(() => {
      // Load read IDs from localStorage
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("admin_read_notifications");
        if (saved) {
          try {
            setReadIds(JSON.parse(saved));
          } catch (e) {
            console.error(e);
          }
        }
      }
    }, []);

    const fetchNotifications = useCallback(async () => {
      setIsLoadingNotifs(true);
      try {
        const res = await apiFetch<{ notifications: any[] }>("/api/admin/notifications");
        setNotifications(res.notifications || []);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setIsLoadingNotifs(false);
      }
    }, []);

    useEffect(() => {
      fetchNotifications();
      // Poll notifications every 30 seconds
      const timer = setInterval(fetchNotifications, 30000);
      return () => clearInterval(timer);
    }, [fetchNotifications]);

    const markAllAsRead = useCallback(() => {
      const allIds = notifications.map(n => n.id);
      setReadIds(allIds);
      localStorage.setItem("admin_read_notifications", JSON.stringify(allIds));
    }, [notifications]);

    const handleNotificationClick = useCallback((notif: any) => {
      if (!readIds.includes(notif.id)) {
        const nextRead = [...readIds, notif.id];
        setReadIds(nextRead);
        localStorage.setItem("admin_read_notifications", JSON.stringify(nextRead));
      }
      router.push(notif.link);
    }, [readIds, router]);

    const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900">
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-2">
                <span className="text-xs font-semibold text-slate-950">System Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <ScrollArea className="h-64 mt-2">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-1">
                    <Bell size={24} className="text-slate-200" />
                    <span className="text-xs font-medium text-slate-400">No notifications</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((notif) => {
                      const isUnread = !readIds.includes(notif.id);
                      return (
                        <button
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={cn(
                            "w-full text-left rounded-md p-2.5 transition-colors flex gap-2 border-b border-slate-50/50 last:border-0 hover:bg-slate-50",
                            isUnread && "bg-slate-50/50"
                          )}
                        >
                          <div className="mt-0.5 shrink-0">
                            {notif.type === "error" ? (
                              <div className="h-2 w-2 rounded-full bg-rose-500 mt-1" />
                            ) : notif.type === "warning" ? (
                              <div className="h-2 w-2 rounded-full bg-amber-500 mt-1" />
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-blue-500 mt-1" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className={cn("text-xs font-semibold truncate", isUnread ? "text-slate-900" : "text-slate-500")}>
                                {notif.title}
                              </span>
                              {isUnread && (
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed break-words">
                              {notif.message}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

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