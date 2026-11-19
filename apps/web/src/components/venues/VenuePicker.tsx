'use client';

import React, { useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { VENUE_REGIONS, VENUE_THEMES, getVenueTheme, type VenueRegion } from '@dco/shared';
import { normalizeSearch } from '@/lib/adminFormat';
import { venueThumbnail } from './VenueCard';

/** Choose one of the venue themes: the current pick up front, the catalogue on demand */
export function VenuePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [region, setRegion] = useState<'ALL' | VenueRegion>('ALL');
  const [query, setQuery] = useState('');
  const selected = getVenueTheme(value);

  const shown = useMemo(() => {
    const q = normalizeSearch(query);
    return VENUE_THEMES.filter(
      (v) => (region === 'ALL' || v.region === region) && (!q || normalizeSearch(`${v.nameVi} ${v.place}`).includes(q))
    );
  }, [region, query]);

  return (
    <div>
      <div className="flex gap-3 rounded-2xl border-2 border-rose-600 bg-rose-50/60 p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={venueThumbnail(selected.id)}
          alt=""
          width={160}
          height={100}
          className="h-[72px] w-[115px] shrink-0 rounded-xl object-cover sm:h-[88px] sm:w-[140px]"
          style={{ backgroundColor: selected.colors.s }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">{selected.nameVi}</p>
          <p className="text-[11px] font-medium text-slate-500">{selected.place}</p>
          <p className="mt-1 line-clamp-2 text-[11px] text-slate-600">{selected.descriptionVi}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className="text-xs font-bold text-rose-700 hover:underline"
            >
              {open ? 'Thu gọn danh sách' : `Đổi không gian (${VENUE_THEMES.length})`}
            </button>
            <a
              href={`/khong-gian/${selected.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Xem 3D <ExternalLink className="h-3 w-3" />
              <span className="sr-only">(mở tab mới)</span>
            </a>
          </div>
        </div>
      </div>

      {open && (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              aria-label="Lọc theo vùng"
              value={region}
              onChange={(e) => setRegion(e.target.value as 'ALL' | VenueRegion)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
            >
              <option value="ALL">Mọi vùng</option>
              {VENUE_REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nameVi}
                </option>
              ))}
            </select>
            <div className="relative flex-1">
              <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                aria-label="Tìm không gian"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tên hoặc quốc gia…"
                className="w-full rounded-xl border border-slate-300 py-2 pl-8 pr-3 text-xs"
              />
            </div>
          </div>
          <div className="mt-3 grid max-h-[420px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
            {shown.map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={v.id === selected.id}
                onClick={() => {
                  onChange(v.id);
                  setOpen(false);
                }}
                className={`overflow-hidden rounded-xl border-2 text-left transition ${
                  v.id === selected.id ? 'border-rose-600' : 'border-transparent hover:border-slate-300'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={venueThumbnail(v.id)}
                  alt=""
                  width={320}
                  height={200}
                  loading="lazy"
                  className="aspect-[16/10] w-full object-cover"
                  style={{ backgroundColor: v.colors.s }}
                />
                <span className="block px-2 py-1.5">
                  <span className="block truncate text-[11px] font-bold text-slate-900">{v.nameVi}</span>
                  <span className="block truncate text-[10px] text-slate-500">{v.place}</span>
                </span>
              </button>
            ))}
            {shown.length === 0 && <p className="col-span-full py-6 text-center text-xs text-slate-500">Không có không gian nào khớp.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
