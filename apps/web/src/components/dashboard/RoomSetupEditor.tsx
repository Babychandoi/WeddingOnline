'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, ExternalLink, ImagePlus, Loader2, Save } from 'lucide-react';
import type { PhotoAssetRecord, PublicWeddingDTO } from '@dco/database';
import {
  BRIDE_PEOPLE,
  GROOM_PEOPLE,
  couplePersonId,
  type PersonInfo,
  type PlacedPrefab,
  type SceneLayoutDocument,
} from '@dco/shared';

/** 'none' in a spot = the couple chose to show no photo there (matches VenueScene) */
const NO_PHOTO = 'none';

type SpotKind = 'stage' | 'gate' | 'easel';

interface Spot {
  prefab: PlacedPrefab;
  kind: SpotKind;
  title: string;
  hint: string;
  /** What an unset spot shows */
  autoLabel: string;
  allowCaption: boolean;
  allowNone: boolean;
}

function spotsOf(layout: SceneLayoutDocument): Spot[] {
  const out: Spot[] = [];
  let easel = 0;
  for (const p of layout.prefabs) {
    if (p.prefabType === 'STAGE_MAIN')
      out.push({ prefab: p, kind: 'stage', title: 'Màn hình sân khấu', hint: 'Ảnh lớn nhất sảnh, khách nhìn thấy suốt buổi lễ.', autoLabel: 'Tự động: ảnh đầu tiên trong album', allowCaption: false, allowNone: true });
    if (p.prefabType === 'GATE_RECEPTION')
      out.push({ prefab: p, kind: 'gate', title: 'Bảng chào mừng ở cổng', hint: 'Giá ảnh lớn cạnh sổ lưu bút, khách thấy ngay khi bước vào.', autoLabel: 'Chưa đặt bảng', allowCaption: true, allowNone: false });
  }
  for (const p of layout.prefabs) {
    if (p.prefabType !== 'PHOTO_FRAME_STAND') continue;
    easel += 1;
    out.push({ prefab: p, kind: 'easel', title: `Giá ảnh ${easel}`, hint: 'Giá ảnh dọc lối đi, khách bấm vào để xem ảnh lớn.', autoLabel: `Tự động: ảnh thứ ${easel} trong album`, allowCaption: true, allowNone: false });
  }
  return out;
}

function PersonPicker({ title, people, value, onChange, drawnLabel, note }: { title: string; people: PersonInfo[]; value: string; onChange: (id: string) => void; drawnLabel: string; note: string }) {
  return (
    <div>
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      <p className="mt-0.5 text-xs text-slate-500">{note}</p>
      <div role="radiogroup" aria-label={title} className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
        {people.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={value === p.id}
            onClick={() => onChange(p.id)}
            className={`group overflow-hidden rounded-xl border-2 bg-white text-left transition ${value === p.id ? 'border-rose-600 ring-2 ring-rose-200' : 'border-slate-200 hover:border-rose-300'}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/assets/people/${p.id}.webp`} alt="" loading="lazy" className="aspect-square w-full bg-[#f6ece6] object-cover object-top" />
            <span className="block truncate px-1.5 py-1 text-[11px] font-semibold text-slate-700">{p.label}</span>
          </button>
        ))}
        <button
          type="button"
          role="radio"
          aria-checked={value === ''}
          onClick={() => onChange('')}
          className={`flex flex-col items-center justify-center rounded-xl border-2 bg-white px-2 text-center text-[11px] font-semibold text-slate-600 transition ${value === '' ? 'border-rose-600 ring-2 ring-rose-200' : 'border-dashed border-slate-300 hover:border-rose-300'}`}
        >
          {drawnLabel}
        </button>
      </div>
    </div>
  );
}

export function RoomSetupEditor({
  wedding,
  layout: initialLayout,
  photos,
  onUploadPhoto,
  onSaved,
}: {
  wedding: PublicWeddingDTO;
  layout: SceneLayoutDocument;
  photos: PhotoAssetRecord[];
  onUploadPhoto: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaved: (layout: SceneLayoutDocument, wedding: PublicWeddingDTO) => void;
}) {
  const [layout, setLayout] = useState(initialLayout);
  const [bride, setBride] = useState(() => couplePersonId('BRIDE', wedding.ceremonyConfig?.bridePersonId));
  const [groom, setGroom] = useState(() => couplePersonId('GROOM', wedding.ceremonyConfig?.groomPersonId));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const gallery = useMemo(() => photos.filter((p) => p.type === 'PRE_WEDDING_GALLERY'), [photos]);
  const spots = useMemo(() => spotsOf(layout), [layout]);

  const updateMeta = (instanceId: string, patch: { mediaSlotId?: string | undefined; customLabel?: string | undefined }) => {
    setLayout((prev) => ({
      ...prev,
      prefabs: prev.prefabs.map((p) => (p.instanceId === instanceId ? { ...p, meta: { ...p.meta, ...patch } } : p)),
    }));
    setDirty(true);
    setMessage(null);
  };

  /** The photo a spot shows right now (same rule as the hall) */
  const shownPhoto = (spot: Spot, order: number): PhotoAssetRecord | null => {
    const slot = spot.prefab.meta?.mediaSlotId;
    if (slot === NO_PHOTO) return null;
    if (slot) return photos.find((p) => p.id === slot) ?? null;
    if (spot.kind === 'stage') return gallery[0] ?? null;
    if (spot.kind === 'easel') return gallery[order] ?? null;
    return null;
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/weddings/${encodeURIComponent(wedding.slug)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layoutData: layout,
          ceremonyConfig: { ...(wedding.ceremonyConfig ?? {}), bridePersonId: bride, groomPersonId: groom },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data.errors && data.errors[0]) || data.message || data.error || 'Lưu thất bại');
      onSaved(data.scene?.layoutData ?? layout, data.wedding);
      setDirty(false);
      setMessage({ ok: true, text: 'Đã lưu. Khách vào sảnh sẽ thấy ngay; ai đang ở trong sảnh thấy khi tải lại trang.' });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Lưu thất bại' });
    } finally {
      setSaving(false);
    }
  };

  let easelOrder = -1;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-3xl border border-amber-200 bg-white p-5 shadow-sm">
        <div className="max-w-2xl">
          <h3 className="text-base font-bold text-slate-900">Setup phòng cưới</h3>
          <p className="mt-1 text-sm text-slate-600">
            Chọn nhân vật cho cô dâu chú rể và đặt ảnh cưới vào từng vị trí trong sảnh 3D: màn hình sân khấu, bảng chào mừng ở cổng và các giá ảnh dọc lối đi.
          </p>
        </div>
        <Link href={`/w/${wedding.slug}`} target="_blank" className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
          <ExternalLink className="h-3.5 w-3.5" /> Xem sảnh 3D
        </Link>
      </div>

      {/* Couple */}
      <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Cô dâu &amp; chú rể trong sảnh</h3>
        <PersonPicker
          title={`Cô dâu ${wedding.brideName}`}
          people={BRIDE_PEOPLE}
          value={bride}
          onChange={(id) => {
            setBride(id);
            setDirty(true);
          }}
          drawnLabel="Hình vẽ (váy cưới)"
          note="Người thật mặc thêm váy cưới trắng, voan và vương miện; có dáng đứng, vẫy tay như thật."
        />
        <PersonPicker
          title={`Chú rể ${wedding.groomName}`}
          people={GROOM_PEOPLE}
          value={groom}
          onChange={(id) => {
            setGroom(id);
            setDirty(true);
          }}
          drawnLabel="Hình vẽ (vest chú rể)"
          note="Khi chủ phòng hoặc cô dâu chú rể nhập vai, nhân vật trong sảnh là người đã chọn ở đây."
        />
      </section>

      {/* Photo spots */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Ảnh cưới trong sảnh</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {gallery.length} ảnh trong album. Muốn thêm giá ảnh, đặt thêm “Giá ảnh” ở tab Thiết kế sảnh 3D.
            </p>
          </div>
          <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 text-xs font-bold text-white hover:bg-rose-500">
            <ImagePlus className="h-4 w-4" /> Tải ảnh cưới
            <input type="file" accept="image/*" multiple onChange={onUploadPhoto} className="hidden" />
          </label>
        </div>

        {gallery.length === 0 && (
          <p className="mt-4 rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            Album đang trống. Tải vài ảnh cưới lên trước, rồi chọn ảnh cho từng vị trí bên dưới.
          </p>
        )}

        <ul className="mt-5 space-y-4">
          {spots.map((spot) => {
            if (spot.kind === 'easel') easelOrder += 1;
            const order = spot.kind === 'easel' ? easelOrder : 0;
            const slot = spot.prefab.meta?.mediaSlotId;
            const current = shownPhoto(spot, order);
            const chip = (active: boolean) =>
              `min-h-[36px] shrink-0 rounded-xl border-2 px-3 text-[11px] font-bold transition ${active ? 'border-rose-600 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-600 hover:border-rose-300'}`;
            return (
              <li key={spot.prefab.instanceId} className="grid gap-4 rounded-2xl border border-slate-200 p-4 sm:grid-cols-[160px_1fr]">
                <div className={`relative overflow-hidden rounded-xl bg-slate-100 ${spot.kind === 'stage' ? 'aspect-[2/1]' : 'aspect-[4/5]'}`}>
                  {current ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={current.publicUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center px-2 text-center text-[11px] text-slate-500">{slot === NO_PHOTO ? 'Màn hình tắt' : 'Chưa có ảnh'}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900">{spot.title}</h4>
                  <p className="text-xs text-slate-500">{spot.hint}</p>
                  {spot.allowCaption && (
                    <label className="mt-2 block text-xs font-semibold text-slate-700">
                      Chữ hiển thị
                      <input
                        type="text"
                        maxLength={40}
                        value={spot.prefab.meta?.customLabel ?? ''}
                        placeholder={spot.kind === 'gate' ? 'Chào mừng đến lễ cưới' : 'Ví dụ: Ngày đầu gặp nhau'}
                        onChange={(e) => updateMeta(spot.prefab.instanceId, { customLabel: e.target.value || undefined })}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-rose-500"
                      />
                    </label>
                  )}
                  <div role="radiogroup" aria-label={`Ảnh cho ${spot.title}`} className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    <button type="button" role="radio" aria-checked={!slot} onClick={() => updateMeta(spot.prefab.instanceId, { mediaSlotId: undefined })} className={chip(!slot)}>
                      {spot.kind === 'gate' ? 'Không đặt' : 'Tự động'}
                    </button>
                    {spot.allowNone && (
                      <button type="button" role="radio" aria-checked={slot === NO_PHOTO} onClick={() => updateMeta(spot.prefab.instanceId, { mediaSlotId: NO_PHOTO })} className={chip(slot === NO_PHOTO)}>
                        Tắt màn hình
                      </button>
                    )}
                    {gallery.map((p, i) => (
                      <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={slot === p.id}
                        aria-label={`Ảnh ${i + 1}${p.caption ? `: ${p.caption}` : ''}`}
                        onClick={() => updateMeta(spot.prefab.instanceId, { mediaSlotId: p.id })}
                        className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${slot === p.id ? 'border-rose-600 ring-2 ring-rose-200' : 'border-transparent hover:border-rose-300'}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.publicUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                        {slot === p.id && (
                          <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-rose-600 text-white">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {!slot && <p className="mt-1 text-[11px] text-slate-500">{spot.autoLabel}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <p className={`text-xs ${message ? (message.ok ? 'text-emerald-700' : 'text-rose-700') : 'text-slate-500'}`} role="status">
          {message?.text ?? (dirty ? 'Có thay đổi chưa lưu.' : 'Mọi thay đổi đã được lưu.')}
        </p>
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-rose-500 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu setup
        </button>
      </div>
    </div>
  );
}
