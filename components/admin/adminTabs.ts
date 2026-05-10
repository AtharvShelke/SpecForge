export const ADMIN_TAB_LABELS: Record<string, string> = {
    overview: 'Overview',
    orders: 'Orders',
    products: 'Products',
    inventory: 'Inventory',
    categories: 'Categories',
    brands: 'Brands',
    'saved-builds': 'Saved Builds',
    
} as const;

export const ADMIN_VALID_TABS = Object.keys(ADMIN_TAB_LABELS);

export function getAdminTab(tab: string | null): string {
    return tab && ADMIN_VALID_TABS.includes(tab) ? tab : 'overview';
}
