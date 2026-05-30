import { Product } from "@/types";
import { Button } from "../ui/button";
import Link from "next/link";
import ProductCard from "../cards/ProductCard";

export function ProductSection({
  title,
  description,
  products,
}: {
  title: string;
  description: string;
  products: Product[];
}) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-stone-100 py-12 sm:py-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
            {title}
          </p>
          <p className="mt-2 text-sm text-stone-500">{description}</p>
        </div>
        <Button asChild variant="outline" className="hover:text-indigo-600 hover:border-indigo-200 transition-colors">
          <Link href="/products">Shop all products</Link>
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={index < 4}
          />
        ))}
      </div>
    </section>
  );
}
