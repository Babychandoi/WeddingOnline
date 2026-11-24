import Link from 'next/link';
import {
  ArrowRight,
  BookHeart,
  Camera,
  Check,
  Crown,
  Gift,
  Mic,
  QrCode,
  Sparkles,
  Users,
} from 'lucide-react';
import { INVITATION_2D_TEMPLATES, INVITATION_3D_TEMPLATES, TIER_CATALOG, VENUE_THEMES, getVenueTheme, type WeddingTier } from '@dco/shared';
import { VenueCard } from '@/components/venues/VenueCard';
import { AdminStudioBanner } from '@/components/home/AdminStudioSlot';
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome';
import { WeddingHeroAtmosphere } from '@/components/threeui/WeddingHeroAtmosphere';
import { LiquidMetalButton, SparkBadgePill } from '@/components/threeui/LiquidMetalButton';
import { OrbitalVenueGallery } from '@/components/threeui/OrbitalVenueGallery';
import { FannedInvitationDeck } from '@/components/motion/ShowcaseMotion';
import { JsonLd } from '@/components/seo/JsonLd';
import { WebMcpTools } from '@/components/seo/WebMcpTools';
import { PUBLISHED_GUIDES } from '@/lib/guides';
import { canonicalUrl } from '@/lib/seo';

export const revalidate = 3600;

/** Vietnamese spaces featured on the landing page; the full catalogue lives at /khong-gian */
const FEATURED_VENUES = [
  'vn_gia_tien',
  'mekong_coconut_tent',
  'vn_hoi_an',
  'vn_phu_quoc_beach',
  'vn_da_lat',
  'luxury_ballroom',
].map((id) => getVenueTheme(id));

const CAPABILITIES = [
  {
    icon: Users,
    title: 'Quảng Trường 24/7 & Chia Sảnh Tự Động',
    desc: 'Khách mở link vào ngay trên trình duyệt không cần cài app; máy chủ tự chia sảnh mượt mà (60 CCU/sảnh) khi đông khách.',
  },
  {
    icon: Mic,
    title: 'Voice Chat Theo Từng Bàn Tiệc (LiveKit SFU)',
    desc: 'Đi dạo nghe nhạc nền dịu nhẹ, ngồi xuống bàn mới kết nối thoại nhóm; khi MC bật mic sân khấu, nhạc tự giảm -20dB và tiếng bàn giảm -12dB.',
  },
  {
    icon: Crown,
    title: 'Dual-Mode Auto-NPC & Nhập Vai Trực Tiếp',
    desc: 'Khi Cô Dâu Chú Rể bận tiếp khách ngoài đời, Auto-NPC tự động đứng đón và chạy nghi lễ đúng giờ; bấm 1 nút để nhập vai bất cứ lúc nào.',
  },
  {
    icon: Gift,
    title: 'Mừng Cưới VietQR, Chat Cá Nhân 1-1 & Bắn Pháo Hoa 3D',
    desc: 'Khách nhắn tin riêng 1-1 với nhau ngay trong sảnh, bắn pháo hoa 3D chúc mừng lên bầu trời; tiền mừng chuyển thẳng 100% về tài khoản cặp đôi và luôn ẩn số tiền.',
  },
  {
    icon: Camera,
    title: 'Trình Thiết Kế 60×60 Grid-Snap & Photobooth',
    desc: 'Kéo thả bàn tiệc, khung ảnh, thảm đỏ kèm thuật toán BFS/A* kiểm tra lối đi thông thoáng, chụp ảnh Polaroid lưu lên tường kỷ niệm.',
  },
  {
    icon: BookHeart,
    title: 'Thiệp Điện Tử, QR In Ấn & Kỷ Niệm 2D Vĩnh Viễn',
    desc: 'Tải file QR chuẩn in thiệp giấy 1200×1600, xuất Sổ Kỷ Niệm A4 PDF và tự động chuyển thành trang lưu trữ 2D siêu nhẹ sau lễ cưới 7 ngày.',
  },
] as const;

const DISPLAY_TIERS: WeddingTier[] = ['TRIAL_24H', 'HAPPINESS', 'VIP_FULFILLMENT'];

export default function HomePage() {
  const softwareAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'DamCuoiOnline.vn — Thiệp Cưới Online & Sảnh Cưới 3D',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web, iOS, Android',
    inLanguage: 'vi',
    url: canonicalUrl('/'),
    image: canonicalUrl('/opengraph-image'),
    description:
      'Nền tảng tạo 100 mẫu thiệp cưới online lật sách 3D và 101 không gian sảnh cưới 3D trực tuyến, hỗ trợ Voice Chat LiveKit, Auto-NPC, Photobooth và mừng cưới VietQR 0% phí.',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'VND',
      lowPrice: '0',
      highPrice: String(TIER_CATALOG.VIP_FULFILLMENT.priceVnd),
      offerCount: '8',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-slate-900">
      <JsonLd data={softwareAppJsonLd} />
      <WebMcpTools />
      <SiteHeader />

      {/* Editorial Hero with ThreeUI Constellation & Silk Atmosphere */}
      <div className="relative overflow-hidden">
        <WeddingHeroAtmosphere mood="constellation" tone="light" />
        <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:pt-14">
          <div className="dco-fade-up">
            <SparkBadgePill>101 Không Gian Cưới 3D · 100 Mẫu Thiệp · VietQR SePay</SparkBadgePill>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-[1.12] tracking-tight text-slate-900 sm:text-6xl">
              Dự Tiệc Cưới Online Trong <span className="text-rose-700">5 Giây</span> — Kết Nối Yêu
              Thương Không Khoảng Cách
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">
              Khách mời ở xa chỉ cần bấm đường dẫn mời là hóa thân thành nhân vật 3D bước vào sảnh cưới,
              ngắm ảnh cưới, ngồi bàn <strong>1-2-3 Dzô</strong> trò chuyện Voice Chat, tung bắt hoa
              cưới và mừng cưới VietQR minh bạch trực tiếp tới Cô Dâu &amp; Chú Rể.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LiquidMetalButton href="/plaza" variant="crimson">
                <Sparkles className="h-4 w-4" /> Vào Quảng Trường 24/7 (Miễn Phí)
              </LiquidMetalButton>
              <LiquidMetalButton href="/create" variant="gold">
                Tạo Sảnh Cưới Riêng <ArrowRight className="h-4 w-4 text-rose-700" />
              </LiquidMetalButton>
            </div>
          </div>

        {/* Live Showcase Routes Panel */}
        <aside className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-xl">
          <div className="border-b border-amber-100 pb-4">
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              Trải Nghiệm Trực Tiếp Ngay
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Các tuyến demo thực tế đã khởi tạo sẵn trên cơ sở dữ liệu hệ thống.
            </p>
          </div>

          <div className="mt-4 space-y-2.5">
            <Link
              href="/w/minh-va-linh"
              className="group flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/70 p-4 transition hover:bg-rose-100/70"
            >
              <div>
                <p className="text-sm font-bold text-rose-950">Sảnh Cưới VIP: Minh &amp; Linh</p>
                <p className="mt-0.5 text-xs text-rose-800/80">
                  Rạp Cưới Miền Tây • Auto-NPC, Voice &amp; VietQR
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-rose-700 transition group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/w/minh-va-linh/invite"
              className="group flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/70 p-4 transition hover:bg-amber-100/70"
            >
              <div className="flex items-center gap-3">
                <QrCode className="h-5 w-5 shrink-0 text-amber-700" />
                <div>
                  <p className="text-sm font-bold text-amber-950">Thiệp Mời Điện Tử 2D &amp; QR</p>
                  <p className="mt-0.5 text-xs text-amber-900/80">
                    Bản thiệp số kèm mã QR check-in
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-amber-700 transition group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/dashboard/minh-va-linh"
              className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:bg-slate-100"
            >
              <div>
                <p className="text-sm font-bold text-slate-900">Bảng Quản Trị Chủ Tiệc &amp; Studio</p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Kéo thả Grid-Snap 60×60, mời MC &amp; Sổ Kỷ Niệm A4
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/w/duy-va-thao-kyniem"
              className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:bg-amber-50/40"
            >
              <div>
                <p className="text-sm font-bold text-slate-900">Trang Kỷ Niệm 2D Vĩnh Viễn</p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Lưu giữ Album ảnh, Photobooth &amp; Sổ Lưu Bút mãi mãi
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </aside>
      </section>
      </div>

      {/* Wedding venues: Vietnamese spaces up front, the world catalogue one click away */}
      <section id="khong-gian" className="border-y border-amber-200/70 bg-amber-50/40 py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="font-serif text-3xl font-bold text-slate-900 sm:text-4xl">
                {VENUE_THEMES.length} Không Gian Cưới Việt Nam &amp; Thế Giới
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Từ lễ gia tiên nhà ba gian, rạp lá dừa miệt vườn đến đền Thần đạo Nhật Bản hay đồi cát
                sa mạc. Bấm vào một không gian để đi một vòng quanh sảnh 3D ngay trên trình duyệt.
              </p>
            </div>
            <Link
              href="/khong-gian"
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-700 shadow-sm transition hover:bg-rose-50"
            >
              Khám phá cả {VENUE_THEMES.length} không gian <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-8">
            <OrbitalVenueGallery
              venues={[...FEATURED_VENUES, ...VENUE_THEMES.filter((v) => !FEATURED_VENUES.some((f) => f.id === v.id)).slice(0, 4)]}
              heading="Trình Diễn Quỹ Đạo 3D Không Gian Nổi Bật"
            />
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_VENUES.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        </div>
      </section>

      {/* Online invitations: four real template fronts, the full gallery one click away */}
      <section id="thiep-cuoi" className="mx-auto max-w-6xl px-5 pt-16 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-xl">
            <h2 className="font-serif text-3xl font-bold text-slate-900 sm:text-4xl">
              {INVITATION_2D_TEMPLATES.length} Mẫu Thiệp 2D &amp; {INVITATION_3D_TEMPLATES.length} Bộ Thiệp Cưới 3D
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              Mua riêng không cần sảnh 3D: dòng <strong>Thiệp 2D</strong> gọn nhẹ chỉ 99.000đ/tháng (599.000đ trọn đời) và dòng <strong>Thiệp Cưới 3D Dạo Bước</strong> chuyển cảnh camera toàn màn hình 199.000đ/tháng (799.000đ trọn đời). Thiết kế và xem trước miễn phí.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/thiep-cuoi"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-rose-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-rose-800"
              >
                Xem {INVITATION_2D_TEMPLATES.length} mẫu 2D <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/thiep-cuoi-3d"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-5 text-sm font-bold text-amber-950 transition hover:bg-amber-100"
              >
                <Sparkles className="h-4 w-4 text-rose-700" /> Xem {INVITATION_3D_TEMPLATES.length} bộ 3D
              </Link>
            </div>
          </div>
          <div className="overflow-visible pt-4">
            <FannedInvitationDeck />
          </div>
        </div>
      </section>

      {/* Architecture & Capabilities Narrative */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <h2 className="font-serif text-3xl font-bold text-slate-900 sm:text-4xl">
              Thiết Kế Riêng Cho Tiệc Cưới Việt Thực Tế
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Hệ thống cân bằng giữa không khí gần gũi cho ông bà, bạn bè ở xa và tính riêng tư, minh
              bạch tuyệt đối về tài chính cho cặp đôi.
            </p>
            <AdminStudioBanner />
          </div>

          <div className="divide-y divide-amber-200/70 rounded-3xl border border-amber-200 bg-white px-6 shadow-sm">
            {CAPABILITIES.map((cap) => {
              const Icon = cap.icon;
              return (
                <div key={cap.title} className="flex gap-4 py-5">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{cap.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{cap.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Transparent Pricing */}
      <section id="goi-dich-vu" className="border-t border-amber-200/70 bg-rose-50/35 py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-bold text-slate-900 sm:text-4xl">
              Bảng Gói Tổ Chức Lễ Cưới Trực Tuyến
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
              Chọn gói sảnh cưới 3D phù hợp quy mô khách mời — thanh toán tự động qua VietQR hoặc kích hoạt bằng mã đối tác Studio.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {DISPLAY_TIERS.map((tierId) => {
              const meta = TIER_CATALOG[tierId];
              const isVip = tierId === 'VIP_FULFILLMENT';
              return (
                <div
                  key={tierId}
                  className={`flex flex-col justify-between rounded-3xl border bg-white p-6 shadow-sm ${isVip ? 'border-rose-500 ring-2 ring-rose-200' : 'border-amber-200'
                    }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-2xl font-bold text-slate-900">{meta.nameVi}</h3>
                      {isVip && (
                        <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                          Phổ biến nhất
                        </span>
                      )}
                    </div>
                    <p className="tabular-nums mt-3 text-3xl font-extrabold text-rose-700">
                      {meta.priceVnd === 0
                        ? 'Miễn phí'
                        : `${meta.priceVnd.toLocaleString('vi-VN')}đ`}
                    </p>
                    <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                      <li className="tabular-nums flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" /> Tối đa{' '}
                        <strong>{meta.maxCcu}</strong> khách đồng thời (CCU)
                      </li>
                      <li className="tabular-nums flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" /> Tối đa{' '}
                        <strong>{meta.maxPhotos}</strong> ảnh triển lãm &amp; Photobooth
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                        Chat cá nhân 1-1, chat chung, cụng ly &amp; bắt hoa cưới
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                        Bắn pháo hoa 3D chúc mừng rực rỡ toàn sảnh
                      </li>
                      <li className="flex items-center gap-2">
                        <Check
                          className={`h-4 w-4 shrink-0 ${meta.allowVietQr ? 'text-emerald-600' : 'text-slate-300'
                            }`}
                        />
                        {meta.allowVietQr
                          ? 'Mở Hộp Mừng Cưới VietQR Webhook 100%'
                          : 'Không thu tiền / không mở VietQR'}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check
                          className={`h-4 w-4 shrink-0 ${meta.allowVoiceChat ? 'text-emerald-600' : 'text-slate-300'
                            }`}
                        />
                        {meta.allowVoiceChat
                          ? 'Voice Chat từng bàn & Mic MC sân khấu LiveKit'
                          : 'Không kèm Voice Chat bàn tiệc LiveKit'}
                      </li>
                    </ul>
                  </div>

                  <Link
                    href="/create"
                    className={`mt-6 block rounded-2xl py-3 text-center text-xs font-bold transition ${isVip
                      ? 'bg-rose-600 text-white shadow hover:bg-rose-500'
                      : 'border border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100'
                      }`}
                  >
                    Chọn {meta.nameVi}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cẩm nang cưới số (SXO / GEO internal link hub) */}
      <section aria-label="Cẩm nang cưới số" className="mx-auto max-w-6xl px-5 py-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl font-bold text-slate-900 sm:text-4xl">
              Cẩm Nang Thiệp Cưới Online &amp; Cưới 3D
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Hướng dẫn chi tiết cách thiết kế thiệp gửi Zalo, bật hộp mừng VietQR ẩn số tiền và so sánh chi phí thực tế.
            </p>
          </div>
          <Link
            href="/huong-dan"
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-700 shadow-sm transition hover:bg-rose-50"
          >
            Xem tất cả cẩm nang <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PUBLISHED_GUIDES.map((g) => (
            <Link
              key={g.slug}
              href={g.href}
              className="group flex flex-col justify-between rounded-2xl border border-amber-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md"
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">{g.category}</span>
                <h3 className="mt-2 font-serif text-lg font-bold leading-snug text-slate-900 group-hover:text-rose-800">
                  {g.shortTitle}
                </h3>
                <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-600">{g.description}</p>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-rose-700">
                Đọc ngay <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
