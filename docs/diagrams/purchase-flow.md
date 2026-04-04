# Purchase Flow

```mermaid
flowchart TD
    A[User browses catalog] --> B[Selects a package]
    B --> C[Clicks 'Buy Now']
    C --> D{Is user logged in?}
    D -->|No| E[Redirect to /login with returnUrl]
    E --> F[User logs in / registers]
    F --> G[Redirect back to checkout]
    D -->|Yes| G[Checkout Page]
    G --> H[Review package summary & buyer info]
    H --> I[Click 'Proceed to Payment']
    I --> J[Backend: Create order - status: pending]
    J --> K{BAC Available?}
    K -->|No - MVP| L[Show Payment Simulation Modal]
    K -->|Yes - Production| M[Redirect to BAC payment page]

    L --> N{User simulates...}
    N -->|Simulate Success| O[Backend: POST payment-callback - success: true]
    N -->|Simulate Failure| P[Backend: POST payment-callback - success: false]

    M --> Q{BAC Callback}
    Q -->|Payment Confirmed| O
    Q -->|Payment Failed| P

    O --> R[Backend: Update order status to 'paid']
    R --> S[Backend: Record status history]
    S --> T[Backend: Send confirmation email to client]
    T --> U[Backend: Send notification email to admin]
    U --> V[Show order confirmation page with order number]

    P --> W[Order remains 'pending']
    W --> X{User action}
    X -->|Retry| I
    X -->|Give up| Y[Order stays pending until admin cancels]

    subgraph AdminFlow["Admin Post-Payment Flow"]
        V --> AA[Admin reviews order in dashboard]
        AA --> AB[Admin changes status to 'in_progress']
        AB --> AC[Patient receives medical service]
        AC --> AD[Admin marks order as 'completed']
    end

    subgraph CancelFlow["Cancellation"]
        AA --> AE[Admin cancels order with notes]
        AB --> AE
    end

    style A fill:#A8E6CF,stroke:#1B5E3B
    style V fill:#27AE60,stroke:#1B5E3B,color:#fff
    style AD fill:#3EB489,stroke:#1B5E3B,color:#fff
    style P fill:#E74C3C,stroke:#c0392c,color:#fff
    style W fill:#F39C12,stroke:#e67e22,color:#000
    style L fill:#F39C12,stroke:#e67e22,color:#fff
    style AE fill:#E74C3C,stroke:#c0392c,color:#fff
```

## Flow Summary

### Happy Path

1. User browses the catalog and selects a package.
2. User clicks "Buy Now" -- if not logged in, redirected to login first.
3. User reviews package details and buyer information on the checkout page.
4. User clicks "Proceed to Payment."
5. Backend creates an order with status `pending`.
6. Payment is processed (simulated in MVP, BAC redirect in production).
7. On success, order status becomes `paid`.
8. Confirmation emails are sent to the client and admin.
9. User sees the order confirmation page.
10. Admin later moves the order through `in_progress` to `completed`.

### Failure Path

1. If payment fails, the order stays in `pending` status.
2. The user can retry the payment from the order detail page.
3. If the user abandons, the admin can manually cancel the order.

### Edge Cases

- **Browser closes during payment**: Order is already created as `pending`. User can find it in "My Orders" and retry.
- **Payment gateway timeout**: Order stays `pending`. BAC may send a delayed callback for production.
- **Double order**: Each "Proceed to Payment" creates a new order. Duplicate orders can be cancelled by admin.
