/**
 * Wedding venue themes: Vietnamese spaces plus wedding settings from around the world.
 * Every venue shares the same walkable floor plan (see STARTER_TEMPLATES in prefabs.ts);
 * what changes is the 3D world around it, assembled from reusable low-poly kits.
 */

export type VenueRegion =
  | 'VIETNAM'
  | 'EAST_ASIA'
  | 'SOUTH_SOUTHEAST_ASIA'
  | 'MIDDLE_EAST_AFRICA'
  | 'EUROPE'
  | 'AMERICAS'
  | 'OCEANIA';

export const VENUE_REGIONS: Array<{ id: VenueRegion; nameVi: string }> = [
  { id: 'VIETNAM', nameVi: 'Việt Nam' },
  { id: 'EAST_ASIA', nameVi: 'Đông Á' },
  { id: 'SOUTH_SOUTHEAST_ASIA', nameVi: 'Nam Á & Đông Nam Á' },
  { id: 'MIDDLE_EAST_AFRICA', nameVi: 'Trung Đông & Châu Phi' },
  { id: 'EUROPE', nameVi: 'Châu Âu' },
  { id: 'AMERICAS', nameVi: 'Châu Mỹ' },
  { id: 'OCEANIA', nameVi: 'Châu Đại Dương' },
];

/** Lighting mood of the scene */
export type VenueMood = 'day' | 'sunset' | 'night' | 'indoor';

export type PerimeterKit =
  | 'none'
  | 'classic-pillars'
  | 'lacquer-pillars'
  | 'palms'
  | 'pines'
  | 'round-trees'
  | 'blossom-trees'
  | 'cypress'
  | 'bamboo'
  | 'arches'
  | 'torches'
  | 'stone-lanterns'
  | 'hedges'
  | 'birches'
  | 'acacia'
  | 'baobab'
  | 'gers';

export type CanopyKit =
  | 'none'
  | 'chandeliers'
  | 'fairy-lights'
  | 'silk-lanterns'
  | 'paper-lanterns'
  | 'drapes'
  | 'bunting'
  | 'garlands'
  | 'stars'
  | 'sky-lanterns'
  | 'balloons'
  | 'aurora';

export type BackdropKit =
  | 'sea'
  | 'mountains'
  | 'snow-peaks'
  | 'dunes'
  | 'skyline'
  | 'forest'
  | 'terraces'
  | 'lake'
  | 'hills'
  | 'red-rocks'
  | 'walls'
  | 'old-town'
  | 'castle'
  | 'fields'
  | 'karst'
  | 'stupas';

export type CenterpieceKit =
  | 'none'
  | 'ancestral-altar'
  | 'tea-table'
  | 'chuppah'
  | 'mandap'
  | 'floral-arch'
  | 'torii'
  | 'gazebo'
  | 'fountain'
  | 'stone-circle'
  | 'poruwa'
  | 'pelamin'
  | 'split-gate'
  | 'maypole'
  | 'windmill'
  | 'barn'
  | 'glasshouse';

export type GateKit = 'floral' | 'coconut' | 'lacquer' | 'stone-arch' | 'palm-arch' | 'bamboo';

export interface VenueKits {
  /** Repeated along the hall edges */
  p: PerimeterKit;
  /** Overhead, above the guests */
  c: CanopyKit;
  /** Distant scenery layers beyond the hall (combinable) */
  b: BackdropKit[];
  /** Signature element behind the stage or flanking the hall */
  ce: CenterpieceKit;
  /** Reception gate at the entrance */
  g: GateKit;
}

/**
 * Colours. f floor · g ground beyond the hall · a accent (stage, trims) · s sky / fog ·
 * c aisle carpet · cu stage curtain · pe falling petals ('' = none) ·
 * k perimeter tint · k2 secondary tint (old-town roofs) · ca canopy tint · ca2 secondary canopy tint ·
 * sc scenery tint (backdrop)
 */
export interface VenueColors {
  f: string;
  g: string;
  a: string;
  s: string;
  c: string;
  cu: string;
  pe: string;
  k?: string;
  k2?: string;
  ca?: string;
  ca2?: string;
  sc?: string;
}

export interface VenueTheme {
  id: string;
  nameVi: string;
  /** Country / area, in Vietnamese */
  place: string;
  region: VenueRegion;
  mood: VenueMood;
  descriptionVi: string;
  kits: VenueKits;
  colors: VenueColors;
  tables: [string, string, string, string, string, string];
  /** Optional sign on the reception gate */
  gateSign?: string;
}

const DEFAULT_TABLES: VenueTheme['tables'] = [
  'Bàn Nhà Trai',
  'Bàn Bạn Bè',
  'Bàn Đồng Nghiệp',
  'Bàn Nhà Gái',
  'Bàn Gia Đình',
  'Bàn Khách Phương Xa',
];

function V(
  id: string,
  nameVi: string,
  place: string,
  region: VenueRegion,
  mood: VenueMood,
  descriptionVi: string,
  kits: VenueKits,
  colors: VenueColors,
  extra: { tables?: VenueTheme['tables']; gateSign?: string } = {}
): VenueTheme {
  return { id, nameVi, place, region, mood, descriptionVi, kits, colors, tables: extra.tables ?? DEFAULT_TABLES, gateSign: extra.gateSign };
}

export const VENUE_THEMES: VenueTheme[] = [
  /* ───────────────────────────── Việt Nam ───────────────────────────── */
  V('mekong_coconut_tent', 'Rạp Cưới Miền Tây (Cổng Lá Dừa)', 'Đồng bằng sông Cửu Long', 'VIETNAM', 'day',
    'Cổng lá dừa kết hoa rồng phụng, rạp cưới lụa đỏ và đèn lồng đậm chất truyền thống Nam Bộ.',
    { p: 'palms', c: 'silk-lanterns', b: [], ce: 'none', g: 'coconut' },
    { f: '#ebd9c5', g: '#7c9a5e', a: '#e11d48', s: '#fef3c7', c: '#dc2626', cu: '#be123c', pe: '#fda4af', ca: '#e11d48', ca2: '#dc2626' },
    { tables: ['Bàn Bác Ba & Nội', 'Bàn Xóm Dưới', 'Bàn Bạn Cấp 3', 'Bàn Dì Tư & Ngoại', 'Bàn Đồng Nghiệp', 'Bàn 1-2-3 Dzô!'], gateSign: '囍 VU QUY & THÀNH HÔN' }),
  V('luxury_ballroom', 'Sảnh Khách Sạn Sang Trọng', 'Việt Nam', 'VIETNAM', 'indoor',
    'Đèn chùm pha lê, cột trắng viền vàng, thảm đỏ hoàng gia và sắc vàng champagne ấm cúng.',
    { p: 'classic-pillars', c: 'chandeliers', b: [], ce: 'none', g: 'floral' },
    { f: '#f6efe4', g: '#2b1c36', a: '#d4af37', s: '#23162f', c: '#991b1b', cu: '#ffe4e6', pe: '#fde68a' },
    { tables: ['Bàn Họ Nhà Trai', 'Bàn Bạn Đại Học', 'Bàn Đồng Nghiệp', 'Bàn Họ Nhà Gái', 'Bàn Hội Bạn Thân', 'Bàn Khách Phương Xa'] }),
  V('sunset_garden', 'Tiệc Sân Vườn Hoàng Hôn', 'Việt Nam', 'VIETNAM', 'day',
    'Thảm cỏ xanh mát, hàng cây và dây đèn fairy light lung linh cho tiệc cưới ngoài trời.',
    { p: 'pines', c: 'fairy-lights', b: [], ce: 'none', g: 'floral' },
    { f: '#6b9a5b', g: '#4c7742', a: '#fb923c', s: '#fde2b8', c: '#f43f5e', cu: '#ffe4e6', pe: '#fda4af' },
    { tables: ['Bàn Gia Đình 1', 'Bàn Team Cấp 3', 'Bàn Hội Du Học', 'Bàn Gia Đình 2', 'Bàn Bạn Đại Học', 'Bàn Chill Sân Vườn'] }),
  V('vn_gia_tien', 'Lễ Gia Tiên Nhà Ba Gian', 'Đồng bằng Bắc Bộ', 'VIETNAM', 'day',
    'Lễ gia tiên trước bàn thờ tổ tiên trong nếp nhà ba gian mái ngói, phông đỏ chữ Hỷ và mâm quả trầu cau.',
    { p: 'lacquer-pillars', c: 'silk-lanterns', b: ['old-town'], ce: 'ancestral-altar', g: 'lacquer' },
    { f: '#c9a27c', g: '#9a5b3c', a: '#b91c1c', s: '#fde7c7', c: '#b91c1c', cu: '#991b1b', pe: '#fca5a5', k: '#6b2a1a', ca: '#b91c1c', ca2: '#dc2626', sc: '#7c2d12' },
    { tables: ['Mâm Họ Nội', 'Mâm Các Cụ', 'Mâm Hàng Xóm', 'Mâm Họ Ngoại', 'Mâm Anh Em', 'Mâm Bạn Bè'], gateSign: '囍 LỄ GIA TIÊN' }),
  V('vn_phu_quoc_beach', 'Tiệc Cưới Bãi Biển Phú Quốc', 'Kiên Giang', 'VIETNAM', 'sunset',
    'Cát trắng, hàng dừa và hoàng hôn trên biển, cổng hoa trắng đón khách ngay mép sóng.',
    { p: 'palms', c: 'paper-lanterns', b: ['sea'], ce: 'floral-arch', g: 'palm-arch' },
    { f: '#f3e3c3', g: '#e9d3a6', a: '#f59e0b', s: '#fdba74', c: '#fef3c7', cu: '#fff7ed', pe: '#ffffff', ca: '#fff7ed', ca2: '#fde68a', sc: '#0ea5e9' }),
  V('vn_hoi_an', 'Phố Cổ Hội An Đèn Lồng', 'Quảng Nam', 'VIETNAM', 'night',
    'Tường vàng rêu phong, mái ngói âm dương và hàng trăm đèn lồng lụa thắp sáng phố cổ bên sông Hoài.',
    { p: 'none', c: 'paper-lanterns', b: ['old-town', 'lake'], ce: 'none', g: 'lacquer' },
    { f: '#cdb795', g: '#5b4a3a', a: '#f59e0b', s: '#1e1b3a', c: '#b45309', cu: '#9a3412', pe: '', ca: '#ef4444', ca2: '#facc15', sc: '#eab308' }),
  V('vn_da_lat', 'Đà Lạt Rừng Thông', 'Lâm Đồng', 'VIETNAM', 'day',
    'Rừng thông reo trong sương sớm, nhà kính hoa và ghế gỗ mộc cho tiệc cưới se lạnh.',
    { p: 'pines', c: 'fairy-lights', b: ['forest', 'hills'], ce: 'glasshouse', g: 'floral' },
    { f: '#8fb08a', g: '#55704f', a: '#a78bfa', s: '#dbe7e4', c: '#f5f5f4', cu: '#f5f3ff', pe: '#ddd6fe', k: '#166534', sc: '#3f6212' }),
  V('vn_hue_imperial', 'Cung Đình Huế', 'Thừa Thiên Huế', 'VIETNAM', 'day',
    'Sắc vàng son cung đình, cột sơn son thếp vàng và mái ngói lưu ly của kinh thành Huế.',
    { p: 'lacquer-pillars', c: 'silk-lanterns', b: ['walls'], ce: 'none', g: 'lacquer' },
    { f: '#e8d9b5', g: '#7f1d1d', a: '#ca8a04', s: '#fef3c7', c: '#a16207', cu: '#a16207', pe: '#fde047', k: '#991b1b', ca: '#ca8a04', ca2: '#facc15', sc: '#9f1239' }),
  V('vn_mu_cang_chai', 'Ruộng Bậc Thang Tây Bắc', 'Yên Bái', 'VIETNAM', 'day',
    'Tiệc cưới giữa ruộng bậc thang mùa lúa chín, váy thổ cẩm rực rỡ và núi đồi Mù Cang Chải.',
    { p: 'bamboo', c: 'bunting', b: ['terraces', 'mountains'], ce: 'none', g: 'bamboo' },
    { f: '#b5c27a', g: '#9bb05c', a: '#dc2626', s: '#cfe8f7', c: '#7c2d12', cu: '#b91c1c', pe: '', ca: '#dc2626', ca2: '#2563eb', sc: '#d9b44a' }),
  V('vn_ha_long_cruise', 'Du Thuyền Vịnh Hạ Long', 'Quảng Ninh', 'VIETNAM', 'sunset',
    'Boong tàu gỗ giữa vịnh, những núi đá vôi nhô lên trên mặt nước xanh ngọc lúc hoàng hôn.',
    { p: 'none', c: 'fairy-lights', b: ['karst'], ce: 'none', g: 'floral' },
    { f: '#a0764a', g: '#0e7490', a: '#f59e0b', s: '#fcd9a8', c: '#f5f5f4', cu: '#fff7ed', pe: '#ffffff', sc: '#4d7c6f' }),
  V('vn_saigon_rooftop', 'Sân Thượng Sài Gòn', 'TP. Hồ Chí Minh', 'VIETNAM', 'night',
    'Tiệc cưới trên sân thượng nhìn ra đèn thành phố về đêm, dây đèn và cây xanh trong chậu.',
    { p: 'round-trees', c: 'fairy-lights', b: ['skyline'], ce: 'none', g: 'floral' },
    { f: '#57534e', g: '#292524', a: '#f472b6', s: '#1e1b4b', c: '#be185d', cu: '#fdf2f8', pe: '', k: '#15803d', sc: '#312e81' }),

  /* ───────────────────────────── Đông Á ───────────────────────────── */
  V('jp_shinto', 'Đền Thần Đạo Nhật Bản', 'Nhật Bản', 'EAST_ASIA', 'day',
    'Lễ cưới Thần đạo shinzen shiki trước điện thờ, cô dâu mặc shiromuku trắng tinh dưới cổng torii son đỏ.',
    { p: 'stone-lanterns', c: 'none', b: ['forest'], ce: 'torii', g: 'lacquer' },
    { f: '#e7e5e4', g: '#78716c', a: '#dc2626', s: '#e0f2fe', c: '#f5f5f4', cu: '#fafaf9', pe: '', sc: '#14532d' }),
  V('jp_sakura', 'Vườn Hoa Anh Đào Kyoto', 'Nhật Bản', 'EAST_ASIA', 'day',
    'Tiệc ngoài trời dưới tán anh đào mùa xuân, đèn lồng giấy trắng và một chén trà đạo chúc phúc.',
    { p: 'blossom-trees', c: 'paper-lanterns', b: ['mountains'], ce: 'none', g: 'floral' },
    { f: '#a3b18a', g: '#7a8b62', a: '#f472b6', s: '#fdf2f8', c: '#fbcfe8', cu: '#fff1f2', pe: '#fbcfe8', k: '#f9a8d4', ca: '#fffbeb', ca2: '#fecaca', sc: '#94a3b8' }),
  V('jp_ryokan_autumn', 'Vườn Lữ Quán Mùa Thu', 'Nhật Bản', 'EAST_ASIA', 'sunset',
    'Lá phong đỏ rực, đèn đá tōrō và mặt hồ phẳng lặng trong khu vườn lữ quán truyền thống.',
    { p: 'blossom-trees', c: 'none', b: ['lake', 'hills'], ce: 'none', g: 'lacquer' },
    { f: '#9c8b6e', g: '#6b5a3e', a: '#b91c1c', s: '#fed7aa', c: '#7c2d12', cu: '#fef3c7', pe: '#f97316', k: '#dc2626', sc: '#7c5a2c' }),
  V('jp_hokkaido_snow', 'Lễ Cưới Tuyết Hokkaido', 'Nhật Bản', 'EAST_ASIA', 'night',
    'Tuyết trắng phủ rừng bạch dương, ánh đèn ấm áp và bông tuyết rơi trên lễ đường.',
    { p: 'birches', c: 'fairy-lights', b: ['snow-peaks'], ce: 'none', g: 'floral' },
    { f: '#f1f5f9', g: '#e2e8f0', a: '#60a5fa', s: '#1e293b', c: '#dbeafe', cu: '#f8fafc', pe: '#ffffff', sc: '#94a3b8' }),
  V('kr_hanok', 'Nhà Hanok Hàn Quốc', 'Hàn Quốc', 'EAST_ASIA', 'day',
    'Lễ cưới truyền thống trong sân nhà hanok, bàn lễ chorye-sang có đôi ngỗng gỗ và sắc đỏ xanh của hanbok.',
    { p: 'lacquer-pillars', c: 'drapes', b: ['old-town'], ce: 'tea-table', g: 'lacquer' },
    { f: '#d6c7a8', g: '#8b7355', a: '#2563eb', s: '#e0f2fe', c: '#dc2626', cu: '#1d4ed8', pe: '', k: '#5b3a29', ca: '#dc2626', ca2: '#2563eb', sc: '#475569' }),
  V('kr_jeju', 'Bờ Biển Đảo Jeju', 'Hàn Quốc', 'EAST_ASIA', 'day',
    'Đá núi lửa đen, đồng hoa cải vàng và biển xanh của hòn đảo lãng mạn nhất Hàn Quốc.',
    { p: 'round-trees', c: 'fairy-lights', b: ['sea', 'fields'], ce: 'floral-arch', g: 'stone-arch' },
    { f: '#9cc27a', g: '#78a35a', a: '#facc15', s: '#bae6fd', c: '#fef9c3', cu: '#fefce8', pe: '#fde047', k: '#3f6212', sc: '#facc15' }),
  V('kr_seoul_hall', 'Sảnh Cưới Hiện Đại Seoul', 'Hàn Quốc', 'EAST_ASIA', 'indoor',
    'Sảnh cưới kiểu Hàn với lối đi hoa trắng, đèn pha lê và sân khấu sáng rực.',
    { p: 'classic-pillars', c: 'chandeliers', b: ['walls'], ce: 'floral-arch', g: 'floral' },
    { f: '#f8fafc', g: '#e2e8f0', a: '#cbd5e1', s: '#f1f5f9', c: '#ffffff', cu: '#f8fafc', pe: '#ffffff', sc: '#e5e7eb' }),
  V('cn_courtyard', 'Tứ Hợp Viện Trung Hoa', 'Trung Quốc', 'EAST_ASIA', 'day',
    'Lễ dâng trà trong sân tứ hợp viện, đèn lồng đỏ, chữ Song Hỷ và cô dâu áo cưới đỏ thêu phượng.',
    { p: 'lacquer-pillars', c: 'silk-lanterns', b: ['old-town'], ce: 'tea-table', g: 'lacquer' },
    { f: '#b8a99a', g: '#6b5e52', a: '#dc2626', s: '#fef2f2', c: '#dc2626', cu: '#b91c1c', pe: '#fca5a5', k: '#991b1b', ca: '#dc2626', ca2: '#b91c1c', sc: '#52525b' },
    { gateSign: '囍' }),
  V('cn_jiangnan', 'Thủy Trấn Giang Nam', 'Trung Quốc', 'EAST_ASIA', 'day',
    'Liễu rủ bên kênh, cầu đá vòm và những ngôi nhà tường trắng mái đen của Tô Châu.',
    { p: 'round-trees', c: 'paper-lanterns', b: ['old-town', 'lake'], ce: 'none', g: 'lacquer' },
    { f: '#c7c2b8', g: '#7c8b7a', a: '#b91c1c', s: '#e7f0ea', c: '#b91c1c', cu: '#fef2f2', pe: '', k: '#65a30d', ca: '#dc2626', ca2: '#f87171', sc: '#f5f5f4' }),
  V('hk_harbour', 'Cảng Victoria Về Đêm', 'Hồng Kông', 'EAST_ASIA', 'night',
    'Tiệc cưới bên cảng với đường chân trời rực đèn và mặt nước lấp lánh của Hồng Kông.',
    { p: 'none', c: 'fairy-lights', b: ['skyline', 'sea'], ce: 'none', g: 'floral' },
    { f: '#374151', g: '#111827', a: '#d4af37', s: '#0f172a', c: '#9f1239', cu: '#fdf2f8', pe: '', sc: '#1e3a8a' }),
  V('tw_sky_lanterns', 'Thả Đèn Trời Bình Khê', 'Đài Loan', 'EAST_ASIA', 'night',
    'Hàng trăm đèn trời mang lời chúc của đôi uyên ương bay lên trên thung lũng núi.',
    { p: 'bamboo', c: 'sky-lanterns', b: ['mountains'], ce: 'none', g: 'lacquer' },
    { f: '#78716c', g: '#3f3f46', a: '#f59e0b', s: '#1c1917', c: '#b45309', cu: '#7c2d12', pe: '', sc: '#292524' }),
  V('mn_steppe', 'Thảo Nguyên Mông Cổ', 'Mông Cổ', 'EAST_ASIA', 'day',
    'Lều ger trắng giữa thảo nguyên xanh bất tận và dải khăn khadag xanh trao lời chúc phúc.',
    { p: 'gers', c: 'bunting', b: ['hills'], ce: 'none', g: 'floral' },
    { f: '#9cbf6b', g: '#86a95a', a: '#2563eb', s: '#bfdbfe', c: '#1d4ed8', cu: '#eff6ff', pe: '', ca: '#2563eb', ca2: '#facc15', sc: '#6b8e3d' }),

  /* ─────────────────────── Nam Á & Đông Nam Á ─────────────────────── */
  V('in_mandap', 'Mandap Hindu Ấn Độ', 'Ấn Độ', 'SOUTH_SOUTHEAST_ASIA', 'day',
    'Lễ cưới Hindu quanh ngọn lửa thiêng dưới mandap kết hoa vạn thọ, cô dâu sari đỏ và bảy bước thề nguyện.',
    { p: 'round-trees', c: 'garlands', b: [], ce: 'mandap', g: 'floral' },
    { f: '#fde68a', g: '#a3a35a', a: '#ea580c', s: '#fff7ed', c: '#b91c1c', cu: '#dc2626', pe: '#fb923c', ca: '#f97316', ca2: '#facc15' }),
  V('in_udaipur', 'Cung Điện Hồ Udaipur', 'Ấn Độ', 'SOUTH_SOUTHEAST_ASIA', 'sunset',
    'Cung điện trắng soi bóng mặt hồ Pichola, mái vòm và hàng cột chạm khắc của xứ Rajasthan.',
    { p: 'arches', c: 'drapes', b: ['lake'], ce: 'none', g: 'stone-arch' },
    { f: '#f5ebe0', g: '#d6c4a8', a: '#db2777', s: '#fbcfe8', c: '#be185d', cu: '#fdf2f8', pe: '#f9a8d4', k: '#fafaf9', ca: '#f472b6', ca2: '#f59e0b', sc: '#0e7490' }),
  V('in_kerala', 'Sông Nước Kerala', 'Ấn Độ', 'SOUTH_SOUTHEAST_ASIA', 'day',
    'Rặng dừa xanh, nhà thuyền trên kênh nước và cô dâu trong saree kasavu trắng viền vàng.',
    { p: 'palms', c: 'garlands', b: ['lake'], ce: 'mandap', g: 'palm-arch' },
    { f: '#e7dcc4', g: '#5f8a4a', a: '#ca8a04', s: '#dcfce7', c: '#fef3c7', cu: '#fffbeb', pe: '#ffffff', ca: '#ffffff', ca2: '#fbbf24', sc: '#155e75' }),
  V('pk_mehndi', 'Đêm Mehndi Pakistan', 'Pakistan', 'SOUTH_SOUTHEAST_ASIA', 'night',
    'Đêm vẽ henna rực rỡ dưới những tán vải nhiều màu, đèn lồng và tiếng trống dholki.',
    { p: 'torches', c: 'drapes', b: [], ce: 'none', g: 'floral' },
    { f: '#fde68a', g: '#365314', a: '#16a34a', s: '#1a2e05', c: '#ca8a04', cu: '#facc15', pe: '#facc15', ca: '#facc15', ca2: '#16a34a' }),
  V('lk_poruwa', 'Lễ Poruwa Sri Lanka', 'Sri Lanka', 'SOUTH_SOUTHEAST_ASIA', 'day',
    'Nghi lễ trên bục gỗ poruwa chạm khắc phủ hoa trắng, cùng tiếng trống của các vũ công Kandy.',
    { p: 'palms', c: 'garlands', b: ['hills'], ce: 'poruwa', g: 'floral' },
    { f: '#efe3c8', g: '#4d7c3a', a: '#ca8a04', s: '#ecfccb', c: '#fef3c7', cu: '#fffbeb', pe: '#ffffff', ca: '#ffffff', ca2: '#fde047', sc: '#3f6212' }),
  V('np_himalaya', 'Chân Núi Himalaya', 'Nepal', 'SOUTH_SOUTHEAST_ASIA', 'day',
    'Lễ cưới sắc đỏ truyền thống trên nền những đỉnh núi tuyết hùng vĩ của dãy Himalaya.',
    { p: 'pines', c: 'bunting', b: ['snow-peaks'], ce: 'none', g: 'floral' },
    { f: '#a8a29e', g: '#78716c', a: '#dc2626', s: '#dbeafe', c: '#b91c1c', cu: '#dc2626', pe: '', ca: '#dc2626', ca2: '#facc15', sc: '#64748b' }),
  V('th_sala', 'Đình Sala Thái Lan', 'Thái Lan', 'SOUTH_SOUTHEAST_ASIA', 'day',
    'Lễ rót nước rod nam sang trong đình sala mái nhọn, vòng hoa nhài và lụa Thái óng ánh.',
    { p: 'palms', c: 'garlands', b: ['hills'], ce: 'gazebo', g: 'floral' },
    { f: '#e7d3a8', g: '#5d8a45', a: '#ca8a04', s: '#fef9c3', c: '#7e22ce', cu: '#faf5ff', pe: '#ffffff', ca: '#ffffff', ca2: '#a855f7', sc: '#4d7c0f' }),
  V('id_bali', 'Cổng Đá Bali', 'Indonesia', 'SOUTH_SOUTHEAST_ASIA', 'day',
    'Cổng đá chẻ đôi candi bentar, hoa sứ trắng thơm và ruộng lúa bậc thang xanh mướt của Bali.',
    { p: 'palms', c: 'drapes', b: ['terraces'], ce: 'split-gate', g: 'stone-arch' },
    { f: '#d6cbb5', g: '#5f8f3e', a: '#ca8a04', s: '#ecfeff', c: '#fde68a', cu: '#fffbeb', pe: '#ffffff', ca: '#fefce8', ca2: '#facc15', sc: '#65a30d' }),
  V('id_java', 'Pendopo Java', 'Indonesia', 'SOUTH_SOUTHEAST_ASIA', 'day',
    'Mái pendopo gỗ chạm, sắc vải batik nâu vàng và nghi lễ cưới trang nghiêm của người Java.',
    { p: 'lacquer-pillars', c: 'drapes', b: [], ce: 'pelamin', g: 'lacquer' },
    { f: '#c9a77c', g: '#6b4f2e', a: '#a16207', s: '#fef3c7', c: '#78350f', cu: '#92400e', pe: '#fde68a', k: '#78350f', ca: '#92400e', ca2: '#ca8a04' }),
  V('my_pelamin', 'Ngai Cưới Pelamin Mã Lai', 'Malaysia', 'SOUTH_SOUTHEAST_ASIA', 'indoor',
    'Ngai cưới pelamin rực vàng cho nghi lễ bersanding, cùng những cây hoa bunga manggar lấp lánh.',
    { p: 'classic-pillars', c: 'drapes', b: ['walls'], ce: 'pelamin', g: 'floral' },
    { f: '#fef9ec', g: '#e7d8b5', a: '#ca8a04', s: '#fefce8', c: '#ca8a04', cu: '#fef3c7', pe: '#fde047', ca: '#fde68a', ca2: '#ffffff', sc: '#fef3c7' }),
  V('ph_tropical', 'Vườn Nhiệt Đới Philippines', 'Philippines', 'SOUTH_SOUTHEAST_ASIA', 'sunset',
    'Nghi thức choàng khăn và dây cord, đèn vỏ sò capiz và rặng tre nhiệt đới.',
    { p: 'bamboo', c: 'paper-lanterns', b: ['hills'], ce: 'floral-arch', g: 'bamboo' },
    { f: '#d9c7a1', g: '#5f8a45', a: '#e11d48', s: '#fed7aa', c: '#fef3c7', cu: '#fff7ed', pe: '#ffffff', ca: '#fffbeb', ca2: '#fef3c7', sc: '#4d7c0f' }),
  V('kh_temple_ruins', 'Đền Đá Cổ Campuchia', 'Campuchia', 'SOUTH_SOUTHEAST_ASIA', 'sunset',
    'Lễ cưới Khmer với nhiều nghi thức, sắc lụa vàng óng và bóng tháp đá cổ dưới hoàng hôn.',
    { p: 'palms', c: 'drapes', b: ['stupas'], ce: 'none', g: 'stone-arch' },
    { f: '#d6c3a0', g: '#7a6a4f', a: '#ca8a04', s: '#fdba74', c: '#ca8a04', cu: '#fef3c7', pe: '#fde047', ca: '#facc15', ca2: '#fef3c7', sc: '#78716c' }),
  V('la_baci', 'Lễ Baci Luang Prabang', 'Lào', 'SOUTH_SOUTHEAST_ASIA', 'day',
    'Lễ baci buộc chỉ cổ tay chúc phúc, mâm hoa phakhuan và mái chùa cong giữa núi rừng.',
    { p: 'palms', c: 'garlands', b: ['mountains'], ce: 'tea-table', g: 'lacquer' },
    { f: '#e5d4b0', g: '#5b7f3e', a: '#ca8a04', s: '#ecfccb', c: '#ffffff', cu: '#fef3c7', pe: '#ffffff', ca: '#ffffff', ca2: '#fbbf24', sc: '#3f6212' }),
  V('mm_bagan', 'Đồng Bằng Bagan', 'Myanmar', 'SOUTH_SOUTHEAST_ASIA', 'sunset',
    'Hàng nghìn ngôi tháp cổ dưới ánh bình minh và những khinh khí cầu bay trên đồng bằng.',
    { p: 'palms', c: 'balloons', b: ['stupas'], ce: 'none', g: 'stone-arch' },
    { f: '#d6b98a', g: '#a8865a', a: '#ea580c', s: '#fed7aa', c: '#ca8a04', cu: '#fff7ed', pe: '', sc: '#9a3412' }),
  V('sg_garden', 'Vườn Nhiệt Đới Singapore', 'Singapore', 'SOUTH_SOUTHEAST_ASIA', 'night',
    'Tiệc cưới giữa khu vườn nhiệt đới đô thị, lan rừng và đường chân trời hiện đại về đêm.',
    { p: 'palms', c: 'fairy-lights', b: ['skyline'], ce: 'floral-arch', g: 'floral' },
    { f: '#4d7c5f', g: '#14532d', a: '#a855f7', s: '#1e1b4b', c: '#a855f7', cu: '#faf5ff', pe: '', sc: '#312e81' }),

  /* ─────────────────────── Trung Đông & Châu Phi ─────────────────────── */
  V('ma_riad', 'Riad Ma-rốc', 'Ma-rốc', 'MIDDLE_EAST_AFRICA', 'night',
    'Sân riad lát gạch zellige, đèn lồng đồng chạm lỗ và vòm cửa hình móng ngựa quanh đài phun nước.',
    { p: 'arches', c: 'paper-lanterns', b: ['walls'], ce: 'fountain', g: 'stone-arch' },
    { f: '#e7d8c9', g: '#9a3412', a: '#0d9488', s: '#1c1917', c: '#9a3412', cu: '#fef3c7', pe: '', k: '#fde68a', ca: '#f59e0b', ca2: '#b45309', sc: '#c2410c' }),
  V('tr_cappadocia', 'Khinh Khí Cầu Cappadocia', 'Thổ Nhĩ Kỳ', 'MIDDLE_EAST_AFRICA', 'sunset',
    'Bình minh với hàng trăm khinh khí cầu bay trên thung lũng đá ống khói tiên.',
    { p: 'none', c: 'balloons', b: ['red-rocks'], ce: 'floral-arch', g: 'floral' },
    { f: '#e7cfae', g: '#c9a57a', a: '#e11d48', s: '#fecdd3', c: '#fef3c7', cu: '#fff1f2', pe: '', sc: '#d6a77a' }),
  V('ae_desert', 'Lều Bedouin Sa Mạc', 'UAE', 'MIDDLE_EAST_AFRICA', 'night',
    'Tiệc dưới lều Bedouin giữa đồi cát vàng, thảm dệt và đèn lồng ấm áp dưới trời sao.',
    { p: 'torches', c: 'drapes', b: ['dunes'], ce: 'none', g: 'stone-arch' },
    { f: '#e8c99a', g: '#d6b07a', a: '#b45309', s: '#1c1917', c: '#7f1d1d', cu: '#fef3c7', pe: '', ca: '#fef3c7', ca2: '#d6b07a', sc: '#c99a5b' }),
  V('eg_nile', 'Bờ Sông Nile', 'Ai Cập', 'MIDDLE_EAST_AFRICA', 'sunset',
    'Thuyền buồm felucca và hàng chà là bên sông Nile, đêm zaffa rộn ràng tiếng trống kèn.',
    { p: 'palms', c: 'paper-lanterns', b: ['lake', 'dunes'], ce: 'none', g: 'stone-arch' },
    { f: '#e5cfa5', g: '#c8a978', a: '#0e7490', s: '#fdba74', c: '#0e7490', cu: '#fef3c7', pe: '', ca: '#f59e0b', ca2: '#0ea5e9', sc: '#0e7490' }),
  V('jo_wadi_rum', 'Sa Mạc Wadi Rum', 'Jordan', 'MIDDLE_EAST_AFRICA', 'night',
    'Vách sa thạch đỏ hồng và lều trại dưới bầu trời đầy sao của sa mạc Wadi Rum.',
    { p: 'torches', c: 'stars', b: ['red-rocks', 'dunes'], ce: 'none', g: 'stone-arch' },
    { f: '#d9a27a', g: '#b9734a', a: '#f59e0b', s: '#0c0a09', c: '#7c2d12', cu: '#fef3c7', pe: '', sc: '#9a3412' }),
  V('ir_persian_garden', 'Vườn Ba Tư', 'Iran', 'MIDDLE_EAST_AFRICA', 'day',
    'Khu vườn chahar bagh với kênh nước, hàng bách thẳng tắp và khăn sofreh aghd trải bàn lễ.',
    { p: 'cypress', c: 'fairy-lights', b: ['walls'], ce: 'fountain', g: 'stone-arch' },
    { f: '#d6d3c4', g: '#4d7c5f', a: '#0891b2', s: '#ecfeff', c: '#0e7490', cu: '#f0fdfa', pe: '#ffffff', sc: '#d6c4a8' }),
  V('il_chuppah', 'Chuppah Jerusalem', 'Israel', 'MIDDLE_EAST_AFRICA', 'sunset',
    'Lễ cưới Do Thái dưới chuppah bốn cột trên nền đá Jerusalem vàng nhạt, khép lại bằng tiếng ly vỡ chúc mừng.',
    { p: 'round-trees', c: 'fairy-lights', b: ['old-town'], ce: 'chuppah', g: 'stone-arch' },
    { f: '#e7dcc4', g: '#c9b28a', a: '#1d4ed8', s: '#fed7aa', c: '#f5f5f4', cu: '#fafaf9', pe: '#ffffff', k: '#7d8b6a', sc: '#e5d3ae' }),
  V('lb_cedar', 'Rừng Tuyết Tùng Lebanon', 'Lebanon', 'MIDDLE_EAST_AFRICA', 'day',
    'Đoàn zaffe náo nhiệt rước dâu bên rừng tuyết tùng và vườn ô liu vùng núi Lebanon.',
    { p: 'pines', c: 'fairy-lights', b: ['mountains'], ce: 'none', g: 'stone-arch' },
    { f: '#c9c0a8', g: '#6b7f4e', a: '#16a34a', s: '#e0f2fe', c: '#dc2626', cu: '#fef2f2', pe: '#ffffff', k: '#14532d', sc: '#64748b' }),
  V('ke_savanna', 'Thảo Nguyên Kenya', 'Kenya', 'MIDDLE_EAST_AFRICA', 'sunset',
    'Hoàng hôn trên đồng cỏ savanna với cây keo dù và những chuỗi vòng cườm rực rỡ.',
    { p: 'acacia', c: 'fairy-lights', b: ['hills'], ce: 'none', g: 'floral' },
    { f: '#d9b77a', g: '#b9955a', a: '#dc2626', s: '#fdba74', c: '#b91c1c', cu: '#fef2f2', pe: '', sc: '#a07a45' }),
  V('za_winelands', 'Vườn Nho Nam Phi', 'Nam Phi', 'MIDDLE_EAST_AFRICA', 'day',
    'Trang trại nho Cape Winelands, nhà trắng mái đầu hồi kiểu Cape Dutch và núi đá phía xa.',
    { p: 'hedges', c: 'fairy-lights', b: ['mountains', 'fields'], ce: 'none', g: 'floral' },
    { f: '#b8c48a', g: '#6b8a45', a: '#7e22ce', s: '#e0f2fe', c: '#f5f5f4', cu: '#ffffff', pe: '#ffffff', sc: '#4d7c0f' }),
  V('ng_yoruba', 'Lễ Cưới Yoruba Nigeria', 'Nigeria', 'MIDDLE_EAST_AFRICA', 'indoor',
    'Sắc vải aso-oke rực rỡ, khăn đội gele cầu kỳ và nhịp trống talking drum rộn ràng.',
    { p: 'classic-pillars', c: 'drapes', b: ['walls'], ce: 'floral-arch', g: 'floral' },
    { f: '#fef3c7', g: '#78350f', a: '#7e22ce', s: '#fdf4ff', c: '#7e22ce', cu: '#facc15', pe: '#facc15', ca: '#a855f7', ca2: '#facc15', sc: '#581c87' }),
  V('gh_kente', 'Lễ Cưới Kente Ghana', 'Ghana', 'MIDDLE_EAST_AFRICA', 'day',
    'Vải kente dệt vàng-xanh-đỏ và nghi thức gõ cửa xin dâu truyền thống của người Ghana.',
    { p: 'palms', c: 'bunting', b: ['hills'], ce: 'none', g: 'floral' },
    { f: '#e9d29a', g: '#6b8a3a', a: '#16a34a', s: '#fef9c3', c: '#ca8a04', cu: '#facc15', pe: '', ca: '#facc15', ca2: '#16a34a', sc: '#4d7c0f' }),
  V('et_highlands', 'Cao Nguyên Ethiopia', 'Ethiopia', 'MIDDLE_EAST_AFRICA', 'day',
    'Váy habesha kemis trắng viền thêu và khung cảnh cao nguyên xanh trập trùng.',
    { p: 'round-trees', c: 'drapes', b: ['mountains'], ce: 'none', g: 'floral' },
    { f: '#c7c08a', g: '#5f7a3a', a: '#16a34a', s: '#e0f2fe', c: '#fafaf9', cu: '#ffffff', pe: '#ffffff', ca: '#ffffff', ca2: '#16a34a', sc: '#4d7c0f' }),
  V('tz_zanzibar', 'Bãi Biển Zanzibar', 'Tanzania', 'MIDDLE_EAST_AFRICA', 'sunset',
    'Cát trắng Ấn Độ Dương, thuyền buồm dhow và những cánh cửa gỗ chạm kiểu Swahili.',
    { p: 'palms', c: 'drapes', b: ['sea'], ce: 'floral-arch', g: 'palm-arch' },
    { f: '#f5ead2', g: '#eadbb8', a: '#0d9488', s: '#fecaca', c: '#ffffff', cu: '#ffffff', pe: '#ffffff', ca: '#ffffff', ca2: '#e7e5e4', sc: '#14b8a6' }),
  V('mg_baobab', 'Đại Lộ Baobab Madagascar', 'Madagascar', 'MIDDLE_EAST_AFRICA', 'sunset',
    'Những cây baobab khổng lồ đứng lặng dưới bầu trời hoàng hôn đỏ rực.',
    { p: 'baobab', c: 'fairy-lights', b: ['hills'], ce: 'none', g: 'floral' },
    { f: '#d6a77a', g: '#b9875a', a: '#ea580c', s: '#fb923c', c: '#9a3412', cu: '#fff7ed', pe: '', sc: '#9a3412' }),
  V('tn_sidi_bou_said', 'Làng Xanh Trắng Tunisia', 'Tunisia', 'MIDDLE_EAST_AFRICA', 'day',
    'Làng tường trắng cửa xanh lam nhìn ra Địa Trung Hải, hoa giấy hồng leo kín tường.',
    { p: 'arches', c: 'fairy-lights', b: ['sea', 'old-town'], ce: 'none', g: 'stone-arch' },
    { f: '#f8fafc', g: '#e2e8f0', a: '#1d4ed8', s: '#dbeafe', c: '#1d4ed8', cu: '#eff6ff', pe: '#f9a8d4', k: '#ffffff', k2: '#1d4ed8', sc: '#f8fafc' }),

  /* ───────────────────────────── Châu Âu ───────────────────────────── */
  V('it_tuscany', 'Biệt Thự Tuscany', 'Ý', 'EUROPE', 'sunset',
    'Đồi nho, hàng bách thẳng tắp và bàn tiệc dài dưới nắng chiều vàng của nước Ý.',
    { p: 'cypress', c: 'fairy-lights', b: ['hills', 'fields'], ce: 'none', g: 'stone-arch' },
    { f: '#d6c39a', g: '#8a9a5b', a: '#b45309', s: '#fed7aa', c: '#f5f5f4', cu: '#fff7ed', pe: '', sc: '#84a35a' }),
  V('it_amalfi', 'Bờ Biển Amalfi', 'Ý', 'EUROPE', 'day',
    'Sân thượng hoa giấy và vườn chanh vàng nhìn xuống làn nước xanh ngắt của biển Ý.',
    { p: 'round-trees', c: 'bunting', b: ['sea', 'old-town'], ce: 'floral-arch', g: 'stone-arch' },
    { f: '#f1e4c8', g: '#c9b28a', a: '#eab308', s: '#bae6fd', c: '#fef9c3', cu: '#fefce8', pe: '#fde047', k: '#4d7c0f', ca: '#facc15', ca2: '#2563eb', sc: '#fde68a' }),
  V('it_venice', 'Venezia', 'Ý', 'EUROPE', 'night',
    'Kênh đào, cầu đá và quảng trường cổ của thành phố trên mặt nước dưới ánh đèn đêm.',
    { p: 'classic-pillars', c: 'chandeliers', b: ['old-town', 'lake'], ce: 'none', g: 'stone-arch' },
    { f: '#d6cbb5', g: '#0f4c5c', a: '#d4af37', s: '#1e1b4b', c: '#9f1239', cu: '#fdf2f8', pe: '', sc: '#f59e0b' }),
  V('gr_santorini', 'Santorini Hy Lạp', 'Hy Lạp', 'EUROPE', 'sunset',
    'Nhà trắng mái vòm xanh, biển Aegean và nghi thức đội vương miện stefana của lễ cưới Hy Lạp.',
    { p: 'arches', c: 'fairy-lights', b: ['sea', 'old-town'], ce: 'floral-arch', g: 'stone-arch' },
    { f: '#f8fafc', g: '#e2e8f0', a: '#1d4ed8', s: '#fbcfe8', c: '#1e40af', cu: '#eff6ff', pe: '#ffffff', k: '#ffffff', k2: '#1d4ed8', sc: '#f8fafc' }),
  V('fr_provence', 'Cánh Đồng Oải Hương Provence', 'Pháp', 'EUROPE', 'day',
    'Đồng oải hương tím ngát, nhà đá mộc mạc và bàn tiệc dài của miền Nam nước Pháp.',
    { p: 'round-trees', c: 'fairy-lights', b: ['fields', 'hills'], ce: 'none', g: 'floral' },
    { f: '#d9cfa8', g: '#8a9a5b', a: '#7c3aed', s: '#ede9fe', c: '#a78bfa', cu: '#f5f3ff', pe: '#c4b5fd', k: '#7d8b6a', sc: '#8b5cf6' }),
  V('fr_chateau', 'Lâu Đài Pháp', 'Pháp', 'EUROPE', 'day',
    'Lâu đài cổ, khu vườn cắt tỉa đối xứng, đài phun nước và tháp champagne lấp lánh.',
    { p: 'hedges', c: 'fairy-lights', b: ['castle'], ce: 'fountain', g: 'stone-arch' },
    { f: '#e7e2d3', g: '#5f7a4a', a: '#d4af37', s: '#e0f2fe', c: '#f5f5f4', cu: '#ffffff', pe: '#ffffff', sc: '#d6d3d1' }),
  V('fr_paris', 'Paris Lãng Mạn', 'Pháp', 'EUROPE', 'night',
    'Ban công sắt uốn, hàng cây và ánh đèn thành phố lung linh bên dòng sông Seine.',
    { p: 'round-trees', c: 'fairy-lights', b: ['old-town', 'skyline'], ce: 'none', g: 'floral' },
    { f: '#a8a29e', g: '#44403c', a: '#e11d48', s: '#1e1b4b', c: '#9f1239', cu: '#fff1f2', pe: '', k: '#166534', sc: '#d6d3d1' }),
  V('es_andalusia', 'Patio Andalusia', 'Tây Ban Nha', 'EUROPE', 'sunset',
    'Sân patio gạch men, vòm Moorish, hàng cây cam và tiếng đàn flamenco trong đêm hè.',
    { p: 'arches', c: 'paper-lanterns', b: ['walls'], ce: 'fountain', g: 'stone-arch' },
    { f: '#e7cfa8', g: '#b45309', a: '#dc2626', s: '#fed7aa', c: '#b91c1c', cu: '#fef2f2', pe: '', k: '#fef3c7', ca: '#f97316', ca2: '#fde047', sc: '#f5e1c0' }),
  V('pt_lisbon', 'Lisbon Gạch Azulejo', 'Bồ Đào Nha', 'EUROPE', 'day',
    'Tường gạch azulejo xanh trắng, dây đèn mắc ngang phố dốc nhìn ra sông Tagus.',
    { p: 'round-trees', c: 'fairy-lights', b: ['old-town', 'lake'], ce: 'none', g: 'stone-arch' },
    { f: '#e5e7eb', g: '#9ca3af', a: '#1d4ed8', s: '#dbeafe', c: '#1d4ed8', cu: '#eff6ff', pe: '', k: '#4d7c0f', sc: '#93c5fd' }),
  V('uk_garden', 'Vườn Nước Anh', 'Anh', 'EUROPE', 'day',
    'Lều marquee trắng giữa vườn hồng, hàng rào cắt tỉa và bàn trà chiều kiểu Anh.',
    { p: 'hedges', c: 'drapes', b: ['hills'], ce: 'floral-arch', g: 'floral' },
    { f: '#9cbf7a', g: '#6b8f4e', a: '#e11d48', s: '#e0f2fe', c: '#fafaf9', cu: '#ffffff', pe: '#fda4af', ca: '#ffffff', ca2: '#f5f5f4', sc: '#65a30d' }),
  V('sc_highlands', 'Lâu Đài Cao Nguyên Scotland', 'Scotland', 'EUROPE', 'day',
    'Nghi thức buộc tay handfasting bằng dải vải tartan trong lâu đài đá giữa cao nguyên.',
    { p: 'pines', c: 'fairy-lights', b: ['castle', 'mountains'], ce: 'none', g: 'stone-arch' },
    { f: '#8a9a7a', g: '#5f6f4e', a: '#15803d', s: '#e2e8f0', c: '#991b1b', cu: '#14532d', pe: '', k: '#14532d', sc: '#78716c' }),
  V('ie_celtic', 'Vòng Đá Ireland', 'Ireland', 'EUROPE', 'day',
    'Đồi xanh ngút ngàn, vòng đá cổ và nghi thức handfasting của người Celtic.',
    { p: 'none', c: 'none', b: ['hills'], ce: 'stone-circle', g: 'stone-arch' },
    { f: '#7fb26a', g: '#5f9a4e', a: '#16a34a', s: '#dcfce7', c: '#f5f5f4', cu: '#f0fdf4', pe: '#ffffff', sc: '#4d7c0f' }),
  V('no_fjord', 'Vịnh Hẹp Na Uy', 'Na Uy', 'EUROPE', 'day',
    'Vách núi dựng đứng soi bóng xuống fjord xanh thẳm và những nhà gỗ mái cỏ.',
    { p: 'pines', c: 'fairy-lights', b: ['lake', 'mountains'], ce: 'none', g: 'floral' },
    { f: '#9aaa8a', g: '#5f6f4e', a: '#1d4ed8', s: '#dbeafe', c: '#f5f5f4', cu: '#eff6ff', pe: '', k: '#14532d', sc: '#475569' }),
  V('se_midsummer', 'Lễ Hội Giữa Hè Thụy Điển', 'Thụy Điển', 'EUROPE', 'day',
    'Rừng bạch dương, vòng hoa đội đầu và cột hoa midsommarstång giữa đồng cỏ mùa hè.',
    { p: 'birches', c: 'bunting', b: ['forest'], ce: 'maypole', g: 'floral' },
    { f: '#a3c27a', g: '#7fa35a', a: '#facc15', s: '#e0f2fe', c: '#fef9c3', cu: '#eff6ff', pe: '#fde047', ca: '#2563eb', ca2: '#facc15', sc: '#3f6212' }),
  V('fi_lapland', 'Bắc Cực Quang Lapland', 'Phần Lan', 'EUROPE', 'night',
    'Lễ cưới trên tuyết dưới dải cực quang xanh lục và rừng thông phủ trắng tuyết.',
    { p: 'pines', c: 'aurora', b: ['snow-peaks'], ce: 'none', g: 'floral' },
    { f: '#f1f5f9', g: '#e2e8f0', a: '#10b981', s: '#020617', c: '#dbeafe', cu: '#f0fdfa', pe: '#ffffff', k: '#1e3a2f', sc: '#94a3b8' }),
  V('is_black_sand', 'Bãi Cát Đen Iceland', 'Iceland', 'EUROPE', 'day',
    'Bãi cát núi lửa đen, sóng bạc đầu và vách đá bazan hùng vĩ.',
    { p: 'none', c: 'none', b: ['sea', 'red-rocks'], ce: 'floral-arch', g: 'stone-arch' },
    { f: '#3f3f46', g: '#27272a', a: '#e5e7eb', s: '#cbd5e1', c: '#f5f5f4', cu: '#fafafa', pe: '', sc: '#27272a' }),
  V('ru_birch', 'Rừng Bạch Dương Nga', 'Nga', 'EUROPE', 'sunset',
    'Lễ cưới mùa thu giữa rừng bạch dương vàng óng và ổ bánh karavai chúc phúc.',
    { p: 'birches', c: 'fairy-lights', b: ['forest'], ce: 'none', g: 'floral' },
    { f: '#c9a86a', g: '#a8864a', a: '#dc2626', s: '#fed7aa', c: '#b91c1c', cu: '#fef2f2', pe: '#facc15', k: '#facc15', sc: '#ca8a04' }),
  V('at_alps', 'Nhà Gỗ Núi Alps', 'Áo', 'EUROPE', 'day',
    'Nhà gỗ chalet, đồng cỏ hoa dại và những đỉnh núi tuyết trắng phía xa.',
    { p: 'pines', c: 'bunting', b: ['snow-peaks'], ce: 'none', g: 'floral' },
    { f: '#9cc27a', g: '#78a35a', a: '#dc2626', s: '#dbeafe', c: '#b91c1c', cu: '#fef2f2', pe: '#ffffff', ca: '#dc2626', ca2: '#ffffff', sc: '#64748b' }),
  V('ch_lake', 'Hồ Núi Thụy Sĩ', 'Thụy Sĩ', 'EUROPE', 'day',
    'Mặt hồ phẳng lặng như gương soi bóng những dãy núi Alps hùng vĩ.',
    { p: 'pines', c: 'fairy-lights', b: ['lake', 'snow-peaks'], ce: 'gazebo', g: 'floral' },
    { f: '#a8c08a', g: '#6b8a4e', a: '#dc2626', s: '#e0f2fe', c: '#f5f5f4', cu: '#ffffff', pe: '', k: '#14532d', sc: '#64748b' }),
  V('de_bavaria', 'Lâu Đài Bavaria', 'Đức', 'EUROPE', 'day',
    'Lâu đài cổ tích trên đồi, rừng thông bao quanh và biergarten rộn ràng.',
    { p: 'round-trees', c: 'bunting', b: ['castle', 'forest'], ce: 'none', g: 'stone-arch' },
    { f: '#b8c48a', g: '#6b8a45', a: '#2563eb', s: '#dbeafe', c: '#1d4ed8', cu: '#eff6ff', pe: '', ca: '#2563eb', ca2: '#ffffff', sc: '#e7e5e4' }),
  V('nl_tulips', 'Cánh Đồng Tulip Hà Lan', 'Hà Lan', 'EUROPE', 'day',
    'Những dải tulip đủ màu trải dài tới chân trời và cối xay gió quay chậm.',
    { p: 'none', c: 'none', b: ['fields'], ce: 'windmill', g: 'floral' },
    { f: '#9cc27a', g: '#78a35a', a: '#ef4444', s: '#e0f2fe', c: '#f5f5f4', cu: '#fff1f2', pe: '#fca5a5', sc: '#ef4444' }),
  V('hr_dubrovnik', 'Thành Cổ Dubrovnik', 'Croatia', 'EUROPE', 'sunset',
    'Tường thành đá ven biển Adriatic và những mái ngói đỏ cam của thành phố cổ.',
    { p: 'none', c: 'fairy-lights', b: ['sea', 'old-town'], ce: 'none', g: 'stone-arch' },
    { f: '#d6cbb5', g: '#a8a29e', a: '#ea580c', s: '#fed7aa', c: '#c2410c', cu: '#fff7ed', pe: '', sc: '#fde68a' }),
  V('cz_prague', 'Lâu Đài Praha', 'Séc', 'EUROPE', 'night',
    'Cầu đá cổ, mái nhà đỏ và tòa lâu đài sáng đèn bên dòng sông Vltava.',
    { p: 'classic-pillars', c: 'fairy-lights', b: ['castle', 'old-town'], ce: 'none', g: 'stone-arch' },
    { f: '#a8a29e', g: '#44403c', a: '#d4af37', s: '#1e1b4b', c: '#991b1b', cu: '#fef2f2', pe: '', sc: '#fde68a' }),
  V('hu_budapest', 'Bờ Sông Danube Budapest', 'Hungary', 'EUROPE', 'night',
    'Ánh đèn vàng trên dòng Danube, những tòa nhà cổ và cây cầu xích lung linh.',
    { p: 'classic-pillars', c: 'chandeliers', b: ['skyline', 'lake'], ce: 'none', g: 'stone-arch' },
    { f: '#d6cbb5', g: '#1c1917', a: '#d4af37', s: '#0f172a', c: '#7f1d1d', cu: '#fef3c7', pe: '', sc: '#f59e0b' }),

  /* ───────────────────────────── Châu Mỹ ───────────────────────────── */
  V('us_barn', 'Nông Trại Gỗ Mỹ', 'Hoa Kỳ', 'AMERICAS', 'sunset',
    'Nhà kho gỗ đỏ, kiện rơm, dây đèn và hoa dại của vùng nông thôn nước Mỹ.',
    { p: 'round-trees', c: 'fairy-lights', b: ['hills', 'fields'], ce: 'barn', g: 'floral' },
    { f: '#b9a77a', g: '#8a9a5b', a: '#b91c1c', s: '#fed7aa', c: '#f5f5f4', cu: '#fef3c7', pe: '', sc: '#ca8a04' }),
  V('us_vegas', 'Nhà Nguyện Las Vegas', 'Hoa Kỳ', 'AMERICAS', 'night',
    'Nhà nguyện cưới rực đèn neon giữa sa mạc Nevada, lễ cưới nhanh và vui nhộn.',
    { p: 'palms', c: 'fairy-lights', b: ['skyline', 'dunes'], ce: 'floral-arch', g: 'floral' },
    { f: '#4c1d95', g: '#1e1b4b', a: '#ec4899', s: '#0f0a1e', c: '#db2777', cu: '#fdf2f8', pe: '', sc: '#7e22ce' }),
  V('us_nyc_rooftop', 'Sân Thượng New York', 'Hoa Kỳ', 'AMERICAS', 'night',
    'Sân thượng nhìn ra những tòa nhà chọc trời và biển ánh đèn Manhattan.',
    { p: 'round-trees', c: 'fairy-lights', b: ['skyline'], ce: 'none', g: 'floral' },
    { f: '#57534e', g: '#1c1917', a: '#d4af37', s: '#0f172a', c: '#f5f5f4', cu: '#fafaf9', pe: '', k: '#15803d', sc: '#1e293b' }),
  V('us_napa', 'Thung Lũng Rượu Vang California', 'Hoa Kỳ', 'AMERICAS', 'sunset',
    'Vườn nho Napa nắng vàng, cây sồi cổ thụ và bàn tiệc dài mộc mạc.',
    { p: 'round-trees', c: 'fairy-lights', b: ['hills', 'fields'], ce: 'none', g: 'floral' },
    { f: '#c9b88a', g: '#8a9a5b', a: '#7e22ce', s: '#fed7aa', c: '#f5f5f4', cu: '#faf5ff', pe: '', k: '#4d7c0f', sc: '#65a30d' }),
  V('mx_hacienda', 'Hacienda Mexico', 'Mexico', 'AMERICAS', 'sunset',
    'Sân hacienda tường cam, cờ giấy papel picado nhiều màu và hoa giấy bougainvillea.',
    { p: 'arches', c: 'bunting', b: ['walls'], ce: 'fountain', g: 'stone-arch' },
    { f: '#e7c9a0', g: '#c2410c', a: '#db2777', s: '#fed7aa', c: '#db2777', cu: '#fdf2f8', pe: '#f472b6', k: '#fdba74', ca: '#ec4899', ca2: '#22c55e', sc: '#ea580c' }),
  V('mx_tulum', 'Bãi Biển Tulum', 'Mexico', 'AMERICAS', 'day',
    'Biển Caribe xanh ngọc, cổng gỗ kết hoa khô và rặng dừa trên bờ cát trắng.',
    { p: 'palms', c: 'none', b: ['sea'], ce: 'floral-arch', g: 'palm-arch' },
    { f: '#f5ead2', g: '#eadbb8', a: '#a16207', s: '#ccfbf1', c: '#fef3c7', cu: '#fffbeb', pe: '', sc: '#14b8a6' }),
  V('gt_atitlan', 'Hồ Atitlán Guatemala', 'Guatemala', 'AMERICAS', 'day',
    'Mặt hồ xanh giữa ba ngọn núi lửa và những tấm vải dệt Maya rực rỡ sắc màu.',
    { p: 'round-trees', c: 'bunting', b: ['lake', 'mountains'], ce: 'none', g: 'floral' },
    { f: '#a8c08a', g: '#6b8a4e', a: '#db2777', s: '#e0f2fe', c: '#7e22ce', cu: '#fdf2f8', pe: '', ca: '#ec4899', ca2: '#0ea5e9', sc: '#475569' }),
  V('pe_andes', 'Núi Andes Peru', 'Peru', 'AMERICAS', 'day',
    'Ruộng bậc thang Inca trên núi cao, khăn dệt sắc màu và đàn lạc đà alpaca.',
    { p: 'none', c: 'bunting', b: ['terraces', 'mountains'], ce: 'none', g: 'stone-arch' },
    { f: '#a8b07a', g: '#7a8a5a', a: '#dc2626', s: '#dbeafe', c: '#b91c1c', cu: '#fef2f2', pe: '', ca: '#dc2626', ca2: '#facc15', sc: '#65a30d' }),
  V('br_rio', 'Bãi Biển Rio de Janeiro', 'Brazil', 'AMERICAS', 'sunset',
    'Bãi cát Copacabana, núi đá bên vịnh và tiệc cưới rộn ràng điệu samba.',
    { p: 'palms', c: 'fairy-lights', b: ['sea', 'mountains'], ce: 'none', g: 'palm-arch' },
    { f: '#f3e3c3', g: '#e9d3a6', a: '#16a34a', s: '#fdba74', c: '#facc15', cu: '#fefce8', pe: '', sc: '#0ea5e9' }),
  V('ar_patagonia', 'Patagonia Argentina', 'Argentina', 'AMERICAS', 'day',
    'Hồ băng xanh ngắt, đỉnh núi lởm chởm và lửa trại asado ấm cúng.',
    { p: 'pines', c: 'none', b: ['lake', 'snow-peaks'], ce: 'none', g: 'stone-arch' },
    { f: '#a8a87a', g: '#7a7a5a', a: '#0ea5e9', s: '#e0f2fe', c: '#f5f5f4', cu: '#f0f9ff', pe: '', k: '#14532d', sc: '#64748b' }),
  V('ar_tango', 'Đêm Tango Buenos Aires', 'Argentina', 'AMERICAS', 'indoor',
    'Phòng khiêu vũ milonga với sàn gỗ bóng, đèn vàng và điệu tango đầu tiên của đôi uyên ương.',
    { p: 'classic-pillars', c: 'chandeliers', b: ['walls'], ce: 'none', g: 'floral' },
    { f: '#7c4a2a', g: '#3f2a1a', a: '#b91c1c', s: '#1c1917', c: '#7f1d1d', cu: '#991b1b', pe: '', sc: '#450a0a' }),
  V('cl_atacama', 'Sa Mạc Atacama', 'Chile', 'AMERICAS', 'night',
    'Sa mạc đất đỏ dưới bầu trời đầy sao, nơi nổi tiếng ngắm sao bậc nhất thế giới.',
    { p: 'torches', c: 'stars', b: ['dunes', 'red-rocks'], ce: 'none', g: 'stone-arch' },
    { f: '#c98a5a', g: '#9a5a3a', a: '#f59e0b', s: '#020617', c: '#7c2d12', cu: '#fef3c7', pe: '', sc: '#7c2d12' }),
  V('cu_havana', 'Phố Cổ Havana', 'Cuba', 'AMERICAS', 'sunset',
    'Mặt tiền nhiều màu, xe cổ và điệu salsa trên những con phố của Havana.',
    { p: 'palms', c: 'bunting', b: ['old-town'], ce: 'none', g: 'floral' },
    { f: '#d6cbb5', g: '#a8a29e', a: '#0ea5e9', s: '#fed7aa', c: '#f97316', cu: '#fff7ed', pe: '', ca: '#f97316', ca2: '#0ea5e9', sc: '#f472b6' }),
  V('jm_caribbean', 'Biển Caribe Jamaica', 'Jamaica', 'AMERICAS', 'sunset',
    'Bờ biển nhiệt đới, nhạc reggae và bánh cưới trái cây black cake truyền thống.',
    { p: 'palms', c: 'fairy-lights', b: ['sea'], ce: 'gazebo', g: 'palm-arch' },
    { f: '#f3e3c3', g: '#e9d3a6', a: '#16a34a', s: '#fdba74', c: '#facc15', cu: '#fefce8', pe: '', sc: '#06b6d4' }),
  V('ca_rockies', 'Hồ Núi Rockies Canada', 'Canada', 'AMERICAS', 'day',
    'Hồ nước ngọc lam dưới chân những dãy núi tuyết vùng Banff.',
    { p: 'pines', c: 'fairy-lights', b: ['lake', 'snow-peaks'], ce: 'none', g: 'floral' },
    { f: '#a8b88a', g: '#5f7a4e', a: '#06b6d4', s: '#e0f2fe', c: '#f5f5f4', cu: '#ecfeff', pe: '', k: '#14532d', sc: '#475569' }),
  V('ca_maple', 'Rừng Phong Mùa Thu Canada', 'Canada', 'AMERICAS', 'sunset',
    'Lá phong đỏ vàng rực rỡ phủ kín khu rừng và nhà gỗ ven hồ.',
    { p: 'blossom-trees', c: 'fairy-lights', b: ['forest', 'lake'], ce: 'none', g: 'floral' },
    { f: '#b9a06a', g: '#8a6a3a', a: '#dc2626', s: '#fed7aa', c: '#b91c1c', cu: '#fff7ed', pe: '#f97316', k: '#ea580c', sc: '#c2410c' }),

  /* ───────────────────────────── Châu Đại Dương ───────────────────────────── */
  V('us_hawaii', 'Bãi Biển Hawaii', 'Hawaii', 'OCEANIA', 'sunset',
    'Vòng hoa lei, tiếng đàn ukulele và hoàng hôn trên biển Thái Bình Dương.',
    { p: 'torches', c: 'none', b: ['sea', 'mountains'], ce: 'floral-arch', g: 'palm-arch' },
    { f: '#f3e3c3', g: '#e9d3a6', a: '#e11d48', s: '#fdba74', c: '#fef3c7', cu: '#fff1f2', pe: '#fda4af', sc: '#0ea5e9' }),
  V('pf_bora_bora', 'Nhà Sàn Trên Biển Bora Bora', 'Polynesia thuộc Pháp', 'OCEANIA', 'day',
    'Nhà sàn trên mặt nước xanh ngọc và ngọn núi Otemanu sừng sững giữa đảo.',
    { p: 'palms', c: 'none', b: ['sea', 'karst'], ce: 'gazebo', g: 'palm-arch' },
    { f: '#c9a77c', g: '#5eead4', a: '#0d9488', s: '#ccfbf1', c: '#fef3c7', cu: '#f0fdfa', pe: '#ffffff', sc: '#14b8a6' }),
  V('fj_island', 'Đảo Fiji', 'Fiji', 'OCEANIA', 'day',
    'Bãi cát trắng, nước trong như pha lê và lời chào "Bula" thân thiện của người Fiji.',
    { p: 'palms', c: 'garlands', b: ['sea'], ce: 'floral-arch', g: 'palm-arch' },
    { f: '#f5ead2', g: '#eadbb8', a: '#0ea5e9', s: '#e0f2fe', c: '#ffffff', cu: '#f0f9ff', pe: '#ffffff', ca: '#f472b6', ca2: '#ffffff', sc: '#06b6d4' }),
  V('nz_hills', 'Đồi Xanh New Zealand', 'New Zealand', 'OCEANIA', 'day',
    'Những ngọn đồi cỏ xanh mướt, hồ nước trong và núi tuyết của New Zealand.',
    { p: 'round-trees', c: 'fairy-lights', b: ['hills', 'snow-peaks'], ce: 'none', g: 'floral' },
    { f: '#8fbf6a', g: '#6ba34e', a: '#16a34a', s: '#e0f2fe', c: '#f5f5f4', cu: '#f0fdf4', pe: '', sc: '#4d7c0f' }),
  V('au_outback', 'Vùng Outback Úc', 'Úc', 'OCEANIA', 'night',
    'Đất đỏ, bầu trời sao rộng mở và những cây bạch đàn của vùng nội địa nước Úc.',
    { p: 'round-trees', c: 'stars', b: ['red-rocks'], ce: 'none', g: 'stone-arch' },
    { f: '#c97a4a', g: '#9a4a2a', a: '#f59e0b', s: '#020617', c: '#7c2d12', cu: '#fff7ed', pe: '', k: '#7d9a7a', sc: '#9a3412' }),
  V('au_sydney', 'Cảng Sydney', 'Úc', 'OCEANIA', 'night',
    'Tiệc cưới bên bến cảng nhìn ra cây cầu thép và đường chân trời thành phố.',
    { p: 'none', c: 'fairy-lights', b: ['skyline', 'sea'], ce: 'none', g: 'floral' },
    { f: '#57534e', g: '#1c1917', a: '#0ea5e9', s: '#0f172a', c: '#f5f5f4', cu: '#f0f9ff', pe: '', sc: '#1e3a8a' }),
  V('ws_fale', 'Nhà Fale Samoa', 'Samoa', 'OCEANIA', 'day',
    'Mái nhà fale lợp lá, vải tapa hoa văn và điệu múa siva mừng đôi uyên ương.',
    { p: 'palms', c: 'garlands', b: ['sea'], ce: 'gazebo', g: 'palm-arch' },
    { f: '#d6c3a0', g: '#5f8a45', a: '#92400e', s: '#ecfeff', c: '#78350f', cu: '#fef3c7', pe: '#ffffff', ca: '#f472b6', ca2: '#facc15', sc: '#06b6d4' }),
];

export const DEFAULT_VENUE_ID = 'luxury_ballroom';

const VENUES_BY_ID = new Map(VENUE_THEMES.map((v) => [v.id, v]));

export function getVenueTheme(id: string | null | undefined): VenueTheme {
  return VENUES_BY_ID.get(id ?? '') ?? VENUES_BY_ID.get(DEFAULT_VENUE_ID)!;
}

export function isVenueId(id: unknown): id is string {
  return typeof id === 'string' && VENUES_BY_ID.has(id);
}
