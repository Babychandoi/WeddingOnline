import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { INVITATION_PLANS } from '@dco/shared';
import { JsonLd } from '@/components/seo/JsonLd';
import { PUBLISHED_GUIDES, buildArticleJsonLd } from '@/lib/guides';
import { buildBreadcrumbJsonLd, canonicalUrl } from '@/lib/seo';

const GUIDE = PUBLISHED_GUIDES[0];

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

export default function CreateOnlineInvitationGuidePage() {
  const minPrice = Math.min(...INVITATION_PLANS.map((p) => p.priceVnd));
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

        {/* Answer-first 55-word summary block for AI Overviews & fast readers */}
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/70 p-5 text-sm leading-relaxed text-rose-950">
          <p className="font-bold text-rose-900">Tóm tắt nhanh:</p>
          <p className="mt-1">
            Để tạo thiệp cưới online gửi Zalo chuyên nghiệp, bạn chỉ cần 5 bước: chọn 1 trong 100 mẫu giao diện phù hợp
            phong cách, nhập thông tin hai bên gia đình và giờ làm lễ (tự đổi lịch âm), tải album ảnh cưới tối đa 12
            tấm, bật xác nhận tham dự (RSVP) cùng mã VietQR, rồi gửi đường dẫn ghi tên riêng cho từng khách. Tạo nháp
            miễn phí, phát hành từ {minPrice.toLocaleString('vi-VN')}đ.
          </p>
        </div>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-slate-700">
          <section>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              1. Chuẩn bị thông tin trước khi tạo thiệp (mất khoảng 2 phút)
            </h2>
            <p className="mt-2.5">
              Để thiệp cưới online hiển thị trang trọng ngang bằng thiệp in giấy, bạn nên chuẩn bị sẵn 4 nhóm nội dung
              cơ bản sau trước khi mở trình thiết kế:
            </p>
            <ul className="mt-3 space-y-2">
              {[
                'Họ tên đầy đủ của Cô Dâu, Chú Rể cùng tên thân phụ – thân mẫu hai bên nhà trai, nhà gái.',
                'Ngày giờ tổ chức Lễ Vu Quy / Lễ Thành Hôn / Tiệc Cưới (hệ thống tự quy đổi sang ngày âm lịch và đếm ngược).',
                'Địa chỉ nhà hàng hoặc tư gia kèm đường dẫn Google Maps để khách mở chỉ đường một chạm.',
                'Từ 6 đến 12 tấm ảnh cưới sắc nét (nên chọn ít nhất 1 ảnh dọc cho trang bìa và ảnh ngang cho sổ lật trang 3D).',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              2. Quy trình 5 bước tạo thiệp cưới online trên DamCuoiOnline.vn
            </h2>
            <ol className="mt-3 space-y-4">
              <li className="rounded-2xl border border-amber-200/80 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-900">Bước 1: Chọn phong cách trong 100 mẫu thiết kế</h3>
                <p className="mt-1.5 text-sm">
                  Truy cập{' '}
                  <Link href="/thiep-cuoi" className="font-bold text-rose-700 underline underline-offset-2">
                    thư viện 100 mẫu thiệp cưới online
                  </Link>
                  . Bạn có thể chọn nhóm <strong>Truyền thống</strong> (như{' '}
                  <Link href="/thiep-cuoi/song-hy-do" className="font-semibold text-rose-700 hover:underline">
                    Song Hỷ Đỏ
                  </Link>
                  ,{' '}
                  <Link href="/thiep-cuoi/sen-hong" className="font-semibold text-rose-700 hover:underline">
                    Sen Hồng
                  </Link>
                  ), <strong>Hoa cỏ màu nước</strong> (
                  <Link href="/thiep-cuoi/la-xanh" className="font-semibold text-rose-700 hover:underline">
                    Lá Xanh
                  </Link>
                  ), <strong>Tối giản biên tập</strong> (
                  <Link href="/thiep-cuoi/tap-chi" className="font-semibold text-rose-700 hover:underline">
                    Tạp Chí
                  </Link>
                  ) hoặc <strong>Tiệc tối sang trọng</strong> (
                  <Link href="/thiep-cuoi/baroque-vang" className="font-semibold text-rose-700 hover:underline">
                    Baroque Vàng
                  </Link>
                  ). Toàn bộ nội dung được giữ nguyên nếu sau này bạn đổi sang mẫu khác.
                </p>
              </li>

              <li className="rounded-2xl border border-amber-200/80 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-900">Bước 2: Nhập tên, ngày cưới &amp; chọn đường dẫn ngắn</h3>
                <p className="mt-1.5 text-sm">
                  Mở{' '}
                  <Link href="/thiep-cuoi/tao" className="font-bold text-rose-700 underline underline-offset-2">
                    trình tạo thiệp cưới miễn phí
                  </Link>
                  , điền tên cô dâu chú rể và ngày tổ chức. Hệ thống tự đề xuất đường dẫn gọn đẹp dạng{' '}
                  <code>/thiep/quan-ha</code> giúp khách dễ nhớ khi bấm từ Zalo hoặc quét mã QR in trên thiệp giấy.
                </p>
              </li>

              <li className="rounded-2xl border border-amber-200/80 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-900">Bước 3: Chỉnh sửa trực quan &amp; tải album lật sách 3D</h3>
                <p className="mt-1.5 text-sm">
                  Trong bảng quản trị, bạn bấm trực tiếp lên từng mục trên thiệp để sửa lời ngỏ, lịch trình tiệc, câu
                  chuyện tình yêu, bật nhạc nền và tải ảnh cưới. Mọi thiệp đều có sẵn chế độ{' '}
                  <strong>lật sách ảnh 3D</strong> và <strong>tấm chứng nhận khắc ánh kim</strong>.
                </p>
              </li>

              <li className="rounded-2xl border border-amber-200/80 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-900">Bước 4: Cấu hình RSVP &amp; Hộp Mừng Cưới VietQR (tùy chọn)</h3>
                <p className="mt-1.5 text-sm">
                  Bật form xác nhận tham dự để thống kê số người đi cùng và suất ăn chay. Nếu có bạn bè ở xa muốn gửi
                  quà mừng, bạn gắn tài khoản ngân hàng VietQR (có thể kết nối SePay tự động xác nhận). Tiền vào thẳng
                  100% tài khoản cặp đôi và số tiền tuyệt đối ẩn công khai — xem chi tiết tại{' '}
                  <Link href="/huong-dan/mung-cuoi-vietqr" className="font-semibold text-rose-700 underline underline-offset-2">
                    hướng dẫn mừng cưới VietQR
                  </Link>
                  .
                </p>
              </li>

              <li className="rounded-2xl border border-amber-200/80 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-900">Bước 5: Tạo link ghi tên từng khách &amp; gửi qua Zalo</h3>
                <p className="mt-1.5 text-sm">
                  Gắn thêm tham số <code>?khach=Anh+Tuấn</code> (hoặc tạo hàng loạt trong trang Quản trị). Khi gửi vào
                  tin nhắn Zalo, thẻ xem trước tự hiện tên cặp đôi, ảnh bìa đẹp và khi khách chạm vào phong bì sẽ thấy
                  dòng chữ <em>“Trân trọng kính mời Anh Tuấn”</em> vô cùng lịch sự.
                </p>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              3. Chi phí phát hành thiệp cưới online minh bạch
            </h2>
            <p className="mt-2">
              Bạn được thiết kế, tải ảnh và xem trước hoàn toàn miễn phí không giới hạn thời gian. Chỉ khi hài lòng và
              muốn mở công khai cho khách xem, bạn mới chọn gói theo thời hạn sử dụng:
            </p>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-amber-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-amber-200 bg-amber-50/70 text-xs uppercase text-amber-950">
                  <tr>
                    <th className="px-4 py-3">Gói phát hành</th>
                    <th className="px-4 py-3">Giá trọn gói</th>
                    <th className="px-4 py-3">Phù hợp với</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {INVITATION_PLANS.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-bold text-slate-900">{p.nameVi}</td>
                      <td className="px-4 py-3 font-extrabold tabular-nums text-rose-700">
                        {p.priceVnd.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {p.months === null
                          ? 'Lưu giữ thiệp, album ảnh và toàn bộ lời chúc mãi mãi'
                          : 'Đám cưới sắp diễn ra trong 30 ngày tới · gia hạn linh hoạt'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-slate-600">
              Lưu ý: Nếu bạn mua Gói Hạnh Phúc hoặc Viên Mãn VIP cho{' '}
              <Link href="/khong-gian" className="font-semibold text-rose-700 underline underline-offset-2">
                Sảnh Cưới 3D
              </Link>
              , thiệp cưới online đã bao gồm sẵn trong gói mà không cần mua thêm.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              4. 4 mẹo gửi thiệp cưới online qua Zalo để khách mở ngay &amp; ấn tượng
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong>Gửi tin nhắn cá nhân kèm tên khách thay vì thả 1 link chung vào nhóm đông:</strong> Link có tên
                riêng trên phong bì giúp tỷ lệ xác nhận tham dự (RSVP) cao hơn gấp đôi.
              </li>
              <li>
                <strong>Kiểm tra trên điện thoại trước khi gửi hàng loạt:</strong> Thử bấm mở phong bì, xem nút Google
                Maps, nghe thử nhạc nền và kiểm tra lại ngày âm lịch.
              </li>
              <li>
                <strong>Gửi trước ngày cưới 10–14 ngày:</strong> Đủ thời gian để khách sắp xếp lịch và chốt danh sách
                bàn tiệc với nhà hàng.
              </li>
              <li>
                <strong>Kết hợp thiệp giấy cho bậc trưởng bối:</strong> Xem thêm{' '}
                <Link
                  href="/so-sanh/thiep-cuoi-online-va-thiep-giay"
                  className="font-semibold text-rose-700 underline underline-offset-2"
                >
                  so sánh thiệp cưới online và thiệp giấy
                </Link>{' '}
                để tối ưu ngân sách cưới.
              </li>
            </ul>
          </section>
        </div>

        <footer className="mt-12 rounded-3xl border border-rose-200 bg-rose-50/70 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-rose-950">Sẵn sàng tạo tấm thiệp đầu tiên?</h2>
              <p className="mt-1 text-sm text-slate-700">
                Thiết kế nháp miễn phí trong 5 phút, đổi qua lại 100 mẫu bất cứ lúc nào.
              </p>
            </div>
            <Link
              href="/thiep-cuoi/tao"
              className="inline-flex min-h-[48px] items-center gap-1.5 rounded-full bg-rose-700 px-6 text-sm font-bold text-white shadow hover:bg-rose-800"
            >
              <Sparkles className="h-4 w-4" /> Thiết kế thiệp ngay <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 border-t border-rose-200/70 pt-4 text-xs font-semibold text-slate-600">
            <Link href="/huong-dan" className="inline-flex items-center gap-1 hover:text-rose-700 hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" /> Xem tất cả bài viết trong Cẩm nang cưới số
            </Link>
          </div>
        </footer>
      </article>
    </main>
  );
}
