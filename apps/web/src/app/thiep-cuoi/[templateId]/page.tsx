import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  INVITATION_2D_TEMPLATES,
  INVITATION_3D_PLANS,
  INVITATION_3D_TEMPLATES,
  INVITATION_PLANS,
  INVITATION_TEMPLATES,
  isInvitationTemplateId,
  isWalkthrough3DTemplate,
} from '@dco/shared';
import { InvitationView } from '@/components/invitation/InvitationView';
import { SAMPLE_COUPLE, SAMPLE_PHOTOS, SAMPLE_WISHES, sampleInvitation } from '@/components/invitation/sampleInvitation';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd, canonicalUrl } from '@/lib/seo';

export function generateMetadata({ params }: { params: { templateId: string } }): Metadata {
  const t = INVITATION_TEMPLATES.find((x) => x.id === params.templateId);
  if (!t) return { title: 'Không tìm thấy mẫu thiệp', robots: { index: false, follow: false } };
  const is3D = isWalkthrough3DTemplate(t.id);
  const title = `${is3D ? 'Thiệp 3D mẫu' : 'Thiệp mẫu'} ${t.nameVi} — DamCuoiOnline.vn`;
  const url = canonicalUrl(`/thiep-cuoi/${t.id}`);
  const coverImg = SAMPLE_PHOTOS[t.id]?.cover || '/opengraph-image';
  return {
    title,
    description: t.descriptionVi,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'vi_VN',
      url,
      title,
      description: t.descriptionVi,
      images: [{ url: coverImg, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: t.descriptionVi,
      images: [coverImg],
    },
  };
}

export default function TemplateDemoPage({ params, searchParams }: { params: { templateId: string }; searchParams: { khach?: string } }) {
  if (!isInvitationTemplateId(params.templateId)) notFound();
  const meta = INVITATION_TEMPLATES.find((t) => t.id === params.templateId)!;
  const is3D = isWalkthrough3DTemplate(meta.id);
  const plans = is3D ? INVITATION_3D_PLANS : INVITATION_PLANS;
  const minPlan = Math.min(...plans.map((p) => p.priceVnd));
  const backHref = is3D ? '/thiep-cuoi-3d#mau-thiep-3d' : '/thiep-cuoi#mau-thiep';
  const createHref = is3D ? `/thiep-cuoi-3d/tao?mau=${meta.id}` : `/thiep-cuoi/tao?mau=${meta.id}`;
  const collectionPath = is3D ? '/thiep-cuoi-3d' : '/thiep-cuoi';
  const collectionName = is3D ? '10 Mẫu Thiệp Cưới 3D Dạo Bước' : '100 Mẫu Thiệp Cưới Online 2D';
  const related = (is3D ? INVITATION_3D_TEMPLATES : INVITATION_2D_TEMPLATES.filter((t) => t.style === meta.style)).filter(
    (t) => t.id !== meta.id,
  );
  const coverUrl = canonicalUrl(SAMPLE_PHOTOS[params.templateId]?.cover || '/opengraph-image');
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Trang chủ', path: '/' },
          { name: collectionName, path: collectionPath },
          { name: meta.nameVi, path: `/thiep-cuoi/${meta.id}` },
        ])}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: `${is3D ? 'Mẫu thiệp cưới 3D' : 'Mẫu thiệp cưới online 2D'} ${meta.nameVi}`,
          description: meta.descriptionVi,
          image: coverUrl,
          url: canonicalUrl(`/thiep-cuoi/${meta.id}`),
          brand: { '@type': 'Brand', name: 'DamCuoiOnline.vn' },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'VND',
            price: String(minPlan),
            availability: 'https://schema.org/InStock',
            url: canonicalUrl(createHref),
          },
        }}
      />
      {/* Sample banner, in the flow so it never covers the card: the couple and families are fictional */}
      <div className="flex min-h-[56px] items-center justify-between gap-3 bg-slate-950 px-4 py-1.5 text-sm text-white sm:px-6">
        <span className="min-w-0 truncate">
          <span className="hidden sm:inline">{is3D ? 'Thiệp 3D mẫu' : 'Thiệp mẫu'} · </span><strong>{meta.nameVi}</strong>
        </span>
        <span className="flex shrink-0 gap-1.5">
          <Link href={backHref} className="inline-flex min-h-[40px] items-center rounded-full px-3 font-semibold hover:bg-white/10">
            Mẫu khác
          </Link>
          <Link href={createHref} className="inline-flex min-h-[40px] items-center rounded-full bg-white px-4 font-bold text-slate-950 hover:bg-amber-50">
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
        guestName={typeof searchParams.khach === 'string' ? searchParams.khach.slice(0, 60) : is3D ? 'Quốc Bảo' : 'Anh Tuấn'}
        gift={{ enabled: false, bankName: null }}
        hallUrl="/khong-gian/vn-hue-imperial"
        venueThumb="/venues/vn_hue_imperial.webp"
        initialWishes={SAMPLE_WISHES}
        demo
      />
      <div className="flex items-center justify-between gap-3 bg-slate-950 px-4 py-2.5 text-sm text-white sm:px-6">
        <span className="min-w-0 truncate">
          Thích mẫu <strong>{meta.nameVi}</strong>?
        </span>
        <span className="flex shrink-0 gap-1.5">
          <Link href={backHref} className="inline-flex min-h-[44px] items-center rounded-full px-3 font-semibold hover:bg-white/10">
            Mẫu khác
          </Link>
          <Link href={createHref} className="inline-flex min-h-[44px] items-center rounded-full bg-white px-4 font-bold text-slate-950 hover:bg-amber-50">
            Dùng mẫu này
          </Link>
        </span>
      </div>
      <section aria-label="Mẫu thiệp tương tự và hướng dẫn" className="border-t border-amber-200/80 bg-[#FFFDF8] px-5 py-10 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <Link href="/" className="hover:text-rose-700">Trang chủ</Link>
            <span aria-hidden="true">/</span>
            <Link href={collectionPath} className="hover:text-rose-700">{collectionName}</Link>
            <span aria-hidden="true">/</span>
            <span className="text-slate-800">{meta.nameVi}</span>
          </nav>
          <h2 className="mt-4 font-serif text-2xl font-bold text-rose-950">
            {is3D ? `Các bộ Thiệp Cưới 3D khác ngoài ${meta.nameVi}` : `Mẫu thiệp cưới cùng phong cách với ${meta.nameVi}`}
          </h2>
          <p className="mt-1.5 text-sm text-slate-600">
            {meta.descriptionVi} Thiết kế nháp miễn phí, ghi tên từng khách trên phong bì, đổi lịch âm và hỗ trợ hộp mừng VietQR 0% phí.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related
              .slice(0, 4)
              .map((other) => (
                <Link
                  key={other.id}
                  href={`/thiep-cuoi/${other.id}`}
                  className="rounded-2xl border border-amber-200 bg-white p-4 transition hover:border-rose-300 hover:shadow-sm"
                >
                  <p className="font-serif text-base font-bold text-slate-900">{other.nameVi}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">{other.descriptionVi}</p>
                  <span className="mt-2 inline-block text-xs font-bold text-rose-700">Xem mẫu →</span>
                </Link>
              ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-4 border-t border-amber-200/70 pt-4 text-xs font-semibold text-slate-600">
            <Link href="/huong-dan/tao-thiep-cuoi-online" className="hover:text-rose-700 hover:underline">
              Hướng dẫn tạo thiệp cưới online gửi Zalo
            </Link>
            <Link href="/huong-dan/mung-cuoi-vietqr" className="hover:text-rose-700 hover:underline">
              Cách bật hộp mừng cưới VietQR ẩn số tiền
            </Link>
            <Link href="/khong-gian/vn-hoi-an" className="hover:text-rose-700 hover:underline">
              Kết hợp Sảnh Cưới 3D Phố Cổ Hội An
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
