import { notFound } from 'next/navigation';
import { dbRepo, toPublicWedding } from '@dco/database';
import { STARTER_TEMPLATES } from '@dco/shared';
import { isHardenedProduction } from '@dco/shared/server';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ params, searchParams }: { params: { slug: string }; searchParams: { tab?: string } }) {
  const wedding = await dbRepo.getWeddingBySlug(params.slug);
  if (!wedding) notFound();

  const [scene, photos] = await Promise.all([
    dbRepo.getSceneByWeddingId(wedding.id),
    dbRepo.listPhotos(wedding.id),
  ]);
  const layout = scene?.layoutData ?? STARTER_TEMPLATES.luxury_ballroom.layout;

  return (
    <DashboardClient
      wedding={toPublicWedding(wedding)}
      ownerId={wedding.ownerId}
      layout={layout}
      photos={photos}
      devAuthEnabled={!isHardenedProduction()}
      initialTab={searchParams.tab === 'thiep' ? 'thiep' : undefined}
    />
  );
}
