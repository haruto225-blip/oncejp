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
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  if (!guest_id) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-4">
        <p className="text-sm text-gray-600">
          参加登録が完了していません。もう一度お試しください。
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-6">
      <h1 className="text-lg font-semibold">{event.name}</h1>
      <CameraView eventId={event.id} guestId={guest_id} />
    </div>
  );
}
