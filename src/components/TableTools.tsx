export type SortDirection = 'asc' | 'desc';

export const inputClass = 'h-11 w-full rounded-lg border border-stone-900/10 bg-white px-3 py-2 text-sm font-bold text-stone-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10';
export const selectClass = `${inputClass} appearance-none bg-[linear-gradient(45deg,transparent_50%,#047857_50%),linear-gradient(135deg,#047857_50%,transparent_50%)] bg-[length:6px_6px,6px_6px] bg-[position:calc(100%-18px)_calc(50%-3px),calc(100%-12px)_calc(50%-3px)] bg-no-repeat pr-9`;
export const panelClass = 'rounded-lg border border-stone-900/10 bg-white p-5 shadow-lg shadow-emerald-950/5';
export const tableClass = 'w-full min-w-[760px] border-collapse';
export const thClass = 'border-b border-stone-900/10 bg-emerald-500/5 p-3.5 text-left align-middle';
export const tdClass = 'border-b border-stone-900/10 p-3.5 align-middle';
export const iconButtonClass = 'inline-grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-950 transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:text-white';
export const dangerIconButtonClass = 'inline-grid h-9 w-9 place-items-center rounded-lg bg-red-100 text-red-700 transition hover:-translate-y-0.5 hover:bg-red-600 hover:text-white';
export const primaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60';
export const secondaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2.5 text-sm font-extrabold text-emerald-950 transition hover:bg-emerald-500/20';

export function SortHeader({
  label,
  active,
  direction,
  onSort,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onSort: () => void;
}) {
  return (
    <th className={thClass}>
      <button className={`inline-flex w-full items-center justify-between gap-2 bg-transparent p-0 text-left text-xs font-black uppercase tracking-widest ${active ? 'text-emerald-950' : 'text-stone-500'}`} onClick={onSort} type="button">
        <span>{label}</span>
        <b className={active ? 'text-emerald-700' : 'text-emerald-950/45'}>{active ? (direction === 'asc' ? '↑' : '↓') : '↕'}</b>
      </button>
    </th>
  );
}

export function TableToolbar({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 grid grid-cols-1 items-center gap-3 lg:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(150px,220px))]">{children}</div>;
}

export function PageSizeSelect({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <select className={selectClass} value={value} onChange={(event) => onChange(Number(event.target.value))}>
      {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size} rows</option>)}
    </select>
  );
}

export function Pagination({
  page,
  totalPages,
  totalCount,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3 text-sm font-bold text-stone-500 sm:flex-row sm:items-center sm:justify-between">
      <span>{totalCount} total rows</span>
      <div className="flex items-center gap-2">
        <button className={secondaryButtonClass} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</button>
        <span className="px-2 text-emerald-950">Page {page} of {Math.max(1, totalPages)}</span>
        <button className={secondaryButtonClass} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</button>
      </div>
    </div>
  );
}
