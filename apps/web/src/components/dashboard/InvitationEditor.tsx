'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, ExternalLink, Eye, ImagePlus, LayoutList, Loader2, MapPin, Music2, MousePointerClick, Palette, Plus, Save, Star, Trash2, Users, X } from 'lucide-react';
import {
  INVITATION_EVENT_LABELS,
  INVITATION_LIMITS,
  INVITATION_STYLE_LABELS,
  INVITATION_TEMPLATES,
  invitationItemId,
  type InvitationConfig,
  type InvitationEventKind,
  type InvitationSectionKey,
  type InvitationTemplateStyle,
} from '@dco/shared';
import type { InvitationRsvpRecord, PhotoAssetRecord, PublicWeddingDTO } from '@dco/database';
import { CardFace } from '@/components/invitation/CardFace';
import { styleCount, templatesFor } from '@/components/invitation/templateOrder';
import { InvitationView, type EditPart } from '@/components/invitation/InvitationView';
import { SAMPLE_WISHES } from '@/components/invitation/sampleInvitation';
import { deleteWeddingPhoto, uploadWeddingPhoto } from '@/lib/uploadWeddingPhoto';

const input =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 sm:text-sm';
const label = 'mb-1 block text-xs font-bold text-slate-600';

const SECTION_LABELS: Record<InvitationSectionKey, string> = {
  family: 'Gia đình & lời mời',
  countdown: 'Đếm ngược',
  events: 'Lịch trình ngày cưới',
  story: 'Chuyện tình yêu',
  album: 'Album ảnh',
  hall: 'Lối vào sảnh cưới 3D',
  rsvp: 'Xác nhận tham dự',
  wishes: 'Sổ lời chúc',
  gift: 'Hộp mừng cưới',
};

const SIDE_LABEL: Record<string, string> = { GROOM_SIDE: 'Nhà trai', BRIDE_SIDE: 'Nhà gái', FRIEND: 'Bạn bè', COLLEAGUE: 'Đồng nghiệp' };

/** The editor's field groups; the list view shows them all, the visual view opens the ones a tapped part needs */
type GroupKey = 'anh' | 'ten' | 'loi' | 'le' | 'gia-dinh' | 'mau' | 'chuyen' | 'khac';

const GROUP_ORDER: GroupKey[] = ['anh', 'ten', 'loi', 'le', 'gia-dinh', 'mau', 'chuyen', 'khac'];
const NAV: Array<[GroupKey | 'khach', string]> = [
  ['anh', 'Ảnh cưới'],
  ['ten', 'Tên'],
  ['loi', 'Lời mời'],
  ['le', 'Các lễ & địa điểm'],
  ['gia-dinh', 'Gia đình'],
  ['mau', 'Mẫu thiệp'],
  ['chuyen', 'Chuyện tình'],
  ['khac', 'Nhạc & mục'],
  ['khach', 'Khách xác nhận'],
];

/** What a tap on each part of the invitation opens */
const PART_GROUPS: Record<EditPart, { title: string; groups: GroupKey[] }> = {
  cover: { title: 'Bìa thiệp', groups: ['ten', 'anh'] },
  family: { title: 'Gia đình & lời mời', groups: ['gia-dinh', 'loi'] },
  quote: { title: 'Câu thơ & ảnh', groups: ['loi', 'anh'] },
  events: { title: 'Các lễ & địa điểm', groups: ['le'] },
  countdown: { title: 'Ngày giờ các lễ', groups: ['le'] },
  story: { title: 'Chuyện tình yêu', groups: ['chuyen'] },
  album: { title: 'Ảnh cưới', groups: ['anh'] },
  replies: { title: 'Nhạc & các mục', groups: ['khac'] },
  closing: { title: 'Lời cảm ơn', groups: ['loi'] },
};

/** ISO instant ⇄ the value of <input type="datetime-local">, read as Vietnam time */
function toLocalInput(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  return new Date(t + 7 * 3600 * 1000).toISOString().slice(0, 16);
}
function fromLocalInput(v: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v);
  if (!m) return new Date().toISOString();
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 7, +m[5])).toISOString();
}

function Group({ id, title, children, hint, bare = false }: { id: string; title: string; children: React.ReactNode; hint?: React.ReactNode; bare?: boolean }) {
  return (
    <section id={`inv-${id}`} className={bare ? 'scroll-mt-20' : 'scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5'}>
      <h3 className="text-base font-black text-slate-900">{title}</h3>
      {hint && <div className="mt-1 text-xs leading-relaxed text-slate-500">{hint}</div>}
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex gap-2">
      <input readOnly value={value} className={`${input} min-w-0 font-mono !text-xs`} onFocus={(e) => e.currentTarget.select()} />
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 text-xs font-bold text-amber-200 hover:bg-slate-800"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? 'Đã chép' : 'Chép'}
      </button>
    </div>
  );
}

function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return desktop;
}

type SaveState = 'saved' | 'dirty' | 'saving' | 'error';
type Mode = 'visual' | 'list';

export function InvitationEditor({
  wedding,
  photos,
  albumLimit,
  onPhotosChange,
}: {
  wedding: PublicWeddingDTO;
  photos: PhotoAssetRecord[];
  /** How many album photos this wedding may keep */
  albumLimit: number;
  onPhotosChange: (next: PhotoAssetRecord[]) => void;
}) {
  const [config, setConfig] = useState<InvitationConfig | null>(null);
  const [rsvps, setRsvps] = useState<InvitationRsvpRecord[]>([]);
  const [state, setState] = useState<SaveState>('saved');
  const [loadError, setLoadError] = useState('');
  const [guestForLink, setGuestForLink] = useState('');
  const [origin, setOrigin] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [pickStyle, setPickStyle] = useState<InvitationTemplateStyle | 'all'>('all');
  const [pickShown, setPickShown] = useState(18);
  const [uploading, setUploading] = useState(0);
  const [photoError, setPhotoError] = useState('');
  const [mode, setModeState] = useState<Mode>('visual');
  const [active, setActive] = useState<{ title: string; groups: GroupKey[] } | null>(null);
  const isDesktop = useIsDesktop();
  const latest = useRef<InvitationConfig | null>(null);
  /** The invitation part being edited in the visual view (to keep the changing text in sight) */
  const activeEl = useRef<HTMLElement | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    try {
      if (window.localStorage.getItem('dco_inv_editor_mode') === 'list') setModeState('list');
    } catch {
      /* keep the default */
    }
    const failed = Number(new URLSearchParams(window.location.search).get('anh_loi'));
    if (failed > 0) setPhotoError(`${failed} ảnh chưa tải lên được, bạn thêm lại ở phần Ảnh cưới nhé.`);
    fetch(`/api/weddings/${wedding.slug}/invitation`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 403 ? 'Chỉ cô dâu, chú rể hoặc chủ tiệc mới sửa được thiệp.' : 'Không tải được thiệp.');
        return r.json();
      })
      .then((d: { config: InvitationConfig; rsvps: InvitationRsvpRecord[] }) => {
        setConfig(d.config);
        latest.current = d.config;
        setRsvps(d.rsvps);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, [wedding.slug]);

  const setMode = (m: Mode) => {
    setModeState(m);
    setActive(null);
    try {
      window.localStorage.setItem('dco_inv_editor_mode', m);
    } catch {
      /* not remembered */
    }
  };

  const gallery = useMemo(() => photos.filter((p) => p.type === 'PRE_WEDDING_GALLERY').sort((a, b) => a.displayOrder - b.displayOrder), [photos]);

  /** Saves what is on screen. The response is not written back while typing: the local text stays as typed */
  const persist = useCallback(async () => {
    const body = latest.current;
    if (!body) return;
    setState('saving');
    const res = await fetch(`/api/weddings/${wedding.slug}/invitation`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: body }),
    }).catch(() => null);
    if (latest.current !== body) return; // edited again meanwhile: the next save carries it
    setState(res?.ok ? 'saved' : 'error');
  }, [wedding.slug]);

  // Autosave a moment after the last change, and warn before leaving with unsaved edits
  useEffect(() => {
    if (state !== 'dirty') return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void persist(), 1200);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [state, config, persist]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (state === 'dirty' || state === 'saving') e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [state]);

  if (loadError) return <p className="rounded-2xl bg-rose-50 p-5 text-sm font-semibold text-rose-800">{loadError}</p>;
  if (!config) {
    return (
      <p className="flex items-center gap-2 p-6 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải thiệp…
      </p>
    );
  }

  const patch = (p: Partial<InvitationConfig>) => {
    const next = { ...config, ...p };
    latest.current = next;
    setConfig(next);
    setState('dirty');
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setPhotoError('');
    const room = Math.max(0, albumLimit - gallery.length);
    const list = Array.from(files).slice(0, room);
    if (files.length > room) setPhotoError(`Album giữ tối đa ${albumLimit} ảnh, mình chỉ thêm ${room} ảnh đầu.`);
    let current = photos;
    setUploading(list.length);
    for (const file of list) {
      try {
        const photo = await uploadWeddingPhoto(wedding.slug, file);
        current = [...current, photo];
        onPhotosChange(current);
      } catch (e) {
        setPhotoError(e instanceof Error ? e.message : 'Chưa tải được ảnh.');
      }
      setUploading((n) => n - 1);
    }
  };

  const removePhoto = async (p: PhotoAssetRecord) => {
    if (!window.confirm('Xoá ảnh này khỏi thiệp và album?')) return;
    try {
      await deleteWeddingPhoto(wedding.slug, p.id);
      onPhotosChange(photos.filter((x) => x.id !== p.id));
      // The server already clears a removed cover; keep the screen in step without an extra save
      if (config.coverPhotoUrl === p.publicUrl) {
        const next = { ...config, coverPhotoUrl: '' };
        latest.current = next;
        setConfig(next);
      }
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : 'Chưa xoá được ảnh.');
    }
  };

  const inviteUrl = `${origin}/thiep/${wedding.slug}`;
  const personalUrl = guestForLink.trim() ? `${inviteUrl}?khach=${encodeURIComponent(guestForLink.trim())}` : '';
  const attending = rsvps.filter((r) => r.attending);
  const headcount = attending.reduce((n, r) => n + r.headcount, 0);
  const cover = config.coverPhotoUrl || gallery[0]?.publicUrl || '';
  const mainDate = config.events.find((e) => e.kind === 'THANH_HON' || e.kind === 'TIEC_CUOI')?.startsAt ?? wedding.weddingDate;

  const status =
    state === 'saving' ? 'Đang lưu…' : state === 'dirty' ? 'Sắp tự lưu…' : state === 'error' ? 'Chưa lưu được, bấm Lưu' : 'Đã lưu tự động';
  const statusClass = state === 'error' ? 'text-rose-700' : state === 'saved' ? 'text-emerald-700' : 'text-slate-500';

  const fileInput = (
    <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { void addPhotos(e.target.files); e.target.value = ''; }} />
  );

  /* ───────────── Field groups ───────────── */

  const renderGroup = (key: GroupKey, bare = false): React.ReactNode => {
    switch (key) {
      case 'anh':
        return (
          <Group
            key={key}
            id="anh"
            bare={bare}
            title={`Ảnh cưới của bạn (${gallery.length}/${albumLimit})`}
            hint="Ảnh bìa, khung ảnh trên bìa và album của thiệp đều lấy từ đây. Chưa có ảnh thì thiệp để trống chỗ ảnh (ảnh trên các thẻ mẫu chỉ là ảnh minh hoạ)."
          >
            {gallery.length === 0 ? (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50/60 px-4 py-8 text-center hover:bg-rose-50">
                <ImagePlus className="h-8 w-8 text-rose-600" />
                <span className="text-sm font-black text-rose-800">Thêm ảnh cưới</span>
                <span className="text-xs text-slate-600">Chọn nhiều ảnh một lúc. Ảnh lớn tự được thu nhỏ cho nhẹ.</span>
                {fileInput}
              </label>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                  {gallery.map((p) => {
                    const isCover = p.publicUrl === cover;
                    return (
                      <div key={p.id} className={`relative overflow-hidden rounded-xl bg-slate-100 ${isCover ? 'ring-[3px] ring-rose-600' : 'ring-1 ring-slate-200'}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.publicUrl} alt={p.caption ?? 'Ảnh cưới'} loading="lazy" className="aspect-[3/4] w-full object-cover" />
                        {isCover && <span className="absolute left-1.5 top-1.5 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white">Ảnh bìa</span>}
                        <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 pt-6">
                          <button type="button" onClick={() => patch({ coverPhotoUrl: p.publicUrl })} disabled={isCover} aria-label="Đặt làm ảnh bìa" title="Đặt làm ảnh bìa" className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-rose-700 disabled:opacity-40">
                            <Star className="h-4 w-4" fill={isCover ? 'currentColor' : 'none'} />
                          </button>
                          <button type="button" onClick={() => void removePhoto(p)} aria-label="Xoá ảnh" title="Xoá ảnh" className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-700 hover:text-rose-700">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {gallery.length < albumLimit && (
                    <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-center text-xs font-bold text-slate-600 hover:border-rose-400 hover:text-rose-700">
                      <ImagePlus className="h-6 w-6" /> Thêm ảnh
                      {fileInput}
                    </label>
                  )}
                </div>
                <p className="text-xs text-slate-500">Bấm ngôi sao để chọn ảnh bìa. Không chọn thì dùng ảnh đầu tiên.</p>
              </>
            )}
            {uploading > 0 && (
              <p className="flex items-center gap-2 text-xs font-semibold text-slate-700" role="status">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải {uploading} ảnh…
              </p>
            )}
            {photoError && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800" role="alert">{photoError}</p>}
          </Group>
        );

      case 'ten':
        return (
          <Group key={key} id="ten" bare={bare} title="Tên & tiêu đề">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="inv-groom">Tên chú rể trên thiệp</label>
                <input id="inv-groom" className={input} value={config.groomFullName} maxLength={INVITATION_LIMITS.name} onChange={(e) => patch({ groomFullName: e.target.value })} />
              </div>
              <div>
                <label className={label} htmlFor="inv-bride">Tên cô dâu trên thiệp</label>
                <input id="inv-bride" className={input} value={config.brideFullName} maxLength={INVITATION_LIMITS.name} onChange={(e) => patch({ brideFullName: e.target.value })} />
              </div>
            </div>
            <div>
              <label className={label} htmlFor="inv-headline">Dòng tiêu đề</label>
              <input id="inv-headline" className={input} value={config.headline} maxLength={INVITATION_LIMITS.headline} onChange={(e) => patch({ headline: e.target.value })} />
            </div>
            <p className="text-xs text-slate-500">Ngày trên bìa lấy theo giờ của Lễ Thành Hôn hoặc Tiệc Cưới ở phần Các lễ & địa điểm.</p>
          </Group>
        );

      case 'loi':
        return (
          <Group key={key} id="loi" bare={bare} title="Lời mời, câu thơ & lời cảm ơn">
            <div>
              <label className={label} htmlFor="inv-message">Lời mời</label>
              <textarea id="inv-message" className={`${input} min-h-[90px]`} value={config.message} maxLength={INVITATION_LIMITS.message} onChange={(e) => patch({ message: e.target.value })} />
            </div>
            <div>
              <label className={label} htmlFor="inv-quote">Câu thơ / trích dẫn</label>
              <input id="inv-quote" className={input} value={config.quote} maxLength={INVITATION_LIMITS.quote} onChange={(e) => patch({ quote: e.target.value })} />
            </div>
            <div>
              <label className={label} htmlFor="inv-thanks">Lời cảm ơn cuối thiệp</label>
              <textarea id="inv-thanks" className={`${input} min-h-[70px]`} value={config.thankYou} maxLength={INVITATION_LIMITS.thankYou} onChange={(e) => patch({ thankYou: e.target.value })} />
            </div>
          </Group>
        );

      case 'le':
        return (
          <Group
            key={key}
            id="le"
            bare={bare}
            title="Các lễ & địa điểm"
            hint="Mỗi lễ có giờ và địa điểm riêng, ví dụ: Lễ Vu Quy tại nhà gái ở Đà Nẵng, Lễ Thành Hôn tại nhà trai ở Huế, Tiệc cưới ở nhà hàng. Giờ tính theo giờ Việt Nam; bỏ trống link bản đồ thì thiệp tự tìm theo địa chỉ."
          >
            {config.events.map((ev, i) => {
              const setField = (field: keyof typeof ev, value: string) => {
                const events = [...config.events];
                events[i] = { ...ev, [field]: value };
                patch({ events });
              };
              return (
                <div key={ev.id} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-sm font-black text-rose-800">
                      <MapPin className="h-4 w-4" /> Lễ {i + 1}: {ev.title || INVITATION_EVENT_LABELS[ev.kind]}
                    </p>
                    <button type="button" aria-label={`Xoá lễ ${i + 1}`} onClick={() => patch({ events: config.events.filter((_, j) => j !== i) })} className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-rose-100 hover:text-rose-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={label} htmlFor={`ev-kind-${ev.id}`}>Loại lễ</label>
                      <select
                        id={`ev-kind-${ev.id}`}
                        className={input}
                        value={ev.kind}
                        onChange={(e) => {
                          const kind = e.target.value as InvitationEventKind;
                          const events = [...config.events];
                          events[i] = { ...ev, kind, title: ev.title === INVITATION_EVENT_LABELS[ev.kind] ? INVITATION_EVENT_LABELS[kind] : ev.title };
                          patch({ events });
                        }}
                      >
                        {Object.entries(INVITATION_EVENT_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={label} htmlFor={`ev-time-${ev.id}`}>Ngày giờ</label>
                      <input id={`ev-time-${ev.id}`} type="datetime-local" className={input} value={toLocalInput(ev.startsAt)} onChange={(e) => setField('startsAt', fromLocalInput(e.target.value))} />
                    </div>
                  </div>
                  {(
                    [
                      ['title', 'Tên lễ hiển thị trên thiệp', '', INVITATION_LIMITS.eventTitle],
                      ['venueName', 'Địa điểm', 'Ví dụ: Tư gia nhà gái, Nhà hàng Hoa Sen', INVITATION_LIMITS.venueName],
                      ['address', 'Địa chỉ', 'Số nhà, đường, phường, tỉnh/thành', INVITATION_LIMITS.address],
                      ['mapUrl', 'Link Google Maps (không bắt buộc)', 'https://maps.app.goo.gl/…', INVITATION_LIMITS.url],
                      ['note', 'Ghi chú (không bắt buộc)', 'Ví dụ: đón khách từ 17:30', INVITATION_LIMITS.note],
                    ] as const
                  ).map(([field, text, placeholder, max]) => (
                    <div key={field}>
                      <label className={label} htmlFor={`ev-${field}-${ev.id}`}>{text}</label>
                      <input id={`ev-${field}-${ev.id}`} placeholder={placeholder} className={input} value={ev[field]} maxLength={max} onChange={(e) => setField(field, e.target.value)} />
                    </div>
                  ))}
                </div>
              );
            })}
            {config.events.length < INVITATION_LIMITS.events && (
              <button
                type="button"
                onClick={() =>
                  patch({
                    events: [
                      ...config.events,
                      { id: invitationItemId('ev'), kind: 'TIEC_CUOI', title: INVITATION_EVENT_LABELS.TIEC_CUOI, startsAt: config.events.at(-1)?.startsAt ?? wedding.weddingDate, venueName: '', address: '', mapUrl: '', note: '' },
                    ],
                  })
                }
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 text-sm font-bold text-slate-700 hover:border-rose-400 hover:text-rose-700"
              >
                <Plus className="h-4 w-4" /> Thêm lễ ở địa điểm khác
              </button>
            )}
            <div>
              <label className={label} htmlFor="inv-dress">Trang phục gợi ý (không bắt buộc)</label>
              <input id="inv-dress" className={input} value={config.dressCode} maxLength={INVITATION_LIMITS.dressCode} onChange={(e) => patch({ dressCode: e.target.value })} />
            </div>
          </Group>
        );

      case 'gia-dinh':
        return (
          <Group key={key} id="gia-dinh" bare={bare} title="Hai bên gia đình" hint="Để trống nếu không muốn in tên bố mẹ.">
            {(['groomFamily', 'brideFamily'] as const).map((side) => (
              <div key={side} className="grid gap-3 sm:grid-cols-3">
                <p className="text-xs font-black uppercase tracking-wide text-rose-700 sm:col-span-3">{side === 'groomFamily' ? 'Nhà trai' : 'Nhà gái'}</p>
                {(['father', 'mother', 'address'] as const).map((field) => (
                  <div key={field}>
                    <label className={label} htmlFor={`${side}-${field}`}>{field === 'father' ? 'Ông' : field === 'mother' ? 'Bà' : 'Địa chỉ'}</label>
                    <input
                      id={`${side}-${field}`}
                      className={input}
                      value={config[side][field]}
                      maxLength={INVITATION_LIMITS.familyField}
                      onChange={(e) => patch({ [side]: { ...config[side], [field]: e.target.value } } as Partial<InvitationConfig>)}
                    />
                  </div>
                ))}
              </div>
            ))}
          </Group>
        );

      case 'mau':
        return (
          <Group
            key={key}
            id="mau"
            bare={bare}
            title="Mẫu thiệp"
            hint={gallery.length ? 'Đổi mẫu bất cứ lúc nào, nội dung giữ nguyên.' : 'Đổi mẫu bất cứ lúc nào, nội dung giữ nguyên. Ảnh trên thẻ là ảnh minh hoạ; thiệp của bạn dùng ảnh bạn tải lên ở phần Ảnh cưới.'}
          >
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Lọc mẫu theo phong cách">
              {([['all', 'Tất cả'], ...Object.entries(INVITATION_STYLE_LABELS)] as Array<[InvitationTemplateStyle | 'all', string]>).map(([id, text]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={pickStyle === id}
                  onClick={() => {
                    setPickStyle(id);
                    setPickShown(18);
                  }}
                  className={`min-h-[36px] shrink-0 whitespace-nowrap rounded-full px-3.5 text-xs font-semibold transition ${pickStyle === id ? 'bg-rose-700 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-slate-400'}`}
                >
                  {text} <span className="tabular-nums opacity-60">{styleCount(id)}</span>
                </button>
              ))}
            </div>
            <div className={`grid gap-3 ${bare ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6'}`}>
              {[...INVITATION_TEMPLATES.filter((t) => t.id === config.templateId), ...templatesFor(pickStyle).filter((t) => t.id !== config.templateId)]
                .slice(0, pickShown)
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => patch({ templateId: t.id })}
                    aria-pressed={config.templateId === t.id}
                    className={`relative overflow-hidden rounded-xl text-left ring-offset-2 transition ${config.templateId === t.id ? 'ring-[3px] ring-rose-600' : 'ring-1 ring-slate-200 hover:ring-slate-400'}`}
                  >
                    <CardFace
                      templateId={t.id}
                      groom={config.groomFullName}
                      bride={config.brideFullName}
                      date={mainDate}
                      cover={cover || undefined}
                      extras={gallery.filter((p) => p.publicUrl !== cover).slice(0, 2).map((p) => p.publicUrl)}
                      className="pointer-events-none"
                    />
                    {!gallery.length && <span className="absolute right-1 top-1 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-bold text-white">Ảnh minh hoạ</span>}
                    <span className="block truncate bg-white px-2 py-1.5 text-[11px] font-bold text-slate-800">{t.nameVi}</span>
                  </button>
                ))}
              {pickShown < templatesFor(pickStyle).filter((t) => t.id !== config.templateId).length + 1 && (
                <button type="button" onClick={() => setPickShown((n) => n + 18)} className="col-span-full min-h-[44px] rounded-xl text-sm font-semibold text-rose-800 ring-1 ring-rose-200 transition hover:bg-rose-50">
                  Xem thêm mẫu
                </button>
              )}
            </div>
          </Group>
        );

      case 'chuyen':
        return (
          <Group key={key} id="chuyen" bare={bare} title="Chuyện tình yêu" hint="Vài cột mốc ngắn: lần đầu gặp, ngày hẹn hò, lời cầu hôn…">
            {config.story.map((s, i) => (
              <div key={s.id} className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="grid gap-2.5 sm:grid-cols-[160px_1fr_auto]">
                  <input aria-label="Thời điểm" placeholder="Mùa thu 2019" className={input} value={s.when} maxLength={INVITATION_LIMITS.storyWhen} onChange={(e) => { const story = [...config.story]; story[i] = { ...s, when: e.target.value }; patch({ story }); }} />
                  <input aria-label="Tiêu đề" placeholder="Lần đầu gặp nhau" className={input} value={s.title} maxLength={INVITATION_LIMITS.storyTitle} onChange={(e) => { const story = [...config.story]; story[i] = { ...s, title: e.target.value }; patch({ story }); }} />
                  <button type="button" aria-label="Xoá cột mốc" onClick={() => patch({ story: config.story.filter((_, j) => j !== i) })} className="grid h-11 w-11 place-items-center rounded-xl text-slate-500 hover:bg-rose-100 hover:text-rose-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <textarea aria-label="Câu chuyện" className={`${input} min-h-[70px]`} value={s.text} maxLength={INVITATION_LIMITS.storyText} onChange={(e) => { const story = [...config.story]; story[i] = { ...s, text: e.target.value }; patch({ story }); }} />
              </div>
            ))}
            {config.story.length < INVITATION_LIMITS.story && (
              <button
                type="button"
                onClick={() => patch({ story: [...config.story, { id: invitationItemId('st'), when: '', title: '', text: '' }] })}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 text-sm font-bold text-slate-700 hover:border-rose-400 hover:text-rose-700"
              >
                <Plus className="h-4 w-4" /> Thêm cột mốc
              </button>
            )}
          </Group>
        );

      case 'khac':
        return (
          <Group key={key} id="khac" bare={bare} title="Nhạc nền & các mục trên thiệp">
            <div className="grid gap-2 sm:grid-cols-3">
              {(
                [
                  ['SYNTH', 'Hộp nhạc nhẹ nhàng'],
                  ['URL', 'Nhạc của chúng mình'],
                  ['OFF', 'Không phát nhạc'],
                ] as const
              ).map(([m, text]) => (
                <button key={m} type="button" aria-pressed={config.music.mode === m} onClick={() => patch({ music: { ...config.music, mode: m } })} className={`min-h-[44px] rounded-xl px-3 text-xs font-bold ${config.music.mode === m ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                  {text}
                </button>
              ))}
            </div>
            {config.music.mode === 'URL' && (
              <input aria-label="Link file nhạc" className={input} placeholder="https://…/bai-hat.mp3 (bạn cần có quyền dùng bài hát)" value={config.music.url} maxLength={INVITATION_LIMITS.url} onChange={(e) => patch({ music: { mode: 'URL', url: e.target.value } })} />
            )}
            <div className="grid gap-2 pt-2 sm:grid-cols-3">
              {(Object.keys(SECTION_LABELS) as InvitationSectionKey[])
                .filter((k) => !(k === 'hall' && wedding.invitationOnly))
                .map((k) => (
                  <label key={k} className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl bg-slate-50 px-3 text-xs font-bold text-slate-700">
                    <input type="checkbox" className="h-4 w-4 accent-rose-700" checked={config.sections[k]} onChange={(e) => patch({ sections: { ...config.sections, [k]: e.target.checked } })} />
                    {SECTION_LABELS[k]}
                  </label>
                ))}
            </div>
            {config.sections.gift && !wedding.hasBankConfig && <p className="text-xs text-amber-700">Hộp mừng cưới chỉ hiện khi đã có tài khoản ngân hàng (tab Cài Đặt) và phòng ở Gói Hạnh Phúc hoặc Viên Mãn.</p>}
            <div>
              <label className={label} htmlFor="inv-deadline">Hạn xác nhận tham dự</label>
              <input id="inv-deadline" type="date" className={input} value={config.rsvpDeadline ? toLocalInput(config.rsvpDeadline).slice(0, 10) : ''} onChange={(e) => patch({ rsvpDeadline: e.target.value ? fromLocalInput(`${e.target.value}T23:59`) : '' })} />
            </div>
          </Group>
        );
    }
  };

  /* ───────────── Pieces ───────────── */

  const invitation = (onEditPart?: (part: EditPart, el: HTMLElement) => void) => (
    <InvitationView
      slug={wedding.slug}
      groomName={wedding.groomName}
      brideName={wedding.brideName}
      weddingDate={wedding.weddingDate}
      config={config}
      photos={gallery.map((p) => ({ id: p.id, url: p.publicUrl, caption: p.caption }))}
      guestName={guestForLink.trim() || 'Anh Tuấn'}
      gift={{ enabled: wedding.hasBankConfig, bankName: null }}
      hallUrl={wedding.invitationOnly ? null : `/w/${wedding.slug}`}
      venueThumb={null}
      initialWishes={SAMPLE_WISHES}
      demo
      embedded
      onEditPart={onEditPart}
    />
  );

  const share = (
    <div className="rounded-2xl bg-slate-900 p-4 text-white sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-black">Gửi thiệp cho khách</h3>
        <a href={`/thiep/${wedding.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20">
          <ExternalLink className="h-4 w-4" /> Mở thiệp
        </a>
      </div>
      <div className="mt-2.5 [&_input]:bg-white">{origin && <CopyField value={inviteUrl} />}</div>
      {/* Personal links fold away so the editing starts on the first screen of a phone */}
      <details className="mt-3 text-xs text-slate-300">
        <summary className="cursor-pointer font-semibold text-amber-200">Tạo link mời riêng ghi tên từng khách</summary>
        <label htmlFor="guest-link" className="mt-2 block">
          Nhập tên khách, phong bì sẽ ghi “Kính mời” kèm tên đó
        </label>
        <input id="guest-link" value={guestForLink} onChange={(e) => setGuestForLink(e.target.value)} placeholder="Ví dụ: Cô Ba và gia đình" maxLength={60} className={`${input} mt-1.5`} />
        {personalUrl && (
          <div className="mt-2 [&_input]:bg-white">
            <CopyField value={personalUrl} />
          </div>
        )}
      </details>
    </div>
  );

  const modeSwitch = (
    <div role="radiogroup" aria-label="Cách sửa thiệp" className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
      {(
        [
          ['visual', 'Sửa trực quan', MousePointerClick],
          ['list', 'Sửa theo mục', LayoutList],
        ] as const
      ).map(([m, text, Icon]) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          onClick={() => setMode(m)}
          className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl text-sm font-bold transition ${mode === m ? 'bg-white text-rose-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Icon className="h-4 w-4" /> {text}
        </button>
      ))}
    </div>
  );

  const rsvpList = (
    <section id="inv-khach" className="scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-black text-slate-900">
          <Users className="h-4 w-4 text-rose-700" /> Khách xác nhận tham dự
        </h3>
        <p className="text-xs font-bold text-slate-600">
          <span className="tabular-nums text-emerald-700">{attending.length}</span> lượt sẽ đến · <span className="tabular-nums">{headcount}</span> người · <span className="tabular-nums">{rsvps.length - attending.length}</span> bận
        </p>
      </div>
      {rsvps.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500">Chưa có ai xác nhận. Khi khách bấm “Gửi xác nhận” trên thiệp, tên sẽ hiện ở đây.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2 pr-3 font-bold">Khách</th>
                <th className="py-2 pr-3 font-bold">Trả lời</th>
                <th className="py-2 pr-3 font-bold">Số người</th>
                <th className="py-2 pr-3 font-bold">Bên</th>
                <th className="py-2 pr-3 font-bold">Điện thoại</th>
                <th className="py-2 font-bold">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {rsvps.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="py-2 pr-3 font-semibold text-slate-900">{r.guestName}</td>
                  <td className={`py-2 pr-3 font-bold ${r.attending ? 'text-emerald-700' : 'text-slate-500'}`}>{r.attending ? 'Sẽ đến' : 'Bận'}</td>
                  <td className="py-2 pr-3 tabular-nums">{r.attending ? r.headcount : '—'}</td>
                  <td className="py-2 pr-3">{SIDE_LABEL[r.side] ?? r.side}</td>
                  <td className="py-2 pr-3 tabular-nums">{r.phone ?? '—'}</td>
                  <td className="py-2">{r.note ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  /* ───────────── Visual editing ───────────── */

  if (mode === 'visual') {
    const openPart = (part: EditPart, el: HTMLElement) => {
      activeEl.current = el;
      setActive(PART_GROUPS[part]);
      // On a phone the sheet covers the lower part of the screen: bring the tapped part to the top
      if (!isDesktop) window.setTimeout(() => el.scrollIntoView({ block: 'start', behavior: 'smooth' }), 60);
    };
    const panelBody = active ? (
      <div className="space-y-6">{active.groups.map((g) => renderGroup(g, true))}</div>
    ) : (
      <div className="space-y-3 text-sm leading-relaxed text-slate-600">
        <p className="flex items-center gap-2 font-black text-slate-900">
          <MousePointerClick className="h-5 w-5 text-sky-600" /> Bấm vào phần bất kỳ trên thiệp để sửa
        </p>
        <p>Tên, ảnh bìa, gia đình, các lễ và địa điểm, chuyện tình, album, lời cảm ơn: phần nào có nhãn xanh “✎ Sửa” đều sửa được. Gõ tới đâu thiệp đổi tới đó và tự lưu.</p>
      </div>
    );
    const toolButton = 'inline-flex min-h-[40px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3.5 text-xs font-bold text-slate-800 ring-1 ring-slate-200 hover:ring-rose-300';
    return (
      <div className="space-y-4">
        {share}
        {modeSwitch}
        <div className="sticky top-0 z-20 -mx-4 flex items-center gap-1.5 overflow-x-auto bg-[#FFFDF8]/95 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-2xl sm:px-2">
          <button type="button" onClick={() => setActive({ title: 'Mẫu thiệp', groups: ['mau'] })} className={toolButton}>
            <Palette className="h-4 w-4" /> Đổi mẫu
          </button>
          <button type="button" onClick={() => setActive({ title: 'Ảnh cưới', groups: ['anh'] })} className={toolButton}>
            <ImagePlus className="h-4 w-4" /> Ảnh cưới
          </button>
          <button type="button" onClick={() => setActive(PART_GROUPS.events)} className={toolButton}>
            <MapPin className="h-4 w-4" /> Các lễ
          </button>
          <button type="button" onClick={() => setActive(PART_GROUPS.replies)} className={toolButton}>
            <Music2 className="h-4 w-4" /> Nhạc & mục
          </button>
          <span className={`ml-auto shrink-0 whitespace-nowrap pl-2 text-xs font-semibold ${statusClass}`} role="status">
            {status}
          </span>
        </div>

        <div className={`grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:items-start ${active && !isDesktop ? 'pb-[64vh]' : ''}`}>
          <div className="min-w-0 overflow-hidden rounded-2xl shadow-[0_24px_60px_-30px_rgba(0,0,0,0.5)] ring-1 ring-slate-200">{invitation(openPart)}</div>

          {isDesktop && (
            <aside className="sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              {active && (
                <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <p className="text-sm font-black uppercase tracking-wide text-sky-700">✎ {active.title}</p>
                  <button type="button" onClick={() => setActive(null)} aria-label="Đóng" className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              {panelBody}
            </aside>
          )}
        </div>

        {rsvpList}

        {/* Phone: the editor slides up from the bottom, the invitation stays visible above it */}
        {!isDesktop && active && (
          <div role="dialog" aria-label={`Sửa ${active.title}`} className="fixed inset-x-0 bottom-0 z-50 flex max-h-[62vh] flex-col rounded-t-3xl bg-white shadow-[0_-18px_50px_-12px_rgba(0,0,0,0.45)] ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-sky-700">✎ {active.title}</p>
                <p className={`text-[11px] font-semibold ${statusClass}`}>{status}</p>
              </div>
              <button type="button" onClick={() => setActive(null)} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-slate-900 px-4 text-sm font-bold text-white">
                <Check className="h-4 w-4" /> Xong
              </button>
            </div>
            <div
              className="overflow-y-auto overscroll-contain px-4 pb-8 pt-4"
              onInput={(e) => {
                // Bring the text being typed into view above the sheet, wherever it sits in the part
                const value = (e.target as HTMLInputElement).value?.trim().toLowerCase();
                const part = activeEl.current;
                if (!part || !value || value.length < 2) return;
                requestAnimationFrame(() => {
                  let best: HTMLElement | null = null;
                  for (const el of Array.from(part.querySelectorAll<HTMLElement>('h1, h2, h3, p, span, li, div'))) {
                    if (el.children.length > 3) continue;
                    if ((el.textContent ?? '').toLowerCase().includes(value) && (!best || best.contains(el))) best = el;
                  }
                  if (!best) return;
                  const r = best.getBoundingClientRect();
                  const sheetTop = window.innerHeight * 0.38;
                  if (r.top >= 8 && r.bottom <= sheetTop - 8) return;
                  // The site scrolls <body>, not the window: move whichever ancestor actually scrolls
                  let scroller: HTMLElement | null = best.parentElement;
                  while (scroller && !(scroller.scrollHeight > scroller.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(scroller).overflowY))) scroller = scroller.parentElement;
                  const delta = r.top - Math.max(12, (sheetTop - r.height) / 2);
                  if (scroller) scroller.scrollBy({ top: delta, behavior: 'smooth' });
                  else window.scrollBy({ top: delta, behavior: 'smooth' });
                });
              }}
            >
              {panelBody}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ───────────── List editing ───────────── */

  const preview = (
    <div className="mx-auto w-[390px] max-w-full overflow-hidden rounded-[36px] border-[10px] border-slate-900 bg-slate-900 shadow-2xl">
      <div className="h-[720px] max-h-[80vh] overflow-y-auto">{invitation()}</div>
    </div>
  );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_410px]">
      <div className="min-w-0 space-y-5">
        {share}
        {modeSwitch}

        {/* Jump links */}
        <nav aria-label="Các phần của thiệp" className="sticky top-0 z-20 -mx-4 flex gap-1.5 overflow-x-auto bg-[#FFFDF8]/95 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-2xl sm:px-2">
          {NAV.map(([id, text]) => (
            <a key={id} href={`#inv-${id}`} className="inline-flex min-h-[36px] shrink-0 items-center whitespace-nowrap rounded-full bg-white px-3.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:ring-rose-300">
              {text}
            </a>
          ))}
        </nav>

        {GROUP_ORDER.map((g) => renderGroup(g))}

        {rsvpList}

        {/* Save bar: changes save on their own; the button saves right away */}
        <div className="sticky bottom-3 z-10 flex items-center justify-between gap-2 rounded-2xl bg-white/95 p-2.5 shadow-lg ring-1 ring-slate-200 backdrop-blur">
          <button type="button" onClick={() => setShowPreview((v) => !v)} className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 xl:hidden">
            <Eye className="h-4 w-4" /> {showPreview ? 'Ẩn' : 'Xem trước'}
          </button>
          <p className={`min-w-0 flex-1 truncate text-xs font-semibold ${statusClass}`} role="status">
            {status}
          </p>
          <button type="button" onClick={() => void persist()} disabled={state === 'saving'} className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-bold text-white hover:bg-rose-600 disabled:opacity-60">
            {state === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : state === 'saved' ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />} Lưu
          </button>
        </div>
        {showPreview && <div className="xl:hidden">{preview}</div>}
      </div>

      <div className="hidden xl:block">
        <div className="sticky top-4">
          <p className="mb-2 text-center text-xs font-bold text-slate-500">Xem trước trên điện thoại</p>
          {preview}
        </div>
      </div>
    </div>
  );
}
