import { HomepageCategory } from "@/types";
import { normalizeCatalogProduct } from "./catalogFrontend";
import { useCallback, useState } from "react";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function getNewArrivals() {
  const res = await fetch(`${baseUrl}/api/storefront/new-arrivals`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const products = await res.json();
  return products.map((product: any) => normalizeCatalogProduct(product));
}

export async function getBestSellers() {
  const res = await fetch(`${baseUrl}/api/storefront/best-sellers`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const products = await res.json();
  return products.map((product: any) => normalizeCatalogProduct(product));
}

export async function getHomepageCategories(): Promise<HomepageCategory[]> {
  const res = await fetch(`${baseUrl}/api/storefront/categories`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;

    try {
      const data = await res.json();
      message = data?.error || data?.message || message;
    } catch {
      try {
        message = await res.text();
      } catch {}
    }

    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;

  return res.json();
}

export const refreshAndSyncDetail = async (
  id: string,
  refresh: () => Promise<void>,
  selectedId: string | undefined,
  loadDetail: (id: string) => Promise<void>,
) => {
  await refresh();
  if (selectedId === id) await loadDetail(id);
};
export function useLoadingCounter() {
  const [count, setCount] = useState(0);
  const start = useCallback(() => setCount((c) => c + 1), []);
  const stop = useCallback(() => setCount((c) => Math.max(0, c - 1)), []);
  const loading = count > 0;
  return { loading, start, stop };
}
