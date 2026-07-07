import React, { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import OptimizedImage from "./OptimizedImage";

export default function Lightbox({ images = [], index = 0, onClose, onNavigate }) {
  const hasMultiple = images.length > 1;
  const current = images[index] || "";

  const goPrev = useCallback(() => {
    if (!hasMultiple) return;
    onNavigate((index - 1 + images.length) % images.length);
  }, [hasMultiple, images.length, index, onNavigate]);

  const goNext = useCallback(() => {
    if (!hasMultiple) return;
    onNavigate((index + 1) % images.length);
  }, [hasMultiple, images.length, index, onNavigate]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, goPrev, goNext]);

  if (!current) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/92 p-4 backdrop-blur-md"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full border border-white/20 bg-black/40 p-2 text-white hover:bg-black/60"
          aria-label="Close"
        >
          <X size={22} />
        </button>

        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                goPrev();
              }}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-3 text-white hover:bg-black/60 md:left-6"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                goNext();
              }}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-3 text-white hover:bg-black/60 md:right-6"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          </>
        ) : null}

        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative max-h-[85vh] max-w-5xl overflow-hidden rounded-2xl shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <OptimizedImage
            src={current}
            alt=""
            preset="detail"
            className="max-h-[85vh] w-auto object-contain"
            loading="eager"
          />
        </motion.div>

        {hasMultiple ? (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1.5 text-sm text-white">
            {index + 1} / {images.length}
          </div>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}