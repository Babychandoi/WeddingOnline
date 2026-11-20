import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { INVITATION_TEMPLATES, isInvitationTemplateId } from '@dco/shared';
import { InvitationView } from '@/components/invitation/InvitationView';
import { SAMPLE_COUPLE, SAMPLE_PHOTOS, SAMPLE_WISHES, sampleInvitation } from '@/components/invitation/sampleInvitation';

export function generateMetadata({ params }: { params: { templateId: string } }): Metadata {
  const t = INVITATION_TEMPLATES.find((x) => x.id === params.templateId);
  return t ? { title: `Thiệp mẫu ${t.nameVi} — DamCuoiOnline.vn`, description: t.descriptionVi } : { title: 'Không tìm thấy mẫu thiệp' };
}

export default function TemplateDemoPage({ params, searchParams }: { params: { templateId: string }; searchParams: { khach?: string } }) {
  if (!isInvitationTemplateId(params.templateId)) notFound();
  const meta = INVITATION_TEMPLATES.find((t) => t.id === params.templateId)!;
  return (
    <>
      {/* Sample banner, in the flow so it never covers the card: the couple and families are fictional */}
      <div className="flex items-center justify-between gap-3 bg-slate-950 px-4 py-2.5 text-sm text-white sm:px-6">
        <span className="min-w-0 truncate">
          <span className="hidden sm:inline">Thiệp mẫu · </span><strong>{meta.nameVi}</strong>
        </span>
        <span className="flex shrink-0 gap-1.5">
          <Link href="/thiep-cuoi#mau-thiep" className="inline-flex min-h-[44px] items-center rounded-full px-3 font-semibold hover:bg-white/10">
            Mẫu khác
          </Link>
          <Link href={`/create?thiep=${meta.id}`} className="inline-flex min-h-[44px] items-center rounded-full bg-white px-4 font-bold text-slate-950 hover:bg-amber-50">
            Dùng mẫu này
          </Link>
        </span>
      </div>
      <InvitationView
        slug="thiep-mau"
        groomName={SAMPLE_COUPLE.groomName}
        brideName={SAMPLE_COUPLE.brideName}
        weddingDate={SAMPLE_COUPLE.weddingDate}
        config={sampleInvitation(params.templateId)}
        photos={SAMPLE_PHOTOS[params.templateId].photos}
        guestName={typeof searchParams.khach === 'string' ? searchParams.khach.slice(0, 60) : 'Anh Tuấn'}
        gift={{ enabled: false, bankName: null }}
        hallUrl="/khong-gian/vn_hue_imperial"
        venueThumb="/venues/vn_hue_imperial.webp"
        initialWishes={SAMPLE_WISHES}
        demo
      />
      <div className="flex items-center justify-between gap-3 bg-slate-950 px-4 py-2.5 text-sm text-white sm:px-6">
        <span className="min-w-0 truncate">
          Thích mẫu <strong>{meta.nameVi}</strong>?
        </span>
        <span className="flex shrink-0 gap-1.5">
          <Link href="/thiep-cuoi#mau-thiep" className="inline-flex min-h-[44px] items-center rounded-full px-3 font-semibold hover:bg-white/10">
            Mẫu khác
          </Link>
          <Link href={`/create?thiep=${meta.id}`} className="inline-flex min-h-[44px] items-center rounded-full bg-white px-4 font-bold text-slate-950 hover:bg-amber-50">
            Dùng mẫu này
          </Link>
        </span>
      </div>
    </>
  );
}
