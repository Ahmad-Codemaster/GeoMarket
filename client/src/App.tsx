import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from './components/ui/toaster';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { UserRole } from '@geomarket/shared';

// Public pages
import { HomePage } from './pages/public/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterCustomerPage } from './pages/auth/RegisterCustomerPage';
import { RegisterVendorPage } from './pages/auth/RegisterVendorPage';
import { NotFoundPage } from './pages/common/NotFoundPage';

// Customer pages
import { CustomerDashboardPage } from './pages/customer/CustomerDashboardPage';
import { CustomerProfilePage } from './pages/customer/CustomerProfilePage';
import { SavedAddressesPage } from './pages/customer/SavedAddressesPage';
import { StoresDiscoveryPage } from './pages/customer/StoresDiscoveryPage';
import { StoreDetailPage } from './pages/customer/StoreDetailPage';
import { CartPage } from './pages/customer/CartPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { CustomerOrdersPage } from './pages/customer/CustomerOrdersPage';
import { OrderDetailPage } from './pages/customer/OrderDetailPage';
import { ProductsCatalogPlaceholder } from './pages/customer/CustomerPlaceholders';


// Vendor pages
import { VendorDashboardPage } from './pages/vendor/VendorDashboardPage';
import { VendorProfilePage } from './pages/vendor/VendorProfilePage';
import { VendorStoresPage } from './pages/vendor/VendorStoresPage';
import { VendorProductsPage } from './pages/vendor/VendorProductsPage';
import { VendorOrdersPage } from './pages/vendor/VendorOrdersPage';

// Admin pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminStoresPage } from './pages/admin/AdminStoresPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterCustomerPage />} />
          <Route path="/register/vendor" element={<RegisterVendorPage />} />

          {/* Application shell */}
          <Route element={<AppLayout />}>
            {/* Public store discovery routes */}
            <Route path="/stores" element={<StoresDiscoveryPage />} />
            <Route path="/stores/:id" element={<StoreDetailPage />} />

            {/* Customer Routes — CUSTOMER role required */}
            <Route element={<ProtectedRoute roles={[UserRole.CUSTOMER]} />}>
              <Route path="/dashboard" element={<CustomerDashboardPage />} />
              <Route path="/profile" element={<CustomerProfilePage />} />
              <Route path="/addresses" element={<SavedAddressesPage />} />
              <Route path="/products" element={<ProductsCatalogPlaceholder />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders" element={<CustomerOrdersPage />} />
              <Route path="/orders/:orderId" element={<OrderDetailPage />} />
            </Route>

            {/* Vendor Routes — VENDOR role required */}
            <Route element={<ProtectedRoute roles={[UserRole.VENDOR]} />}>
              <Route path="/vendor" element={<VendorDashboardPage />} />
              <Route path="/vendor/profile" element={<VendorProfilePage />} />
              <Route path="/vendor/stores" element={<VendorStoresPage />} />
              <Route path="/vendor/stores/:storeId/products" element={<VendorProductsPage />} />
              <Route path="/vendor/products" element={<VendorProductsPage />} />
              <Route path="/vendor/orders" element={<VendorOrdersPage />} />
            </Route>

            {/* Admin Routes — ADMIN role required */}
            <Route element={<ProtectedRoute roles={[UserRole.ADMIN]} />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/stores" element={<AdminStoresPage />} />
              <Route path="/admin/categories" element={<AdminCategoriesPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            </Route>
          </Route>

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
