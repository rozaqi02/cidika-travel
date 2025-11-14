import "nprogress/nprogress.css";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Routes, Route, Navigate, useLocation, useNavigationType } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import NProgress from "nprogress";
import { Toaster } from "react-hot-toast";

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
import { CurrencyProvider } from "./context/CurrencyContext";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import ScrollProgressBar from "./components/ScrollProgressBar";
import PackageDetail from "./pages/PackageDetail";
import Checkout from "./pages/Checkout";
import Reset from "./pages/admin/Reset";

NProgress.configure({ showSpinner:false, minimum:0.06, trickle:true, trickleRate:0.08, trickleSpeed:180, speed:420 });

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

function CustomScrollRestoration() {
  const location = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // Disable browser's automatic scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    if (navType === 'POP') {
      // Back/forward: restore from sessionStorage
      const saved = sessionStorage.getItem(`scroll-${location.key}`);
      if (saved) {
        const [x, y] = saved.split(',').map(Number);
        // Mobile-friendly: use setTimeout for iOS Safari timing
        setTimeout(() => window.scrollTo(x, y), 0);
      } else {
        setTimeout(() => window.scrollTo(0, 0), 0);
      }
    } else {
      // New navigation (PUSH/REPLACE): scroll to top
      setTimeout(() => window.scrollTo(0, 0), 0);
    }

    // Save current scroll position on unmount
    return () => {
      sessionStorage.setItem(`scroll-${location.key}`, `${window.pageXOffset},${window.pageYOffset}`);
    };
  }, [location.key, navType]);

  return null;
}

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

function MobileVhFix() {
  useEffect(() => {
    const set = () => document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    set();
    window.addEventListener("resize", set, { passive: true });
    return () => window.removeEventListener("resize", set);
  }, []);
  return null;
}

function FocusMainOnRoute() {
  const { pathname } = useLocation();
  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
      main.focus({ preventScroll: true });
    }
  }, [pathname]);
  return null;
}

function PreventImageDrag() {
  useEffect(() => {
    const prevent = (e) => {
      const t = e.target;
      if (t && t.tagName === "IMG" && !t.closest("a")) e.preventDefault();
    };
    document.addEventListener("dragstart", prevent);
    return () => document.removeEventListener("dragstart", prevent);
  }, []);
  return null;
}

function ButtonRippleEffect() {
  useEffect(() => {
    const onClick = (e) => {
      const target = e.target.closest?.(".btn");
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const d = Math.max(rect.width, rect.height);
      const ripple = document.createElement("span");
      ripple.style.position = "absolute";
      ripple.style.left = `${x - d / 2}px`;
      ripple.style.top = `${y - d / 2}px`;
      ripple.style.width = ripple.style.height = `${d}px`;
      ripple.style.borderRadius = "9999px";
      ripple.style.pointerEvents = "none";
      ripple.style.background = "rgba(14,165,233,.25)";
      ripple.style.transform = "scale(0)";
      ripple.style.opacity = "0.8";
      ripple.style.transition = "transform .45s ease, opacity .6s ease";
      ripple.className = "btn-ripple";
      target.style.position = target.style.position || "relative";
      target.appendChild(ripple);
      requestAnimationFrame(() => (ripple.style.transform = "scale(1)"));
      setTimeout(() => {
        ripple.style.opacity = "0";
        setTimeout(() => ripple.remove(), 350);
      }, 220);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}

function PageRevealOnce() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("page-reveal");
    const t = setTimeout(() => root.classList.remove("page-reveal"), 350);
    return () => clearTimeout(t);
  }, []);
  return null;
}

function Layout({ children }) {
  const location = useLocation();
  const pageVariants = usePageVariants();

  useEffect(() => { NProgress.done(); }, []);
  useEffect(() => {
    NProgress.start();
    NProgress.set(0.18);
    const fallback = setTimeout(() => NProgress.done(), 1600);
    return () => clearTimeout(fallback);
  }, [location.pathname]);

  return (
    <>
      <ScrollProgressBar />
      <Navbar />
      <TransitionScrim routeKey={location.pathname} />
      <main className="min-h-[70vh] pt-16">
        {/* Custom scroll restoration (replaces ScrollRestoration) */}
        <CustomScrollRestoration />
        <AnimatePresence mode="wait" initial={false}
          onExitComplete={() => { NProgress.inc(0.2); requestAnimationFrame(() => NProgress.done()); }}>
          <motion.div key={location.pathname}
            initial={pageVariants.initial} animate={pageVariants.in} exit={pageVariants.out}
            onAnimationComplete={() => requestAnimationFrame(() => NProgress.done())}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>{/* ⬅️ Bungkus semua route dengan CartProvider */}
            <MobileVhFix />
            <FocusMainOnRoute />
            <PreventImageDrag />
            <ButtonRippleEffect />
            <PageRevealOnce />

            <Toaster
  position="top-right"
  toastOptions={{
    className: "rounded-xl border border-slate-200 dark:border-slate-700",
  }}
/>

            <Routes>
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/explore" element={<Layout><Explore /></Layout>} />
              <Route path="/packages/:id" element={<Layout><PackageDetail /></Layout>} />
              <Route path="/checkout" element={<Layout><Checkout /></Layout>} /> {/* ⬅️ ROUTE BARU */}
              <Route path="/destinasi" element={<Layout><Destinasi /></Layout>} />
              <Route path="/faq" element={<Layout><FAQ /></Layout>} />
              <Route path="/contact" element={<Layout><Contact /></Layout>} />

              <Route path="/admin/login" element={<Layout><Login /></Layout>} />
              <Route path="/admin" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
              <Route path="/admin/kustomisasi" element={<ProtectedRoute><Layout><Kustomisasi /></Layout></ProtectedRoute>} />
              <Route path="/admin/orderan" element={<ProtectedRoute><Layout><Orderan /></Layout></ProtectedRoute>} />
              <Route path="/admin/reset" element={<Layout><Reset /></Layout>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}