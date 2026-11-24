import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, Clock } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { PUBLISHED_GUIDES } from '@/lib/guides';
import { buildBreadcrumbJsonLd, canonicalUrl } from '@/lib/seo';

const TITLE = 'Cẩm Nang Thiệp Cưới Online & Cưới 3D — DamCuoiOnline.vn';
const DESC =
  'Hướng dẫn thực tế cho cặp đôi Việt: cách tạo thiệp cưới online gửi Zalo, cài hộp mừng VietQR bảo mật, tổ chức tiệc 3D Hybrid và so sánh chi phí.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: canonicalUrl('/huong-dan') },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: canonicalUrl('/huong-dan'),
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

export default function GuidesHubPage() {
  return (
    <main className="min-h-screen bg-[#FFFDF8] text-slate-900">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Trang chủ', path: '/' },
          { name: 'Cẩm nang & Hướng dẫn', path: '/huong-dan' },
        ])}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: TITLE,
          url: canonicalUrl('/huong-dan'),
          description: DESC,
          inLanguage: 'vi',
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: PUBLISHED_GUIDES.length,
            itemListElement: PUBLISHED_GUIDES.map((g, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: g.title,
              url: canonicalUrl(g.href),
            })),
          },
        }}
      />

      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-6 sm:py-16">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-rose-700">
            <ArrowLeft className="h-3.5 w-3.5" /> Trang chủ
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-slate-800">Cẩm nang &amp; Hướng dẫn</span>
        </nav>

        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1 text-xs font-bold text-rose-800">
          <BookOpen className="h-3.5 w-3.5" /> Kiến thức tổ chức cưới số thực tế
        </div>
        <h1 className="mt-4 max-w-3xl font-serif text-3xl font-bold leading-tight text-slate-900 sm:text-5xl">
          Cẩm Nang Thiệp Cưới Online, Mừng Cưới VietQR &amp; Sảnh Cưới 3D
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
          Tổng hợp hướng dẫn chi tiết từng bước giúp cô dâu chú rể tiết kiệm thời gian chuẩn bị, gửi thiệp cá nhân hóa
          tới từng vị khách qua Zalo/Facebook và kết nối trọn vẹn người thân ở xa trong ngày trọng đại.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {PUBLISHED_GUIDES.map((guide) => (
            <article
              key={guide.slug}
              className="group flex flex-col justify-between rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-900 ring-1 ring-amber-200">
                    {guide.category}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {guide.readingTimeMin} phút đọc
                  </span>
                </div>
                <h2 className="mt-4 font-serif text-2xl font-bold leading-snug text-slate-900 group-hover:text-rose-800">
                  <Link href={guide.href}>{guide.title}</Link>
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{guide.description}</p>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-amber-100 pt-4 text-xs">
                <time dateTime={guide.updatedAt} className="text-slate-500">
                  Cập nhật {guide.updatedAt.split('-').reverse().join('/')}
                </time>
                <Link
                  href={guide.href}
                  className="inline-flex items-center gap-1 font-bold text-rose-700 hover:underline"
                >
                  Đọc hướng dẫn <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-14 rounded-3xl border border-rose-200/80 bg-gradient-to-br from-rose-50/70 via-white to-amber-50/60 p-7 sm:p-9">
          <h2 className="font-serif text-2xl font-bold text-rose-950 sm:text-3xl">
            Bắt đầu thử trực tiếp — hoàn toàn miễn phí bản nháp
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-700">
            Bạn có thể xem toàn bộ 100 mẫu thiệp cưới online, dạo thử 101 không gian cưới 3D hoặc mở Quảng Trường 24/7
            ngay trên trình duyệt mà không cần cài ứng dụng.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/thiep-cuoi"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-rose-700 px-5 text-sm font-bold text-white shadow-sm hover:bg-rose-800"
            >
              Xem 100 mẫu thiệp cưới <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/khong-gian"
              className="inline-flex min-h-[44px] items-center rounded-full border border-rose-200 bg-white px-5 text-sm font-bold text-rose-800 hover:bg-rose-50"
            >
              Khám phá 101 sảnh cưới 3D
            </Link>
            <Link
              href="/plaza"
              className="inline-flex min-h-[44px] items-center rounded-full border border-amber-300 bg-amber-50 px-5 text-sm font-bold text-amber-950 hover:bg-amber-100"
            >
              Vào Quảng Trường 24/7
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
