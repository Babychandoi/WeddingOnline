import type { MetadataRoute } from 'next';
import { INVITATION_TEMPLATES, VENUE_THEMES } from '@dco/shared';
import { PUBLISHED_GUIDES } from '@/lib/guides';
import { canonicalUrl, venueSlug } from '@/lib/seo';

/** Fixed release timestamp so crawlers see real content updates rather than changing timestamps per request */
const CATALOG_LAST_MODIFIED = new Date('2026-11-24T00:00:00.000Z');

export default function sitemap(): MetadataRoute.Sitemap {
  const coreRoutes: MetadataRoute.Sitemap = [
    '/',
    '/thiep-cuoi',
    '/thiep-cuoi-3d',
    '/khong-gian',
    '/bang-gia',
    '/huong-dan',
    ...PUBLISHED_GUIDES.map((g) => g.href),
    '/plaza',
    '/create',
    '/thiep-cuoi/tao',
    '/thiep-cuoi-3d/tao',
    '/ve-chung-toi',
    '/chinh-sach-bao-mat',
    '/dieu-khoan-su-dung',
    '/lien-he',
  ].map((path) => ({
    url: canonicalUrl(path),
    lastModified: CATALOG_LAST_MODIFIED,
  }));

  const templateRoutes: MetadataRoute.Sitemap = INVITATION_TEMPLATES.map((t) => ({
    url: canonicalUrl(`/thiep-cuoi/${t.id}`),
    lastModified: CATALOG_LAST_MODIFIED,
  }));

  const venueRoutes: MetadataRoute.Sitemap = VENUE_THEMES.map((v) => ({
    url: canonicalUrl(`/khong-gian/${venueSlug(v.id)}`),
    lastModified: CATALOG_LAST_MODIFIED,
  }));

  return [...coreRoutes, ...templateRoutes, ...venueRoutes];
}
