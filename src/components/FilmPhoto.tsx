"use client";

import { useEffect, useState } from "react";

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)'/%3E%3C/svg%3E")`;

export function FilmPhoto({ src, alt = "" }: { src: string; alt?: string }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Photo with warm film color grading */}
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        style={{
          filter:
            "contrast(1.08) saturate(0.78) sepia(0.28) hue-rotate(-8deg) brightness(0.94)",
          opacity: revealed ? 1 : 0,
          transition: "opacity 1.4s ease-in",
        }}
      />

      {/* Vignette — four-corner darkening */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 36%, rgba(0,0,0,0.65) 100%)",
          opacity: revealed ? 1 : 0,
          transition: "opacity 1.4s ease-in",
        }}
      />

      {/* Film grain — SVG fractal noise via mix-blend-mode */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: GRAIN_SVG,
          backgroundSize: "180px 180px",
          mixBlendMode: "overlay",
          opacity: 0.11,
        }}
      />
    </div>
  );
}
