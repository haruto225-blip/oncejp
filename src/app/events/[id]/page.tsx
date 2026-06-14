import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { toDataURL } from "qrcode";
import { supabase } from "@/lib/supabase";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: event } = await supabase
    .from("events")
    .select("id, name, reveal_at, max_guests")
    .eq("id", id)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  const headersList = await headers();
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  const host = headersList.get("host");
  const eventUrl = `${protocol}://${host}/events/${event.id}`;
  const qrCodeDataUrl = await toDataURL(eventUrl, { width: 240, margin: 1 });

  const revealAtLabel = event.reveal_at
    ? new Date(event.reveal_at).toLocaleString("ja-JP", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "未定";

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">{event.name}</h1>
        <p className="text-sm text-gray-600">公開日時: {revealAtLabel}</p>
        <p className="text-sm text-gray-600">最大参加人数: {event.max_guests}人</p>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 px-4 py-6">
        <img
          src={qrCodeDataUrl}
          alt="このイベントページのQRコード"
          width={240}
          height={240}
          className="h-60 w-60"
        />
        <p className="text-xs text-gray-500">
          QRコードを読み取るとこのページを開けます
        </p>
      </div>

      <Link
        href={`/events/${event.id}/join`}
        className="rounded-lg bg-gray-900 px-4 py-3 text-center text-base font-medium text-white"
      >
        参加する
      </Link>
    </div>
  );
}
