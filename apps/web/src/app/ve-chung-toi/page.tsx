import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Cpu, Globe2, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';
import { INVITATION_TEMPLATES, VENUE_THEMES } from '@dco/shared';
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome';
import { JsonLd } from '@/components/seo/JsonLd';
import { BRAND_NAME, SITE_URL, buildBreadcrumbJsonLd, canonicalUrl } from '@/lib/seo';

const TITLE = 'Về DamCuoiOnline.vn — Nền Tảng Cưới Số & Sảnh 3D Việt';
const DESC =
  'Câu chuyện xây dựng DamCuoiOnline.vn: 100 mẫu thiệp cưới online lật sách 3D, 101 sảnh cưới 3D trên trình duyệt, LiveKit Voice Chat và cam kết VietQR 0% phí.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: canonicalUrl('/ve-chung-toi') },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: canonicalUrl('/ve-chung-toi'),
    title: TITLE,
    description: DESC,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESC,
    images: ['/opengraph-image'],
  },
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#FFFDF8] text-slate-900">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Trang chủ', path: '/' },
          { name: 'Về chúng tôi', path: '/ve-chung-toi' },
        ])}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: TITLE,
          url: canonicalUrl('/ve-chung-toi'),
          description: DESC,
          inLanguage: 'vi',
          mainEntity: {
            '@type': 'Organization',
            '@id': `${SITE_URL}/#organization`,
            name: BRAND_NAME,
            url: `${SITE_URL}/`,
          },
        }}
      />

      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-16">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-rose-700">
            <ArrowLeft className="h-3.5 w-3.5" /> Trang chủ
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-slate-800">Về chúng tôi</span>
        </nav>

        <h1 className="mt-5 font-serif text-3xl font-bold leading-tight text-slate-900 sm:text-5xl">
          Về DamCuoiOnline.vn — Công Nghệ Giữ Trọn Khoảnh Khắc Chung Vui
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          <strong>DamCuoiOnline.vn</strong> được xây dựng bởi đội ngũ kỹ sư phần mềm và nhà thiết kế đồ họa 3D tại Việt
          Nam với một mục tiêu rõ ràng: giúp các cặp đôi gửi lời mời trang trọng qua điện thoại và kết nối trọn vẹn ông
          bà, họ hàng, bạn bè đang sinh sống ở nhiều tỉnh thành hay nước ngoài vào cùng một không gian cưới ấm cúng.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm">
            <Cpu className="h-6 w-6 text-rose-700" />
            <h2 className="mt-3 font-serif text-xl font-bold text-slate-900">Kỹ thuật trình duyệt thực chiến</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Hệ thống sử dụng Next.js SSR, Three.js tối ưu khung hình trên di động, thuật toán kiểm tra lối đi BFS/A*
              trên lưới 60×60 Grid-Snap, chia sảnh tự động 60 CCU/sảnh và LiveKit SFU cho Voice Chat tách theo từng bàn
              tiệc (giảm nhạc nền -20dB và tiếng bàn -12dB khi MC phát biểu).
            </p>
          </div>

          <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm">
            <ShieldCheck className="h-6 w-6 text-emerald-700" />
            <h2 className="mt-3 font-serif text-xl font-bold text-slate-900">Minh bạch tài chính &amp; riêng tư tuyệt đối</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Chúng tôi không thu phí trung gian và không giữ hộ tiền mừng cưới. Hộp mừng VietQR chuyển thẳng 100% vào
              tài khoản ngân hàng của cô dâu chú rể; số tiền mừng được lọc bỏ hoàn toàn khỏi giao diện và API công khai,
              chỉ hiển thị cho chủ tiệc đã đăng nhập.
            </p>
          </div>

          <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm">
            <Globe2 className="h-6 w-6 text-amber-700" />
            <h2 className="mt-3 font-serif text-xl font-bold text-slate-900">
              {INVITATION_TEMPLATES.length} Mẫu Thiệp &amp; {VENUE_THEMES.length} Bối Cảnh 3D
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Từ Lễ Gia Tiên nhà ba gian, Rạp Lá Dừa Miền Tây, Phố Cổ Hội An đến các không gian quốc tế — kết hợp cùng{' '}
              {INVITATION_TEMPLATES.length} mẫu thiệp cưới online có sẵn album lật sách 3D và chứng nhận khắc ánh kim
              tương tác trực tiếp trên điện thoại.
            </p>
          </div>

          <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm">
            <HeartHandshake className="h-6 w-6 text-rose-700" />
            <h2 className="mt-3 font-serif text-xl font-bold text-slate-900">Chính sách dùng thử minh bạch</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Mọi cặp đôi đều được thiết kế bản nháp thiệp cưới miễn phí, dạo thử Quảng Trường 3D 24/7 và dùng thử phòng
              cưới 24 giờ trước khi quyết định nâng cấp. Xem chi tiết tại{' '}
              <Link href="/bang-gia" className="font-bold text-rose-700 underline underline-offset-2">
                Bảng giá niêm yết
              </Link>
              ,{' '}
              <Link href="/chinh-sach-bao-mat" className="font-bold text-rose-700 underline underline-offset-2">
                Chính sách bảo mật
              </Link>{' '}
              và{' '}
              <Link href="/dieu-khoan-su-dung" className="font-bold text-rose-700 underline underline-offset-2">
                Điều khoản sử dụng
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/thiep-cuoi"
            className="inline-flex min-h-[46px] items-center gap-1.5 rounded-full bg-rose-700 px-6 text-sm font-bold text-white shadow hover:bg-rose-800"
          >
            <Sparkles className="h-4 w-4" /> Xem 100 mẫu thiệp cưới <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/khong-gian"
            className="inline-flex min-h-[46px] items-center rounded-full border border-rose-200 bg-white px-5 text-sm font-bold text-rose-800 hover:bg-rose-50"
          >
            Khám phá 101 sảnh cưới 3D
          </Link>
          <Link
            href="/lien-he"
            className="inline-flex min-h-[46px] items-center rounded-full border border-amber-300 bg-amber-50 px-5 text-sm font-bold text-amber-950 hover:bg-amber-100"
          >
            Liên hệ đội ngũ hỗ trợ
          </Link>
        </div>
      </div>
    </main>
    <SiteFooter />
    </>
  );
}
