import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Scale, Sparkles } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { PUBLISHED_GUIDES, buildArticleJsonLd } from '@/lib/guides';
import { buildBreadcrumbJsonLd, canonicalUrl } from '@/lib/seo';

const GUIDE = PUBLISHED_GUIDES[3];

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
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: GUIDE.title }],
  },
  twitter: {
    card: 'summary_large_image',
    title: GUIDE.title,
    description: GUIDE.description,
    images: ['/opengraph-image'],
  },
};

export default function OnlineVsPaperComparisonPage() {
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
          <p className="flex items-center gap-1.5 font-bold text-rose-900">
            <Scale className="h-4 w-4" /> Kết luận nhanh cho đám cưới 300 khách:
          </p>
          <p className="mt-1">
            Thiệp cưới online tốn chỉ <strong>99.000đ/tháng – 599.000đ trọn đời</strong> không giới hạn số khách (tiết kiệm
            75–95% so với 1,8 – 4,5 triệu đồng in 300 thiệp giấy), kèm sẵn Google Maps, RSVP tự động và album ảnh cưới.
            Phương án tối ưu nhất tại Việt Nam là <strong>kết hợp 40% thiệp giấy cho bậc trưởng bối</strong> (có in mã
            QR) + <strong>60% thiệp cưới online gửi Zalo</strong> cho bạn bè, đồng nghiệp và người thân ở xa.
          </p>
        </div>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-slate-700">
          <section>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              1. Bảng so sánh chi tiết: Thiệp Cưới Online vs Thiệp Giấy
            </h2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-amber-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-amber-200 bg-amber-50/70 text-xs uppercase text-amber-950">
                  <tr>
                    <th className="px-4 py-3">Tiêu chí</th>
                    <th className="px-4 py-3">Thiệp Cưới Online</th>
                    <th className="px-4 py-3">Thiệp Giấy Truyền Thống</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-900">Chi phí cho 300 khách</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">99.000đ/tháng – 599.000đ trọn đời (không giới hạn lượt gửi)</td>
                    <td className="px-4 py-3">1.800.000đ – 4.500.000đ (6.000đ – 15.000đ/thiệp)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-900">Thời gian hoàn thiện</td>
                    <td className="px-4 py-3">5 – 15 phút, sửa nội dung &amp; đổi giờ ngay lập tức</td>
                    <td className="px-4 py-3">5 – 10 ngày thiết kế, in ấn, viết tay &amp; đi phát</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-900">Cá nhân hóa tên khách</td>
                    <td className="px-4 py-3">Tự động hiện “Kính mời” theo tên từng khách trên phong bì</td>
                    <td className="px-4 py-3">Viết tay từng phong bì, dễ sai chính tả</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-900">Tính năng tương tác</td>
                    <td className="px-4 py-3">Album lật sách 3D, đếm ngược, Google Maps, RSVP, Sổ lời chúc, VietQR</td>
                    <td className="px-4 py-3">Chỉ hiển thị chữ và bản đồ vẽ tĩnh</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-900">Độ trang trọng với người lớn tuổi</td>
                    <td className="px-4 py-3">Phù hợp bạn bè, đồng nghiệp, họ hàng ở xa</td>
                    <td className="px-4 py-3 font-semibold text-amber-900">Rất trang trọng khi trao tận tay ông bà, cô bác</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              2. Công thức kết hợp 40/60 tiết kiệm nhất cho cặp đôi Việt
            </h2>
            <p className="mt-2.5">
              Thay vì phải chọn một bỏ một, đa số cặp đôi hiện đại áp dụng mô hình kết hợp cực kỳ hợp lý:
            </p>
            <ul className="mt-3 list-disc space-y-2.5 pl-5">
              <li>
                <strong>In thiệp giấy số lượng vừa đủ (khoảng 100–120 thiệp)</strong> để trao tận tay họ hàng lớn tuổi,
                láng giềng và đối tác quan trọng của bố mẹ hai bên.
              </li>
              <li>
                <strong>Tải file mã QR chuẩn in 1200×1600px</strong> từ bảng quản trị DamCuoiOnline.vn để in nhỏ ở mặt
                sau thiệp giấy — khách lớn tuổi cầm thiệp giấy trang trọng, còn con cháu quét QR là mở ngay Google Maps,
                album ảnh cưới và Sảnh Cưới 3D.
              </li>
              <li>
                <strong>Gửi thiệp cưới online cá nhân hóa qua Zalo/Facebook</strong> cho toàn bộ bạn học, đồng nghiệp,
                nhóm hội và bạn bè ở tỉnh xa hoặc nước ngoài để gom RSVP chính xác số mâm cỗ.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              3. Khi nào nên dùng 100% Thiệp Cưới Online + Sảnh Cưới 3D?
            </h2>
            <p className="mt-2">
              Nếu bạn tổ chức tiệc thân mật (Intimate Wedding), cưới ở điểm du lịch (Destination Wedding tại Đà Lạt, Phú
              Quốc, Hội An) hoặc có đông bạn bè/họ hàng sinh sống ở nhiều quốc gia, việc dùng trọn bộ{' '}
              <Link href="/thiep-cuoi" className="font-bold text-rose-700 underline underline-offset-2">
                thiệp cưới online
              </Link>{' '}
              kết hợp{' '}
              <Link href="/khong-gian" className="font-bold text-rose-700 underline underline-offset-2">
                sảnh cưới 3D trực tuyến
              </Link>{' '}
              giúp mọi người đều tham gia chung vui trọn vẹn mà không phát sinh chi phí in ấn hay vận chuyển.
            </p>
          </section>
        </div>

        <footer className="mt-12 rounded-3xl border border-rose-200 bg-rose-50/70 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-rose-950">Thử thiết kế thiệp cưới online ngay hôm nay</h2>
              <p className="mt-1 text-sm text-slate-700">
                Chọn 1 trong 100 mẫu thiết kế, xem trước miễn phí và tải file QR in thiệp giấy ngay trong quản trị.
              </p>
            </div>
            <Link
              href="/thiep-cuoi"
              className="inline-flex min-h-[48px] items-center gap-1.5 rounded-full bg-rose-700 px-6 text-sm font-bold text-white shadow hover:bg-rose-800"
            >
              <Sparkles className="h-4 w-4" /> Khám phá 100 mẫu thiệp <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-4 border-t border-rose-200/70 pt-4 text-xs font-semibold text-slate-600">
            <Link href="/huong-dan" className="inline-flex items-center gap-1 hover:text-rose-700 hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" /> Về Cẩm nang
            </Link>
            <Link href="/huong-dan/dam-cuoi-online-3d" className="hover:text-rose-700 hover:underline">
              Tìm hiểu Đám Cưới Online 3D →
            </Link>
          </div>
        </footer>
      </article>
    </main>
  );
}
