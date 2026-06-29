import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CameraView } from "./camera-view";

export default async function CameraPage({
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
    .select("id, name, reveal_at, max_photos_per_guest")
    .eq("id", id)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  if (!guest_id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-film-bg px-4">
        <p className="text-center font-mono text-xs text-film-safelight">
          参加登録が完了していません。もう一度お試しください。
        </p>
      </div>
    );
  }

  const { count: photoCount } = await supabase
    .from("photos")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id)
    .eq("guest_id", guest_id);

  return (
    <CameraView
      eventId={event.id}
      guestId={guest_id}
      revealAt={event.reveal_at ?? null}
      maxPhotosPerGuest={event.max_photos_per_guest ?? null}
      initialPhotoCount={photoCount ?? 0}
      eventName={event.name}
    />
  );
}
