"use client";

import { useActionState } from "react";
import { createEvent, type CreateEventState } from "./actions";

const initialState: CreateEventState = { error: null };

export function NewEventForm() {
  const [state, formAction, pending] = useActionState(createEvent, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-gray-700">
          イベント名
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="〇〇の結婚式"
          className="rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-gray-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="reveal_at" className="text-sm font-medium text-gray-700">
          公開日時
        </label>
        <input
          id="reveal_at"
          name="reveal_at"
          type="datetime-local"
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-gray-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="max_guests" className="text-sm font-medium text-gray-700">
          最大参加人数
        </label>
        <input
          id="max_guests"
          name="max_guests"
          type="number"
          inputMode="numeric"
          min={1}
          required
          placeholder="50"
          className="rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-gray-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="max_photos_per_guest" className="text-sm font-medium text-gray-700">
          1人あたりの撮影枚数
        </label>
        <select
          id="max_photos_per_guest"
          name="max_photos_per_guest"
          defaultValue="27"
          className="rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-gray-500 focus:outline-none"
        >
          <option value="12">12枚</option>
          <option value="24">24枚</option>
          <option value="27">27枚</option>
          <option value="36">36枚</option>
          <option value="">無制限</option>
        </select>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-gray-900 px-4 py-3 text-base font-medium text-white transition-opacity disabled:opacity-50"
      >
        {pending ? "作成中…" : "イベントを作成"}
      </button>
    </form>
  );
}
