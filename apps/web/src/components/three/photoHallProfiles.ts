import type photographs from './catalogPhotoReferences.json';
import type { ArchitectureStyle } from './photoArchitecture';
import type { PlantStyle } from './photoVegetation';
import type { TerrainStyle } from './photoTerrain';
import type { SurfaceKind } from './surfaceTextures';

export type ReferenceLight = 'clear' | 'soft' | 'mist' | 'golden' | 'twilight' | 'night' | 'interior' | 'snow';
export interface ScenePalette {
  primary: string;
  secondary: string;
  accent: string;
  shadow: string;
}

export interface PhotoHallProfile {
  light: ReferenceLight;
  terrain?: TerrainStyle;
  architecture?: ArchitectureStyle;
  plants?: PlantStyle;
  floor: SurfaceKind;
  palette: ScenePalette;
  landmark?: 'sampans' | 'houseboats' | 'feluccas' | 'gondolas' | 'outrigger' | 'mountain-hut' | 'coastal-fales';
}

type Scenery = Pick<PhotoHallProfile, 'architecture' | 'terrain' | 'plants' | 'landmark'>;

function setting(light: ReferenceLight, floor: SurfaceKind, scenery: Scenery, primary: string, secondary: string, accent: string, shadow: string): PhotoHallProfile {
  return { light, floor, ...scenery, palette: { primary, secondary, accent, shadow } };
}

// The main subject, ground material and lighting are selected against each venue's source image.
// Every placement seed is tied to the catalog ID, so the preview and live wedding agree.
const profiles = {
  mekong_coconut_tent: setting('soft', 'grass', { terrain: 'river', plants: 'palm', landmark: 'sampans' }, '#667145', '#8d7953', '#d3a971', '#364437'),
  luxury_ballroom: setting('interior', 'wood', { architecture: 'ballroom' }, '#b89a78', '#e9d6b9', '#e2b979', '#634638'),
  vn_gia_tien: setting('soft', 'tile', { architecture: 'heritage', plants: 'broadleaf' }, '#886145', '#a49168', '#b95e42', '#493831'),
  vn_phu_quoc_beach: setting('clear', 'sand', { terrain: 'coast', plants: 'palm' }, '#f6e9cf', '#5e8062', '#42c6c2', '#314f39'),
  vn_da_lat: setting('mist', 'grass', { terrain: 'meadow', plants: 'pine' }, '#5a7443', '#9d9d62', '#dfd3a0', '#344536'),
  vn_hue_imperial: setting('soft', 'stone', { architecture: 'palace', plants: 'broadleaf' }, '#995c47', '#c79b63', '#97574a', '#47483a'),
  vn_mu_cang_chai: setting('soft', 'grass', { terrain: 'terraces', plants: 'bamboo' }, '#73854a', '#aba154', '#c2a35a', '#344932'),
  vn_saigon_rooftop: setting('night', 'stone', { architecture: 'skyline' }, '#626273', '#92857b', '#ffd083', '#292938'),
  jp_shinto: setting('soft', 'stone', { architecture: 'shrine', plants: 'broadleaf' }, '#725943', '#a68f6a', '#ac5443', '#25392b'),
  jp_sakura: setting('soft', 'stone', { architecture: 'courtyard', terrain: 'meadow', plants: 'blossom' }, '#a7907d', '#5e7750', '#eeaabd', '#384c32'),
  jp_ryokan_autumn: setting('clear', 'stone', { terrain: 'lake', architecture: 'shrine', plants: 'broadleaf' }, '#926144', '#a06b40', '#d26b48', '#3c4d32'),
  jp_hokkaido_snow: setting('twilight', 'snow', { terrain: 'alpine', plants: 'birch' }, '#d5e0eb', '#a6b6cd', '#eaae91', '#465673'),
  kr_hanok: setting('clear', 'stone', { architecture: 'heritage', plants: 'broadleaf' }, '#ae987e', '#62564b', '#977353', '#413e3b'),
  kr_jeju: setting('clear', 'grass', { terrain: 'volcanic', plants: 'wildflower' }, '#565451', '#798451', '#d9ac55', '#363c43'),
  kr_seoul_hall: setting('interior', 'marble', { architecture: 'ballroom' }, '#d2c6b1', '#9f968c', '#e1c99f', '#514a50'),
  cn_courtyard: setting('soft', 'stone', { architecture: 'courtyard', plants: 'broadleaf' }, '#91806d', '#635a54', '#a24a3b', '#3e3d35'),
  cn_jiangnan: setting('soft', 'stone', { architecture: 'canal', terrain: 'river', plants: 'broadleaf', landmark: 'sampans' }, '#a99d83', '#655e53', '#7c9690', '#363c38'),
  hk_harbour: setting('twilight', 'stone', { architecture: 'skyline', terrain: 'coast' }, '#585e71', '#c1a38a', '#eeb16e', '#242737'),
  tw_sky_lanterns: setting('twilight', 'stone', { terrain: 'alpine', plants: 'bamboo' }, '#5f6273', '#74787b', '#e38b58', '#333746'),
  mn_steppe: setting('clear', 'grass', { terrain: 'meadow', plants: 'barren' }, '#89925c', '#b8a87c', '#e8dcc1', '#535e43'),
  in_mandap: setting('interior', 'tile', { architecture: 'pavilion', plants: 'wildflower' }, '#aa7146', '#d9af73', '#e8a644', '#633e3a'),
  in_udaipur: setting('golden', 'stone', { architecture: 'palace', terrain: 'lake' }, '#c4a382', '#888b8e', '#e7c58a', '#585657'),
  in_kerala: setting('soft', 'wood', { terrain: 'river', plants: 'palm', landmark: 'houseboats' }, '#6f7858', '#9d8051', '#8bafaa', '#384939'),
  pk_mehndi: setting('night', 'tile', { architecture: 'pavilion' }, '#897060', '#693a70', '#f2c47d', '#3f293a'),
  lk_poruwa: setting('interior', 'wood', { architecture: 'pavilion', plants: 'tropical' }, '#a39188', '#6c728d', '#a893ce', '#423a46'),
  np_himalaya: setting('snow', 'stone', { terrain: 'alpine', plants: 'barren' }, '#737981', '#d6e4eb', '#8fa8b3', '#414b52'),
  th_sala: setting('clear', 'stone', { architecture: 'pavilion', terrain: 'lake', plants: 'tropical' }, '#a17753', '#677d60', '#d4a967', '#4b543f'),
  id_bali: setting('clear', 'stone', { architecture: 'shrine', terrain: 'terraces', plants: 'tropical' }, '#776f60', '#657959', '#c8b79a', '#405141'),
  id_java: setting('soft', 'tile', { architecture: 'pavilion', plants: 'tropical' }, '#9a6749', '#77624b', '#c99b66', '#504638'),
  my_pelamin: setting('interior', 'marble', { architecture: 'ballroom' }, '#b5afa5', '#e2d8ce', '#cccce0', '#4c4955'),
  ph_tropical: setting('clear', 'sand', { terrain: 'coast', plants: 'palm' }, '#e7decb', '#789168', '#84c8cb', '#405850'),
  kh_temple_ruins: setting('golden', 'stone', { architecture: 'shrine', terrain: 'meadow', plants: 'tropical' }, '#8a735f', '#948269', '#c78458', '#554b3d'),
  la_baci: setting('clear', 'stone', { architecture: 'shrine', terrain: 'meadow', plants: 'tropical' }, '#a3794c', '#665e4a', '#c7a365', '#4f4f3d'),
  mm_bagan: setting('golden', 'stone', { architecture: 'shrine', terrain: 'meadow', plants: 'tropical' }, '#936747', '#947b59', '#d69a62', '#514839'),
  sg_garden: setting('night', 'stone', { architecture: 'skyline', plants: 'tropical' }, '#738265', '#725a72', '#b491c7', '#312d3e'),
  ma_riad: setting('soft', 'tile', { architecture: 'courtyard', plants: 'palm' }, '#bc9e7b', '#ab8e5d', '#6c886e', '#5f5641'),
  tr_cappadocia: setting('golden', 'sand', { terrain: 'canyon', plants: 'barren' }, '#be9278', '#a57462', '#d7a37d', '#615050'),
  ae_desert: setting('golden', 'sand', { terrain: 'dune', plants: 'barren' }, '#c68860', '#dba477', '#f0c3a2', '#765a49'),
  eg_nile: setting('golden', 'sand', { terrain: 'river', plants: 'palm', landmark: 'feluccas' }, '#b0a08a', '#a38b66', '#dacda7', '#5e6057'),
  jo_wadi_rum: setting('golden', 'sand', { terrain: 'canyon', plants: 'barren' }, '#ad745c', '#c99170', '#e7ac72', '#644839'),
  ir_persian_garden: setting('clear', 'tile', { architecture: 'palace', plants: 'cypress' }, '#af8967', '#77775b', '#3b7b89', '#5e4938'),
  il_chuppah: setting('golden', 'stone', { architecture: 'courtyard', plants: 'palm' }, '#a79175', '#767b5a', '#c77591', '#534c40'),
  lb_cedar: setting('soft', 'stone', { terrain: 'alpine', plants: 'cedar' }, '#77775b', '#7c806d', '#b5ac91', '#424d42'),
  ke_savanna: setting('soft', 'grass', { terrain: 'meadow', plants: 'acacia' }, '#90875a', '#9f9060', '#867b4f', '#555b41'),
  za_winelands: setting('clear', 'grass', { terrain: 'field', plants: 'vineyard' }, '#78825a', '#8a8686', '#b4a482', '#4d544a'),
  ng_yoruba: setting('soft', 'stone', { architecture: 'heritage', plants: 'broadleaf' }, '#946a52', '#ac8d6d', '#915944', '#57463a'),
  gh_kente: setting('soft', 'stone', { architecture: 'villa', plants: 'tropical' }, '#c8baa2', '#84745c', '#a15e4f', '#465346'),
  et_highlands: setting('clear', 'grass', { terrain: 'canyon', plants: 'wildflower' }, '#8e865a', '#91999a', '#c7ad71', '#525a4e'),
  tz_zanzibar: setting('clear', 'sand', { terrain: 'coast', plants: 'palm' }, '#eae6d8', '#7e9072', '#4bb6bf', '#405a59'),
  mg_baobab: setting('golden', 'sand', { terrain: 'meadow', plants: 'baobab' }, '#b99259', '#9e7a4c', '#d6a45d', '#574d3e'),
  tn_sidi_bou_said: setting('clear', 'tile', { architecture: 'old-town', plants: 'cypress' }, '#dedfd7', '#b6bed0', '#3067ab', '#465d73'),
  it_tuscany: setting('soft', 'stone', { architecture: 'villa', terrain: 'field', plants: 'cypress' }, '#c4b298', '#899464', '#a67b63', '#4a5947'),
  it_amalfi: setting('soft', 'stone', { architecture: 'villa', terrain: 'coast', plants: 'cypress' }, '#b6a28a', '#71866d', '#799eb0', '#526258'),
  it_venice: setting('soft', 'stone', { architecture: 'canal', terrain: 'river', landmark: 'gondolas' }, '#be9f8b', '#8c9d90', '#bb785e', '#50575c'),
  gr_santorini: setting('twilight', 'stone', { architecture: 'old-town', terrain: 'coast', plants: 'succulent' }, '#e2dbd2', '#b9a19e', '#48699c', '#474760'),
  fr_provence: setting('twilight', 'grass', { terrain: 'field', plants: 'lavender' }, '#76618e', '#646255', '#ad83bb', '#44404f'),
  fr_chateau: setting('clear', 'stone', { architecture: 'palace', terrain: 'lake', plants: 'broadleaf' }, '#cfc4ab', '#85847b', '#b5a288', '#5c625a'),
  fr_paris: setting('twilight', 'stone', { architecture: 'skyline', plants: 'broadleaf' }, '#8c868c', '#ae9282', '#e0a671', '#494750'),
  es_andalusia: setting('clear', 'tile', { architecture: 'courtyard', plants: 'cypress' }, '#c8aa89', '#748266', '#b77056', '#534e41'),
  pt_lisbon: setting('clear', 'tile', { architecture: 'old-town', plants: 'broadleaf' }, '#c3ab8a', '#8b9c9d', '#65968e', '#574d44'),
  uk_garden: setting('soft', 'grass', { terrain: 'meadow', plants: 'wildflower' }, '#7f9357', '#688052', '#e7cec0', '#44583a'),
  sc_highlands: setting('soft', 'stone', { architecture: 'palace', terrain: 'lake', plants: 'pine' }, '#94826d', '#6e7b74', '#a8a69a', '#4d5653'),
  ie_celtic: setting('soft', 'grass', { terrain: 'meadow', plants: 'wildflower' }, '#778653', '#9c9d80', '#b0ad8c', '#4f5a48'),
  no_fjord: setting('soft', 'stone', { terrain: 'fjord', plants: 'pine' }, '#637c58', '#456974', '#a5b7b0', '#3f5159'),
  se_midsummer: setting('clear', 'grass', { terrain: 'meadow', plants: 'birch' }, '#829456', '#b1ab79', '#ded8a8', '#506344'),
  fi_lapland: setting('night', 'snow', { terrain: 'alpine', plants: 'pine' }, '#526070', '#778695', '#76c598', '#273442'),
  is_black_sand: setting('soft', 'sand', { terrain: 'volcanic', plants: 'barren' }, '#555655', '#647575', '#bdc4ba', '#333b3f'),
  ru_birch: setting('soft', 'grass', { terrain: 'meadow', plants: 'birch' }, '#90825d', '#b2a37b', '#ddae5f', '#4c5545'),
  at_alps: setting('clear', 'grass', { terrain: 'alpine', plants: 'pine', landmark: 'mountain-hut' }, '#687750', '#8a9381', '#baae91', '#485346'),
  ch_lake: setting('clear', 'grass', { terrain: 'fjord', plants: 'pine' }, '#657d59', '#788e91', '#98b9c3', '#4e5b61'),
  de_bavaria: setting('clear', 'stone', { terrain: 'alpine', architecture: 'palace', plants: 'pine' }, '#c0b8aa', '#6f7f72', '#b8b5ad', '#4b5655'),
  nl_tulips: setting('clear', 'grass', { terrain: 'field', plants: 'tulip' }, '#788351', '#a89257', '#c94442', '#4b5940'),
  hr_dubrovnik: setting('twilight', 'stone', { architecture: 'old-town', terrain: 'coast' }, '#c2ab98', '#998b89', '#b97761', '#505969'),
  cz_prague: setting('night', 'stone', { architecture: 'palace', terrain: 'river' }, '#8c7272', '#555d72', '#d5aa67', '#303340'),
  hu_budapest: setting('twilight', 'stone', { architecture: 'palace', terrain: 'river' }, '#b5a29e', '#666a83', '#e5b879', '#403a52'),
  us_barn: setting('clear', 'grass', { architecture: 'barn', terrain: 'field', plants: 'wildflower' }, '#ab5249', '#7e8861', '#cfbca5', '#4e5042'),
  us_vegas: setting('twilight', 'stone', { architecture: 'chapel', terrain: 'dune', plants: 'palm' }, '#c8b9ad', '#968486', '#caa382', '#51495a'),
  us_nyc_rooftop: setting('twilight', 'stone', { architecture: 'skyline' }, '#77727a', '#8f7873', '#ecae72', '#3d3d4e'),
  us_napa: setting('clear', 'grass', { architecture: 'barn', terrain: 'field', plants: 'vineyard' }, '#9c7055', '#839052', '#b7878c', '#535441'),
  mx_hacienda: setting('soft', 'tile', { architecture: 'courtyard', plants: 'tropical' }, '#ae8064', '#77845c', '#ba5484', '#4a4938'),
  mx_tulum: setting('clear', 'sand', { terrain: 'coast', plants: 'tropical' }, '#ded3b8', '#748966', '#57b6bf', '#43574a'),
  gt_atitlan: setting('clear', 'stone', { terrain: 'lake', plants: 'tropical' }, '#698070', '#6489a4', '#88b4bb', '#47565e'),
  pe_andes: setting('clear', 'stone', { terrain: 'terraces', plants: 'barren' }, '#9a895d', '#a99e7e', '#c6ab79', '#5a6051'),
  br_rio: setting('golden', 'sand', { terrain: 'coast', plants: 'palm' }, '#d5b49a', '#84938e', '#d89983', '#535f69'),
  ar_patagonia: setting('clear', 'stone', { terrain: 'alpine', plants: 'barren' }, '#8d8889', '#d3d8e0', '#ac9fa0', '#575562'),
  ar_tango: setting('interior', 'wood', { architecture: 'ballroom' }, '#a38366', '#846657', '#d0a07a', '#503b3a'),
  cl_atacama: setting('golden', 'sand', { terrain: 'canyon', plants: 'barren' }, '#b99674', '#957b73', '#e2bd7e', '#645154'),
  cu_havana: setting('soft', 'stone', { architecture: 'old-town', plants: 'palm' }, '#ba947e', '#99a9a1', '#74a3a0', '#584e48'),
  jm_caribbean: setting('golden', 'sand', { terrain: 'coast', plants: 'palm' }, '#cfb69b', '#909590', '#efa977', '#605b63'),
  ca_rockies: setting('twilight', 'stone', { terrain: 'lake', plants: 'pine' }, '#77777e', '#829994', '#78b7b8', '#46505e'),
  ca_maple: setting('clear', 'grass', { terrain: 'lake', plants: 'broadleaf' }, '#9b825c', '#7d8760', '#d49758', '#485743'),
  us_hawaii: setting('clear', 'sand', { terrain: 'coast', plants: 'palm' }, '#e8dbc4', '#809477', '#73b9ca', '#495d5e'),
  pf_bora_bora: setting('clear', 'wood', { terrain: 'karst', architecture: 'pavilion', plants: 'palm', landmark: 'outrigger' }, '#d0bb8e', '#62866d', '#42c5ca', '#3b5c51'),
  fj_island: setting('clear', 'sand', { terrain: 'coast', plants: 'tropical' }, '#c3ac86', '#788c66', '#4faeae', '#495e50'),
  nz_hills: setting('clear', 'grass', { terrain: 'meadow', plants: 'wildflower' }, '#8d8b58', '#87816a', '#bbac7b', '#59614b'),
  au_outback: setting('clear', 'sand', { terrain: 'canyon', plants: 'succulent' }, '#ba683d', '#a66e56', '#d89259', '#684439'),
  au_sydney: setting('twilight', 'stone', { architecture: 'skyline', terrain: 'coast' }, '#aaa1a8', '#7f7a8c', '#ebbd9d', '#45475d'),
  ws_fale: setting('clear', 'sand', { terrain: 'coast', plants: 'palm', landmark: 'coastal-fales' }, '#ad9169', '#696f50', '#5e9ab9', '#3f4c47'),
} satisfies Record<keyof typeof photographs, PhotoHallProfile>;

export function getPhotoHallProfile(id: string): PhotoHallProfile | undefined {
  return Object.hasOwn(profiles, id) ? profiles[id as keyof typeof profiles] : undefined;
}

export function photoHallSeed(id: string): number {
  let seed = 0;
  for (const char of id) seed = (Math.imul(seed, 31) + char.charCodeAt(0)) >>> 0;
  return seed % 16381;
}
