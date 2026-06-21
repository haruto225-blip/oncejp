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

      // Reset immediately so the same shot can be retaken if needed
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
        .upload(storageKey, file, {
          contentType: file.type || "image/jpeg",
        });

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

  const latestPhoto = photos[0];
  const olderPhotos = photos.slice(1);

  return (
    <div className="flex flex-col gap-6">
      {/* Hidden file input — triggers native camera app */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Polaroid viewfinder — shows latest captured photo */}
      <div
        className="w-full bg-film-card"
        style={{
          padding: "10px 10px 48px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        <div
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: "3/4" }}
        >
          {latestPhoto ? (
            <>
              <div className="absolute inset-0">
                <FilmPhoto src={latestPhoto.previewUrl} alt="" />
              </div>

              {latestPhoto.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/65">
                  <p className="font-mono text-[9px] tracking-widest text-film-amber/80 uppercase">
                    現像中...
                  </p>
                </div>
              )}

              {latestPhoto.done && (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at center, rgba(212,162,78,0.35) 0%, transparent 70%)",
                  }}
                />
              )}

              {latestPhoto.error && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: "rgba(139,58,58,0.7)" }}
                >
                  <p className="px-1 text-center font-mono text-[9px] text-white/90">
                    {latestPhoto.error}
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Placeholder before first shot */
            <div
              className="flex h-full w-full flex-col items-center justify-center gap-2"
              style={{ background: "#1A1D29" }}
            >
              <p className="font-mono text-[9px] tracking-[0.3em] text-film-amber/30 uppercase">
                tap shutter
              </p>
            </div>
          )}
        </div>
        <p className="mt-3 text-center font-mono text-[9px] tracking-[0.25em] text-gray-400 uppercase">
          viewfinder
        </p>
      </div>

      {/* Shutter button — opens native camera app */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => inputRef.current?.click()}
          className="relative h-20 w-20 rounded-full transition-transform active:scale-90"
          style={{
            background: "#2E3242",
            boxShadow:
              "0 0 0 3px #D4A24E, 0 0 0 6px #1A1D29, 0 8px 24px rgba(0,0,0,0.5)",
          }}
          aria-label="撮影する"
        >
          <span
            className="absolute left-1/2 top-1/2 block h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "#F2EBDD" }}
          />
        </button>
        <p className="font-mono text-[11px] tracking-[0.3em] text-film-card/50 uppercase">
          撮影する
        </p>
      </div>

      {/* Previous shots — 2枚目以降をグリッド表示 */}
      {olderPhotos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {olderPhotos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square overflow-hidden"
              style={
                photo.done
                  ? {
                      boxShadow:
                        "0 0 0 2px #D4A24E, 0 0 12px rgba(212,162,78,0.5)",
                    }
                  : undefined
              }
            >
              <div className="absolute inset-0">
                <FilmPhoto src={photo.previewUrl} alt="" />
              </div>

              {photo.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/65">
                  <p className="font-mono text-[9px] tracking-widest text-film-amber/80 uppercase">
                    現像中...
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
                  style={{ background: "rgba(139,58,58,0.7)" }}
                >
                  <p className="px-1 text-center font-mono text-[9px] text-white/90">
                    {photo.error}
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
