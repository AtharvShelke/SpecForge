'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import {
    Product, Category, CategoryNode, Brand, CategorySchema, AttributeDefinition,
    CategoryFilterConfig, FilterDefinition, InventoryItem, StockMovement, StockMovementType,
    Order, OrderStatus, Invoice, Customer, BillingProfile, CMSVersion,
    Review, ReviewStatus,
} from '../types';
import { useToast } from '@/hooks/use-toast';

interface AdminContextType {
    // Inventory
    inventory: InventoryItem[];
    refreshInventory: () => Promise<void>;
    stockMovements: StockMovement[];
    refreshStockMovements: () => Promise<void>;
    adjustStock: (inventoryItemId: string, quantity: number, type: StockMovementType, reason: string) => Promise<void>;
    getInventoryItem: (sku: string) => InventoryItem | undefined;

    // Orders
    orders: Order[];
    refreshOrders: () => Promise<void>;
    updateOrderStatus: (orderId: string, newStatus: OrderStatus, note?: string) => Promise<void>;

    // Products (Admin Actions)
    addProduct: (product: Partial<Product>, initialStock: number, costPrice: number) => Promise<void>;
    updateProduct: (product: Product) => Promise<void>;
    deleteProduct: (productId: string) => Promise<void>;

    // Catalog Hierarchy & Brands
    updateCategories: (nodes: CategoryNode[]) => Promise<void>;
    addBrand: (brand: Partial<Brand>) => Promise<void>;
    updateBrand: (brand: Brand) => Promise<void>;
    deleteBrand: (brandId: string) => Promise<void>;

    // Schemas & Filters
    schemas: CategorySchema[];
    refreshSchemas: () => Promise<void>;
    updateSchema: (category: Category, attributes: AttributeDefinition[]) => Promise<void>;
    filterConfigs: CategoryFilterConfig[];
    refreshFilterConfigs: () => Promise<void>;
    updateFilterConfig: (category: Category, filters: FilterDefinition[]) => Promise<void>;

    // Invoices
    invoices: Invoice[];
    refreshInvoices: () => Promise<void>;
    createInvoice: (data: Partial<Invoice>) => Promise<void>;
    updateInvoice: (id: string, data: Partial<Invoice>) => Promise<void>;
    deleteInvoice: (id: string) => Promise<void>;

    // Public Data (for Admin Reference)
    products: Product[];
    refreshProducts: () => Promise<void>;
    categories: Category[];
    refreshCategories: () => Promise<void>;
    brands: Brand[];
    refreshBrands: () => Promise<void>;

    // Customers
    customers: Customer[];
    refreshCustomers: () => Promise<void>;
    createCustomer: (data: Partial<Customer>) => Promise<void>;

    // Billing Profile
    billingProfile: BillingProfile | null;
    refreshBillingProfile: () => Promise<void>;
    saveBillingProfile: (data: Partial<BillingProfile>) => Promise<void>;

    // CMS Management
    cmsVersions: CMSVersion[];
    refreshCMSVersions: () => Promise<void>;
    saveCMS: (data: any) => Promise<void>;
    restoreCMSVersion: (versionId: string) => Promise<void>;

    // Reviews
    reviews: Review[];
    refreshReviews: () => Promise<void>;
    updateReviewStatus: (reviewId: string, status: ReviewStatus) => Promise<void>;

    isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    // --- STATE ---
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [schemas, setSchemas] = useState<CategorySchema[]>([]);
    const [filterConfigs, setFilterConfigs] = useState<CategoryFilterConfig[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [billingProfile, setBillingProfile] = useState<BillingProfile | null>(null);
    const [cmsVersions, setCmsVersions] = useState<CMSVersion[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);

    // --- FETCHERS ---

    const refreshInventory = useCallback(async () => {
        try {
            const res = await fetch('/api/inventory');
            const data = await res.json();
            setInventory(data);
        } catch (err) { console.error(err); }
    }, []);

    const refreshStockMovements = useCallback(async () => {
        try {
            const res = await fetch('/api/inventory/movements');
            const data = await res.json();
            setStockMovements(data);
        } catch (err) { console.error(err); }
    }, []);

    const refreshOrders = useCallback(async () => {
        try {
            const res = await fetch('/api/orders');
            const data = await res.json();
            if (data.orders) setOrders(data.orders);
        } catch (err) { console.error(err); }
    }, []);

    const refreshSchemas = useCallback(async () => {
        try {
            const res = await fetch('/api/categories/schemas');
            const data = await res.json();
            setSchemas(data);
        } catch (err) { console.error(err); }
    }, []);

    const refreshFilterConfigs = useCallback(async () => {
        try {
            const res = await fetch('/api/categories/filters');
            const data = await res.json();
            setFilterConfigs(data);
        } catch (err) { console.error(err); }
    }, []);

    const refreshInvoices = useCallback(async () => {
        try {
            const res = await fetch('/api/invoices');
            const data = await res.json();
            setInvoices(data.invoices ?? data);
        } catch (err) { console.error(err); }
    }, []);

    const refreshCustomers = useCallback(async () => {
        try {
            const res = await fetch('/api/customers');
            const data = await res.json();
            setCustomers(data.customers ?? data);
        } catch (err) { console.error(err); }
    }, []);

    const refreshBillingProfile = useCallback(async () => {
        try {
            const res = await fetch('/api/billing-profile');
            const data = await res.json();
            setBillingProfile(data);
        } catch (err) { console.error(err); }
    }, []);

    const refreshCMSVersions = useCallback(async () => {
        try {
            const res = await fetch('/api/cms/versions');
            const data = await res.json();
            setCmsVersions(data.versions ?? data);
        } catch (err) { console.error(err); }
    }, []);

    const refreshProducts = useCallback(async () => {
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            setProducts(data.products ?? data);
        } catch (err) { console.error(err); }
    }, []);

    const refreshCategories = useCallback(async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(data);
        } catch (err) { console.error(err); }
    }, []);

    const refreshBrands = useCallback(async () => {
        try {
            const res = await fetch('/api/brands');
            const data = await res.json();
            setBrands(data);
        } catch (err) { console.error(err); }
    }, []);

    const refreshReviews = useCallback(async () => {
        try {
            const res = await fetch('/api/reviews');
            const data = await res.json();
            setReviews(data.reviews ?? data);
        } catch (err) { console.error(err); }
    }, []);

    // --- INITIAL LOAD ---
    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            await Promise.all([
                refreshInventory(),
                refreshStockMovements(),
                refreshOrders(),
                refreshSchemas(),
                refreshFilterConfigs(),
                refreshInvoices(),
                refreshCustomers(),
                refreshBillingProfile(),
                refreshCMSVersions(),
                refreshProducts(),
                refreshCategories(),
                refreshBrands(),
                refreshReviews()
            ]);
            setIsLoading(false);
        };
        init();
    }, [
        refreshInventory, refreshStockMovements, refreshOrders, refreshSchemas,
        refreshFilterConfigs, refreshInvoices, refreshCustomers,
        refreshBillingProfile, refreshCMSVersions,
        refreshProducts, refreshCategories, refreshBrands,
        refreshReviews
    ]);

    // --- ACTIONS ---

    const adjustStock = useCallback(async (inventoryItemId: string, quantity: number, type: StockMovementType, reason: string) => {
        try {
            const res = await fetch(`/api/inventory/${inventoryItemId}/movements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, quantity, reason }),
            });
            if (res.ok) {
                toast({ title: "Stock adjusted" });
                await Promise.all([refreshInventory(), refreshStockMovements()]);
            }
        } catch (err) { console.error(err); }
    }, [refreshInventory, refreshStockMovements, toast]);

    const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus, note?: string) => {
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, note }),
            });
            if (res.ok) {
                toast({ title: "Order status updated" });
                await refreshOrders();
            }
        } catch (err) { console.error(err); }
    }, [refreshOrders, toast]);

    const addProduct = useCallback(async (product: Partial<Product>, initialStock: number, costPrice: number) => {
        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...product, stock: initialStock, costPrice }),
            });
            if (res.ok) {
                toast({ title: "Product added" });
                await refreshInventory();
            }
        } catch (err) { console.error(err); }
    }, [refreshInventory, toast]);

    const updateProduct = useCallback(async (product: Product) => {
        try {
            const res = await fetch(`/api/products/${product.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product),
            });
            if (res.ok) toast({ title: "Product updated" });
        } catch (err) { console.error(err); }
    }, [toast]);

    const deleteProduct = useCallback(async (productId: string) => {
        try {
            const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: "Product deleted" });
                await refreshInventory();
            }
        } catch (err) { console.error(err); }
    }, [refreshInventory, toast]);

    const updateCategories = useCallback(async (nodes: CategoryNode[]) => {
        try {
            const res = await fetch('/api/categories/hierarchy', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nodes),
            });
            if (res.ok) toast({ title: "Categories updated" });
        } catch (err) { console.error(err); }
    }, [toast]);

    const addBrand = useCallback(async (brand: Partial<Brand>) => {
        try {
            const res = await fetch('/api/brands', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(brand),
            });
            if (res.ok) toast({ title: "Brand added" });
        } catch (err) { console.error(err); }
    }, [toast]);

    const updateBrand = useCallback(async (brand: Brand) => {
        try {
            const res = await fetch(`/api/brands/${brand.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(brand),
            });
            if (res.ok) toast({ title: "Brand updated" });
        } catch (err) { console.error(err); }
    }, [toast]);

    const deleteBrand = useCallback(async (brandId: string) => {
        try {
            const res = await fetch(`/api/brands/${brandId}`, { method: 'DELETE' });
            if (res.ok) toast({ title: "Brand deleted" });
        } catch (err) { console.error(err); }
    }, [toast]);

    const updateSchema = useCallback(async (category: Category, attributes: AttributeDefinition[]) => {
        try {
            const res = await fetch('/api/categories/schemas', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category, attributes }),
            });
            if (res.ok) {
                toast({ title: "Schema updated" });
                await refreshSchemas();
            }
        } catch (err) { console.error(err); }
    }, [refreshSchemas, toast]);

    const updateFilterConfig = useCallback(async (category: Category, filters: FilterDefinition[]) => {
        try {
            const res = await fetch('/api/categories/filters', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category, filters }),
            });
            if (res.ok) {
                toast({ title: "Filters updated" });
                await refreshFilterConfigs();
            }
        } catch (err) { console.error(err); }
    }, [refreshFilterConfigs, toast]);

    const createInvoice = useCallback(async (data: Partial<Invoice>) => {
        try {
            const res = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                toast({ title: "Invoice created" });
                await refreshInvoices();
            }
        } catch (err) { console.error(err); }
    }, [refreshInvoices, toast]);

    const updateInvoice = useCallback(async (id: string, data: Partial<Invoice>) => {
        try {
            const res = await fetch(`/api/invoices/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                toast({ title: "Invoice updated" });
                await refreshInvoices();
            }
        } catch (err) { console.error(err); }
    }, [refreshInvoices, toast]);

    const deleteInvoice = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: "Invoice deleted" });
                await refreshInvoices();
            }
        } catch (err) { console.error(err); }
    }, [refreshInvoices, toast]);

    const createCustomer = useCallback(async (data: Partial<Customer>) => {
        try {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                toast({ title: "Customer created" });
                await refreshCustomers();
            }
        } catch (err) { console.error(err); }
    }, [refreshCustomers, toast]);

    const saveBillingProfile = useCallback(async (data: Partial<BillingProfile>) => {
        try {
            const res = await fetch('/api/billing-profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                toast({ title: "Billing profile saved" });
                await refreshBillingProfile();
            }
        } catch (err) { console.error(err); }
    }, [refreshBillingProfile, toast]);

    const saveCMS = useCallback(async (data: any) => {
        try {
            const res = await fetch('/api/cms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                toast({ title: "CMS saved" });
                await refreshCMSVersions();
            }
        } catch (err) { console.error(err); }
    }, [refreshCMSVersions, toast]);

    const restoreCMSVersion = useCallback(async (versionId: string) => {
        try {
            const res = await fetch('/api/cms/versions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ versionId }),
            });
            if (res.ok) {
                toast({ title: "CMS version restored" });
                await refreshCMSVersions();
            }
        } catch (err) { console.error(err); }
    }, [refreshCMSVersions, toast]);

    const updateReviewStatus = useCallback(async (reviewId: string, status: ReviewStatus) => {
        try {
            const res = await fetch(`/api/reviews/${reviewId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                toast({ title: "Review status updated" });
                await refreshReviews();
            }
        } catch (err) { console.error(err); }
    }, [refreshReviews, toast]);

    const getInventoryItem = useCallback((sku: string) => inventory.find(i => i.sku === sku), [inventory]);

    const value = useMemo(() => ({
        inventory, refreshInventory, stockMovements, refreshStockMovements, adjustStock, getInventoryItem,
        orders, refreshOrders, updateOrderStatus,
        addProduct, updateProduct, deleteProduct,
        updateCategories, addBrand, updateBrand, deleteBrand,
        schemas, refreshSchemas, updateSchema,
        filterConfigs, refreshFilterConfigs, updateFilterConfig,
        invoices, refreshInvoices, createInvoice, updateInvoice, deleteInvoice,
        customers, refreshCustomers, createCustomer,
        billingProfile, refreshBillingProfile, saveBillingProfile,
        cmsVersions, refreshCMSVersions, saveCMS, restoreCMSVersion,
        products, refreshProducts, categories, refreshCategories, brands, refreshBrands,
        reviews, refreshReviews, updateReviewStatus,
        isLoading
    }), [
        inventory, refreshInventory, stockMovements, refreshStockMovements, adjustStock, getInventoryItem,
        orders, refreshOrders, updateOrderStatus,
        addProduct, updateProduct, deleteProduct,
        updateCategories, addBrand, updateBrand, deleteBrand,
        schemas, refreshSchemas, updateSchema,
        filterConfigs, refreshFilterConfigs, updateFilterConfig,
        invoices, refreshInvoices, createInvoice, updateInvoice, deleteInvoice,
        customers, refreshCustomers, createCustomer,
        billingProfile, refreshBillingProfile, saveBillingProfile,
        cmsVersions, refreshCMSVersions, saveCMS, restoreCMSVersion,
        products, refreshProducts, categories, refreshCategories, brands, refreshBrands,
        reviews, refreshReviews, updateReviewStatus,
        isLoading
    ]);

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
};
