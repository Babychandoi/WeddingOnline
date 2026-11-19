'use client';

import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { VENUE_REGIONS, type VenueRegion, type VenueTheme } from '@dco/shared';
import { normalizeSearch } from '@/lib/adminFormat';
import { VenueCard } from './VenueCard';

export function VenueGallery({ venues }: { venues: VenueTheme[] }) {
  const [region, setRegion] = useState<'ALL' | VenueRegion>('ALL');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => {
    const c = new Map<VenueRegion, number>();
    venues.forEach((v) => c.set(v.region, (c.get(v.region) ?? 0) + 1));
    return c;
  }, [venues]);

  const shown = useMemo(() => {
    const q = normalizeSearch(query);
    return venues.filter(
      (v) =>
        (region === 'ALL' || v.region === region) &&
        (!q || normalizeSearch(`${v.nameVi} ${v.place} ${v.descriptionVi}`).includes(q))
    );
  }, [venues, region, query]);

  const tabClass = (active: boolean) =>
    `whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
      active ? 'bg-rose-700 text-white shadow-sm' : 'bg-white text-slate-700 ring-1 ring-amber-200 hover:bg-amber-50'
    }`;

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Lọc theo vùng" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <button type="button" aria-pressed={region === 'ALL'} onClick={() => setRegion('ALL')} className={tabClass(region === 'ALL')}>
            Tất cả <span className="ml-0.5 tabular-nums opacity-75">{venues.length}</span>
          </button>
          {VENUE_REGIONS.map((r) => (
            <button key={r.id} type="button" aria-pressed={region === r.id} onClick={() => setRegion(r.id)} className={tabClass(region === r.id)}>
              {r.nameVi} <span className="ml-0.5 tabular-nums opacity-75">{counts.get(r.id) ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-72">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            aria-label="Tìm không gian cưới"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên, quốc gia…"
            className="w-full rounded-full border border-amber-200 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-rose-400 focus-visible:ring-2 focus-visible:ring-rose-200 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Xoá từ khoá"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="mt-12 text-center text-sm text-slate-600">
          Chưa có không gian nào khớp “{query}”.{' '}
          <button type="button" onClick={() => setQuery('')} className="font-semibold text-rose-700 hover:underline">
            Xem tất cả
          </button>
        </p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((venue, i) => (
            <VenueCard key={venue.id} venue={venue} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
