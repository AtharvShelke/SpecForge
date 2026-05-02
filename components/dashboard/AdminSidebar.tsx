"use client";

import { memo, useCallback } from "react";
import {
  Bookmark,
  Hammer,
  Layers,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  Tag,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  label: string;
  icon: React.ElementType;
  key: string;
  group?: "primary" | "secondary";
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, key: "overview", group: "primary" },
  { label: "Orders", icon: ShoppingBag, key: "orders", group: "primary" },
  { label: "Products", icon: Package, key: "products", group: "primary" },
  { label: "Inventory", icon: Layers, key: "inventory", group: "primary" },
  { label: "Categories", icon: Tag, key: "categories", group: "secondary" },
  { label: "Brands", icon: Bookmark, key: "brands", group: "secondary" },
  { label: "Builder Config", icon: Hammer, key: "builder-config", group: "secondary" },
];

const PRIMARY_NAV = NAV_ITEMS.filter((item) => item.group === "primary");
const SECONDARY_NAV = NAV_ITEMS.filter((item) => item.group === "secondary");

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const NavButton = memo(function NavButton({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: (key: string) => void;
}) {
  const Icon = item.icon;

  return (
    <button
      onClick={() => onClick(item.key)}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200",
        isActive
          ? "bg-slate-100 text-slate-900"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
      )}
    >
      <Icon className={cn("size-4 shrink-0", isActive ? "text-slate-900" : "text-slate-400")} />
      <span>{item.label}</span>
    </button>
  );
});

export const AdminSidebar = memo<AdminSidebarProps>(
  ({ activeTab, setActiveTab, onLogout, isOpen, setIsOpen }) => {
    const handleNavClick = useCallback(
      (key: string) => {
        setActiveTab(key);
        if (window.innerWidth < 1024) setIsOpen(false);
      },
      [setActiveTab, setIsOpen],
    );

    return (
      <>
        {/* Mobile Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-sm transition-opacity lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:h-screen lg:translate-x-0",
            isOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {/* Header */}
          <div className="flex h-16 shrink-0 items-center px-6">
            <div className="flex items-center gap-3">
              <div className="flex size-7 items-center justify-center rounded bg-slate-900 text-white">
                <Layers className="size-4" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-slate-900">
                System Admin
              </span>
            </div>
            <button
              className="ml-auto text-slate-400 hover:text-slate-900 lg:hidden"
              onClick={() => setIsOpen(false)}
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4 py-2">
            <div className="space-y-6">
              <div>
                <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-slate-400">
                  Operations
                </p>
                <div className="space-y-1">
                  {PRIMARY_NAV.map((item) => (
                    <NavButton
                      key={item.key}
                      item={item}
                      isActive={activeTab === item.key}
                      onClick={handleNavClick}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-slate-400">
                  Catalog
                </p>
                <div className="space-y-1">
                  {SECONDARY_NAV.map((item) => (
                    <NavButton
                      key={item.key}
                      item={item}
                      isActive={activeTab === item.key}
                      onClick={handleNavClick}
                    />
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="mt-auto border-t border-slate-200 p-4">
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-500 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900"
            >
              <LogOut className="size-4 text-slate-400" />
              Sign out
            </button>
          </div>
        </aside>
      </>
    );
  },
);

AdminSidebar.displayName = "AdminSidebar";