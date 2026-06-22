import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { RevealCountdown } from "./reveal-countdown";
import { PhotoCard } from "./photo-card";
import { GuestBottomNav } from "@/components/GuestBottomNav";

const ROTATIONS = [-2.2, 1.8, -1.1, 2.5, -2.8, 1.4, -1.7, 2.1];

function UnexposedCard({ index }: { index: number }) {
  const rotation = ROTATIONS[index % ROTATIONS.length];
  return (
    <div style={{ transform: `rotate(${rotation}deg)` }}>
      <div
        className="flex flex-col"
        style={{
          padding: "8px 8px 34px",
          background: "#F2EBDD",
          boxShadow: "0 6px 24px rgba(0,0,0,0.5), 0 1px 6px rgba(0,0,0,0.35)",
        }}
      >
        {/* 未露光のフィルムコマ */}
        <div
          className="relative aspect-square w-full overflow-hidden"
          style={{
            background:
              "linear-gradient(160deg, #1D1B19 0%, #080706 55%, #181614 100%)",
          }}
        >
          {/* ヴィネット */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(20,16,12,0.1) 0%, rgba(0,0,0,0.75) 100%)",
            }}
          />
          {/* グレインのほのめかし */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(255,255,255,0.012) 1px, rgba(255,255,255,0.012) 2px)",
              opacity: 0.5,
            }}
          />
          {/* 縁の明暗 */}
          <div
            className="absolute inset-0"
            style={{
              boxShadow: "inset 0 0 10px rgba(0,0,0,0.9)",
            }}
          />
        </div>

        {/* キャプション */}
        <div className="mt-2 px-0.5">
          <p className="font-mono text-[9px] tracking-wide text-gray-400 uppercase">
            現像待ち
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function GalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guest_id?: string }>;
}) {
  const { id } = await params;
  const { guest_id } = await searchParams;

  const { data: event } = await supabase
    .from("events")
    .select("id, name, reveal_at")
    .eq("id", id)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  const guestId = guest_id ?? null;

  /* ── 現像中スクリーン ── */
  if (event.reveal_at && new Date(event.reveal_at) > new Date()) {
    const { count: photoCount } = await supabase
      .from("photos")
      .select("*", { count: "exact", head: true })
      .eq("event_id", id);

    const count = photoCount ?? 0;

    return (
      <div className="min-h-screen bg-film-bg px-4 pb-20">
        {/* ヘッダー部分 — 中央揃え */}
        <div className="flex flex-col items-center gap-6 py-10 text-center">
          <p className="font-mono text-[10px] tracking-[0.4em] text-film-amber/40 uppercase">
            ── DARKROOM ──
          </p>

          {/* Safelight glow */}
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full"
            style={{
              background: "radial-gradient(circle, #8B3A3A44 0%, transparent 70%)",
              boxShadow: "0 0 40px 8px #8B3A3A33",
            }}
          >
            <span
              className="text-4xl"
              style={{ filter: "brightness(0.55) sepia(1) hue-rotate(-15deg)" }}
            >
              📷
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="font-serif text-2xl text-film-card">{event.name}</h1>
            <p className="font-serif text-lg text-film-card/60">現像中...</p>
          </div>

          <RevealCountdown revealAt={event.reveal_at} />
        </div>

        {/* 未現像プレースホルダーグリッド */}
        {count > 0 && (
          <div className="mx-auto max-w-md">
            <div className="grid grid-cols-2 gap-6 px-2">
              {Array.from({ length: count }).map((_, i) => (
                <UnexposedCard key={i} index={i} />
              ))}
            </div>
          </div>
        )}

        <GuestBottomNav
          eventId={event.id}
          guestId={guestId}
          revealAt={event.reveal_at}
          current="gallery"
        />
      </div>
    );
  }

  /* ── 写真公開処理 ── */
  await supabase
    .from("photos")
    .update({ is_hidden: false })
    .eq("event_id", id)
    .eq("is_hidden", true);

  const { data: photos } = await supabase
    .from("photos")
    .select("id, storage_key, taken_at, guests(display_name)")
    .eq("event_id", id)
    .eq("is_hidden", false)
    .order("taken_at", { ascending: false });

  const items = (photos ?? []).map((photo) => {
    const guest = Array.isArray(photo.guests) ? photo.guests[0] : photo.guests;
    return {
      id: photo.id,
      url: supabase.storage.from("photos").getPublicUrl(photo.storage_key).data
        .publicUrl,
      displayName: guest?.display_name ?? "ゲスト",
      takenAt: photo.taken_at ?? null,
    };
  });

  /* ── ギャラリースクリーン ── */
  return (
    <div className="min-h-screen bg-film-bg px-4 py-10 pb-20">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-8">
          <p className="mb-1 font-mono text-[10px] tracking-[0.35em] text-film-amber/50 uppercase">
            ── GALLERY ──
          </p>
          <h1 className="font-serif text-2xl text-film-card">{event.name}</h1>
        </div>

        {items.length === 0 ? (
          <p className="font-mono text-xs text-film-card/40 tracking-wider">
            まだ写真がありません
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6 px-2">
            {items.map((item, i) => (
              <PhotoCard
                key={item.id}
                src={item.url}
                displayName={item.displayName}
                takenAt={item.takenAt}
                index={i}
              />
            ))}
          </div>
        )}
      </div>

      <GuestBottomNav
        eventId={event.id}
        guestId={guestId}
        revealAt={event.reveal_at ?? null}
        current="gallery"
      />
    </div>
  );
}
