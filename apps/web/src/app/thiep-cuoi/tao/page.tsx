'use client';

/**
 * Create an online invitation only (thiệp cưới online cho đám cưới tổ chức ngoài đời):
 * no 3D hall, free, never expires. The couple names, the date and a template are enough;
 * everything else is filled in the dashboard's invitation editor.
 */

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, Loader2, Mail, UserRound } from 'lucide-react';
import { INVITATION_TEMPLATES, isInvitationTemplateId, type InvitationTemplateId } from '@dco/shared';
import { OAuthModal } from '@/components/hall/OAuthModal';
import { CardFace } from '@/components/invitation/CardFace';

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
  const [templateId, setTemplateId] = useState<InvitationTemplateId>(isInvitationTemplateId(initial) ? initial : 'song-hy-do');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      // Fill the city into the first ceremony right away when given
      if (city.trim()) {
        const cfgRes = await fetch(`/api/weddings/${encodeURIComponent(data.wedding.slug)}/invitation`);
        const cfg = await cfgRes.json();
        if (cfgRes.ok && cfg.config) {
          const events = (cfg.config.events as Array<Record<string, unknown>>).map((ev) => ({ ...ev, address: ev.address || city.trim() }));
          await fetch(`/api/weddings/${encodeURIComponent(data.wedding.slug)}/invitation`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: { ...cfg.config, events } }),
          });
        }
      }
      router.push(`/dashboard/${data.wedding.slug}?tab=thiep`);
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

        <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-start">
          <form onSubmit={submit} className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm sm:p-8">
            <h1 className="font-serif text-3xl font-bold leading-tight text-rose-950 sm:text-4xl">Tạo thiệp cưới online</h1>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-600">
              Dành cho đám cưới tổ chức ngoài đời: gửi thiệp qua Zalo, Facebook, khách mở ra xem giờ, địa điểm, chỉ đường, xác nhận tham dự và gửi lời chúc. Miễn phí, không cần sảnh 3D, thiệp mở mãi không hết hạn.
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
                <input type="date" className={field} value={weddingDate} onChange={(e) => setWeddingDate(e.target.value)} required />
              </label>
              <label className="block">
                <span className={label}>
                  Nơi tổ chức <span className="font-normal text-slate-500">(không bắt buộc)</span>
                </span>
                <input className={field} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ví dụ: Phú Hội, TP. Huế" maxLength={120} />
              </label>
            </div>

            <fieldset className="mt-7">
              <legend className={label}>Chọn mẫu thiệp</legend>
              <p className="-mt-1 mb-3 text-xs text-slate-500">Đổi mẫu bất cứ lúc nào sau này, nội dung giữ nguyên.</p>
              <div role="radiogroup" aria-label="Mẫu thiệp" className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {INVITATION_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={templateId === t.id}
                    onClick={() => setTemplateId(t.id)}
                    className={`group overflow-hidden rounded-xl border-2 bg-white text-left transition ${templateId === t.id ? 'border-rose-600 ring-2 ring-rose-200' : 'border-transparent hover:border-rose-200'}`}
                  >
                    <CardFace templateId={t.id} groom={groomName.trim() || 'Minh Quân'} bride={brideName.trim() || 'Thu Hà'} date={isoDate} />
                    <span className="flex items-center justify-between gap-1 px-1.5 py-1.5 text-[11px] font-semibold text-slate-700">
                      <span className="truncate">{t.nameVi}</span>
                      {templateId === t.id && <Check className="h-3.5 w-3.5 shrink-0 text-rose-600" />}
                    </span>
                  </button>
                ))}
              </div>
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
              {submitting ? 'Đang tạo thiệp…' : 'Tạo thiệp cưới'}
            </button>
            <p className="mt-3 text-center text-xs text-slate-500">
              Muốn có thêm sảnh cưới 3D cho khách ở xa?{' '}
              <Link href={`/create?thiep=${templateId}`} className="font-semibold text-rose-700 underline-offset-4 hover:underline">
                Tạo sảnh cưới 3D kèm thiệp
              </Link>
            </p>
          </form>

          {/* Live cover preview */}
          <aside className="lg:sticky lg:top-8">
            <div className="mx-auto max-w-[380px] overflow-hidden rounded-[10px] shadow-[0_30px_60px_-28px_rgba(60,20,20,0.6)]">
              <CardFace templateId={templateId} groom={groomName.trim() || 'Minh Quân'} bride={brideName.trim() || 'Thu Hà'} date={isoDate} />
            </div>
            <p className="mt-4 text-center text-sm text-slate-600">
              Bìa thiệp với tên của hai bạn.{' '}
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
