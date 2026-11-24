'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  INVITATION_3D_CATEGORY_LABELS,
  INVITATION_3D_TEMPLATES,
  type Invitation3DCategory,
} from '@dco/shared';
import { normalizeSearch } from '@/lib/adminFormat';
import { OpalFilterTabs, ScrySearchInput } from '@/components/motion/ShowcaseMotion';
import { CardFace } from '../CardFace';
import { SAMPLE_COUPLE } from '../sampleInvitation';

type CategoryFilter = Invitation3DCategory | 'all';

const CATEGORIES: Array<{ id: CategoryFilter; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  ...(Object.entries(INVITATION_3D_CATEGORY_LABELS) as Array<[Invitation3DCategory, string]>).map(([id, label]) => ({
    id,
    label,
  })),
];

const PAGE = 25;

function categoryCount(cat: CategoryFilter): number {
  if (cat === 'all') return INVITATION_3D_TEMPLATES.length;
  return INVITATION_3D_TEMPLATES.filter((t) => t.category3d === cat).length;
}

export function Template3DGallery() {
  const [cat, setCat] = useState<CategoryFilter>('all');
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(PAGE);

  const list = useMemo(() => {
    const base = cat === 'all' ? INVITATION_3D_TEMPLATES : INVITATION_3D_TEMPLATES.filter((t) => t.category3d === cat);
    const q = normalizeSearch(query);
    if (!q) return base;
    return base.filter((t) =>
      normalizeSearch(`${t.nameVi} ${t.descriptionVi} ${t.cameraTagVi ?? ''} ${t.id}`).includes(q),
    );
  }, [cat, query]);

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <OpalFilterTabs
          ariaLabel="Lọc theo chủ đề không gian 3D"
          value={cat}
          options={CATEGORIES.map((c) => ({ id: c.id, label: c.label, count: categoryCount(c.id) }))}
          onChange={(next) => {
            setCat(next as CategoryFilter);
            setShown(PAGE);
          }}
        />
        <ScrySearchInput
          value={query}
          onChange={(v) => {
            setQuery(v);
            setShown(PAGE);
          }}
          placeholder="Tìm bối cảnh 3D (Hội An, Biển, Cực Quang, Rạp phim…)"
          ariaLabel="Tìm mẫu thiệp cưới 3D"
        />
      </div>

      {list.length === 0 ? (
        <p className="mt-12 text-center text-sm text-slate-600">
          Chưa có không gian 3D nào khớp “{query}”.{' '}
          <button type="button" onClick={() => setQuery('')} className="font-semibold text-rose-700 hover:underline">
            Xem tất cả 100 mẫu 3D
          </button>
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
          {list.slice(0, shown).map((t) => (
            <li key={t.id} className="flex flex-col">
              <Link href={`/thiep-cuoi/${t.id}?khach=Qu%E1%BB%91c+B%E1%BA%A3o`} className="group block focus-visible:outline-none">
                <div className="overflow-hidden rounded-[10px] shadow-[0_14px_30px_-14px_rgba(30,20,50,0.45)] ring-1 ring-amber-300/80 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_22px_40px_-16px_rgba(30,20,50,0.6)]">
                  <CardFace templateId={t.id} groom={SAMPLE_COUPLE.groomName} bride={SAMPLE_COUPLE.brideName} />
                </div>
                <h3 className="mt-3 text-base font-bold text-slate-900">{t.nameVi}</h3>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-600">{t.descriptionVi}</p>
              </Link>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <Link
                  href={`/thiep-cuoi/${t.id}?khach=Qu%E1%BB%91c+B%E1%BA%A3o`}
                  className="text-xs font-bold text-rose-700 hover:underline"
                >
                  Xem thử 3D
                </Link>
                <span className="text-slate-300">·</span>
                <Link
                  href={`/thiep-cuoi-3d/tao?mau=${t.id}`}
                  className="text-xs font-bold text-amber-800 hover:underline"
                >
                  Dùng mẫu này →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {shown < list.length && (
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE)}
            className="inline-flex min-h-[52px] items-center rounded-full px-7 text-base font-bold text-rose-900 ring-1 ring-rose-900/25 transition hover:bg-rose-50 hover:ring-rose-900/60"
          >
            Xem thêm không gian 3D <span className="ml-1.5 tabular-nums opacity-60">({list.length - shown})</span>
          </button>
        </div>
      )}
    </div>
  );
}
