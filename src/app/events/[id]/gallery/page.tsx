import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { RevealCountdown } from "./reveal-countdown";
import { PhotoCard } from "./photo-card";

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: event } = await supabase
    .from("events")
    .select("id, name, reveal_at")
    .eq("id", id)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  /* ── 現像中スクリーン ── */
  if (event.reveal_at && new Date(event.reveal_at) > new Date()) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-film-bg px-4 text-center">
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
    <div className="min-h-screen bg-film-bg px-4 py-10">
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
    </div>
  );
}
