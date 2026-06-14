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
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">{event.name}</h1>
        <p className="text-sm text-gray-600">
          参加するにはお名前を入力してください
        </p>
      </div>

      <JoinForm action={boundAction} />
    </div>
  );
}
