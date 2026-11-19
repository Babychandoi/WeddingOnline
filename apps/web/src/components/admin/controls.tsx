'use client';

import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Search, X } from 'lucide-react';
import { cx, tableStyles } from './ui';

export function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="relative w-full min-w-0 sm:w-auto sm:max-w-sm sm:flex-1">
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[#DCCDB4] bg-white py-2 pl-9 pr-9 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-500 focus:border-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Xoá từ khoá"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="rounded-lg border border-[#DCCDB4] bg-white py-2 pl-3 pr-8 text-sm text-slate-800 outline-none transition-colors focus:border-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export type SortDir = 'asc' | 'desc';

export function SortHeader<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string;
  sortKey: K;
  sort: { key: K; dir: SortDir };
  onSort: (key: K) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cx(tableStyles.th, className)}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cx(
          '-mx-1 inline-flex items-center gap-1 rounded px-1 transition-colors hover:text-slate-900',
          active && 'text-slate-900'
        )}
      >
        {label}
        <Icon aria-hidden className={cx('h-3.5 w-3.5', !active && 'opacity-50')} />
      </button>
    </th>
  );
}

/** Toggle for a sortable column: same key flips direction, a new key starts descending */
export function nextSort<K extends string>(sort: { key: K; dir: SortDir }, key: K): { key: K; dir: SortDir } {
  return sort.key === key ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' };
}

export function ResultCount({ shown, total, unit }: { shown: number; total: number; unit: string }) {
  return (
    <p className="ml-auto whitespace-nowrap text-[13px] text-slate-600 tabular-nums">
      {shown === total ? `${total} ${unit}` : `${shown} / ${total} ${unit}`}
    </p>
  );
}
