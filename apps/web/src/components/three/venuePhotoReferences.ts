import { GARDEN_REFERENCE, GARDEN_VENUE } from './gardenReference';
import { HA_LONG_PHOTO_REFERENCE } from './HaLongPhotoReference';
import { HOI_AN_PHOTO_REFERENCE } from './HoiAnPhotoReference';
import catalogue from './catalogPhotoReferences.json';

interface PhotoCredit {
  title: string;
  sourceUrl: string;
  credit: string;
  license: string;
  licenseUrl: string;
}

export type VenuePhotoReference = PhotoCredit & (
  { kind: 'garden' } | { kind: 'halong' } | { kind: 'hoian' }
  | { kind: 'relief'; image: string; width: number; height: number; subject: string }
);

const authored: Record<string, VenuePhotoReference> = {
  [GARDEN_VENUE]: {
    kind: 'garden',
    title: 'Elegant outdoor wedding ceremony setup with floral arch',
    sourceUrl: GARDEN_REFERENCE,
    credit: 'Qodak. stx',
    license: 'Pexels License',
    licenseUrl: 'https://www.pexels.com/license/',
  },
  vn_ha_long_cruise: {
    kind: 'halong',
    title: 'Boat deck facing limestone karst islands',
    sourceUrl: HA_LONG_PHOTO_REFERENCE.source,
    credit: HA_LONG_PHOTO_REFERENCE.credit,
    license: 'Unsplash License',
    licenseUrl: HA_LONG_PHOTO_REFERENCE.license,
  },
  vn_hoi_an: {
    kind: 'hoian',
    title: HOI_AN_PHOTO_REFERENCE.title,
    sourceUrl: HOI_AN_PHOTO_REFERENCE.url,
    credit: HOI_AN_PHOTO_REFERENCE.author,
    license: HOI_AN_PHOTO_REFERENCE.license,
    licenseUrl: HOI_AN_PHOTO_REFERENCE.licenseUrl,
  },
};

const photoCatalogue: Record<string, PhotoCredit & { image: string; width: number; height: number; subject: string }> = catalogue;

export function getVenuePhotoReference(id: string): VenuePhotoReference | undefined {
  const custom = authored[id];
  if (custom) return custom;
  const photo = photoCatalogue[id];
  return photo ? { ...photo, kind: 'relief' } : undefined;
}
