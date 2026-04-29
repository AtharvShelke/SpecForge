"use client";

import React, { memo, useCallback } from "react";
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
  {
    label: "Overview",
    icon: LayoutDashboard,
    key: "overview",
    group: "primary",
  },
  { label: "Orders", icon: ShoppingBag, key: "orders", group: "primary" },
  { label: "Products", icon: Package, key: "products", group: "primary" },
  { label: "Inventory", icon: Layers, key: "inventory", group: "primary" },
  { label: "Categories", icon: Tag, key: "categories", group: "secondary" },
  { label: "Brands", icon: Bookmark, key: "brands", group: "secondary" },
  {
    label: "Saved Builds",
    icon: Layers,
    key: "saved-builds",
    group: "secondary",
  },
  {
    label: "Builder Config",
    icon: Hammer,
    key: "builder-config",
    group: "secondary",
  },
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
        "flex w-full items-center gap-3 rounded-[1.2rem] px-4 py-3 text-left text-sm font-semibold transition-all duration-300",
        isActive
          ? "bg-slate-950 text-white shadow-[0_22px_40px_-30px_rgba(15,23,42,0.95)]"
          : "text-slate-600 hover:bg-white hover:text-slate-950",
      )}
    >
      <Icon className="size-4 shrink-0" />
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
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-950/18 backdrop-blur-sm lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        <aside
          className={cn(
            "fixed inset-y-3 left-3 z-50 w-[300px] rounded-[2rem] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,244,240,0.92))] p-4 shadow-[0_34px_90px_-60px_rgba(20,30,59,0.5)] transition-transform duration-300 lg:static lg:inset-auto lg:h-[calc(100vh-2rem)] lg:w-[290px]",
            isOpen ? "translate-x-0" : "-translate-x-[110%] lg:translate-x-0",
          )}
        >
          <div className="flex h-full flex-col">
            <div className="hairline pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Layers className="size-5" />
                </div>
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-500">
                    MD
                  </p>
                  <h1 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                    Control
                  </h1>
                </div>
                <button
                  className="ml-auto flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white hover:text-slate-950 lg:hidden"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <ScrollArea className="flex-1 py-4">
              <div className="space-y-6 pr-1">
                <div>
                  <p className="mb-3 px-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Operations
                  </p>
                  <div className="space-y-2">
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
                  <p className="mb-3 px-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Catalog
                  </p>
                  <div className="space-y-2">
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

            <div className=" rounded-[1.5rem] border border-white/85 bg-white/78 p-4">
              <button
                onClick={onLogout}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-950 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          </div>
        </aside>
      </>
    );
  },
);
AdminSidebar.displayName = "AdminSidebar";
