import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { INVITATION_TEMPLATES } from '@dco/shared';
import { CardFace } from '@/components/invitation/CardFace';
import { TemplateGallery } from '@/components/invitation/TemplateGallery';
import { SAMPLE_COUPLE } from '@/components/invitation/sampleInvitation';

export const metadata: Metadata = {
  title: 'Thiệp Cưới Online Đẹp — DamCuoiOnline.vn',
  description:
    `${INVITATION_TEMPLATES.length} mẫu thiệp cưới online: phong bì ghi tên từng khách, ngày âm lịch, xác nhận tham dự, sổ lời chúc, hộp mừng cưới VietQR tự xác nhận qua SePay và sảnh cưới 3D.`,
};

const FEATURES: Array<{ title: string; text: string }> = [
  { title: 'Phong bì ghi tên từng khách', text: 'Mỗi người nhận một đường dẫn riêng, mở ra là thấy “Kính mời” kèm tên mình.' },
  { title: 'Ngày dương và âm lịch', text: 'Tự đổi sang âm lịch, đếm ngược đến giờ làm lễ, lưu vào lịch điện thoại một chạm.' },
  { title: 'Xác nhận tham dự', text: 'Khách báo có đến, đi mấy người, ăn chay hay không. Cô dâu chú rể xem danh sách riêng.' },
  { title: 'Sổ lời chúc', text: 'Không cần đăng nhập, ai cũng gửi được lời chúc lên bức tường của thiệp.' },
  { title: 'Hộp mừng cưới VietQR', text: 'Tiền vào thẳng tài khoản cô dâu chú rể; SePay xác nhận tự động; số tiền không bao giờ hiện công khai.' },
  { title: 'Sảnh cưới 3D đi kèm', text: 'Khách ở xa bước vào sảnh cưới 3D ngay trên điện thoại để cùng chung vui.' },
];

export default function InvitationGalleryPage() {
  const fan = ['song-hy-do', 'mau-nuoc', 'baroque-vang'] as const;
  return (
    <main className="min-h-screen bg-[#FFFDF8] text-slate-900">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
        <Link href="/" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-rose-700">
          <ArrowLeft className="h-4 w-4" /> Trang chủ
        </Link>

        <div className="mt-4 grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h1 className="max-w-[16ch] text-balance font-serif text-[2.6rem] font-bold leading-[1.05] tracking-[-0.02em] text-rose-950 sm:text-6xl">
              Thiệp cưới online, mở ra như thiệp thật
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-700 sm:text-lg">
              Chọn một trong {INVITATION_TEMPLATES.length} mẫu, điền tên hai bên gia đình, giờ làm lễ và địa điểm. Gửi qua Zalo hay Facebook, khách chạm để mở phong bì có ghi tên mình.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/create" className="inline-flex min-h-[52px] items-center rounded-full bg-rose-800 px-7 text-base font-bold text-amber-50 shadow-[0_10px_24px_-10px_rgba(136,19,55,0.7)] hover:bg-rose-700">
                Tạo thiệp miễn phí
              </Link>
              <a href="#mau-thiep" className="inline-flex min-h-[52px] items-center rounded-full px-6 text-base font-bold text-rose-900 ring-1 ring-rose-900/25 hover:ring-rose-900/60">
                Xem {INVITATION_TEMPLATES.length} mẫu thiệp
              </a>
            </div>
          </div>

          {/* A fan of real template fronts */}
          <div className="relative mx-auto h-[380px] w-full max-w-[460px] sm:h-[440px]" aria-hidden="true">
            {fan.map((id, i) => (
              <div
                key={id}
                className="absolute top-4 w-[52%] overflow-hidden rounded-[6px] shadow-[0_24px_50px_-20px_rgba(60,20,20,0.6)]"
                style={{ left: `${6 + i * 21}%`, transform: `rotate(${(i - 1) * 9}deg) translateY(${i === 1 ? -6 : 18}px)`, zIndex: i === 1 ? 3 : 1 }}
              >
                <CardFace templateId={id} groom={SAMPLE_COUPLE.groomName} bride={SAMPLE_COUPLE.brideName} dateLine="20 · 12 · 2026" />
              </div>
            ))}
          </div>
        </div>

        <dl className="mt-16 grid gap-x-10 gap-y-7 border-t border-rose-900/10 pt-10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <dt className="text-lg font-bold text-rose-950">{f.title}</dt>
              <dd className="mt-1.5 text-[15px] leading-relaxed text-slate-700">{f.text}</dd>
            </div>
          ))}
        </dl>

        <section id="mau-thiep" className="mt-20 scroll-mt-6">
          <h2 className="font-serif text-3xl font-bold text-rose-950 sm:text-4xl">{INVITATION_TEMPLATES.length} mẫu thiệp</h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-700">
            Bấm vào một mẫu để mở thiệp mẫu đầy đủ. Đổi mẫu bất cứ lúc nào, nội dung vẫn giữ nguyên.
          </p>
          <div className="mt-8">
            <TemplateGallery />
          </div>
        </section>
      </div>
    </main>
  );
}
