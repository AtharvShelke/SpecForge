"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShop } from "@/context/ShopContext";
import { CartItem, Product } from "@/types";
import { toast } from "@/hooks/use-toast";

interface SharedBuildData {
  id: string;
  variantId?: string;
  quantity: number;
}

export default function SharedBuildPage() {
  const searchParams = useSearchParams();
  const { addToCart, cart } = useShop();
  const [buildData, setBuildData] = useState<SharedBuildData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (!dataParam) {
      setError("No build data found");
      setLoading(false);
      return;
    }

    try {
      const decoded = atob(dataParam);
      const parsed = JSON.parse(decoded) as SharedBuildData[];
      setBuildData(parsed);
      loadProducts(parsed);
    } catch (err) {
      setError("Invalid build data");
      setLoading(false);
    }
  }, [searchParams]);

  const loadProducts = async (buildItems: SharedBuildData[]) => {
    try {
      const productIds = buildItems.map(item => item.id);
      const promises = productIds.map(id => 
        fetch(`/api/storefront/products/${id}`).then(res => {
          if (!res.ok) throw new Error(`Failed to load product ${id}`);
          return res.json();
        })
      );
      
      const loadedProducts = await Promise.all(promises);
      setProducts(loadedProducts);
    } catch (err) {
      setError("Failed to load build components");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAllToCart = () => {
    let addedCount = 0;
    products.forEach((product, index) => {
      const buildItem = buildData[index];
      if (buildItem && product.variants) {
        const variant = buildItem.variantId 
          ? product.variants.find(v => v.id === buildItem.variantId)
          : product.variants[0];
        
        if (variant) {
          for (let i = 0; i < buildItem.quantity; i++) {
            addToCart(product, variant);
            addedCount++;
          }
        }
      }
    });

    toast({
      title: "Build added to cart!",
      description: `${addedCount} items have been added to your cart.`,
    });
  };

  const handleAddToCart = (product: Product, buildItem: SharedBuildData) => {
    const variant = buildItem.variantId 
      ? product.variants?.find(v => v.id === buildItem.variantId)
      : product.variants?.[0];
    
    if (variant) {
      addToCart(product, variant);
    }
  };

  const totalPrice = products.reduce((sum, product, index) => {
    const buildItem = buildData[index];
    const variant = buildItem?.variantId 
      ? product.variants?.find(v => v.id === buildItem.variantId)
      : product.variants?.[0];
    
    return sum + (variant?.price || 0) * (buildItem?.quantity || 1);
  }, 0);

  const exportBuild = () => {
    const buildExport = {
      name: "Shared PC Build",
      created: new Date().toISOString(),
      components: products.map((product, index) => {
        const buildItem = buildData[index];
        const variant = buildItem?.variantId 
          ? product.variants?.find(v => v.id === buildItem.variantId)
          : product.variants?.[0];
        
        return {
          name: product.name,
          category: product.category,
          brand: product.brand?.name,
          price: variant?.price,
          quantity: buildItem?.quantity || 1,
          specs: product.specs,
        };
      }),
      totalPrice,
    };

    const blob = new Blob([JSON.stringify(buildExport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shared_pc_build.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared build...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Build Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button asChild>
            <Link href="/builds/new">Start New Build</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/builds/new"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="size-4" />
            Back to Builder
          </Link>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900">Shared PC Build</h1>
                <p className="text-gray-600 mt-2">
                  {products.length} components • Total: ₹{totalPrice.toLocaleString("en-IN")}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={exportBuild}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button onClick={handleAddAllToCart}>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add All to Cart
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Components List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Components</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {products.map((product, index) => {
              const buildItem = buildData[index];
              const variant = buildItem?.variantId 
                ? product.variants?.find(v => v.id === buildItem.variantId)
                : product.variants?.[0];
              
              const price = variant?.price || 0;
              const quantity = buildItem?.quantity || 1;
              const subtotal = price * quantity;
              
              return (
                <div key={product.id} className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Product Image */}
                    <div className="w-24 h-24 bg-gray-50 rounded-lg border border-gray-200 flex-shrink-0">
                      <img
                        src={product.media?.[0]?.url || "/placeholder.png"}
                        alt={product.name}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                    
                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {product.brand?.name} • {product.category}
                          </p>
                          <p className="text-sm text-gray-500">
                            Quantity: {quantity}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            ₹{price.toLocaleString("en-IN")}
                          </p>
                          <p className="text-sm text-gray-500">
                            × {quantity} = ₹{subtotal.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddToCart(product, buildItem)}
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Total */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-gray-900">
                ₹{totalPrice.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
