import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import {
  INVITATION_TEMPLATES,
  STARTER_TEMPLATES,
  VENUE_REGIONS,
  VENUE_THEMES,
  getVenueTheme,
  isVenueId,
  type InvitationTemplateStyle,
  type VenueMood,
  type VenueRegion,
} from '@dco/shared';

export const dynamic = 'force-dynamic';
import { VenuePreviewClient } from '@/components/venues/VenuePreviewClient';
import { VenueCard, venueThumbnail } from '@/components/venues/VenueCard';
import { getVenuePhotoReference } from '@/components/three/venuePhotoReferences';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd, canonicalUrl, venueIdFromParam, venueSlug } from '@/lib/seo';

const REGION_STYLE_MAP: Record<VenueRegion, InvitationTemplateStyle[]> = {
  VIETNAM: ['truyen-thong', 'lang-man'],
  EAST_ASIA: ['truyen-thong', 'toi-gian'],
  SOUTH_SOUTHEAST_ASIA: ['thien-nhien', 'sang-trong'],
  MIDDLE_EAST_AFRICA: ['sang-trong', 'co-dien'],
  EUROPE: ['co-dien', 'sang-trong'],
  AMERICAS: ['hien-dai', 'thien-nhien'],
  OCEANIA: ['thien-nhien', 'toi-gian'],
};

const MOOD_DESC: Record<VenueMood, string> = {
  day: 'ánh sáng ban ngày trong trẻo, tự nhiên, làm nổi bật màu sắc hoa tươi và trang phục của khách mời',
  sunset: 'ánh hoàng hôn vàng ấm lãng mạn, phù hợp nghi thức trao nhẫn và chụp ảnh Photobooth kỷ niệm',
  night: 'ánh đèn đêm lung linh, nổi bật hiệu ứng pháo hoa 3D chúc mừng và không khí tiệc tối trang trọng',
  indoor: 'không gian sảnh trong nhà ấm cúng, sang trọng với hệ thống chiếu sáng sân khấu rõ nét',
};

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const resolvedId = venueIdFromParam(params.id);
  if (!isVenueId(resolvedId)) {
    return { title: 'Không tìm thấy không gian — DamCuoiOnline.vn', robots: { index: false, follow: false } };
  }
  const venue = getVenueTheme(resolvedId);
  const title = `${venue.nameVi} — Sảnh cưới 3D | DamCuoiOnline.vn`;
  const url = canonicalUrl(`/khong-gian/${venueSlug(venue.id)}`);
  const thumb = venueThumbnail(venue.id);
  return {
    title,
    description: venue.descriptionVi,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'vi_VN',
      url,
      title,
      description: venue.descriptionVi,
      images: [{ url: thumb, width: 640, height: 400, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: venue.descriptionVi,
      images: [thumb],
    },
  };
}

export default function VenuePreviewPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { capture?: string; cam?: string; view?: string };
}) {
  const resolvedId = venueIdFromParam(params.id);
  if (!isVenueId(resolvedId)) notFound();
  const capture = searchParams.capture === '1';
  // Permanently redirect legacy underscore URLs (`/khong-gian/vn_hoi_an`) to clean hyphenated slugs (`/khong-gian/vn-hoi-an`)
  if (!capture && params.id.includes('_')) {
    const clean = venueSlug(resolvedId);
    const qs = searchParams.view ? `?view=${encodeURIComponent(searchParams.view)}` : '';
    permanentRedirect(`/khong-gian/${clean}${qs}`);
  }
  // Capture-only camera override "x,y,z,tx,ty,tz" (used when rendering close-up stills)
  const cam = capture && typeof searchParams.cam === 'string' ? searchParams.cam.split(',').map(Number) : [];
  const camera = cam.length === 6 && cam.every((v) => Number.isFinite(v) && Math.abs(v) < 500) ? cam : undefined;
  const venue = getVenueTheme(resolvedId);
  const index = VENUE_THEMES.findIndex((v) => v.id === venue.id);
  const prev = VENUE_THEMES[(index - 1 + VENUE_THEMES.length) % VENUE_THEMES.length];
  const next = VENUE_THEMES[(index + 1) % VENUE_THEMES.length];
  const reference = getVenuePhotoReference(venue.id);
  // The rebuilt halls are the main view. The three standalone compositions keep their opening shot.
  const initialReference = searchParams.view === 'photo'
    || (searchParams.view !== 'hall' && reference !== undefined && reference.kind !== 'relief');

  const regionName = VENUE_REGIONS.find((r) => r.id === venue.region)?.nameVi ?? 'Việt Nam & Thế Giới';
  const relatedVenues = VENUE_THEMES.filter((v) => v.region === venue.region && v.id !== venue.id).slice(0, 4);
  const preferredStyles = REGION_STYLE_MAP[venue.region] ?? ['truyen-thong', 'sang-trong'];
  const matchedTemplates = INVITATION_TEMPLATES.filter((t) => preferredStyles.includes(t.style)).slice(0, 4);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Trang chủ', path: '/' },
          { name: 'Không gian cưới 3D', path: '/khong-gian' },
          { name: venue.nameVi, path: `/khong-gian/${venueSlug(venue.id)}` },
        ])}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: `${venue.nameVi} — Không gian sảnh cưới 3D`,
          description: venue.descriptionVi,
          inLanguage: 'vi',
          url: canonicalUrl(`/khong-gian/${venueSlug(venue.id)}`),
          image: canonicalUrl(venueThumbnail(venue.id)),
          creator: { '@type': 'Organization', name: 'DamCuoiOnline.vn' },
        }}
      />
      <VenuePreviewClient
        key={venue.id}
        venue={{
          id: venue.id,
          nameVi: venue.nameVi,
          place: venue.place,
          regionName,
          descriptionVi: venue.descriptionVi,
          sky: venue.colors.s,
        }}
        layout={STARTER_TEMPLATES[venue.id].layout}
        prev={{ id: prev.id, nameVi: prev.nameVi }}
        next={{ id: next.id, nameVi: next.nameVi }}
        reference={reference}
        initialReference={initialReference}
        capture={capture}
        camera={camera}
      />

      {!capture && (
        <section
          aria-label="Thông tin chi tiết không gian cưới 3D"
          className="border-t border-amber-200/80 bg-[#FFFDF8] px-5 py-14 text-slate-900 sm:px-6"
        >
          <div className="mx-auto max-w-6xl">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
              <Link href="/" className="hover:text-rose-700">
                Trang chủ
              </Link>
              <span aria-hidden="true">/</span>
              <Link href="/khong-gian" className="hover:text-rose-700">
                101 Không Gian Cưới 3D
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-slate-800">{venue.nameVi}</span>
            </nav>

            <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <h2 className="font-serif text-3xl font-bold text-slate-900">
                  Giới thiệu không gian cưới 3D {venue.nameVi}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">
                  <strong>{venue.nameVi}</strong> thuộc khu vực <strong>{regionName}</strong> ({venue.place}) là một
                  trong {VENUE_THEMES.length} bối cảnh sảnh cưới 3D trực tuyến được dựng sẵn trên DamCuoiOnline.vn.{' '}
                  {venue.descriptionVi} Bối cảnh sở hữu {MOOD_DESC[venue.mood]}, giúp người thân ở xa hay bạn bè quốc tế
                  mở đường dẫn ngay trên trình duyệt điện thoại mà không cần cài ứng dụng.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Khi chọn {venue.nameVi} làm sảnh tiệc, cô dâu chú rể có thể tự bố trí lại bàn tiệc, sân khấu, khung
                  ảnh cưới trên lưới <strong>60×60 Grid-Snap</strong> (tự kiểm tra lối đi BFS/A*). Hệ thống hỗ trợ chia
                  sảnh tự động <strong>60 CCU/sảnh</strong>, <strong>Voice Chat theo bàn tiệc (LiveKit SFU)</strong> tự
                  giảm âm lượng khi MC phát biểu, chế độ <strong>Auto-NPC</strong> đứng đón khách khi cặp đôi bận lễ
                  ngoài đời, chụp ảnh Photobooth và lưu trữ <strong>Trang Kỷ Niệm 2D vĩnh viễn</strong> sau ngày cưới.
                </p>

                <ul className="mt-5 grid gap-2.5 text-xs text-slate-700 sm:grid-cols-2">
                  {[
                    'Vào thẳng trên trình duyệt iOS, Android & máy tính trong 5 giây',
                    'Kèm sẵn Thiệp Cưới Online trong Gói Hạnh Phúc & Viên Mãn VIP',
                    'Mừng cưới VietQR chuyển thẳng 100% (0% phí, luôn ẩn số tiền)',
                    'Bắn pháo hoa 3D, tung bắt hoa cưới, chat 1-1 & ký Sổ Lưu Bút',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <aside className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
                <h3 className="font-serif text-xl font-bold text-slate-900">
                  Mẫu thiệp cưới online đồng điệu với {venue.nameVi}
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Kết hợp thiệp cưới điện tử gửi qua Zalo với sảnh 3D {venue.nameVi} để khách ở xa bước thẳng vào tiệc:
                </p>
                <ul className="mt-4 divide-y divide-amber-100">
                  {matchedTemplates.map((tpl) => (
                    <li key={tpl.id} className="py-2.5">
                      <Link
                        href={`/thiep-cuoi/${tpl.id}`}
                        className="group flex items-center justify-between gap-2 text-sm font-bold text-slate-900 hover:text-rose-700"
                      >
                        <span>
                          Thiệp mẫu {tpl.nameVi}
                          <span className="block text-xs font-normal text-slate-500">{tpl.descriptionVi}</span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-rose-700 transition group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Link
                    href={`/create?template=${encodeURIComponent(venue.id)}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-rose-800"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Khởi tạo sảnh này
                  </Link>
                  <Link
                    href="/huong-dan/dam-cuoi-online-3d"
                    className="inline-flex items-center rounded-full border border-rose-200 px-4 py-2 text-xs font-bold text-rose-800 hover:bg-rose-50"
                  >
                    Cách tổ chức tiệc 3D
                  </Link>
                </div>
              </aside>
            </div>

            {relatedVenues.length > 0 && (
              <div className="mt-12 border-t border-amber-200/70 pt-10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-serif text-2xl font-bold text-slate-900">
                    Không gian cưới 3D cùng khu vực {regionName}
                  </h2>
                  <Link
                    href="/khong-gian"
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:underline"
                  >
                    Xem tất cả {VENUE_THEMES.length} không gian <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {relatedVenues.map((rv, rIdx) => (
                    <VenueCard key={rv.id} venue={rv} priority={rIdx === 0} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
