import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { Calendar, Sparkles } from 'lucide-react';
import { dbRepo } from '@dco/database';
import { CopyLinkButton } from '@/components/hall/CopyLinkButton';
import { getRuntimeEnv, isLocalRequestHost } from '@/lib/runtimeEnv';

export const dynamic = 'force-dynamic';

export default async function DigitalInvitePage({ params }: { params: { slug: string } }) {
  const wedding = await dbRepo.getWeddingBySlug(params.slug);
  if (!wedding) notFound();

  const h = headers();
  const host = (h.get('x-forwarded-host') || h.get('host') || '').split(',')[0].trim();
  const proto =
    h.get('x-forwarded-proto')?.split(',')[0].trim() || (isLocalRequestHost(host) ? 'http' : 'https');
  const baseUrl = host
    ? `${proto}://${host}`
    : (getRuntimeEnv('NEXT_PUBLIC_APP_URL') || 'https://poiplegal.online').replace(/\/$/, '');

  const targetUrl = `${baseUrl}/w/${wedding.slug}`;
  const qrDataUrl = await QRCode.toDataURL(targetUrl, {
    width: 320,
    margin: 2,
    color: { dark: '#881337', light: '#fffdf8' },
  });

  const weddingDate = new Date(wedding.weddingDate);
  const daysLeft = Math.max(
    0,
    Math.ceil((weddingDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-950 via-rose-800 to-amber-800 p-4">
      <div className="dco-fade-up w-full max-w-md overflow-hidden rounded-[2rem] border-4 border-amber-300 bg-[#FFFDF8] p-7 text-center shadow-2xl">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300 bg-rose-700 text-amber-200 shadow-sm">
          <svg viewBox="0 0 36 36" className="h-7 w-7" fill="currentColor" aria-hidden="true">
            <path d="M9 7h4v5h3v3h-3v4h4v3h-4v7H9v-7H6v-3h3v-4H6v-3h3V7zm14 0h4v5h3v3h-3v4h3v3h-3v7h-4v-7h-4v-3h4v-4h-3v-3h3V7z" />
          </svg>
        </div>

        <h1 className="font-serif text-3xl font-bold text-slate-900 sm:text-4xl">
          {wedding.groomName} &amp; {wedding.brideName}
        </h1>
        <p className="mt-1.5 text-sm font-semibold text-rose-700">{wedding.title}</p>

        <div className="tabular-nums mt-4 inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900">
          <Calendar className="h-4 w-4 text-amber-600" />
          <span>{weddingDate.toLocaleDateString('vi-VN')}</span>
          {daysLeft > 0 && <span className="text-rose-700">(Còn {daysLeft} ngày)</span>}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-600">
          Trân trọng kính mời bạn ghé thăm Sảnh Cưới 3D Trực Tuyến: dạo xem ảnh cưới, ký Sổ Lưu Bút,
          cụng ly 1-2-3 Dzô và bắt hoa cưới cùng cô dâu chú rể.
        </p>

        <div className="my-5 flex flex-col items-center">
          <img
            src={qrDataUrl}
            alt="QR Sảnh Cưới 3D"
            className="h-44 w-44 rounded-2xl border-2 border-amber-200 bg-[#FFFDF8] p-1.5 shadow-sm"
          />
          <span className="mt-2 text-[11px] font-semibold text-slate-500">
            Quét mã bằng Camera để vào sảnh 3D
          </span>
        </div>

        <div className="space-y-2.5">
          <Link
            href={`/w/${wedding.slug}`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-rose-500"
          >
            <Sparkles className="h-4 w-4" /> Bước Vào Sảnh Cưới 3D Ngay
          </Link>
          <CopyLinkButton url={targetUrl} />
        </div>

        <div className="mt-4">
          <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-rose-700 hover:underline">
            ← Tìm hiểu DamCuoiOnline.vn
          </Link>
        </div>
      </div>
    </div>
  );
}
