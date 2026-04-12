import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Toast from './components/ui/Toast';

import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/guards/ProtectedRoute';
import AdminRoute from './components/guards/AdminRoute';
import usePageTracking from './hooks/usePageTracking';

// Lazy-loaded public pages
const HomePage = lazy(() => import('./pages/public/HomePage'));
const CatalogPage = lazy(() => import('./pages/public/CatalogPage'));
const PackageDetailPage = lazy(() => import('./pages/public/PackageDetailPage'));
const LoginPage = lazy(() => import('./pages/public/LoginPage'));
const RegisterPage = lazy(() => import('./pages/public/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/public/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/public/ResetPasswordPage'));

// Lazy-loaded user pages
const CartPage = lazy(() => import('./pages/user/CartPage'));
const CheckoutPage = lazy(() => import('./pages/user/CheckoutPage'));
const MyOrdersPage = lazy(() => import('./pages/user/MyOrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/user/OrderDetailPage'));
const PaymentResultPage = lazy(() => import('./pages/user/PaymentResultPage'));

// Lazy-loaded admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminOrderDetailPage = lazy(() => import('./pages/admin/AdminOrderDetailPage'));
const AdminPackagesPage = lazy(() => import('./pages/admin/AdminPackagesPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-3 border-mint-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// Page tracking wrapper — must be inside BrowserRouter
function AppRoutes() {
  usePageTracking();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes with standard layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/packages" element={<CatalogPage />} />
          <Route path="/packages/:id" element={<PackageDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          {/* Cart (public, no auth required to browse) */}
          <Route path="/cart" element={<CartPage />} />

          {/* Protected user routes */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/result"
            element={
              <ProtectedRoute>
                <PaymentResultPage />
              </ProtectedRoute>
            }
          />

          {/* 404 catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin routes with admin layout */}
        <Route
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
          <Route path="/admin/packages" element={<AdminPackagesPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

// Inline 404 page
function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-6xl font-bold text-mint-500 mb-4">404</h1>
      <p className="text-xl text-slate-700 mb-2">Pagina no encontrada</p>
      <p className="text-slate-500 mb-8 max-w-md">
        La pagina que buscas no existe o ha sido movida.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href="/"
          className="px-6 py-3 bg-mint-500 hover:bg-mint-600 text-white font-semibold rounded-lg transition-colors"
        >
          Ir al inicio
        </a>
        <a
          href="/packages"
          className="px-6 py-3 bg-white hover:bg-slate-50 text-forest-500 font-semibold border-2 border-mint-500 rounded-lg transition-colors"
        >
          Ver paquetes
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toast />
          <AppRoutes />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
