"use client";

import React, { useState, useMemo, useEffect, memo, useCallback, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useAdmin } from "@/context/AdminContext";
import {
  Brand,
  Category,
  Product,
  ProductSpecsFlat,
  specsToFlat,
  flatToSpecs,
  ProductSpec,
} from "@/types";
import { CATEGORY_NAMES } from "@/lib/categoryUtils";
import {
  Edit,
  Plus,
  Trash,
  AlertCircle,
  Package,
  DollarSign,
  Search,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  X,
  LayoutGrid,
  Settings2,
  Save,
  ArrowLeft,
  Tag,
  TrendingUp,
  BarChart3,
  Star,
  RefreshCw,
  ChevronDown,
  SlidersHorizontal,
  Loader2,
  Warehouse,
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import ImageUploader from "../uploadthing/ImageUploader";
import { cn } from "@/lib/utils";
import { fetchCatalogProducts } from "@/lib/catalogFrontend";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

// ─────────────────────────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────────────────────────

const SectionLabel = memo(
  ({
    icon,
    children,
  }: {
    icon: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div className="flex items-center gap-2 text-slate-700">
      <span className="text-slate-400">{icon}</span>
      <span className="text-sm font-semibold">{children}</span>
    </div>
  ),
);
SectionLabel.displayName = "SectionLabel";

const FieldLabel = memo(
  ({
    children,
    required,
  }: {
    children: React.ReactNode;
    required?: boolean;
  }) => (
    <label className="mb-1.5 block text-xs font-medium text-slate-700">
      {children}
      {required && <span className="ml-0.5 text-rose-500">*</span>}
    </label>
  ),
);
FieldLabel.displayName = "FieldLabel";

function getVariantStock(variant: unknown): number {
  const rawInventoryItems =
    variant && typeof variant === "object" && "inventoryItems" in variant
      ? (variant as { inventoryItems?: unknown }).inventoryItems
      : undefined;

  const items: Array<{
    quantityOnHand?: number | null;
    quantityReserved?: number | null;
  }> = Array.isArray(rawInventoryItems)
      ? (rawInventoryItems as Array<{
        quantityOnHand?: number | null;
        quantityReserved?: number | null;
      }>)
      : [];
  return items.reduce((sum: number, item) => {
    const onHand = Number(item?.quantityOnHand ?? 0);
    const reserved = Number(item?.quantityReserved ?? 0);
    return sum + Math.max(0, onHand - reserved);
  }, 0);
}

const StockPill = memo(
  ({ product, variant }: { product: Product; variant: any }) => {
    const totalStock = getVariantStock(variant);
    if (totalStock <= 0)
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" />
          Out of Stock
        </span>
      );
    if (totalStock <= 5)
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" />
          Low Stock
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" />
        In Stock
      </span>
    );
  },
);
StockPill.displayName = "StockPill";

const CollapsibleSection = memo(
  ({
    icon,
    title,
    children,
    defaultOpen = true,
  }: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
  }) => {
    const [open, setOpen] = useState(defaultOpen);
    const toggle = useCallback(() => setOpen((o) => !o), []);
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          className={cn(
            "flex w-full items-center justify-between bg-white px-4 py-3 transition-colors hover:bg-slate-50",
            open && "border-b border-slate-200",
          )}
          onClick={toggle}
        >
          <SectionLabel icon={icon}>{title}</SectionLabel>
          <ChevronDown
            size={16}
            className={cn(
              "text-slate-400 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
        {open && <div>{children}</div>}
      </div>
    );
  },
);
CollapsibleSection.displayName = "CollapsibleSection";

const DesktopProductRow = memo(
  ({
    product,
    onEdit,
    onDelete,
  }: {
    product: Product;
    onEdit: (p: Product) => void;
    onDelete: (id: string) => void;
  }) => {
    const firstVar = product.variants?.[0];
    const brand =
      product.brand?.name ||
      product.specs?.find((s: any) => s.key === "brand")?.value ||
      "Generic";
    const variantCount = product.variants?.length || 0;
    const totalStock = getVariantStock(firstVar);
    const price = (firstVar?.price || 0).toLocaleString("en-IN");

    const handleEdit = useCallback(() => onEdit(product), [onEdit, product]);
    const handleDelete = useCallback(
      () => onDelete(product.id),
      [onDelete, product.id],
    );

    return (
      <tr className="group transition-colors hover:bg-slate-50/50">
        <td className="px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white">
              <img
                className="h-full w-full object-contain p-1"
                src={product.media?.[0]?.url || "/placeholder.png"}
                alt={product.name}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://picsum.photos/300/300";
                }}
              />
            </div>
            <div className="min-w-0">
              <p
                className="truncate text-sm font-medium text-slate-900"
                title={product.name}
              >
                {product.name}
              </p>
              <p className="mt-0.5 font-mono text-xs text-slate-500">
                {firstVar?.sku || "NO-SKU"}
              </p>
            </div>
          </div>
        </td>
        <td className="whitespace-nowrap px-5 py-3">
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
            {product.category}
          </span>
        </td>
        <td className="hidden whitespace-nowrap px-5 py-3 text-sm font-medium text-slate-600 md:table-cell">
          {brand}
        </td>
        <td className="hidden whitespace-nowrap px-5 py-3 lg:table-cell">
          <span className="font-mono text-sm text-slate-600 tabular-nums">
            {variantCount} var{variantCount !== 1 ? "s" : ""}
          </span>
        </td>
        <td className="whitespace-nowrap px-5 py-3 text-right">
          <span className="font-mono text-sm font-medium text-slate-900 tabular-nums">
            ₹{price}
          </span>
        </td>
        <td className="whitespace-nowrap px-5 py-3 text-right">
          <div className="flex flex-col items-end gap-1">
            <StockPill product={product} variant={firstVar} />
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {totalStock} units
            </span>
          </div>
        </td>
        <td className="whitespace-nowrap px-5 py-3 text-right">
          <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={handleEdit}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <Edit size={14} />
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600">
                  <Trash size={14} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-lg border-slate-200 bg-white p-0 shadow-lg sm:max-w-md">
                <AlertDialogHeader className="border-b border-slate-100 px-6 pb-4 pt-6">
                  <AlertDialogTitle className="text-lg font-semibold text-slate-900">
                    Delete product?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-sm text-slate-500">
                    This cannot be undone.{" "}
                    <span className="font-medium text-slate-900">
                      {product.name}
                    </span>{" "}
                    will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="bg-slate-50 px-6 py-4 border-t border-slate-100">
                  <AlertDialogCancel className="rounded-md border-slate-200 text-slate-700 hover:bg-slate-100">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="rounded-md bg-rose-600 font-medium text-white hover:bg-rose-700"
                    onClick={handleDelete}
                  >
                    Delete Permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </td>
      </tr>
    );
  },
);
DesktopProductRow.displayName = "DesktopProductRow";

const MobileProductCard = memo(
  ({
    product,
    onEdit,
    onDelete,
  }: {
    product: Product;
    onEdit: (p: Product) => void;
    onDelete: (id: string) => void;
  }) => {
    const firstVar = product.variants?.[0];
    const totalStock = getVariantStock(firstVar);
    const price = (firstVar?.price || 0).toLocaleString("en-IN");

    const handleEdit = useCallback(() => onEdit(product), [onEdit, product]);
    const handleDelete = useCallback(
      () => onDelete(product.id),
      [onDelete, product.id],
    );

    return (
      <div className="flex items-center gap-3 px-4 py-4 hover:bg-slate-50/50 border-b border-slate-100 last:border-0">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white">
          <img
            className="h-full w-full object-contain p-1"
            src={product.media?.[0]?.url || "/placeholder.png"}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://picsum.photos/300/300";
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">
            {product.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
              {product.category}
            </span>
            <StockPill product={product} variant={firstVar} />
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="font-mono text-sm font-medium text-slate-900 tabular-nums">
              ₹{price}
            </span>
            <span className="font-mono text-xs text-slate-500">
              {totalStock} units
            </span>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            onClick={handleEdit}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50"
          >
            <Edit size={14} />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600">
                <Trash size={14} />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-lg border-slate-200 bg-white p-0 shadow-lg sm:max-w-md">
              <AlertDialogHeader className="border-b border-slate-100 px-6 pb-4 pt-6">
                <AlertDialogTitle className="text-lg font-semibold text-slate-900">
                  Delete product?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-slate-500">
                  <span className="font-medium text-slate-900">
                    {product.name}
                  </span>{" "}
                  will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="bg-slate-50 px-6 py-4 border-t border-slate-100">
                <AlertDialogCancel className="rounded-md border-slate-200 text-slate-700 hover:bg-slate-100">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-md bg-rose-600 font-medium text-white hover:bg-rose-700"
                  onClick={handleDelete}
                >
                  Delete Permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );
  },
);
MobileProductCard.displayName = "MobileProductCard";

interface ProductFormState extends Omit<Partial<Product>, "specs"> {
  specs: ProductSpecsFlat;
  price?: number;
  stock?: number;
  sku?: string;
  images: string[];
  subCategoryId?: string;
}

type ProductSchemaAttribute = {
  key: string;
  label: string;
  type: string;
  options?: string[];
  required?: boolean;
  unit?: string;
  dependencyKey?: string;
  dependencyValue?: string;
};

type ProductSchema = {
  category: string;
  attributes: ProductSchemaAttribute[];
};

const EMPTY_FORM: ProductFormState = {
  id: "",
  sku: "",
  name: "",
  price: 0,
  stock: 0,
  category: CATEGORY_NAMES.PROCESSOR,
  images: ["https://picsum.photos/300/300"],
  specs: { brand: "" },
  description: "",
};

const ProductMediaUploader = React.memo(function ProductMediaUploader({
  onUploadComplete,
  minimal = false,
  onUploadStart,
  onProgress,
}: {
  onUploadComplete: (url: string) => void;
  minimal?: boolean;
  onUploadStart?: () => void;
  onProgress?: (p: number) => void;
}) {
  return (
    <ImageUploader
      onUploadComplete={onUploadComplete}
      endpoint="imageUploader"
      minimal={minimal}
      onUploadStart={onUploadStart}
      onProgress={onProgress}
    />
  );
});

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const ProductManager = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    categories,
    subCategories,
    brands,
    schemas,
    syncData,
    isLoading,
  } = useAdmin() as unknown as {
    products: Product[];
    addProduct: (...args: any[]) => Promise<void>;
    updateProduct: (...args: any[]) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    categories: Array<Category | string>;
    subCategories: any[];
    brands: Brand[];
    schemas: ProductSchema[];
    syncData: () => Promise<void>;
    isLoading: boolean;
  };

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [isMediaUploading, setIsMediaUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [paginatedProducts, setPaginatedProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const currentLimit = parseInt(searchParams.get("limit") || "0", 10);
  const currentCategory = searchParams.get("category") || "all";
  const currentSearchQuery = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(currentSearchQuery);
  const debouncedSearch = useDebounce(searchTerm, 500);
  const currentStockStatus = searchParams.get("f_stock_status") || "all";
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";
  const categoryOptions = useMemo(
    () =>
      (categories ?? [])
        .map((category) =>
          typeof category === "string" ? category : category.name,
        )
        .filter(Boolean),
    [categories],
  );

  const [showDetail, setShowDetail] = useState(false);

  const searchParamsStr = searchParams.toString();

  useEffect(() => {
    if (debouncedSearch !== currentSearchQuery)
      updateQueryParams({ q: debouncedSearch });
  }, [debouncedSearch]);

  useEffect(() => {
    if (isEditing) return;
    let cancelled = false;
    const fetchPaginatedProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const query = new URLSearchParams(searchParamsStr);
        if (!query.has("page")) query.set("page", "1");
        const data = await fetchCatalogProducts(query);
        if (!cancelled) {
          setPaginatedProducts(data.products);
          setTotalProducts(data.total);
        }
      } catch (err) {
        console.error("Failed to fetch paginated products:", err);
      } finally {
        if (!cancelled) setIsLoadingProducts(false);
      }
    };
    fetchPaginatedProducts();
    return () => {
      cancelled = true;
    };
  }, [searchParamsStr, isEditing, refreshTrigger]);

  const updateQueryParams = useCallback(
    (newParams: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      if (
        !newParams.page &&
        (newParams.category !== undefined ||
          newParams.q !== undefined ||
          newParams.f_stock_status !== undefined ||
          newParams.minPrice !== undefined ||
          newParams.maxPrice !== undefined)
      ) {
        params.set("page", "1");
      }
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null || value === "all" || value === "")
          params.delete(key);
        else params.set(key, value);
      });
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router],
  );

  const [currentProduct, setCurrentProduct] =
    useState<ProductFormState>(EMPTY_FORM);
  const [newProductCost, setNewProductCost] = useState(0);

  const currentSchema = useMemo(() => {
    const schema = schemas.find((s) => s.category === currentProduct.category);
    if (!schema) return [];
    return schema.attributes.filter((attr) => {
      if (!attr.dependencyKey) return true;
      const depVal =
        currentProduct.specs?.[
        attr.key === "socket" ? "brand" : attr.dependencyKey
        ];
      return Array.isArray(depVal)
        ? depVal.includes(attr.dependencyValue || "")
        : depVal === attr.dependencyValue;
    });
  }, [currentProduct.category, currentProduct.specs, schemas]);

  const availableBrands = useMemo(
    () =>
      brands.filter((b) =>
        b.categories?.includes(currentProduct.category || ""),
      ),
    [currentProduct.category, brands],
  );

  const availableSubCategories = useMemo(
    () =>
      (subCategories ?? []).filter(
        (sub) => sub.category?.name === currentProduct.category,
      ),
    [subCategories, currentProduct.category],
  );

  const handleUploadComplete = useCallback((url: string) => {
    setPreviewUrl(url);
    setTimeout(() => {
      setCurrentProduct((prev) => ({
        ...prev,
        images: [
          ...prev.images.filter(
            (img) => img !== "https://picsum.photos/300/300",
          ),
          url,
        ],
      }));
    }, 0);
  }, []);

  const generateSKU = useCallback((product: ProductFormState): string => {
    if (product.sku?.trim()) return product.sku.trim();
    const catPrefix = product.category?.substring(0, 3).toUpperCase() || "PRD";
    const brandPrefix =
      String(product.specs?.brand || "")
        .substring(0, 3)
        .toUpperCase() || "XXX";
    return `${catPrefix}-${brandPrefix}-${Date.now().toString().slice(-6)}`;
  }, []);

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentProduct.name?.trim()) {
        alert("Product name is required");
        return;
      }
      if (!currentProduct.specs?.brand) {
        alert("Brand is required");
        return;
      }
      const apiSpecs = flatToSpecs(currentProduct.specs) as ProductSpec[];
      const parsedStock = Math.max(0, Number(currentProduct.stock ?? 0));
      if (
        currentProduct.id &&
        products.find((p) => p.id === currentProduct.id)
      ) {
        await updateProduct({
          ...currentProduct,
          specs: apiSpecs,
          price: currentProduct.price,
          stock: parsedStock,
          images: currentProduct.images,
          costPrice: newProductCost,
          subCategoryId: currentProduct.subCategoryId,
        } as any);
      } else {
        const newProduct: Product = {
          ...currentProduct,
          id: `prod-${Date.now()}`,
          sku: generateSKU(currentProduct),
          name: currentProduct.name || "",
          price: currentProduct.price || 0,
          stock: parsedStock,
          category:
            currentProduct.category ||
            categoryOptions[0] ||
            CATEGORY_NAMES.PROCESSOR,
          images:
            currentProduct.images.length > 0
              ? currentProduct.images
              : ["https://picsum.photos/300/300"],
          description: currentProduct.description || "",
          specs: apiSpecs,
          costPrice: newProductCost,
          subCategoryId: currentProduct.subCategoryId,
        } as Product;
        await addProduct(newProduct, parsedStock, newProductCost);
      }
      setRefreshTrigger((p) => !p);
      setIsEditing(false);
      resetForm();
    },
    [
      currentProduct,
      products,
      updateProduct,
      addProduct,
      newProductCost,
      generateSKU,
      categoryOptions,
    ],
  );

  const handleEdit = useCallback((product: Product) => {
    const firstVariant = product.variants?.[0];
    const mainStock = getVariantStock(firstVariant);
    setCurrentProduct({
      ...product,
      sku: firstVariant?.sku || "",
      price: firstVariant?.price || 0,
      stock: mainStock,
      images: product.media?.length
        ? product.media.map((m: any) => m.url)
        : [product.image || "https://picsum.photos/300/300"],
      specs: specsToFlat(product.specs),
      subCategoryId: product.subCategoryId || "",
    });
    setPreviewUrl(product.media?.[0]?.url || product.image || null);
    setIsEditing(true);
  }, []);

  const handleDelete = useCallback(
    async (productId: string) => {
      await deleteProduct(productId);
      setRefreshTrigger((p) => !p);
    },
    [deleteProduct],
  );

  const resetForm = useCallback(() => {
    setCurrentProduct(EMPTY_FORM);
    setNewProductCost(0);
    setPreviewUrl(null);
    setNewSpecKey("");
    setNewSpecValue("");
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    resetForm();
  }, [resetForm]);
  const handleAddNew = useCallback(() => {
    resetForm();
    setIsEditing(true);
  }, [resetForm]);

  const handleCategoryChange = useCallback((val: string) => {
    setCurrentProduct((prev) => ({
      ...prev,
      category: val,
      subCategoryId: "",
      specs: { brand: "" },
    }));
  }, []);

  const handleSpecChange = useCallback(
    (key: string, value: string | number | string[]) => {
      setCurrentProduct((prev) => {
        let newSpecs = { ...prev.specs, [key]: value };
        const schema = schemas.find((s) => s.category === prev.category);
        if (schema) {
          schema.attributes.forEach((attr) => {
            const depKey = attr.key === "socket" ? "brand" : attr.dependencyKey;
            if (depKey === key) {
              const isSatisfied = Array.isArray(value)
                ? value.includes(attr.dependencyValue || "")
                : value === attr.dependencyValue;
              if (!isSatisfied && newSpecs[attr.key] !== undefined)
                delete newSpecs[attr.key];
            }
          });
        }
        return { ...prev, specs: newSpecs };
      });
    },
    [schemas],
  );

  const handleMultiSelectToggle = useCallback((key: string, option: string) => {
    setCurrentProduct((prev) => {
      const curr = (prev.specs?.[key] as string[]) || [];
      const next = curr.includes(option)
        ? curr.filter((v) => v !== option)
        : [...curr, option];
      return { ...prev, specs: { ...prev.specs, [key]: next } };
    });
  }, []);

  const addCustomSpec = useCallback(() => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      handleSpecChange(newSpecKey.trim(), newSpecValue.trim());
      setNewSpecKey("");
      setNewSpecValue("");
    }
  }, [newSpecKey, newSpecValue, handleSpecChange]);

  const removeCustomSpec = useCallback((key: string) => {
    setCurrentProduct((prev) => {
      const newSpecs = { ...prev.specs };
      delete newSpecs[key];
      return { ...prev, specs: newSpecs };
    });
  }, []);

  
  const handleSyncData = useCallback(() => syncData(), [syncData]);
  const handleCloseDetail = useCallback(() => setShowDetail(false), []);
  const handleOpenDetail = useCallback(() => setShowDetail(true), []);
  const handleClearFilters = useCallback(
    () => router.push(pathname),
    [router, pathname],
  );

  const activeSchemaSpecs = useMemo(
    () =>
      currentSchema.filter(
        (attr) =>
          attr.required || currentProduct.specs?.[attr.key] !== undefined,
      ),
    [currentSchema, currentProduct.specs],
  );

  const schemaKeys = useMemo(
    () => currentSchema.map((attr) => attr.key),
    [currentSchema],
  );

  const customSpecs = useMemo(
    () =>
      Object.entries(currentProduct.specs || {}).filter(
        ([key]) => !schemaKeys.includes(key) && key !== "brand",
      ),
    [currentProduct.specs, schemaKeys],
  );

  const {
    totalCatalogValue,
    outOfStockCount,
    categoryCount,
    brandCount,
    categoryBreakdown,
    brandBreakdown,
    priceRange,
  } = useMemo(() => {
    let totalVal = 0;
    let outOfStock = 0;
    const catMap: Record<string, { count: number; value: number }> = {};
    const brandMap: Record<string, number> = {};
    const catSet = new Set<string>();
    const brandSet = new Set<string>();
    const prices: number[] = [];

    for (const p of products ?? []) {
      const firstVar = p.variants?.[0];
      const price = firstVar?.price || 0;
      totalVal += price;
      if (price > 0) prices.push(price);

      const stock = getVariantStock(firstVar);
      if (!firstVar || stock <= 0) outOfStock++;

      const cat = p.category || "Other";
      catSet.add(cat);
      if (!catMap[cat]) catMap[cat] = { count: 0, value: 0 };
      catMap[cat].count++;
      catMap[cat].value += price;

      const b = p.brand?.name || "Generic";
      if (p.brand?.name) brandSet.add(p.brand.name);
      brandMap[b] = (brandMap[b] || 0) + 1;
    }

    const sortedCats = Object.entries(catMap).sort(
      (a, b) => b[1].count - a[1].count,
    );
    const sortedBrands = Object.entries(brandMap).sort((a, b) => b[1] - a[1]);

    const priceMin = prices.length ? Math.min(...prices) : 0;
    const priceMax = prices.length ? Math.max(...prices) : 0;
    const priceAvg = prices.length
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : 0;

    return {
      totalCatalogValue: totalVal,
      outOfStockCount: outOfStock,
      categoryCount: catSet.size,
      brandCount: brandSet.size,
      categoryBreakdown: sortedCats,
      brandBreakdown: sortedBrands,
      priceRange: { min: priceMin, max: priceMax, avg: priceAvg },
    };
  }, [products]);

  const avgPriceFormatted =
    priceRange.avg > 999999
      ? `₹${(priceRange.avg / 100000).toFixed(1)}L`
      : `₹${priceRange.avg.toLocaleString("en-IN")}`;
  const totalValueFormatted =
    totalCatalogValue > 999999
      ? `₹${(totalCatalogValue / 100000).toFixed(1)}L`
      : `₹${totalCatalogValue.toLocaleString("en-IN")}`;
  const minPriceFormatted = `₹${priceRange.min.toLocaleString("en-IN")}`;

  const profitMargin = useMemo(() => {
    if (newProductCost <= 0 || !currentProduct.price) return null;
    return Math.round(
      (((currentProduct.price || 0) - newProductCost) /
        (currentProduct.price || 1)) *
      100,
    );
  }, [newProductCost, currentProduct.price]);

  // ─────────────────────────────────────────────────────────
  // EDIT VIEW
  // ─────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div className="space-y-6 pb-20">
        {/* ─── EDIT HEADER ─── */}
        <div className="sticky top-0 z-20 -mt-2 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {currentProduct.id ? "Edit Product" : "New Product"}
              </h2>
              <p className="hidden text-sm text-slate-500 md:block">
                {currentProduct.id
                  ? `Editing: ${currentProduct.name}`
                  : "Add a new item to your catalogue"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleCancel}
              className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ArrowLeft size={14} />
              <span className="hidden xs:inline">Back</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex h-9 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              <Save size={14} /> Save Product
            </button>
          </div>
        </div>

        {/* ─── MAIN FORM GRID ─── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ── LEFT: General + Specs ── */}
          <div className="space-y-6 lg:col-span-2">
            {/* General Information */}
            <CollapsibleSection
              icon={<LayoutGrid size={16} />}
              title="General Details"
            >
              <div className="p-5">
                <form id="product-form" className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2 md:col-span-1">
                      <FieldLabel required>Product Name</FieldLabel>
                      <Input
                        required
                        value={currentProduct.name}
                        onChange={(e) =>
                          setCurrentProduct((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Identifying name..."
                        className="h-10 rounded-md border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <FieldLabel>Variant SKU</FieldLabel>
                      <Input
                        value={currentProduct.sku}
                        onChange={(e) =>
                          setCurrentProduct((prev) => ({
                            ...prev,
                            sku: e.target.value,
                          }))
                        }
                        placeholder="SKU-XXXXX"
                        className="h-10 font-mono rounded-md border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <FieldLabel required>Category</FieldLabel>
                      <Select
                        value={currentProduct.category}
                        onValueChange={handleCategoryChange}
                      >
                        <SelectTrigger className="h-10 rounded-md border-slate-200 bg-white text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-slate-200 bg-white">
                          {categoryOptions.map((cat: string) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <FieldLabel required>Subcategory</FieldLabel>
                      <Select
                        value={currentProduct.subCategoryId || ""}
                        onValueChange={(val) =>
                          setCurrentProduct((prev) => ({
                            ...prev,
                            subCategoryId: val,
                          }))
                        }
                        disabled={!currentProduct.category}
                      >
                        <SelectTrigger className="h-10 rounded-md border-slate-200 bg-white text-sm">
                          <SelectValue placeholder="Select subcategory..." />
                        </SelectTrigger>
                        <SelectContent className="border-slate-200 bg-white">
                          {availableSubCategories.map((sub: any) => (
                            <SelectItem key={sub.id} value={sub.id}>
                              {sub.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <FieldLabel required>Brand</FieldLabel>
                      <Select
                        value={(currentProduct.specs?.brand as string) || ""}
                        onValueChange={(val) => handleSpecChange("brand", val)}
                      >
                        <SelectTrigger className="h-10 rounded-md border-slate-200 bg-white text-sm">
                          <SelectValue placeholder="Select brand..." />
                        </SelectTrigger>
                        <SelectContent className="border-slate-200 bg-white">
                          {availableBrands.map((brand: Brand) => (
                            <SelectItem key={brand.id} value={brand.name}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2">
                      <FieldLabel>Description</FieldLabel>
                      <Textarea
                        value={currentProduct.description ?? ""}
                        onChange={(e) =>
                          setCurrentProduct((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Enter technical details and overview..."
                        className="min-h-[100px] resize-none rounded-md border-slate-200 text-sm"
                      />
                    </div>
                  </div>
                </form>
              </div>
            </CollapsibleSection>

            {/* Specifications */}
            <CollapsibleSection
              icon={<Settings2 size={16} />}
              title="Specifications"
            >
              <div className="space-y-6 p-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {activeSchemaSpecs.map((attr: ProductSchemaAttribute) => (
                    <div key={attr.key}>
                      <FieldLabel required={attr.required}>
                        {attr.label}
                        {attr.unit && (
                          <span className="ml-1 text-slate-400 normal-case">
                            ({attr.unit})
                          </span>
                        )}
                      </FieldLabel>
                      {attr.type === "multi-select" ? (
                        <div className="flex flex-wrap gap-2">
                          {attr.options?.map((option: string) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() =>
                                handleMultiSelectToggle(attr.key, option)
                              }
                              className={cn(
                                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                                (
                                  (currentProduct.specs?.[
                                    attr.key
                                  ] as string[]) || []
                                ).includes(option)
                                  ? "border-slate-900 bg-slate-900 text-white"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                              )}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <Input
                          type={attr.type === "number" ? "number" : "text"}
                          className="h-10 rounded-md border-slate-200 text-sm"
                          value={
                            currentProduct.specs?.[attr.key] == null
                              ? ""
                              : String(currentProduct.specs[attr.key])
                          }
                          onChange={(e) =>
                            handleSpecChange(
                              attr.key,
                              attr.type === "number"
                                ? Number(e.target.value)
                                : e.target.value,
                            )
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-5 space-y-4">
                  <SectionLabel icon={<Plus size={16} />}>
                    Custom Specifications
                  </SectionLabel>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {customSpecs.map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2"
                      >
                        <span className="w-16 shrink-0 truncate font-mono text-xs text-slate-500">
                          {key}
                        </span>
                        <Input
                          className="h-8 flex-1 rounded-md border-slate-200 bg-white text-sm"
                          value={String(value)}
                          onChange={(e) =>
                            handleSpecChange(key, e.target.value)
                          }
                        />
                        <button
                          onClick={() => removeCustomSpec(key)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 sm:flex-row">
                    <Input
                      placeholder="Spec Name (e.g. Weight)"
                      className="h-9 flex-1 rounded-md border-slate-200 text-sm bg-white"
                      value={newSpecKey}
                      onChange={(e) => setNewSpecKey(e.target.value)}
                    />
                    <Input
                      placeholder="Value (e.g. 1.2kg)"
                      className="h-9 flex-1 rounded-md border-slate-200 text-sm bg-white"
                      value={newSpecValue}
                      onChange={(e) => setNewSpecValue(e.target.value)}
                    />
                    <button
                      onClick={addCustomSpec}
                      className="h-9 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          </div>

          {/* ─── RIGHT: Media + Pricing + Inventory ─── */}
          <div className="space-y-6">
            {/* ─── PRODUCT MEDIA SECTION ─── */}
            <CollapsibleSection
              icon={<ImageIcon size={16} />}
              title="Product Media"
            >
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  {currentProduct.images.map((img, index) => (
                    <div
                      key={index}
                      className={cn(
                        "group relative aspect-square overflow-hidden rounded-md border bg-white transition-all",
                        index === 0
                          ? "border-slate-400"
                          : "border-slate-200 hover:border-slate-300",
                      )}
                    >
                      <img
                        src={img}
                        className="h-full w-full object-contain p-2"
                        alt={`Product view ${index + 1}`}
                        loading="lazy"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newImages = currentProduct.images.filter(
                            (_, i) => i !== index,
                          );
                          setCurrentProduct((prev) => ({
                            ...prev,
                            images: newImages.length > 0 ? newImages : [],
                          }));
                        }}
                        className="absolute right-2 top-2 rounded-md bg-white p-1.5 text-slate-400 opacity-0 shadow-sm transition-opacity hover:text-rose-600 group-hover:opacity-100 border border-slate-200"
                      >
                        <Trash size={14} />
                      </button>

                      {index === 0 && (
                        <div className="absolute bottom-2 left-2 rounded bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-white">
                          Primary
                        </div>
                      )}
                    </div>
                  ))}
                  <div
                    className={cn(
                      "group relative flex aspect-square flex-col items-center justify-center rounded-md border-2 border-dashed transition-colors overflow-hidden",
                      isMediaUploading
                        ? "border-slate-300 bg-slate-50 cursor-wait"
                        : "border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-slate-100",
                    )}
                  >
                    {isMediaUploading ? (
                      <div className="flex flex-col items-center gap-2 pointer-events-none">
                        <Loader2
                          size={24}
                          className="animate-spin text-slate-600"
                        />
                        <div className="text-center">
                          <p className="text-xs font-medium text-slate-700">
                            Uploading
                          </p>
                          <p className="font-mono text-xs text-slate-500">
                            {uploadProgress}%
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
                        <Plus size={24} className="text-slate-400" />
                        <span className="text-xs font-medium text-slate-500">
                          Add Media
                        </span>
                      </div>
                    )}
                    <ProductMediaUploader
                      minimal
                      onUploadStart={() => setIsMediaUploading(true)}
                      onProgress={(p) => setUploadProgress(p)}
                      onUploadComplete={(url) => {
                        setIsMediaUploading(false);
                        setUploadProgress(0);
                        handleUploadComplete(url);
                      }}
                    />
                  </div>
                </div>
                <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">Pro Tip:</span>{" "}
                    The first image in the grid is automatically set as your
                    primary thumbnail across the store.
                  </p>
                </div>
              </div>
            </CollapsibleSection>

            {/* Pricing & Stock Card */}
            <CollapsibleSection
              icon={<DollarSign size={16} />}
              title="Price & Inventory"
            >
              <div className="space-y-5 p-5">
                <div className="space-y-4">
                  <div>
                    <FieldLabel required>Selling Price (₹)</FieldLabel>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-400">
                        ₹
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-10 rounded-md border-slate-200 pl-7 font-mono text-sm"
                        value={currentProduct.price}
                        onChange={(e) =>
                          setCurrentProduct((prev) => ({
                            ...prev,
                            price: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Initial Stock Hint</FieldLabel>
                    <Input
                      type="number"
                      min={0}
                      className="h-10 rounded-md border-slate-200 font-mono text-sm"
                      value={currentProduct.stock ?? 0}
                      onChange={(e) =>
                        setCurrentProduct((prev) => ({
                          ...prev,
                          stock: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
                {profitMargin !== null && (
                  <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-slate-700">
                      <TrendingUp size={16} />
                      <span className="text-sm font-medium">
                        Est. Margin
                      </span>
                    </div>
                    <span className="font-mono text-sm font-semibold text-slate-900">
                      {profitMargin}%
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-sm text-slate-500">
                    Serial numbers and part numbers are managed strictly within
                    Inventory. Create the product here, then add physical units
                    from the inventory page.
                  </p>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // LIST VIEW
  // ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
    
      {/* ─── KPI CARDS ─── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Total Catalogue",
            value: products.length,
            sub: (
              <button
                onClick={handleOpenDetail}
                className="flex items-center gap-1 hover:text-slate-900 transition-colors"
              >
                <span>
                  {categoryCount} cat · {brandCount} brands
                </span>
                <ChevronRight size={12} />
              </button>
            ),
            icon: <Package size={16} />,
          },
          {
            label: "Average Price",
            value: avgPriceFormatted,
            sub: `Min ${minPriceFormatted}`,
            icon: <DollarSign size={16} />,
          },
          {
            label: "Out of Stock",
            value: outOfStockCount,
            sub: "Requires attention",
            icon: <AlertCircle size={16} />,
            alert: outOfStockCount > 0,
          },
          {
            label: "Total Value",
            value: totalValueFormatted,
            sub: "Catalogue Sum",
            icon: <TrendingUp size={16} />,
          },
        ].map((card, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {card.label}
                </p>
                <p className="mt-1.5 text-2xl font-semibold text-slate-900">
                  {card.value}
                </p>
                <div className="mt-1 text-xs text-slate-500">
                  {card.sub}
                </div>
              </div>
              <div
                className={cn(
                  "rounded-md p-2",
                  (card as any).alert
                    ? "bg-rose-50 text-rose-600"
                    : "bg-slate-50 text-slate-500",
                )}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── INSIGHTS ROW ─── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Category Breakdown */}
        <div className="flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <SectionLabel icon={<Tag size={16} />}>SKUs by Category</SectionLabel>
            <button
              onClick={handleOpenDetail}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              View All
            </button>
          </div>
          <ScrollArea className="h-[220px]">
            <div className="p-5">
              {categoryBreakdown.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  No data available
                </div>
              ) : (
                <div className="space-y-5">
                  {categoryBreakdown.map(([cat, data], idx) => {
                    const pct =
                      products.length > 0
                        ? Math.round((data.count / products.length) * 100)
                        : 0;
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">
                            {cat}
                          </span>
                          <span className="font-medium text-slate-900">
                            {data.count} <span className="text-slate-400 font-normal ml-1">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-slate-800"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Brand Breakdown */}
        <div className="flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <SectionLabel icon={<Star size={16} />}>Top Brands</SectionLabel>
            <button
              onClick={handleOpenDetail}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              View All
            </button>
          </div>
          <ScrollArea className="h-[220px]">
            <div className="p-5">
              {brandBreakdown.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  No data available
                </div>
              ) : (
                <div className="space-y-5">
                  {brandBreakdown.slice(0, 10).map(([brand, count], idx) => {
                    const pct =
                      products.length > 0
                        ? Math.round((count / products.length) * 100)
                        : 0;
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">
                            {brand}
                          </span>
                          <span className="font-medium text-slate-900">
                            {count} <span className="text-slate-400 font-normal ml-1">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-slate-800"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* ─── PRODUCT TABLE ─── */}
      <div className="flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="border-b border-slate-200 bg-white p-4 space-y-4">
          <div className="flex items-center justify-between">
            <SectionLabel icon={<Package size={16} />}>
              Catalogue <span className="ml-2 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{totalProducts}</span>
            </SectionLabel>
           <div className='flex gap-2'>
             
            <button
              onClick={handleAddNew}
              className="flex h-9 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              <Plus size={14} />
              <span>Add Product</span>
            </button>
           </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                placeholder="Search catalogue..."
                className="h-10 rounded-md border-slate-200 pl-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {showFilters && (
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  value={currentCategory}
                  onValueChange={(val) => updateQueryParams({ category: val })}
                >
                  <SelectTrigger className="h-10 w-full sm:w-[160px] rounded-md border-slate-200 text-sm">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categoryOptions.map((cat: string) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={currentStockStatus}
                  onValueChange={(val) =>
                    updateQueryParams({ f_stock_status: val })
                  }
                >
                  <SelectTrigger className="h-10 w-full sm:w-[160px] rounded-md border-slate-200 text-sm">
                    <SelectValue placeholder="Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Availability</SelectItem>
                    <SelectItem value="In Stock">In Stock</SelectItem>
                    <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3">
                  <DollarSign size={14} className="text-slate-400" />
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-16 bg-transparent text-sm font-medium outline-none placeholder:font-normal placeholder:text-slate-400"
                    value={currentMinPrice}
                    onChange={(e) =>
                      updateQueryParams({ minPrice: e.target.value })
                    }
                  />
                  <span className="text-slate-300">—</span>
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-16 bg-transparent text-sm font-medium outline-none placeholder:font-normal placeholder:text-slate-400"
                    value={currentMaxPrice}
                    onChange={(e) =>
                      updateQueryParams({ maxPrice: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-xs text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Brand</th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">Variants</th>
                <th className="px-5 py-3 text-right font-medium">Price</th>
                <th className="px-5 py-3 text-right font-medium">Stock</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoadingProducts ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    Loading products…
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <Package
                      size={24}
                      className="mx-auto mb-3 text-slate-400"
                    />
                    <p className="mb-2 text-slate-500">No products found</p>
                    <button
                      onClick={handleClearFilters}
                      className="text-sm font-medium text-slate-900 hover:underline"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => (
                  <DesktopProductRow
                    key={product.id}
                    product={product}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="divide-y divide-slate-100 sm:hidden">
          {isLoadingProducts ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading products…
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="p-12 text-center">
              <Package size={24} className="mx-auto mb-3 text-slate-400" />
              <p className="mb-2 text-sm text-slate-500">No products found</p>
              <button
                onClick={handleClearFilters}
                className="text-sm font-medium text-slate-900 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            paginatedProducts.map((product) => (
              <MobileProductCard
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {!isLoadingProducts && totalProducts > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3">
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">
                {(currentPage - 1) * currentLimit + 1}
              </span>
              {" - "}
              <span className="font-medium text-slate-900">
                {Math.min(
                  currentPage *
                  (currentLimit > 0 ? currentLimit : totalProducts),
                  totalProducts,
                )}
              </span>
              <span className="hidden sm:inline">
                {" "}of{" "}
                <span className="font-medium text-slate-900">
                  {totalProducts}
                </span>
              </span>
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() =>
                  updateQueryParams({ page: String(currentPage - 1) })
                }
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
                {currentPage} /{" "}
                {Math.max(
                  1,
                  Math.ceil(
                    totalProducts /
                    (currentLimit > 0
                      ? currentLimit
                      : Math.max(totalProducts, 1)),
                  ),
                )}
              </span>
              <button
                disabled={
                  currentPage >=
                  Math.ceil(
                    totalProducts /
                    (currentLimit > 0
                      ? currentLimit
                      : Math.max(totalProducts, 1)),
                  )
                }
                onClick={() =>
                  updateQueryParams({ page: String(currentPage + 1) })
                }
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Breakdown Dialog ─── */}
      <AlertDialog open={showDetail} onOpenChange={setShowDetail}>
        <AlertDialogContent className="flex max-h-[90vh] w-[95vw] max-w-4xl flex-col overflow-hidden p-0 rounded-lg border-slate-200 bg-white shadow-lg">
          <AlertDialogHeader className="shrink-0 flex-row items-center justify-between border-b border-slate-200 px-6 py-4 space-y-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                <BarChart3 size={18} />
              </div>
              <div className="text-left">
                <AlertDialogTitle className="text-lg font-semibold text-slate-900">
                  Catalogue Intelligence
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-slate-500">
                  {products.length} SKUs · {categoryCount} categories ·{" "}
                  {brandCount} brands
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50/50 p-6">
            <div className="mb-6 grid grid-cols-3 gap-4">
              {[
                { label: "Total SKUs", value: products.length },
                { label: "Categories", value: categoryCount },
                { label: "Brands", value: brandCount },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-md border border-slate-200 bg-white p-4 text-center shadow-sm"
                >
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                    {item.label}
                  </p>
                  <p className="font-mono text-2xl font-bold text-slate-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <SectionLabel icon={<Tag size={16} />}>By Category</SectionLabel>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {categoryCount} total
                  </span>
                </div>
                <div className="space-y-4">
                  {categoryBreakdown.map(([cat, data], i) => (
                    <div key={i}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">
                          {cat}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            {Math.round((data.count / products.length) * 100)}%
                          </span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-700">
                            {data.count}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-800"
                          style={{
                            width: `${(data.count / products.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <SectionLabel icon={<Star size={16} />}>By Brand</SectionLabel>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {brandCount} total
                  </span>
                </div>
                <div className="space-y-4">
                  {brandBreakdown.map(([brand, count], i) => (
                    <div key={i}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">
                          {brand}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            {Math.round((count / products.length) * 100)}%
                          </span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-700">
                            {count}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-800"
                          style={{
                            width: `${(count / products.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <AlertDialogFooter className="shrink-0 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <AlertDialogCancel asChild>
              <Button
                variant="outline"
                className="rounded-md border-slate-200 text-slate-700 hover:bg-slate-100"
                onClick={handleCloseDetail}
              >
                Close
              </Button>
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductManager;