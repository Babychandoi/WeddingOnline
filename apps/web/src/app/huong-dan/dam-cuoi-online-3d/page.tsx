import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Globe2, Mic, Sparkles, Users } from 'lucide-react';
import { TIER_CATALOG } from '@dco/shared';
import { JsonLd } from '@/components/seo/JsonLd';
import { PUBLISHED_GUIDES, buildArticleJsonLd } from '@/lib/guides';
import { buildBreadcrumbJsonLd, canonicalUrl } from '@/lib/seo';

const GUIDE = PUBLISHED_GUIDES[2];

export const metadata: Metadata = {
  title: GUIDE.seoTitle,
  description: GUIDE.description,
  alternates: { canonical: canonicalUrl(GUIDE.href) },
  openGraph: {
    type: 'article',
    locale: 'vi_VN',
    url: canonicalUrl(GUIDE.href),
    title: GUIDE.title,
    description: GUIDE.description,
    images: [{ url: '/venues/vn_hoi_an.webp?v=3', width: 640, height: 400, alt: GUIDE.title }],
  },
  twitter: {
    card: 'summary_large_image',
    title: GUIDE.title,
    description: GUIDE.description,
    images: ['/venues/vn_hoi_an.webp?v=3'],
  },
};

export default function Online3DWeddingGuidePage() {
  return (
    <main className="min-h-screen bg-[#FFFDF8] text-slate-900">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Trang chủ', path: '/' },
          { name: 'Hướng dẫn', path: '/huong-dan' },
          { name: GUIDE.shortTitle, path: GUIDE.href },
        ])}
      />
      <JsonLd data={buildArticleJsonLd(GUIDE)} />

      <article className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 overflow-hidden whitespace-nowrap text-xs font-bold text-slate-500">
          <Link href="/" className="shrink-0 hover:text-rose-700">
            Trang chủ
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/huong-dan" className="shrink-0 hover:text-rose-700">
            Hướng dẫn
          </Link>
          <span aria-hidden="true">/</span>
          <span className="truncate text-slate-800">{GUIDE.shortTitle}</span>
        </nav>

        <h1 className="mt-5 font-serif text-3xl font-bold leading-tight text-slate-900 sm:text-5xl">
          {GUIDE.title}
        </h1>
        <p className="mt-3 text-xs font-medium text-slate-500">
          Cập nhật: 24/11/2026 · Thời gian đọc: {GUIDE.readingTimeMin} phút · Chuyên mục: {GUIDE.category}
        </p>

        {/* Answer-first summary */}
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-sm leading-relaxed text-amber-950">
          <p className="font-bold text-rose-900">Tóm tắt nhanh:</p>
          <p className="mt-1">
            Đám cưới online 3D (Hybrid Wedding) cho phép người thân, bạn bè ở nước ngoài mở đường dẫn trên trình duyệt
            điện thoại hoặc máy tính trong 5 giây — không cần cài app — để bước vào sảnh cưới 3D (như Lễ Gia Tiên, Phố
            Cổ Hội An, Rạp Lá Dừa Miền Tây), ngồi bàn trò chuyện Voice Chat LiveKit, chụp ảnh Photobooth và lưu trữ
            Trang Kỷ Niệm 2D vĩnh viễn.
          </p>
        </div>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-slate-700">
          <section>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              1. Khác biệt giữa Sảnh Cưới 3D trực tuyến và Livestream thông thường
            </h2>
            <p className="mt-2.5">
              Livestream qua Facebook hoặc Zoom chỉ là luồng phát một chiều: khách ở xa ngồi xem thụ động, khó trò chuyện
              riêng với nhóm bạn học hay họ hàng từng bàn, và dễ lạc lời chúc trong dòng bình luận trôi nhanh. Ngược lại,
              một <strong>Sảnh Cưới 3D trực tuyến</strong> tái hiện không gian tiệc tương tác thực sự:
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-amber-200 bg-white p-5">
                <Mic className="h-5 w-5 text-rose-700" />
                <h3 className="mt-2 font-bold text-slate-900">Voice Chat tách theo từng bàn tiệc</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Khách đi dạo nghe nhạc nền dịu nhẹ; chỉ khi ngồi xuống bàn tiệc mới kết nối thoại nhóm qua LiveKit SFU.
                  Khi MC bật mic sân khấu làm lễ, nhạc tự giảm -20dB và tiếng bàn tự giảm -12dB.
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-white p-5">
                <Users className="h-5 w-5 text-amber-700" />
                <h3 className="mt-2 font-bold text-slate-900">Dual-Mode Auto-NPC &amp; Nhập Vai</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Trong tiệc Hybrid, khi Cô Dâu Chú Rể bận tiếp khách ngoài nhà hàng, Auto-NPC tự động đứng đón, dẫn
                  nghi thức đúng giờ; bấm 1 nút để nhập vai trực tiếp chào bà con phương xa bất cứ lúc nào.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              2. Top không gian cưới 3D Việt Nam &amp; quốc tế được yêu thích
            </h2>
            <p className="mt-2">
              Hệ thống cung cấp sẵn{' '}
              <Link href="/khong-gian" className="font-bold text-rose-700 underline underline-offset-2">
                101 không gian cưới 3D
              </Link>{' '}
              có thể xoay 360° trực tiếp trên trình duyệt và tùy chỉnh vị trí bàn tiệc bằng trình kéo thả 60×60 Grid-Snap:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <Link href="/khong-gian/vn-gia-tien" className="font-bold text-rose-700 hover:underline">
                  Lễ Gia Tiên Nhà Ba Gian
                </Link>{' '}
                — giữ trọn không khí truyền thống Bắc – Trung – Nam cho gia đình nhiều thế hệ.
              </li>
              <li>
                <Link href="/khong-gian/mekong-coconut-tent" className="font-bold text-rose-700 hover:underline">
                  Rạp Lá Dừa Miền Tây
                </Link>{' '}
                — cổng lá dừa sông nước ấm cúng, thân quen với kiều bào xa quê.
              </li>
              <li>
                <Link href="/khong-gian/vn-hoi-an" className="font-bold text-rose-700 hover:underline">
                  Phố Cổ Hội An Đèn Lồng
                </Link>{' '}
                &amp;{' '}
                <Link href="/khong-gian/vn-phu-quoc-beach" className="font-bold text-rose-700 hover:underline">
                  Bãi Biển Hoàng Hôn Phú Quốc
                </Link>{' '}
                — bối cảnh lãng mạn cho tiệc cưới kết hợp bạn bè quốc tế.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              3. Chi phí tổ chức sảnh cưới 3D &amp; lưu giữ Kỷ Niệm 2D vĩnh viễn
            </h2>
            <p className="mt-2">
              Mỗi gói thanh toán một lần, tự động chia sảnh mượt mà (60 CCU/sảnh) và tự chuyển thành{' '}
              <Link href="/w/duy-va-thao-kyniem" className="font-semibold text-rose-700 underline underline-offset-2">
                Trang Kỷ Niệm 2D siêu nhẹ
              </Link>{' '}
              cùng tính năng xuất Sổ Kỷ Niệm A4 PDF sau khi kết thúc lễ:
            </p>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-amber-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-amber-200 bg-amber-50/70 text-xs uppercase text-amber-950">
                  <tr>
                    <th className="px-4 py-3">Gói dịch vụ</th>
                    <th className="px-4 py-3">Chi phí</th>
                    <th className="px-4 py-3">Sức chứa / Tính năng nổi bật</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {(['TRIAL_24H', 'HAPPINESS', 'VIP_FULFILLMENT'] as const).map((tierId) => {
                    const t = TIER_CATALOG[tierId];
                    return (
                      <tr key={tierId}>
                        <td className="px-4 py-3 font-bold text-slate-900">{t.nameVi}</td>
                        <td className="px-4 py-3 font-extrabold tabular-nums text-rose-700">
                          {t.priceVnd === 0 ? 'Miễn phí' : `${t.priceVnd.toLocaleString('vi-VN')}đ`}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          Tối đa {t.maxCcu} CCU, {t.maxPhotos} ảnh
                          {t.allowVietQr ? ', kèm Thiệp Cưới Online & VietQR' : ''}
                          {t.allowVoiceChat ? ', LiveKit Voice Chat & Mic MC' : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <footer className="mt-12 rounded-3xl border border-rose-200 bg-rose-50/70 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-rose-950">Bước vào Quảng Trường 3D thử ngay</h2>
              <p className="mt-1 text-sm text-slate-700">
                Không cần đăng ký, không cần cài app — trải nghiệm dạo sảnh và cụng ly 1-2-3 Dzô ngay trên trình duyệt.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/plaza"
                className="inline-flex min-h-[48px] items-center gap-1.5 rounded-full bg-rose-700 px-6 text-sm font-bold text-white shadow hover:bg-rose-800"
              >
                <Globe2 className="h-4 w-4" /> Vào Quảng Trường 24/7
              </Link>
              <Link
                href="/create"
                className="inline-flex min-h-[48px] items-center gap-1.5 rounded-full border border-rose-300 bg-white px-5 text-sm font-bold text-rose-800 hover:bg-rose-50"
              >
                <Sparkles className="h-4 w-4" /> Tạo sảnh riêng <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="mt-5 border-t border-rose-200/70 pt-4 text-xs font-semibold text-slate-600">
            <Link href="/huong-dan" className="inline-flex items-center gap-1 hover:text-rose-700 hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" /> Quay lại Cẩm nang cưới số
            </Link>
          </div>
        </footer>
      </article>
    </main>
  );
}
