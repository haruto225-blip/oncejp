import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { toDataURL } from "qrcode";
import { supabase } from "@/lib/supabase";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: event } = await supabase
    .from("events")
    .select("id, name, reveal_at, max_guests")
    .eq("id", id)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  const headersList = await headers();
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  const host = headersList.get("host");
  const eventUrl = `${protocol}://${host}/events/${event.id}`;
  const qrCodeDataUrl = await toDataURL(eventUrl, { width: 240, margin: 2, color: { dark: "#1A1D29", light: "#F2EBDD" } });

  const revealAtLabel = event.reveal_at
    ? new Date(event.reveal_at).toLocaleString("ja-JP", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "未定";

  const filmNo = event.id.slice(0, 8).toUpperCase();

  return (
    <div className="relative flex min-h-screen flex-col items-center gap-8 bg-film-bg px-4 py-10">

      {/* Film strip header */}
      <div className="flex w-full max-w-sm items-center gap-1 self-start overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="h-2 w-3 shrink-0 rounded-[2px] border border-film-subbg bg-film-subbg"
          />
        ))}
      </div>

      {/* Event info — film label style */}
      <div className="w-full max-w-sm">
        <p className="mb-2 font-mono text-[10px] tracking-[0.35em] text-film-amber/50 uppercase">
          ── FILM NO. {filmNo} ──
        </p>
        <h1 className="font-serif text-2xl leading-snug text-film-card">
          {event.name}
        </h1>
        <div className="mt-4 border-t border-film-amber/20 pt-3 flex flex-col gap-2">
          <div className="flex items-baseline gap-3">
            <span className="w-12 text-right text-[10px] text-film-card/40 font-sans uppercase tracking-wider">
              公開
            </span>
            <span className="font-mono text-sm text-film-amber">{revealAtLabel}</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="w-12 text-right text-[10px] text-film-card/40 font-sans uppercase tracking-wider">
              定員
            </span>
            <span className="font-mono text-sm text-film-amber">{event.max_guests} 名</span>
          </div>
        </div>
      </div>

      {/* Polaroid QR card */}
      <div
        className="flex flex-col items-center bg-film-card"
        style={{
          padding: "14px 14px 52px",
          transform: "rotate(-1.5deg)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.55), 0 2px 10px rgba(0,0,0,0.4)",
        }}
      >
        <img
          src={qrCodeDataUrl}
          alt="このイベントページのQRコード"
          width={220}
          height={220}
          className="block"
        />
        <p className="mt-5 font-mono text-[10px] tracking-[0.25em] text-gray-400 uppercase">
          scan to join
        </p>
      </div>

      {/* Helper text */}
      <p className="text-center text-xs text-film-card/30 font-sans">
        QRコードを読み取るとこのページを開けます
      </p>

      {/* Join button */}
      <Link
        href={`/events/${event.id}/join`}
        className="w-full max-w-sm rounded-lg bg-film-amber px-4 py-3 text-center text-base font-semibold tracking-wide text-film-bg transition-opacity hover:opacity-90 active:opacity-80"
      >
        参加する
      </Link>

      {/* Film strip footer */}
      <div className="flex w-full max-w-sm items-center gap-1 self-start overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="h-2 w-3 shrink-0 rounded-[2px] border border-film-subbg bg-film-subbg"
          />
        ))}
      </div>
    </div>
  );
}
