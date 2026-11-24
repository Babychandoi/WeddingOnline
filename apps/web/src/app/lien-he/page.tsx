import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Clock, HeartHandshake, Mail, ShieldCheck } from 'lucide-react';
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd, canonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Liên Hệ & Hỗ Trợ — DamCuoiOnline.vn',
  description:
    'Kênh hỗ trợ kỹ thuật, tư vấn thiết kế thiệp cưới online và tổ chức sảnh cưới 3D trực tuyến của DamCuoiOnline.vn. Phản hồi nhanh trong ngày cưới.',
  alternates: { canonical: canonicalUrl('/lien-he') },
  openGraph: {
    title: 'Liên Hệ & Hỗ Trợ — DamCuoiOnline.vn',
    description:
      'Hỗ trợ thiết kế thiệp cưới online, tích hợp VietQR SePay và vận hành sảnh cưới 3D tại DamCuoiOnline.vn.',
    url: canonicalUrl('/lien-he'),
  },
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#FFFDF8] text-slate-900">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Trang chủ', path: '/' },
          { name: 'Liên hệ & Hỗ trợ', path: '/lien-he' },
        ])}
      />
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-rose-700"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại Trang chủ
        </Link>

        <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Liên Hệ &amp; Hỗ Trợ Cặp Đôi
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Đội ngũ <strong>DamCuoiOnline.vn</strong> luôn đồng hành cùng Cô Dâu, Chú Rể từ khâu chọn mẫu thiệp, cấu
          hình hộp mừng cưới VietQR cho đến lúc diễn ra buổi lễ trong sảnh cưới 3D.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
            <Mail className="h-6 w-6 text-rose-700" />
            <h2 className="mt-3 font-serif text-xl font-bold text-slate-900">Hỗ trợ qua Email</h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Giải đáp kích hoạt gói, hỗ trợ kỹ thuật SePay/VietQR, chỉnh sửa thiệp hoặc yêu cầu xóa dữ liệu:
            </p>
            <a
              href="mailto:hotro@damcuoionline.vn"
              className="mt-3 inline-block font-bold text-rose-700 underline underline-offset-4 hover:text-rose-800"
            >
              hotro@damcuoionline.vn
            </a>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
            <Clock className="h-6 w-6 text-amber-700" />
            <h2 className="mt-3 font-serif text-xl font-bold text-slate-900">Giờ làm việc &amp; Trực lễ</h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Thứ 2 – Chủ Nhật: <strong>08:00 – 22:00 (GMT+7)</strong>.
            </p>
            <p className="mt-1.5 text-xs text-slate-500">
              Ưu tiên hỗ trợ tức thì cho các phòng cưới gói Hạnh Phúc &amp; Viên Mãn VIP trong ngày tổ chức lễ.
            </p>
          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-amber-200/80 bg-amber-50/50 p-6 text-sm leading-relaxed text-slate-700">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <HeartHandshake className="h-5 w-5 text-rose-700" />
            <span>Thông tin vận hành chính thức</span>
          </div>
          <p className="mt-2">
            Hệ thống <strong>DamCuoiOnline.vn</strong> hiện vận hành trực tiếp qua máy chủ HTTPS có chứng chỉ bảo mật
            TLS 1.3. Mọi gói dịch vụ và tính năng đều có thể kiểm tra trực tiếp trước khi thanh toán tại{' '}
            <Link href="/thiep-cuoi" className="font-semibold text-rose-700 underline underline-offset-2">
              100 mẫu thiệp cưới online
            </Link>{' '}
            và{' '}
            <Link href="/khong-gian" className="font-semibold text-rose-700 underline underline-offset-2">
              101 không gian cưới 3D
            </Link>
            .
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
            <Link href="/chinh-sach-bao-mat" className="inline-flex items-center gap-1 hover:text-rose-700 hover:underline">
              <ShieldCheck className="h-3.5 w-3.5" /> Chính sách bảo mật
            </Link>
            <Link href="/dieu-khoan-su-dung" className="hover:text-rose-700 hover:underline">
              Điều khoản sử dụng
            </Link>
          </div>
        </section>
      </div>
    </main>
    <SiteFooter />
    </>
  );
}
