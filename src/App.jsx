// src/App.jsx
import "nprogress/nprogress.css";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigationType,
} from "react-router-dom";
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

// ⬇️ IMPORT HALAMAN DETAIL PAKET BARU
import PackageDetail from "./pages/PackageDetail";

/* NProgress: hanya untuk perpindahan halaman */
NProgress.configure({
  showSpinner: false,
  minimum: 0.06,
  trickle: true,
  trickleRate: 0.08,
  trickleSpeed: 180,
  speed: 420,
});

/* ========= [EFEK #1] prefers-reduced-motion hook ========= */
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

/* ========= [EFEK #2] Scroll manager ========= */
function ScrollManager() {
  const reduced = usePrefersReducedMotion();
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();
  const prevPath = useRef(pathname);

  useEffect(() => {
    const save = () =>
      sessionStorage.setItem(`scroll:${prevPath.current}`, String(window.scrollY || 0));
    window.addEventListener("beforeunload", save);
    return () => window.removeEventListener("beforeunload", save);
  }, []);

  useEffect(() => {
    sessionStorage.setItem(`scroll:${prevPath.current}`, String(window.scrollY || 0));
    prevPath.current = pathname;

    if (hash) {
      const id = hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
        return;
      }
    }

    if (navType === "POP") {
      const saved = Number(sessionStorage.getItem(`scroll:${pathname}`) || 0);
      window.scrollTo({ top: saved, behavior: "auto" });
    } else {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    }
  }, [pathname, hash, navType, reduced]);

  return null;
}

/* ========= [EFEK #3] Variants transisi halaman ========= */
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

/* ========= [EFEK #4] Scrim overlay saat transisi ========= */
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

/* ========= [EFEK #5] Wishlist FX ========= */
function WishlistFXOverlay() {
  const reduced = usePrefersReducedMotion();
  const [show, setShow] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const handler = () => {
      setKey((k) => k + 1);
      setShow(true);
      document.documentElement.style.overflow = "hidden";
      const t = setTimeout(() => {
        setShow(false);
        document.documentElement.style.overflow = "";
      }, reduced ? 220 : 800);
      return () => {
        clearTimeout(t);
        document.documentElement.style.overflow = "";
      };
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
          exit={{ opacity: 1 }}
        >
          <motion.div
            className="absolute inset-0 bg-slate-900/45 dark:bg-slate-950/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.08 : 0.18, ease: "easeOut" }}
            style={{ willChange: "opacity" }}
          />
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.22 }}
            className="absolute w-56 h-56 rounded-full bg-sky-500/12 blur-2xl"
          />
          <motion.div
            initial={{ scale: 0.4, rotate: 0, opacity: 0 }}
            animate={{ scale: [0.4, 1.15, 1], rotate: [0, 8, 0], opacity: [0, 1, 1] }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ duration: reduced ? 0.18 : 0.7, times: [0, 0.5, 1], ease: "easeOut" }}
            className="relative"
          >
            <Heart size={76} className="text-sky-600 drop-shadow-lg" fill="currentColor" />
          </motion.div>
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

/* ========= [EFEK #6] Mobile 100vh fix ========= */
function MobileVhFix() {
  useEffect(() => {
    const set = () =>
      document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    set();
    window.addEventListener("resize", set, { passive: true });
    return () => window.removeEventListener("resize", set);
  }, []);
  return null;
}

/* ========= [EFEK #7] Focus main ========= */
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

/* ========= [EFEK #8] Cegah ghost-drag <img> ========= */
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

/* ========= [EFEK #9] Button ripple ========= */
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

/* ========= [EFEK #10] Page reveal once ========= */
function PageRevealOnce() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("page-reveal");
    const t = setTimeout(() => root.classList.remove("page-reveal"), 350);
    return () => clearTimeout(t);
  }, []);
  return null;
}

/* ==================== Layout ==================== */
function Layout({ children, onWishlistOpen }) {
  const location = useLocation();
  const pageVariants = usePageVariants();

  useEffect(() => {
    NProgress.done();
  }, []);

  useEffect(() => {
    NProgress.start();
    NProgress.set(0.18);
    const fallback = setTimeout(() => NProgress.done(), 1600);
    return () => clearTimeout(fallback);
  }, [location.pathname]);

  return (
    <>
      <ScrollProgressBar />
      <Navbar onCartOpen={onWishlistOpen} />
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

/* ==================== App Root ==================== */
export default function App() {
  const [wishOpen, setWishOpen] = useState(false);

  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            {/* Register UX effects */}
            <MobileVhFix />
            <ScrollManager />
            <FocusMainOnRoute />
            <PreventImageDrag />
            <ButtonRippleEffect />
            <PageRevealOnce />

            <WishlistDrawer open={wishOpen} onClose={() => setWishOpen(false)} />
            <Routes>
              <Route path="/" element={<Layout onWishlistOpen={() => setWishOpen(true)}><Home /></Layout>} />
              <Route path="/explore" element={<Layout onWishlistOpen={() => setWishOpen(true)}><Explore /></Layout>} />
              {/* ⬇️ ROUTE BARU: DETAIL PAKET */}
              <Route path="/packages/:id" element={<Layout onWishlistOpen={() => setWishOpen(true)}><PackageDetail /></Layout>} />

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
