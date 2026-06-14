/**
 * App — root component with React Router and global providers.
 * Routes: Home (/), Product detail (/product/:slug), Checkout (/checkout), Admin (/admin/*).
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import { HomePage } from './pages/HomePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { SiteMeta } from './components/SiteMeta';
import { scrollToPageHeaderAfterPaint } from './lib/scrollToTop';

const CheckoutPage = lazy(() =>
  import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage }))
);
const RequireAdmin = lazy(() =>
  import('./pages/admin/RequireAdmin').then((m) => ({ default: m.RequireAdmin }))
);
const AdminLayout = lazy(() =>
  import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);
const AdminLoginPage = lazy(() =>
  import('./pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage }))
);
const AdminPendingPage = lazy(() =>
  import('./pages/admin/AdminPendingPage').then((m) => ({ default: m.AdminPendingPage }))
);
const AdminApprovedPage = lazy(() =>
  import('./pages/admin/AdminApprovedPage').then((m) => ({ default: m.AdminApprovedPage }))
);
const AdminStatsPage = lazy(() =>
  import('./pages/admin/AdminStatsPage').then((m) => ({ default: m.AdminStatsPage }))
);
const AdminProductsPage = lazy(() =>
  import('./pages/admin/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage }))
);

function AppRoutes() {
  const location = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const toggleCart = () => setCartOpen((prev) => !prev);

  useEffect(() => {
    scrollToPageHeaderAfterPaint();
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === '/' && location.hash === '#product') {
      const el = document.getElementById('product');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.pathname, location.hash]);

  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<HomePage cartOpen={cartOpen} onCartOpen={toggleCart} setCartOpen={setCartOpen} />} />
        <Route
          path="/product/:slug"
          element={<ProductDetailPage cartOpen={cartOpen} onCartOpen={toggleCart} setCartOpen={setCartOpen} />}
        />
        <Route path="/checkout" element={<CheckoutPage />} />

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="pending" replace />} />
            <Route path="orders" element={<Navigate to="/admin/pending" replace />} />
            <Route path="pending" element={<AdminPendingPage />} />
            <Route path="approved" element={<AdminApprovedPage />} />
            <Route path="stats" element={<AdminStatsPage />} />
            <Route path="products" element={<AdminProductsPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <LanguageProvider>
        <CartProvider>
          <SiteMeta />
          <AppRoutes />
        </CartProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
