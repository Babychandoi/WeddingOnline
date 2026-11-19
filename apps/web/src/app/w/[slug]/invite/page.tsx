import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dbRepo } from '@dco/database';
import { TIER_CATALOG, isVenueId, resolveInvitationConfig } from '@dco/shared';
import { InvitationView } from '@/components/invitation/InvitationView';
import { BANK_NAMES } from '@/components/invitation/themes';
import { venueThumbnail } from '@/components/venues/VenueCard';
import type { InvitationWish } from '@/app/api/invitations/[slug]/wishes/route';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const wedding = await dbRepo.getWeddingBySlug(params.slug);
  if (!wedding) return { title: 'Không tìm thấy thiệp cưới' };
  const config = resolveInvitationConfig(wedding.invitationConfig, wedding);
  const names = `${config.groomFullName} & ${config.brideFullName}`;
  return {
    title: `Thiệp cưới ${names}`,
    description: `${config.headline}. Mời bạn mở thiệp, xác nhận tham dự và gửi lời chúc tới ${names}.`,
    openGraph: { title: `Thiệp cưới ${names}`, description: config.headline, images: [{ url: `/w/${wedding.slug}/opengraph-image` }] },
  };
}

export default async function InvitationPage({ params, searchParams }: { params: { slug: string }; searchParams: { khach?: string } }) {
  const wedding = await dbRepo.getWeddingBySlug(params.slug);
  if (!wedding) notFound();

  const [photos, guestbook, ledger, scene] = await Promise.all([
    dbRepo.listPhotos(wedding.id),
    dbRepo.listGuestbook(wedding.id),
    dbRepo.getPrivateGiftLedger(wedding.id),
    dbRepo.getSceneByWeddingId(wedding.id),
  ]);
  const config = resolveInvitationConfig(wedding.invitationConfig, wedding);
  const guestName = typeof searchParams.khach === 'string' ? searchParams.khach.trim().slice(0, 60) : null;

  // Public wall: names and wishes only — never gift amounts
  const wishes: InvitationWish[] = [
    ...guestbook.map((e) => ({ id: e.id, name: e.authorName, side: e.side, message: e.message, createdAt: e.createdAt, withGift: false })),
    ...ledger.map((l) => ({ id: l.id, name: l.guestName, side: null, message: l.wishMessage, createdAt: l.verifiedAt, withGift: true })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 200);

  const venueId = scene?.templateId;
  const gallery = photos
    .filter((p) => p.type === 'PRE_WEDDING_GALLERY')
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((p) => ({ id: p.id, url: p.publicUrl, caption: p.caption }));

  return (
    <InvitationView
      slug={wedding.slug}
      groomName={wedding.groomName}
      brideName={wedding.brideName}
      weddingDate={wedding.weddingDate}
      config={config}
      photos={gallery}
      guestName={guestName}
      gift={{
        enabled: TIER_CATALOG[wedding.tier].allowVietQr && Boolean(wedding.bankBin && wedding.bankAccountNo),
        bankName: wedding.bankBin ? BANK_NAMES[wedding.bankBin] ?? null : null,
      }}
      hallUrl={wedding.status === 'EXPIRED_TRIAL' ? null : `/w/${wedding.slug}`}
      venueThumb={venueId && isVenueId(venueId) ? venueThumbnail(venueId) : null}
      initialWishes={wishes}
    />
  );
}
