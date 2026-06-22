"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function getMinutesLeft(revealAt: string): number {
  return Math.max(0, Math.ceil((new Date(revealAt).getTime() - Date.now()) / 60000));
}

export function GuestBottomNav({
  eventId,
  guestId,
  revealAt,
  current,
}: {
  eventId: string;
  guestId: string | null;
  revealAt: string | null;
  current: "camera" | "gallery";
}) {
  const [isDeveloping, setIsDeveloping] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(0);

  useEffect(() => {
    if (!revealAt) return;
    const target = new Date(revealAt).getTime();

    const update = () => {
      const remaining = target - Date.now();
      if (remaining > 0) {
        setIsDeveloping(true);
        setMinutesLeft(Math.ceil(remaining / 60000));
      } else {
        setIsDeveloping(false);
        setMinutesLeft(0);
      }
    };

    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, [revealAt]);

  const qs = guestId ? `?guest_id=${guestId}` : "";
  const cameraHref = `/events/${eventId}/camera${qs}`;
  const galleryHref = `/events/${eventId}/gallery${qs}`;

  const inactiveColor = "rgba(242,235,221,0.45)";
  const activeColor = "#D4A24E";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-around"
      style={{
        background: "#2E3242",
        borderTop: "1px solid rgba(212,162,78,0.18)",
        height: "58px",
      }}
    >
      <Link
        href={cameraHref}
        className="flex flex-1 flex-col items-center justify-center gap-[3px]"
        style={{ color: current === "camera" ? activeColor : inactiveColor }}
      >
        <CameraIcon active={current === "camera"} />
        <span className="font-mono text-[10px] tracking-wider">撮影</span>
      </Link>

      <Link
        href={galleryHref}
        className="flex flex-1 flex-col items-center justify-center gap-[3px]"
        style={{ color: current === "gallery" ? activeColor : inactiveColor }}
      >
        <GalleryIcon active={current === "gallery"} />
        <span className="font-mono text-[10px] tracking-wider leading-tight text-center px-1">
          {isDeveloping ? `現像中 あと${minutesLeft}分` : "ギャラリー"}
        </span>
      </Link>
    </nav>
  );
}

function CameraIcon({ active }: { active: boolean }) {
  const color = active ? "#D4A24E" : "rgba(242,235,221,0.45)";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function GalleryIcon({ active }: { active: boolean }) {
  const color = active ? "#D4A24E" : "rgba(242,235,221,0.45)";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}
