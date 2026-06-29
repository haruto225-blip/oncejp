"use client";

import Link from "next/link";
import { useRef, useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";

function FilmIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  );
}

const PERF_COUNT = 8;

export function CameraView({
  eventId,
  guestId,
  revealAt,
  maxPhotosPerGuest,
  initialPhotoCount,
  eventName,
}: {
  eventId: string;
  guestId: string;
  revealAt: string | null;
  maxPhotosPerGuest: number | null;
  initialPhotoCount: number;
  eventName: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frameCount, setFrameCount] = useState(initialPhotoCount);
  const [isExpired, setIsExpired] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  const remaining =
    maxPhotosPerGuest !== null ? maxPhotosPerGuest - frameCount : null;
  const isFilmExhausted = remaining !== null && remaining <= 0;

  // reveal_at timer
  useEffect(() => {
    if (!revealAt) return;
    const target = new Date(revealAt).getTime();
    if (Date.now() >= target) {
      setIsExpired(true);
      return;
    }
    const timer = setInterval(() => {
      if (Date.now() >= target) {
        setIsExpired(true);
        clearInterval(timer);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [revealAt]);

  // camera stream
  useEffect(() => {
    if (isExpired || isFilmExhausted) return;
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch(() => setCameraError(true));
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [isExpired, isFilmExhausted]);

  const handleShutter = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (isFilmExhausted || isCapturing) return;
    if (maxPhotosPerGuest !== null && frameCount >= maxPhotosPerGuest) return;

    setFrameCount((n) => n + 1);
    setIsCapturing(true);
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 120);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsCapturing(false);
      return;
    }
    ctx.drawImage(video, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (!blob) {
      setIsCapturing(false);
      return;
    }

    const photoId = crypto.randomUUID();
    const storageKey = `events/${eventId}/${guestId}/${photoId}.jpg`;
    const arrayBuffer = await blob.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(storageKey, arrayBuffer, { contentType: "image/jpeg" });

    if (!uploadError) {
      await supabase.from("photos").insert({
        event_id: eventId,
        guest_id: guestId,
        storage_key: storageKey,
        is_hidden: true,
      });
    }

    setIsCapturing(false);
  }, [eventId, guestId, isFilmExhausted, isCapturing, frameCount, maxPhotosPerGuest]);

  /* ── フィルム使い切りスクリーン ── */
  if (isFilmExhausted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-film-bg px-6 text-center">
        <p className="font-mono text-[10px] tracking-[0.4em] text-film-amber/40 uppercase">
          ── FILM EXHAUSTED ──
        </p>

        <div
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{
            background: "radial-gradient(circle, #2E324299 0%, transparent 70%)",
            boxShadow: "0 0 32px 6px rgba(212,162,78,0.12)",
            border: "1px solid rgba(212,162,78,0.15)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(212,162,78,0.5)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-9 w-9"
            aria-hidden
          >
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            <line x1="12" y1="12" x2="12" y2="16" />
            <line x1="10" y1="14" x2="14" y2="14" />
          </svg>
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-serif text-xl text-film-card">フィルムを使い切りました</p>
          <p className="font-mono text-[11px] tracking-widest text-film-card/45 uppercase">
            現像が終わるまでお待ちください
          </p>
        </div>

        <Link
          href={`/events/${eventId}/gallery?guest_id=${guestId}`}
          className="rounded-none border border-film-amber/40 px-8 py-2 font-mono text-[11px] tracking-[0.3em] text-film-amber/70 uppercase transition-colors hover:border-film-amber/70 hover:text-film-amber"
        >
          ギャラリーへ
        </Link>
      </div>
    );
  }

  /* ── 撮影終了スクリーン ── */
  if (isExpired) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-film-bg px-6 text-center">
        <p className="font-mono text-[10px] tracking-[0.4em] text-film-amber/40 uppercase">
          ── FILM FINISHED ──
        </p>

        <div
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{
            background: "radial-gradient(circle, #2E324299 0%, transparent 70%)",
            boxShadow: "0 0 32px 6px rgba(212,162,78,0.12)",
            border: "1px solid rgba(212,162,78,0.15)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(212,162,78,0.5)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-9 w-9"
            aria-hidden
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-serif text-xl text-film-card">撮影は終了しました</p>
          <p className="font-mono text-[11px] tracking-widest text-film-card/45 uppercase">
            フィルムを現像しています
          </p>
        </div>

        <Link
          href={`/events/${eventId}/gallery?guest_id=${guestId}`}
          className="rounded-none border border-film-amber/40 px-8 py-2 font-mono text-[11px] tracking-[0.3em] text-film-amber/70 uppercase transition-colors hover:border-film-amber/70 hover:text-film-amber"
        >
          ギャラリーへ
        </Link>
      </div>
    );
  }

  /* ── 通常カメラスクリーン ── */
  return (
    <div
      className="flex h-screen flex-col overflow-hidden"
      style={{ background: "#0F1118" }}
    >
      {/* Header */}
      <div className="flex flex-none items-center justify-between px-5 py-3">
        <p className="font-mono text-[10px] tracking-[0.4em] text-film-amber/40 uppercase">
          ── CAMERA ──
        </p>
        <p className="truncate font-serif text-sm text-film-card/70">{eventName}</p>
      </div>

      {/* Viewfinder: film strip layout with perforations */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left film strip */}
        <div
          className="flex w-4 flex-none flex-col justify-around py-2"
          style={{ background: "#1A1D29" }}
        >
          {Array.from({ length: PERF_COUNT }).map((_, i) => (
            <div
              key={i}
              className="mx-auto h-3 w-2 rounded-[2px]"
              style={{
                background: "#0F1118",
                border: "1px solid rgba(212,162,78,0.15)",
              }}
            />
          ))}
        </div>

        {/* Video frame */}
        <div className="relative flex-1 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* Shutter flash */}
          {isFlashing && (
            <div className="pointer-events-none absolute inset-0 bg-white/75" />
          )}

          {/* Viewfinder overlay: vignette + corner brackets */}
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute inset-0"
              style={{ boxShadow: "inset 0 0 60px rgba(0,0,0,0.5)" }}
            />
            <span className="absolute left-3 top-3 h-6 w-6 border-l-[2px] border-t-[2px] border-film-amber/50" />
            <span className="absolute right-3 top-3 h-6 w-6 border-r-[2px] border-t-[2px] border-film-amber/50" />
            <span className="absolute bottom-3 left-3 h-6 w-6 border-b-[2px] border-l-[2px] border-film-amber/50" />
            <span className="absolute bottom-3 right-3 h-6 w-6 border-b-[2px] border-r-[2px] border-film-amber/50" />
          </div>

          {/* Camera permission error */}
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-film-bg">
              <p className="px-8 text-center font-mono text-[11px] leading-loose text-film-safelight">
                カメラへのアクセスが許可されていません。
                <br />
                設定でカメラを許可してください。
              </p>
            </div>
          )}
        </div>

        {/* Right film strip */}
        <div
          className="flex w-4 flex-none flex-col justify-around py-2"
          style={{ background: "#1A1D29" }}
        >
          {Array.from({ length: PERF_COUNT }).map((_, i) => (
            <div
              key={i}
              className="mx-auto h-3 w-2 rounded-[2px]"
              style={{
                background: "#0F1118",
                border: "1px solid rgba(212,162,78,0.15)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Controls bar */}
      <div
        className="flex-none"
        style={{
          background: "#0F1118",
          borderTop: "1px solid rgba(212,162,78,0.12)",
        }}
      >
        <div className="flex items-center justify-between px-8 py-5 pb-8">
          {/* Film counter */}
          <div className="flex flex-col items-center gap-1 text-film-amber">
            <FilmIcon />
            <span className="font-mono text-3xl font-bold leading-none tracking-tight">
              {remaining !== null ? String(remaining).padStart(2, "0") : "∞"}
            </span>
          </div>

          {/* Shutter button */}
          <button
            onClick={handleShutter}
            disabled={isFilmExhausted || cameraError}
            className="h-20 w-20 rounded-full transition-transform active:scale-90 disabled:opacity-40 disabled:active:scale-100"
            style={{
              background: "radial-gradient(circle at 38% 32%, #FFFFFF, #C8C0B0)",
              boxShadow:
                "0 0 0 3px #D4A24E, 0 0 0 6px #0F1118, 0 8px 28px rgba(0,0,0,0.7)",
            }}
            aria-label="撮影"
          />

          {/* Balance spacer */}
          <div className="w-12" />
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
