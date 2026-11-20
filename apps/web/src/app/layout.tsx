import type { Metadata, Viewport } from 'next';
// Self-hosted fonts (scripts/fetch-fonts.mjs): the build never downloads from Google
import './fonts.css';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'DamCuoiOnline.vn — Sảnh Cưới 3D Trực Tuyến & Kỷ Niệm Vĩnh Viễn',
  description:
    'Tổ chức đám cưới online 3D Chibi: dạo sảnh tiệc, ngồi bàn 1-2-3 Dzô, bắt hoa cưới, chụp Photobooth và mừng cưới VietQR minh bạch.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="vi">
        <body className="font-sans antialiased selection:bg-rose-200 selection:text-rose-950">
          {children}
        </body>
      </html>
      );
}
