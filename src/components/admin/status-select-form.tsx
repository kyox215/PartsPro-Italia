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
        className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700"
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
        className="h-9 rounded-lg border border-blue-600 bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700"
        type="submit"
      >
        Save
      </button>
    </form>
  );
}
