import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome';
import { canonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Thiết Kế Thiệp Cưới 3D Tương Tác Miễn Phí — DamCuoiOnline.vn',
  description:
    'Tạo thiệp cưới 3D dạo bước miễn phí bản nháp từ 10 chủ đề độc quyền: ảnh đôi đứng đón khách tách nền, lời chào cá nhân hóa, 6 giá vẽ kỷ niệm 3D và hộp mừng VietQR.',
  alternates: { canonical: canonicalUrl('/thiep-cuoi-3d/tao') },
  openGraph: {
    title: 'Thiết Kế Thiệp Cưới 3D Tương Tác Miễn Phí — DamCuoiOnline.vn',
    description:
      'Chọn 1 trong 10 không gian thiệp cưới 3D toàn màn hình với chuyển cảnh camera đa góc và cần điều khiển tự do.',
    url: canonicalUrl('/thiep-cuoi-3d/tao'),
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
};

export default function Create3DInvitationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
