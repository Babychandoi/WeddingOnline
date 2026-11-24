import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd, canonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Điều Khoản Sử Dụng — DamCuoiOnline.vn',
  description:
    'Điều khoản dịch vụ thiệp cưới online và sảnh cưới 3D trực tuyến tại DamCuoiOnline.vn: bản nháp miễn phí, thanh toán VietQR tự động, gia hạn và lưu trữ kỷ niệm 2D.',
  alternates: { canonical: canonicalUrl('/dieu-khoan-su-dung') },
  openGraph: {
    title: 'Điều Khoản Sử Dụng — DamCuoiOnline.vn',
    description:
      'Quy định minh bạch về gói thiệp cưới online, sảnh cưới 3D, kích hoạt VietQR và lưu trữ kỷ niệm tại DamCuoiOnline.vn.',
    url: canonicalUrl('/dieu-khoan-su-dung'),
  },
};

export default function TermsOfServicePage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#FFFDF8] text-slate-900">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Trang chủ', path: '/' },
          { name: 'Điều khoản sử dụng', path: '/dieu-khoan-su-dung' },
        ])}
      />
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-rose-700"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại Trang chủ
        </Link>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-900">
          <FileText className="h-4 w-4" /> Hiệu lực từ: 24/11/2026
        </div>

        <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Điều Khoản Sử Dụng Dịch Vụ
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Khi tạo thiệp cưới online hoặc khởi tạo sảnh cưới 3D trên <strong>DamCuoiOnline.vn</strong>, bạn đồng ý với
          các điều khoản minh bạch dưới đây.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
          <section className="rounded-2xl border border-amber-200/80 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-slate-900">1. Trải nghiệm miễn phí &amp; phát hành gói</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong>Thiệp cưới online:</strong> Bạn được chọn trong 100 mẫu 2D và 100 bộ 3D, nhập nội dung, tải ảnh cưới và xem
                trước hoàn toàn miễn phí dưới dạng bản nháp. Chi phí chỉ phát sinh khi bạn kích hoạt gói phát hành gửi
                cho khách mời (Thiệp 2D: 99.000đ/tháng hoặc 599.000đ trọn đời; Thiệp 3D: 199.000đ/tháng hoặc 799.000đ trọn đời).
              </li>
              <li>
                <strong>Sảnh cưới 3D trực tuyến:</strong> Hỗ trợ gói Dùng Thử 24 giờ miễn phí và các gói trả phí một
                lần (Hạnh Phúc, Viên Mãn VIP) niêm yết công khai bằng VND.
              </li>
              <li>
                Thanh toán gói dịch vụ được xác nhận tự động qua VietQR / SePay hoặc kích hoạt ngay bằng mã đối tác
                Studio hợp lệ.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-amber-200/80 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-slate-900">2. Thời hạn lưu trữ &amp; Kỷ Niệm 2D</h2>
            <p className="mt-2">
              Khi gói thiệp có thời hạn kết thúc, thiệp tạm ẩn với khách mời nhưng toàn bộ dữ liệu ảnh, lời chúc và cấu
              hình vẫn được bảo toàn để bạn gia hạn và mở lại ngay. Với sảnh cưới 3D gói Hạnh Phúc / Viên Mãn VIP, sau
              khi kết thúc tiệc, phòng cưới chuyển sang chế độ <strong>Trang Kỷ Niệm 2D</strong> gọn nhẹ kèm tính năng
              xuất Sổ Kỷ Niệm A4 PDF.
            </p>
          </section>

          <section className="rounded-2xl border border-amber-200/80 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-slate-900">3. Trách nhiệm nội dung &amp; bản quyền ảnh</h2>
            <p className="mt-2">
              Người dùng chịu trách nhiệm về tính hợp pháp và bản quyền đối với hình ảnh, âm thanh, nội dung lời mời và
              thông tin tài khoản ngân hàng VietQR do mình tải lên. Nghiêm cấm sử dụng nền tảng cho mục đích lừa đảo,
              mạo danh hoặc phát tán nội dung vi phạm pháp luật Việt Nam.
            </p>
          </section>

          <section className="rounded-2xl border border-amber-200/80 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-slate-900">4. Hỗ trợ sự cố &amp; hoàn tiền</h2>
            <p className="mt-2">
              Nếu xảy ra lỗi kỹ thuật từ hệ thống khiến gói đã thanh toán không thể kích hoạt hoặc ảnh hưởng trực tiếp
              tới giờ làm lễ mà đội ngũ kỹ thuật không khắc phục kịp thời, DamCuoiOnline.vn cam kết hỗ trợ chuyển đổi
              gói hoặc hoàn tiền 100% giá trị gói đã mua. Liên hệ chi tiết tại{' '}
              <Link href="/lien-he" className="font-bold text-rose-700 underline underline-offset-2">
                trang Liên hệ
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
    <SiteFooter />
    </>
  );
}
