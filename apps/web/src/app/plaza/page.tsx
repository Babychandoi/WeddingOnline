import { notFound } from 'next/navigation';
import { dbRepo, toPublicWedding } from '@dco/database';
import { STARTER_TEMPLATES } from '@dco/shared';
import { HallExperience } from '@/components/hall/HallExperience';

export const dynamic = 'force-dynamic';

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
    <HallExperience
      wedding={toPublicWedding(wedding)}
      layout={layout}
      initialPhotos={photos}
      initialGuestbook={guestbook}
    />
  );
}
