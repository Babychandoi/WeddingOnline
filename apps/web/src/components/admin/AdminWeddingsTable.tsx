'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, HeartHandshake, Mail } from 'lucide-react';
import type { WeddingTier } from '@dco/shared';
import { normalizeSearch, TIER_LABELS } from '@/lib/adminFormat';
import type { WeddingRow } from '@/lib/adminData';
import { LIFECYCLE_STAGES } from '@/lib/weddingLifecycle';
import { FilterSelect, nextSort, ResultCount, SearchField, SortHeader, type SortDir } from './controls';
import { EmptyState, LifecycleTrack, Panel, TierBadge, tableStyles } from './ui';

type SortKey = 'weddingDate' | 'created';
type StageFilter = 'ALL' | 'plaza' | `${number}`;

const TIER_OPTIONS: Array<{ value: 'ALL' | WeddingTier; label: string }> = [
  { value: 'ALL', label: 'Mọi gói' },
  ...(Object.keys(TIER_LABELS) as WeddingTier[]).map((t) => ({ value: t, label: TIER_LABELS[t] })),
];

const STAGE_OPTIONS: Array<{ value: StageFilter; label: string }> = [
  { value: 'ALL', label: 'Mọi giai đoạn' },
  ...LIFECYCLE_STAGES.map((label, i) => ({ value: `${i}` as StageFilter, label })),
  { value: 'plaza', label: 'Quảng trường 24/7' },
];

export function AdminWeddingsTable({ rows, initialQuery = '' }: { rows: WeddingRow[]; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [tier, setTier] = useState<'ALL' | WeddingTier>('ALL');
  const [stage, setStage] = useState<StageFilter>('ALL');
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'weddingDate', dir: 'asc' });

  const shown = useMemo(() => {
    const q = normalizeSearch(query);
    const filtered = rows.filter(
      (r) =>
        (!q || r.search.includes(q)) &&
        (tier === 'ALL' || r.tier === tier) &&
        (stage === 'ALL' || (stage === 'plaza' ? r.lifecycle.stage === -1 : `${r.lifecycle.stage}` === stage))
    );
    const field = sort.key === 'weddingDate' ? 'weddingDateIso' : 'createdIso';
    return filtered.sort((a, b) => (sort.dir === 'asc' ? 1 : -1) * a[field].localeCompare(b[field]));
  }, [rows, query, tier, stage, sort]);

  const clearFilters = () => {
    setQuery('');
    setTier('ALL');
    setStage('ALL');
  };

  return (
    <Panel bodyClassName="p-0">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-[#F2E9DA] px-5 py-3.5">
        <SearchField
          value={query}
          onChange={setQuery}
          label="Tìm phòng cưới"
          placeholder="Tên cặp đôi, đường dẫn, email chủ tiệc…"
        />
        <FilterSelect value={tier} onChange={setTier} options={TIER_OPTIONS} label="Lọc theo gói" />
        <FilterSelect value={stage} onChange={setStage} options={STAGE_OPTIONS} label="Lọc theo giai đoạn" />
        <ResultCount shown={shown.length} total={rows.length} unit="phòng" />
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={<HeartHandshake className="h-7 w-7" />}
          title={rows.length === 0 ? 'Chưa có phòng cưới nào' : 'Không có phòng cưới nào khớp bộ lọc'}
        >
          {rows.length > 0 && (
            <button type="button" onClick={clearFilters} className="font-semibold text-rose-700 hover:underline">
              Xoá bộ lọc
            </button>
          )}
        </EmptyState>
      ) : (
        <div className={tableStyles.wrap}>
          <table className={`${tableStyles.table} min-w-[920px]`}>
            <thead>
              <tr>
                <th scope="col" className={`${tableStyles.th} ${tableStyles.stickyTh}`}>Phòng cưới</th>
                <th scope="col" className={tableStyles.th}>Chủ tiệc</th>
                <th scope="col" className={tableStyles.th}>Gói</th>
                <th scope="col" className={tableStyles.th}>Vòng đời</th>
                <SortHeader label="Ngày cưới" sortKey="weddingDate" sort={sort} onSort={(k) => setSort(nextSort(sort, k))} />
                <SortHeader label="Tạo ngày" sortKey="created" sort={sort} onSort={(k) => setSort(nextSort(sort, k))} />
                <th scope="col" className={`${tableStyles.th} text-right`}>
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className={tableStyles.row}>
                  <td className={`${tableStyles.td} ${tableStyles.stickyTd} min-w-[190px] max-w-[260px]`}>
                    <Link
                      href={`/admin/weddings/${encodeURIComponent(r.slug)}`}
                      className="font-semibold text-slate-900 hover:text-rose-700 hover:underline"
                    >
                      {r.couple}
                    </Link>
                    <p className="truncate whitespace-nowrap text-xs text-slate-500">/w/{r.slug}</p>
                  </td>
                  <td className={tableStyles.td}>
                    <p className="max-w-[200px] truncate text-slate-800">{r.ownerName}</p>
                    {r.ownerEmail && <p className="max-w-[200px] truncate text-xs text-slate-500">{r.ownerEmail}</p>}
                  </td>
                  <td className={tableStyles.td}>
                    <TierBadge tier={r.tier} />
                  </td>
                  <td className={`${tableStyles.td} min-w-[250px]`}>
                    <LifecycleTrack view={r.lifecycle} />
                  </td>
                  <td className={`${tableStyles.td} whitespace-nowrap tabular-nums`}>
                    <p className="text-slate-800">{r.weddingDateLabel}</p>
                    <p className="text-xs text-slate-500">{r.weddingDayLabel}</p>
                  </td>
                  <td className={`${tableStyles.td} whitespace-nowrap tabular-nums text-slate-600`}>{r.createdLabel}</td>
                  <td className={`${tableStyles.td} whitespace-nowrap text-right`}>
                    <div className="inline-flex gap-0.5">
                      <a
                        href={`/w/${r.slug}/invite`}
                        target="_blank"
                        rel="noreferrer"
                        title="Xem thiệp mời"
                        aria-label={`Xem thiệp mời của ${r.couple} (mở tab mới)`}
                        className="rounded-md p-2 text-slate-600 transition-colors hover:bg-[#F7EEDF] hover:text-slate-900"
                      >
                        <Mail aria-hidden className="h-4 w-4" />
                      </a>
                      <a
                        href={`/w/${r.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Mở sảnh cưới"
                        aria-label={`Mở sảnh cưới của ${r.couple} (mở tab mới)`}
                        className="rounded-md p-2 text-rose-700 transition-colors hover:bg-rose-50"
                      >
                        <ExternalLink aria-hidden className="h-4 w-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
