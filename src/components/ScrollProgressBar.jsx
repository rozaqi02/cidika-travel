import React, { useEffect, useState } from "react";

export default function ScrollProgressBar() {
  const [w, setW] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const sTop = window.scrollY || document.documentElement.scrollTop || 0;
      const docH = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const pct = docH > 0 ? (sTop / docH) * 100 : 0;
      setW(pct);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 h-[3px] z-[60] bg-transparent"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="h-full bg-sky-600 transition-[width] duration-150 ease-out"
        style={{ width: `${w}%` }}
      />
    </div>
  );
}
