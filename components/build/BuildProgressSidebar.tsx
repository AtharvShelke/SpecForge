"use client";

import { useMemo } from "react";
import { useShop } from "../../context/ShopContext";
import { useBuild } from "../../context/BuildContext";
import {
  Check,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Monitor,
  Cpu,
  HardDrive,
  Keyboard,
  ShieldQuestion,
} from "lucide-react";
import Image from "next/image";
import { BUILD_SEQUENCE, CATEGORY_ICONS } from "../../data/categoryTree";
import { CATEGORY_NAMES, sameCategory } from "../../lib/categoryUtils";
import { motion, AnimatePresence } from "framer-motion";

interface BuildProgressSidebarProps {
  activeCategory?: string;
  onStepClick: (category: string) => void;
}

const BuildProgressSidebar: React.FC<BuildProgressSidebarProps> = ({
  activeCategory,
  onStepClick,
}) => {
  const { cart } = useShop();
  const { isBuildMode, compatibilityReport } = useBuild();

  const buildSteps = useMemo(() => {
    return BUILD_SEQUENCE.map((category, index) => {
      const item = cart.find((cartItem) =>
        sameCategory(cartItem.category, category),
      );
      return {
        category,
        label:
          category.charAt(0) +
          category.slice(1).toLowerCase().replace("_", " "),
        item,
        step: index + 1,
        icon: CATEGORY_ICONS[category] ?? ShieldQuestion,
      };
    });
  }, [cart]);

  return (
    <AnimatePresence>
      {isBuildMode && (
        <motion.div
          initial={{ width: 0, opacity: 0, marginLeft: 0 }}
          animate={{ width: 336, opacity: 1, marginLeft: 24 }}
          exit={{ width: 0, opacity: 0, marginLeft: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="hidden h-full flex-shrink-0 overflow-hidden xl:block"
        >
          <div className="h-full w-84 overflow-y-auto rounded-[1.9rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,246,242,0.88))] p-4 shadow-[0_24px_60px_-44px_rgba(20,30,59,0.3)]">
            <div className="rounded-[1.5rem] border border-white/90 bg-white/82 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Custom build
                  </p>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                    Your configuration
                  </h3>
                </div>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white">
                  {cart.length}/{BUILD_SEQUENCE.length}
                </span>
              </div>

              {cart.length > 0 && (
                <div
                  className={`mt-4 flex items-start gap-3 rounded-[1.2rem] border px-4 py-3 text-sm ${
                    compatibilityReport.status === "INCOMPATIBLE"
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : compatibilityReport.status === "WARNING"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {compatibilityReport.status === "INCOMPATIBLE" ? (
                    <XCircle size={16} className="mt-0.5 shrink-0" />
                  ) : compatibilityReport.status === "WARNING" ? (
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  ) : (
                    <Check size={16} className="mt-0.5 shrink-0" />
                  )}
                  <span className="leading-6">
                    {compatibilityReport.status === "COMPATIBLE"
                      ? "All selected components currently work together."
                      : `${compatibilityReport.issues.length} compatibility issue(s) need attention.`}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {buildSteps.map((step, index) => {
                const isActive = sameCategory(step.category, activeCategory);
                const isCompleted = !!step.item;
                const Icon = step.icon;

                return (
                  <button
                    key={step.category}
                    onClick={() => onStepClick(step.category)}
                    className={`relative w-full rounded-[1.5rem] border p-4 text-left transition-all duration-300 ${
                      isActive
                        ? "border-slate-950 bg-slate-950 text-white shadow-[0_24px_48px_-36px_rgba(15,23,42,0.88)]"
                        : "border-white/90 bg-white/84 text-slate-700 hover:-translate-y-0.5 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          isActive
                            ? "bg-white text-slate-950"
                            : isCompleted
                              ? "bg-slate-950 text-white"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {isCompleted ? (
                          <Check size={16} strokeWidth={3} />
                        ) : (
                          <Icon size={16} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p
                              className={`text-[0.68rem] font-semibold uppercase tracking-[0.2em] ${isActive ? "text-white/55" : "text-slate-400"}`}
                            >
                              Step {step.step}
                            </p>
                            <p
                              className={`mt-1 text-sm font-semibold tracking-[-0.02em] ${isActive ? "text-white" : "text-slate-900"}`}
                            >
                              {step.label}
                            </p>
                          </div>
                          <ChevronRight
                            size={15}
                            className={
                              isActive ? "text-white/60" : "text-slate-300"
                            }
                          />
                        </div>

                        {step.item ? (
                          <div className="mt-3 flex items-center gap-3 rounded-[1rem] bg-black/4 p-2.5">
                            <div
                              className={`relative h-11 w-11 overflow-hidden rounded-[0.9rem] border ${isActive ? "border-white/15 bg-white/10" : "border-slate-100 bg-slate-50"}`}
                            >
                              <Image
                                src={
                                  step.item.media?.[0]?.url ||
                                  "/placeholder.png"
                                }
                                alt={step.item.name}
                                fill
                                sizes="44px"
                                className="object-contain p-1.5"
                              />
                            </div>
                            <div className="min-w-0">
                              <p
                                className={`truncate text-sm font-medium ${isActive ? "text-white" : "text-slate-900"}`}
                              >
                                {step.item.name}
                              </p>
                              <p
                                className={`mt-1 text-xs font-semibold ${isActive ? "text-white/55" : "text-slate-500"}`}
                              >
                                ₹
                                {(
                                  step.item.variants?.[0]?.price || 0
                                ).toLocaleString("en-IN")}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p
                            className={`mt-3 text-sm ${isActive ? "text-white/65" : "text-slate-500"}`}
                          >
                            Select a component to continue.
                          </p>
                        )}
                      </div>
                    </div>

                    {index < buildSteps.length - 1 && (
                      <div
                        className={`absolute -bottom-3 left-8 h-3 w-px ${isCompleted ? "bg-slate-300" : "bg-slate-200"}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BuildProgressSidebar;
