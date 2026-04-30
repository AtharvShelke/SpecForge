"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type MetricPayload = {
  route: string;
  metric: "TTFB" | "FCP" | "LCP";
  value: number;
  unit: "ms";
};

function logMetric(payload: MetricPayload) {
  console.info("[perf:vitals]", JSON.stringify(payload));
}

function readNavigationTiming() {
  const entry = performance.getEntriesByType("navigation")[0];
  return entry instanceof PerformanceNavigationTiming ? entry : null;
}

export function PerformanceVitalsReporter() {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const route = pathname || "/";
    const seenMetrics = new Set<string>();

    const emitMetric = (metric: MetricPayload["metric"], value: number) => {
      if (!Number.isFinite(value) || value < 0) return;
      const key = `${route}:${metric}`;
      if (seenMetrics.has(key)) return;
      seenMetrics.add(key);
      logMetric({ route, metric, value: Math.round(value), unit: "ms" });
    };

    const nav = readNavigationTiming();
    if (nav) {
      emitMetric("TTFB", nav.responseStart);
    }

    const paintEntries = performance.getEntriesByType("paint");
    const fcpEntry = paintEntries.find(
      (entry) => entry.name === "first-contentful-paint",
    );
    if (fcpEntry) {
      emitMetric("FCP", fcpEntry.startTime);
    }

    const fcpObserver =
      "PerformanceObserver" in window
        ? new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name === "first-contentful-paint") {
                emitMetric("FCP", entry.startTime);
              }
            }
          })
        : null;

    const lcpObserver =
      "PerformanceObserver" in window
        ? new PerformanceObserver((list) => {
            const lastEntry = list.getEntries().at(-1);
            if (lastEntry) {
              emitMetric("LCP", lastEntry.startTime);
            }
          })
        : null;

    fcpObserver?.observe({ type: "paint", buffered: true });
    lcpObserver?.observe({ type: "largest-contentful-paint", buffered: true });

    const flushLcp = () => {
      const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
      const lastEntry = lcpEntries.at(-1);
      if (lastEntry) {
        emitMetric("LCP", lastEntry.startTime);
      }
    };

    window.addEventListener("pagehide", flushLcp);
    document.addEventListener("visibilitychange", flushLcp);

    return () => {
      fcpObserver?.disconnect();
      lcpObserver?.disconnect();
      window.removeEventListener("pagehide", flushLcp);
      document.removeEventListener("visibilitychange", flushLcp);
    };
  }, [pathname]);

  return null;
}
