import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd, canonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Chính Sách Bảo Mật — DamCuoiOnline.vn',
  description:
    'Cam kết bảo vệ quyền riêng tư ảnh cưới, danh sách khách mời RSVP, tài khoản đăng nhập và sổ mừng cưới VietQR tuyệt đối ẩn số tiền công khai tại DamCuoiOnline.vn.',
  alternates: { canonical: canonicalUrl('/chinh-sach-bao-mat') },
  openGraph: {
    title: 'Chính Sách Bảo Mật — DamCuoiOnline.vn',
    description:
      'Cam kết bảo vệ dữ liệu ảnh cưới, danh sách khách mời RSVP và sổ mừng cưới VietQR minh bạch tại DamCuoiOnline.vn.',
    url: canonicalUrl('/chinh-sach-bao-mat'),
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#FFFDF8] text-slate-900">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Trang chủ', path: '/' },
          { name: 'Chính sách bảo mật', path: '/chinh-sach-bao-mat' },
        ])}
      />
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-rose-700"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại Trang chủ
        </Link>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800">
          <ShieldCheck className="h-4 w-4" /> Cập nhật lần cuối: 24/11/2026
        </div>

        <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Chính Sách Bảo Mật Dữ Liệu
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          <strong>DamCuoiOnline.vn</strong> tôn trọng tuyệt đối sự riêng tư của Cô Dâu, Chú Rể, hai bên gia đình và
          toàn bộ khách mời tham dự thiệp cưới online cũng như sảnh cưới 3D trực tuyến.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
          <section className="rounded-2xl border border-amber-200/80 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-slate-900">1. Dữ liệu chúng tôi thu thập</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong>Thông tin tài khoản chủ tiệc:</strong> Tên hiển thị và email qua cổng đăng nhập OAuth (Google /
                Facebook / Zalo nếu bật) để quản trị thiệp cưới và sảnh 3D.
              </li>
              <li>
                <strong>Nội dung thiệp &amp; album ảnh cưới:</strong> Tên cô dâu chú rể, lịch trình buổi lễ, địa điểm,
                ảnh cưới và ảnh Photobooth do chủ tiệc chủ động tải lên.
              </li>
              <li>
                <strong>Dữ liệu tương tác khách mời:</strong> Tên khách, trạng thái xác nhận tham dự (RSVP), chế độ ăn
                chay/mặn và lời chúc gửi lên Sổ Lưu Bút.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-amber-200/80 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-slate-900">
              2. Nguyên tắc bảo mật tuyệt đối với Hộp Mừng Cưới VietQR
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                Tiền mừng cưới của khách chuyển trực tiếp <strong>100%</strong> vào tài khoản ngân hàng của Cô Dâu / Chú
                Rể — nền tảng không giữ hộ và thu <strong>0% phí giao dịch</strong>.
              </li>
              <li>
                <strong>Số tiền mừng không bao giờ hiển thị công khai</strong> trên tường lời chúc, giao diện thiệp cưới,
                mã nguồn HTML hay API công khai. Chỉ Cô Dâu, Chú Rể và chủ tiệc đã đăng nhập mới xem được sổ mừng riêng
                tư trong trang Quản trị.
              </li>
              <li>
                Khóa API SePay của cặp đôi được lưu bảo mật ở phía máy chủ và không gửi xuống trình duyệt của khách mời.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-amber-200/80 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-slate-900">3. Quyền riêng tư trên công cụ tìm kiếm</h2>
            <p className="mt-2">
              Các trang quản trị (<code>/dashboard/*</code>, <code>/admin/*</code>) và thiệp cưới / sảnh cưới riêng tư
              của khách hàng được gắn thẻ <code>noindex</code> mặc định để hạn chế xuất hiện ngoài ý muốn trên công cụ
              tìm kiếm; chỉ những người nhận được đường dẫn mời mới truy cập được.
            </p>
          </section>

          <section className="rounded-2xl border border-amber-200/80 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-slate-900">4. Quyền chỉnh sửa &amp; xóa dữ liệu</h2>
            <p className="mt-2">
              Chủ tiệc có thể chỉnh sửa thông tin thiệp, xóa ảnh, ẩn lời chúc hoặc yêu cầu xóa toàn bộ dữ liệu phòng
              cưới bất cứ lúc nào. Mọi yêu cầu hỗ trợ bảo mật vui lòng gửi qua trang{' '}
              <Link href="/lien-he" className="font-bold text-rose-700 underline underline-offset-2">
                Liên hệ &amp; Hỗ trợ
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
