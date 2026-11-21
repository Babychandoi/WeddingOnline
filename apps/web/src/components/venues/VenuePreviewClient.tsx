'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { DEFAULT_BRIDE_PERSON, DEFAULT_GROOM_PERSON, getPrefabCenterWorld, getTableSeatAnchors, type SceneLayoutDocument } from '@dco/shared';
import type { BouquetView, RemoteNpcView, RemotePlayerView } from '../three/VenueScene';
import { GARDEN_PHOTO_CAMERA } from '../three/gardenReference';
import type { VenuePhotoReference } from '../three/venuePhotoReferences';

const VenueScene = dynamic(() => import('../three/VenueScene').then((mod) => mod.VenueScene), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm font-medium text-slate-700">
      Đang dựng sảnh cưới 3D…
    </div>
  ),
});

const VenuePhotoCanvas = dynamic(() => import('../three/VenuePhotoCanvas').then((mod) => mod.VenuePhotoCanvas), { ssr: false });

const NOOP = () => {};
const IDLE_BOUQUET: BouquetView = {
  status: 'IDLE',
  originX: 0,
  originZ: -12,
  targetX: 0,
  targetZ: -6,
  tossStartTs: 0,
  flightDurationMs: 2400,
};
// The couple greeting guests in front of the stage
const COUPLE: RemoteNpcView[] = [
  { npcId: 'BRIDE', displayName: 'Cô Dâu', outfitId: 'vay_cuoi_trang', personId: DEFAULT_BRIDE_PERSON, isTakenOver: false, x: -0.9, z: -8.8, rotY: 0, anim: 'wave' },
  { npcId: 'GROOM', displayName: 'Chú Rể', outfitId: 'vest_chu_re', personId: DEFAULT_GROOM_PERSON, isTakenOver: false, x: 0.9, z: -8.8, rotY: 0, anim: 'wave' },
];

// Real, motion-captured people (Rocketbox); the stylised look shows while they load
const GUEST_LOOKS = [
  { outfitId: 'ao_dai_guest', hairId: 'hair_3', hairColor: '#1f2937', personId: 'business_female_02' },
  { outfitId: 'vest_suit', hairId: 'hair_1', hairColor: '#2b2118', personId: 'business_male_01' },
  { outfitId: 'evening_dress', hairId: 'hair_6', hairColor: '#78350f', personId: 'female_party_02' },
  { outfitId: 'smart_casual', hairId: 'hair_2', hairColor: '#1f2937', personId: 'business_male_02' },
  { outfitId: 'ao_dai_guest', hairId: 'hair_4', hairColor: '#3b2a1e', personId: 'business_female_04' },
  { outfitId: 'vest_suit', hairId: 'hair_2', hairColor: '#111827', personId: 'male_adult_03' },
  { outfitId: 'evening_dress', hairId: 'hair_3', hairColor: '#1f2937', personId: 'female_adult_14' },
  { outfitId: 'smart_casual', hairId: 'hair_1', hairColor: '#4a3426', personId: 'business_male_03' },
];

/** A few guests so the showcase looks like a party: some seated at tables, some mingling */
function sampleGuests(layout: SceneLayoutDocument): RemotePlayerView[] {
  const guests: RemotePlayerView[] = [];
  const base = { userId: '', role: 'GUEST', side: 'FRIEND', hasBouquetCrown: false, isSpeaking: false, bubbleText: '' };
  let n = 0;
  const tables = layout.prefabs.filter((p) => getTableSeatAnchors(p).length > 0).slice(0, 4);
  tables.forEach((table, ti) => {
    const seats = getTableSeatAnchors(table);
    [0, Math.floor(seats.length / 2) + ti % 2].forEach((si) => {
      const seat = seats[si % seats.length];
      const look = GUEST_LOOKS[n % GUEST_LOOKS.length];
      guests.push({ ...base, ...look, sessionId: `preview_${n++}`, displayName: '', x: seat.x, z: seat.z, rotY: seat.rotY, anim: 'sit', seatedTableNo: ti, seatIndex: si });
    });
  });
  // A small group chatting beside the aisle, halfway to the stage
  const stage = layout.prefabs.find((p) => p.prefabType === 'STAGE_MAIN');
  const sz = stage ? getPrefabCenterWorld(stage).z + 6.5 : -5;
  const mingle: Array<[number, number, number, string]> = [
    [2.2, sz, -2.2, 'idle'],
    [3.3, sz + 0.5, -1.4 - Math.PI / 2, 'clap'],
    [2.6, sz + 1.3, Math.PI - 0.5, 'idle'],
    [-2.6, sz + 3, 0.6, 'wave'],
  ];
  mingle.forEach(([x, z, rotY, anim]) => {
    const look = GUEST_LOOKS[n % GUEST_LOOKS.length];
    guests.push({ ...base, ...look, sessionId: `preview_${n++}`, displayName: '', x, z, rotY, anim, seatedTableNo: -1, seatIndex: -1 });
  });
  return guests;
}

export interface VenuePreviewInfo {
  id: string;
  nameVi: string;
  place: string;
  regionName: string;
  descriptionVi: string;
  sky: string;
}

export function VenuePreviewClient({
  venue,
  layout,
  prev,
  next,
  reference,
  initialReference,
  capture,
  camera,
}: {
  venue: VenuePreviewInfo;
  layout: SceneLayoutDocument;
  prev: { id: string; nameVi: string };
  next: { id: string; nameVi: string };
  reference?: VenuePhotoReference;
  initialReference: boolean;
  /** Still frame with no overlay, for rendering gallery thumbnails */
  capture: boolean;
  /** Capture-only camera override: [x, y, z, targetX, targetY, targetZ] */
  camera?: number[];
}) {
  const guests = React.useMemo(() => sampleGuests(layout), [layout]);
  const [referenceView, setReferenceView] = React.useState(initialReference);
  const showingReference = Boolean(reference && referenceView);
  const photoComposition = reference?.kind === 'garden' && referenceView;
  const separateReference = reference && referenceView && reference.kind !== 'garden' ? reference : undefined;
  const cameraOverride =
    camera && camera.length === 6
      ? { position: [camera[0], camera[1], camera[2]] as [number, number, number], target: [camera[3], camera[4], camera[5]] as [number, number, number] }
      : undefined;
  const previewCamera = cameraOverride ?? (photoComposition ? GARDEN_PHOTO_CAMERA : undefined);
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden" style={{ backgroundColor: venue.sky }}>
      {separateReference ? (
        <VenuePhotoCanvas key={venue.id} reference={separateReference} background={venue.sky} capture={capture} cameraOverride={cameraOverride} />
      ) : <VenueScene
        key={`${venue.id}-${photoComposition}`}
        mode="preview"
        photoComposition={photoComposition}
        previewAutoRotate={!capture}
        previewCamera={previewCamera}
        layout={layout}
        tier="VIP_FULFILLMENT"
        photos={[]}
        localSessionId=""
        players={photoComposition ? [] : guests}
        npcs={photoComposition ? [] : COUPLE}
        bouquet={IDLE_BOUQUET}
        activeRitual="NONE"
        giftBurstKey={0}
        joystickInput={{ dx: 0, dz: 0 }}
        onMove={NOOP}
        onSitSeat={NOOP}
        onOpenGuestbook={NOOP}
        onOpenGiftBox={NOOP}
        onOpenVideo={NOOP}
        onOpenPhoto={NOOP}
      />}

      {!capture && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-6">
            <Link
              href="/khong-gian"
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-xs font-bold text-slate-800 shadow-md backdrop-blur transition hover:bg-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Tất cả không gian
            </Link>
            <div className="pointer-events-auto flex gap-1.5">
              <Link
                href={`/khong-gian/${prev.id}`}
                aria-label={`Không gian trước: ${prev.nameVi}`}
                title={prev.nameVi}
                className="rounded-full bg-white/90 p-2 text-slate-800 shadow-md backdrop-blur transition hover:bg-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <Link
                href={`/khong-gian/${next.id}`}
                aria-label={`Không gian tiếp theo: ${next.nameVi}`}
                title={next.nameVi}
                className="rounded-full bg-white/90 p-2 text-slate-800 shadow-md backdrop-blur transition hover:bg-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 sm:p-6">
            <div className="pointer-events-auto max-w-md rounded-3xl border border-amber-200/80 bg-white/95 p-5 shadow-xl backdrop-blur">
              <h1 className="font-serif text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">{venue.nameVi}</h1>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {venue.place} · {venue.regionName}
              </p>
              {reference ? (
                <>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                  <button type="button" onClick={() => setReferenceView(true)} aria-pressed={showingReference} className={`min-h-11 rounded-lg px-2.5 ${showingReference ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
                    Góc ảnh 3D
                  </button>
                  <button type="button" onClick={() => setReferenceView(false)} aria-pressed={!showingReference} className={`min-h-11 rounded-lg px-2.5 ${!showingReference ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
                    Toàn sảnh
                  </button>
                  <a href={reference.sourceUrl} title={reference.title} target="_blank" rel="noreferrer" className="ml-1 inline-flex min-h-11 items-center rounded-lg px-2 text-slate-700 underline underline-offset-4 hover:text-rose-700">
                    Ảnh gốc
                  </a>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Ảnh của {reference.credit} · <a href={reference.licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">{reference.license}</a>
                </p>
                {showingReference && reference.kind === 'relief' && <p className="mt-1 text-xs text-slate-600">{reference.subject} · Dựng nổi từ ảnh chụp</p>}
                </>
              ) : (
                <p className="mt-2.5 text-[13px] leading-relaxed text-slate-700">{venue.descriptionVi}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  href={`/create?template=${encodeURIComponent(venue.id)}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-bold text-white shadow transition hover:bg-rose-800"
                >
                  <Sparkles className="h-4 w-4" /> Tạo sảnh cưới với không gian này
                </Link>
                <span className="text-[11px] text-slate-600">
                  {separateReference?.kind === 'relief' ? 'Kéo để nghiêng' : 'Kéo để xoay'}
                  <span className="hidden [@media(pointer:fine)]:inline"> · cuộn để phóng sát</span>
                  <span className="[@media(pointer:fine)]:hidden"> · mở hai ngón để phóng sát</span>
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
