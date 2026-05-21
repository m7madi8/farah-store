ف/**
 * App — root component with React Router and global providers.
 * Routes: Home (/), Product detail (/product/:slug), Checkout (/checkout), Admin (/admin/*).
 */

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import { HomePage } from './pages/HomePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { RequireAdmin } from './pages/admin/RequireAdmin';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminPendingPage } from './pages/admin/AdminPendingPage';
import { AdminApprovedPage } from './pages/admin/AdminApprovedPage';
import { AdminStatsPage } from './pages/admin/AdminStatsPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';

function AppRoutes() {
  const location = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const toggleCart = () => setCartOpen((prev) => !prev);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (location.hash === '#product') {
      const el = document.getElementById('product');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.pathname, location.hash]);

  return (
    <>
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
    </>
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
          <AppRoutes />
        </CartProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
