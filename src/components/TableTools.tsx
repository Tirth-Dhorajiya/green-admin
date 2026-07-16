import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc';

export type SelectOption = {
  value: string;
  label: string;
};

export const inputClass = 'h-11 w-full rounded-lg border border-stone-900/10 bg-white px-3 py-2 text-sm font-bold text-stone-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10';
export const panelClass = 'rounded-lg border border-stone-900/10 bg-white p-5 shadow-lg shadow-emerald-950/5';
export const tableClass = 'w-full min-w-[760px] border-collapse';
export const thClass = 'border-b border-stone-900/10 bg-emerald-500/5 p-3.5 text-left align-middle';
export const tdClass = 'border-b border-stone-900/10 p-3.5 align-middle';
export const iconButtonClass = 'inline-grid h-9 w-9 cursor-pointer place-items-center rounded-lg bg-emerald-500/10 text-emerald-950 transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50';
export const dangerIconButtonClass = 'inline-grid h-9 w-9 cursor-pointer place-items-center rounded-lg bg-red-100 text-red-700 transition hover:-translate-y-0.5 hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50';
export const primaryButtonClass = 'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60';
export const secondaryButtonClass = 'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2.5 text-sm font-extrabold text-emerald-950 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50';

export function BrandedSelect({
  value,
  options,
  onChange,
  label,
  className = '',
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({ top: 0, left: 0, width: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selected = useMemo(() => options.find((option) => option.value === value), [options, value]);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuStyle({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    };

    const closeOnOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    updatePosition();
    document.addEventListener('mousedown', closeOnOutside);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative w-full min-w-0 ${className}`}>
      {label && <span className="mb-2 block text-sm font-bold text-stone-600">{label}</span>}
      <button
        ref={buttonRef}
        type="button"
        className="flex h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-stone-900/10 bg-white px-3 text-left text-sm font-extrabold text-stone-900 outline-none transition hover:border-emerald-500/50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{selected?.label || 'Select option'}</span>
        <ChevronDown size={16} className={`shrink-0 text-emerald-700 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="fixed z-50 max-h-72 overflow-auto rounded-xl border border-emerald-900/10 bg-white p-1 shadow-2xl shadow-emerald-950/20"
          style={menuStyle}
          role="listbox"
        >
          {options.map((option) => {
            const active = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-extrabold transition ${active ? 'bg-emerald-700 text-white' : 'text-stone-700 hover:bg-emerald-500/10 hover:text-emerald-950'}`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span>{option.label}</span>
                {active && <Check size={15} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
      <button className={`inline-flex w-full cursor-pointer items-center justify-between gap-2 bg-transparent p-0 text-left text-xs font-black uppercase tracking-widest ${active ? 'text-emerald-950' : 'text-stone-500'}`} onClick={onSort} type="button">
        <span>{label}</span>
        <b className={active ? 'text-emerald-700' : 'text-emerald-950/45'}>{active ? (direction === 'asc' ? '↑' : '↓') : '↕'}</b>
      </button>
    </th>
  );
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-stone-900/10 ${className}`} />;
}

export function TableSkeletonRows({ rows = 6, columns }: { rows?: number; columns: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <td key={columnIndex} className={tdClass}>
              <SkeletonBlock className={`h-4 ${columnIndex === 0 ? 'w-40' : columnIndex === columns - 1 ? 'w-16' : 'w-24'}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function TableToolbar({ children }: { children: ReactNode }) {
  return <div className="mb-4 grid grid-cols-1 items-center gap-3 lg:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(150px,220px))]">{children}</div>;
}

export function PageSizeSelect({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <BrandedSelect
      className="w-36"
      value={String(value)}
      onChange={(nextValue) => onChange(Number(nextValue))}
      options={[10, 20, 50, 100].map((size) => ({ value: String(size), label: `${size} rows` }))}
    />
  );
}

export function Pagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (value: number) => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3 text-sm font-bold text-stone-500 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <span>{totalCount} total rows</span>
        <PageSizeSelect value={pageSize} onChange={onPageSizeChange} />
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className={secondaryButtonClass} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</button>
        <span className="px-2 text-emerald-950">Page {page} of {Math.max(1, totalPages)}</span>
        <button type="button" className={secondaryButtonClass} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</button>
      </div>
    </div>
  );
}
