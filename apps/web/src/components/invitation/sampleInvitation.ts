import { defaultInvitationConfig, type InvitationConfig, type InvitationTemplateId } from '@dco/shared';
import type { InvitationWish } from '@/app/api/invitations/[slug]/wishes/route';

/*
 * Sample content for the template gallery. The couple and families are fictional and every
 * demo page says so; nothing typed into a sample invitation is sent anywhere.
 */
export const SAMPLE_COUPLE = { groomName: 'Minh Quân', brideName: 'Thu Hà', weddingDate: '2026-12-20T03:00:00.000Z' };

export function sampleInvitation(templateId: InvitationTemplateId): InvitationConfig {
  const base = defaultInvitationConfig(SAMPLE_COUPLE);
  return {
    ...base,
    templateId,
    groomFullName: 'Minh Quân',
    brideFullName: 'Thu Hà',
    groomFamily: { father: 'Nguyễn Văn Hùng', mother: 'Trần Thị Mai', address: 'Phường Phú Hội, TP. Huế' },
    brideFamily: { father: 'Lê Văn Phúc', mother: 'Phạm Thị Lan', address: 'Phường Hải Châu, TP. Đà Nẵng' },
    events: [
      { id: 'ev1', kind: 'VU_QUY', title: 'Lễ Vu Quy', startsAt: '2026-12-20T01:00:00.000Z', venueName: 'Tư gia nhà gái', address: '24 Trần Phú, Hải Châu, Đà Nẵng', mapUrl: '', note: '' },
      { id: 'ev2', kind: 'THANH_HON', title: 'Lễ Thành Hôn', startsAt: '2026-12-20T04:00:00.000Z', venueName: 'Tư gia nhà trai', address: '12 Lê Lợi, Phú Hội, Huế', mapUrl: '', note: '' },
      { id: 'ev3', kind: 'TIEC_CUOI', title: 'Tiệc Cưới', startsAt: '2026-12-20T11:00:00.000Z', venueName: 'Trung tâm Hội nghị Tiệc cưới Hương Giang', address: '51 Lê Lợi, Vĩnh Ninh, Huế', mapUrl: '', note: 'Đón khách từ 17:30' },
    ],
    story: [
      { id: 's1', when: 'Mùa thu 2019', title: 'Lần đầu gặp nhau', text: 'Hai đứa ngồi cạnh nhau trong một buổi học tiếng Nhật buổi tối. Cô ấy cho mượn cây bút, anh giữ luôn đến tận bây giờ.' },
      { id: 's2', when: '14.02.2021', title: 'Chính thức hẹn hò', text: 'Một bó hoa cúc hoạ mi, một ly cà phê muối ở Huế và một câu hỏi run run.' },
      { id: 's3', when: '01.06.2026', title: 'Lời cầu hôn', text: 'Trên bãi biển Mỹ Khê lúc bình minh, cô ấy nói đồng ý trước khi anh kịp quỳ xuống.' },
    ],
    rsvpDeadline: '2026-12-10T00:00:00.000Z',
    dressCode: 'Tông màu pastel nhẹ nhàng',
  };
}

export const SAMPLE_WISHES: InvitationWish[] = [
  { id: 'w1', name: 'Hoàng Nam', side: 'FRIEND', message: 'Chúc hai bạn trăm năm hạnh phúc, sớm có thiên thần nhỏ nhé!', createdAt: '2026-11-18T10:00:00.000Z', withGift: true },
  { id: 'w2', name: 'Cô Ba Đà Nẵng', side: 'BRIDE_SIDE', message: 'Thương con gái út của cô. Chúc hai con thuận vợ thuận chồng, tát biển Đông cũng cạn.', createdAt: '2026-11-17T09:00:00.000Z', withGift: false },
  { id: 'w3', name: 'Team Marketing', side: 'COLLEAGUE', message: 'Cả team sẽ có mặt đông đủ, chuẩn bị tinh thần 1-2-3 Dzô nha!', createdAt: '2026-11-16T15:00:00.000Z', withGift: false },
];
