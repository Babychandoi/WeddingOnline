/**
 * Online wedding invitation (thiệp cưới online): the couple's content, the chosen template and
 * which sections show. Stored as JSON on the wedding; validated here for both the API and UI.
 */

export type InvitationTemplateId =
  | 'song-hy-do'
  | 'son-mai'
  | 'sen-hong'
  | 'toi-gian'
  | 'mau-nuoc'
  | 'la-xanh'
  | 'ren-co-dien'
  | 'baroque-vang'
  | 'hong-pastel'
  | 'tap-chi'
  | 'bien-xanh'
  | 'do-do';

export interface InvitationTemplateMeta {
  id: InvitationTemplateId;
  nameVi: string;
  descriptionVi: string;
  /** Gallery filter */
  style: 'truyen-thong' | 'hien-dai' | 'lang-man' | 'sang-trong';
  /** Preview chips: ground, paper, accent, ink */
  swatches: [string, string, string, string];
}

export const INVITATION_TEMPLATES: InvitationTemplateMeta[] = [
  { id: 'song-hy-do', nameVi: 'Song Hỷ Đỏ', descriptionVi: 'Thiệp đỏ truyền thống, chữ Hỷ vàng kim, phong bì đỏ mở ra như thiệp in.', style: 'truyen-thong', swatches: ['#7a1012', '#a3161b', '#e8b64c', '#fff3dc'] },
  { id: 'son-mai', nameVi: 'Sơn Mài Hồng Phúc', descriptionVi: 'Nền sơn mài đỏ thẫm, viền vàng, hoạ tiết mây cát tường.', style: 'truyen-thong', swatches: ['#2a0b0b', '#5c1414', '#d8a84e', '#f6e7c8'] },
  { id: 'sen-hong', nameVi: 'Sen Hồng', descriptionVi: 'Hoa sen hồng và lá sen xanh, nhẹ nhàng mà rất Việt.', style: 'truyen-thong', swatches: ['#f7ede6', '#fffaf5', '#d9627d', '#2f5d46'] },
  { id: 'toi-gian', nameVi: 'Tối Giản', descriptionVi: 'Trắng ngà, chữ thanh mảnh, khoảng thở rộng. Đẹp nhờ sự tiết chế.', style: 'hien-dai', swatches: ['#f4f1ec', '#ffffff', '#1e1e1e', '#8a8378'] },
  { id: 'mau-nuoc', nameVi: 'Hoa Hồng Màu Nước', descriptionVi: 'Hồng phấn và đào loang màu nước, chữ viết tay bay bổng.', style: 'lang-man', swatches: ['#fbf3f1', '#fffdfb', '#d98a94', '#5b3b3f'] },
  { id: 'la-xanh', nameVi: 'Lá Xanh Boho', descriptionVi: 'Cành bạch đàn xanh xám, giấy kraft, hợp tiệc ngoài trời.', style: 'hien-dai', swatches: ['#e9ece4', '#f8f7f1', '#6f8a6b', '#2d3a2c'] },
  { id: 'ren-co-dien', nameVi: 'Ren Cổ Điển', descriptionVi: 'Viền ren và khung đôi, hồng tro cổ điển như thiệp thập niên 60.', style: 'lang-man', swatches: ['#efe2dc', '#faf4ef', '#a86f72', '#4a3436'] },
  { id: 'baroque-vang', nameVi: 'Baroque Hoàng Kim', descriptionVi: 'Đen tuyền và vàng kim, hoạ tiết hoa văn cung đình châu Âu.', style: 'sang-trong', swatches: ['#0f0d0b', '#1a1714', '#c9a45c', '#efe3c4'] },
  { id: 'hong-pastel', nameVi: 'Hồng Pastel', descriptionVi: 'Hồng phấn ngọt ngào, trái tim và dải lụa, trẻ trung.', style: 'lang-man', swatches: ['#ffe4ea', '#fff7f9', '#ec7c9a', '#6b2c3e'] },
  { id: 'tap-chi', nameVi: 'Tạp Chí', descriptionVi: 'Như trang bìa tạp chí: ảnh cưới lớn, chữ khổng lồ, đen trắng.', style: 'hien-dai', swatches: ['#ffffff', '#f2f2f2', '#111111', '#c8102e'] },
  { id: 'bien-xanh', nameVi: 'Biển Xanh', descriptionVi: 'Xanh navy và xanh trời, sóng biển, hợp đám cưới miền biển.', style: 'hien-dai', swatches: ['#0f2a47', '#f3f7fb', '#5aa7d6', '#e9c46a'] },
  { id: 'do-do', nameVi: 'Đỏ Đô Thư Pháp', descriptionVi: 'Đỏ rượu vang và hồng nhung, chữ viết tay, sang và ấm.', style: 'sang-trong', swatches: ['#4a0d1c', '#6e1427', '#e7b8a8', '#fbeee8'] },
];

export const DEFAULT_INVITATION_TEMPLATE: InvitationTemplateId = 'song-hy-do';

export function isInvitationTemplateId(id: unknown): id is InvitationTemplateId {
  return typeof id === 'string' && INVITATION_TEMPLATES.some((t) => t.id === id);
}

export type InvitationEventKind = 'AN_HOI' | 'VU_QUY' | 'THANH_HON' | 'TIEC_NHA_GAI' | 'TIEC_NHA_TRAI' | 'TIEC_CUOI' | 'KHAC';

export const INVITATION_EVENT_LABELS: Record<InvitationEventKind, string> = {
  AN_HOI: 'Lễ Ăn Hỏi',
  VU_QUY: 'Lễ Vu Quy',
  THANH_HON: 'Lễ Thành Hôn',
  TIEC_NHA_GAI: 'Tiệc Cưới Nhà Gái',
  TIEC_NHA_TRAI: 'Tiệc Cưới Nhà Trai',
  TIEC_CUOI: 'Tiệc Cưới',
  KHAC: 'Sự kiện khác',
};

export interface InvitationEvent {
  id: string;
  kind: InvitationEventKind;
  title: string;
  /** ISO instant */
  startsAt: string;
  venueName: string;
  address: string;
  /** Google Maps (or other https) link; built from the address when empty */
  mapUrl: string;
  note: string;
}

export interface InvitationStoryItem {
  id: string;
  /** Free text: "Mùa thu 2019", "14/02/2022" */
  when: string;
  title: string;
  text: string;
}

export interface InvitationFamily {
  father: string;
  mother: string;
  address: string;
}

export type InvitationSectionKey = 'countdown' | 'family' | 'events' | 'story' | 'album' | 'rsvp' | 'wishes' | 'gift' | 'hall';

export interface InvitationConfig {
  templateId: InvitationTemplateId;
  /** Names as printed on the card (default: the wedding's names) */
  groomFullName: string;
  brideFullName: string;
  headline: string;
  message: string;
  quote: string;
  groomFamily: InvitationFamily;
  brideFamily: InvitationFamily;
  events: InvitationEvent[];
  story: InvitationStoryItem[];
  /** https or site-relative image; empty = first album photo */
  coverPhotoUrl: string;
  music: { mode: 'SYNTH' | 'URL' | 'OFF'; url: string };
  sections: Record<InvitationSectionKey, boolean>;
  rsvpDeadline: string;
  dressCode: string;
  thankYou: string;
}

export const INVITATION_LIMITS = {
  name: 80,
  headline: 120,
  message: 600,
  quote: 240,
  familyField: 120,
  events: 6,
  eventTitle: 80,
  venueName: 140,
  address: 240,
  url: 500,
  note: 200,
  story: 8,
  storyWhen: 40,
  storyTitle: 80,
  storyText: 500,
  dressCode: 120,
  thankYou: 400,
} as const;

let idCounter = 0;
export function invitationItemId(prefix: string): string {
  idCounter = (idCounter + 1) % 1e6;
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}`;
}

/** Same day, at a given Vietnam local hour, as an ISO instant */
function atVietnamHour(iso: string, hour: number, minute = 0): string {
  const t = Date.parse(iso);
  const base = Number.isFinite(t) ? new Date(t + 7 * 3600 * 1000) : new Date(Date.now() + 7 * 3600 * 1000);
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), hour - 7, minute)).toISOString();
}

export function defaultInvitationConfig(w: { groomName: string; brideName: string; weddingDate: string }): InvitationConfig {
  return {
    templateId: DEFAULT_INVITATION_TEMPLATE,
    groomFullName: w.groomName,
    brideFullName: w.brideName,
    headline: 'Trân trọng báo tin Lễ Thành Hôn',
    message:
      'Sự hiện diện của quý khách là niềm vinh hạnh cho gia đình chúng tôi. Rất mong được đón tiếp và cùng chung vui trong ngày trọng đại của hai con.',
    quote: 'Yêu nhau cởi áo cho nhau, về nhà dối mẹ qua cầu gió bay.',
    groomFamily: { father: '', mother: '', address: '' },
    brideFamily: { father: '', mother: '', address: '' },
    events: [
      { id: 'ev_thanh_hon', kind: 'THANH_HON', title: INVITATION_EVENT_LABELS.THANH_HON, startsAt: atVietnamHour(w.weddingDate, 9), venueName: 'Tư gia nhà trai', address: '', mapUrl: '', note: '' },
      { id: 'ev_tiec', kind: 'TIEC_CUOI', title: INVITATION_EVENT_LABELS.TIEC_CUOI, startsAt: atVietnamHour(w.weddingDate, 18), venueName: '', address: '', mapUrl: '', note: 'Đón khách từ 17:30' },
    ],
    story: [],
    coverPhotoUrl: '',
    music: { mode: 'SYNTH', url: '' },
    sections: { countdown: true, family: true, events: true, story: true, album: true, rsvp: true, wishes: true, gift: true, hall: true },
    rsvpDeadline: '',
    dressCode: '',
    thankYou: 'Cảm ơn bạn đã dành thời gian đọc thiệp. Hẹn gặp bạn trong ngày vui của chúng mình!',
  };
}

function str(v: unknown, max: number, fallback = ''): string {
  if (typeof v !== 'string') return fallback;
  // Strip control characters; keep Vietnamese text and line breaks intact
  return v.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').trim().slice(0, max);
}

/** https URL or site-relative path; anything else (javascript:, data:, http:) becomes '' */
export function safeInvitationUrl(v: unknown): string {
  const s = str(v, INVITATION_LIMITS.url);
  if (!s) return '';
  if (s.startsWith('/') && !s.startsWith('//')) return s;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' ? u.toString() : '';
  } catch {
    return '';
  }
}

function iso(v: unknown, fallback: string): string {
  if (typeof v !== 'string') return fallback;
  const t = Date.parse(v);
  return Number.isFinite(t) ? new Date(t).toISOString() : fallback;
}

function family(v: unknown): InvitationFamily {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  return {
    father: str(o.father, INVITATION_LIMITS.familyField),
    mother: str(o.mother, INVITATION_LIMITS.familyField),
    address: str(o.address, INVITATION_LIMITS.familyField),
  };
}

const EVENT_KINDS = Object.keys(INVITATION_EVENT_LABELS) as InvitationEventKind[];
const SECTION_KEYS: InvitationSectionKey[] = ['countdown', 'family', 'events', 'story', 'album', 'rsvp', 'wishes', 'gift', 'hall'];

/**
 * Accepts anything (stored JSON, a PATCH body) and returns a complete, bounded config.
 * Missing fields come from `base`.
 */
export function sanitizeInvitationConfig(input: unknown, base: InvitationConfig): InvitationConfig {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const has = (k: string) => Object.prototype.hasOwnProperty.call(o, k);

  const events = Array.isArray(o.events)
    ? o.events.slice(0, INVITATION_LIMITS.events).map((raw, i) => {
        const e = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
        const kind = EVENT_KINDS.includes(e.kind as InvitationEventKind) ? (e.kind as InvitationEventKind) : 'KHAC';
        return {
          id: str(e.id, 40) || `ev_${i}`,
          kind,
          title: str(e.title, INVITATION_LIMITS.eventTitle) || INVITATION_EVENT_LABELS[kind],
          startsAt: iso(e.startsAt, base.events[0]?.startsAt ?? new Date().toISOString()),
          venueName: str(e.venueName, INVITATION_LIMITS.venueName),
          address: str(e.address, INVITATION_LIMITS.address),
          mapUrl: safeInvitationUrl(e.mapUrl),
          note: str(e.note, INVITATION_LIMITS.note),
        };
      })
    : base.events;

  const story = Array.isArray(o.story)
    ? o.story
        .slice(0, INVITATION_LIMITS.story)
        .map((raw, i) => {
          const s = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
          return {
            id: str(s.id, 40) || `st_${i}`,
            when: str(s.when, INVITATION_LIMITS.storyWhen),
            title: str(s.title, INVITATION_LIMITS.storyTitle),
            text: str(s.text, INVITATION_LIMITS.storyText),
          };
        })
        .filter((s) => s.title || s.text)
    : base.story;

  const musicIn = (o.music && typeof o.music === 'object' ? o.music : {}) as Record<string, unknown>;
  const musicMode = musicIn.mode === 'URL' || musicIn.mode === 'OFF' || musicIn.mode === 'SYNTH' ? musicIn.mode : base.music.mode;
  const musicUrl = has('music') ? safeInvitationUrl(musicIn.url) : base.music.url;

  const sectionsIn = (o.sections && typeof o.sections === 'object' ? o.sections : {}) as Record<string, unknown>;
  const sections = Object.fromEntries(
    SECTION_KEYS.map((k) => [k, typeof sectionsIn[k] === 'boolean' ? (sectionsIn[k] as boolean) : base.sections[k]]),
  ) as Record<InvitationSectionKey, boolean>;

  return {
    templateId: isInvitationTemplateId(o.templateId) ? o.templateId : base.templateId,
    groomFullName: has('groomFullName') ? str(o.groomFullName, INVITATION_LIMITS.name) || base.groomFullName : base.groomFullName,
    brideFullName: has('brideFullName') ? str(o.brideFullName, INVITATION_LIMITS.name) || base.brideFullName : base.brideFullName,
    headline: has('headline') ? str(o.headline, INVITATION_LIMITS.headline) : base.headline,
    message: has('message') ? str(o.message, INVITATION_LIMITS.message) : base.message,
    quote: has('quote') ? str(o.quote, INVITATION_LIMITS.quote) : base.quote,
    groomFamily: has('groomFamily') ? family(o.groomFamily) : base.groomFamily,
    brideFamily: has('brideFamily') ? family(o.brideFamily) : base.brideFamily,
    events,
    story,
    coverPhotoUrl: has('coverPhotoUrl') ? safeInvitationUrl(o.coverPhotoUrl) : base.coverPhotoUrl,
    music: { mode: musicMode as InvitationConfig['music']['mode'], url: musicUrl },
    sections,
    rsvpDeadline: has('rsvpDeadline') ? (o.rsvpDeadline ? iso(o.rsvpDeadline, '') : '') : base.rsvpDeadline,
    dressCode: has('dressCode') ? str(o.dressCode, INVITATION_LIMITS.dressCode) : base.dressCode,
    thankYou: has('thankYou') ? str(o.thankYou, INVITATION_LIMITS.thankYou) : base.thankYou,
  };
}

/** The stored config merged over defaults for this wedding (always complete) */
export function resolveInvitationConfig(stored: unknown, w: { groomName: string; brideName: string; weddingDate: string }): InvitationConfig {
  return sanitizeInvitationConfig(stored ?? {}, defaultInvitationConfig(w));
}

/** Google Maps search link for an address when the couple gave no map link */
export function invitationMapLink(e: Pick<InvitationEvent, 'mapUrl' | 'venueName' | 'address'>): string {
  if (e.mapUrl) return e.mapUrl;
  const q = [e.venueName, e.address].filter(Boolean).join(', ');
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : '';
}

export interface InvitationRsvpInput {
  guestName: string;
  phone: string;
  attending: boolean;
  headcount: number;
  side: 'GROOM_SIDE' | 'BRIDE_SIDE' | 'FRIEND' | 'COLLEAGUE';
  note: string;
}
