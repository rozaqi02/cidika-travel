// src/App.jsx
import "nprogress/nprogress.css";
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import NProgress from "nprogress";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Destinasi from "./pages/Destinasi";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import Kustomisasi from "./pages/admin/Kustomisasi";
import Orderan from "./pages/admin/Orderan";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "./context/ThemeContext";
import { CartProvider } from "./context/CartContext";
import WishlistDrawer from "./components/WishlistDrawer"; // rename dari CartDrawer
import Checkout from "./pages/Checkout";
import { CurrencyProvider } from "./context/CurrencyContext";
import { AuthProvider } from "./context/AuthContext";
import ScrollProgressBar from "./components/ScrollProgressBar";

NProgress.configure({ showSpinner: false, trickleSpeed: 120 });

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    NProgress.start();
    window.scrollTo({ top: 0, behavior: "instant" }); // no smooth biar cepat & tanpa repaint panjang
    NProgress.done();
  }, [pathname]);
  return null;
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  in: { opacity: 1, y: 0, transition: { duration: 0.18 } },
  out: { opacity: 0, y: -6, transition: { duration: 0.12 } },
};

function Layout({ children, onWishlistOpen }) {
  const location = useLocation();

  // trigger NProgress on route change start (mount)
  useEffect(() => {
    NProgress.start();
    const t = setTimeout(() => NProgress.done(), 300);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <>
      <ScrollProgressBar />
      <Navbar onCartOpen={onWishlistOpen} /> {/* prop lama dipakai ulang */}
      <main className="min-h-[70vh] pt-16">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={pageVariants.initial}
            animate={pageVariants.in}
            exit={pageVariants.out}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  const [wishOpen, setWishOpen] = useState(false);
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider> {/* pakai context lama, tapi UI-nya “wishlist” */}
            <ScrollToTop />
            <WishlistDrawer open={wishOpen} onClose={() => setWishOpen(false)} />
            <Routes>
              <Route path="/" element={<Layout onWishlistOpen={() => setWishOpen(true)}><Home /></Layout>} />
              <Route path="/explore" element={<Layout onWishlistOpen={() => setWishOpen(true)}><Explore /></Layout>} />
              <Route path="/destinasi" element={<Layout onWishlistOpen={() => setWishOpen(true)}><Destinasi /></Layout>} />
              <Route path="/faq" element={<Layout onWishlistOpen={() => setWishOpen(true)}><FAQ /></Layout>} />
              <Route path="/contact" element={<Layout onWishlistOpen={() => setWishOpen(true)}><Contact /></Layout>} />
              <Route path="/checkout" element={<Layout onWishlistOpen={() => setWishOpen(true)}><Checkout /></Layout>} />

              <Route path="/admin/login" element={<Layout><Login /></Layout>} />
              <Route path="/admin" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
              <Route path="/admin/kustomisasi" element={<ProtectedRoute><Layout><Kustomisasi /></Layout></ProtectedRoute>} />
              <Route path="/admin/orderan" element={<ProtectedRoute><Layout><Orderan /></Layout></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
