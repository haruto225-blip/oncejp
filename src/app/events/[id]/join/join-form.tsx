"use client";

import { useActionState } from "react";
import type { JoinEventState } from "./actions";

const initialState: JoinEventState = { error: null };

export function JoinForm({
  action,
}: {
  action: (prevState: JoinEventState, formData: FormData) => Promise<JoinEventState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="display_name"
          className="text-sm font-medium text-gray-700"
        >
          お名前
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          required
          placeholder="山田 太郎"
          autoFocus
          className="rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-gray-500 focus:outline-none"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-gray-900 px-4 py-3 text-base font-medium text-white transition-opacity disabled:opacity-50"
      >
        {pending ? "送信中…" : "参加する"}
      </button>
    </form>
  );
}
