import React, { useEffect, useState } from "react";

/**
 * Background slideshow untuk hero.
 * - images: array path gambar (ex: ["/hero1.png", ...])
 * - interval: ms perpindahan
 * - overlay: gradient agar teks tetap terbaca
 */
export default function HeroBackground({
  images = [],
  interval = 3000,
  overlay = "from-black/40 via-black/20 to-transparent"
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => setIndex(i => (i + 1) % images.length), interval);
    return () => clearInterval(id);
  }, [images.length, interval]);

  return (
    <div className="absolute inset-0">
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className={`absolute inset-0 bg-gradient-to-b ${overlay}`} />
    </div>  );
}
