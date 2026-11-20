'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { INVITATION_STYLE_LABELS, type InvitationTemplateStyle } from '@dco/shared';
import { CardFace } from './CardFace';
import { SAMPLE_COUPLE } from './sampleInvitation';
import { styleCount, templatesFor, type StyleFilter } from './templateOrder';

const STYLES: Array<{ id: StyleFilter; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  ...(Object.entries(INVITATION_STYLE_LABELS) as Array<[InvitationTemplateStyle, string]>).map(([id, label]) => ({ id, label })),
];

/** Cards per screenful: each one is a full cover with photos, so a hundred at once is too much for a phone */
const PAGE = 24;

export function TemplateGallery() {
  const [style, setStyle] = useState<StyleFilter>('all');
  const [shown, setShown] = useState(PAGE);
  const list = templatesFor(style);
  return (
    <div>
      {/* One swipeable row on phones, wrapped on larger screens */}
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="tablist" aria-label="Lọc theo phong cách">
        {STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={style === s.id}
            onClick={() => {
              setStyle(s.id);
              setShown(PAGE);
            }}
            className={`min-h-[44px] shrink-0 whitespace-nowrap rounded-full px-5 text-sm font-semibold transition ${style === s.id ? 'bg-rose-900 text-amber-50' : 'bg-white text-slate-700 ring-1 ring-rose-900/15 hover:ring-rose-900/40'}`}
          >
            {s.label} <span className="ml-0.5 tabular-nums opacity-60">{styleCount(s.id)}</span>
          </button>
        ))}
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {list.slice(0, shown).map((t) => (
          <li key={t.id}>
            <Link href={`/thiep-cuoi/${t.id}`} className="group block focus-visible:outline-none">
              <div className="overflow-hidden rounded-[6px] shadow-[0_14px_30px_-14px_rgba(60,20,20,0.45)] ring-1 ring-black/5 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_22px_40px_-16px_rgba(60,20,20,0.55)] group-focus-visible:ring-4 group-focus-visible:ring-rose-400">
                <CardFace templateId={t.id} groom={SAMPLE_COUPLE.groomName} bride={SAMPLE_COUPLE.brideName} />
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900">{t.nameVi}</h3>
              <p className="mt-0.5 text-sm leading-snug text-slate-600">{t.descriptionVi}</p>
              <span className="mt-1.5 inline-block text-sm font-semibold text-rose-800 underline-offset-4 group-hover:underline">Xem thiệp mẫu</span>
            </Link>
          </li>
        ))}
      </ul>
      {shown < list.length && (
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE)}
            className="inline-flex min-h-[52px] items-center rounded-full px-7 text-base font-bold text-rose-900 ring-1 ring-rose-900/25 transition hover:bg-rose-50 hover:ring-rose-900/60"
          >
            Xem thêm mẫu <span className="ml-1.5 tabular-nums opacity-60">({list.length - shown})</span>
          </button>
        </div>
      )}
    </div>
  );
}
