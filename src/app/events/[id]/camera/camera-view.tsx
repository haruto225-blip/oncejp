"use client";

import { useRef, useState, useEffect, useCallback } from "react";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setCameraError("カメラへのアクセスが許可されていません");
      }
    }

    start();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || capturing) return;

    setCapturing(true);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setCapturing(false);
          return;
        }

        const photoId = crypto.randomUUID();
        const previewUrl = URL.createObjectURL(blob);
        const storageKey = `events/${eventId}/${guestId}/${photoId}.jpg`;

        setPhotos((prev) => [
          { id: photoId, previewUrl, uploading: true, done: false },
          ...prev,
        ]);
        setCapturing(false);

        const arrayBuffer = await blob.arrayBuffer();
        const { error: uploadError } = await supabase.storage
          .from("photos")
          .upload(storageKey, arrayBuffer, { contentType: "image/jpeg" });

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
      "image/jpeg",
      0.85,
    );
  }, [eventId, guestId, capturing]);

  /* ── カメラエラー ── */
  if (cameraError) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div
          className="flex flex-col items-center gap-3 rounded px-6 py-5 text-center"
          style={{ background: "rgba(139,58,58,0.15)", border: "1px solid rgba(139,58,58,0.4)" }}
        >
          <p className="font-mono text-xs text-film-safelight">{cameraError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Polaroid-style viewfinder */}
      <div
        className="w-full bg-film-card"
        style={{
          padding: "10px 10px 48px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: "3/4" }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        </div>
        <p className="mt-3 text-center font-mono text-[9px] tracking-[0.25em] text-gray-400 uppercase">
          viewfinder
        </p>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Shutter button */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={capture}
          disabled={capturing}
          className="relative h-20 w-20 rounded-full transition-transform active:scale-90 disabled:opacity-60"
          style={{
            background: "#2E3242",
            boxShadow:
              "0 0 0 3px #D4A24E, 0 0 0 6px #1A1D29, 0 8px 24px rgba(0,0,0,0.5)",
          }}
          aria-label="撮影する"
        >
          {/* Inner disc */}
          <span
            className="absolute left-1/2 top-1/2 block h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: capturing ? "#D4A24E" : "#F2EBDD",
              transition: "background 0.15s",
            }}
          />
        </button>
        <p className="font-mono text-[11px] tracking-[0.3em] text-film-card/50 uppercase">
          {capturing ? "現像中..." : "撮影する"}
        </p>
      </div>

      {/* Photo thumbnails */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square overflow-hidden"
              style={
                photo.done
                  ? { boxShadow: "0 0 0 2px #D4A24E, 0 0 12px rgba(212,162,78,0.5)" }
                  : undefined
              }
            >
              {/* FilmPhoto fills the cell */}
              <div className="absolute inset-0">
                <FilmPhoto src={photo.previewUrl} alt="" />
              </div>

              {/* Uploading overlay */}
              {photo.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/65">
                  <p className="font-mono text-[9px] tracking-widest text-film-amber/80 uppercase">
                    現像中...
                  </p>
                </div>
              )}

              {/* Success glow */}
              {photo.done && (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at center, rgba(212,162,78,0.35) 0%, transparent 70%)",
                  }}
                />
              )}

              {/* Error overlay */}
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
