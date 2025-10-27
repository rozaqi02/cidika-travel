import React, { useEffect, useRef } from "react";

export default function ScrollProgressBar() {
  const barRef = useRef(null);
  const rafRef = useRef(null);
  const ticking = useRef(false);

  useEffect(() => {
    const updateProgress = () => {
      if (!barRef.current) return;
      const sTop = window.scrollY || document.documentElement.scrollTop || 0;
      const docH = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const pct = docH > 0 ? (sTop / docH) * 100 : 0;
      
      // Gunakan scaleX untuk GPU smooth (vs width)
      barRef.current.style.transform = `scaleX(${pct / 100})`;
      barRef.current.style.opacity = pct > 0 ? '1' : '0'; // Fade-in saat scroll mulai
      barRef.current.style.boxShadow = pct > 0 ? '0 0 10px rgba(14, 165, 233, 0.5)' : 'none'; // Glow terasa
      
      ticking.current = false;
      rafRef.current = null;
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      rafRef.current = requestAnimationFrame(updateProgress);
    };

    onScroll(); // Initial
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 h-[3px] z-[60] bg-transparent overflow-hidden"
      style={{ pointerEvents: "none" }}
    >
      <div
        ref={barRef}
        className="h-full origin-left transition-all duration-500 ease-out" // Ease-out + durasi lebih panjang untuk terasa
        style={{
          transform: "scaleX(0)",
          opacity: 0,
          background: "linear-gradient(90deg, #0ea5e9 0%, #3b82f6 50%, #0ea5e9 100%)", // Gradient pro
          backgroundSize: "300% 100%", // Lebih lebar untuk shimmer lambat
          animation: "shimmer 3s ease-in-out infinite", // Shimmer lebih lambat & smooth
        }}
      />
    </div>
  );
}