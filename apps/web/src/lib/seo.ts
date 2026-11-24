/**
 * Central SEO constants & helpers for DamCuoiOnline.vn.
 * Always resolves a clean canonical origin without a trailing slash.
 */
const RAW_SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://poiplegal.online';
export const SITE_URL = RAW_SITE_URL.replace(/\/+$/, '');
export const BRAND_NAME = 'DamCuoiOnline.vn';

/** Showcase / demo weddings that are intentionally indexable; customer weddings default to noindex for privacy. */
export const PUBLIC_DEMO_SLUGS = new Set<string>(['plaza', 'minh-va-linh', 'duy-va-thao-kyniem']);

export function canonicalUrl(pathname: string): string {
  const clean = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return clean === '/' ? `${SITE_URL}/` : `${SITE_URL}${clean}`;
}

export function isPublicDemoSlug(slug: string): boolean {
  return PUBLIC_DEMO_SLUGS.has(slug);
}

/** SEO-clean hyphenated venue slug (`vn_hoi_an` -> `vn-hoi-an`) */
export function venueSlug(id: string): string {
  return id.replace(/_/g, '-');
}

/** Resolve either hyphenated (`vn-hoi-an`) or legacy underscore (`vn_hoi_an`) param back to internal venue ID */
export function venueIdFromParam(param: string): string {
  return param.replace(/-/g, '_');
}

/** Build site-wide Organization + WebSite JSON-LD graph */
export function buildOrganizationGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: BRAND_NAME,
        alternateName: 'Đám Cưới Online 3D',
        url: `${SITE_URL}/`,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/opengraph-image`,
          width: 1200,
          height: 630,
        },
        description:
          'Nền tảng tạo thiệp cưới online (100 mẫu thiết kế lật sách 3D) và tổ chức sảnh cưới 3D trực tuyến (101 không gian Việt Nam & thế giới), tích hợp mừng cưới VietQR minh bạch qua SePay.',
        areaServed: 'VN',
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: BRAND_NAME,
        inLanguage: 'vi',
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
    ],
  };
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}
