"use server";

import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

const DUMMY_HOST_ID = "00000000-0000-0000-0000-000000000000";

export type CreateEventState = {
  error: string | null;
};

export async function createEvent(
  _prevState: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const name = formData.get("name")?.toString().trim();
  const revealAt = formData.get("reveal_at")?.toString();
  const maxGuests = formData.get("max_guests")?.toString();
  const maxPhotosRaw = formData.get("max_photos_per_guest")?.toString();

  if (!name || !revealAt || !maxGuests) {
    return { error: "すべての項目を入力してください" };
  }

  const maxGuestsNumber = Number(maxGuests);
  if (!Number.isInteger(maxGuestsNumber) || maxGuestsNumber <= 0) {
    return { error: "最大参加人数は1以上の整数で入力してください" };
  }

  const maxPhotosPerGuest =
    maxPhotosRaw && maxPhotosRaw !== "" ? Number(maxPhotosRaw) : null;

  const { data, error } = await supabase
    .from("events")
    .insert({
      host_id: DUMMY_HOST_ID,
      name,
      reveal_at: new Date(revealAt + "+09:00").toISOString(),
      max_guests: maxGuestsNumber,
      max_photos_per_guest: maxPhotosPerGuest,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "イベントの作成に失敗しました" };
  }

  redirect(`/events/${data.id}`);
}
