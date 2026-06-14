import { NewEventForm } from "./new-event-form";

export default function NewEventPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-xl font-semibold">イベントを作成</h1>
      <NewEventForm />
    </div>
  );
}
