import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { VENUE_THEMES } from '@dco/shared';
import { VenueGallery } from '@/components/venues/VenueGallery';
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd, canonicalUrl, venueSlug } from '@/lib/seo';

const PAGE_TITLE = `${VENUE_THEMES.length} Không Gian Sảnh Cưới 3D — DamCuoiOnline.vn`;
const PAGE_DESC =
  'Từ lễ gia tiên nhà ba gian, phố cổ Hội An đến đền Thần đạo Nhật Bản, mandap Ấn Độ hay đồi cát Sahara: xem trước sảnh cưới 3D ngay trên trình duyệt.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: canonicalUrl('/khong-gian') },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: canonicalUrl('/khong-gian'),
    title: PAGE_TITLE,
    description: PAGE_DESC,
    images: [{ url: '/venues/vn_hoi_an.webp?v=3', width: 640, height: 400, alt: PAGE_TITLE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESC,
    images: ['/venues/vn_hoi_an.webp?v=3'],
  },
};

export default function VenueGalleryPage() {
  const vietnamCount = VENUE_THEMES.filter((v) => v.region === 'VIETNAM').length;
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#FFFDF8]">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Trang chủ', path: '/' },
          { name: 'Không gian cưới 3D', path: '/khong-gian' },
        ])}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: PAGE_TITLE,
          url: canonicalUrl('/khong-gian'),
          description: PAGE_DESC,
          inLanguage: 'vi',
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: VENUE_THEMES.length,
            itemListElement: VENUE_THEMES.slice(0, 24).map((v, idx) => ({
              '@type': 'ListItem',
              position: idx + 1,
              name: v.nameVi,
              url: canonicalUrl(`/khong-gian/${venueSlug(v.id)}`),
            })),
          },
        }}
      />
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-14">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-rose-700">
          <ArrowLeft className="h-3.5 w-3.5" /> Trang chủ
        </Link>
        <h1 className="mt-5 max-w-3xl text-balance font-serif text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
          {VENUE_THEMES.length} Không Gian Cưới Từ Việt Nam Đến Khắp Thế Giới
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          {vietnamCount} mẫu Việt Nam và {VENUE_THEMES.length - vietnamCount} mẫu quốc tế. Xoay và phóng gần toàn sảnh 3D, hoặc mở ảnh tham chiếu để đối chiếu.
        </p>
        <div className="mt-8">
          <VenueGallery venues={VENUE_THEMES} />
        </div>

        <section aria-label="Giải đáp về sảnh cưới 3D" className="mt-16 border-t border-amber-200/80 pt-12">
          <h2 className="font-serif text-2xl font-bold text-slate-900 sm:text-3xl">
            Câu hỏi thường gặp về Sảnh Cưới 3D trực tuyến
          </h2>
          <dl className="mt-6 grid gap-5 md:grid-cols-2">
            {[
              {
                q: 'Khách mời lớn tuổi hoặc ở nước ngoài có cần cài ứng dụng không?',
                a: 'Không cần cài app. Khách chỉ cần bấm vào đường dẫn mời trên Safari (iPhone), Chrome (Android) hoặc máy tính là bước thẳng vào không gian cưới 3D trong khoảng 5 giây.',
              },
              {
                q: 'Sảnh cưới 3D chứa được bao nhiêu khách cùng lúc?',
                a: 'Máy chủ tự động phân chia sảnh mượt mà với 60 khách đồng thời (CCU) mỗi sảnh, giữ khung hình ổn định trên điện thoại và hỗ trợ tới 300 CCU ở gói Viên Mãn VIP.',
              },
              {
                q: 'Âm thanh Voice Chat có bị ồn khi đông khách không?',
                a: 'Không. Khách đi dạo nghe nhạc nền dịu nhẹ và chỉ kết nối Voice Chat LiveKit khi ngồi xuống cùng bàn tiệc. Khi MC bật mic sân khấu, nhạc nền tự giảm -20dB và tiếng các bàn giảm -12dB.',
              },
              {
                q: 'Cô Dâu Chú Rể đang làm lễ ngoài nhà hàng thì ai đón khách trong sảnh 3D?',
                a: 'Chế độ Dual-Mode Auto-NPC tự động cho nhân vật Cô Dâu Chú Rể đứng đón và chạy đúng lịch trình nghi thức. Bất cứ lúc nào rảnh tay, bạn chỉ cần bấm 1 nút để nhập vai trò chuyện trực tiếp với bà con phương xa.',
              },
            ].map((item) => (
              <div key={item.q} className="rounded-2xl border border-amber-200/80 bg-white p-5 shadow-sm">
                <dt className="font-serif text-lg font-bold text-slate-900">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold text-rose-800">
            <Link href="/huong-dan/dam-cuoi-online-3d" className="rounded-full bg-rose-50 px-4 py-2 ring-1 ring-rose-200 hover:bg-rose-100">
              Xem hướng dẫn tổ chức Đám Cưới Online 3D →
            </Link>
            <Link href="/thiep-cuoi" className="rounded-full bg-white px-4 py-2 ring-1 ring-amber-300 text-slate-800 hover:bg-amber-50">
              Xem 100 mẫu Thiệp Cưới Online →
            </Link>
          </div>
        </section>
      </div>
    </main>
    <SiteFooter />
    </>
  );
}
