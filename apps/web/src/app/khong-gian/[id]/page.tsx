import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { STARTER_TEMPLATES, VENUE_REGIONS, VENUE_THEMES, getVenueTheme, isVenueId } from '@dco/shared';

export const dynamic = 'force-dynamic';
import { VenuePreviewClient } from '@/components/venues/VenuePreviewClient';
import { venueThumbnail } from '@/components/venues/VenueCard';
import { getVenuePhotoReference } from '@/components/three/venuePhotoReferences';

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  if (!isVenueId(params.id)) return { title: 'Không tìm thấy không gian — DamCuoiOnline.vn' };
  const venue = getVenueTheme(params.id);
  return {
    title: `${venue.nameVi} — Sảnh cưới 3D | DamCuoiOnline.vn`,
    description: venue.descriptionVi,
    openGraph: { images: [{ url: venueThumbnail(venue.id), width: 640, height: 400 }] },
  };
}

export default function VenuePreviewPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { capture?: string; cam?: string; view?: string };
}) {
  if (!isVenueId(params.id)) notFound();
  const capture = searchParams.capture === '1';
  // Capture-only camera override "x,y,z,tx,ty,tz" (used when rendering close-up stills)
  const cam = capture && typeof searchParams.cam === 'string' ? searchParams.cam.split(',').map(Number) : [];
  const camera = cam.length === 6 && cam.every((v) => Number.isFinite(v) && Math.abs(v) < 500) ? cam : undefined;
  const venue = getVenueTheme(params.id);
  const index = VENUE_THEMES.findIndex((v) => v.id === venue.id);
  const prev = VENUE_THEMES[(index - 1 + VENUE_THEMES.length) % VENUE_THEMES.length];
  const next = VENUE_THEMES[(index + 1) % VENUE_THEMES.length];
  const reference = getVenuePhotoReference(venue.id);
  // The rebuilt halls are the main view. The three standalone compositions keep their opening shot.
  const initialReference = searchParams.view === 'photo'
    || (searchParams.view !== 'hall' && reference !== undefined && reference.kind !== 'relief');

  return (
    <VenuePreviewClient
      key={venue.id}
      venue={{
        id: venue.id,
        nameVi: venue.nameVi,
        place: venue.place,
        regionName: VENUE_REGIONS.find((r) => r.id === venue.region)?.nameVi ?? '',
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
  );
}
