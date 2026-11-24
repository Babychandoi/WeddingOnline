import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dbRepo, toPublicWedding } from '@dco/database';
import { STARTER_TEMPLATES } from '@dco/shared';
import { HallExperience } from '@/components/hall/HallExperience';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd, canonicalUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const PLAZA_TITLE = 'Quảng Trường Cưới 3D 24/7 Miễn Phí — DamCuoiOnline.vn';
const PLAZA_DESC =
  'Bước vào Quảng Trường Cưới 3D mở cửa 24/7 trên trình duyệt: chọn nhân vật 3D, dạo sảnh tiệc, ngồi bàn 1-2-3 Dzô, chụp Photobooth và bắn pháo hoa.';

export const metadata: Metadata = {
  title: PLAZA_TITLE,
  description: PLAZA_DESC,
  alternates: { canonical: canonicalUrl('/plaza') },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: canonicalUrl('/plaza'),
    title: PLAZA_TITLE,
    description: PLAZA_DESC,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: PLAZA_TITLE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: PLAZA_TITLE,
    description: PLAZA_DESC,
    images: ['/opengraph-image'],
  },
};

export default async function PublicPlazaPage() {
  const wedding = await dbRepo.getWeddingBySlug('plaza');
  if (!wedding) notFound();

  const [scene, photos, guestbook] = await Promise.all([
    dbRepo.getSceneByWeddingId(wedding.id),
    dbRepo.listPhotos(wedding.id),
    dbRepo.listGuestbook(wedding.id),
  ]);
  const layout = scene?.layoutData ?? STARTER_TEMPLATES.sunset_garden.layout;

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Trang chủ', path: '/' },
          { name: 'Quảng trường cưới 3D 24/7', path: '/plaza' },
        ])}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: 'Quảng Trường Cưới 3D 24/7 — DamCuoiOnline.vn',
          description: PLAZA_DESC,
          eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
          eventStatus: 'https://schema.org/EventScheduled',
          startDate: '2026-01-01T00:00:00+07:00',
          endDate: '2027-12-31T23:59:59+07:00',
          location: {
            '@type': 'VirtualLocation',
            url: canonicalUrl('/plaza'),
          },
          isAccessibleForFree: true,
          image: [canonicalUrl('/opengraph-image')],
          organizer: { '@type': 'Organization', name: 'DamCuoiOnline.vn', url: canonicalUrl('/') },
        }}
      />
      <HallExperience
        wedding={toPublicWedding(wedding)}
        layout={layout}
        initialPhotos={photos}
        initialGuestbook={guestbook}
      />
    </>
  );
}
