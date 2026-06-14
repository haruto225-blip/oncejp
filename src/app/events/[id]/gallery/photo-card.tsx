"use client";

import { useState } from "react";

export function PhotoCard({
  src,
  displayName,
}: {
  src: string;
  displayName: string;
}) {
  const [downloading, setDownloading] = useState(false);

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
      className="flex flex-col gap-1 text-left"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
        <img src={src} alt="" className="h-full w-full object-cover" />
        {downloading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-xs text-white">保存中…</span>
          </div>
        )}
      </div>
      <p className="truncate text-xs text-gray-600">{displayName}</p>
    </button>
  );
}
