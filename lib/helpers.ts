import { HomepageCategory } from "@/types";
import { normalizeCatalogProduct } from "./catalogFrontend";

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
