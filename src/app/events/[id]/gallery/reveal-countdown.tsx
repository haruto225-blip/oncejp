"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}日`);
  if (days > 0 || hours > 0) parts.push(`${hours}時間`);
  parts.push(`${minutes}分`);
  parts.push(`${seconds}秒`);

  return `残り ${parts.join(" ")}`;
}

export function RevealCountdown({ revealAt }: { revealAt: string }) {
  const target = new Date(revealAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (now === null) {
    return (
      <p className="font-mono text-xs text-film-amber/40 tracking-widest">
        ── ── ──
      </p>
    );
  }

  const remaining = target - now;

  return (
    <p className="font-mono text-sm text-film-amber/70 tracking-wider">
      {remaining <= 0 ? "まもなく公開されます" : formatRemaining(remaining)}
    </p>
  );
}
