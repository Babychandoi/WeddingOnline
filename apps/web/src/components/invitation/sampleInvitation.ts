import { defaultInvitationConfig, type InvitationConfig, type InvitationTemplateId } from '@dco/shared';
import type { InvitationWish } from '@/app/api/invitations/[slug]/wishes/route';
import type { InvitationPhoto } from './InvitationView';

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
    quote: 'Thuận vợ thuận chồng, tát biển Đông cũng cạn.',
    coverPhotoUrl: SAMPLE_PHOTOS[templateId].cover,
  };
}

/** Alt text for the sample photographs */
const ALT: Record<string, string> = {
  'red-couple-p': 'Cô dâu chú rể trong áo dài đỏ thêu chữ Hỷ',
  'red-couple': 'Cô dâu chú rể trong áo dài đỏ ngày đám hỏi',
  'ao-dai-red': 'Cô dâu áo dài đỏ cầm bó sen trắng',
  procession: 'Đoàn rước dâu',
  'groom-ao-dai': 'Nhà trai bưng tráp hoa đỏ',
  'ao-dai-gate': 'Cô dâu áo dài đỏ trước cổng hoa',
  'ao-dai-arch': 'Cô dâu áo dài đỏ dưới cổng hoa cưới',
  'song-hy-tea': 'Cô dâu chú rể trước chữ Song Hỷ',
  'aisle-lights': 'Cô dâu chú rể bước vào lễ đường',
  'hue-door': 'Cô dâu áo dài trắng trước cổng gỗ son',
  chandelier: 'Cô dâu chú rể dưới chùm đèn pha lê',
  'chandelier-p': 'Cô dâu chú rể dưới chùm đèn pha lê',
  'groom-fan': 'Chú rể áo dài cầm quạt',
  'bridge-autumn': 'Cô dâu chú rể trên cây cầu gỗ',
  'night-dance': 'Cô dâu chú rể trong tiệc cưới',
  'blossom-wall': 'Cô dâu chú rể trước tường hoa đào',
  'lotus-pond': 'Áo dài trắng bên đầm sen',
  'lotus-field': 'Áo dài trắng giữa cánh đồng sen',
  'calla-lily': 'Áo dài trắng và bó hoa rum',
  'veil-laugh': 'Cô dâu chú rể cười dưới tấm voan',
  ranunculus: 'Một cành mao lương hồng',
  'ranunculus-hand': 'Cành mao lương hồng trên tay',
  'white-bouquet': 'Bó hoa cưới trắng',
  'couple-wood-wall': 'Cô dâu chú rể trước bức tường gỗ',
  'studio-sitting': 'Cô dâu chú rể ngồi trong studio',
  'stairs-above': 'Cô dâu chú rể trên cầu thang nhìn từ trên xuống',
  'love-letter': 'Cô dâu cầm lá thư tình',
  'bw-window': 'Cô dâu bên khung cửa sổ vòm',
  'ring-paper': 'Nhẫn cưới trên trang giấy',
  'bw-doorway': 'Cô dâu bước qua khung cửa',
  'white-blossoms': 'Cô dâu chú rể dưới tán hoa trắng',
  'studio-white': 'Cô dâu chú rể trong phòng trắng',
  'window-bouquet': 'Cô dâu ôm bó hoa bên cửa sổ',
  'rings-peony': 'Nhẫn cưới trên hoa mẫu đơn',
  'bouquet-veil': 'Bó hoa trên tấm voan',
  'garden-balloons': 'Cô dâu chú rể với bóng bay trong vườn',
  'misty-hills': 'Cô dâu chú rể giữa đồi sương',
  'dalat-hill': 'Cô dâu chú rể trên đồi thông lúc hoàng hôn',
  'park-walk': 'Cô dâu chú rể dạo bước trong công viên',
  'vineyard-walk': 'Cô dâu chú rể giữa vườn nho',
  'bouquet-grass': 'Bó hoa cưới trên thảm cỏ',
  'veil-embrace-p': 'Cô dâu tựa vào chú rể',
  'veil-embrace': 'Cô dâu tựa vào chú rể',
  'lace-gloves': 'Cô dâu găng ren cài hoa cho chú rể',
  'mother-blessing': 'Mẹ đưa con gái vào lễ đường',
  'dress-buttons': 'Cài cúc váy cưới',
  'pearl-setting': 'Bàn tiệc với ruy băng và ngọc trai',
  'shoes-lace': 'Giày cưới trên tấm ren',
  'lace-bw': 'Hàng cúc ren trên lưng váy cưới',
  'hands-bouquet': 'Tay đeo nhẫn trên bó hoa cưới',
  'bw-cliff': 'Cô dâu chú rể trên vách đá bên biển',
  'gold-rings': 'Đôi nhẫn vàng',
  'candle-table': 'Bàn tiệc nến và hoa',
  'rings-dark': 'Đôi nhẫn trên nền tối',
  'happy-street': 'Cô dâu chú rể bên biển tên đường Hạnh Phúc',
  'cake-toppers': 'Tượng cô dâu chú rể trên bánh cưới',
  'vineyard-dusk': 'Cô dâu chú rể trong vườn lúc hoàng hôn hồng',
  'pool-modern': 'Cô dâu chú rể bên hồ bơi',
  'seaside-bride': 'Cô dâu bên bờ biển',
  'shore-walk': 'Cô dâu chú rể dạo bước trên bãi biển',
  'beach-vows': 'Cô dâu chú rể trao lời thề trên bãi biển',
  'beach-lift': 'Chú rể bế cô dâu trên biển',
  'palm-couple': 'Cô dâu chú rể dưới hàng dừa',
  'sea-bride': 'Cô dâu đứng giữa biển',
  'sand-feet': 'Đôi chân trên cát',
  'red-bouquet': 'Bó hoa hồng đỏ',
  'dark-bouquet': 'Bó hoa hồng trắng',
};

/** Photo order: [cover, interlude, closing, …album]. The cover is also the first album photo. */
const SETS: Record<InvitationTemplateId, string[]> = {
  'song-hy-do': ['red-couple-p', 'ao-dai-red', 'procession', 'groom-ao-dai', 'ao-dai-gate', 'ao-dai-arch', 'song-hy-tea', 'red-couple', 'hue-door'],
  'son-mai': ['hue-door', 'aisle-lights', 'chandelier', 'groom-fan', 'bridge-autumn', 'night-dance', 'chandelier-p', 'ao-dai-red', 'gold-rings'],
  'sen-hong': ['blossom-wall', 'lotus-pond', 'lotus-field', 'calla-lily', 'veil-laugh', 'ranunculus', 'white-bouquet', 'window-bouquet', 'rings-peony'],
  'toi-gian': ['couple-wood-wall', 'studio-sitting', 'stairs-above', 'love-letter', 'bw-window', 'ring-paper', 'bw-doorway', 'lace-bw'],
  'mau-nuoc': ['veil-laugh', 'white-blossoms', 'studio-white', 'window-bouquet', 'rings-peony', 'bouquet-veil', 'white-bouquet', 'ranunculus', 'hands-bouquet'],
  'la-xanh': ['garden-balloons', 'misty-hills', 'dalat-hill', 'white-blossoms', 'park-walk', 'vineyard-walk', 'bouquet-grass'],
  'ren-co-dien': ['veil-embrace-p', 'love-letter', 'lace-gloves', 'mother-blessing', 'dress-buttons', 'pearl-setting', 'shoes-lace', 'lace-bw'],
  'baroque-vang': ['bw-window', 'bw-cliff', 'bw-doorway', 'gold-rings', 'candle-table', 'rings-dark', 'chandelier', 'lace-bw', 'aisle-lights'],
  'hong-pastel': ['studio-sitting', 'happy-street', 'garden-balloons', 'ranunculus-hand', 'blossom-wall', 'cake-toppers', 'veil-laugh', 'ranunculus'],
  'tap-chi': ['vineyard-dusk', 'pool-modern', 'misty-hills', 'stairs-above', 'lace-gloves', 'veil-embrace', 'couple-wood-wall'],
  'bien-xanh': ['beach-vows', 'seaside-bride', 'shore-walk', 'beach-lift', 'palm-couple', 'sea-bride', 'sand-feet'],
  'do-do': ['chandelier-p', 'red-bouquet', 'veil-embrace', 'hands-bouquet', 'dark-bouquet', 'candle-table', 'studio-white', 'lace-gloves', 'rings-dark'],
};

const url = (name: string) => `/invitation-samples/${name}.webp`;

/** Sample photographs (Unsplash License, see public/invitation-samples/SOURCES.md) */
export const SAMPLE_PHOTOS: Record<InvitationTemplateId, { cover: string; photos: InvitationPhoto[] }> = Object.fromEntries(
  Object.entries(SETS).map(([id, names]) => [
    id,
    { cover: url(names[0]), photos: names.map((n) => ({ id: n, url: url(n), caption: ALT[n] ?? null })) },
  ]),
) as Record<InvitationTemplateId, { cover: string; photos: InvitationPhoto[] }>;

export const SAMPLE_WISHES: InvitationWish[] = [
  { id: 'w1', name: 'Hoàng Nam', side: 'FRIEND', message: 'Chúc hai bạn trăm năm hạnh phúc, sớm có thiên thần nhỏ nhé!', createdAt: '2026-11-18T10:00:00.000Z', withGift: true },
  { id: 'w2', name: 'Cô Ba Đà Nẵng', side: 'BRIDE_SIDE', message: 'Thương con gái út của cô. Chúc hai con thuận vợ thuận chồng, tát biển Đông cũng cạn.', createdAt: '2026-11-17T09:00:00.000Z', withGift: false },
  { id: 'w3', name: 'Team Marketing', side: 'COLLEAGUE', message: 'Cả team sẽ có mặt đông đủ, chuẩn bị tinh thần 1-2-3 Dzô nha!', createdAt: '2026-11-16T15:00:00.000Z', withGift: false },
];
