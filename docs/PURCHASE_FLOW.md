# Purchase Flow

This document describes the complete lifecycle of a purchase in CLINIPAY, from the moment a user discovers a package in the catalog to the final order confirmation.

See also: [Purchase Flow Diagram](./diagrams/purchase-flow.md) | [Order States Diagram](./diagrams/order-states.md) | [API Sequence Diagrams](./diagrams/api-sequence.md)

---

## User Perspective

### Step 1: Browse the Catalog

The user visits the public catalog page (`/catalog`). The page calls `GET /api/packages` which returns all active packages sorted by `display_order`. Each package card shows the localized name, a brief description, the price, and a "View Details" button.

### Step 2: View Package Details

The user clicks on a package, navigating to `/packages/:id`. The page calls `GET /api/packages/:id` and displays the full package information: localized name, description, price, currency, and the list of included services (`includes_es` / `includes_en` parsed from JSON).

### Step 3: Initiate Purchase

The user clicks "Buy Now". If the user is not authenticated, they are redirected to the login page with a return URL. If authenticated, they are taken to the checkout page (`/checkout/:packageId`).

### Step 4: Review & Confirm

The checkout page displays:
- Package summary (name, description, included services).
- Buyer information (pre-filled from the user's profile: name, email, phone).
- Total amount and currency.

The user clicks "Proceed to Payment".

### Step 5: Payment

In the MVP, a payment simulation modal appears. In production, the user will be redirected to the BAC payment gateway. See [BAC Integration](./BAC_INTEGRATION.md) for details.

**MVP Simulation:** The modal offers two buttons:
- "Simulate Successful Payment" -- triggers a successful callback.
- "Simulate Failed Payment" -- triggers a failure callback.

### Step 6: Confirmation

- **Success**: The user sees a confirmation page with the order number, a success message, and links to view the order detail or return home.
- **Failure**: The user sees an error page with options to retry the payment or contact support.

### Step 7: Track the Order

The user can view all their orders at `/my-orders` and check individual order details (status, payment reference, dates) at `/orders/:id`.

---

## System Perspective (Technical Flow)

### 1. Order Creation

```
Client                     Express API                SQL Server
  |                            |                          |
  |-- POST /api/orders ------->|                          |
  |   { packageId: 1 }        |                          |
  |                            |-- findById(packageId) -->|
  |                            |<-- package data ---------|
  |                            |                          |
  |                            |-- Validate: package      |
  |                            |   active? price > 0?     |
  |                            |                          |
  |                            |-- generateOrderNumber()-->|
  |                            |<-- "CLN-20260404-0001" --|
  |                            |                          |
  |                            |-- create(order) -------->|
  |                            |<-- order record ---------|
  |                            |                          |
  |                            |-- addStatusHistory() --->|
  |                            |   pending -> pending     |
  |                            |<-- history record -------|
  |                            |                          |
  |<-- 201 { order } ---------|                          |
```

**Key details:**
- The order `amount` is a snapshot of the package `price` at the time of purchase. If the package price changes later, existing orders are not affected.
- The `order_number` is generated with format `CLN-YYYYMMDD-NNNN`, where `NNNN` is a daily sequential counter.
- Initial status is `pending`.
- A status history entry is recorded for audit.

### 2. Payment Processing (MVP Simulation)

```
Client                     Express API                SQL Server
  |                            |                          |
  |-- POST /api/orders/:id/    |                          |
  |   payment-callback ------->|                          |
  |   { success: true,         |                          |
  |     paymentReference,      |                          |
  |     paymentMethod }        |                          |
  |                            |-- findById(orderId) ---->|
  |                            |<-- order record ---------|
  |                            |                          |
  |                            |-- Validate: order        |
  |                            |   belongs to user?       |
  |                            |   status == 'pending'?   |
  |                            |                          |
  |                            |-- updateStatus('paid',   |
  |                            |   ref, method, date) --->|
  |                            |<-- updated order --------|
  |                            |                          |
  |                            |-- addStatusHistory() --->|
  |                            |   pending -> paid        |
  |                            |<-- history record -------|
  |                            |                          |
  |<-- 200 { order } ---------|                          |
```

### 3. Admin Status Management

After payment, the admin can progress the order through the workflow:

| Transition | Trigger | Description |
| ---------- | ------- | ----------- |
| `pending` -> `paid` | Payment callback | Automatic on successful payment. |
| `paid` -> `in_progress` | Admin action | Admin confirms service delivery has started. |
| `in_progress` -> `completed` | Admin action | Admin marks the service as fully delivered. |
| Any non-terminal -> `cancelled` | Admin action | Admin cancels the order (with notes). |

Each transition:
1. Validates against `VALID_TRANSITIONS` in `config/constants.js`.
2. Updates the `orders.status` column.
3. Inserts a record into `order_status_history` with the admin's user ID and optional notes.
4. Optionally sends an email notification to the client about the status change.

---

## Error Handling at Each Step

### Package Loading Errors

| Error | Handling |
| ----- | -------- |
| Network error | Toast notification: "Connection error. Check your internet." |
| Package not found (404) | Display "Package not found" message with link to catalog. |
| Package inactive | Should not appear in catalog; if accessed by direct URL, show "Package not available." |

### Order Creation Errors

| Error | Handling |
| ----- | -------- |
| Not authenticated (401) | Redirect to login with return URL. |
| Package not found (404) | Show error: "This package is no longer available." |
| Validation error (400) | Show validation message. |
| Server error (500) | Show generic error: "Something went wrong. Please try again." |

### Payment Errors

| Error | Handling |
| ----- | -------- |
| Payment declined | Show failure page with "Try Again" and "Contact Support" options. |
| Gateway timeout | Show failure page; order remains in `pending` status. User can retry. |
| Network error during callback | Order stays `pending`; user can check order status later. |

### Admin Status Update Errors

| Error | Handling |
| ----- | -------- |
| Invalid transition (400) | Show error: "This status change is not allowed." |
| Order not found (404) | Show error and redirect to order list. |
| Concurrent update conflict | The second update will see the new status and may get an invalid transition error. |

---

## Edge Cases

### User Closes Browser During Payment

- The order was already created with `pending` status before the payment modal appeared.
- The order remains `pending` indefinitely.
- **Resolution**: The user can find the order in "My Orders" and retry the payment, or the admin can manually mark it as `cancelled` after a reasonable timeout.

### Double-Click on "Proceed to Payment"

- The frontend disables the button after the first click (loading state).
- If two order creation requests somehow reach the server, each generates a unique `order_number`, resulting in two separate orders. The second can be cancelled by the admin.

### Payment Succeeds but Callback Fails

- In the BAC production flow, BAC sends a server-to-server callback. If CLINIPAY's server is temporarily down, BAC typically retries.
- In the MVP simulation, the callback is a direct frontend-to-backend call. If it fails, the order stays `pending`. The admin can manually update the status.

### Package Price Changes After Order Creation

- The order stores a snapshot of the `amount` at creation time.
- Changing the package price does not affect existing orders.
- This is by design to prevent billing discrepancies.

### User Tries to Purchase Deactivated Package

- The public catalog only shows active packages (`is_active = 1`).
- If a user bookmarked a package URL and it was later deactivated, the detail page will show "Package not found" or "Package not available."
- The order creation endpoint also validates that the package is active.

### Concurrent Admin Status Updates

- If two admins update the same order simultaneously, the second update may fail with an invalid transition error (e.g., both try to move `paid` -> `in_progress`, but the second attempt sees `in_progress` and cannot transition to `in_progress` again).
- The status history provides a complete audit trail of who changed what and when.

---

## Order Lifecycle Summary

```
[User browses catalog]
       |
       v
[User views package detail]
       |
       v
[User clicks "Buy Now"] ── not logged in ──> [Login / Register] ──> [Return to checkout]
       |
       v
[Checkout page: review & confirm]
       |
       v
[Order created: status = "pending"]
       |
       v
[Payment flow (BAC / simulation)]
       |
    success?
    /        \
  yes         no
   |           |
   v           v
[status = "paid"]    [status stays "pending"; user can retry]
   |
   v
[Admin: "in_progress"]
   |
   v
[Admin: "completed"]
```

Any non-terminal status can transition to `cancelled` by admin action.

---

## References

- [Purchase Flow Diagram](./diagrams/purchase-flow.md)
- [Order States Diagram](./diagrams/order-states.md)
- [API Sequence Diagrams](./diagrams/api-sequence.md)
- [BAC Integration Guide](./BAC_INTEGRATION.md)
- [API Reference -- Order Endpoints](./API.md#order-endpoints)
