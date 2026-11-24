import { BRAND_NAME, SITE_URL, canonicalUrl } from '@/lib/seo';

export interface GuideMeta {
  slug: string;
  href: string;
  category: string;
  seoTitle: string;
  title: string;
  shortTitle: string;
  description: string;
  readingTimeMin: number;
  publishedAt: string;
  updatedAt: string;
}

export const PUBLISHED_GUIDES: GuideMeta[] = [
  {
    slug: 'tao-thiep-cuoi-online',
    href: '/huong-dan/tao-thiep-cuoi-online',
    category: 'Thiệp Cưới Online',
    seoTitle: 'Cách Tạo Thiệp Cưới Online Gửi Zalo — DamCuoiOnline.vn',
    title: 'Hướng Dẫn Tạo Thiệp Cưới Online Đẹp Gửi Zalo Trong 5 Phút',
    shortTitle: 'Cách tạo thiệp cưới online gửi Zalo',
    description:
      '5 bước tạo thiệp cưới online: chọn 1 trong 100 mẫu, ghi tên khách trên phong bì, đổi lịch âm, bật RSVP, hộp mừng VietQR và gửi chuẩn Zalo.',
    readingTimeMin: 6,
    publishedAt: '2026-11-24',
    updatedAt: '2026-11-24',
  },
  {
    slug: 'mung-cuoi-vietqr',
    href: '/huong-dan/mung-cuoi-vietqr',
    category: 'Mừng Cưới VietQR',
    seoTitle: 'Hộp Mừng Cưới VietQR 0% Phí & Ẩn Số Tiền — DamCuoiOnline',
    title: 'Cách Tạo Hộp Mừng Cưới VietQR Tự Động Xác Nhận & Ẩn Số Tiền',
    shortTitle: 'Hộp mừng cưới VietQR 0% phí & bảo mật',
    description:
      'Tích hợp mã VietQR và SePay vào thiệp cưới online: tiền vào thẳng tài khoản cặp đôi (0% phí), tự đăng lời chúc và tuyệt đối ẩn số tiền.',
    readingTimeMin: 5,
    publishedAt: '2026-11-24',
    updatedAt: '2026-11-24',
  },
  {
    slug: 'dam-cuoi-online-3d',
    href: '/huong-dan/dam-cuoi-online-3d',
    category: 'Sảnh Cưới 3D & Hybrid',
    seoTitle: 'Đám Cưới Online 3D & Tiệc Hybrid — DamCuoiOnline.vn',
    title: 'Đám Cưới Online 3D & Tiệc Cưới Hybrid Cho Người Thân Ở Xa',
    shortTitle: 'Tổ chức đám cưới online 3D & Hybrid',
    description:
      'Tổ chức sảnh cưới 3D trên trình duyệt không cần cài app: Voice Chat theo bàn LiveKit, Auto-NPC đón khách, Photobooth & lưu Kỷ niệm 2D.',
    readingTimeMin: 6,
    publishedAt: '2026-11-24',
    updatedAt: '2026-11-24',
  },
  {
    slug: 'thiep-cuoi-online-va-thiep-giay',
    href: '/so-sanh/thiep-cuoi-online-va-thiep-giay',
    category: 'So Sánh & Chi Phí',
    seoTitle: 'So Sánh Thiệp Cưới Online Và Thiệp Giấy — DamCuoiOnline',
    title: 'So Sánh Thiệp Cưới Online Và Thiệp Giấy: Chi Phí & Cách Kết Hợp',
    shortTitle: 'So sánh thiệp online vs thiệp giấy',
    description:
      'Đối chiếu chi phí in 300 thiệp, tốc độ gửi mời, quản lý RSVP, bản đồ và công thức kết hợp 40% thiệp giấy + 60% thiệp online tiết kiệm nhất.',
    readingTimeMin: 5,
    publishedAt: '2026-11-24',
    updatedAt: '2026-11-24',
  },
];

export function buildArticleJsonLd(guide: GuideMeta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    inLanguage: 'vi',
    datePublished: `${guide.publishedAt}T00:00:00+07:00`,
    dateModified: `${guide.updatedAt}T00:00:00+07:00`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl(guide.href),
    },
    image: [canonicalUrl('/opengraph-image')],
    author: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: BRAND_NAME,
      url: `${SITE_URL}/`,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: BRAND_NAME,
      logo: {
        '@type': 'ImageObject',
        url: canonicalUrl('/opengraph-image'),
        width: 1200,
        height: 630,
      },
    },
  };
}
