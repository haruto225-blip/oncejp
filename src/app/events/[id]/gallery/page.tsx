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

  if (event.reveal_at && new Date(event.reveal_at) > new Date()) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-4 py-8 text-center">
        <h1 className="text-xl font-semibold">{event.name}</h1>
        <p className="text-3xl">📷</p>
        <p className="text-lg font-medium text-gray-800">現像中...</p>
        <RevealCountdown revealAt={event.reveal_at} />
      </div>
    );
  }

  await supabase
    .from("photos")
    .update({ is_hidden: false })
    .eq("event_id", id)
    .eq("is_hidden", true);

  const { data: photos } = await supabase
    .from("photos")
    .select("id, storage_key, guests(display_name)")
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
    };
  });

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-6">
      <h1 className="text-xl font-semibold">{event.name}</h1>

      {items.length === 0 ? (
        <p className="text-sm text-gray-600">まだ写真がありません</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <PhotoCard
              key={item.id}
              src={item.url}
              displayName={item.displayName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
