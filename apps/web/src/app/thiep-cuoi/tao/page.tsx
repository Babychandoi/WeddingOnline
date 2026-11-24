'use client';

/**
 * Create an online invitation only (thiệp cưới online cho đám cưới tổ chức ngoài đời):
 * no 3D hall, free, never expires. The couple names, the date and a template are enough;
 * everything else is filled in the dashboard's invitation editor.
 */

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, ImagePlus, Loader2, Mail, Star, UserRound, X } from 'lucide-react';
import { INVITATION_2D_STYLE_LABELS, INVITATION_2D_TEMPLATES, isInvitationTemplateId, isWalkthrough3DTemplate, type Invitation2DTemplateStyle, type InvitationTemplateId } from '@dco/shared';
import { OAuthModal } from '@/components/hall/OAuthModal';
import { CardFace } from '@/components/invitation/CardFace';
import { styleCount, templatesFor, type StyleFilter } from '@/components/invitation/templateOrder';
import { uploadWeddingPhoto } from '@/lib/uploadWeddingPhoto';

/** Album size of an invitation-only wedding (matches the photos API) */
const MAX_PHOTOS = 12;

interface PickedPhoto {
  id: string;
  file: File;
  /** Object URL for the on-page preview */
  url: string;
}

const STYLE_CHIPS: Array<[StyleFilter, string]> = [['all', 'Tất cả'], ...(Object.entries(INVITATION_2D_STYLE_LABELS) as Array<[Invitation2DTemplateStyle, string]>)];
const PICK_PAGE = 16;

/** "Minh Quân" + "Thu Hà" → "quan-ha" (no diacritics, đ → d) */
function slugPart(name: string): string {
  const last = name.trim().split(/\s+/).pop() ?? '';
  return last
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function CreateInvitation() {
  const router = useRouter();
  const query = useSearchParams();
  const [authUser, setAuthUser] = useState<{ id: string; displayName: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [weddingDate, setWeddingDate] = useState(() => new Date(Date.now() + 45 * 86_400_000).toISOString().slice(0, 10));
  const [city, setCity] = useState('');
  const initial = query.get('mau');
  useEffect(() => {
    if (isWalkthrough3DTemplate(initial)) {
      router.replace(`/thiep-cuoi-3d/tao?mau=${encodeURIComponent(initial)}`);
    }
  }, [initial, router]);
  const [templateId, setTemplateId] = useState<InvitationTemplateId>(
    isInvitationTemplateId(initial) && !isWalkthrough3DTemplate(initial) ? initial : 'song-hy-do',
  );
  const [pickStyle, setPickStyle] = useState<StyleFilter>('all');
  const [pickShown, setPickShown] = useState(PICK_PAGE);
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  // Photos chosen before the invitation exists: previewed from the device, uploaded after "Tạo thiệp"
  const [picked, setPicked] = useState<PickedPhoto[]>([]);
  const [coverId, setCoverId] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const pickedRef = React.useRef<PickedPhoto[]>([]);
  pickedRef.current = picked;
  useEffect(() => () => pickedRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const addPicked = (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_PHOTOS - picked.length;
    const next = Array.from(files)
      .filter((file) => file.type.startsWith('image/') || /\.(heic|heif|jpe?g|png|webp)$/i.test(file.name))
      .slice(0, room)
      .map((file) => ({ id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`, file, url: URL.createObjectURL(file) }));
    if (files.length > room) setError(`Thiệp giữ tối đa ${MAX_PHOTOS} ảnh, mình chỉ lấy ${room} ảnh đầu.`);
    setPicked((list) => [...list, ...next]);
    if (!coverId && next[0]) setCoverId(next[0].id);
  };
  const removePicked = (id: string) => {
    const gone = picked.find((p) => p.id === id);
    if (gone) URL.revokeObjectURL(gone.url);
    const rest = picked.filter((p) => p.id !== id);
    setPicked(rest);
    if (coverId === id) setCoverId(rest[0]?.id ?? null);
  };
  const coverPhoto = picked.find((p) => p.id === coverId) ?? picked[0];
  const extraPhotos = picked.filter((p) => p !== coverPhoto).slice(0, 2).map((p) => p.url);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) setAuthUser(d.user);
      })
      .finally(() => setAuthChecked(true));
  }, []);

  // The link follows the names until the couple edits it
  const autoSlug = useMemo(() => {
    const g = slugPart(groomName);
    const b = slugPart(brideName);
    const year = weddingDate.slice(0, 4);
    return [g, b].filter(Boolean).join('-') ? `${[g, b].filter(Boolean).join('-')}-${year}` : '';
  }, [groomName, brideName, weddingDate]);
  useEffect(() => {
    if (!slugEdited) setSlug(autoSlug);
  }, [autoSlug, slugEdited]);

  const isoDate = `${weddingDate}T11:00:00+07:00`;
  const ready = groomName.trim() && brideName.trim() && weddingDate && slug.length >= 3;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setSubmitting(true);
    setError('');
    const create = (s: string) =>
      fetch('/api/weddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: s,
          title: `Lễ Thành Hôn ${groomName.trim()} & ${brideName.trim()}`,
          groomName: groomName.trim(),
          brideName: brideName.trim(),
          weddingDate: new Date(isoDate).toISOString(),
          invitationOnly: true,
          invitationTemplateId: templateId,
        }),
      });
    try {
      let res = await create(slug);
      let data = await res.json();
      // Taken link: add a short number rather than making the couple think of another
      if (!res.ok && data.error === 'SLUG_ALREADY_EXISTS' && !slugEdited) {
        res = await create(`${slug}-${Math.floor(10 + Math.random() * 89)}`);
        data = await res.json();
      }
      if (!res.ok) {
        throw new Error(
          data.error === 'SLUG_ALREADY_EXISTS'
            ? 'Đường dẫn này đã có người dùng, bạn đổi một chút nhé.'
            : data.error === 'INVALID_SLUG'
              ? 'Đường dẫn cần ít nhất 3 ký tự: chữ không dấu, số hoặc dấu gạch.'
              : data.message || 'Chưa tạo được thiệp, bạn thử lại nhé.',
        );
      }
      const newSlug: string = data.wedding.slug;
      // Upload the chosen photos, cover first so it is also the album's first photo
      const ordered = coverPhoto ? [coverPhoto, ...picked.filter((p) => p !== coverPhoto)] : picked;
      let coverUrl = '';
      let failed = 0;
      for (const [i, p] of ordered.entries()) {
        setProgress(`Đang tải ảnh ${i + 1}/${ordered.length}…`);
        try {
          const photo = await uploadWeddingPhoto(newSlug, p.file);
          if (p === coverPhoto) coverUrl = photo.publicUrl;
        } catch {
          failed++;
        }
      }
      setProgress('');
      // Fill the place into the ceremonies and set the cover in one save
      if (city.trim() || coverUrl) {
        const cfgRes = await fetch(`/api/weddings/${encodeURIComponent(newSlug)}/invitation`);
        const cfg = await cfgRes.json();
        if (cfgRes.ok && cfg.config) {
          const events = (cfg.config.events as Array<Record<string, unknown>>).map((ev) => ({ ...ev, address: ev.address || city.trim() }));
          await fetch(`/api/weddings/${encodeURIComponent(newSlug)}/invitation`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: { ...cfg.config, events, ...(coverUrl ? { coverPhotoUrl: coverUrl } : {}) } }),
          });
        }
      }
      router.push(`/dashboard/${newSlug}?tab=thiep${failed ? `&anh_loi=${failed}` : ''}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chưa tạo được thiệp, bạn thử lại nhé.');
      setSubmitting(false);
    }
  };

  if (authChecked && !authUser) {
    return (
      <OAuthModal
        title="Đăng nhập để tạo thiệp cưới"
        subtitle="Thiệp gắn với tài khoản Google của bạn để chỉ hai bạn sửa được nội dung, xem ai xác nhận tham dự và đọc lời chúc."
        onAuthenticated={(u) => setAuthUser(u)}
      />
    );
  }

  const field = 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100';
  const label = 'mb-1.5 block text-sm font-semibold text-slate-800';

  return (
    <main className="min-h-screen bg-[#FFFDF8] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex items-center justify-between gap-3">
          <Link href="/thiep-cuoi" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-rose-700">
            <ArrowLeft className="h-4 w-4" /> Mẫu thiệp
          </Link>
          {authUser && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              <UserRound className="h-3.5 w-3.5" /> {authUser.displayName}
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-start">
          <form onSubmit={submit} className="min-w-0 rounded-3xl border border-amber-200 bg-white p-5 shadow-sm sm:p-8">
            <h1 className="font-serif text-3xl font-bold leading-tight text-rose-950 sm:text-4xl">Tạo thiệp cưới online 2D</h1>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-600">
              Dành cho 100 mẫu thiệp cưới 2D: gửi thiệp qua Zalo, Facebook, khách mở ra xem giờ, địa điểm, chỉ đường, xác nhận tham dự và gửi lời chúc. Thiết kế và xem trước miễn phí; khi ưng ý mới chọn gói phát hành (từ 150.000đ/tháng).{' '}
              <Link href="/thiep-cuoi-3d/tao" className="font-bold text-rose-700 underline underline-offset-4">
                Tạo Thiệp Cưới 3D (từ 290k) →
              </Link>
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={label}>Tên chú rể</span>
                <input className={field} value={groomName} onChange={(e) => setGroomName(e.target.value)} placeholder="Ví dụ: Minh Quân" maxLength={60} autoComplete="off" required />
              </label>
              <label className="block">
                <span className={label}>Tên cô dâu</span>
                <input className={field} value={brideName} onChange={(e) => setBrideName(e.target.value)} placeholder="Ví dụ: Thu Hà" maxLength={60} autoComplete="off" required />
              </label>
              <label className="block">
                <span className={label}>Ngày cưới</span>
                <input type="date" className={`${field} block min-h-[50px]`} value={weddingDate} onChange={(e) => setWeddingDate(e.target.value)} required />
              </label>
              <label className="block">
                <span className={label}>
                  Nơi tổ chức <span className="font-normal text-slate-500">(không bắt buộc)</span>
                </span>
                <input className={field} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ví dụ: Phú Hội, TP. Huế" maxLength={120} />
                <span className="mt-1 block text-xs text-slate-500">Nhà trai, nhà gái, nhà hàng ở nhiều nơi khác nhau? Sửa riêng địa điểm từng lễ ở bước sau.</span>
              </label>
            </div>

            <fieldset className="mt-7 min-w-0">
              <legend className={label}>
                Ảnh cưới <span className="font-normal text-slate-500">(không bắt buộc, tối đa {MAX_PHOTOS} ảnh)</span>
              </legend>
              <p className="-mt-1 mb-3 text-xs text-slate-500">Ảnh bìa và album của thiệp. Ảnh lớn tự được thu nhỏ khi tải lên; thêm, đổi, xoá ảnh được cả sau này.</p>
              {picked.length === 0 ? (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50/60 px-4 py-7 text-center hover:bg-rose-50">
                  <ImagePlus className="h-7 w-7 text-rose-600" />
                  <span className="text-sm font-black text-rose-800">Chọn ảnh cưới</span>
                  <span className="text-xs text-slate-600">Chọn nhiều ảnh một lúc từ điện thoại hoặc máy tính</span>
                  <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { addPicked(e.target.files); e.target.value = ''; }} />
                </label>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {picked.map((p) => {
                      const isCover = p === coverPhoto;
                      return (
                        <div key={p.id} className={`relative overflow-hidden rounded-xl bg-slate-100 ${isCover ? 'ring-[3px] ring-rose-600' : 'ring-1 ring-slate-200'}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.url} alt="" className="aspect-[3/4] w-full object-cover" />
                          {isCover && <span className="absolute left-1 top-1 rounded-full bg-rose-600 px-1.5 py-0.5 text-[9px] font-black text-white">Bìa</span>}
                          <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-1 pt-4">
                            <button type="button" onClick={() => setCoverId(p.id)} disabled={isCover} aria-label="Đặt làm ảnh bìa" title="Đặt làm ảnh bìa" className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-rose-700 disabled:opacity-40">
                              <Star className="h-3.5 w-3.5" fill={isCover ? 'currentColor' : 'none'} />
                            </button>
                            <button type="button" onClick={() => removePicked(p.id)} aria-label="Bỏ ảnh này" title="Bỏ ảnh này" className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-700">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {picked.length < MAX_PHOTOS && (
                      <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-center text-[11px] font-bold text-slate-600 hover:border-rose-400 hover:text-rose-700">
                        <ImagePlus className="h-5 w-5" /> Thêm
                        <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { addPicked(e.target.files); e.target.value = ''; }} />
                      </label>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">{picked.length}/{MAX_PHOTOS} ảnh · bấm ngôi sao để chọn ảnh bìa</p>
                </>
              )}
            </fieldset>

            <fieldset className="mt-7 min-w-0">
              <legend className={label}>Chọn mẫu thiệp</legend>
              <p className="-mt-1 mb-3 text-xs text-slate-500">Đổi mẫu bất cứ lúc nào sau này, nội dung giữ nguyên.</p>
              <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Lọc mẫu theo phong cách">
                {STYLE_CHIPS.map(([id, text]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={pickStyle === id}
                    onClick={() => {
                      setPickStyle(id);
                      setPickShown(PICK_PAGE);
                    }}
                    className={`min-h-[36px] shrink-0 whitespace-nowrap rounded-full px-3.5 text-xs font-semibold transition ${pickStyle === id ? 'bg-rose-700 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-slate-400'}`}
                  >
                    {text} <span className="tabular-nums opacity-60">{styleCount(id)}</span>
                  </button>
                ))}
              </div>
              {(() => {
                // The chosen template always stays first, whatever the filter
                const chosen = INVITATION_2D_TEMPLATES.find((t) => t.id === templateId);
                const list = templatesFor(pickStyle).filter((t) => t.id !== templateId);
                const ordered = chosen ? [chosen, ...list] : list;
                return (
                  <>
                    <div role="radiogroup" aria-label="Mẫu thiệp" className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                      {ordered.slice(0, pickShown).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          role="radio"
                          aria-checked={templateId === t.id}
                          onClick={() => setTemplateId(t.id)}
                          className={`group overflow-hidden rounded-xl border-2 bg-white text-left transition ${templateId === t.id ? 'border-rose-600 ring-2 ring-rose-200' : 'border-transparent hover:border-rose-200'}`}
                        >
                          <CardFace templateId={t.id} groom={groomName.trim() || 'Minh Quân'} bride={brideName.trim() || 'Thu Hà'} date={isoDate} cover={coverPhoto?.url} extras={coverPhoto ? extraPhotos : undefined} />
                          <span className="flex items-center justify-between gap-1 px-1.5 py-1.5 text-[11px] font-semibold text-slate-700">
                            <span className="truncate">{t.nameVi}</span>
                            {templateId === t.id && <Check className="h-3.5 w-3.5 shrink-0 text-rose-600" />}
                          </span>
                        </button>
                      ))}
                    </div>
                    {pickShown < ordered.length && (
                      <button
                        type="button"
                        onClick={() => setPickShown((n) => n + PICK_PAGE)}
                        className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl text-sm font-semibold text-rose-800 ring-1 ring-rose-200 transition hover:bg-rose-50"
                      >
                        Xem thêm mẫu <span className="ml-1 tabular-nums opacity-60">({ordered.length - pickShown})</span>
                      </button>
                    )}
                  </>
                );
              })()}
            </fieldset>

            <label className="mt-7 block">
              <span className={label}>Đường dẫn thiệp</span>
              <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-100">
                <span className="flex items-center bg-slate-50 px-3 text-sm text-slate-500">…/thiep/</span>
                <input
                  className="min-w-0 flex-1 px-3 py-3 text-base outline-none"
                  value={slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'));
                  }}
                  placeholder="quan-ha-2026"
                  maxLength={60}
                />
              </div>
            </label>

            {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-semibold text-rose-700" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={!ready || submitting}
              className="mt-6 inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-rose-700 text-base font-bold text-white shadow-[0_12px_26px_-12px_rgba(136,19,55,0.8)] transition hover:bg-rose-600 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
              {submitting ? progress || 'Đang tạo thiệp…' : 'Tạo thiệp cưới'}
            </button>
            <p className="mt-3 text-center text-xs text-slate-500">
              Muốn có thêm sảnh cưới 3D cho khách ở xa?{' '}
              <Link href={`/create?thiep=${templateId}`} className="font-semibold text-rose-700 underline-offset-4 hover:underline">
                Tạo sảnh cưới 3D kèm thiệp
              </Link>
            </p>
          </form>

          {/* Live cover preview */}
          <aside className="min-w-0 lg:sticky lg:top-8">
            <div className="relative mx-auto max-w-[380px] overflow-hidden rounded-[10px] shadow-[0_30px_60px_-28px_rgba(60,20,20,0.6)]">
              {!coverPhoto && <span className="absolute right-2 top-2 z-10 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white">Ảnh minh hoạ</span>}
              <CardFace templateId={templateId} groom={groomName.trim() || 'Minh Quân'} bride={brideName.trim() || 'Thu Hà'} date={isoDate} cover={coverPhoto?.url} extras={coverPhoto ? extraPhotos : undefined} />
            </div>
            <p className="mt-4 text-center text-sm text-slate-600">
              {coverPhoto ? 'Bìa thiệp với tên và ảnh của hai bạn.' : 'Bìa thiệp với tên của hai bạn. Ảnh là ảnh minh hoạ: chọn ảnh cưới của bạn ở phần Ảnh cưới để thay.'}{' '}
              <Link href={`/thiep-cuoi/${templateId}`} target="_blank" className="font-semibold text-rose-700 underline-offset-4 hover:underline">
                Xem cả thiệp mẫu
              </Link>
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function CreateInvitationPage() {
  return (
    <Suspense fallback={null}>
      <CreateInvitation />
    </Suspense>
  );
}
