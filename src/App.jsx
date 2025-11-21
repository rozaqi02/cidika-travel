// src/App.jsx
import "nprogress/nprogress.css";
import React, { useState, useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useLocation, useNavigationType, useNavigate } from "react-router-dom";
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

/* --- Helpers & Hooks (Sama seperti sebelumnya) --- */
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
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (navType === 'POP') {
      const saved = sessionStorage.getItem(`scroll-${location.key}`);
      if (saved) {
        const [x, y] = saved.split(',').map(Number);
        setTimeout(() => window.scrollTo(x, y), 0);
      } else {
        setTimeout(() => window.scrollTo(0, 0), 0);
      }
    } else {
      setTimeout(() => window.scrollTo(0, 0), 0);
    }
    return () => {
      sessionStorage.setItem(`scroll-${location.key}`, `${window.pageXOffset},${window.pageYOffset}`);
    };
  }, [location.key, navType]);
  return null;
}

function usePageVariants() {
  const reduced = usePrefersReducedMotion();
  return useMemo(() => ({
    initial: { opacity: 0, y: reduced ? 0 : 10 },
    in: { opacity: 1, y: 0, transition: { duration: reduced ? 0.02 : 0.22, ease: "easeOut" } },
    out: { opacity: 0, y: reduced ? 0 : -8, transition: { duration: reduced ? 0.02 : 0.14, ease: "easeIn" } },
  }), [reduced]);
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
      Object.assign(ripple.style, {
        position: "absolute", left: `${x - d / 2}px`, top: `${y - d / 2}px`,
        width: `${d}px`, height: `${d}px`, borderRadius: "9999px", pointerEvents: "none",
        background: "rgba(14,165,233,.25)", transform: "scale(0)", opacity: "0.8",
        transition: "transform .45s ease, opacity .6s ease"
      });
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

function AuthRedirectListener() {
  const navigate = useNavigate();
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
       navigate("/admin/reset");
    }
  }, [navigate]);
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

  // --- MODIFIKASI DI SINI ---
  
  // 1. Tentukan halaman mana yang TIDAK menampilkan Navbar
  // "/admin/login" DIHAPUS dari sini agar Navbar muncul
  const hideNavbarPaths = ["/admin/reset", "/checkout"];
  const showNavbar = !hideNavbarPaths.includes(location.pathname);

  // 2. Tentukan halaman mana yang TIDAK menampilkan Footer
  // "/admin/login" TETAP DISINI agar Footer tidak mengganggu layout login
  const hideFooterPaths = ["/admin/login", "/admin/reset", "/checkout"];
  const showFooter = !hideFooterPaths.includes(location.pathname);

  return (
    <>
      <ScrollProgressBar />
      
      {/* Render Navbar jika showNavbar true */}
      {showNavbar && <Navbar />}
      
      <TransitionScrim routeKey={location.pathname} />
      
      {/* Padding top (pt-16) hanya ditambahkan jika Navbar muncul */}
      <main className={`min-h-[70vh] ${showNavbar ? 'pt-16' : ''}`}>
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

      {/* Render Footer jika showFooter true */}
      {showFooter && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <MobileVhFix />
            <FocusMainOnRoute />
            <PreventImageDrag />
            <ButtonRippleEffect />
            <PageRevealOnce />
            
            <AuthRedirectListener /> 

            <Toaster position="top-right" toastOptions={{ className: "rounded-xl border border-slate-200 dark:border-slate-700" }} />

            <Routes>
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/explore" element={<Layout><Explore /></Layout>} />
              <Route path="/packages/:id" element={<Layout><PackageDetail /></Layout>} />
              <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
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