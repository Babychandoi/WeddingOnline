import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Building2 } from 'lucide-react';
import { getAdminSession } from '@/lib/adminPage';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Đối tác Studio — DamCuoiOnline' };

// Voucher codes are issued by the platform owner from /admin/vouchers
export default async function PartnerPage() {
  if (await getAdminSession()) redirect('/admin/vouchers');

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFDF8] p-4">
      <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Building2 className="h-6 w-6" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-slate-900">Đối Tác Studio &amp; In Thiệp</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Mã ưu đãi sảnh cưới 3D cho khách của studio do DamCuoiOnline phát hành. Studio muốn hợp tác vui lòng liên hệ
          đội ngũ DamCuoiOnline để nhận mã.
        </p>
        <div className="mt-6 space-y-2.5">
          <Link
            href="/admin/vouchers"
            className="block rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Đăng nhập quản trị
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-500 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
