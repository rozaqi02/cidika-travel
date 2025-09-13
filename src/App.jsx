import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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

function Layout({ children, onCartOpen }) {
  return (
    <>
      <Navbar onCartOpen={onCartOpen} />
      <main>{children}</main>
      <Footer />
    </>
  );
}

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <ThemeProvider>
      <CartProvider>
        <CartDrawer open={cartOpen} onClose={()=>setCartOpen(false)} />
        <Routes>
          <Route path="/" element={<Layout onCartOpen={()=>setCartOpen(true)}><Home /></Layout>} />
          <Route path="/explore" element={<Layout onCartOpen={()=>setCartOpen(true)}><Explore /></Layout>} />
          <Route path="/destinasi" element={<Layout onCartOpen={()=>setCartOpen(true)}><Destinasi /></Layout>} />
          <Route path="/faq" element={<Layout onCartOpen={()=>setCartOpen(true)}><FAQ /></Layout>} />
          <Route path="/contact" element={<Layout onCartOpen={()=>setCartOpen(true)}><Contact /></Layout>} />

          <Route path="/admin/login" element={<Layout><Login /></Layout>} />
          <Route path="/admin" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/admin/kustomisasi" element={<ProtectedRoute><Layout><Kustomisasi /></Layout></ProtectedRoute>} />
          <Route path="/admin/orderan" element={<ProtectedRoute><Layout><Orderan /></Layout></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CartProvider>
    </ThemeProvider>
  );
}