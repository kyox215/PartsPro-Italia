import type { ReactNode } from "react";

export function StatusSelectForm({
  action,
  id,
  locale,
  currentStatus,
  statuses,
  extraFields,
}: Readonly<{
  action: string;
  id: string;
  locale: string;
  currentStatus: string;
  statuses: string[];
  extraFields?: ReactNode;
}>) {
  return (
    <form action={action} method="post" className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="locale" value={locale} />
      {extraFields}
      <select
        className="h-9 rounded-lg border border-black/10 bg-white px-2 text-xs font-black text-stone-700 outline-none transition focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10"
        name="status"
        defaultValue={currentStatus}
      >
        {statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <button
        className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white transition hover:bg-stone-800"
        type="submit"
      >
        Save
      </button>
    </form>
  );
}
