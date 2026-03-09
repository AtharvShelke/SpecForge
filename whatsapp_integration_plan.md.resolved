# WhatsApp Integration Plan

This document outlines the step-by-step plan to integrate WhatsApp notifications into the overall application. The goal is to notify customers and the admin when an order is placed and whenever its status updates.

## 1. Environment Variables Setup

First, we need to add the required credentials for the WhatsApp API Provider (e.g., Meta WhatsApp Cloud API, Twilio, or Msg91) and configure the hardcoded admin phone number.

Add the following to your [.env](file:///e:/web-dev/pc-system/md_client/.env) file:

```env
# WhatsApp API Configuration (using generic placeholder names)
WHATSAPP_API_URL="https://your-whatsapp-provider-api.com/v1/messages"
WHATSAPP_API_KEY="your-secret-api-key"
WHATSAPP_PHONE_NUMBER_ID="your-sender-phone-number-id"

# Admin Phone Number for Order Notifications
ADMIN_WHATSAPP_NUMBER="+917517616955"
```

## 2. Create the WhatsApp Service

Create a dedicated, decoupled service to handle all WhatsApp communications. 

**File:** `services/whatsappService.ts`

**Responsibilities:**
- Provide a generic `sendWhatsAppMessage(to: string, message: string)` function to call the provider's API.
- Provide helper functions for specific events, internally formatting the messages.

```typescript
// Proposed structure for services/whatsappService.ts
export async function sendWhatsAppMessage(to: string, message: string) {
    // 1. Format the 'to' number (e.g., remove spaces, ensure country code)
    // 2. Make an HTTP POST request to the WhatsApp API provider
    // 3. Handle success and log any errors without crashing the main application flow
}

export async function sendOrderConfirmationCustomer(orderId: string, customerPhone: string, trackingLink: string) {
    const message = `Hello! Your order #${orderId} has been successfully placed. Track your order here: ${trackingLink}`;
    await sendWhatsAppMessage(customerPhone, message);
}

export async function sendOrderConfirmationAdmin(orderId: string, customerName: string, total: number) {
    const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER || "+917517616955";
    const message = `🚨 New Order Alert! Order #${orderId} placed by ${customerName}. Total: ₹${total}`;
    await sendWhatsAppMessage(adminPhone, message);
}

export async function sendOrderStatusUpdate(orderId: string, customerPhone: string, newStatus: string) {
    const message = `Update on your order #${orderId}: Your order is now marked as ${newStatus}.`;
    await sendWhatsAppMessage(customerPhone, message);
}
```

## 3. Modify Order Creation (`POST /api/orders`)

When a user places an order, we need to trigger the WhatsApp notifications asynchronously.

**File:** [app/api/orders/route.ts](file:///e:/web-dev/pc-system/md_client/app/api/orders/route.ts)

**Changes Required:**
1. Import `sendOrderConfirmationCustomer` and `sendOrderConfirmationAdmin` from `whatsappService.ts`.
2. After the `prisma.$transaction` block successfully finishes and the order is created, trigger the WhatsApp notifications.
3. Because WhatsApp API calls can take time or fail, we must wrap them in a `try/catch` block so a failure to send a message doesn't abort the client's checkout request. We should also not `await` them tightly if it delays the response, or we should use an asynchronous queue if we have one. For now, a non-blocking floating promise or a simple awaited block inside a `try/catch` before returning `NextResponse` will suffice.

*Implementation Example:*
```typescript
// After prisma.$transaction...
try {
    const trackingLink = `https://yourdomain.com/track/${order.id}`;
    
    // Notify Customer (if phone is provided)
    if (order.phone) {
        // We can omit await here to make it fire-and-forget, 
        // or await it if we want to log failures immediately.
        sendOrderConfirmationCustomer(order.id, order.phone, trackingLink).catch(console.error);
    }

    // Notify Admin
    sendOrderConfirmationAdmin(order.id, order.customerName, order.total).catch(console.error);
} catch (error) {
    console.error("Failed to trigger WhatsApp notifications on order creation:", error);
}

return NextResponse.json(order, { status: 201 });
```

## 4. Modify Order Updates (`PATCH /api/orders/[id]`)

Whenever the admin or system updates the status of an order, we should notify the customer and the admin.

**File:** [app/api/orders/[id]/route.ts](file:///e:/web-dev/pc-system/md_client/app/api/orders/%5Bid%5D/route.ts)

**Changes Required:**
1. Inside the [PATCH](file:///e:/web-dev/pc-system/md_client/app/api/orders/%5Bid%5D/route.ts#53-182) handler, after the `prisma.$transaction` completes successfully and the order status is updated.
2. We need the customer's phone number. Currently, [PATCH](file:///e:/web-dev/pc-system/md_client/app/api/orders/%5Bid%5D/route.ts#53-182) returns the `updated` order, but we must ensure `customer.phone` is fetched. The `existing` order or `updated` order must query the `phone` field. (Looking at [GET](file:///e:/web-dev/pc-system/md_client/app/api/orders/route.ts#51-124) and [POST](file:///e:/web-dev/pc-system/md_client/app/api/orders/route.ts#125-261), `phone` is standard on the order model).
3. Call `sendOrderStatusUpdate()`.

*Implementation Example:*
```typescript
// After prisma.$transaction...
try {
    // Notify Customer
    if (updated.phone) {
        sendOrderStatusUpdate(updated.id, updated.phone, newStatus).catch(console.error);
    }
    
    // Notify Admin (Optional, but good for tracking state changes)
    const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER || "+917517616955";
    const adminMsg = `Order #${updated.id} status changed from ${oldStatus} to ${newStatus}.`;
    sendWhatsAppMessage(adminPhone, adminMsg).catch(console.error);
    
} catch (error) {
    console.error("Failed to trigger WhatsApp notification on order update", error);
}

return NextResponse.json(updated);
```

## 5. Potential WhatsApp Providers to Consider
If you haven't selected a provider yet, here are the top choices depending on your location and scale:
- **Meta WhatsApp Cloud API:** Free to set up, requires Facebook Business Verification. You pay per conversation. Highly recommended for long-term scalability.
- **Twilio:** Easy API, but acts as a middleman. Good for quick setups.
- **Msg91 or Interakt (India specific):** Excellent for Indian businesses, specialized in OTPs and conversational API.
- **Kapso / Ultramsg:** Good for simple setups using scanning the QR code of your own phone (unofficial APIs) if you want to bypass official business registration during the MVP phase.

## 6. Message Templates & Formatting
*Note: If using official Meta Business API, your initial outbound templates MUST be pre-approved by Meta.*

**Approved Template Examples (to submit to Meta):**
- **Template Name:** `order_confirmation`
  **Body:** `Hello {{1}}! Your order #{{2}} has been successfully placed. Track your order here: {{3}}. Thank you for shopping with us!`
- **Template Name:** `admin_new_order_alert`
  **Body:** `🚨 New Order Alert! Order #{{1}} placed by {{2}}. Total: ₹{{3}}`
- **Template Name:** `order_status_update`
  **Body:** `Update on your order #{{1}}: Your order is now marked as {{2}}.`

## Next Steps
1. Sign up for your preferred WhatsApp API provider and obtain API keys.
2. Create the `services/whatsappService.ts` file and paste the implementation code using your provider's SDK or via standard `fetch` queries.
3. Inject the helper functions into [app/api/orders/route.ts](file:///e:/web-dev/pc-system/md_client/app/api/orders/route.ts) and [app/api/orders/[id]/route.ts](file:///e:/web-dev/pc-system/md_client/app/api/orders/%5Bid%5D/route.ts).
4. Test with dev/sandbox numbers first.
