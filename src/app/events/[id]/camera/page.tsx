import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CameraView } from "./camera-view";
import { GuestBottomNav } from "@/components/GuestBottomNav";

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
    .select("id, name, reveal_at")
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

  return (
    <div className="flex min-h-screen flex-col bg-film-bg">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8 pb-20">
        <div>
          <p className="mb-1 font-mono text-[10px] tracking-[0.35em] text-film-amber/50 uppercase">
            ── CAMERA ──
          </p>
          <h1 className="font-serif text-xl text-film-card">{event.name}</h1>
        </div>
        <CameraView eventId={event.id} guestId={guest_id} />
      </div>
      <GuestBottomNav
        eventId={event.id}
        guestId={guest_id}
        revealAt={event.reveal_at ?? null}
        current="camera"
      />
    </div>
  );
}
