import type { InvitationMusicTrackId, Walkthrough3DTemplateId } from '@dco/shared';

export type PathStyle3D =
  | 'boardwalk'
  | 'red-carpet'
  | 'zigzag-bridge'
  | 'winding-boardwalk'
  | 'royal-blue-carpet'
  | 'cloud-aisle'
  | 'brick-red-carpet'
  | 'blush-carpet';

export type ParticleKind3D =
  | 'lavender'
  | 'snow'
  | 'maple'
  | 'lotus-glow'
  | 'pine-mist'
  | 'stardust-fireworks'
  | 'cloud-petals'
  | 'peach-petals'
  | 'gold-crimson-petals'
  | 'blush-petals';

export type SidePropKind3D =
  | 'lavender-lanterns'
  | 'snow-lamps'
  | 'maple-pumpkins'
  | 'lotus-lanterns'
  | 'pine-daisies'
  | 'cloud-lamps'
  | 'floating-islands'
  | 'peach-traps'
  | 'dragon-traps-mist'
  | 'marquee-tables';

export interface StagePlaqueLayout {
  /** Relative offset on the stage billboard plane (width/height normalized) */
  y: number;
  x?: number;
  width: number;
  textColor: string;
  subColor: string;
  useScript?: boolean;
  hasShadow?: boolean;
}

export interface WelcomeBoardPalette {
  bgTop: string;
  bgBottom: string;
  gold: string;
  text: string;
  sub: string;
  flower: string;
}

export interface Walkthrough3DTheme {
  id: Walkthrough3DTemplateId;
  slug: string;
  nameVi: string;
  subtitleVi: string;
  kickerVi: string;
  defaultGreeting: string;
  standee: 'western' | 'aodai-red-blue' | 'aodai-pastel';
  standeeSide: 'left' | 'right';
  defaultMusic: InvitationMusicTrackId;
  pathStyle: PathStyle3D;
  particleKind: ParticleKind3D;
  sidePropKind: SidePropKind3D;
  /** Control points from z = 2.6 toward z = -31 */
  curvePoints: Array<[number, number, number]>;
  groundColor: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  ambientColor: string;
  accentColor: string;
  accentGold: string;
  titleColor: string;
  cardBgTint: string;
  badgeColor: string;
  hasMarqueeRoof?: boolean;
  hasWaterSurface?: boolean;
  hasCircularPlaza?: boolean;
  plaque: StagePlaqueLayout;
  welcomeBoard: WelcomeBoardPalette;
}

export const WALKTHROUGH_3D_THEMES: Record<Walkthrough3DTemplateId, Walkthrough3DTheme> = {
  '3d-oai-huong': {
    id: '3d-oai-huong',
    slug: 'oai-huong',
    nameVi: 'Oải Hương 3D',
    subtitleVi: 'Thiệp cưới 3D · Ba khu đón khách · tiệc · lễ đài',
    kickerVi: 'TRÂN TRỌNG KÍNH MỜI',
    defaultGreeting: 'Chào {khach}! Dạo cánh đồng tím với tụi mình nhé',
    standee: 'western',
    standeeSide: 'right',
    defaultMusic: 'piano',
    pathStyle: 'boardwalk',
    particleKind: 'lavender',
    sidePropKind: 'lavender-lanterns',
    curvePoints: [
      [0, 1.85, 2.6],
      [0.05, 1.75, -6.5],
      [0.12, 1.66, -15.0],
      [-0.06, 1.7, -23.5],
      [0, 1.82, -31.0],
    ],
    groundColor: '#5c4b5d',
    fogColor: '#9b6b88',
    fogNear: 20,
    fogFar: 52,
    ambientColor: '#ffe0c2',
    accentColor: '#7b5ea7',
    accentGold: '#f3d398',
    titleColor: '#f7dec0',
    cardBgTint: '#3b2c4e',
    badgeColor: '#d9c6f0',
    plaque: { y: 1.03, width: 2.25, textColor: '#361b4f', subColor: '#5c3c73', useScript: true },
    welcomeBoard: { bgTop: '#562d6e', bgBottom: '#35184a', gold: '#f3d398', text: '#fff0ce', sub: '#e6cdf7', flower: '#c084fc' },
  },
  '3d-mua-dong-tuyet': {
    id: '3d-mua-dong-tuyet',
    slug: 'mua-dong-tuyet',
    nameVi: 'Mùa Đông Tuyết 3D',
    subtitleVi: 'Thiệp cưới 3D · Sân tròn · gazebo kính · tuyết rơi',
    kickerVi: 'TRÂN TRỌNG KÍNH MỜI',
    defaultGreeting: 'Chào {khach}! Vào rừng tuyết với tụi mình nhé',
    standee: 'western',
    standeeSide: 'right',
    defaultMusic: 'canon',
    pathStyle: 'red-carpet',
    particleKind: 'snow',
    sidePropKind: 'snow-lamps',
    hasCircularPlaza: true,
    curvePoints: [
      [0, 1.85, 2.6],
      [0, 1.75, -6.5],
      [0.12, 1.65, -15.0],
      [0, 1.72, -23.5],
      [0, 1.86, -31.0],
    ],
    groundColor: '#a8b7d4',
    fogColor: '#4d5d8a',
    fogNear: 20,
    fogFar: 52,
    ambientColor: '#e4ecff',
    accentColor: '#9d1b2d',
    accentGold: '#f4d998',
    titleColor: '#f7dfb1',
    cardBgTint: '#1f294d',
    badgeColor: '#dbeafe',
    plaque: { y: -0.57, width: 1.95, textColor: '#7a5a26', subColor: '#8d6c36', useScript: true },
    welcomeBoard: { bgTop: '#8e1320', bgBottom: '#5c0912', gold: '#f4d998', text: '#fcedc4', sub: '#f4d79a', flower: '#dc2626' },
  },
  '3d-mua-thu': {
    id: '3d-mua-thu',
    slug: 'mua-thu',
    nameVi: 'Mùa Thu Lá Phong 3D',
    subtitleVi: 'Thiệp cưới 3D · Triển lãm ảnh dưới vòm lá phong',
    kickerVi: 'TRÂN TRỌNG KÍNH MỜI',
    defaultGreeting: 'Chào {khach}! Dạo rừng phong với tụi mình nhé',
    standee: 'western',
    standeeSide: 'right',
    defaultMusic: 'hop-nhac',
    pathStyle: 'boardwalk',
    particleKind: 'maple',
    sidePropKind: 'maple-pumpkins',
    curvePoints: [
      [0, 1.85, 2.6],
      [-0.1, 1.74, -6.5],
      [0.16, 1.66, -15.0],
      [-0.08, 1.7, -23.5],
      [0, 1.82, -31.0],
    ],
    groundColor: '#7e482b',
    fogColor: '#a84f26',
    fogNear: 20,
    fogFar: 52,
    ambientColor: '#ffd4a3',
    accentColor: '#b3471e',
    accentGold: '#f7d59c',
    titleColor: '#fae1bc',
    cardBgTint: '#592914',
    badgeColor: '#fed7aa',
    plaque: { y: 1.45, width: 2.05, textColor: '#4f2612', subColor: '#723a1d', useScript: true },
    welcomeBoard: { bgTop: '#8a2b14', bgBottom: '#571609', gold: '#f7d59c', text: '#fff1d0', sub: '#f5cda2', flower: '#ea580c' },
  },
  '3d-ho-sen-hoa-dang': {
    id: '3d-ho-sen-hoa-dang',
    slug: 'ho-sen-hoa-dang',
    nameVi: 'Hồ Sen Hoa Đăng 3D',
    subtitleVi: 'Thiệp cưới 3D · Cầu cửu khúc · hoa đăng · thuỷ tạ',
    kickerVi: 'TRÂN TRỌNG BÁO TIN',
    defaultGreeting: 'Kính chào {khach}! Mời theo cầu gỗ ra hồ sen',
    standee: 'aodai-red-blue',
    standeeSide: 'right',
    defaultMusic: 'dan-tranh',
    pathStyle: 'zigzag-bridge',
    particleKind: 'lotus-glow',
    sidePropKind: 'lotus-lanterns',
    hasWaterSurface: true,
    curvePoints: [
      [0, 1.88, 2.6],
      [-0.4, 1.74, -6.5],
      [0.4, 1.66, -15.0],
      [-0.3, 1.72, -23.5],
      [0, 1.85, -31.0],
    ],
    groundColor: '#171d4a',
    fogColor: '#252a63',
    fogNear: 22,
    fogFar: 56,
    ambientColor: '#dce3ff',
    accentColor: '#b92b49',
    accentGold: '#f7d894',
    titleColor: '#fae4b5',
    cardBgTint: '#1b1f4d',
    badgeColor: '#fbcfe8',
    plaque: { y: -0.42, width: 1.55, textColor: '#8d2231', subColor: '#703d3c', useScript: true },
    welcomeBoard: { bgTop: '#8f0d18', bgBottom: '#5c050d', gold: '#f5d27b', text: '#fbe7ae', sub: '#f3d48c', flower: '#c81e2b' },
  },
  '3d-rung-thong': {
    id: '3d-rung-thong',
    slug: 'rung-thong',
    nameVi: 'Rừng Thông 3D',
    subtitleVi: 'Thiệp cưới 3D · Đường mòn uốn lượn · sương sớm',
    kickerVi: 'TRÂN TRỌNG KÍNH MỜI',
    defaultGreeting: 'Chào {khach}! Vào rừng thông với tụi mình nhé',
    standee: 'western',
    standeeSide: 'right',
    defaultMusic: 'sao-truc',
    pathStyle: 'winding-boardwalk',
    particleKind: 'pine-mist',
    sidePropKind: 'pine-daisies',
    curvePoints: [
      [0, 1.85, 2.6],
      [-0.5, 1.74, -6.5],
      [0.45, 1.66, -15.0],
      [-0.32, 1.7, -23.5],
      [0, 1.82, -31.0],
    ],
    groundColor: '#566435',
    fogColor: '#889878',
    fogNear: 20,
    fogFar: 52,
    ambientColor: '#eef5db',
    accentColor: '#355c37',
    accentGold: '#f5dfa6',
    titleColor: '#f8e6ba',
    cardBgTint: '#1d3826',
    badgeColor: '#dcfce7',
    plaque: { y: 0.28, width: 2.8, textColor: '#2d5738', subColor: '#486e51', useScript: true },
    welcomeBoard: { bgTop: '#244d30', bgBottom: '#152e1d', gold: '#f5dfa6', text: '#fff4d6', sub: '#d8eccf', flower: '#eab308' },
  },
  '3d-dem-trang': {
    id: '3d-dem-trang',
    slug: 'dem-trang',
    nameVi: 'Đêm Trăng Sao 3D',
    subtitleVi: 'Thiệp cưới 3D · Trăng tròn · đèn trời · pháo hoa',
    kickerVi: 'TRÂN TRỌNG KÍNH MỜI',
    defaultGreeting: 'Chào {khach}! Lên mây với tụi mình nhé',
    standee: 'western',
    standeeSide: 'right',
    defaultMusic: 'piano',
    pathStyle: 'royal-blue-carpet',
    particleKind: 'stardust-fireworks',
    sidePropKind: 'cloud-lamps',
    curvePoints: [
      [0, 1.88, 2.6],
      [0.05, 1.76, -6.5],
      [0.14, 1.66, -15.0],
      [0, 1.72, -23.5],
      [0, 1.86, -31.0],
    ],
    groundColor: '#243161',
    fogColor: '#1f2b5c',
    fogNear: 22,
    fogFar: 55,
    ambientColor: '#d9e3ff',
    accentColor: '#3b5399',
    accentGold: '#f6d895',
    titleColor: '#f7deb0',
    cardBgTint: '#152047',
    badgeColor: '#e0e7ff',
    plaque: { x: 0.26, y: -1.56, width: 2.35, textColor: '#7a5a26', subColor: '#8d6c36', useScript: true },
    welcomeBoard: { bgTop: '#1d2b64', bgBottom: '#10193d', gold: '#f6d895', text: '#fff2cf', sub: '#d5e0ff', flower: '#fbbf24' },
  },
  '3d-tren-may': {
    id: '3d-tren-may',
    slug: 'tren-may',
    nameVi: 'Trên Mây Hồng 3D',
    subtitleVi: 'Thiệp cưới 3D · Biển mây hồng · đảo hoa lơ lửng',
    kickerVi: 'TRÂN TRỌNG KÍNH MỜI',
    defaultGreeting: 'Chào {khach}! Lên mây với tụi mình nhé',
    standee: 'western',
    standeeSide: 'right',
    defaultMusic: 'canon',
    pathStyle: 'cloud-aisle',
    particleKind: 'cloud-petals',
    sidePropKind: 'floating-islands',
    curvePoints: [
      [0, 1.88, 2.6],
      [0, 1.76, -6.5],
      [0.14, 1.66, -15.0],
      [0, 1.72, -23.5],
      [0, 1.86, -31.0],
    ],
    groundColor: '#caa3c7',
    fogColor: '#ddb5d2',
    fogNear: 21,
    fogFar: 54,
    ambientColor: '#fff0f7',
    accentColor: '#a85075',
    accentGold: '#f6dfb0',
    titleColor: '#fff2d8',
    cardBgTint: '#59476b',
    badgeColor: '#fce7f3',
    plaque: { y: 0.46, width: 2.05, textColor: '#6b4d3e', subColor: '#8b6855', useScript: true },
    welcomeBoard: { bgTop: '#8f385c', bgBottom: '#5e203b', gold: '#f6dfb0', text: '#fff4de', sub: '#ffd9e8', flower: '#f472b6' },
  },
  '3d-vuon-hoa-dao': {
    id: '3d-vuon-hoa-dao',
    slug: 'vuon-hoa-dao',
    nameVi: 'Vườn Hoa Đào 3D',
    subtitleVi: 'Thiệp cưới 3D · Ngày xuân · đèn lồng · thảm đỏ',
    kickerVi: 'TRÂN TRỌNG BÁO TIN',
    defaultGreeting: 'Chào {khach}! Vào đây với tụi mình nhé',
    standee: 'aodai-pastel',
    standeeSide: 'left',
    defaultMusic: 'sao-truc',
    pathStyle: 'red-carpet',
    particleKind: 'peach-petals',
    sidePropKind: 'peach-traps',
    curvePoints: [
      [0, 1.85, 2.6],
      [0, 1.75, -6.5],
      [-0.14, 1.66, -15.0],
      [0, 1.72, -23.5],
      [0, 1.84, -31.0],
    ],
    groundColor: '#3f6227',
    fogColor: '#8c9eb4',
    fogNear: 20,
    fogFar: 52,
    ambientColor: '#ffeef2',
    accentColor: '#9e1928',
    accentGold: '#f5d287',
    titleColor: '#f7dca4',
    cardBgTint: '#541b25',
    badgeColor: '#ffe4e6',
    plaque: { y: 0.6, width: 2.65, textColor: '#9c1d28', subColor: '#7a3337', useScript: true },
    welcomeBoard: { bgTop: '#9c1724', bgBottom: '#630b15', gold: '#f5d287', text: '#fff0c9', sub: '#ffd7de', flower: '#fb7185' },
  },
  '3d-co-truyen': {
    id: '3d-co-truyen',
    slug: 'co-truyen',
    nameVi: 'Cổ Truyền Rồng Phụng 3D',
    subtitleVi: 'Thiệp cưới 3D · Cổng rồng phụng · áo dài · đàn tranh',
    kickerVi: 'TRÂN TRỌNG BÁO TIN',
    defaultGreeting: 'Kính chào {khach}! Mời vào dự lễ cùng gia đình',
    standee: 'aodai-red-blue',
    standeeSide: 'right',
    defaultMusic: 'dan-tranh',
    pathStyle: 'brick-red-carpet',
    particleKind: 'gold-crimson-petals',
    sidePropKind: 'dragon-traps-mist',
    curvePoints: [
      [0, 1.85, 2.6],
      [0, 1.75, -6.5],
      [0.14, 1.66, -15.0],
      [0, 1.72, -23.5],
      [0, 1.84, -31.0],
    ],
    groundColor: '#723a2c',
    fogColor: '#9a472d',
    fogNear: 20,
    fogFar: 52,
    ambientColor: '#ffdcb8',
    accentColor: '#8f1116',
    accentGold: '#f6d17f',
    titleColor: '#f8da95',
    cardBgTint: '#4f0c11',
    badgeColor: '#fef3c7',
    plaque: { y: -0.18, width: 3.25, textColor: '#fff2cf', subColor: '#f3d48c', useScript: true, hasShadow: true },
    welcomeBoard: { bgTop: '#930c14', bgBottom: '#5e050b', gold: '#f6d17f', text: '#fff2cc', sub: '#f8da95', flower: '#dc2626' },
  },
  '3d-rap-cuoi': {
    id: '3d-rap-cuoi',
    slug: 'rap-cuoi',
    nameVi: 'Rạp Cưới Voan Hồng 3D',
    subtitleVi: 'Thiệp cưới 3D · Rạp voan hồng · bàn tiệc · áo dài',
    kickerVi: 'TRÂN TRỌNG KÍNH MỜI',
    defaultGreeting: 'Chào {khach}! Vào đây với tụi mình nhé',
    standee: 'aodai-pastel',
    standeeSide: 'right',
    defaultMusic: 'bridal',
    pathStyle: 'blush-carpet',
    particleKind: 'blush-petals',
    sidePropKind: 'marquee-tables',
    hasMarqueeRoof: true,
    curvePoints: [
      [0, 1.85, 2.6],
      [0, 1.75, -6.5],
      [0.14, 1.66, -15.0],
      [0, 1.72, -23.5],
      [0, 1.84, -31.0],
    ],
    groundColor: '#567c32',
    fogColor: '#e8ced8',
    fogNear: 20,
    fogFar: 52,
    ambientColor: '#fff2f6',
    accentColor: '#b34366',
    accentGold: '#f4d3a1',
    titleColor: '#fae2c0',
    cardBgTint: '#422532',
    badgeColor: '#fce7f3',
    plaque: { y: 0.46, width: 2.2, textColor: '#944a5d', subColor: '#785a62', useScript: true },
    welcomeBoard: { bgTop: '#94294a', bgBottom: '#61162f', gold: '#f4d3a1', text: '#fff2db', sub: '#ffd9e6', flower: '#f472b6' },
  },
};

export function walkthrough3DTheme(id: Walkthrough3DTemplateId): Walkthrough3DTheme {
  return WALKTHROUGH_3D_THEMES[id];
}

export function formatWalkthroughDate(iso: string): string {
  const t = Date.parse(iso);
  const d = new Date((Number.isFinite(t) ? t : Date.now()) + 7 * 3600 * 1000);
  const days = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dow = days[d.getUTCDay()] ?? 'Chủ nhật';
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dow} · ${dd} . ${mm} . ${yyyy}`;
}

export function formatShortDotsDate(iso: string): string {
  const t = Date.parse(iso);
  const d = new Date((Number.isFinite(t) ? t : Date.now()) + 7 * 3600 * 1000);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd} . ${mm} . ${yyyy}`;
}
