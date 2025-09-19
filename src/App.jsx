// src/App.jsx
import "nprogress/nprogress.css";
import React, { useState, useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import NProgress from "nprogress";
import { Heart } from "lucide-react";

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
import WishlistDrawer from "./components/WishlistDrawer";
import Checkout from "./pages/Checkout";
import { CurrencyProvider } from "./context/CurrencyContext";
import { AuthProvider } from "./context/AuthContext";
import ScrollProgressBar from "./components/ScrollProgressBar";

/* NProgress untuk perpindahan halaman */
NProgress.configure({
  showSpinner: false,
  minimum: 0.06,
  trickle: true,
  trickleRate: 0.08,
  trickleSpeed: 180,
  speed: 420,
});

/* ===== 1) Hook preferensi motion (untuk accessibility) ===== */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!m) return;
    setReduced(!!m.matches);
    const onChange = () => setReduced(!!m.matches);
    m.addEventListener?.("change", onChange);
    return () => m.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

/* ===== 2) ScrollToTop dengan animasi terlihat + hash offset aware ===== */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }, [pathname, hash, reduced]);
  return null;
}

/* ===== 3) Variants transisi halaman (dinamis jika reduced motion) ===== */
function usePageVariants() {
  const reduced = usePrefersReducedMotion();
  return useMemo(
    () => ({
      initial: { opacity: 0, y: reduced ? 0 : 10 },
      in: { opacity: 1, y: 0, transition: { duration: reduced ? 0.02 : 0.22, ease: "easeOut" } },
      out: { opacity: 0, y: reduced ? 0 : -8, transition: { duration: reduced ? 0.02 : 0.14, ease: "easeIn" } },
    }),
    [reduced]
  );
}

/* ===== 4) Scrim overlay halus saat transisi (mengurangi “flash”) ===== */
function TransitionScrim({ routeKey }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0 }}
        exit={{ opacity: 0.06 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className="pointer-events-none fixed inset-0 z-[9] bg-slate-950"
        style={{ mixBlendMode: "multiply" }}
      />
    </AnimatePresence>
  );
}

/* ===== NEW: WishlistFX overlay (burst anim + dark blur background) ===== */
function WishlistFXOverlay() {
  const reduced = usePrefersReducedMotion();
  const [show, setShow] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const handler = () => {
      setKey((k) => k + 1);
      setShow(true);
      const t = setTimeout(() => setShow(false), reduced ? 220 : 800);
      return () => clearTimeout(t);
    };
    window.addEventListener("WISHLIST_FX", handler);
    return () => window.removeEventListener("WISHLIST_FX", handler);
  }, [reduced]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={key}
          className="fixed inset-0 z-[70] grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1 }} // biar sub-elemen yang handle fade
        >
          {/* BACKDROP: gelap + blur layar di belakang heart */}
          <motion.div
            className="absolute inset-0 bg-slate-900/45 dark:bg-slate-950/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.08 : 0.18, ease: "easeOut" }}
            style={{ willChange: "opacity" }}
          />
          {/* glow */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.22 }}
            className="absolute w-56 h-56 rounded-full bg-sky-500/12 blur-2xl"
          />
          {/* heart */}
          <motion.div
            initial={{ scale: 0.4, rotate: 0, opacity: 0 }}
            animate={{ scale: [0.4, 1.15, 1], rotate: [0, 8, 0], opacity: [0, 1, 1] }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ duration: reduced ? 0.18 : 0.7, times: [0, 0.5, 1], ease: "easeOut" }}
            className="relative"
          >
            <Heart size={76} className="text-sky-600 drop-shadow-lg" fill="currentColor" />
            {!reduced && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: "3px solid rgba(56,189,248,.55)" }}
                initial={{ scale: 0.4, opacity: 0.8 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            )}
          </motion.div>
          {/* caption kecil */}
          <motion.div
            className="mt-4 text-slate-700 dark:text-slate-200 text-sm font-medium"
            initial={{ y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -4, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            Added to Wishlist
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Layout({ children, onWishlistOpen }) {
  const location = useLocation();
  const pageVariants = usePageVariants();

  // 5) Mobile 100vh fix
  useEffect(() => {
    const set = () => document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    set();
    window.addEventListener("resize", set, { passive: true });
    return () => window.removeEventListener("resize", set);
  }, []);

  // Pastikan bar tidak terlihat pada initial mount
  useEffect(() => {
    NProgress.done();
  }, []);

  // Mulai progress saat path berubah; fallback agar tidak nyangkut
  useEffect(() => {
    NProgress.start();
    NProgress.set(0.18);
    const fallback = setTimeout(() => NProgress.done(), 1600);
    return () => clearTimeout(fallback);
  }, [location.pathname]);

  // 6) Focus management
  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
      main.focus({ preventScroll: true });
    }
  }, [location.pathname]);

  return (
    <>
      <ScrollProgressBar />
      <Navbar onCartOpen={onWishlistOpen} />
      {/* FX overlay */}
      <WishlistFXOverlay />
      <TransitionScrim routeKey={location.pathname} />

      <main className="min-h-[70vh] pt-16">
        <AnimatePresence
          mode="wait"
          initial={false}
          onExitComplete={() => {
            NProgress.inc(0.2);
            requestAnimationFrame(() => NProgress.done());
          }}
        >
          <motion.div
            key={location.pathname}
            initial={pageVariants.initial}
            animate={pageVariants.in}
            exit={pageVariants.out}
            onAnimationComplete={() => requestAnimationFrame(() => NProgress.done())}
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

  /* 7) Small polish: cegah “drag image ghost” */
  useEffect(() => {
    const prevent = (e) => {
      const t = e.target;
      if (t && t.tagName === "IMG" && !t.closest("a")) e.preventDefault();
    };
    document.addEventListener("dragstart", prevent);
    return () => document.removeEventListener("dragstart", prevent);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
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
