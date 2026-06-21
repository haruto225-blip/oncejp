"use client";

import { useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { FilmPhoto } from "@/components/FilmPhoto";

type Photo = {
  id: string;
  previewUrl: string;
  uploading: boolean;
  done: boolean;
  error?: string;
};

export function CameraView({
  eventId,
  guestId,
}: {
  eventId: string;
  guestId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      e.target.value = "";

      const photoId = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      const storageKey = `events/${eventId}/${guestId}/${photoId}.jpg`;

      setPhotos((prev) => [
        { id: photoId, previewUrl, uploading: true, done: false },
        ...prev,
      ]);

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(storageKey, file, { contentType: file.type || "image/jpeg" });

      if (uploadError) {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId
              ? { ...p, uploading: false, error: "アップロード失敗" }
              : p,
          ),
        );
        return;
      }

      const { error: dbError } = await supabase.from("photos").insert({
        event_id: eventId,
        guest_id: guestId,
        storage_key: storageKey,
        is_hidden: true,
      });

      if (dbError) {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId
              ? { ...p, uploading: false, error: dbError.message }
              : p,
          ),
        );
      } else {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId ? { ...p, uploading: false, done: true } : p,
          ),
        );
        setTimeout(() => {
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photoId ? { ...p, done: false } : p,
            ),
          );
        }, 2000);
      }
    },
    [eventId, guestId],
  );

  return (
    <div className="flex flex-col items-center gap-10 py-6">
      {/* Hidden file input — triggers native camera */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Camera open button */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={() => inputRef.current?.click()}
          className="relative h-28 w-28 rounded-full transition-transform active:scale-90"
          style={{
            background: "#2E3242",
            boxShadow:
              "0 0 0 4px #D4A24E, 0 0 0 8px #1A1D29, 0 10px 36px rgba(0,0,0,0.6)",
          }}
          aria-label="カメラを開く"
        >
          {/* Inner disc */}
          <span
            className="absolute left-1/2 top-1/2 flex h-[70px] w-[70px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
            style={{ background: "#F2EBDD" }}
          >
            {/* Camera icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1A1D29"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8"
              aria-hidden
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </span>
        </button>

        <p className="font-mono text-[11px] tracking-[0.3em] text-film-card/50 uppercase">
          カメラを開く
        </p>
      </div>

      {/* Film counter */}
      <div className="flex items-center gap-3">
        <div className="h-px w-10 bg-film-amber/20" />
        <p className="font-mono text-xs tracking-[0.25em] text-film-amber/60">
          {String(photos.length).padStart(3, "0")} FRAMES
        </p>
        <div className="h-px w-10 bg-film-amber/20" />
      </div>

      {/* Photo grid — film frames */}
      {photos.length > 0 && (
        <div className="grid w-full grid-cols-4 gap-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square overflow-hidden"
              style={
                photo.done
                  ? {
                      boxShadow:
                        "0 0 0 2px #D4A24E, 0 0 10px rgba(212,162,78,0.5)",
                    }
                  : undefined
              }
            >
              <div className="absolute inset-0">
                <FilmPhoto src={photo.previewUrl} alt="" />
              </div>

              {photo.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/65">
                  <p className="font-mono text-[8px] tracking-widest text-film-amber/80 uppercase">
                    現像中
                  </p>
                </div>
              )}

              {photo.done && (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at center, rgba(212,162,78,0.35) 0%, transparent 70%)",
                  }}
                />
              )}

              {photo.error && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: "rgba(139,58,58,0.72)" }}
                >
                  <p className="px-1 text-center font-mono text-[8px] text-white/90">
                    失敗
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
