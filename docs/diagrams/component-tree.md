# React Component Tree

```mermaid
graph TD
    App["App.jsx"]
    App --> I18nProvider["I18nProvider<br/>(react-i18next)"]
    I18nProvider --> AuthProvider["AuthProvider<br/>(AuthContext)"]
    AuthProvider --> Toaster["Toaster<br/>(react-hot-toast)"]
    Toaster --> Router["BrowserRouter<br/>(react-router-dom)"]
    Router --> Routes["Routes"]

    Routes --> PubLayout["PublicLayout<br/>(Navbar + Footer)"]
    Routes --> ProtectedRoute["ProtectedRoute<br/>(AuthGuard)"]
    Routes --> AdminRoute["AdminRoute<br/>(AdminGuard)"]

    subgraph PublicPages["Public Pages"]
        HomePage["HomePage<br/>/"]
        CatalogPage["CatalogPage<br/>/packages"]
        PackageDetailPage["PackageDetailPage<br/>/packages/:id"]
        LoginPage["LoginPage<br/>/login"]
        RegisterPage["RegisterPage<br/>/register"]
        ForgotPasswordPage["ForgotPasswordPage<br/>/forgot-password"]
        ResetPasswordPage["ResetPasswordPage<br/>/reset-password/:token"]
    end

    PubLayout --> HomePage
    PubLayout --> CatalogPage
    PubLayout --> PackageDetailPage
    PubLayout --> LoginPage
    PubLayout --> RegisterPage
    PubLayout --> ForgotPasswordPage
    PubLayout --> ResetPasswordPage

    subgraph UserPages["Authenticated User Pages"]
        CheckoutPage["CheckoutPage<br/>/checkout/:packageId"]
        MyOrdersPage["MyOrdersPage<br/>/my-orders"]
        OrderDetailPage["OrderDetailPage<br/>/my-orders/:id"]
        PaymentResultPage["PaymentResultPage<br/>/payment/result"]
    end

    ProtectedRoute --> CheckoutPage
    ProtectedRoute --> MyOrdersPage
    ProtectedRoute --> OrderDetailPage
    ProtectedRoute --> PaymentResultPage

    AdminRoute --> AdminLayout["AdminLayout<br/>(Navbar + Sidebar)"]

    subgraph AdminPages["Admin Pages"]
        AdminDashboard["AdminDashboard<br/>/admin"]
        AdminOrdersPage["AdminOrdersPage<br/>/admin/orders"]
        AdminOrderDetailPage["AdminOrderDetailPage<br/>/admin/orders/:id"]
        AdminPackagesPage["AdminPackagesPage<br/>/admin/packages"]
        AdminUsersPage["AdminUsersPage<br/>/admin/users"]
    end

    AdminLayout --> AdminDashboard
    AdminLayout --> AdminOrdersPage
    AdminLayout --> AdminOrderDetailPage
    AdminLayout --> AdminPackagesPage
    AdminLayout --> AdminUsersPage

    subgraph UI["Shared UI Components"]
        Button["Button"]
        Input["Input"]
        Spinner["Spinner"]
        Modal["Modal"]
        Card["Card"]
        Badge["Badge"]
        Table["Table"]
    end

    subgraph LayoutComps["Layout Components"]
        Navbar["Navbar"]
        Footer["Footer"]
        AdminSidebar["AdminSidebar"]
        LanguageSwitcher["LanguageSwitcher"]
    end

    PubLayout -.-> Navbar
    PubLayout -.-> Footer
    AdminLayout -.-> Navbar
    AdminLayout -.-> AdminSidebar
    Navbar -.-> LanguageSwitcher

    style App fill:#3EB489,stroke:#1B5E3B,color:#fff
    style AuthProvider fill:#A8E6CF,stroke:#1B5E3B
    style PubLayout fill:#A8E6CF,stroke:#1B5E3B
    style AdminLayout fill:#A8E6CF,stroke:#1B5E3B
    style ProtectedRoute fill:#F39C12,stroke:#e67e22
    style AdminRoute fill:#E74C3C,stroke:#c0392c,color:#fff
    style UI fill:#F7FAF8,stroke:#3EB489
    style LayoutComps fill:#F7FAF8,stroke:#3EB489
    style PublicPages fill:#F7FAF8,stroke:#ccc
    style UserPages fill:#FFF5E0,stroke:#F39C12
    style AdminPages fill:#FFE0E0,stroke:#E74C3C
```

## Component Hierarchy

### Provider Chain

The application wraps the component tree with several providers, from outermost to innermost:

1. **I18nProvider** -- Initializes react-i18next with browser language detection and ES/EN translations.
2. **AuthProvider** -- Provides `user`, `isAuthenticated`, `login`, `register`, `logout`, and `refreshUser` via React Context. Restores the session on mount using the refresh token cookie.
3. **Toaster** -- react-hot-toast notifications for success/error feedback.
4. **BrowserRouter** -- React Router v7 for client-side routing.

### Route Guards

| Guard | Checks | Redirect |
| ----- | ------ | -------- |
| **ProtectedRoute** (AuthGuard) | `isAuthenticated === true` | `/login` with return URL |
| **AdminRoute** (AdminGuard) | `isAuthenticated === true` AND `user.role === 'admin'` | `/` (home) or `/login` |

### Layouts

| Layout | Contains | Used By |
| ------ | -------- | ------- |
| **PublicLayout** | Navbar + Footer | All public pages and authenticated user pages |
| **AdminLayout** | Navbar + AdminSidebar | All admin pages |

### Shared UI Components

| Component | Purpose |
| --------- | ------- |
| `Button` | Reusable button with variants (primary, secondary, danger), sizes (sm, md, lg), and loading state. |
| `Input` | Form input with label, error display, and optional icon. |
| `Spinner` | Loading spinner (Lucide `Loader2` icon with spin animation). |
| `Modal` | Dialog overlay for payment simulation and confirmations. |
| `Card` | Content container for package cards and dashboard stats. |
| `Badge` | Status badge with color-coded order statuses. |
| `Table` | Data table for admin order/user/package listings. |

### Services (Non-component)

The `services/` directory contains Axios-based API clients, not React components:

| Service | API Calls |
| ------- | --------- |
| `api.js` | Axios instance with JWT interceptors and silent token refresh. |
| `auth.service.js` | login, register, logout, refresh, forgotPassword, resetPassword, getMe, googleLogin. |
| `packages.service.js` | getActivePackages, getPackageById. |
| `orders.service.js` | createOrder, getMyOrders, getOrderById, simulatePayment. |
| `admin.service.js` | getDashboard, getOrders, getOrderDetail, updateOrderStatus, getPackages, createPackage, updatePackage, togglePackage, getUsers. |
