import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome';
import { canonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Tạo Sảnh Cưới 3D Trực Tuyến — DamCuoiOnline.vn',
  description:
    'Khởi tạo sảnh cưới 3D trực tuyến với 101 không gian Việt Nam & thế giới, hỗ trợ gói Dùng Thử 24h miễn phí, Voice Chat từng bàn, Auto-NPC và VietQR minh bạch.',
  alternates: { canonical: canonicalUrl('/create') },
  openGraph: {
    title: 'Tạo Sảnh Cưới 3D Trực Tuyến — DamCuoiOnline.vn',
    description:
      'Chọn không gian cưới 3D, đặt đường dẫn riêng và mở phòng dùng thử 24h miễn phí ngay trên trình duyệt.',
    url: canonicalUrl('/create'),
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
};

export default function CreateWeddingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
