import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { INVITATION_2D_TEMPLATES, INVITATION_3D_PLANS, INVITATION_3D_TEMPLATES, INVITATION_PLANS, TIER_CATALOG, VENUE_THEMES } from '@dco/shared';
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd, canonicalUrl } from '@/lib/seo';

const TITLE = 'Bảng Giá Thiệp Cưới 2D, Thiệp 3D & Sảnh Cưới 3D — DamCuoiOnline.vn';
const DESC =
  'Bảng giá minh bạch 2026: Thiệp cưới 2D 99k/tháng – 599k trọn đời, Thiệp cưới 3D tương tác 199k/tháng – 799k trọn đời, Sảnh cưới 3D Dùng Thử 24h miễn phí, Hạnh Phúc 399k, VIP 1.199k.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: canonicalUrl('/bang-gia') },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: canonicalUrl('/bang-gia'),
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

export default function PricingPage() {
  const hallTiers = (['TRIAL_24H', 'HAPPINESS', 'VIP_FULFILLMENT'] as const).map((id) => ({
    id,
    ...TIER_CATALOG[id],
  }));

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#FFFDF8] text-slate-900">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Trang chủ', path: '/' },
          { name: 'Bảng giá', path: '/bang-gia' },
        ])}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: TITLE,
          url: canonicalUrl('/bang-gia'),
          description: DESC,
          inLanguage: 'vi',
          mainEntity: {
            '@type': 'OfferCatalog',
            name: 'Bảng giá dịch vụ DamCuoiOnline.vn',
            itemListElement: [
              ...INVITATION_PLANS.map((p) => ({
                '@type': 'Offer',
                name: `Thiệp Cưới Online 2D — ${p.nameVi}`,
                price: String(p.priceVnd),
                priceCurrency: 'VND',
                availability: 'https://schema.org/InStock',
                url: canonicalUrl('/thiep-cuoi/tao'),
              })),
              ...INVITATION_3D_PLANS.map((p) => ({
                '@type': 'Offer',
                name: `Thiệp Cưới 3D Dạo Bước — ${p.nameVi}`,
                price: String(p.priceVnd),
                priceCurrency: 'VND',
                availability: 'https://schema.org/InStock',
                url: canonicalUrl('/thiep-cuoi-3d/tao'),
              })),
              ...hallTiers.map((t) => ({
                '@type': 'Offer',
                name: `Sảnh Cưới 3D — ${t.nameVi}`,
                price: String(t.priceVnd),
                priceCurrency: 'VND',
                availability: 'https://schema.org/InStock',
                url: canonicalUrl('/create'),
              })),
            ],
          },
        }}
      />

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-16">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-rose-700">
            <ArrowLeft className="h-3.5 w-3.5" /> Trang chủ
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-slate-800">Bảng giá</span>
        </nav>

        <h1 className="mt-5 font-serif text-3xl font-bold leading-tight text-slate-900 sm:text-5xl">
          Bảng Giá Thiệp Cưới Online &amp; Sảnh Cưới 3D Minh Bạch
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
          Không phí ẩn, không thu hoa hồng tiền mừng cưới. Thiết kế bản nháp thiệp cưới và dùng thử sảnh cưới 3D hoàn
          toàn miễn phí trước khi quyết định phát hành.
        </p>

        {/* Section 1: Online Wedding Invitations 2D */}
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl font-bold text-rose-950 sm:text-3xl">
                1. Gói Thiệp Cưới 2D Độc Lập ({INVITATION_2D_TEMPLATES.length} Mẫu)
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Dành cho đám cưới tổ chức ngoài đời: mở phong bì 2D, lịch âm dương, album lật sách &amp; VietQR 0% phí.
              </p>
            </div>
            <Link
              href="/thiep-cuoi/tao"
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-700 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-rose-800"
            >
              Thiết kế thiệp 2D miễn phí <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <ul className="mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
            {INVITATION_PLANS.map((p) => (
              <li
                key={p.id}
                className={`flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm ${
                  p.id === 'life' ? 'border-rose-600 ring-2 ring-rose-200' : 'border-amber-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-rose-800">{p.nameVi}</p>
                    {p.id === 'life' && (
                      <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">Lưu mãi mãi</span>
                    )}
                  </div>
                  <p className="mt-2 text-3xl font-black tabular-nums text-slate-900">
                    {p.priceVnd.toLocaleString('vi-VN')}đ
                  </p>
                  <p className="mt-1.5 text-xs text-slate-600">
                    {p.months === null
                      ? 'Lưu giữ thiệp 2D, album lật sách 3D và lời chúc mãi mãi.'
                      : 'Phù hợp đám cưới diễn ra trong 30 ngày tới · gia hạn giữ nguyên link.'}
                  </p>
                </div>
                <Link
                  href="/thiep-cuoi/tao"
                  className="mt-4 inline-block text-xs font-bold text-rose-700 hover:underline"
                >
                  Chọn mẫu 2D &amp; thử miễn phí →
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 2: 3D Interactive Walkthrough Invitations */}
        <section className="mt-14 border-t border-amber-200/80 pt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl font-bold text-rose-950 sm:text-3xl">
                2. Gói Thiệp Cưới 3D Dạo Bước Tương Tác ({INVITATION_3D_TEMPLATES.length} Bộ Chủ Đề)
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Thế giới WebGL 360° toàn màn hình với chuyển cảnh camera đa trạm, ảnh đôi đứng đón khách &amp; cần điều khiển tự do (đã mở sẵn cả 100 mẫu 2D).
              </p>
            </div>
            <Link
              href="/thiep-cuoi-3d/tao"
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-5 py-2.5 text-xs font-black text-slate-950 shadow hover:bg-amber-300"
            >
              <Sparkles className="h-3.5 w-3.5" /> Tạo thiệp 3D miễn phí
            </Link>
          </div>

          <ul className="mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
            {INVITATION_3D_PLANS.map((p) => (
              <li
                key={p.id}
                className={`flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm ${
                  p.id === 'life' ? 'border-rose-600 ring-2 ring-rose-200' : 'border-amber-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-rose-800">{p.nameVi}</p>
                    {p.id === 'life' && (
                      <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">Lưu mãi mãi</span>
                    )}
                  </div>
                  <p className="mt-2 text-3xl font-black tabular-nums text-slate-900">
                    {p.priceVnd.toLocaleString('vi-VN')}đ
                  </p>
                  <p className="mt-1.5 text-xs text-slate-600">
                    {p.months === null
                      ? 'Lưu giữ không gian thiệp 3D và lời chúc mãi mãi.'
                      : 'Phù hợp đám cưới diễn ra trong 30 ngày tới · gia hạn giữ nguyên link.'}
                  </p>
                </div>
                <Link
                  href="/thiep-cuoi-3d/tao"
                  className="mt-4 inline-block text-xs font-bold text-rose-700 hover:underline"
                >
                  Chọn bộ 3D &amp; thử miễn phí →
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 3: 3D Virtual Wedding Halls */}
        <section className="mt-14 border-t border-amber-200/80 pt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl font-bold text-slate-900 sm:text-3xl">
                3. Gói Sảnh Cưới 3D Trực Tuyến ({VENUE_THEMES.length} Không Gian)
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Gói Hạnh Phúc và Viên Mãn VIP đã <strong>bao gồm sẵn Thiệp Cưới 2D &amp; 3D</strong> và Trang Kỷ Niệm 2D vĩnh viễn.
              </p>
            </div>
            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-5 py-2.5 text-xs font-bold text-rose-800 hover:bg-rose-50"
            >
              <Sparkles className="h-3.5 w-3.5" /> Mở phòng dùng thử 24h
            </Link>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {hallTiers.map((meta) => {
              const isVip = meta.id === 'VIP_FULFILLMENT';
              return (
                <div
                  key={meta.id}
                  className={`flex flex-col justify-between rounded-3xl border bg-white p-6 shadow-sm ${
                    isVip ? 'border-rose-500 ring-2 ring-rose-200' : 'border-amber-200'
                  }`}
                >
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-slate-900">{meta.nameVi}</h3>
                    <p className="mt-2 text-3xl font-extrabold tabular-nums text-rose-700">
                      {meta.priceVnd === 0 ? 'Miễn phí' : `${meta.priceVnd.toLocaleString('vi-VN')}đ`}
                    </p>
                    <ul className="mt-4 space-y-2 text-xs text-slate-700">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" /> Tối đa <strong>{meta.maxCcu}</strong> CCU đồng thời
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" /> Tối đa <strong>{meta.maxPhotos}</strong> ảnh cưới &amp; Photobooth
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className={`h-4 w-4 shrink-0 ${meta.allowVietQr ? 'text-emerald-600' : 'text-slate-300'}`} />
                        {meta.allowVietQr ? 'Kèm sẵn Thiệp Cưới Online & VietQR 0% phí' : 'Trải nghiệm 24h không kèm VietQR'}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className={`h-4 w-4 shrink-0 ${meta.allowVoiceChat ? 'text-emerald-600' : 'text-slate-300'}`} />
                        {meta.allowVoiceChat ? 'Voice Chat từng bàn & Mic MC LiveKit' : 'Chat 1-1 & chat sảnh, không kèm Voice'}
                      </li>
                    </ul>
                  </div>
                  <Link
                    href="/create"
                    className={`mt-6 block rounded-2xl py-3 text-center text-xs font-bold transition ${
                      isVip
                        ? 'bg-rose-700 text-white shadow hover:bg-rose-800'
                        : 'border border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100'
                    }`}
                  >
                    Chọn {meta.nameVi}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 text-sm text-emerald-950">
          <p className="flex items-center gap-2 font-bold text-emerald-900">
            <ShieldCheck className="h-5 w-5" /> Cam kết minh bạch 100% &amp; 0% phí tiền mừng cưới
          </p>
          <p className="mt-1.5 leading-relaxed">
            Mọi khoản tiền mừng cưới qua mã VietQR chuyển trực tiếp vào tài khoản ngân hàng của Cô Dâu / Chú Rể, không
            đi qua trung gian và tuyệt đối ẩn số tiền công khai. Đọc thêm tại{' '}
            <Link href="/huong-dan/mung-cuoi-vietqr" className="font-bold text-rose-700 underline underline-offset-2">
              Hướng dẫn mừng cưới VietQR
            </Link>{' '}
            hoặc{' '}
            <Link href="/so-sanh/thiep-cuoi-online-va-thiep-giay" className="font-bold text-rose-700 underline underline-offset-2">
              So sánh chi phí với thiệp giấy
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
    <SiteFooter />
    </>
  );
}
