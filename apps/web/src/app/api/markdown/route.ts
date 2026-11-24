import { NextRequest } from 'next/server';
import { INVITATION_2D_TEMPLATES, INVITATION_3D_PLANS, INVITATION_3D_TEMPLATES, INVITATION_PLANS, INVITATION_TEMPLATES, TIER_CATALOG, VENUE_THEMES } from '@dco/shared';
import { PUBLISHED_GUIDES } from '@/lib/guides';
import { SITE_URL, canonicalUrl, venueSlug } from '@/lib/seo';

function buildMarkdownForPath(rawPath: string): string {
  const path = rawPath === '/' ? '/' : rawPath.replace(/\/+$/, '');
  const guide = PUBLISHED_GUIDES.find((g) => g.href === path);
  if (guide) {
    return [
      `# ${guide.title}`,
      '',
      `> ${guide.description}`,
      '',
      `- **Canonical URL**: ${canonicalUrl(guide.href)}`,
      `- **Category**: ${guide.category}`,
      `- **Updated**: ${guide.updatedAt}`,
      `- **Platform**: DamCuoiOnline.vn (${SITE_URL})`,
      '',
      '## Related Public Resources',
      `- [100 Mẫu Thiệp Cưới Online](${canonicalUrl('/thiep-cuoi')})`,
      `- [101 Không Gian Sảnh Cưới 3D](${canonicalUrl('/khong-gian')})`,
      `- [Cẩm Nang Cưới Số](${canonicalUrl('/huong-dan')})`,
      `- [Quảng Trường Cưới 3D 24/7](${canonicalUrl('/plaza')})`,
      '',
    ].join('\n');
  }

  if (path === '/thiep-cuoi') {
    const plans = INVITATION_PLANS.map(
      (p) => `- **${p.nameVi}**: ${p.priceVnd.toLocaleString('vi-VN')} VND`,
    ).join('\n');
    const sample = INVITATION_2D_TEMPLATES.slice(0, 12)
      .map((t) => `- [${t.nameVi}](${canonicalUrl(`/thiep-cuoi/${t.id}`)}): ${t.descriptionVi}`)
      .join('\n');
    return [
      `# ${INVITATION_2D_TEMPLATES.length} Mẫu Thiệp Cưới Online 2D Đẹp — DamCuoiOnline.vn`,
      '',
      '> Thiệp cưới online 2D mở phong bì ghi tên từng khách, lịch âm dương, đếm ngược, bản đồ Google Maps, album lật sách 3D, RSVP, sổ lời chúc và hộp mừng cưới VietQR 0% phí (ẩn số tiền công khai).',
      '',
      '## Bảng Giá Phát Hành Thiệp Cưới 2D (Thiết kế & xem trước miễn phí)',
      plans,
      '',
      '## Dòng Cao Cấp Thiệp Cưới 3D Dạo Bước Tương Tác (199.000đ/tháng · 799.000đ trọn đời)',
      `- [${INVITATION_3D_TEMPLATES.length} Bộ Thiệp Cưới 3D](${canonicalUrl('/thiep-cuoi-3d')})`,
      '',
      '## Mẫu Thiệp 2D Nổi Bật',
      sample,
      '',
    ].join('\n');
  }

  if (path === '/thiep-cuoi-3d') {
    const plans = INVITATION_3D_PLANS.map(
      (p) => `- **${p.nameVi}**: ${p.priceVnd.toLocaleString('vi-VN')} VND`,
    ).join('\n');
    const items = INVITATION_3D_TEMPLATES
      .map((t) => `- [${t.nameVi}](${canonicalUrl(`/thiep-cuoi/${t.id}`)}): ${t.descriptionVi}`)
      .join('\n');
    return [
      `# ${INVITATION_3D_TEMPLATES.length} Bộ Thiệp Cưới 3D Dạo Bước Tương Tác — DamCuoiOnline.vn`,
      '',
      '> Trải nghiệm 3D toàn màn hình với chuyển cảnh camera đa góc qua Cổng cưới, Cô dâu chú rể chào theo tên, Giá vẽ Lời chào, 6 Giá vẽ Kỷ niệm, Thông tin lễ & Lễ đài + cần điều khiển đi dạo tự do 360°.',
      '',
      '## Bảng Giá Thiệp Cưới 3D (Thiết kế nháp miễn phí)',
      plans,
      '',
      '## 10 Chủ Đề Thiệp Cưới 3D',
      items,
      '',
    ].join('\n');
  }

  if (path === '/khong-gian') {
    const sample = VENUE_THEMES.slice(0, 12)
      .map((v) => `- [${v.nameVi}](${canonicalUrl(`/khong-gian/${venueSlug(v.id)}`)}) (${v.place}): ${v.descriptionVi}`)
      .join('\n');
    return [
      `# ${VENUE_THEMES.length} Không Gian Sảnh Cưới 3D — DamCuoiOnline.vn`,
      '',
      '> Sảnh cưới 3D trực tuyến ngay trên trình duyệt không cần cài ứng dụng: 60 CCU/sảnh, Voice Chat từng bàn LiveKit, Dual-Mode Auto-NPC, Photobooth & lưu trữ Trang Kỷ Niệm 2D vĩnh viễn.',
      '',
      '## Không Gian Tiêu Biểu',
      sample,
      '',
    ].join('\n');
  }

  // Default / Homepage summary
  return [
    '# DamCuoiOnline.vn — Thiệp Cưới Online & Sảnh Cưới 3D Trực Tuyến',
    '',
    `> Nền tảng tạo ${INVITATION_TEMPLATES.length} mẫu thiệp cưới online lật sách 3D và tổ chức ${VENUE_THEMES.length} không gian sảnh cưới 3D trực tuyến trên trình duyệt, tích hợp Voice Chat từng bàn LiveKit, Auto-NPC, Photobooth và mừng cưới VietQR 0% phí (ẩn tuyệt đối số tiền công khai).`,
    '',
    '## Các Trang Cốt Lõi',
    `- [Trang chủ](${canonicalUrl('/')})`,
    `- [${INVITATION_2D_TEMPLATES.length} Mẫu Thiệp Cưới Online 2D](${canonicalUrl('/thiep-cuoi')})`,
    `- [${INVITATION_3D_TEMPLATES.length} Bộ Thiệp Cưới 3D Tương Tác](${canonicalUrl('/thiep-cuoi-3d')})`,
    `- [${VENUE_THEMES.length} Không Gian Cưới 3D](${canonicalUrl('/khong-gian')})`,
    `- [Quảng Trường Cưới 3D 24/7 Miễn Phí](${canonicalUrl('/plaza')})`,
    `- [Cẩm Nang & Hướng Dẫn Cưới Số](${canonicalUrl('/huong-dan')})`,
    ...PUBLISHED_GUIDES.map((g) => `- [${g.title}](${canonicalUrl(g.href)})`),
    '',
    '## Bảng Gói Sảnh Cưới 3D (VND)',
    `- **${TIER_CATALOG.TRIAL_24H.nameVi}**: Miễn phí (tối đa ${TIER_CATALOG.TRIAL_24H.maxCcu} CCU)`,
    `- **${TIER_CATALOG.HAPPINESS.nameVi}**: ${TIER_CATALOG.HAPPINESS.priceVnd.toLocaleString('vi-VN')}đ (kèm Thiệp Cưới Online & VietQR)`,
    `- **${TIER_CATALOG.VIP_FULFILLMENT.nameVi}**: ${TIER_CATALOG.VIP_FULFILLMENT.priceVnd.toLocaleString('vi-VN')}đ (Voice Chat LiveKit, MC, Auto-NPC, Kỷ Niệm 2D vĩnh viễn)`,
    '',
    '## Pháp Lý & Hỗ Trợ',
    `- [Chính Sách Bảo Mật](${canonicalUrl('/chinh-sach-bao-mat')})`,
    `- [Điều Khoản Sử Dụng](${canonicalUrl('/dieu-khoan-su-dung')})`,
    `- [Liên Hệ & Hỗ Trợ](${canonicalUrl('/lien-he')})`,
    '',
  ].join('\n');
}

export function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path') || '/';
  const md = buildMarkdownForPath(path);
  const approxTokens = Math.max(1, Math.ceil(md.length / 4));
  return new Response(md, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      Vary: 'Accept',
      'Content-Signal': 'search=yes, ai-input=yes, ai-train=no',
      'X-Markdown-Tokens': String(approxTokens),
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
