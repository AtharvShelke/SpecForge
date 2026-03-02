export function calculateOrderFinancials(
    items: { price: number; quantity: number }[],
    taxRate: number = 0.18
) {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const gstAmount = Math.round(subtotal * taxRate);
    const total = subtotal + gstAmount;

    return {
        subtotal,
        gstAmount,
        total
    };
}
