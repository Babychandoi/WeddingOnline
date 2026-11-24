import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { PUBLISHED_GUIDES, buildArticleJsonLd } from '@/lib/guides';
import { buildBreadcrumbJsonLd, canonicalUrl } from '@/lib/seo';

const GUIDE = PUBLISHED_GUIDES[1];

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

export default function VietQrWeddingGiftGuidePage() {
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
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-sm leading-relaxed text-emerald-950">
          <p className="flex items-center gap-1.5 font-bold text-emerald-900">
            <ShieldCheck className="h-4 w-4" /> Tóm tắt nhanh:
          </p>
          <p className="mt-1">
            Hộp mừng cưới VietQR trên DamCuoiOnline.vn chuyển tiền <strong>trực tiếp 100%</strong> vào tài khoản ngân
            hàng của cô dâu chú rể với <strong>0% phí trung gian</strong>. Khi kết nối webhook SePay, giao dịch chuyển
            khoản được tự động ghi nhận kèm lời chúc lên thiệp, nhưng <strong>số tiền mừng luôn ẩn tuyệt đối</strong>{' '}
            với mọi khách mời — chỉ chủ tiệc xem được trong sổ riêng tư.
          </p>
        </div>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-slate-700">
          <section>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              1. Vì sao nhiều cặp đôi e ngại dán ảnh mã QR tĩnh lên thiệp?
            </h2>
            <p className="mt-2.5">
              Cách làm thủ công (chụp màn hình mã QR ngân hàng rồi dán vào cuối thiệp) thường gặp 3 bất tiện thực tế sau
              ngày cưới: khó đối chiếu ai gửi lời chúc nào khi sao kê không ghi rõ họ tên, dễ bị cắt ghép ảnh giả mạo
              nếu gửi qua nhiều tầng trung gian, và mất nhiều công nhập tay lại danh sách cảm ơn.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              2. Cơ chế VietQR + SePay tự động &amp; bảo mật số tiền hoạt động thế nào?
            </h2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-amber-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-amber-200 bg-amber-50/70 text-xs uppercase text-amber-950">
                  <tr>
                    <th className="px-4 py-3">Tiêu chí</th>
                    <th className="px-4 py-3">Ảnh QR tĩnh thông thường</th>
                    <th className="px-4 py-3">Hộp Mừng VietQR DamCuoiOnline.vn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-900">Dòng tiền</td>
                    <td className="px-4 py-3">Vào thẳng tài khoản cặp đôi</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">Vào thẳng 100% tài khoản cặp đôi (0% phí)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-900">Nội dung chuyển khoản</td>
                    <td className="px-4 py-3">Khách tự gõ, dễ thiếu tên</td>
                    <td className="px-4 py-3">Tạo mã giao dịch riêng điền sẵn trong QR</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-900">Xác nhận &amp; lời chúc</td>
                    <td className="px-4 py-3">Tự kiểm tra sao kê thủ công</td>
                    <td className="px-4 py-3">SePay xác nhận tự động, đăng lời chúc &amp; bắn pháo hoa 3D</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-900">Bảo mật số tiền mừng</td>
                    <td className="px-4 py-3">Không có sổ tổng hợp tự động</td>
                    <td className="px-4 py-3 font-semibold text-rose-800">
                      Số tiền ẩn tuyệt đối khỏi công khai, chỉ Cô Dâu / Chú Rể xem được
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              3. Cách thiết lập hộp mừng cưới tế nhị trong 3 bước
            </h2>
            <ol className="mt-3 list-decimal space-y-3 pl-5">
              <li>
                <strong>Mở tab Mừng Cưới trong Trang Quản Trị:</strong> Chọn ngân hàng (Vietcombank, Techcombank, MB,
                BIDV, VPBank, ACB…), nhập số tài khoản và tên chủ tài khoản nhận mừng.
              </li>
              <li>
                <strong>Chọn chế độ hiển thị:</strong> Bạn có thể bật hộp mừng cưới ở cuối thiệp với nút mở gọn gàng
                (<em>“Gửi quà mừng cho cặp đôi”</em>) để không phô trương trên màn hình đầu tiên, tôn trọng văn hóa giao
                tiếp Việt Nam.
              </li>
              <li>
                <strong>Kết nối SePay (tùy chọn nâng cao):</strong> Nếu muốn hệ thống tự động khớp giao dịch và lưu Sổ
                Mừng Cưới riêng tư có thể xuất ra bản in, chỉ cần dán khóa API SePay một lần trong cấu hình bảo mật máy
                chủ.
              </li>
            </ol>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
            <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-slate-900">
              <Lock className="h-5 w-5 text-rose-700" /> Cam kết quyền riêng tư tài chính
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Khách mời khi xem tường lời chúc chỉ thấy tên người chúc và lời nhắn chúc phúc. Toàn bộ giá trị giao dịch
              được lọc bỏ ngay từ tầng truy vấn máy chủ — không bao giờ xuất hiện trong HTML, JSON hay giao diện công
              khai. Xem đầy đủ tại{' '}
              <Link href="/chinh-sach-bao-mat" className="font-bold text-rose-700 underline underline-offset-2">
                Chính sách bảo mật dữ liệu
              </Link>
              .
            </p>
          </section>
        </div>

        <footer className="mt-12 rounded-3xl border border-rose-200 bg-rose-50/70 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-rose-950">Thử xem thiệp mẫu có hộp mừng VietQR</h2>
              <p className="mt-1 text-sm text-slate-700">
                Trải nghiệm thực tế giao diện thiệp cưới mở phong bì, sổ lời chúc và hộp mừng cưới tinh tế.
              </p>
            </div>
            <Link
              href="/w/minh-va-linh/invite"
              className="inline-flex min-h-[48px] items-center gap-1.5 rounded-full bg-rose-700 px-6 text-sm font-bold text-white shadow hover:bg-rose-800"
            >
              <Sparkles className="h-4 w-4" /> Mở thiệp mẫu trực tiếp <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-4 border-t border-rose-200/70 pt-4 text-xs font-semibold text-slate-600">
            <Link href="/huong-dan" className="inline-flex items-center gap-1 hover:text-rose-700 hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" /> Về Cẩm nang
            </Link>
            <Link href="/huong-dan/tao-thiep-cuoi-online" className="hover:text-rose-700 hover:underline">
              Hướng dẫn tạo thiệp cưới online →
            </Link>
          </div>
        </footer>
      </article>
    </main>
  );
}
