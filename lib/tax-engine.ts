/**
 * Unified Tax Engine
 *
 * Replaces the dual tax calculation approach:
 * - lib/gst.ts: flat 18% on subtotal (used by Orders)
 * - services/billingUtils.ts#computeInvoiceTotals: per-line-item rates (used by Invoices)
 *
 * This module provides a single source of truth for all tax calculations
 * across orders, invoices, and credit notes.
 */

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────

export interface TaxLineInput {
    unitPrice: number;
    quantity: number;
    hsnCode?: string;
    discountPct?: number;
    taxRatePct?: number; // override; if not provided, looked up by HSN or defaults to 18%
}

export interface TaxLineResult {
    subtotal: number;       // qty * unitPrice
    discount: number;       // discount amount
    taxableAmount: number;  // after discount
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    lineTotal: number;      // taxableAmount + totalTax
    taxRatePct: number;     // effective rate used
}

export interface TaxCalculationResult {
    lineResults: TaxLineResult[];
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    grandTotal: number;
    isInterState: boolean;
}

export interface TaxConfig {
    placeOfSupply?: string;  // state code of buyer
    sellerState?: string;    // state code of seller (from BillingProfile)
    items: TaxLineInput[];
}

// ─────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────

/** Round to 2 decimal places (standard for currency) */
export function roundCurrency(n: number): number {
    return Math.round(n * 100) / 100;
}

/**
 * Lookup GST rate by HSN code.
 * In production, this would query a database or external API.
 * For now, defaults to 18% (standard GST slab for electronics).
 */
export function lookupGSTRate(hsnCode?: string): number {
    // PC components generally fall under 18% GST slab
    // HSN 8471 (computers), 8473 (parts), 8528 (monitors)
    if (!hsnCode) return 18;

    const HSN_RATES: Record<string, number> = {
        '8471': 18, // Computers and peripherals
        '8473': 18, // Parts and accessories for computers
        '8528': 18, // Monitors and projectors
        '8534': 18, // PCBs (motherboards)
        '8504': 18, // Power supplies / transformers
        '8414': 18, // Fans / coolers
        '8544': 18, // Cables
        '8517': 18, // Networking equipment
        '8542': 18, // Integrated circuits (processors, GPUs)
        '8523': 18, // Storage devices
        '8471.30': 18, // Laptops
    };

    // Match exact or prefix
    const rate = HSN_RATES[hsnCode] ?? HSN_RATES[hsnCode.substring(0, 4)];
    return rate ?? 18;
}

// ─────────────────────────────────────────────────
// MAIN CALCULATION
// ─────────────────────────────────────────────────

/**
 * Unified tax calculation for all commerce flows.
 *
 * @param config - Items and optional place-of-supply info
 * @returns Full tax breakdown per line item and totals
 */
export function calculateTax(config: TaxConfig): TaxCalculationResult {
    const { items, placeOfSupply, sellerState } = config;
    const isInterState = !!(placeOfSupply && sellerState && placeOfSupply !== sellerState);

    const lineResults: TaxLineResult[] = items.map(item => {
        const taxRatePct = item.taxRatePct ?? lookupGSTRate(item.hsnCode);
        const subtotal = roundCurrency(item.unitPrice * item.quantity);
        const discountPct = Math.max(0, Math.min(100, item.discountPct ?? 0));
        const discount = roundCurrency(subtotal * discountPct / 100);
        const taxableAmount = roundCurrency(subtotal - discount);

        const totalTax = roundCurrency(taxableAmount * taxRatePct / 100);

        const cgst = isInterState ? 0 : roundCurrency(totalTax / 2);
        const sgst = isInterState ? 0 : roundCurrency(totalTax / 2);
        const igst = isInterState ? totalTax : 0;

        return {
            subtotal,
            discount,
            taxableAmount,
            cgst,
            sgst,
            igst,
            totalTax,
            lineTotal: roundCurrency(taxableAmount + totalTax),
            taxRatePct,
        };
    });

    const subtotal = roundCurrency(lineResults.reduce((s, r) => s + r.subtotal, 0));
    const totalDiscount = roundCurrency(lineResults.reduce((s, r) => s + r.discount, 0));
    const totalTax = roundCurrency(lineResults.reduce((s, r) => s + r.totalTax, 0));
    const grandTotal = roundCurrency(lineResults.reduce((s, r) => s + r.lineTotal, 0));

    return {
        lineResults,
        subtotal,
        totalDiscount,
        totalTax,
        grandTotal,
        isInterState,
    };
}

// ─────────────────────────────────────────────────
// BACKWARD COMPAT — replaces lib/gst.ts
// ─────────────────────────────────────────────────

/**
 * Drop-in replacement for the old `calculateOrderFinancials`.
 * Maintains the same return shape for existing callers.
 */
export function calculateOrderFinancials(
    items: { price: number; quantity: number }[],
    taxRate: number = 0.18
): { subtotal: number; gstAmount: number; taxAmount: number; total: number } {
    const taxInputs: TaxLineInput[] = items.map(i => ({
        unitPrice: i.price,
        quantity: i.quantity,
        taxRatePct: taxRate * 100,
    }));

    const result = calculateTax({ items: taxInputs });

    return {
        subtotal: result.subtotal,
        gstAmount: result.totalTax, // backward compat field
        taxAmount: result.totalTax, // new unified field
        total: result.grandTotal,
    };
}
