import { notFound } from 'next/navigation';
import { dbRepo, toPublicWedding } from '@dco/database';
import { getSessionFromRequest } from '@/lib/session';
import { PrintableKeepsake } from '@/components/dashboard/PrintableKeepsake';

export const dynamic = 'force-dynamic';

const LEDGER_ROLES = new Set(['OWNER', 'BRIDE', 'GROOM']);

export default async function PrintKeepsakePage({ params }: { params: { slug: string } }) {
  const wedding = await dbRepo.getWeddingBySlug(params.slug);
  if (!wedding) notFound();

  const [photos, guestbook, bouquetCatches, auth] = await Promise.all([
    dbRepo.listPhotos(wedding.id),
    dbRepo.listGuestbook(wedding.id),
    dbRepo.listBouquetCatches(wedding.id),
    getSessionFromRequest(),
  ]);

  let privateLedger = null;
  if (auth) {
    const member = await dbRepo.getMember(wedding.id, auth.user.id);
    if (wedding.ownerId === auth.user.id || (member && LEDGER_ROLES.has(member.role))) {
      privateLedger = await dbRepo.getPrivateGiftLedger(wedding.id);
    }
  }

  return (
    <PrintableKeepsake
      wedding={toPublicWedding(wedding)}
      photos={photos}
      guestbook={guestbook}
      bouquetCatches={bouquetCatches}
      privateLedger={privateLedger}
    />
  );
}
