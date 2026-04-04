# BAC Payment Gateway Integration Guide

This document provides a complete guide for integrating the BAC (Banco de America Central) payment gateway into CLINIPAY once production credentials and API access are available. The MVP currently uses a simulated payment flow.

---

## Current State (MVP Placeholder)

In the MVP, payments are simulated through a modal dialog on the client side. When the user clicks "Simulate Successful Payment" or "Simulate Failed Payment," the client sends a request to the callback endpoint with a flag indicating success or failure.

### Current Placeholder Files

| File | Role | What to Modify |
| ---- | ---- | -------------- |
| `client/src/services/orders.service.js` | `simulatePayment()` function | Replace with BAC redirect initiation. |
| `client/src/i18n/es.json` > `paymentModal` | Simulation UI text | Replace with real payment instructions. |
| `client/src/i18n/en.json` > `paymentModal` | Simulation UI text (EN) | Replace with real payment instructions. |
| `server/src/controllers/` (order controller) | Payment callback handler | Implement BAC signature verification and payment confirmation. |
| `server/src/routes/` (order routes) | `POST /:id/payment-callback` | Add BAC server-to-server callback route. |
| `server/src/services/` (payment service) | Does not exist yet | Create `payment.service.js` for BAC API communication. |

---

## Required Environment Variables

Add these to the `server/.env` file when BAC credentials are available:

```env
# ── BAC Payment Gateway ────────────────────────────────
BAC_MERCHANT_ID=your-bac-merchant-id
BAC_API_KEY=your-bac-api-key
BAC_API_SECRET=your-bac-api-secret
BAC_GATEWAY_URL=https://credomatic.com/gateway/api/v1
BAC_CALLBACK_URL=https://yourdomain.com/api/orders/bac-callback
BAC_RETURN_URL=https://yourdomain.com/payment-result
BAC_CANCEL_URL=https://yourdomain.com/payment-cancelled
BAC_ENVIRONMENT=sandbox
```

---

## Expected Integration Flow

### Step-by-Step

```
1. User clicks "Proceed to Payment" on checkout
2. Frontend calls POST /api/orders (creates order with status "pending")
3. Frontend calls POST /api/orders/:id/initiate-payment
4. Backend creates a payment session with BAC API:
   - Sends: merchant ID, order number, amount, currency, callback URL, return URL
   - Receives: payment session ID, redirect URL
5. Backend returns the BAC redirect URL to the frontend
6. Frontend redirects the user's browser to BAC's hosted payment page
7. User enters card details on BAC's secure page (PCI-compliant; card data never touches CLINIPAY)
8. BAC processes the payment
9. BAC sends a server-to-server callback to POST /api/orders/bac-callback
   - Includes: order reference, transaction ID, status, signature
10. Backend verifies the signature using BAC_API_SECRET
11. Backend updates the order status to "paid" (or keeps "pending" on failure)
12. Backend records a status history entry
13. BAC redirects the user's browser back to BAC_RETURN_URL with query parameters
14. Frontend displays the payment result page
```

### Sequence Diagram

```
User           Frontend         Backend           BAC Gateway
 |                |                |                   |
 |-- Buy Now ---->|                |                   |
 |                |-- POST /orders |                   |
 |                |<-- order ------+                   |
 |                |                |                   |
 |                |-- POST initiate-payment            |
 |                |                |-- Create session ->|
 |                |                |<-- redirect URL ---|
 |                |<-- redirect URL|                   |
 |                |                |                   |
 |<-- redirect to BAC ------------|                   |
 |                                |                   |
 |-- Enter card on BAC page ------|------------------>|
 |                                |                   |
 |                                |<-- callback -------|
 |                                |   (server-to-server)|
 |                                |-- verify signature |
 |                                |-- update order --->|
 |                                |                   |
 |<-- redirect to return URL -----|<-- redirect ------|
 |                |                |                   |
 |-- payment-result page -------->|                   |
```

---

## Files to Create / Modify

### 1. Create: `server/src/services/payment.service.js`

```javascript
// TODO: Implement BAC payment gateway integration
const crypto = require('crypto');

const BAC_CONFIG = {
  merchantId: process.env.BAC_MERCHANT_ID,
  apiKey: process.env.BAC_API_KEY,
  apiSecret: process.env.BAC_API_SECRET,
  gatewayUrl: process.env.BAC_GATEWAY_URL,
  callbackUrl: process.env.BAC_CALLBACK_URL,
  returnUrl: process.env.BAC_RETURN_URL,
  cancelUrl: process.env.BAC_CANCEL_URL,
};

/**
 * TODO: Create a payment session with BAC.
 * @param {Object} order - The order object (id, order_number, amount, currency).
 * @returns {Object} - { sessionId, redirectUrl }
 */
async function createPaymentSession(order) {
  // TODO: Replace with actual BAC API call
  // const payload = {
  //   merchantId: BAC_CONFIG.merchantId,
  //   orderReference: order.order_number,
  //   amount: order.amount,
  //   currency: order.currency,
  //   callbackUrl: BAC_CONFIG.callbackUrl,
  //   returnUrl: `${BAC_CONFIG.returnUrl}?orderId=${order.id}`,
  //   cancelUrl: BAC_CONFIG.cancelUrl,
  // };
  //
  // const signature = generateSignature(payload);
  // payload.signature = signature;
  //
  // const response = await fetch(`${BAC_CONFIG.gatewayUrl}/sessions`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${BAC_CONFIG.apiKey}`,
  //   },
  //   body: JSON.stringify(payload),
  // });
  //
  // const data = await response.json();
  // return { sessionId: data.sessionId, redirectUrl: data.redirectUrl };

  throw new Error('BAC payment gateway not yet integrated. Use simulated payments.');
}

/**
 * TODO: Verify the signature on a BAC callback.
 * @param {Object} callbackData - Raw callback payload from BAC.
 * @returns {boolean} - Whether the signature is valid.
 */
function verifyCallbackSignature(callbackData) {
  // TODO: Implement signature verification
  // const { signature, ...data } = callbackData;
  // const expectedSignature = generateSignature(data);
  // return crypto.timingSafeEqual(
  //   Buffer.from(signature),
  //   Buffer.from(expectedSignature)
  // );

  return false;
}

/**
 * TODO: Generate HMAC signature for BAC API requests.
 */
function generateSignature(payload) {
  // TODO: Follow BAC's signature specification
  // const message = Object.keys(payload)
  //   .sort()
  //   .map(k => `${k}=${payload[k]}`)
  //   .join('&');
  // return crypto
  //   .createHmac('sha256', BAC_CONFIG.apiSecret)
  //   .update(message)
  //   .digest('hex');

  return '';
}

module.exports = {
  createPaymentSession,
  verifyCallbackSignature,
};
```

### 2. Modify: `server/src/routes/` (order routes)

Add a new route for the BAC server-to-server callback:

```javascript
// TODO: Add when BAC integration is ready
// router.post('/bac-callback', bacCallbackHandler);
```

This endpoint does NOT require JWT authentication (it is called by BAC's servers), but it MUST verify the BAC signature.

### 3. Modify: `server/src/controllers/` (order controller)

Add a `bacCallbackHandler` function:

```javascript
// TODO: Implement BAC callback handler
async function bacCallbackHandler(req, res) {
  // 1. Verify BAC signature
  // 2. Extract order reference and payment status
  // 3. Find the order by order_number
  // 4. Check idempotency: if order is already "paid", return 200 OK
  // 5. Update order status + payment fields
  // 6. Record status history
  // 7. Send confirmation email to client
  // 8. Return 200 OK to BAC
}
```

### 4. Modify: `client/src/services/orders.service.js`

Replace `simulatePayment()` with a function that initiates the BAC redirect:

```javascript
// TODO: Replace simulation with BAC redirect
export async function initiatePayment(orderId) {
  const { data } = await api.post(`/orders/${orderId}/initiate-payment`);
  // data.redirectUrl contains the BAC hosted payment page URL
  window.location.href = data.redirectUrl;
}
```

### 5. Modify: Client payment result page

Create or modify the payment result page to handle BAC's return redirect:

```javascript
// TODO: Parse BAC return URL query parameters
// const urlParams = new URLSearchParams(window.location.search);
// const orderId = urlParams.get('orderId');
// const status = urlParams.get('status');
// Fetch order details and display result
```

---

## Step-by-Step Integration Checklist

- [ ] **1. Obtain BAC credentials**: Merchant ID, API key, API secret, sandbox URL.
- [ ] **2. Configure environment variables**: Add all `BAC_*` variables to `.env`.
- [ ] **3. Create `payment.service.js`**: Implement `createPaymentSession()`, `verifyCallbackSignature()`, and `generateSignature()`.
- [ ] **4. Add initiation endpoint**: `POST /api/orders/:id/initiate-payment` in the order routes.
- [ ] **5. Add BAC callback endpoint**: `POST /api/orders/bac-callback` (no JWT auth, BAC signature verification only).
- [ ] **6. Implement callback handler**: Verify signature, update order, record history, send email.
- [ ] **7. Handle idempotency**: If the callback is received multiple times for the same order, do not double-process.
- [ ] **8. Update frontend**: Replace simulation modal with BAC redirect flow.
- [ ] **9. Create payment result page**: Handle BAC return redirect and display order status.
- [ ] **10. Test in BAC sandbox**: Verify the full flow with BAC test cards.
- [ ] **11. Enable HTTPS**: BAC requires HTTPS for callback URLs. Set up SSL certificates.
- [ ] **12. Switch to production**: Update `BAC_GATEWAY_URL` and `BAC_ENVIRONMENT` to production values.
- [ ] **13. Remove simulation code**: Delete `simulatePayment()` and the payment modal component.

---

## Security Considerations

### Signature Verification

Every callback from BAC MUST have its signature verified before processing. Use `crypto.timingSafeEqual()` to prevent timing attacks.

### HTTPS Required

BAC requires that callback URLs use HTTPS. All production endpoints must be served over TLS/SSL.

### Idempotency

BAC may send the same callback multiple times (retries). The callback handler must be idempotent:
1. Check if the order is already in the `paid` status.
2. If yes, return 200 OK without making any changes.
3. If no, process the payment and update the order.

### No Sensitive Data in URLs

Do not include amounts, user IDs, or payment details in return/cancel URLs. Use only the order ID, and fetch details from the database.

### Server-to-Server Callback

The BAC callback is a server-to-server POST request. It does NOT come from the user's browser. Do not require JWT authentication on this endpoint. Instead, verify the BAC signature.

### Card Data

CLINIPAY never handles, stores, or transmits card data. Users enter their card details on BAC's PCI-compliant hosted payment page. This keeps CLINIPAY outside of PCI DSS scope.

### Logging

Log all callback payloads (excluding sensitive fields) for debugging and dispute resolution. Include timestamps, order references, transaction IDs, and the verification result.

---

## References

- [Purchase Flow](./PURCHASE_FLOW.md)
- [Order States Diagram](./diagrams/order-states.md)
- [API Sequence Diagrams](./diagrams/api-sequence.md)
- [Security](./SECURITY.md)
