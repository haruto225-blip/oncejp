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
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-5">
      {/* Film label card */}
      <div
        className="flex flex-col gap-5 bg-film-card px-6 py-5"
        style={{
          boxShadow:
            "0 4px 24px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(0,0,0,0.08)",
        }}
      >
        {/* Label header */}
        <div className="border-b border-gray-400/30 pb-3">
          <p className="font-mono text-[9px] tracking-[0.35em] text-gray-500 uppercase">
            Guest Registration
          </p>
        </div>

        {/* Name input */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="display_name"
            className="font-mono text-[10px] tracking-widest text-gray-500 uppercase"
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
            className="border-b border-gray-400 bg-transparent py-2 font-sans text-base text-film-bg placeholder:text-gray-400 focus:border-film-amber focus:outline-none"
            style={{ transition: "border-color 0.2s" }}
          />
        </div>
      </div>

      {state.error && (
        <p className="font-mono text-xs text-film-safelight">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-film-amber py-3 text-base font-semibold tracking-wide text-film-bg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "送信中…" : "参加する"}
      </button>
    </form>
  );
}
