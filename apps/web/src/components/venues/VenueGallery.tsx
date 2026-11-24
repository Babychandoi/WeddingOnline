'use client';

import React, { useMemo, useState } from 'react';
import { VENUE_REGIONS, type VenueRegion, type VenueTheme } from '@dco/shared';
import { normalizeSearch } from '@/lib/adminFormat';
import { OpalFilterTabs, ScrySearchInput } from '@/components/motion/ShowcaseMotion';
import { OrbitalVenueGallery } from '@/components/threeui/OrbitalVenueGallery';
import { VenueCard } from './VenueCard';

const INITIAL_BATCH = 24;

export function VenueGallery({ venues }: { venues: VenueTheme[] }) {
  const [region, setRegion] = useState<'ALL' | VenueRegion>('ALL');
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);

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
        (!q || normalizeSearch(`${v.nameVi} ${v.place} ${v.descriptionVi}`).includes(q)),
    );
  }, [venues, region, query]);

  const tabOptions = useMemo(
    () => [
      { id: 'ALL', label: 'Tất cả', count: venues.length },
      ...VENUE_REGIONS.map((r) => ({ id: r.id, label: r.nameVi, count: counts.get(r.id) ?? 0 })),
    ],
    [counts, venues.length],
  );

  return (
    <div className="space-y-8">
      {!query && shown.length >= 3 && (
        <OrbitalVenueGallery
          venues={shown.slice(0, 10)}
          heading={region === 'ALL' ? 'Dạo Vòng 101 Không Gian Cưới 3D' : 'Không Gian Nổi Bật Trong Khu Vực'}
          headingTag="h2"
        />
      )}

      <div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <OpalFilterTabs
            ariaLabel="Lọc theo vùng không gian cưới"
            value={region}
            options={tabOptions}
            onChange={(next) => {
              setRegion(next as 'ALL' | VenueRegion);
              setVisibleCount(INITIAL_BATCH);
            }}
          />
          <ScrySearchInput
            value={query}
            onChange={(val) => {
              setQuery(val);
              setVisibleCount(INITIAL_BATCH);
            }}
            placeholder="Tìm theo tên, quốc gia…"
            ariaLabel="Tìm không gian cưới"
          />
        </div>

        {shown.length === 0 ? (
          <p className="mt-12 text-center text-sm text-slate-600">
            Chưa có không gian nào khớp “{query}”.{' '}
            <button type="button" onClick={() => setQuery('')} className="font-semibold text-rose-700 hover:underline">
              Xem tất cả
            </button>
          </p>
        ) : (
          <>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {shown.slice(0, visibleCount).map((venue, i) => (
                <VenueCard key={venue.id} venue={venue} priority={i < 4} />
              ))}
            </div>
            {visibleCount < shown.length && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((n) => n + INITIAL_BATCH)}
                  className="inline-flex min-h-[52px] items-center rounded-full border border-rose-900/20 bg-white px-7 text-sm font-bold text-rose-900 shadow-sm transition hover:bg-rose-50 hover:border-rose-900/50"
                >
                  Xem thêm không gian{' '}
                  <span className="ml-1.5 tabular-nums opacity-60">({shown.length - visibleCount})</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
