import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Toast from './components/ui/Toast';

import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/guards/ProtectedRoute';
import AdminRoute from './components/guards/AdminRoute';

// Public pages
import HomePage from './pages/public/HomePage';
import CatalogPage from './pages/public/CatalogPage';
import PackageDetailPage from './pages/public/PackageDetailPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import ResetPasswordPage from './pages/public/ResetPasswordPage';

// User pages
import CheckoutPage from './pages/user/CheckoutPage';
import MyOrdersPage from './pages/user/MyOrdersPage';
import OrderDetailPage from './pages/user/OrderDetailPage';
import PaymentResultPage from './pages/user/PaymentResultPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminOrderDetailPage from './pages/admin/AdminOrderDetailPage';
import AdminPackagesPage from './pages/admin/AdminPackagesPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toast />
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

            {/* Protected user routes */}
            <Route
              path="/checkout/:packageId"
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
      </BrowserRouter>
    </AuthProvider>
  );
}
