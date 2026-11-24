import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { INVITATION_2D_PLANS, INVITATION_2D_TEMPLATES, TIER_CATALOG } from '@dco/shared';
import { CardFace } from '@/components/invitation/CardFace';
import { TemplateGallery } from '@/components/invitation/TemplateGallery';
import { SAMPLE_COUPLE } from '@/components/invitation/sampleInvitation';
import { EngravedWeddingCertificate } from '@/components/threeui/EngravedWeddingCertificate';
import { LiquidMetalButton, SparkBadgePill } from '@/components/threeui/LiquidMetalButton';
import { WeddingHeroAtmosphere } from '@/components/threeui/WeddingHeroAtmosphere';
import { FannedInvitationDeck, StyleAccordionShowcase } from '@/components/motion/ShowcaseMotion';
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd, canonicalUrl } from '@/lib/seo';

const PAGE_TITLE = `${INVITATION_2D_TEMPLATES.length} Mẫu Thiệp Cưới Online 2D — DamCuoiOnline.vn`;
const PAGE_DESC = `${INVITATION_2D_TEMPLATES.length} mẫu thiệp cưới online 2D mở phong bì ghi tên từng khách, ngày âm lịch, album lật sách, xác nhận tham dự, sổ lời chúc và hộp mừng VietQR.`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: canonicalUrl('/thiep-cuoi') },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: canonicalUrl('/thiep-cuoi'),
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

const FEATURES: Array<{ title: string; text: string }> = [
  { title: 'Phong bì ghi tên từng khách', text: 'Mỗi người nhận một đường dẫn riêng, mở ra là thấy “Kính mời” kèm tên mình.' },
  { title: 'Ngày dương và âm lịch', text: 'Tự đổi sang âm lịch, đếm ngược đến giờ làm lễ, lưu vào lịch điện thoại một chạm.' },
  { title: 'Xác nhận tham dự', text: 'Khách báo có đến, đi mấy người, ăn chay hay không. Cô dâu chú rể xem danh sách riêng.' },
  { title: 'Sổ lời chúc', text: 'Không cần đăng nhập, ai cũng gửi được lời chúc lên bức tường của thiệp.' },
  { title: 'Hộp mừng cưới VietQR', text: 'Tiền vào thẳng tài khoản cô dâu chú rể; SePay xác nhận tự động; số tiền không bao giờ hiện công khai.' },
  { title: 'Sảnh cưới 3D đi kèm', text: 'Khách ở xa bước vào sảnh cưới 3D ngay trên điện thoại để cùng chung vui.' },
];

export default function InvitationGalleryPage() {
  const minPrice = Math.min(...INVITATION_2D_PLANS.map((p) => p.priceVnd));
  const maxPrice = Math.max(...INVITATION_2D_PLANS.map((p) => p.priceVnd));
  const catalogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: PAGE_TITLE,
    url: canonicalUrl('/thiep-cuoi'),
    description: PAGE_DESC,
    inLanguage: 'vi',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: INVITATION_2D_TEMPLATES.length,
      itemListElement: INVITATION_2D_TEMPLATES.slice(0, 24).map((t, idx) => ({
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
    name: 'Thiệp Cưới Online 2D DamCuoiOnline.vn (100 Mẫu Thiết Kế)',
    description: PAGE_DESC,
    url: canonicalUrl('/thiep-cuoi'),
    image: canonicalUrl('/opengraph-image'),
    brand: { '@type': 'Brand', name: 'DamCuoiOnline.vn' },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'VND',
      lowPrice: String(minPrice),
      highPrice: String(maxPrice),
      offerCount: String(INVITATION_2D_PLANS.length),
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
          { name: 'Thiệp cưới 2D', path: '/thiep-cuoi' },
        ])}
      />
      <JsonLd data={catalogJsonLd} />
      <JsonLd data={offerJsonLd} />
      <div className="relative overflow-hidden border-b border-amber-200/70">
        <WeddingHeroAtmosphere mood="koi" tone="light" />
        <div className="relative z-10 mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
          <Link href="/" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-rose-700">
            <ArrowLeft className="h-4 w-4" /> Trang chủ
          </Link>

          <div className="mt-4 grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <SparkBadgePill>100 Mẫu Thiệp Cưới 2D · Lật Sách 3D · Từ 99.000đ</SparkBadgePill>
              <h1 className="mt-4 max-w-[16ch] text-balance font-serif text-[2.6rem] font-bold leading-[1.05] tracking-[-0.02em] text-rose-950 sm:text-6xl">
                Thiệp cưới online 2D, mở ra như thiệp thật
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-700 sm:text-lg">
                Chọn một trong {INVITATION_2D_TEMPLATES.length} mẫu thiệp 2D, điền tên hai bên gia đình, giờ làm lễ và địa điểm. Gửi qua Zalo hay Facebook, khách chạm để mở phong bì có ghi tên mình. Thiết kế và xem trước miễn phí, phát hành từ 99.000đ/tháng hoặc 599.000đ trọn đời.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <LiquidMetalButton href="/thiep-cuoi/tao" variant="crimson" className="min-h-[52px] rounded-full px-7 text-base">
                  Thiết kế thiệp 2D ngay
                </LiquidMetalButton>
                <a href="#mau-thiep" className="inline-flex min-h-[52px] items-center rounded-full bg-white/80 px-6 text-base font-bold text-rose-900 ring-1 ring-rose-900/25 backdrop-blur-sm hover:ring-rose-900/60">
                  Xem {INVITATION_2D_TEMPLATES.length} mẫu thiệp
                </a>
                <Link href="/thiep-cuoi-3d" className="inline-flex min-h-[52px] items-center gap-1.5 rounded-full bg-amber-100/90 px-5 text-sm font-bold text-amber-950 ring-1 ring-amber-300 hover:bg-amber-200/80">
                  <Sparkles className="h-4 w-4 text-rose-700" /> Xem Thiệp Cưới 3D riêng →
                </Link>
              </div>
            </div>

            {/* Gesso-inspired 7-card interactive fanned deck reacting to hover & scroll */}
            <FannedInvitationDeck compact className="mt-4 lg:mt-0" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-16">
        {/* Moonart-inspired 4-style interactive horizontal accordion */}
        <StyleAccordionShowcase />

        {/* ThreeUI Engraved Certificate VIP Showcase */}
        <section className="mb-14 grid items-center gap-8 rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-rose-50/50 p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SparkBadgePill>Mới · Hiệu ứng ThreeUI</SparkBadgePill>
            <h2 className="mt-3 font-serif text-3xl font-bold text-rose-950">
              Chứng nhận khắc ánh kim 3D &amp; Album lật trang
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">
              Mỗi tấm thiệp cưới đều tích hợp sẵn <strong>tấm chứng nhận khắc guilloché ánh kim</strong> nghiêng theo tay/chuột và chế độ <strong>lật trang sổ ảnh 3D</strong> mượt mà cho khách thưởng thức.
            </p>
          </div>
          <EngravedWeddingCertificate
            groomName={SAMPLE_COUPLE.groomName}
            brideName={SAMPLE_COUPLE.brideName}
            weddingDate={SAMPLE_COUPLE.weddingDate}
            subtitle="Thiệp Mời Khắc Ánh Kim VIP"
            venueLabel="DamCuoiOnline.vn"
            compact
          />
        </section>

        <dl className="grid gap-x-10 gap-y-7 border-t border-rose-900/10 pt-10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <dt className="text-lg font-bold text-rose-950">{f.title}</dt>
              <dd className="mt-1.5 text-[15px] leading-relaxed text-slate-700">{f.text}</dd>
            </div>
          ))}
        </dl>

        {/* Pricing: designing is free, publishing takes a 2D plan */}
        <section id="bang-gia" className="mt-20 scroll-mt-6">
          <h2 className="font-serif text-3xl font-bold text-rose-950 sm:text-4xl">Bảng giá thiệp cưới 2D</h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-700">
            Chọn mẫu, điền nội dung, tải ảnh và xem trước hoàn toàn miễn phí, mọi thứ được lưu nháp. Chỉ khi muốn gửi thiệp 2D cho khách mới cần chọn gói phát hành. Muốn làm <Link href="/thiep-cuoi-3d" className="font-bold text-rose-700 underline underline-offset-4">Thiệp Cưới 3D Dạo Bước Tương Tác</Link>? Giá 199.000đ/tháng hoặc 799.000đ trọn đời.
          </p>
          <ul className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-2">
            {INVITATION_2D_PLANS.map((p) => (
              <li key={p.id} className={`rounded-2xl border bg-white p-6 ${p.id === 'life' ? 'border-rose-700 ring-2 ring-rose-200' : 'border-rose-900/15'}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold uppercase tracking-wide text-rose-800">{p.nameVi}</p>
                  {p.id === 'life' && (
                    <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">Lưu mãi mãi</span>
                  )}
                </div>
                <p className="mt-2 text-3xl font-black tabular-nums text-slate-900">{p.priceVnd.toLocaleString('vi-VN')}đ</p>
                <p className="mt-1.5 text-xs text-slate-600">
                  {p.months === null ? 'Giữ thiệp, album ảnh và lời chúc mãi mãi' : 'Cho đám cưới sắp diễn ra · gia hạn linh hoạt'}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-slate-600">
            Đã mua {TIER_CATALOG.HAPPINESS.nameVi} hoặc {TIER_CATALOG.VIP_FULFILLMENT.nameVi} cho sảnh cưới 3D? Thiệp cưới online đã có sẵn trong gói, không cần mua thêm.
          </p>
        </section>

        {/* Cross-promo banner for dedicated 3D Invitations section */}
        <section className="mt-16 rounded-3xl border border-amber-300/80 bg-gradient-to-br from-[#1f2354] via-[#2b2050] to-[#4b1a3a] p-6 text-white shadow-lg sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-300/20 px-3 py-1 text-xs font-bold text-amber-200 ring-1 ring-amber-300/40">
                <Sparkles className="h-3.5 w-3.5" /> Dòng cao cấp tách riêng
              </span>
              <h2 className="mt-3 font-serif text-3xl font-bold text-[#fae4b5] sm:text-4xl">
                Thiệp Cưới 3D Dạo Bước &amp; Chuyển Cảnh Camera
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-amber-50/90 sm:text-base">
                Không gian 3D toàn màn hình với 100 chủ đề độc quyền: khách đi qua cổng kiến trúc 3D, gặp cô dâu chú rể vẫy chào theo tên riêng, trải nghiệm 8 kiểu bay camera điện ảnh, 6 bố cục triển lãm kỷ niệm và bắn pháo hoa chúc mừng trên lễ đài.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/thiep-cuoi-3d"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-amber-300 px-6 text-sm font-black text-slate-950 shadow-lg transition hover:bg-amber-200"
              >
                Khám phá 100 Bộ Thiệp 3D <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/thiep-cuoi-3d/tao"
                className="inline-flex min-h-[48px] items-center rounded-full border border-amber-200/45 bg-white/10 px-5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                Tạo thiệp 3D ngay
              </Link>
            </div>
          </div>
        </section>

        <section id="mau-thiep" className="mt-20 scroll-mt-6">
          <h2 className="font-serif text-3xl font-bold text-rose-950 sm:text-4xl">{INVITATION_2D_TEMPLATES.length} mẫu thiệp 2D</h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-700">
            Bấm vào một mẫu để mở thiệp mẫu đầy đủ. Đổi mẫu bất cứ lúc nào, nội dung vẫn giữ nguyên.
          </p>
          <div className="mt-8">
            <TemplateGallery />
          </div>
        </section>

        {/* SXO & GEO Answer-First Q&A section */}
        <section id="hoi-dap" className="mt-20 border-t border-rose-900/10 pt-14">
          <h2 className="font-serif text-3xl font-bold text-rose-950 sm:text-4xl">
            Câu hỏi thường gặp về thiệp cưới online
          </h2>
          <dl className="mt-8 grid gap-5 md:grid-cols-2">
            {[
              {
                q: 'Tạo thiệp cưới online trên DamCuoiOnline.vn có mất phí trước không?',
                a: 'Hoàn toàn miễn phí ở bước thiết kế và xem trước: bạn được chọn trong 100 mẫu, nhập đầy đủ nội dung, tải ảnh cưới và kiểm tra trên điện thoại. Chỉ khi muốn phát hành gửi cho khách mới cần chọn gói 99.000đ/tháng hoặc 599.000đ trọn đời.',
              },
              {
                q: 'Chỉ tổ chức tiệc cưới ngoài đời, không dùng Sảnh 3D có mua thiệp được không?',
                a: 'Có. Thiệp cưới online hoạt động độc lập, đầy đủ phong bì ghi tên từng khách, lịch âm, Google Maps, album lật sách 3D, RSVP, sổ lời chúc và hộp mừng VietQR mà không bắt buộc phải mở sảnh 3D.',
              },
              {
                q: 'Tiền mừng cưới qua mã VietQR có bị trừ phí hay lộ số tiền không?',
                a: 'Không. Tiền mừng chuyển thẳng 100% vào tài khoản ngân hàng của Cô Dâu / Chú Rể với 0% phí nền tảng. Số tiền mừng tuyệt đối không hiển thị công khai — chỉ chủ tiệc xem được trong trang Quản trị riêng tư.',
              },
              {
                q: 'Gửi link thiệp cưới lên Zalo hoặc Facebook có hiện ảnh đẹp không?',
                a: 'Có. Mỗi thiệp cưới có sẵn ảnh xem trước Open Graph (1200×630) ghi tên cặp đôi và ngày lễ, đồng thời hỗ trợ đường dẫn ngắn có tên riêng của từng vị khách (?khach=Tên) hiển thị ngay trên bìa phong bì.',
              },
              {
                q: 'Sau khi gửi thiệp cho khách tôi có đổi mẫu hoặc sửa giờ tiệc được không?',
                a: 'Được. Bạn có thể chuyển đổi qua lại giữa 100 mẫu thiệp hoặc cập nhật lại địa điểm, giờ làm lễ, thêm ảnh cưới bất cứ lúc nào mà đường dẫn đã gửi cho khách vẫn giữ nguyên.',
              },
              {
                q: 'Hết thời hạn gói thì ảnh cưới và lời chúc có bị xóa không?',
                a: 'Không bị mất dữ liệu. Khi hết hạn gói tháng, thiệp tạm ẩn với khách mới và sẽ hiện lại nguyên vẹn toàn bộ ảnh lẫn lời chúc ngay khi bạn gia hạn hoặc nâng lên gói lưu giữ trọn đời.',
              },
            ].map((item) => (
              <div key={item.q} className="rounded-2xl border border-amber-200/80 bg-white p-5 shadow-sm">
                <dt className="font-serif text-lg font-bold text-slate-900">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-xs font-bold text-rose-800">
            <span className="text-slate-500">Đọc thêm cẩm nang:</span>
            <Link href="/huong-dan/tao-thiep-cuoi-online" className="rounded-full bg-rose-50 px-3.5 py-1.5 ring-1 ring-rose-200 hover:bg-rose-100">
              Hướng dẫn tạo thiệp gửi Zalo →
            </Link>
            <Link href="/huong-dan/mung-cuoi-vietqr" className="rounded-full bg-rose-50 px-3.5 py-1.5 ring-1 ring-rose-200 hover:bg-rose-100">
              Cài hộp mừng VietQR 0% phí →
            </Link>
            <Link href="/so-sanh/thiep-cuoi-online-va-thiep-giay" className="rounded-full bg-rose-50 px-3.5 py-1.5 ring-1 ring-rose-200 hover:bg-rose-100">
              So sánh thiệp online vs thiệp giấy →
            </Link>
          </div>
        </section>
      </div>
    </main>
    <SiteFooter />
    </>
  );
}
