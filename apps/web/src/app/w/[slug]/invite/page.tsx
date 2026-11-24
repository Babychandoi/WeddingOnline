import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dbRepo } from '@dco/database';
import Link from 'next/link';
import { invitationAccess, isVenueId, resolveInvitationConfig } from '@dco/shared';
import { getSessionFromRequest } from '@/lib/session';
import { InvitationView } from '@/components/invitation/InvitationView';
import { OwnerEditBar } from '@/components/invitation/OwnerEditBar';
import { BANK_NAMES } from '@/components/invitation/themes';
import { venueThumbnail } from '@/components/venues/VenueCard';
import type { InvitationWish } from '@/app/api/invitations/[slug]/wishes/route';
import { canonicalUrl, isPublicDemoSlug } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const wedding = await dbRepo.getWeddingBySlug(params.slug);
  if (!wedding) return { title: 'Không tìm thấy thiệp cưới', robots: { index: false, follow: false } };
  const config = resolveInvitationConfig(wedding.invitationConfig, wedding);
  const names = `${config.groomFullName} & ${config.brideFullName}`;
  const url = canonicalUrl(`/w/${wedding.slug}/invite`);
  const title = `Thiệp cưới ${names}`;
  const description = `${config.headline}. Mời bạn mở thiệp, xác nhận tham dự và gửi lời chúc tới ${names}.`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: isPublicDemoSlug(wedding.slug) ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title,
      description: config.headline,
      url,
      images: [{ url: `/w/${wedding.slug}/opengraph-image`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: config.headline,
      images: [`/w/${wedding.slug}/opengraph-image`],
    },
  };
}

export default async function InvitationPage({ params, searchParams }: { params: { slug: string }; searchParams: { khach?: string } }) {
  const wedding = await dbRepo.getWeddingBySlug(params.slug);
  if (!wedding) notFound();

  // Drafts, lapsed plans, and 2D-plan-on-3D-template are hidden from guests; couple sees preview
  const config = resolveInvitationConfig(wedding.invitationConfig, wedding);
  const access = invitationAccess(wedding, { templateId: config.templateId });
  let isHost = false;
  if (!access.published) {
    const auth = await getSessionFromRequest();
    if (auth) {
      const member = wedding.ownerId === auth.user.id ? null : await dbRepo.getMember(wedding.id, auth.user.id);
      isHost = wedding.ownerId === auth.user.id || Boolean(member && ['OWNER', 'BRIDE', 'GROOM'].includes(member.role));
    }
    if (!isHost) {
      return <NotPublished names={`${config.groomFullName} & ${config.brideFullName}`} expired={access.expired} needs3dUpgrade={access.needs3dUpgrade} />;
    }
  }

  const [photos, guestbook, ledger, scene] = await Promise.all([
    dbRepo.listPhotos(wedding.id),
    dbRepo.listGuestbook(wedding.id),
    dbRepo.getPrivateGiftLedger(wedding.id),
    dbRepo.getSceneByWeddingId(wedding.id),
  ]);
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
    <>
    <OwnerEditBar slug={wedding.slug} />
    {!access.published && (
      <div className="fixed inset-x-0 top-0 z-[70] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-400 px-4 py-2 text-center text-sm font-bold text-amber-950 shadow">
        <span>
          {access.needs3dUpgrade
            ? 'Mẫu Thiệp 3D cần gói Thiệp 3D riêng (từ 290k): khách chưa mở được.'
            : access.expired
              ? 'Thiệp đã hết hạn: khách đang thấy “tạm ngưng”.'
              : 'Bản xem trước: khách chưa mở được thiệp này.'}
        </span>
        <Link href={`/dashboard/${wedding.slug}?tab=thiep&phat-hanh=1`} className="rounded-full bg-amber-950 px-3 py-1 text-amber-50 hover:bg-amber-900">
          {access.needs3dUpgrade ? 'Nâng cấp gói 3D' : access.expired ? 'Gia hạn thiệp' : 'Phát hành thiệp'}
        </Link>
      </div>
    )}
    <InvitationView
      slug={wedding.slug}
      groomName={wedding.groomName}
      brideName={wedding.brideName}
      weddingDate={wedding.weddingDate}
      config={config}
      photos={gallery}
      guestName={guestName}
      gift={{
        // A published invitation can take gifts into the couple's own account
        enabled: Boolean(wedding.bankBin && wedding.bankAccountNo),
        bankName: wedding.bankBin ? BANK_NAMES[wedding.bankBin] ?? null : null,
      }}
      hallUrl={wedding.status === 'EXPIRED_TRIAL' || wedding.invitationOnly ? null : `/w/${wedding.slug}`}
      venueThumb={venueId && isVenueId(venueId) ? venueThumbnail(venueId) : null}
      initialWishes={wishes}
      demo={!access.published}
    />
    </>
  );
}

/** What guests see before the invitation is published, or after its plan has run out */
function NotPublished({ names, expired, needs3dUpgrade = false }: { names: string; expired: boolean; needs3dUpgrade?: boolean }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6efe8] px-6 py-16 text-center text-[#3b2a2a]">
      <div className="max-w-md">
        <p className="text-[13px] uppercase tracking-[0.3em] text-[#9a7b6f]">Thiệp cưới</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight [text-wrap:balance]">{names}</h1>
        <p className="mx-auto mt-6 max-w-[34ch] text-[17px] leading-relaxed text-[#6b5550] [text-wrap:pretty]">
          {needs3dUpgrade
            ? 'Thiệp cưới 3D đang chờ cô dâu chú rể nâng cấp gói Thiệp 3D. Bạn quay lại sau ít phút nhé.'
            : expired
              ? 'Thiệp đang tạm ngưng. Cô dâu chú rể sẽ mở lại thiệp sớm, bạn quay lại sau nhé.'
              : 'Cô dâu chú rể đang hoàn thiện thiệp cưới. Bạn quay lại sau ít phút nhé.'}
        </p>
        <p className="mt-10 text-[13px] text-[#9a7b6f]">
          Thiệp cưới online · <Link href="/thiep-cuoi" className="underline underline-offset-4">DamCuoiOnline</Link>
        </p>
      </div>
    </main>
  );
}
