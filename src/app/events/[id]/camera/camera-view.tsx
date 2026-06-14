"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

type Photo = {
  id: string;
  previewUrl: string;
  uploading: boolean;
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
          { id: photoId, previewUrl, uploading: true },
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

        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId
              ? { ...p, uploading: false, error: dbError?.message }
              : p,
          ),
        );
      },
      "image/jpeg",
      0.85,
    );
  }, [eventId, guestId, capturing]);

  if (cameraError) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-center text-sm text-red-600">{cameraError}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "3/4" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <button
        onClick={capture}
        disabled={capturing}
        className="w-full rounded-full bg-gray-900 py-4 text-base font-medium text-white transition-opacity disabled:opacity-50"
      >
        {capturing ? "処理中…" : "撮影する"}
      </button>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square overflow-hidden rounded-lg bg-gray-100"
            >
              <img
                src={photo.previewUrl}
                alt=""
                className="h-full w-full object-cover"
              />
              {photo.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="text-xs text-white">送信中…</span>
                </div>
              )}
              {photo.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/50">
                  <span className="text-xs text-white">{photo.error}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
