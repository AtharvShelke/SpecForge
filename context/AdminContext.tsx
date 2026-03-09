'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import {
    Product, Category, CategoryNode, Brand, CategorySchema, AttributeDefinition,
    CategoryFilterConfig, FilterDefinition, WarehouseInventory, StockMovement, StockMovementType,
    Order, OrderStatus, Invoice, Customer, BillingProfile,
    Supplier, PurchaseOrder, CreditNote, Warehouse
} from '../types';
import { useToast } from '@/hooks/use-toast';

interface AdminContextType {
    // Inventory
    warehouses: Warehouse[];
    refreshWarehouses: () => Promise<void>;
    inventory: WarehouseInventory[];
    refreshInventory: () => Promise<void>;
    stockMovements: StockMovement[];
    refreshStockMovements: () => Promise<void>;
    adjustStock: (warehouseInventoryId: string, quantity: number, type: StockMovementType, reason?: string) => Promise<void>;
    transferStock: (sourceWarehouseId: string, targetWarehouseId: string, variantId: string, quantity: number, reason?: string) => Promise<void>;
    getInventoryItem: (sku: string) => WarehouseInventory | undefined;

    // Procurement
    suppliers: Supplier[];
    refreshSuppliers: () => Promise<void>;
    createSupplier: (data: Partial<Supplier>) => Promise<void>;
    updateSupplier: (id: string, data: Partial<Supplier>) => Promise<void>;
    deleteSupplier: (id: string) => Promise<void>;

    purchaseOrders: PurchaseOrder[];
    refreshPurchaseOrders: () => Promise<void>;
    createPurchaseOrder: (data: Partial<PurchaseOrder>) => Promise<void>;
    receivePurchaseOrder: (id: string, items: { itemId: string, quantityReceiving: number }[]) => Promise<void>;

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
    voidInvoice: (id: string) => Promise<void>;
    createCreditNote: (data: { originalInvoiceId: string; orderId?: string; reason: string; items: { name: string; quantity: number; unitPrice: number; taxRatePct?: number }[] }) => Promise<void>;

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


    // UI/Navigation State
    activeTab: string;
    setActiveTab: (tab: string) => void;

    isAdmin: boolean;
    isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTabState] = useState('overview');

    // Handle initial tab from URL and history sync
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab) {
            setActiveTabState(tab);
        }

        const handlePopState = () => {
            const currentParams = new URLSearchParams(window.location.search);
            const currentTab = currentParams.get('tab') || 'overview';
            setActiveTabState(currentTab);
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const setActiveTab = useCallback((tab: string) => {
        setActiveTabState(tab);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.pushState({}, '', url.toString());
    }, []);

    // --- STATE ---
    const [inventory, setInventory] = useState<WarehouseInventory[]>([]);
    const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [schemas, setSchemas] = useState<CategorySchema[]>([]);
    const [filterConfigs, setFilterConfigs] = useState<CategoryFilterConfig[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [billingProfile, setBillingProfile] = useState<BillingProfile | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

    // --- FETCHERS ---

    const refreshInventory = useCallback(async () => {
        try {
            const res = await fetch('/api/inventory?limit=200');
            const data = await res.json();

            // The API returns a pagination object { items, total, page, limit }
            // If items exists, use it. Otherwise, if it's somehow a raw array, map that.
            const newInventory = data.items ? data.items : (Array.isArray(data) ? data : []);
            setInventory(newInventory);
        } catch (err) { console.error(err); }
    }, []);

    const refreshWarehouses = useCallback(async () => {
        try {
            const res = await fetch('/api/warehouses');
            const data = await res.json();
            setWarehouses(data);
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


    const refreshProducts = useCallback(async () => {
        try {
            const res = await fetch('/api/products?fields=minimal');
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

    const refreshSuppliers = useCallback(async () => {
        try {
            const res = await fetch('/api/suppliers');
            const data = await res.json();
            setSuppliers(data.suppliers ?? data);
        } catch (err) { console.error(err); }
    }, []);

    const refreshPurchaseOrders = useCallback(async () => {
        try {
            const res = await fetch('/api/inventory/purchase-orders');
            const data = await res.json();
            setPurchaseOrders(data.orders ?? data);
        } catch (err) { console.error(err); }
    }, []);

    // --- LAZY LOAD TAB DATA ---
    useEffect(() => {
        const initTabData = async () => {
            setIsLoading(true);
            try {
                // Shared foundational data needed almost everywhere
                const basePromises = [
                    refreshProducts(),
                    refreshCategories(),
                    refreshBrands()
                ];

                let specificPromises: Promise<void>[] = [];
                switch (activeTab) {
                    case 'overview':
                        specificPromises = [refreshOrders(), refreshInventory(), refreshInvoices(), refreshCustomers(), refreshStockMovements()];
                        break;
                    case 'orders':
                        specificPromises = [refreshOrders(), refreshInventory(), refreshCustomers()];
                        break;
                    case 'products':
                    case 'brands':
                        break;
                    case 'categories':
                        specificPromises = [refreshSchemas(), refreshFilterConfigs()];
                        break;
                    case 'inventory':
                        specificPromises = [refreshInventory(), refreshWarehouses(), refreshStockMovements()];
                        break;
                    case 'procurement':
                        specificPromises = [refreshSuppliers(), refreshPurchaseOrders(), refreshInventory()];
                        break;
                    case 'billing':
                        specificPromises = [refreshInvoices(), refreshCustomers(), refreshBillingProfile()];
                        break;

                    case 'marketing':
                        break;
                }

                await Promise.all([...basePromises, ...specificPromises]);
            } catch (error) {
                console.error('Failed to load tab data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        initTabData();
    }, [
        activeTab,
        refreshInventory, refreshStockMovements, refreshOrders, refreshSchemas,
        refreshFilterConfigs, refreshInvoices, refreshCustomers,
        refreshBillingProfile,
        refreshProducts, refreshCategories, refreshBrands,
        refreshSuppliers, refreshPurchaseOrders, refreshWarehouses
    ]);

    // --- REAL-TIME SYNC (Polling) ---
    useEffect(() => {
        // Refresh critical dynamic data every 30 seconds
        const interval = setInterval(() => {
            if (!isLoading) {
                if (activeTab === 'inventory' || activeTab === 'overview' || activeTab === 'orders' || activeTab === 'procurement') {
                    refreshInventory();
                }
                if (activeTab === 'orders' || activeTab === 'overview') {
                    refreshOrders();
                }
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [activeTab, isLoading, refreshInventory, refreshOrders]);

    // --- ACTIONS ---

    const adjustStock = useCallback(async (warehouseInventoryId: string, quantity: number, type: StockMovementType, reason?: string) => {
        try {
            const res = await fetch(`/api/inventory/${warehouseInventoryId}/movements`, {
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
                await Promise.all([refreshOrders(), refreshInvoices(), refreshInventory()]);
            } else {
                const data = await res.json();
                toast({ title: "Update Failed", description: data.error || "Could not update order status", variant: "destructive" });
            }
        } catch (err) { console.error(err); }
    }, [refreshOrders, refreshInvoices, toast]);

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
        // optimistic removal
        setProducts(prev => prev.filter(p => p.id !== productId));

        try {
            const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Delete failed");
            }

            toast({ title: "Product deleted" });

            // background consistency check
            refreshProducts();

        } catch (err: any) {
            console.error(err);

            toast({
                title: "Delete failed",
                description: err.message,
                variant: "destructive"
            });

            // rollback
            refreshProducts();
        }
    }, [refreshProducts, toast]);

    const sanitizeCategoryNodes = (nodes: CategoryNode[]): CategoryNode[] =>
        nodes.map(({ category, brand, query, children, ...rest }) => ({
            ...rest,
            ...(category ? { category } : {}),
            ...(brand ? { brand } : {}),
            ...(query ? { query } : {}),
            children: children?.length ? sanitizeCategoryNodes(children) : [],
        }));

    const updateCategories = useCallback(async (nodes: CategoryNode[]) => {
        try {
            const res = await fetch('/api/categories/hierarchy', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sanitizeCategoryNodes(nodes)),
            });
            if (res.ok) toast({ title: "Categories updated" });
            else {
                const data = await res.json();
                toast({ title: "Update Failed", description: JSON.stringify(data.error), variant: "destructive" });
            }
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

    const voidInvoice = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/invoices/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'VOIDED' }),
            });
            if (res.ok) {
                toast({ title: "Invoice voided" });
                await refreshInvoices();
            } else {
                const data = await res.json();
                toast({ title: "Failed", description: data.error || "Could not void invoice", variant: "destructive" });
            }
        } catch (err) { console.error(err); }
    }, [refreshInvoices, toast]);

    const createCreditNote = useCallback(async (data: { originalInvoiceId: string; orderId?: string; reason: string; items: { name: string; quantity: number; unitPrice: number; taxRatePct?: number }[] }) => {
        try {
            const res = await fetch('/api/credit-notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                toast({ title: "Credit note created" });
                await refreshInvoices();
            } else {
                const json = await res.json();
                toast({ title: "Failed", description: json.error || "Could not create credit note", variant: "destructive" });
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


    // --- NEW INVENTORY PROCUREMENT ACTIONS ---

    const transferStock = useCallback(async (sourceWarehouseId: string, targetWarehouseId: string, variantId: string, quantity: number, reason?: string) => {
        try {
            const res = await fetch(`/api/inventory/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceWarehouseId, targetWarehouseId, variantId, quantity, reason }),
            });

            if (res.ok) {
                toast({ title: "Stock transferred successfully" });
                await refreshInventory();
                await refreshStockMovements();
            } else {
                const data = await res.json();
                toast({ title: "Transfer Failed", description: data.error || "Could not transfer stock", variant: "destructive" });
                throw new Error(data.error);
            }
        } catch (err) { console.error(err); throw err; }
    }, [refreshInventory, refreshStockMovements, toast]);

    const createSupplier = useCallback(async (data: Partial<Supplier>) => {
        try {
            const res = await fetch('/api/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                toast({ title: "Supplier Created" });
                await refreshSuppliers();
            } else {
                const json = await res.json();
                toast({ title: "Failed", description: json.error || "Could not create supplier", variant: "destructive" });
            }
        } catch (err) { console.error(err); }
    }, [refreshSuppliers, toast]);

    const updateSupplier = useCallback(async (id: string, data: Partial<Supplier>) => {
        try {
            const res = await fetch(`/api/suppliers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                toast({ title: "Supplier Updated" });
                await refreshSuppliers();
            } else {
                const json = await res.json();
                toast({ title: "Failed", description: json.error || "Could not update supplier", variant: "destructive" });
            }
        } catch (err) { console.error(err); }
    }, [refreshSuppliers, toast]);

    const deleteSupplier = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/suppliers/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast({ title: "Supplier Deleted" });
                await refreshSuppliers();
            } else {
                const json = await res.json();
                toast({ title: "Failed", description: json.error || "Could not delete supplier", variant: "destructive" });
            }
        } catch (err) { console.error(err); }
    }, [refreshSuppliers, toast]);

    const createPurchaseOrder = useCallback(async (data: Partial<PurchaseOrder>) => {
        try {
            const res = await fetch('/api/inventory/purchase-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                toast({ title: "Purchase Order Created" });
                await refreshPurchaseOrders();
            } else {
                const json = await res.json();
                toast({ title: "Failed", description: json.error || "Could not create purchase order", variant: "destructive" });
            }
        } catch (err) { console.error(err); }
    }, [refreshPurchaseOrders, toast]);

    const receivePurchaseOrder = useCallback(async (id: string, items: { itemId: string, quantityReceiving: number }[]) => {
        try {
            const res = await fetch(`/api/inventory/purchase-orders/${id}/receive`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            });
            if (res.ok) {
                toast({ title: "Items Received Successfully" });
                await refreshPurchaseOrders();
                await refreshInventory();
                await refreshStockMovements();
            } else {
                const json = await res.json();
                toast({ title: "Failed", description: json.error || "Could not receive items", variant: "destructive" });
            }
        } catch (err) { console.error(err); }
    }, [refreshPurchaseOrders, refreshInventory, refreshStockMovements, toast]);

    const getInventoryItem = useCallback((sku: string) => {
        const arr = Array.isArray(inventory) ? inventory : [];
        return arr.find(i => i.variant?.sku === sku);
    }, [inventory]);

    const value = useMemo(() => ({
        inventory, refreshInventory, warehouses, refreshWarehouses, stockMovements, refreshStockMovements, adjustStock, transferStock, getInventoryItem,
        suppliers, refreshSuppliers, createSupplier, updateSupplier, deleteSupplier,
        purchaseOrders, refreshPurchaseOrders, createPurchaseOrder, receivePurchaseOrder,
        orders, refreshOrders, updateOrderStatus,
        addProduct, updateProduct, deleteProduct,
        updateCategories, addBrand, updateBrand, deleteBrand,
        schemas, refreshSchemas, updateSchema,
        filterConfigs, refreshFilterConfigs, updateFilterConfig,
        invoices, refreshInvoices, createInvoice, updateInvoice, voidInvoice, createCreditNote,
        customers, refreshCustomers, createCustomer,
        billingProfile, refreshBillingProfile, saveBillingProfile,
        products, refreshProducts, categories, refreshCategories, brands, refreshBrands,
        activeTab,
        setActiveTab,
        isAdmin: true, // For demo purposes, true inside AdminContext
        isLoading
    }), [
        inventory, refreshInventory, warehouses, refreshWarehouses, stockMovements, refreshStockMovements, adjustStock, transferStock, getInventoryItem,
        suppliers, refreshSuppliers, createSupplier, updateSupplier, deleteSupplier,
        purchaseOrders, refreshPurchaseOrders, createPurchaseOrder, receivePurchaseOrder,
        orders, refreshOrders, updateOrderStatus,
        addProduct, updateProduct, deleteProduct,
        updateCategories, addBrand, updateBrand, deleteBrand,
        schemas, refreshSchemas, updateSchema,
        filterConfigs, refreshFilterConfigs, updateFilterConfig,
        invoices, refreshInvoices, createInvoice, updateInvoice, voidInvoice, createCreditNote,
        customers, refreshCustomers, createCustomer,
        billingProfile, refreshBillingProfile, saveBillingProfile,
        products, refreshProducts, categories, refreshCategories, brands, refreshBrands,
        activeTab,
        setActiveTab,
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