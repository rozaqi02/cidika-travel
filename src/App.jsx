import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

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
import CartDrawer from "./components/CartDrawer";
import Checkout from "./pages/Checkout";
import { CurrencyProvider } from "./context/CurrencyContext";
import { AuthProvider } from "./context/AuthContext";

/** Scroll ke atas tiap ganti route (smooth) */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);
  return null;
}

/** Variants animasi halaman */
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  in: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  out: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

function Layout({ children, onCartOpen }) {
  const location = useLocation();
  return (
    <>
      <Navbar onCartOpen={onCartOpen} />
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
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <ScrollToTop />
            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
            <Routes>
              <Route path="/" element={<Layout onCartOpen={() => setCartOpen(true)}><Home /></Layout>} />
              <Route path="/explore" element={<Layout onCartOpen={() => setCartOpen(true)}><Explore /></Layout>} />
              <Route path="/destinasi" element={<Layout onCartOpen={() => setCartOpen(true)}><Destinasi /></Layout>} />
              <Route path="/faq" element={<Layout onCartOpen={() => setCartOpen(true)}><FAQ /></Layout>} />
              <Route path="/contact" element={<Layout onCartOpen={() => setCartOpen(true)}><Contact /></Layout>} />
              <Route path="/checkout" element={<Layout onCartOpen={() => setCartOpen(true)}><Checkout /></Layout>} />

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
