import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function HeroSlider({ images = [] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI(prev => (prev + 1) % images.length), 3000);
    return () => clearInterval(id);
  }, [images.length]);

  const prev = () => setI((i-1+images.length)%images.length);
  const next = () => setI((i+1)%images.length);

  return (
    <div className="relative h-[380px] md:h-[480px] rounded-2xl overflow-hidden">
      {images.map((src, idx) => (
        <img key={idx} src={src} alt="" className={"absolute inset-0 w-full h-full object-cover transition-opacity duration-700 " + (idx===i?"opacity-100":"opacity-0")} />
      ))}
      <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white p-2 rounded-full"><ChevronLeft/></button>
      <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white p-2 rounded-full"><ChevronRight/></button>
    </div>
  );
}