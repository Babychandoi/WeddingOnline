'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, ImagePlus, Loader2, Sparkles, Star, UserRound, X } from 'lucide-react';
import { INVITATION_3D_TEMPLATES, INVITATION_LIMITS, isWalkthrough3DTemplate, type Walkthrough3DTemplateId } from '@dco/shared';
import { OAuthModal } from '@/components/hall/OAuthModal';
import { CardFace } from '@/components/invitation/CardFace';
import { walkthrough3DTheme } from '@/components/invitation/walkthrough3d/themes3d';
import { createStandeeCutoutBlob } from '@/lib/standeeCutout';
import { uploadWeddingPhoto } from '@/lib/uploadWeddingPhoto';

const MAX_PHOTOS = 12;

interface PickedPhoto {
  id: string;
  file: File;
  url: string;
}

function slugPart(name: string): string {
  const last = name.trim().split(/\s+/).pop() ?? '';
  return last
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function Create3DInvitation() {
  const router = useRouter();
  const query = useSearchParams();
  const [authUser, setAuthUser] = useState<{ id: string; displayName: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [weddingDate, setWeddingDate] = useState(() => new Date(Date.now() + 45 * 86_400_000).toISOString().slice(0, 10));
  const [city, setCity] = useState('');
  const initial = query.get('mau');
  const [templateId, setTemplateId] = useState<Walkthrough3DTemplateId>(
    isWalkthrough3DTemplate(initial) ? initial : '3d-ho-sen-hoa-dang',
  );
  const [greeting, setGreeting] = useState('');
  const [cutoutFile, setCutoutFile] = useState<File | null>(null);
  const [cutoutPreview, setCutoutPreview] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState<PickedPhoto[]>([]);
  const [coverId, setCoverId] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  const pickedRef = React.useRef<PickedPhoto[]>([]);
  pickedRef.current = picked;
  useEffect(() => () => pickedRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);
  useEffect(() => () => { if (cutoutPreview) URL.revokeObjectURL(cutoutPreview); }, [cutoutPreview]);

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

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) setAuthUser(d.user);
      })
      .finally(() => setAuthChecked(true));
  }, []);

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
              : data.message || 'Chưa tạo được thiệp 3D, bạn thử lại nhé.',
        );
      }

      const newSlug: string = data.wedding.slug;
      const ordered = coverPhoto ? [coverPhoto, ...picked.filter((p) => p !== coverPhoto)] : picked;
      let coverUrl = '';
      let coupleCutoutUrl = '';
      let failed = 0;

      for (const [i, p] of ordered.entries()) {
        setProgress(`Đang tải ảnh kỷ niệm ${i + 1}/${ordered.length}…`);
        try {
          const photo = await uploadWeddingPhoto(newSlug, p.file);
          if (p === coverPhoto) coverUrl = photo.publicUrl;
        } catch {
          failed++;
        }
      }

      if (cutoutFile) {
        setProgress('Đang tách nền ảnh đôi đứng đón khách 3D…');
        try {
          const blob = await createStandeeCutoutBlob(cutoutFile);
          const f = new File([blob], `${cutoutFile.name.replace(/\.[a-z0-9]+$/i, '')}-cutout.webp`, { type: 'image/webp' });
          const uploaded = await uploadWeddingPhoto(newSlug, f, { preserveAlpha: true });
          coupleCutoutUrl = uploaded.publicUrl;
        } catch {
          failed++;
        }
      }

      setProgress('');
      if (city.trim() || coverUrl || coupleCutoutUrl || greeting.trim()) {
        const cfgRes = await fetch(`/api/weddings/${encodeURIComponent(newSlug)}/invitation`);
        const cfg = await cfgRes.json();
        if (cfgRes.ok && cfg.config) {
          const events = (cfg.config.events as Array<Record<string, unknown>>).map((ev) => ({ ...ev, address: ev.address || city.trim() }));
          await fetch(`/api/weddings/${encodeURIComponent(newSlug)}/invitation`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              config: {
                ...cfg.config,
                events,
                ...(coverUrl ? { coverPhotoUrl: coverUrl } : {}),
                ...(coupleCutoutUrl ? { coupleCutoutUrl } : {}),
                ...(greeting.trim() ? { walkthroughGreeting: greeting.trim() } : {}),
              },
            }),
          });
        }
      }

      router.push(`/dashboard/${newSlug}?tab=thiep${failed ? `&anh_loi=${failed}` : ''}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chưa tạo được thiệp 3D, bạn thử lại nhé.');
      setSubmitting(false);
    }
  };

  if (authChecked && !authUser) {
    return (
      <OAuthModal
        title="Đăng nhập để tạo thiệp cưới 3D"
        subtitle="Thiệp 3D gắn với tài khoản Google của bạn để sửa nội dung, xem khách xác nhận tham dự và giữ bản quyền ảnh."
        onAuthenticated={(u) => setAuthUser(u)}
      />
    );
  }

  const field = 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100';
  const label = 'mb-1.5 block text-sm font-semibold text-slate-800';
  const theme3D = walkthrough3DTheme(templateId);

  return (
    <main className="min-h-screen bg-[#FFFDF8] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex items-center justify-between gap-3">
          <Link href="/thiep-cuoi-3d" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-rose-700">
            <ArrowLeft className="h-4 w-4" /> 10 Bộ Thiệp Cưới 3D
          </Link>
          {authUser && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              <UserRound className="h-3.5 w-3.5" /> {authUser.displayName}
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-start">
          <form onSubmit={submit} className="min-w-0 rounded-3xl border border-amber-200 bg-white p-5 shadow-sm sm:p-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800 ring-1 ring-rose-200">
              <Sparkles className="h-3.5 w-3.5" /> Thiệp Cưới 3D · 199.000đ/tháng · 799.000đ trọn đời
            </span>
            <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-rose-950 sm:text-4xl">Tạo Thiệp Cưới 3D Dạo Bước</h1>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-600">
              Thiết kế hoàn toàn miễn phí bản nháp với đầy đủ chuyển cảnh camera đa trạm &amp; cần điều khiển đi dạo 3D; chỉ thanh toán khi phát hành gửi khách.{' '}
              <Link href="/thiep-cuoi/tao" className="font-bold text-rose-700 underline underline-offset-4">
                Tạo Thiệp 2D (99k/tháng · 599k trọn đời) →
              </Link>
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={label}>Tên chú rể</span>
                <input className={field} value={groomName} onChange={(e) => setGroomName(e.target.value)} placeholder="Ví dụ: Bảo Long" maxLength={60} autoComplete="off" required />
              </label>
              <label className="block">
                <span className={label}>Tên cô dâu</span>
                <input className={field} value={brideName} onChange={(e) => setBrideName(e.target.value)} placeholder="Ví dụ: Thanh Tâm" maxLength={60} autoComplete="off" required />
              </label>
              <label className="block">
                <span className={label}>Ngày cưới</span>
                <input type="date" className={`${field} block min-h-[50px]`} value={weddingDate} onChange={(e) => setWeddingDate(e.target.value)} required />
              </label>
              <label className="block">
                <span className={label}>
                  Nơi tổ chức <span className="font-normal text-slate-500">(không bắt buộc)</span>
                </span>
                <input className={field} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ví dụ: Trung tâm Hoa Sen, Quận 1" maxLength={120} />
              </label>
            </div>

            <div className="mt-5">
              <label className={label} htmlFor="greeting-3d-input">
                Câu chào trên bong bóng thoại 3D <span className="font-normal text-slate-500">(không bắt buộc)</span>
              </label>
              <input
                id="greeting-3d-input"
                className={field}
                value={greeting}
                maxLength={INVITATION_LIMITS.greeting}
                placeholder={theme3D.defaultGreeting}
                onChange={(e) => setGreeting(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-500">Gõ <code>{'{khach}'}</code> để tự chèn tên riêng từng vị khách mở thiệp.</p>
            </div>

            <fieldset className="mt-7 min-w-0">
              <legend className={label}>Chọn 1 trong 10 Chủ đề 3D</legend>
              <div role="radiogroup" aria-label="Mẫu thiệp cưới 3D" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {INVITATION_3D_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={templateId === t.id}
                    onClick={() => setTemplateId(t.id as Walkthrough3DTemplateId)}
                    className={`group overflow-hidden rounded-xl border-2 bg-white text-left transition ${templateId === t.id ? 'border-rose-600 ring-2 ring-rose-200' : 'border-slate-200 hover:border-rose-300'}`}
                  >
                    <CardFace templateId={t.id} groom={groomName.trim() || 'Bảo Long'} bride={brideName.trim() || 'Thanh Tâm'} date={isoDate} />
                    <span className="flex items-center justify-between gap-1 px-2 py-1.5 text-[11px] font-bold text-slate-800">
                      <span className="truncate">{t.nameVi}</span>
                      {templateId === t.id && <Check className="h-3.5 w-3.5 shrink-0 text-rose-600" />}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-7 min-w-0">
              <legend className={label}>
                Ảnh kỷ niệm 3D trên dãy giá vẽ <span className="font-normal text-slate-500">(không bắt buộc, 6 ảnh đầu hiện thành Kỷ niệm 1/6..6/6)</span>
              </legend>
              {picked.length === 0 ? (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50/60 px-4 py-6 text-center hover:bg-rose-50">
                  <ImagePlus className="h-7 w-7 text-rose-600" />
                  <span className="text-sm font-black text-rose-800">Chọn ảnh cưới cho giá vẽ 3D</span>
                  <span className="text-xs text-slate-600">Có thể tải tối đa {MAX_PHOTOS} ảnh</span>
                  <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { addPicked(e.target.files); e.target.value = ''; }} />
                </label>
              ) : (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {picked.map((p) => {
                    const isCover = p === coverPhoto;
                    return (
                      <div key={p.id} className={`relative overflow-hidden rounded-xl bg-slate-100 ${isCover ? 'ring-[3px] ring-rose-600' : 'ring-1 ring-slate-200'}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt="" className="aspect-[3/4] w-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-1 pt-4">
                          <button type="button" onClick={() => setCoverId(p.id)} disabled={isCover} aria-label="Đặt làm ảnh bìa" className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-rose-700 disabled:opacity-40">
                            <Star className="h-3.5 w-3.5" fill={isCover ? 'currentColor' : 'none'} />
                          </button>
                          <button type="button" onClick={() => removePicked(p.id)} aria-label="Bỏ ảnh này" className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-slate-700">
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
              )}
            </fieldset>

            {/* Optional Custom Couple Cutout Standee */}
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <p className="text-xs font-black text-rose-900">Ảnh đôi đứng đón khách 3D (tùy chọn)</p>
              <p className="mt-0.5 text-xs text-slate-600">Nếu bỏ trống, thiệp tự dùng nhân vật cô dâu chú rể vẽ sẵn theo đúng trang phục của chủ đề.</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-3">
                <label className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-bold text-rose-800 ring-1 ring-rose-300 hover:bg-rose-50">
                  <ImagePlus className="h-3.5 w-3.5" /> {cutoutFile ? 'Đổi ảnh đôi' : 'Tải ảnh đôi tách nền'}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (cutoutPreview) URL.revokeObjectURL(cutoutPreview);
                      setCutoutFile(f);
                      setCutoutPreview(URL.createObjectURL(f));
                      e.target.value = '';
                    }}
                  />
                </label>
                {cutoutPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(cutoutPreview);
                      setCutoutFile(null);
                      setCutoutPreview('');
                    }}
                    className="text-xs font-semibold text-slate-600 underline"
                  >
                    Dùng nhân vật mặc định
                  </button>
                )}
              </div>
            </div>

            <label className="mt-6 block">
              <span className={label}>Đường dẫn thiệp 3D</span>
              <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-100">
                <span className="flex items-center bg-slate-50 px-3 text-sm text-slate-500">…/thiep/</span>
                <input
                  className="min-w-0 flex-1 px-3 py-3 text-base outline-none"
                  value={slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'));
                  }}
                  placeholder="tam-long-2026"
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
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {submitting ? progress || 'Đang dựng thiệp 3D…' : 'Tạo Thiệp Cưới 3D Miễn Phí'}
            </button>
          </form>

          {/* Live 3D card preview */}
          <aside className="min-w-0 lg:sticky lg:top-8">
            <div className="relative mx-auto max-w-[380px] overflow-hidden rounded-[12px] shadow-[0_30px_60px_-28px_rgba(30,15,50,0.65)] ring-1 ring-amber-300/60">
              <CardFace
                templateId={templateId}
                groom={groomName.trim() || 'Bảo Long'}
                bride={brideName.trim() || 'Thanh Tâm'}
                date={isoDate}
                cover={cutoutPreview || undefined}
              />
            </div>
            <p className="mt-4 text-center text-sm text-slate-600">
              Xem trước chủ đề <strong>{theme3D.nameVi}</strong>.{' '}
              <Link href={`/thiep-cuoi/${templateId}?khach=Qu%E1%BB%91c+B%E1%BA%A3o`} target="_blank" className="font-semibold text-rose-700 underline-offset-4 hover:underline">
                Mở demo 3D toàn màn hình →
              </Link>
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function Create3DInvitationPage() {
  return (
    <Suspense fallback={null}>
      <Create3DInvitation />
    </Suspense>
  );
}
