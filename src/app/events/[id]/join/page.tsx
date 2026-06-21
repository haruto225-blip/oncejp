import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { joinEvent } from "./actions";
import { JoinForm } from "./join-form";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: event } = await supabase
    .from("events")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  const boundAction = joinEvent.bind(null, event.id);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-film-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="mb-1 font-mono text-[10px] tracking-[0.35em] text-film-amber/50 uppercase">
          ── GUEST ──
        </p>
        <h1 className="font-serif text-2xl text-film-card">{event.name}</h1>
        <p className="mt-2 font-sans text-sm text-film-card/50">
          参加するにはお名前を入力してください
        </p>
      </div>

      <JoinForm action={boundAction} />
    </div>
  );
}
