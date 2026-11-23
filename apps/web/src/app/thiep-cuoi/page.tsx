import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { INVITATION_PLANS, INVITATION_TEMPLATES, TIER_CATALOG } from '@dco/shared';
import { CardFace } from '@/components/invitation/CardFace';
import { TemplateGallery } from '@/components/invitation/TemplateGallery';
import { SAMPLE_COUPLE } from '@/components/invitation/sampleInvitation';
import { EngravedWeddingCertificate } from '@/components/threeui/EngravedWeddingCertificate';
import { LiquidMetalButton, SparkBadgePill } from '@/components/threeui/LiquidMetalButton';
import { WeddingHeroAtmosphere } from '@/components/threeui/WeddingHeroAtmosphere';

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
      <div className="relative overflow-hidden border-b border-amber-200/70">
        <WeddingHeroAtmosphere mood="koi" tone="light" />
        <div className="relative z-10 mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
          <Link href="/" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-rose-700">
            <ArrowLeft className="h-4 w-4" /> Trang chủ
          </Link>

          <div className="mt-4 grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <SparkBadgePill>100 Mẫu Thiệp · Lật Sách 3D · Chứng Nhận Khắc Ánh Kim</SparkBadgePill>
              <h1 className="mt-4 max-w-[16ch] text-balance font-serif text-[2.6rem] font-bold leading-[1.05] tracking-[-0.02em] text-rose-950 sm:text-6xl">
                Thiệp cưới online, mở ra như thiệp thật
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-700 sm:text-lg">
                Chọn một trong {INVITATION_TEMPLATES.length} mẫu, điền tên hai bên gia đình, giờ làm lễ và địa điểm. Gửi qua Zalo hay Facebook, khách chạm để mở phong bì có ghi tên mình. Dùng được cho cả đám cưới tổ chức ngoài đời, không cần sảnh 3D. Thiết kế và xem trước miễn phí, chỉ trả phí khi phát hành.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <LiquidMetalButton href="/thiep-cuoi/tao" variant="crimson" className="min-h-[52px] rounded-full px-7 text-base">
                  Thiết kế thiệp ngay
                </LiquidMetalButton>
                <a href="#mau-thiep" className="inline-flex min-h-[52px] items-center rounded-full bg-white/80 px-6 text-base font-bold text-rose-900 ring-1 ring-rose-900/25 backdrop-blur-sm hover:ring-rose-900/60">
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
                  <CardFace templateId={id} groom={SAMPLE_COUPLE.groomName} bride={SAMPLE_COUPLE.brideName} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-16">
        {/* ThreeUI Engraved Certificate VIP Showcase */}
        <section className="mb-14 grid items-center gap-8 rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-rose-50/50 p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SparkBadgePill>Mới · Hiệu ứng ThreeUI</SparkBadgePill>
            <h2 className="mt-3 font-serif text-3xl font-bold text-rose-950">
              Chứng nhận khắc ánh kim 3D &amp; Album lật trang
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">
              Mỗi tấm thiệp cưới đều tích hợp sẵn <strong>tấm chứng nhận khắc guilloché ánh kim</strong> nghiêng theo tay/chuột và chế độ <strong>lật trang sổ ảnh 3D</strong> mượt mà cho khách thưởng thức.
            </p>
          </div>
          <EngravedWeddingCertificate
            groomName={SAMPLE_COUPLE.groomName}
            brideName={SAMPLE_COUPLE.brideName}
            weddingDate={SAMPLE_COUPLE.weddingDate}
            subtitle="Thiệp Mời Khắc Ánh Kim VIP"
            venueLabel="DamCuoiOnline.vn"
            compact
          />
        </section>

        <dl className="grid gap-x-10 gap-y-7 border-t border-rose-900/10 pt-10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <dt className="text-lg font-bold text-rose-950">{f.title}</dt>
              <dd className="mt-1.5 text-[15px] leading-relaxed text-slate-700">{f.text}</dd>
            </div>
          ))}
        </dl>

        {/* Pricing: designing is free, publishing takes a plan */}
        <section id="bang-gia" className="mt-20 scroll-mt-6">
          <h2 className="font-serif text-3xl font-bold text-rose-950 sm:text-4xl">Bảng giá thiệp cưới</h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-700">
            Chọn mẫu, điền nội dung, tải ảnh và xem trước hoàn toàn miễn phí, mọi thứ được lưu nháp. Chỉ khi muốn gửi thiệp cho khách mới cần chọn gói phát hành. Hết gói thì thiệp tạm ẩn, gia hạn là hiện lại ngay.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {INVITATION_PLANS.map((p) => (
              <li key={p.id} className={`rounded-2xl border bg-white p-5 ${p.id === '3m' ? 'border-rose-700 ring-2 ring-rose-200' : 'border-rose-900/15'}`}>
                <p className="text-sm font-bold uppercase tracking-wide text-rose-800">{p.nameVi}</p>
                <p className="mt-2 text-2xl font-black tabular-nums text-slate-900">{p.priceVnd.toLocaleString('vi-VN')}đ</p>
                <p className="mt-1 text-xs text-slate-600">
                  {p.months === null ? 'Giữ thiệp và lời chúc mãi mãi' : p.months === 1 ? 'Cho đám cưới sắp diễn ra' : `≈ ${(Math.round(p.priceVnd / p.months / 1000) * 1000).toLocaleString('vi-VN')}đ/tháng`}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-slate-600">
            Đã mua {TIER_CATALOG.HAPPINESS.nameVi} hoặc {TIER_CATALOG.VIP_FULFILLMENT.nameVi} cho sảnh cưới 3D? Thiệp cưới online đã có sẵn trong gói, không cần mua thêm.
          </p>
        </section>

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
