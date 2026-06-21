"use client";

import { useState } from "react";
import { FilmPhoto } from "@/components/FilmPhoto";

const ROTATIONS = [-2.2, 1.8, -1.1, 2.5, -2.8, 1.4, -1.7, 2.1];

export function PhotoCard({
  src,
  displayName,
  takenAt,
  index = 0,
}: {
  src: string;
  displayName: string;
  takenAt?: string | null;
  index?: number;
}) {
  const [downloading, setDownloading] = useState(false);
  const rotation = ROTATIONS[index % ROTATIONS.length];

  const timeLabel = takenAt
    ? new Date(takenAt).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = src.split("/").pop() ?? "photo.jpg";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="text-left transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Polaroid frame */}
      <div
        className="flex flex-col bg-film-card"
        style={{
          padding: "8px 8px 34px",
          boxShadow:
            "0 6px 24px rgba(0,0,0,0.5), 0 1px 6px rgba(0,0,0,0.35)",
        }}
      >
        {/* Photo area — square */}
        <div className="relative aspect-square w-full overflow-hidden">
          <FilmPhoto src={src} alt={displayName} />

          {/* Download in-progress overlay */}
          {downloading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="font-mono text-[10px] tracking-widest text-white/80 uppercase">
                saving...
              </span>
            </div>
          )}
        </div>

        {/* Polaroid caption */}
        <div className="mt-2 flex flex-col gap-0.5 px-0.5">
          <p className="truncate font-mono text-[9px] tracking-wide text-gray-500 uppercase">
            {displayName}
          </p>
          {timeLabel && (
            <p className="font-mono text-[9px] text-gray-400">{timeLabel}</p>
          )}
        </div>
      </div>
    </button>
  );
}
