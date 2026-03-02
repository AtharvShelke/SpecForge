import { calculateOrderFinancials } from '../lib/gst';

describe('GST Calculation Utility', () => {
    it('calculates the subtotal, 18% GST amount, and total correctly', () => {
        const items = [
            { price: 1000, quantity: 2 }, // 2000
            { price: 500, quantity: 1 }   // 500
        ]; // Subtotal = 2500

        // Expected 18% of 2500 = 450
        // Expected total = 2950
        const result = calculateOrderFinancials(items);

        expect(result.subtotal).toBe(2500);
        expect(result.gstAmount).toBe(450);
        expect(result.total).toBe(2950);
    });

    it('handles rounding logic for floating point calculations', () => {
        const items = [
            { price: 99.99, quantity: 1 } // Subtotal = 99.99
        ];

        // 18% of 99.99 = 17.9982 (Rounds to 18)
        // Total = 99.99 + 18 = 117.99
        const result = calculateOrderFinancials(items);

        expect(result.subtotal).toBe(99.99);
        expect(result.gstAmount).toBe(18);
        expect(result.total).toBe(117.99);
    });

    it('returns zeroes for an empty cart', () => {
        const items: { price: number; quantity: number }[] = [];
        const result = calculateOrderFinancials(items);

        expect(result.subtotal).toBe(0);
        expect(result.gstAmount).toBe(0);
        expect(result.total).toBe(0);
    });
});
