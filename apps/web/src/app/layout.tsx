import type { Metadata, Viewport } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { BRAND_NAME, SITE_URL, buildOrganizationGraph, canonicalUrl } from '@/lib/seo';
// Self-hosted fonts (scripts/fetch-fonts.mjs): the build never downloads from Google
import './fonts.css';
import './globals.css';

const DEFAULT_TITLE = 'Thiệp Cưới Online & Sảnh Cưới 3D — DamCuoiOnline.vn';
const DEFAULT_DESCRIPTION =
  '100 mẫu thiệp cưới online lật sách 3D kèm phong bì ghi tên khách, 101 sảnh cưới 3D trực tuyến, Voice Chat từng bàn và mừng cưới VietQR minh bạch.';

const GOOGLE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined;
const BING_VERIFICATION = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || undefined;

const SPECULATION_RULES = JSON.stringify({
  prefetch: [
    {
      source: 'list',
      urls: ['/thiep-cuoi', '/khong-gian', '/huong-dan', '/plaza'],
      eagerness: 'moderate',
    },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  alternates: {
    canonical: canonicalUrl('/'),
  },
  ...(GOOGLE_VERIFICATION || BING_VERIFICATION
    ? {
        verification: {
          ...(GOOGLE_VERIFICATION ? { google: GOOGLE_VERIFICATION } : {}),
          ...(BING_VERIFICATION ? { other: { 'msvalidate.01': BING_VERIFICATION } } : {}),
        },
      }
    : {}),
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: canonicalUrl('/'),
    siteName: BRAND_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: DEFAULT_TITLE,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ['/opengraph-image'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/fonts/cormorant-garamond/cormorant-garamond-vietnamese-3fcd8d03.woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/fonts/cormorant-garamond/cormorant-garamond-latin-bfeb2e11.woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/fonts/be-vietnam-pro/be-vietnam-pro-vietnamese-ebe22251.woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/fonts/be-vietnam-pro/be-vietnam-pro-latin-b3cac1da.woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/fonts/be-vietnam-pro/be-vietnam-pro-vietnamese-ba57728a.woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="alternate"
          type="text/markdown"
          href="/llms.txt"
          title="DamCuoiOnline.vn Markdown Summary"
        />
        <script
          type="speculationrules"
          // eslint-disable-next-line react/no-danger -- static JSON speculation rules
          dangerouslySetInnerHTML={{ __html: SPECULATION_RULES }}
        />
      </head>
      <body className="font-sans antialiased selection:bg-rose-200 selection:text-rose-950">
        <JsonLd data={buildOrganizationGraph()} />
        {children}
      </body>
    </html>
  );
}
