import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome';
import { canonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Thiết Kế Thiệp Cưới Online 2D Miễn Phí — DamCuoiOnline.vn',
  description:
    'Chọn từ 100 mẫu thiệp cưới online 2D, nhập tên cô dâu chú rể, ngày cưới và tải ảnh xem trước miễn phí. Chỉ trả phí (từ 150k) khi phát hành gửi khách qua Zalo/Facebook.',
  alternates: { canonical: canonicalUrl('/thiep-cuoi/tao') },
  openGraph: {
    title: 'Thiết Kế Thiệp Cưới Online 2D Miễn Phí — DamCuoiOnline.vn',
    description:
      'Tạo thiệp cưới điện tử 2D miễn phí bản nháp với 100 mẫu thiết kế, phong bì ghi tên khách và hộp mừng cưới VietQR.',
    url: canonicalUrl('/thiep-cuoi/tao'),
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
};

export default function CreateInvitationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
