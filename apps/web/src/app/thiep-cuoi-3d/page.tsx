import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Compass, ImagePlus, Navigation, Sparkles, Volume2 } from 'lucide-react';
import { INVITATION_3D_PLANS, INVITATION_3D_TEMPLATES, TIER_CATALOG } from '@dco/shared';
import { CardFace } from '@/components/invitation/CardFace';
import { SAMPLE_COUPLE } from '@/components/invitation/sampleInvitation';
import { Template3DGallery } from '@/components/invitation/walkthrough3d/Template3DGallery';
import { LiquidMetalButton, SparkBadgePill } from '@/components/threeui/LiquidMetalButton';
import { WeddingHeroAtmosphere } from '@/components/threeui/WeddingHeroAtmosphere';
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd, canonicalUrl } from '@/lib/seo';

const PAGE_TITLE = '100 Bộ Thiệp Cưới 3D Dạo Bước Tương Tác — DamCuoiOnline.vn';
const PAGE_DESC =
  'Trải nghiệm 100 bộ thiệp cưới 3D toàn màn hình với 8 kiểu bay camera điện ảnh, 6 bố cục triển lãm 3D, 8 kiểu khung nghệ thuật, xem cận cảnh kỷ niệm và pháo hoa lễ đài. Giá 199.000đ/tháng hoặc 799.000đ trọn đời.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: canonicalUrl('/thiep-cuoi-3d') },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: canonicalUrl('/thiep-cuoi-3d'),
    title: PAGE_TITLE,
    description: PAGE_DESC,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: PAGE_TITLE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESC,
    images: ['/opengraph-image'],
  },
};

const HIGHLIGHTS = [
  {
    icon: Navigation,
    title: 'Chuyển cảnh camera đa góc điện ảnh',
    text: 'Chạm < / > hoặc Tự dẫn để camera bay uốn lượn mượt mà từ Cổng cưới, ngang qua Cô dâu chú rể, xoay góc vào Giá vẽ Lời chào, lướt qua từng khung ảnh Kỷ niệm 1/6..6/6 rồi tiến lên Lễ đài.',
  },
  {
    icon: Compass,
    title: 'Cần điều khiển đi dạo tự do 360°',
    text: 'Khách có thể dùng cần điều khiển quả cầu vàng ở góc trái hoặc chạm vuốt để tự đi dạo, xoay nhìn cây liễu rủ, hoa đăng và không gian 360° bất kỳ lúc nào.',
  },
  {
    icon: ImagePlus,
    title: 'Ảnh đôi tách nền & Giá vẽ Lời chào riêng',
    text: 'Tải ảnh cô dâu chú rể đứng chào khách theo tên từng người (?khach=Quốc+Bảo); giá vẽ Lời chào tự in thiệp đỏ-vàng kim trang trọng.',
  },
  {
    icon: Volume2,
    title: 'Nhạc cưới tích hợp, RSVP & VietQR 0% phí',
    text: 'Nút nhạc bật/tắt gọn gàng trên màn hình 3D; giữ nguyên lịch lễ âm dương, chỉ đường, xác nhận tham dự, sổ lời chúc và hộp mừng VietQR ẩn số tiền.',
  },
];

export default function Invitation3DGalleryPage() {
  const minPrice = Math.min(...INVITATION_3D_PLANS.map((p) => p.priceVnd));
  const maxPrice = Math.max(...INVITATION_3D_PLANS.map((p) => p.priceVnd));

  const catalogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: PAGE_TITLE,
    url: canonicalUrl('/thiep-cuoi-3d'),
    description: PAGE_DESC,
    inLanguage: 'vi',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: INVITATION_3D_TEMPLATES.length,
      itemListElement: INVITATION_3D_TEMPLATES.slice(0, 24).map((t, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: t.nameVi,
        url: canonicalUrl(`/thiep-cuoi/${t.id}`),
      })),
    },
  };

  const offerJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Thiệp Cưới 3D Dạo Bước Tương Tác DamCuoiOnline.vn (100 Chủ Đề)',
    description: PAGE_DESC,
    url: canonicalUrl('/thiep-cuoi-3d'),
    image: canonicalUrl('/opengraph-image'),
    brand: { '@type': 'Brand', name: 'DamCuoiOnline.vn' },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'VND',
      lowPrice: String(minPrice),
      highPrice: String(maxPrice),
      offerCount: String(INVITATION_3D_PLANS.length),
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#FFFDF8] text-slate-900">
        <JsonLd
          data={buildBreadcrumbJsonLd([
            { name: 'Trang chủ', path: '/' },
            { name: 'Thiệp cưới 3D', path: '/thiep-cuoi-3d' },
          ])}
        />
        <JsonLd data={catalogJsonLd} />
        <JsonLd data={offerJsonLd} />

        {/* Hero Banner */}
        <section className="relative overflow-hidden border-b border-amber-200/80 bg-gradient-to-br from-[#171b42] via-[#281c45] to-[#4f1731] text-white">
          <WeddingHeroAtmosphere mood="constellation" tone="crimson" />
          <div className="relative z-10 mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-16">
            <Link href="/" className="inline-flex min-h-[40px] items-center gap-1.5 text-sm font-bold text-amber-200/90 hover:text-amber-100">
              <ArrowLeft className="h-4 w-4" /> Trang chủ
            </Link>

            <div className="mt-5 grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <SparkBadgePill>100 Bộ Thiệp Cưới 3D Độc Quyền · 199k/tháng · 799k trọn đời</SparkBadgePill>
                <h1 className="mt-4 font-serif text-4xl font-bold leading-[1.08] tracking-tight text-[#fae4b5] sm:text-6xl">
                  100 Không Gian Thiệp Cưới 3D Chuyển Cảnh Điện Ảnh
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-amber-50/90 sm:text-lg">
                  Tách biệt hoàn toàn khỏi dòng thiệp 2D: <strong>9 chủ đề văn hóa &amp; thiên nhiên</strong>, <strong>8 kiểu bay camera</strong> (bay cánh hạc, xoay vanxơ, nấc thang mây, ống kính dolly, rước lễ cung đình), <strong>6 bố cục sân tròn / đảo nổi / bậc thang</strong> và pháo hoa chúc mừng trên lễ đài.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <LiquidMetalButton href="/thiep-cuoi-3d/tao" variant="gold" className="min-h-[52px] rounded-full px-7 text-base text-slate-950">
                    <Sparkles className="h-4 w-4 text-rose-700" /> Tạo thiệp 3D miễn phí
                  </LiquidMetalButton>
                  <Link
                    href="/thiep-cuoi/3d-ho-sen-hoa-dang?khach=Qu%E1%BB%91c+B%E1%BA%A3o"
                    className="inline-flex min-h-[52px] items-center gap-2 rounded-full border border-amber-200/45 bg-white/10 px-6 text-sm font-bold text-amber-100 backdrop-blur transition hover:bg-white/20"
                  >
                    Xem thử Hồ Sen Hoa Đăng <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="mx-auto grid w-full max-w-[360px] grid-cols-2 gap-3">
                {['3d-ho-sen-hoa-dang', '3d-co-truyen'].map((id) => (
                  <Link
                    key={id}
                    href={`/thiep-cuoi/${id}?khach=Qu%E1%BB%91c+B%E1%BA%A3o`}
                    className="group overflow-hidden rounded-2xl border border-amber-300/45 shadow-2xl transition hover:-translate-y-1"
                  >
                    <CardFace templateId={id as typeof INVITATION_3D_TEMPLATES[number]['id']} groom={SAMPLE_COUPLE.groomName} bride={SAMPLE_COUPLE.brideName} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-16">
          {/* 4 Highlights */}
          <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-amber-200/80 bg-white p-5 shadow-sm">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <dt className="mt-3 font-serif text-lg font-bold text-slate-900">{item.title}</dt>
                  <dd className="mt-1.5 text-xs leading-relaxed text-slate-600">{item.text}</dd>
                </div>
              );
            })}
          </dl>

          {/* 100 3D Themes Filterable Collection Grid */}
          <section id="mau-thiep-3d" className="mt-16 scroll-mt-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-3xl font-bold text-rose-950 sm:text-4xl">
                  {INVITATION_3D_TEMPLATES.length} Bộ Thiệp Cưới 3D Tương Tác
                </h2>
                <p className="mt-2 max-w-2xl text-[15px] text-slate-600">
                  Lọc theo 9 chủ đề không gian (Cổ đô, Vườn hoa, Biển đảo, Rừng núi, Hồ nước, Cổ tích ngân hà, Lâu đài, Điện ảnh, Rooftop) hoặc tìm nhanh ý tưởng của hai bạn.
                </p>
              </div>
              <Link
                href="/thiep-cuoi"
                className="inline-flex min-h-[40px] items-center rounded-full border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Tìm mẫu 2D gọn nhẹ (từ 99k)? Xem 100 mẫu 2D →
              </Link>
            </div>

            <div className="mt-8">
              <Template3DGallery />
            </div>
          </section>

          {/* 3D Pricing Section */}
          <section id="bang-gia-3d" className="mt-20 scroll-mt-6 border-t border-amber-200/80 pt-14">
            <h2 className="font-serif text-3xl font-bold text-rose-950 sm:text-4xl">Bảng giá Thiệp Cưới 3D</h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-700">
              Giá gói Thiệp Cưới 3D phản ánh công nghệ dựng cảnh WebGL 360°, chuyển cảnh camera đa góc và cá nhân hóa standee/lời chào. Thiết kế nháp miễn phí; chỉ trả phí khi phát hành cho khách.
            </p>
            <ul className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-2">
              {INVITATION_3D_PLANS.map((p) => (
                <li
                  key={p.id}
                  className={`rounded-2xl border bg-white p-6 ${p.id === 'life' ? 'border-rose-700 ring-2 ring-rose-200' : 'border-amber-200'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold uppercase tracking-wide text-rose-800">{p.nameVi}</p>
                    {p.id === 'life' && (
                      <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">Lưu mãi mãi</span>
                    )}
                  </div>
                  <p className="mt-2 text-3xl font-black tabular-nums text-slate-900">{p.priceVnd.toLocaleString('vi-VN')}đ</p>
                  <p className="mt-1.5 text-xs text-slate-600">
                    {p.months === null
                      ? 'Lưu giữ không gian 3D & lời chúc mãi mãi (kèm 100 mẫu 2D)'
                      : 'Cho đám cưới sắp diễn ra · gia hạn linh hoạt (kèm 100 mẫu 2D)'}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-slate-600">
              Đã mua {TIER_CATALOG.HAPPINESS.nameVi} ({TIER_CATALOG.HAPPINESS.priceVnd.toLocaleString('vi-VN')}đ) hoặc {TIER_CATALOG.VIP_FULFILLMENT.nameVi} ({TIER_CATALOG.VIP_FULFILLMENT.priceVnd.toLocaleString('vi-VN')}đ) cho Sảnh Cưới 3D? Thiệp Cưới 3D đã bao gồm sẵn trong gói.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
