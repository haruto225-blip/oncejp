"use server";

import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export type JoinEventState = {
  error: string | null;
};

export async function joinEvent(
  eventId: string,
  _prevState: JoinEventState,
  formData: FormData,
): Promise<JoinEventState> {
  const displayName = formData.get("display_name")?.toString().trim();

  if (!displayName) {
    return { error: "名前を入力してください" };
  }

  const { data, error } = await supabase
    .from("guests")
    .insert({ event_id: eventId, display_name: displayName })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "参加登録に失敗しました" };
  }

  redirect(`/events/${eventId}/camera?guest_id=${data.id}`);
}
