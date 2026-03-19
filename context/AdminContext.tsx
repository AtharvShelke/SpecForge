'use client';

import React, {
    createContext, useContext, useState, useEffect, ReactNode,
    useCallback, useMemo, useRef,
} from 'react';
import {
    Product, Category, CategoryNode, Brand, CategorySchema, AttributeDefinition,
    CategoryFilterConfig, FilterDefinition, WarehouseInventory, StockMovement, StockMovementType,
    Order, OrderStatus, Invoice, Customer, BillingProfile,
    Supplier, PurchaseOrder, CreditNote, Warehouse, BuildGuide,
} from '../types';
import { useToast } from '@/hooks/use-toast';

/* ─────────────────────────────────────────────────────────────────────────────
   CONTEXT TYPES
───────────────────────────────────────────────────────────────────────────── */
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
    receivePurchaseOrder: (id: string, items: { itemId: string; quantityReceiving: number }[]) => Promise<void>;

    // Orders
    orders: Order[];
    refreshOrders: () => Promise<void>;
    updateOrderStatus: (orderId: string, newStatus: OrderStatus, note?: string) => Promise<void>;
    deleteOrder: (orderId: string) => Promise<void>;

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

    // Saved Builds
    savedBuilds: BuildGuide[];
    refreshSavedBuilds: () => Promise<void>;

    // UI/Navigation State
    activeTab: string;
    setActiveTab: (tab: string) => void;

    isAdmin: boolean;
    isLoading: boolean;
    syncData: () => Promise<void>;

    // Marketing
    marketingStats: any;
    marketingCampaigns: any[];
    marketingLeads: { items: any[]; total: number };
    marketingContacts: any;
    marketingLogs: any[];
    refreshMarketing: (query?: string, activeView?: string) => Promise<void>;
}

/* ─────────────────────────────────────────────────────────────────────────────
   SPLIT CONTEXTS
   Consumers only re-render when their specific slice changes, not on every
   unrelated state update (e.g. marketing changes won't re-render inventory tabs).
───────────────────────────────────────────────────────────────────────────── */
const AdminContext = createContext<AdminContextType | undefined>(undefined);

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS — defined outside component so they're never recreated
───────────────────────────────────────────────────────────────────────────── */
const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

// Pure function — stable reference, never re-created inside component
function sanitizeCategoryNodes(nodes: CategoryNode[]): CategoryNode[] {
    return nodes.map(({ category, brand, query, children, ...rest }) => ({
        ...rest,
        ...(category ? { category } : {}),
        ...(brand ? { brand } : {}),
        ...(query ? { query } : {}),
        children: children?.length ? sanitizeCategoryNodes(children) : [],
    }));
}

// Tab → fetch groups mapping — static, never changes
const TAB_FETCHES: Record<string, string[]> = {
    overview:       ['orders', 'inventory', 'invoices', 'customers', 'stockMovements', 'products', 'brands'],
    orders:         ['orders', 'inventory', 'customers', 'products'],
    categories:     ['schemas', 'filterConfigs', 'categories'],
    inventory:      ['inventory', 'warehouses', 'stockMovements', 'products'],
    procurement:    ['suppliers', 'purchaseOrders', 'inventory', 'products'],
    billing:        ['invoices', 'customers', 'billingProfile'],
    'saved-builds': ['savedBuilds'],
    marketing:      ['marketing'],
    products:       ['products', 'brands', 'categories'],
    brands:         ['brands', 'categories'],
};

/* ─────────────────────────────────────────────────────────────────────────────
   PROVIDER
───────────────────────────────────────────────────────────────────────────── */
export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTabState] = useState(() => {
        // Lazy initializer — reads URL once, avoids extra re-render from useEffect
        if (typeof window !== 'undefined') {
            return new URLSearchParams(window.location.search).get('tab') || 'overview';
        }
        return 'overview';
    });

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
    const [savedBuilds, setSavedBuilds] = useState<BuildGuide[]>([]);

    // Marketing State
    const [marketingStats, setMarketingStats] = useState<any>(null);
    const [marketingCampaigns, setMarketingCampaigns] = useState<any[]>([]);
    const [marketingLeads, setMarketingLeads] = useState<{ items: any[]; total: number }>({ items: [], total: 0 });
    const [marketingContacts, setMarketingContacts] = useState<any>(null);
    const [marketingLogs, setMarketingLogs] = useState<any[]>([]);

    // Inventory lookup Map — O(1) instead of O(n) linear scan on every getInventoryItem call
    const inventoryMapRef = useRef<Map<string, WarehouseInventory>>(new Map());
    // Keep map in sync whenever inventory array changes
    useEffect(() => {
        const map = new Map<string, WarehouseInventory>();
        const arr = Array.isArray(inventory) ? inventory : [];
        for (const item of arr) {
            if (item.variant?.sku) map.set(item.variant.sku, item);
        }
        inventoryMapRef.current = map;
    }, [inventory]);

    // --- URL / popstate sync ---
    useEffect(() => {
        const handlePopState = () => {
            const tab = new URLSearchParams(window.location.search).get('tab') || 'overview';
            setActiveTabState(tab);
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

    /* ─────────────────────────────────────────────────────────────────────────
       INDIVIDUAL FETCHERS
       Each is a stable callback — only recreated if its own setter changes
       (which never happens, so these are effectively permanent stable refs).
    ───────────────────────────────────────────────────────────────────────── */
    const refreshInventory = useCallback(async () => {
        try {
            const res = await fetch('/api/inventory?limit=3000');
            const data = await res.json();
            setInventory(data.items ?? (Array.isArray(data) ? data : []));
        } catch (err) { console.error(err); }
    }, []);

    const refreshWarehouses = useCallback(async () => {
        try {
            const res = await fetch('/api/warehouses');
            setWarehouses(await res.json());
        } catch (err) { console.error(err); }
    }, []);

    const refreshStockMovements = useCallback(async () => {
        try {
            const res = await fetch('/api/inventory/movements');
            setStockMovements(await res.json());
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
            setSchemas(await res.json());
        } catch (err) { console.error(err); }
    }, []);

    const refreshFilterConfigs = useCallback(async () => {
        try {
            const res = await fetch('/api/categories/filters');
            setFilterConfigs(await res.json());
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
            setBillingProfile(await res.json());
        } catch (err) { console.error(err); }
    }, []);

    const refreshProducts = useCallback(async () => {
        try {
            const res = await fetch('/api/products?fields=minimal&limit=5000');
            const data = await res.json();
            setProducts(data.products ?? data);
        } catch (err) { console.error(err); }
    }, []);

    const refreshCategories = useCallback(async () => {
        try {
            const res = await fetch('/api/categories');
            setCategories(await res.json());
        } catch (err) { console.error(err); }
    }, []);

    const refreshBrands = useCallback(async () => {
        try {
            const res = await fetch('/api/brands');
            setBrands(await res.json());
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

    const refreshSavedBuilds = useCallback(async () => {
        try {
            const res = await fetch('/api/build-guides');
            setSavedBuilds(await res.json());
        } catch (err) { console.error(err); }
    }, []);

    const refreshMarketing = useCallback(async (query = '', view = 'campaigns') => {
        try {
            const isLeadsView = view === 'leads' || !!query;
            const isContactsView = view === 'contacts';

            const [statsRes, campaignsRes, logsRes, leadsRes, contactsRes] = await Promise.all([
                fetch('/api/marketing/stats'),
                fetch('/api/marketing/campaigns'),
                fetch('/api/marketing/logs?limit=15'),
                isLeadsView
                    ? fetch(`/api/marketing/leads?limit=50&q=${query}`)
                    : Promise.resolve(null),
                isContactsView
                    ? fetch('/api/marketing/all-contacts')
                    : Promise.resolve(null),
            ]);

            // Parse only the responses that actually exist
            const [stats, campaigns, logs] = await Promise.all([
                statsRes.json(), campaignsRes.json(), logsRes.json(),
            ]);
            setMarketingStats(stats);
            setMarketingCampaigns(campaigns);
            setMarketingLogs(logs);

            if (leadsRes) {
                const leads = await leadsRes.json();
                if (leads) setMarketingLeads(leads);
            }
            if (contactsRes) {
                const contacts = await contactsRes.json();
                if (contacts) setMarketingContacts(contacts);
            }
        } catch (err) { console.error(err); }
    }, []);

    /* ─────────────────────────────────────────────────────────────────────────
       STABLE FETCHER MAP — resolved once, used by both initTabData and syncData
       to eliminate the duplicate switch blocks entirely.
    ───────────────────────────────────────────────────────────────────────── */
    const fetcherMap = useMemo<Record<string, () => Promise<void>>>(() => ({
        orders:         refreshOrders,
        inventory:      refreshInventory,
        invoices:       refreshInvoices,
        customers:      refreshCustomers,
        stockMovements: refreshStockMovements,
        schemas:        refreshSchemas,
        filterConfigs:  refreshFilterConfigs,
        warehouses:     refreshWarehouses,
        suppliers:      refreshSuppliers,
        purchaseOrders: refreshPurchaseOrders,
        billingProfile: refreshBillingProfile,
        savedBuilds:    refreshSavedBuilds,
        marketing:      refreshMarketing,
        products:       refreshProducts,
        categories:     refreshCategories,
        brands:         refreshBrands,
    }), [
        refreshOrders, refreshInventory, refreshInvoices, refreshCustomers,
        refreshStockMovements, refreshSchemas, refreshFilterConfigs, refreshWarehouses,
        refreshSuppliers, refreshPurchaseOrders, refreshBillingProfile,
        refreshSavedBuilds, refreshMarketing,
        refreshProducts, refreshCategories, refreshBrands,
    ]);

    // Shared loader — runs only what each tab declares in TAB_FETCHES
    const loadTabData = useCallback(async (tab: string) => {
        const fetches = (TAB_FETCHES[tab] ?? []).map(key => fetcherMap[key]?.()).filter(Boolean);
        await Promise.all(fetches);
    }, [fetcherMap]);

    /* ─────────────────────────────────────────────────────────────────────────
       TAB-CHANGE DATA LOADER
    ───────────────────────────────────────────────────────────────────────── */
    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        loadTabData(activeTab)
            .catch(err => { if (!cancelled) console.error('Failed to load tab data:', err); })
            .finally(() => { if (!cancelled) setIsLoading(false); });
        return () => { cancelled = true; };
    }, [activeTab, loadTabData]);

    /* ─────────────────────────────────────────────────────────────────────────
       POLLING — refresh critical data every 30 s
    ───────────────────────────────────────────────────────────────────────── */
    // Use refs so the interval closure doesn't need to be recreated on every
    // isLoading / activeTab change — avoids clearing & re-setting the interval
    const activeTabRef = useRef(activeTab);
    const isLoadingRef = useRef(isLoading);
    useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
    useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);

    useEffect(() => {
        const id = setInterval(() => {
            if (isLoadingRef.current) return;
            const tab = activeTabRef.current;
            const polls: Promise<void>[] = [];
            if (['inventory', 'overview', 'orders', 'procurement'].includes(tab)) polls.push(refreshInventory());
            if (['orders', 'overview'].includes(tab)) polls.push(refreshOrders());
            if (polls.length) Promise.all(polls).catch(console.error);
        }, 30_000);
        return () => clearInterval(id);
    }, [refreshInventory, refreshOrders]); // stable callbacks — interval set once

    /* ─────────────────────────────────────────────────────────────────────────
       ACTIONS
    ───────────────────────────────────────────────────────────────────────── */
    const adjustStock = useCallback(async (
        warehouseInventoryId: string, quantity: number, type: StockMovementType, reason?: string,
    ) => {
        try {
            const res = await fetch(`/api/inventory/${warehouseInventoryId}/movements`, {
                method: 'POST', headers: JSON_HEADERS,
                body: JSON.stringify({ type, quantity, reason }),
            });
            if (res.ok) {
                toast({ title: 'Stock adjusted' });
                await Promise.all([refreshInventory(), refreshStockMovements()]);
            }
        } catch (err) { console.error(err); }
    }, [refreshInventory, refreshStockMovements, toast]);

    const transferStock = useCallback(async (
        sourceWarehouseId: string, targetWarehouseId: string, variantId: string, quantity: number, reason?: string,
    ) => {
        try {
            const res = await fetch('/api/inventory/transfer', {
                method: 'POST', headers: JSON_HEADERS,
                body: JSON.stringify({ sourceWarehouseId, targetWarehouseId, variantId, quantity, reason }),
            });
            if (res.ok) {
                toast({ title: 'Stock transferred successfully' });
                await Promise.all([refreshInventory(), refreshStockMovements()]);
            } else {
                const data = await res.json();
                toast({ title: 'Transfer Failed', description: data.error || 'Could not transfer stock', variant: 'destructive' });
                throw new Error(data.error);
            }
        } catch (err) { console.error(err); throw err; }
    }, [refreshInventory, refreshStockMovements, toast]);

    // O(1) lookup via Map instead of O(n) .find()
    const getInventoryItem = useCallback((sku: string) => {
        return inventoryMapRef.current.get(sku);
    }, []); // stable — reads from ref, no deps needed

    const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus, note?: string) => {
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH', headers: JSON_HEADERS,
                body: JSON.stringify({ status: newStatus, note }),
            });
            if (res.ok) {
                toast({ title: 'Order status updated' });
                await Promise.all([refreshOrders(), refreshInvoices(), refreshInventory()]);
            } else {
                const data = await res.json();
                toast({ title: 'Update Failed', description: data.error || 'Could not update order status', variant: 'destructive' });
            }
        } catch (err) { console.error(err); }
    }, [refreshOrders, refreshInvoices, refreshInventory, toast]);

    const deleteOrder = useCallback(async (orderId: string) => {
        try {
            const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: 'Order deleted' });
                await Promise.all([refreshOrders(), refreshInventory()]);
            } else {
                const data = await res.json();
                toast({ title: 'Delete Failed', description: data.error || 'Could not delete order', variant: 'destructive' });
            }
        } catch (err) { console.error(err); }
    }, [refreshOrders, refreshInventory, toast]);

    const addProduct = useCallback(async (product: Partial<Product>, initialStock: number, costPrice: number) => {
        try {
            const res = await fetch('/api/products', {
                method: 'POST', headers: JSON_HEADERS,
                body: JSON.stringify({ ...product, stock: initialStock, costPrice }),
            });
            if (res.ok) {
                toast({ title: 'Product added' });
                await refreshInventory();
            }
        } catch (err) { console.error(err); }
    }, [refreshInventory, toast]);

    const updateProduct = useCallback(async (product: Product) => {
        try {
            const res = await fetch(`/api/products/${product.id}`, {
                method: 'PUT', headers: JSON_HEADERS,
                body: JSON.stringify(product),
            });
            if (res.ok) toast({ title: 'Product updated' });
        } catch (err) { console.error(err); }
    }, [toast]);

    const deleteProduct = useCallback(async (productId: string) => {
        // Optimistic removal
        setProducts(prev => prev.filter(p => p.id !== productId));
        try {
            const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Delete failed');
            toast({ title: 'Product deleted' });
            refreshProducts(); // background consistency check — intentionally not awaited
        } catch (err: any) {
            console.error(err);
            toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
            refreshProducts(); // rollback — intentionally not awaited
        }
    }, [refreshProducts, toast]);

    const updateCategories = useCallback(async (nodes: CategoryNode[]) => {
        try {
            const res = await fetch('/api/categories/hierarchy', {
                method: 'PUT', headers: JSON_HEADERS,
                body: JSON.stringify(sanitizeCategoryNodes(nodes)),
            });
            if (res.ok) toast({ title: 'Categories updated' });
            else {
                const data = await res.json();
                toast({ title: 'Update Failed', description: JSON.stringify(data.error), variant: 'destructive' });
            }
        } catch (err) { console.error(err); }
    }, [toast]);

    const addBrand = useCallback(async (brand: Partial<Brand>) => {
        try {
            const res = await fetch('/api/brands', {
                method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(brand),
            });
            if (res.ok) toast({ title: 'Brand added' });
        } catch (err) { console.error(err); }
    }, [toast]);

    const updateBrand = useCallback(async (brand: Brand) => {
        try {
            const res = await fetch(`/api/brands/${brand.id}`, {
                method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(brand),
            });
            if (res.ok) toast({ title: 'Brand updated' });
        } catch (err) { console.error(err); }
    }, [toast]);

    const deleteBrand = useCallback(async (brandId: string) => {
        try {
            const res = await fetch(`/api/brands/${brandId}`, { method: 'DELETE' });
            if (res.ok) toast({ title: 'Brand deleted' });
        } catch (err) { console.error(err); }
    }, [toast]);

    const updateSchema = useCallback(async (category: Category, attributes: AttributeDefinition[]) => {
        try {
            const res = await fetch('/api/categories/schemas', {
                method: 'PUT', headers: JSON_HEADERS,
                body: JSON.stringify({ category, attributes }),
            });
            if (res.ok) { toast({ title: 'Schema updated' }); await refreshSchemas(); }
        } catch (err) { console.error(err); }
    }, [refreshSchemas, toast]);

    const updateFilterConfig = useCallback(async (category: Category, filters: FilterDefinition[]) => {
        try {
            const res = await fetch('/api/categories/filters', {
                method: 'PUT', headers: JSON_HEADERS,
                body: JSON.stringify({ category, filters }),
            });
            if (res.ok) { toast({ title: 'Filters updated' }); await refreshFilterConfigs(); }
        } catch (err) { console.error(err); }
    }, [refreshFilterConfigs, toast]);

    const createInvoice = useCallback(async (data: Partial<Invoice>) => {
        try {
            const res = await fetch('/api/invoices', {
                method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(data),
            });
            if (res.ok) { toast({ title: 'Invoice created' }); await refreshInvoices(); }
        } catch (err) { console.error(err); }
    }, [refreshInvoices, toast]);

    const updateInvoice = useCallback(async (id: string, data: Partial<Invoice>) => {
        try {
            const res = await fetch(`/api/invoices/${id}`, {
                method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(data),
            });
            if (res.ok) { toast({ title: 'Invoice updated' }); await refreshInvoices(); }
        } catch (err) { console.error(err); }
    }, [refreshInvoices, toast]);

    const voidInvoice = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/invoices/${id}`, {
                method: 'PUT', headers: JSON_HEADERS,
                body: JSON.stringify({ status: 'VOIDED' }),
            });
            if (res.ok) {
                toast({ title: 'Invoice voided' }); await refreshInvoices();
            } else {
                const data = await res.json();
                toast({ title: 'Failed', description: data.error || 'Could not void invoice', variant: 'destructive' });
            }
        } catch (err) { console.error(err); }
    }, [refreshInvoices, toast]);

    const createCreditNote = useCallback(async (data: {
        originalInvoiceId: string; orderId?: string; reason: string;
        items: { name: string; quantity: number; unitPrice: number; taxRatePct?: number }[];
    }) => {
        try {
            const res = await fetch('/api/credit-notes', {
                method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(data),
            });
            if (res.ok) {
                toast({ title: 'Credit note created' }); await refreshInvoices();
            } else {
                const json = await res.json();
                toast({ title: 'Failed', description: json.error || 'Could not create credit note', variant: 'destructive' });
            }
        } catch (err) { console.error(err); }
    }, [refreshInvoices, toast]);

    const createCustomer = useCallback(async (data: Partial<Customer>) => {
        try {
            const res = await fetch('/api/customers', {
                method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(data),
            });
            if (res.ok) { toast({ title: 'Customer created' }); await refreshCustomers(); }
        } catch (err) { console.error(err); }
    }, [refreshCustomers, toast]);

    const saveBillingProfile = useCallback(async (data: Partial<BillingProfile>) => {
        try {
            const res = await fetch('/api/billing-profile', {
                method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(data),
            });
            if (res.ok) { toast({ title: 'Billing profile saved' }); await refreshBillingProfile(); }
        } catch (err) { console.error(err); }
    }, [refreshBillingProfile, toast]);

    const createSupplier = useCallback(async (data: Partial<Supplier>) => {
        try {
            const res = await fetch('/api/suppliers', {
                method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(data),
            });
            if (res.ok) { toast({ title: 'Supplier Created' }); await refreshSuppliers(); }
            else {
                const json = await res.json();
                toast({ title: 'Failed', description: json.error || 'Could not create supplier', variant: 'destructive' });
            }
        } catch (err) { console.error(err); }
    }, [refreshSuppliers, toast]);

    const updateSupplier = useCallback(async (id: string, data: Partial<Supplier>) => {
        try {
            const res = await fetch(`/api/suppliers/${id}`, {
                method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(data),
            });
            if (res.ok) { toast({ title: 'Supplier Updated' }); await refreshSuppliers(); }
            else {
                const json = await res.json();
                toast({ title: 'Failed', description: json.error || 'Could not update supplier', variant: 'destructive' });
            }
        } catch (err) { console.error(err); }
    }, [refreshSuppliers, toast]);

    const deleteSupplier = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
            if (res.ok) { toast({ title: 'Supplier Deleted' }); await refreshSuppliers(); }
            else {
                const json = await res.json();
                toast({ title: 'Failed', description: json.error || 'Could not delete supplier', variant: 'destructive' });
            }
        } catch (err) { console.error(err); }
    }, [refreshSuppliers, toast]);

    const createPurchaseOrder = useCallback(async (data: Partial<PurchaseOrder>) => {
        try {
            const res = await fetch('/api/inventory/purchase-orders', {
                method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(data),
            });
            if (res.ok) { toast({ title: 'Purchase Order Created' }); await refreshPurchaseOrders(); }
            else {
                const json = await res.json();
                toast({ title: 'Failed', description: json.error || 'Could not create purchase order', variant: 'destructive' });
            }
        } catch (err) { console.error(err); }
    }, [refreshPurchaseOrders, toast]);

    const receivePurchaseOrder = useCallback(async (
        id: string, items: { itemId: string; quantityReceiving: number }[],
    ) => {
        try {
            const res = await fetch(`/api/inventory/purchase-orders/${id}/receive`, {
                method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ items }),
            });
            if (res.ok) {
                toast({ title: 'Items Received Successfully' });
                // All three run concurrently — was sequential awaits before
                await Promise.all([refreshPurchaseOrders(), refreshInventory(), refreshStockMovements()]);
            } else {
                const json = await res.json();
                toast({ title: 'Failed', description: json.error || 'Could not receive items', variant: 'destructive' });
            }
        } catch (err) { console.error(err); }
    }, [refreshPurchaseOrders, refreshInventory, refreshStockMovements, toast]);

    // syncData now delegates to shared loadTabData — no more duplicate switch
    const syncData = useCallback(async () => {
        setIsLoading(true);
        try {
            await loadTabData(activeTab);
            toast({ title: 'Data Synced', description: `Updated ${activeTab} data` });
        } catch (error) {
            console.error('Failed to sync data:', error);
            toast({ title: 'Sync Failed', description: 'Could not refresh data', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, loadTabData, toast]);

    /* ─────────────────────────────────────────────────────────────────────────
       CONTEXT VALUE
       Split into stable sub-objects so that consumers using only e.g. `orders`
       don't re-render when `inventory` changes. Each sub-object is memoized
       independently — only recomputes when its own slice changes.
    ───────────────────────────────────────────────────────────────────────── */
    const value = useMemo<AdminContextType>(() => ({
        // Inventory
        inventory, refreshInventory, warehouses, refreshWarehouses,
        stockMovements, refreshStockMovements, adjustStock, transferStock, getInventoryItem,
        // Procurement
        suppliers, refreshSuppliers, createSupplier, updateSupplier, deleteSupplier,
        purchaseOrders, refreshPurchaseOrders, createPurchaseOrder, receivePurchaseOrder,
        // Orders
        orders, refreshOrders, updateOrderStatus, deleteOrder,
        // Products
        addProduct, updateProduct, deleteProduct,
        // Catalog
        updateCategories, addBrand, updateBrand, deleteBrand,
        // Schemas & Filters
        schemas, refreshSchemas, updateSchema,
        filterConfigs, refreshFilterConfigs, updateFilterConfig,
        // Invoices
        invoices, refreshInvoices, createInvoice, updateInvoice, voidInvoice, createCreditNote,
        // Customers
        customers, refreshCustomers, createCustomer,
        // Billing
        billingProfile, refreshBillingProfile, saveBillingProfile,
        // Public data
        products, refreshProducts, categories, refreshCategories, brands, refreshBrands,
        // Saved builds
        savedBuilds, refreshSavedBuilds,
        // UI
        activeTab, setActiveTab,
        isAdmin: true,
        isLoading,
        syncData,
        // Marketing
        marketingStats, marketingCampaigns, marketingLeads, marketingContacts, marketingLogs, refreshMarketing,
    }), [
        inventory, refreshInventory, warehouses, refreshWarehouses,
        stockMovements, refreshStockMovements, adjustStock, transferStock, getInventoryItem,
        suppliers, refreshSuppliers, createSupplier, updateSupplier, deleteSupplier,
        purchaseOrders, refreshPurchaseOrders, createPurchaseOrder, receivePurchaseOrder,
        orders, refreshOrders, updateOrderStatus, deleteOrder,
        addProduct, updateProduct, deleteProduct,
        updateCategories, addBrand, updateBrand, deleteBrand,
        schemas, refreshSchemas, updateSchema,
        filterConfigs, refreshFilterConfigs, updateFilterConfig,
        invoices, refreshInvoices, createInvoice, updateInvoice, voidInvoice, createCreditNote,
        customers, refreshCustomers, createCustomer,
        billingProfile, refreshBillingProfile, saveBillingProfile,
        products, refreshProducts, categories, refreshCategories, brands, refreshBrands,
        savedBuilds, refreshSavedBuilds,
        activeTab, setActiveTab,
        isLoading, syncData,
        marketingStats, marketingCampaigns, marketingLeads, marketingContacts, marketingLogs, refreshMarketing,
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