'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { INVITATION_TEMPLATES, type InvitationTemplateMeta } from '@dco/shared';
import { CardFace } from './CardFace';
import { SAMPLE_COUPLE } from './sampleInvitation';

const STYLES: Array<{ id: InvitationTemplateMeta['style'] | 'all'; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'truyen-thong', label: 'Truyền thống' },
  { id: 'hien-dai', label: 'Hiện đại' },
  { id: 'lang-man', label: 'Lãng mạn' },
  { id: 'sang-trong', label: 'Sang trọng' },
];

export function TemplateGallery() {
  const [style, setStyle] = useState<(typeof STYLES)[number]['id']>('all');
  const list = INVITATION_TEMPLATES.filter((t) => style === 'all' || t.style === style);
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Lọc theo phong cách">
        {STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={style === s.id}
            onClick={() => setStyle(s.id)}
            className={`min-h-[44px] rounded-full px-5 text-sm font-semibold transition ${style === s.id ? 'bg-rose-900 text-amber-50' : 'bg-white text-slate-700 ring-1 ring-rose-900/15 hover:ring-rose-900/40'}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((t) => (
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
    </div>
  );
}
