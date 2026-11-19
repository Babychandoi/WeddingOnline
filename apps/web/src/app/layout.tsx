import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, Cormorant_Garamond } from 'next/font/google';
import './globals.css';

const displayFont = Cormorant_Garamond({
  subsets: ['vietnamese', 'latin'],
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const sansFont = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

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
      <html lang="vi" className={`${displayFont.variable} ${sansFont.variable}`}>
        <body className="font-sans antialiased selection:bg-rose-200 selection:text-rose-950">
          {children}
        </body>
      </html>
      );
}
