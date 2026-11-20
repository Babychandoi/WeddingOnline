import type { InvitationTemplateId } from '@dco/shared';

export type OrnamentKind =
  | 'song-hy'
  | 'clouds'
  | 'lotus'
  | 'hairline'
  | 'watercolor'
  | 'eucalyptus'
  | 'lace'
  | 'baroque'
  | 'ribbon'
  | 'masthead'
  | 'waves'
  | 'rose-line';

/** How the first screen is composed. Each one is modelled on a different school of invitation design. */
export type CoverKind =
  | 'dome' // red dome with the 囍 medallion, names either side, arched portrait below
  | 'medallion' // lacquer field, round portrait ringed in gold
  | 'arch-floral' // tall arch portrait with cut-out peonies across its corners
  | 'editorial' // stationery-shop minimal: rule, names, landscape photo, date line
  | 'oval-wash' // watercolour washes behind an oval portrait
  | 'poster' // full-bleed photo, names set at the foot
  | 'vintage' // lace-edged oval portrait, sepia print
  | 'noir' // black & white photograph inside a gold frame
  | 'polaroid' // a pinned stack of instant photos
  | 'magazine' // fashion-magazine cover with masthead and cover lines
  | 'poster-script' // full-bleed photo with oversized handwriting across the sky
  | 'envelope' // the photo tucked into an open envelope with a wax seal
  | 'frame-inset' // printed photo with a white border, date badge on its edge
  | 'split' // photo edge to edge on top, editorial type below
  | 'big-date' // giant date numerals with the photo inside them
  | 'collage' // three photos as a small collage
  | 'vertical' // colour field, arch portrait, words set vertically
  | 'stamp' // postage stamp, postmark, airmail stripes
  | 'cinema' // film poster with credits
  | 'newspaper' // a front page announcing the news
  | 'circle' // geometric colour disc behind a round portrait
  | 'triple-arch' // three arched windows
  | 'boarding' // boarding pass
  | 'calendar' // photo above a month page with the day marked
  | 'red-poster' // red poster, gold type, a 囍 seal on the photo
  | 'botanical'; // framed portrait with greenery across three corners

export type HeadingKind = 'ornament' | 'band' | 'caps' | 'script' | 'numbered';
export type EventsKind = 'columns' | 'panel' | 'ticket' | 'editorial';
export type AlbumKind = 'mosaic' | 'tall3' | 'polaroid' | 'film' | 'grid2' | 'masonry';

export interface InviteLayout {
  cover: CoverKind;
  heading: HeadingKind;
  events: EventsKind;
  album: AlbumKind;
  /** The photo set between the invitation wording and the schedule */
  interlude: 'full' | 'rounded' | 'framed' | 'none';
  /** Last screen: a full-bleed photo with the thank-you over it, or plain paper */
  closing: 'photo' | 'plain';
  /** Short line set above the names on the cover */
  kicker: string;
  /** Cut-out flowers laid on light papers */
  floral?: string;
  /** CSS filter for every photo (sepia print, black & white) */
  photoFilter?: string;
  /** Where the cover photo is anchored when it is cropped */
  coverPosition?: string;
}

export interface InviteTheme {
  /** Table / background around the card */
  ground: string;
  /** The card stock */
  paper: string;
  ink: string;
  /** Secondary text, tinted from the ink (never plain grey) */
  inkSoft: string;
  accent: string;
  /** Text on accent-filled buttons */
  onAccent: string;
  line: string;
  /** Second paper tone for panels (countdown, forms) */
  panel: string;
  /** Text on panels when the panel is dark on a light card */
  panelInk?: string;
  /** Form fields and wish cards, when the panel tone is too dark for them */
  field?: string;
  display: string;
  script: string;
  body: string;
  /** Couple names in the script face or the display face */
  namesIn: 'script' | 'display';
  namesUpper: boolean;
  /** Weight of display-set names; 400 for single-weight faces (no faux bold) */
  namesWeight?: number;
  ornament: OrnamentKind;
  envelope: { body: string; flap: string; liner: string; seal: string; sealInk: string; text: string };
  petals: string[];
  /** Paper grain strength 0..1 */
  grain: number;
  /** Photo frame shape */
  frame: 'arch' | 'oval' | 'rect' | 'circle' | 'full';
  /** Corner language of panels, fields and buttons: soft (rounded + pill), gentle (small radius), square (print rules) */
  shape: 'soft' | 'gentle' | 'square';
  /** Border printed around the whole card */
  cardFrame: 'none' | 'double' | 'gold-inset' | 'hairline';
  /** Countdown as boxed tiles or as numerals set between rules */
  countdown: 'tiles' | 'ruled';
  /** Accent for text (headings, labels) when the fill accent is too light/dark to read at 4.5:1 */
  accentText?: string;
  /** Form fields: underlined (editorial), soft white pillows, or quiet boxes. Defaults from shape. */
  skin?: 'line' | 'soft' | 'box';
  layout: InviteLayout;
}

const f = (v: string, fallback: string) => `var(${v}), ${fallback}`;
const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';
const SCRIPT = '"Segoe Script", "Brush Script MT", cursive';

const S = '/invitation-samples';

type LegacyId = 'song-hy-do' | 'son-mai' | 'sen-hong' | 'toi-gian' | 'mau-nuoc' | 'la-xanh' | 'ren-co-dien' | 'baroque-vang' | 'hong-pastel' | 'tap-chi' | 'bien-xanh' | 'do-do';

/** The twelve original templates, tuned by hand */
const LEGACY: Record<LegacyId, InviteTheme> = {
  'song-hy-do': {
    ground: '#6d0f12',
    paper: '#fbf4e8',
    ink: '#5a0d10',
    inkSoft: '#8a4a3d',
    accent: '#a3161b',
    onAccent: '#fff4dc',
    line: '#d2ab62',
    panel: '#a3161b',
    panelInk: '#fff4dc',
    field: '#fffaf1',
    display: f('--f-viaoda', SERIF),
    script: f('--f-imperial', SCRIPT),
    body: f('--f-spectral', SERIF),
    namesIn: 'display',
    namesUpper: false,
    namesWeight: 400,
    ornament: 'song-hy',
    envelope: { body: '#b51a20', flap: '#9a1318', liner: '#e8b64c', seal: '#e8b64c', sealInk: '#9a1318', text: '#fff1d6' },
    petals: ['#e8b64c', '#c8282e'],
    grain: 0.3,
    frame: 'arch',
    shape: 'gentle',
    cardFrame: 'none',
    countdown: 'ruled',
    accentText: '#9a1419',
    layout: { cover: 'dome', heading: 'band', events: 'panel', album: 'tall3', interlude: 'framed', closing: 'photo', kicker: 'Trăm năm hạnh phúc' },
  },
  'son-mai': {
    ground: '#120404',
    paper: '#2b0909',
    ink: '#f6e7c8',
    inkSoft: '#d9b98a',
    accent: '#d8a84e',
    onAccent: '#2a0b0b',
    line: '#a77c34',
    panel: '#3d0f0f',
    display: f('--f-taviraj', SERIF),
    script: f('--f-ephesis', SCRIPT),
    body: f('--f-taviraj', SERIF),
    namesIn: 'display',
    namesUpper: true,
    ornament: 'clouds',
    envelope: { body: '#4a1414', flap: '#5a1a1a', liner: '#d8a84e', seal: '#b51a20', sealInk: '#f6d48a', text: '#f6e7c8' },
    petals: ['#d8a84e'],
    grain: 0.5,
    frame: 'circle',
    shape: 'square',
    cardFrame: 'gold-inset',
    countdown: 'ruled',
    accentText: '#e2b866',
    layout: { cover: 'medallion', heading: 'ornament', events: 'panel', album: 'tall3', interlude: 'framed', closing: 'photo', kicker: 'Lễ Thành Hôn' },
  },
  'sen-hong': {
    ground: '#ecdcd3',
    paper: '#fffaf5',
    ink: '#3b2a2a',
    inkSoft: '#7d5a5c',
    accent: '#b23f5c',
    onAccent: '#fffaf5',
    line: '#e2b3bc',
    panel: '#fbeee9',
    display: f('--f-cormorant', SERIF),
    script: f('--f-moon-dance', SCRIPT),
    body: f('--f-spectral', SERIF),
    namesIn: 'script',
    namesUpper: false,
    ornament: 'lotus',
    envelope: { body: '#f4dfd8', flap: '#ecccc3', liner: '#2f5d46', seal: '#c94f6d', sealInk: '#fffaf5', text: '#3b2a2a' },
    petals: ['#f2a7b8', '#f7c9d3'],
    grain: 0.22,
    frame: 'arch',
    shape: 'soft',
    cardFrame: 'none',
    countdown: 'tiles',
    accentText: '#a83a56',
    layout: { cover: 'arch-floral', heading: 'script', events: 'columns', album: 'mosaic', interlude: 'rounded', closing: 'photo', kicker: 'Thư mời cưới', floral: `${S}/floral-255.webp` },
  },
  'toi-gian': {
    ground: '#e8e4dd',
    paper: '#fdfcfa',
    ink: '#1e1e1e',
    inkSoft: '#6b655c',
    accent: '#1e1e1e',
    onAccent: '#fdfcfa',
    line: '#cfc9be',
    panel: '#f4f1ec',
    display: f('--f-prata', SERIF),
    script: f('--f-cormorant', SERIF),
    body: f('--f-josefin', SANS),
    namesIn: 'display',
    namesUpper: false,
    namesWeight: 400,
    ornament: 'hairline',
    envelope: { body: '#f4f1ec', flap: '#ebe6de', liner: '#1e1e1e', seal: '#1e1e1e', sealInk: '#fdfcfa', text: '#1e1e1e' },
    petals: [],
    grain: 0.12,
    frame: 'rect',
    shape: 'square',
    cardFrame: 'none',
    countdown: 'ruled',
    layout: { cover: 'editorial', heading: 'caps', events: 'editorial', album: 'grid2', interlude: 'full', closing: 'plain', kicker: 'Save the date', coverPosition: '16% 55%' },
  },
  'mau-nuoc': {
    ground: '#f3e4e1',
    paper: '#fffdfb',
    ink: '#4f3237',
    inkSoft: '#8a6468',
    accent: '#a8505d',
    onAccent: '#fffdfb',
    line: '#e8c2c6',
    panel: '#fcf1ef',
    display: f('--f-cormorant', SERIF),
    script: f('--f-great-vibes', SCRIPT),
    body: f('--f-garamond', SERIF),
    namesIn: 'script',
    namesUpper: false,
    ornament: 'watercolor',
    envelope: { body: '#f6e6e3', flap: '#efd6d2', liner: '#e9a8b2', seal: '#c8737f', sealInk: '#fffdfb', text: '#4f3237' },
    petals: ['#f4b6c0', '#fbd3cf', '#f9c4a8'],
    grain: 0.25,
    frame: 'oval',
    shape: 'soft',
    cardFrame: 'none',
    countdown: 'tiles',
    accentText: '#9e4855',
    layout: { cover: 'oval-wash', heading: 'script', events: 'columns', album: 'mosaic', interlude: 'rounded', closing: 'photo', kicker: 'We’re getting married', floral: `${S}/floral-267.webp` },
  },
  'la-xanh': {
    ground: '#c9bfa8',
    paper: '#f6f3ea',
    ink: '#273326',
    inkSoft: '#5a6b57',
    accent: '#4a6346',
    onAccent: '#f6f3ea',
    line: '#b3c0ad',
    panel: '#ece9dd',
    display: f('--f-josefin', SANS),
    script: f('--f-water-brush', SCRIPT),
    body: f('--f-josefin', SANS),
    namesIn: 'script',
    namesUpper: false,
    ornament: 'eucalyptus',
    envelope: { body: '#c4a27a', flap: '#b8946b', liner: '#5f7a5b', seal: '#5f7a5b', sealInk: '#f6f3ea', text: '#2c241a' },
    petals: ['#9fb59a', '#c7d4bf'],
    grain: 0.4,
    frame: 'arch',
    shape: 'gentle',
    cardFrame: 'none',
    countdown: 'tiles',
    accentText: '#435c40',
    layout: { cover: 'poster', heading: 'script', events: 'columns', album: 'masonry', interlude: 'full', closing: 'photo', kicker: 'We’re getting married' },
  },
  'ren-co-dien': {
    ground: '#d9c3bb',
    paper: '#faf4ef',
    ink: '#4a3436',
    inkSoft: '#80625f',
    accent: '#8a5257',
    onAccent: '#faf4ef',
    line: '#c9a3a2',
    panel: '#f3e7e1',
    display: f('--f-old-standard', SERIF),
    script: f('--f-corinthia', SCRIPT),
    body: f('--f-old-standard', SERIF),
    namesIn: 'script',
    namesUpper: false,
    ornament: 'lace',
    envelope: { body: '#ead8d0', flap: '#e1cac0', liner: '#a1666b', seal: '#a1666b', sealInk: '#faf4ef', text: '#4a3436' },
    petals: ['#e8c3c0'],
    grain: 0.35,
    frame: 'oval',
    shape: 'gentle',
    cardFrame: 'double',
    countdown: 'ruled',
    accentText: '#80484d',
    layout: { cover: 'vintage', heading: 'ornament', events: 'columns', album: 'grid2', interlude: 'framed', closing: 'plain', kicker: 'Save the Date', photoFilter: 'sepia(0.28) saturate(0.85) contrast(0.96) brightness(1.02)' },
  },
  'baroque-vang': {
    ground: '#070605',
    paper: '#14110e',
    ink: '#efe3c4',
    inkSoft: '#bfae86',
    accent: '#c9a45c',
    onAccent: '#14110e',
    line: '#8f7340',
    panel: '#1d1915',
    display: f('--f-cormorant', SERIF),
    script: f('--f-pinyon', SCRIPT),
    body: f('--f-cormorant', SERIF),
    namesIn: 'script',
    namesUpper: false,
    ornament: 'baroque',
    envelope: { body: '#1a1714', flap: '#23201b', liner: '#c9a45c', seal: '#c9a45c', sealInk: '#14110e', text: '#efe3c4' },
    petals: ['#c9a45c'],
    grain: 0.4,
    frame: 'arch',
    shape: 'square',
    cardFrame: 'gold-inset',
    countdown: 'ruled',
    accentText: '#d9b875',
    layout: { cover: 'noir', heading: 'ornament', events: 'panel', album: 'tall3', interlude: 'full', closing: 'photo', kicker: 'The Wedding of', photoFilter: 'grayscale(1) contrast(1.06)' },
  },
  'hong-pastel': {
    ground: '#ffd6e0',
    paper: '#fff7f9',
    ink: '#5c2436',
    inkSoft: '#9a5a6c',
    accent: '#c2416b',
    onAccent: '#ffffff',
    line: '#f4b3c6',
    panel: '#ffeaf0',
    display: f('--f-quicksand', SANS),
    script: f('--f-dancing', SCRIPT),
    body: f('--f-quicksand', SANS),
    namesIn: 'script',
    namesUpper: false,
    ornament: 'ribbon',
    envelope: { body: '#ffc2d1', flap: '#ffb0c4', liner: '#ffffff', seal: '#e0628a', sealInk: '#ffffff', text: '#5c2436' },
    petals: ['#ff9fb8', '#ffd0dc', '#ffffff'],
    grain: 0.12,
    frame: 'circle',
    shape: 'soft',
    cardFrame: 'none',
    countdown: 'tiles',
    accentText: '#b8365f',
    layout: { cover: 'polaroid', heading: 'script', events: 'ticket', album: 'polaroid', interlude: 'rounded', closing: 'photo', kicker: 'We’re getting married!' },
  },
  'tap-chi': {
    ground: '#d8d8d8',
    paper: '#ffffff',
    ink: '#0f0f0f',
    inkSoft: '#4d4d4d',
    accent: '#c8102e',
    onAccent: '#ffffff',
    line: '#0f0f0f',
    panel: '#f2f2f2',
    display: f('--f-playfair', SERIF),
    script: f('--f-playfair', SERIF),
    body: f('--f-archivo', SANS),
    namesIn: 'display',
    namesUpper: true,
    namesWeight: 900,
    ornament: 'masthead',
    envelope: { body: '#f2f2f2', flap: '#e6e6e6', liner: '#c8102e', seal: '#c8102e', sealInk: '#ffffff', text: '#0f0f0f' },
    petals: [],
    grain: 0.08,
    frame: 'full',
    shape: 'square',
    cardFrame: 'none',
    countdown: 'ruled',
    layout: { cover: 'magazine', heading: 'numbered', events: 'editorial', album: 'film', interlude: 'full', closing: 'photo', kicker: 'Số đặc biệt' },
  },
  'bien-xanh': {
    ground: '#0b1f36',
    paper: '#f3f7fb',
    ink: '#0f2a47',
    inkSoft: '#46627f',
    accent: '#1f6fa8',
    onAccent: '#ffffff',
    line: '#9cc4e0',
    panel: '#e3eef7',
    display: f('--f-be-vietnam', SANS),
    script: f('--f-nautigal', SCRIPT),
    body: f('--f-be-vietnam', SANS),
    namesIn: 'script',
    namesUpper: false,
    ornament: 'waves',
    envelope: { body: '#16385c', flap: '#1d4670', liner: '#e9c46a', seal: '#e9c46a', sealInk: '#0f2a47', text: '#f3f7fb' },
    petals: ['#bfe0f2', '#ffffff'],
    grain: 0.12,
    frame: 'arch',
    shape: 'gentle',
    cardFrame: 'none',
    countdown: 'tiles',
    layout: { cover: 'poster-script', heading: 'script', events: 'ticket', album: 'masonry', interlude: 'full', closing: 'photo', kicker: 'Save the Date' },
  },
  'do-do': {
    ground: '#2a060f',
    paper: '#f4ebe0',
    ink: '#4a0d1c',
    inkSoft: '#7d4a50',
    accent: '#6e1427',
    onAccent: '#fbeee8',
    line: '#c79d8e',
    panel: '#5a1022',
    panelInk: '#fbeee8',
    field: '#fbf6ef',
    display: f('--f-viaoda', SERIF),
    script: f('--f-alex-brush', SCRIPT),
    body: f('--f-garamond', SERIF),
    namesIn: 'display',
    namesUpper: false,
    namesWeight: 400,
    ornament: 'rose-line',
    envelope: { body: '#6e1427', flap: '#5a1022', liner: '#e7b8a8', seal: '#c9a45c', sealInk: '#5a1022', text: '#fbeee8' },
    petals: ['#e7b8a8', '#b33a54'],
    grain: 0.35,
    frame: 'oval',
    shape: 'gentle',
    cardFrame: 'none',
    countdown: 'ruled',
    layout: { cover: 'envelope', heading: 'ornament', events: 'panel', album: 'tall3', interlude: 'rounded', closing: 'photo', kicker: 'Trân trọng báo tin' },
  },
};

/* ───────────────────────── The catalogue ───────────────────────── */

type Palette = Pick<InviteTheme, 'ground' | 'paper' | 'ink' | 'inkSoft' | 'accent' | 'onAccent' | 'line' | 'panel' | 'panelInk' | 'field' | 'accentText' | 'petals' | 'grain'>;

/** Colour stories shared by the catalogue templates */
const PALETTES = {
  'hy-red': { ground: '#6d0f12', paper: '#fbf4e8', ink: '#5a0d10', inkSoft: '#8a4a3d', accent: '#a3161b', onAccent: '#fff4dc', line: '#d2ab62', panel: '#a3161b', panelInk: '#fff4dc', field: '#fffaf1', accentText: '#9a1419', petals: ['#e8b64c', '#c8282e'], grain: 0.3 },
  cherry: { ground: '#5c0a0f', paper: '#fff7ee', ink: '#4f0b0f', inkSoft: '#86463b', accent: '#b5121b', onAccent: '#fff3d6', line: '#e2b85c', panel: '#b5121b', panelInk: '#fff3d6', field: '#fffbf4', accentText: '#a3101a', petals: ['#e2b85c', '#d6262f'], grain: 0.25 },
  wine: { ground: '#2a060f', paper: '#f4ebe0', ink: '#4a0d1c', inkSoft: '#7d4a50', accent: '#6e1427', onAccent: '#fbeee8', line: '#d1a874', panel: '#5a1022', panelInk: '#fbeee8', field: '#fbf6ef', accentText: '#6e1427', petals: ['#e7b8a8', '#b33a54'], grain: 0.3 },
  jade: { ground: '#0f2f28', paper: '#f3f5ee', ink: '#173c33', inkSoft: '#4f6b61', accent: '#1f5c4a', onAccent: '#f6efd9', line: '#c9a45c', panel: '#1f5c4a', panelInk: '#f6efd9', field: '#fbfcf8', accentText: '#1d5645', petals: ['#c9a45c', '#9cc5b3'], grain: 0.28 },
  'royal-blue': { ground: '#0d1b38', paper: '#f6f2e7', ink: '#14284b', inkSoft: '#4b5a78', accent: '#1d3f7a', onAccent: '#f7ecd2', line: '#c9a45c', panel: '#1d3f7a', panelInk: '#f7ecd2', field: '#fffcf5', accentText: '#1d3f7a', petals: ['#c9a45c', '#9db4dc'], grain: 0.28 },
  'rose-gold': { ground: '#e9d3cf', paper: '#fcf5f2', ink: '#4a2c2a', inkSoft: '#85605c', accent: '#b76e79', onAccent: '#ffffff', line: '#e3c1bb', panel: '#f7e8e4', accentText: '#9c5560', petals: ['#f2c6cc', '#e8a8b2'], grain: 0.2 },
  mustard: { ground: '#5b4210', paper: '#fcf5e3', ink: '#3d2c12', inkSoft: '#77623d', accent: '#b9821a', onAccent: '#fffaf0', line: '#e2c27a', panel: '#f6e8c4', accentText: '#8f6410', petals: ['#e9b949', '#f3d98e'], grain: 0.3 },
  midnight: { ground: '#070d1a', paper: '#0f1a2e', ink: '#ece6d6', inkSoft: '#b3ab95', accent: '#d7b66a', onAccent: '#0f1a2e', line: '#7d6a3e', panel: '#16233d', accentText: '#e0c27c', petals: ['#d7b66a'], grain: 0.35 },
  'emerald-night': { ground: '#06130f', paper: '#0e2420', ink: '#efe6d0', inkSoft: '#bcb092', accent: '#cfae6b', onAccent: '#0e2420', line: '#7a6a3f', panel: '#14302a', accentText: '#d8b978', petals: ['#cfae6b'], grain: 0.35 },
  lotus: { ground: '#ecdcd3', paper: '#fffaf5', ink: '#3b2a2a', inkSoft: '#7d5a5c', accent: '#b23f5c', onAccent: '#fffaf5', line: '#e2b3bc', panel: '#fbeee9', accentText: '#a83a56', petals: ['#f2a7b8', '#f7c9d3'], grain: 0.22 },
  lavender: { ground: '#e4dcef', paper: '#f9f6fc', ink: '#3a2f4f', inkSoft: '#6e6185', accent: '#7b5ea7', onAccent: '#ffffff', line: '#d4c6e8', panel: '#f1ebf8', accentText: '#6c4f99', petals: ['#cdb8ea', '#e8dcf6', '#f5c9dc'], grain: 0.18 },
  peach: { ground: '#f6dccf', paper: '#fff8f3', ink: '#5b3426', inkSoft: '#8f6555', accent: '#c75e42', onAccent: '#ffffff', line: '#f2c7b4', panel: '#fdeee6', accentText: '#b4533a', petals: ['#f7b9a0', '#fbd8c8', '#f4a9b5'], grain: 0.2 },
  'dusty-blue': { ground: '#d8e2ec', paper: '#f6f9fb', ink: '#22344a', inkSoft: '#566a82', accent: '#4f7299', onAccent: '#ffffff', line: '#c3d3e3', panel: '#eaf1f7', accentText: '#46678c', petals: ['#bcd0e4', '#e3ecf5'], grain: 0.15 },
  champagne: { ground: '#e8dfd0', paper: '#fbf7f0', ink: '#3f362a', inkSoft: '#7a6c58', accent: '#9c7848', onAccent: '#ffffff', line: '#e0d0b6', panel: '#f4ede1', accentText: '#86663a', petals: ['#e9d6b4', '#f3e7d2'], grain: 0.22 },
  mono: { ground: '#e9e9e9', paper: '#ffffff', ink: '#111111', inkSoft: '#5b5b5b', accent: '#111111', onAccent: '#ffffff', line: '#d4d4d4', panel: '#f4f4f4', petals: [], grain: 0.06 },
  ivory: { ground: '#e8e4dd', paper: '#fdfcfa', ink: '#1e1e1e', inkSoft: '#6b655c', accent: '#1e1e1e', onAccent: '#fdfcfa', line: '#cfc9be', panel: '#f4f1ec', petals: [], grain: 0.12 },
  cinema: { ground: '#000000', paper: '#0d0d0d', ink: '#f1ede4', inkSoft: '#a8a397', accent: '#e3b23c', onAccent: '#111111', line: '#3d3a33', panel: '#171717', accentText: '#e8bd55', petals: ['#e3b23c'], grain: 0.3 },
  newsprint: { ground: '#d9d4c7', paper: '#f2eee3', ink: '#1b1a17', inkSoft: '#56524a', accent: '#9a1c1c', onAccent: '#ffffff', line: '#bdb6a6', panel: '#e8e3d6', accentText: '#8d1a1a', petals: [], grain: 0.32 },
  olive: { ground: '#d3d3be', paper: '#f4f2e8', ink: '#2f3524', inkSoft: '#626b52', accent: '#5f6e33', onAccent: '#fbfaf3', line: '#c6caa6', panel: '#e9e8d9', accentText: '#56632d', petals: ['#b8c48f', '#dfe3c4'], grain: 0.3 },
  'coral-sea': { ground: '#0e3a44', paper: '#f6fbfb', ink: '#123c46', inkSoft: '#4b6e76', accent: '#d65645', onAccent: '#ffffff', line: '#a9d3d6', panel: '#e5f3f3', accentText: '#c0473a', petals: ['#f4a493', '#bfe3e3'], grain: 0.12 },
  ocean: { ground: '#0b1f36', paper: '#f3f7fb', ink: '#0f2a47', inkSoft: '#46627f', accent: '#1f6fa8', onAccent: '#ffffff', line: '#9cc4e0', panel: '#e3eef7', petals: ['#bfe0f2', '#ffffff'], grain: 0.12 },
  sky: { ground: '#8fb8df', paper: '#f4f8fc', ink: '#183a5a', inkSoft: '#4f6d8a', accent: '#2c6fb7', onAccent: '#ffffff', line: '#bcd3ea', panel: '#e6f0f9', accentText: '#255f9e', petals: ['#cfe2f5', '#ffffff'], grain: 0.1 },
  plum: { ground: '#14080f', paper: '#26111f', ink: '#f4e6ee', inkSoft: '#c9adbd', accent: '#e0a3c2', onAccent: '#26111f', line: '#7e4a66', panel: '#361a2d', accentText: '#e8b3cd', petals: ['#e0a3c2', '#c98aab'], grain: 0.35 },
  'noir-gold': { ground: '#070605', paper: '#14110e', ink: '#efe3c4', inkSoft: '#bfae86', accent: '#c9a45c', onAccent: '#14110e', line: '#8f7340', panel: '#1d1915', accentText: '#d9b875', petals: ['#c9a45c'], grain: 0.4 },
  terracotta: { ground: '#e2c9b6', paper: '#f8efe6', ink: '#4a2a1d', inkSoft: '#80594a', accent: '#a94f2b', onAccent: '#fff8f1', line: '#e0b9a1', panel: '#f2e2d5', accentText: '#9a4625', petals: ['#e9a27f', '#f3cdb4', '#d77a52'], grain: 0.3 },
  sage: { ground: '#c9bfa8', paper: '#f6f3ea', ink: '#273326', inkSoft: '#5a6b57', accent: '#4a6346', onAccent: '#f6f3ea', line: '#b3c0ad', panel: '#ece9dd', accentText: '#435c40', petals: ['#9fb59a', '#c7d4bf'], grain: 0.35 },
  blush: { ground: '#f3e4e1', paper: '#fffdfb', ink: '#4f3237', inkSoft: '#8a6468', accent: '#a8505d', onAccent: '#fffdfb', line: '#e8c2c6', panel: '#fcf1ef', accentText: '#9e4855', petals: ['#f4b6c0', '#fbd3cf', '#f9c4a8'], grain: 0.25 },
  'lace-rose': { ground: '#d9c3bb', paper: '#faf4ef', ink: '#4a3436', inkSoft: '#80625f', accent: '#8a5257', onAccent: '#faf4ef', line: '#c9a3a2', panel: '#f3e7e1', accentText: '#80484d', petals: ['#e8c3c0'], grain: 0.35 },
  candy: { ground: '#ffd6e0', paper: '#fff7f9', ink: '#5c2436', inkSoft: '#9a5a6c', accent: '#c2416b', onAccent: '#ffffff', line: '#f4b3c6', panel: '#ffeaf0', accentText: '#b8365f', petals: ['#ff9fb8', '#ffd0dc', '#ffffff'], grain: 0.12 },
} satisfies Record<string, Palette>;

type FontSet = Pick<InviteTheme, 'display' | 'script' | 'body' | 'namesIn' | 'namesUpper' | 'namesWeight'>;

/** Type pairings: a display face for names and headings, a script, a text face */
const FONT_SETS = {
  'viaoda-imperial': { display: f('--f-viaoda', SERIF), script: f('--f-imperial', SCRIPT), body: f('--f-spectral', SERIF), namesIn: 'display', namesUpper: false, namesWeight: 400 },
  'taviraj-ephesis': { display: f('--f-taviraj', SERIF), script: f('--f-ephesis', SCRIPT), body: f('--f-taviraj', SERIF), namesIn: 'display', namesUpper: true },
  'cormorant-moon': { display: f('--f-cormorant', SERIF), script: f('--f-moon-dance', SCRIPT), body: f('--f-spectral', SERIF), namesIn: 'script', namesUpper: false },
  'prata-josefin': { display: f('--f-prata', SERIF), script: f('--f-cormorant', SERIF), body: f('--f-josefin', SANS), namesIn: 'display', namesUpper: false, namesWeight: 400 },
  'cormorant-vibes': { display: f('--f-cormorant', SERIF), script: f('--f-great-vibes', SCRIPT), body: f('--f-garamond', SERIF), namesIn: 'script', namesUpper: false },
  'josefin-brush': { display: f('--f-josefin', SANS), script: f('--f-water-brush', SCRIPT), body: f('--f-josefin', SANS), namesIn: 'script', namesUpper: false },
  'oldstd-corinthia': { display: f('--f-old-standard', SERIF), script: f('--f-corinthia', SCRIPT), body: f('--f-old-standard', SERIF), namesIn: 'script', namesUpper: false },
  'cormorant-pinyon': { display: f('--f-cormorant', SERIF), script: f('--f-pinyon', SCRIPT), body: f('--f-cormorant', SERIF), namesIn: 'script', namesUpper: false },
  'quicksand-dancing': { display: f('--f-quicksand', SANS), script: f('--f-dancing', SCRIPT), body: f('--f-quicksand', SANS), namesIn: 'script', namesUpper: false },
  'playfair-archivo': { display: f('--f-playfair', SERIF), script: f('--f-playfair', SERIF), body: f('--f-archivo', SANS), namesIn: 'display', namesUpper: true, namesWeight: 900 },
  'bevn-nautigal': { display: f('--f-be-vietnam', SANS), script: f('--f-nautigal', SCRIPT), body: f('--f-be-vietnam', SANS), namesIn: 'script', namesUpper: false },
  'viaoda-alex': { display: f('--f-viaoda', SERIF), script: f('--f-alex-brush', SCRIPT), body: f('--f-garamond', SERIF), namesIn: 'display', namesUpper: false, namesWeight: 400 },
  'noto-imperial': { display: f('--f-noto-display', SERIF), script: f('--f-imperial', SCRIPT), body: f('--f-spectral', SERIF), namesIn: 'display', namesUpper: false, namesWeight: 500 },
  'yeseva-alex': { display: f('--f-yeseva', SERIF), script: f('--f-alex-brush', SCRIPT), body: f('--f-garamond', SERIF), namesIn: 'display', namesUpper: false, namesWeight: 400 },
  'playfair-vibes': { display: f('--f-playfair', SERIF), script: f('--f-great-vibes', SCRIPT), body: f('--f-cormorant', SERIF), namesIn: 'script', namesUpper: false },
  'garamond-pinyon': { display: f('--f-garamond', SERIF), script: f('--f-pinyon', SCRIPT), body: f('--f-garamond', SERIF), namesIn: 'script', namesUpper: false },
  'bevn-corinthia': { display: f('--f-be-vietnam', SANS), script: f('--f-corinthia', SCRIPT), body: f('--f-be-vietnam', SANS), namesIn: 'script', namesUpper: false },
  'prata-ephesis': { display: f('--f-prata', SERIF), script: f('--f-ephesis', SCRIPT), body: f('--f-spectral', SERIF), namesIn: 'display', namesUpper: false, namesWeight: 400 },
} satisfies Record<string, FontSet>;

type Style = 'truyen-thong' | 'lang-man' | 'hien-dai' | 'toi-gian' | 'sang-trong' | 'co-dien' | 'thien-nhien' | 'de-thuong';
interface Spec {
  palette: keyof typeof PALETTES;
  fonts: keyof typeof FONT_SETS;
  ornament: OrnamentKind;
  style: Style;
  layout: InviteLayout;
}

const GRAY = 'grayscale(1) contrast(1.06)';
const SEPIA = 'sepia(0.3) saturate(0.85) contrast(0.96) brightness(1.02)';

/** Darken (amt < 0) or lighten (amt > 0) a hex colour */
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(Math.min(255, Math.max(0, amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => ch(v).toString(16).padStart(2, '0')).join('')}`;
}

const DARK = new Set<keyof typeof PALETTES>(['midnight', 'emerald-night', 'cinema', 'plum', 'noir-gold']);
const SOFT = new Set<keyof typeof PALETTES>(['candy', 'peach', 'lavender', 'blush', 'rose-gold', 'lotus']);
const SQUARE = new Set<keyof typeof PALETTES>(['mono', 'ivory', 'newsprint', 'cinema', 'noir-gold', 'midnight', 'emerald-night', 'plum']);

function build(spec: Spec): InviteTheme {
  const p: Palette = PALETTES[spec.palette];
  const shape: InviteTheme['shape'] = SQUARE.has(spec.palette) || spec.layout.heading === 'caps' || spec.layout.heading === 'numbered' ? 'square' : SOFT.has(spec.palette) || spec.style === 'de-thuong' ? 'soft' : 'gentle';
  const fullBleed = ['noir', 'cinema', 'magazine', 'poster', 'poster-script', 'stamp', 'boarding'].includes(spec.layout.cover);
  return {
    ...p,
    ...FONT_SETS[spec.fonts],
    ornament: spec.ornament,
    envelope: { body: p.accent, flap: shade(p.accent, -0.14), liner: p.line, seal: DARK.has(spec.palette) ? p.accent : p.line, sealInk: DARK.has(spec.palette) ? p.paper : p.accent, text: p.onAccent },
    frame: 'arch',
    shape,
    cardFrame: DARK.has(spec.palette) && !fullBleed ? 'gold-inset' : spec.style === 'co-dien' && !fullBleed ? 'double' : 'none',
    countdown: shape === 'soft' ? 'tiles' : 'ruled',
    layout: spec.layout,
  };
}

const CATALOGUE: Record<Exclude<InvitationTemplateId, LegacyId>, Spec> = {
  'hy-ngoc-bich': { palette: 'jade', fonts: 'viaoda-imperial', ornament: 'song-hy', style: 'truyen-thong', layout: { cover: 'dome', heading: 'band', events: 'panel', album: 'tall3', interlude: 'framed', closing: 'photo', kicker: "Trăm năm hạnh phúc" } },
  'hy-hoang-gia': { palette: 'royal-blue', fonts: 'noto-imperial', ornament: 'clouds', style: 'truyen-thong', layout: { cover: 'dome', heading: 'band', events: 'panel', album: 'tall3', interlude: 'framed', closing: 'photo', kicker: "Loan phượng hoà minh" } },
  'hy-hong-dao': { palette: 'rose-gold', fonts: 'viaoda-imperial', ornament: 'song-hy', style: 'truyen-thong', layout: { cover: 'dome', heading: 'script', events: 'columns', album: 'mosaic', interlude: 'rounded', closing: 'photo', kicker: "Duyên lành thành đôi" } },
  'pho-hoi': { palette: 'mustard', fonts: 'viaoda-alex', ornament: 'lotus', style: 'truyen-thong', layout: { cover: 'dome', heading: 'band', events: 'columns', album: 'masonry', interlude: 'framed', closing: 'photo', kicker: "Hẹn nhau phố Hội" } },
  'cua-son': { palette: 'hy-red', fonts: 'viaoda-imperial', ornament: 'song-hy', style: 'truyen-thong', layout: { cover: 'triple-arch', heading: 'band', events: 'panel', album: 'tall3', interlude: 'framed', closing: 'photo', kicker: "Trăm năm tình viên mãn" } },
  'thiep-do-hy': { palette: 'cherry', fonts: 'viaoda-imperial', ornament: 'song-hy', style: 'truyen-thong', layout: { cover: 'red-poster', heading: 'band', events: 'panel', album: 'tall3', interlude: 'full', closing: 'photo', kicker: "Save the Date" } },
  'phuong-hoang': { palette: 'wine', fonts: 'yeseva-alex', ornament: 'rose-line', style: 'truyen-thong', layout: { cover: 'red-poster', heading: 'ornament', events: 'panel', album: 'tall3', interlude: 'rounded', closing: 'photo', kicker: "Ngày chung đôi" } },
  'do-hoang-kim': { palette: 'hy-red', fonts: 'noto-imperial', ornament: 'clouds', style: 'truyen-thong', layout: { cover: 'red-poster', heading: 'band', events: 'panel', album: 'mosaic', interlude: 'framed', closing: 'photo', kicker: "Wedding Day" } },
  'tra-hong': { palette: 'rose-gold', fonts: 'viaoda-alex', ornament: 'rose-line', style: 'truyen-thong', layout: { cover: 'split', heading: 'ornament', events: 'columns', album: 'grid2', interlude: 'rounded', closing: 'photo', kicker: "Lễ dâng trà" } },
  'lich-do': { palette: 'hy-red', fonts: 'viaoda-imperial', ornament: 'song-hy', style: 'truyen-thong', layout: { cover: 'calendar', heading: 'band', events: 'panel', album: 'tall3', interlude: 'framed', closing: 'photo', kicker: "Ngày lành tháng tốt" } },
  'tem-hy': { palette: 'hy-red', fonts: 'viaoda-imperial', ornament: 'song-hy', style: 'truyen-thong', layout: { cover: 'stamp', heading: 'band', events: 'columns', album: 'grid2', interlude: 'framed', closing: 'photo', kicker: "Thư mời cưới" } },
  'hoang-thanh': { palette: 'royal-blue', fonts: 'taviraj-ephesis', ornament: 'clouds', style: 'truyen-thong', layout: { cover: 'medallion', heading: 'ornament', events: 'panel', album: 'tall3', interlude: 'framed', closing: 'photo', kicker: "Lễ Thành Hôn" } },
  'ao-dai-ngoc': { palette: 'jade', fonts: 'viaoda-alex', ornament: 'lotus', style: 'truyen-thong', layout: { cover: 'vertical', heading: 'script', events: 'columns', album: 'masonry', interlude: 'rounded', closing: 'photo', kicker: "Save the date" } },
  'sen-trang': { palette: 'lotus', fonts: 'cormorant-moon', ornament: 'lotus', style: 'truyen-thong', layout: { cover: 'botanical', heading: 'script', events: 'columns', album: 'mosaic', interlude: 'rounded', closing: 'photo', kicker: "Thư mời cưới", floral: `${S}/floral-eucalyptus-sprig.webp` } },
  'den-long': { palette: 'midnight', fonts: 'taviraj-ephesis', ornament: 'clouds', style: 'truyen-thong', layout: { cover: 'split', heading: 'ornament', events: 'panel', album: 'film', interlude: 'full', closing: 'photo', kicker: "Phố đêm lên đèn" } },
  'nhat-binh': { palette: 'royal-blue', fonts: 'noto-imperial', ornament: 'clouds', style: 'truyen-thong', layout: { cover: 'collage', heading: 'band', events: 'panel', album: 'tall3', interlude: 'framed', closing: 'photo', kicker: "Hỷ sự" } },
  'mau-don-tim': { palette: 'lavender', fonts: 'cormorant-vibes', ornament: 'watercolor', style: 'lang-man', layout: { cover: 'arch-floral', heading: 'script', events: 'columns', album: 'mosaic', interlude: 'rounded', closing: 'photo', kicker: "Thư mời cưới", floral: `${S}/floral-267.webp` } },
  'xuan-hong': { palette: 'peach', fonts: 'cormorant-moon', ornament: 'watercolor', style: 'lang-man', layout: { cover: 'arch-floral', heading: 'script', events: 'columns', album: 'masonry', interlude: 'rounded', closing: 'photo', kicker: "Mùa xuân của chúng mình", floral: `${S}/floral-255.webp` } },
  'la-bac': { palette: 'dusty-blue', fonts: 'garamond-pinyon', ornament: 'eucalyptus', style: 'lang-man', layout: { cover: 'arch-floral', heading: 'script', events: 'columns', album: 'grid2', interlude: 'rounded', closing: 'photo', kicker: "Save the date", floral: `${S}/floral-eucalyptus-sprig.webp` } },
  'dao-phai': { palette: 'peach', fonts: 'cormorant-vibes', ornament: 'watercolor', style: 'lang-man', layout: { cover: 'oval-wash', heading: 'script', events: 'columns', album: 'mosaic', interlude: 'rounded', closing: 'photo', kicker: "We’re getting married", floral: `${S}/floral-255.webp` } },
  'ngoc-loang': { palette: 'dusty-blue', fonts: 'cormorant-vibes', ornament: 'watercolor', style: 'lang-man', layout: { cover: 'oval-wash', heading: 'script', events: 'columns', album: 'masonry', interlude: 'rounded', closing: 'photo', kicker: "Forever & always", floral: `${S}/floral-eucalyptus-leaves.webp` } },
  'oai-huong': { palette: 'lavender', fonts: 'cormorant-moon', ornament: 'watercolor', style: 'lang-man', layout: { cover: 'oval-wash', heading: 'script', events: 'ticket', album: 'polaroid', interlude: 'rounded', closing: 'photo', kicker: "Mãi bên nhau", floral: `${S}/floral-267.webp` } },
  'ngay-dep': { palette: 'champagne', fonts: 'playfair-vibes', ornament: 'rose-line', style: 'lang-man', layout: { cover: 'big-date', heading: 'script', events: 'columns', album: 'mosaic', interlude: 'rounded', closing: 'photo', kicker: "Save the date" } },
  'lich-hong': { palette: 'rose-gold', fonts: 'cormorant-vibes', ornament: 'watercolor', style: 'lang-man', layout: { cover: 'calendar', heading: 'script', events: 'columns', album: 'grid2', interlude: 'rounded', closing: 'photo', kicker: "Ngày chung đôi" } },
  'phong-thu-hong': { palette: 'rose-gold', fonts: 'viaoda-alex', ornament: 'rose-line', style: 'lang-man', layout: { cover: 'envelope', heading: 'ornament', events: 'columns', album: 'tall3', interlude: 'rounded', closing: 'photo', kicker: "Trân trọng báo tin" } },
  'hoa-dao': { palette: 'rose-gold', fonts: 'cormorant-moon', ornament: 'watercolor', style: 'lang-man', layout: { cover: 'botanical', heading: 'script', events: 'columns', album: 'masonry', interlude: 'rounded', closing: 'photo', kicker: "Thư mời cưới", floral: `${S}/floral-255.webp` } },
  'mau-don-trang': { palette: 'champagne', fonts: 'garamond-pinyon', ornament: 'lace', style: 'lang-man', layout: { cover: 'botanical', heading: 'script', events: 'columns', album: 'grid2', interlude: 'framed', closing: 'plain', kicker: "Save the date", floral: `${S}/floral-267.webp` } },
  'vuon-la': { palette: 'sage', fonts: 'josefin-brush', ornament: 'eucalyptus', style: 'thien-nhien', layout: { cover: 'botanical', heading: 'script', events: 'columns', album: 'masonry', interlude: 'full', closing: 'photo', kicker: "We’re getting married", floral: `${S}/floral-eucalyptus.webp` } },
  'tim-mong-mo': { palette: 'lavender', fonts: 'cormorant-moon', ornament: 'watercolor', style: 'lang-man', layout: { cover: 'medallion', heading: 'script', events: 'columns', album: 'polaroid', interlude: 'rounded', closing: 'photo', kicker: "Lễ thành hôn" } },
  'voan-trang': { palette: 'champagne', fonts: 'playfair-vibes', ornament: 'lace', style: 'lang-man', layout: { cover: 'frame-inset', heading: 'script', events: 'columns', album: 'grid2', interlude: 'framed', closing: 'photo', kicker: "We’re getting married" } },
  'ba-vom': { palette: 'champagne', fonts: 'cormorant-vibes', ornament: 'lace', style: 'lang-man', layout: { cover: 'triple-arch', heading: 'ornament', events: 'columns', album: 'mosaic', interlude: 'framed', closing: 'photo', kicker: "Save the date" } },
  'tim-hoang-hon': { palette: 'lavender', fonts: 'garamond-pinyon', ornament: 'watercolor', style: 'lang-man', layout: { cover: 'triple-arch', heading: 'script', events: 'columns', album: 'masonry', interlude: 'rounded', closing: 'photo', kicker: "Forever" } },
  'hen-uoc': { palette: 'blush', fonts: 'cormorant-vibes', ornament: 'watercolor', style: 'lang-man', layout: { cover: 'frame-inset', heading: 'script', events: 'ticket', album: 'polaroid', interlude: 'rounded', closing: 'photo', kicker: "Lời hẹn ước" } },
  'thu-tinh': { palette: 'champagne', fonts: 'oldstd-corinthia', ornament: 'lace', style: 'co-dien', layout: { cover: 'stamp', heading: 'ornament', events: 'columns', album: 'grid2', interlude: 'framed', closing: 'plain', kicker: "Thư mời cưới" } },
  'trang-den': { palette: 'mono', fonts: 'prata-josefin', ornament: 'hairline', style: 'toi-gian', layout: { cover: 'editorial', heading: 'caps', events: 'editorial', album: 'grid2', interlude: 'full', closing: 'plain', kicker: "Save the date", photoFilter: GRAY } },
  'be-sua': { palette: 'champagne', fonts: 'prata-josefin', ornament: 'hairline', style: 'toi-gian', layout: { cover: 'editorial', heading: 'caps', events: 'editorial', album: 'grid2', interlude: 'full', closing: 'plain', kicker: "Save the date", coverPosition: '38% 50%' } },
  'thanh-lich': { palette: 'dusty-blue', fonts: 'playfair-vibes', ornament: 'hairline', style: 'toi-gian', layout: { cover: 'editorial', heading: 'caps', events: 'editorial', album: 'masonry', interlude: 'full', closing: 'photo', kicker: "The wedding" } },
  'nua-trang': { palette: 'mono', fonts: 'playfair-archivo', ornament: 'masthead', style: 'hien-dai', layout: { cover: 'split', heading: 'numbered', events: 'editorial', album: 'film', interlude: 'full', closing: 'photo', kicker: "Save the date" } },
  'rung-thong': { palette: 'olive', fonts: 'josefin-brush', ornament: 'eucalyptus', style: 'thien-nhien', layout: { cover: 'split', heading: 'script', events: 'columns', album: 'masonry', interlude: 'full', closing: 'photo', kicker: "Đà Lạt mùa yêu" } },
  'vogue-den': { palette: 'mono', fonts: 'playfair-archivo', ornament: 'masthead', style: 'hien-dai', layout: { cover: 'magazine', heading: 'numbered', events: 'editorial', album: 'film', interlude: 'full', closing: 'photo', kicker: "Số đặc biệt", photoFilter: GRAY } },
  'tap-chi-hong': { palette: 'rose-gold', fonts: 'playfair-archivo', ornament: 'masthead', style: 'hien-dai', layout: { cover: 'magazine', heading: 'numbered', events: 'editorial', album: 'film', interlude: 'full', closing: 'photo', kicker: "Số đặc biệt" } },
  'seoul': { palette: 'dusty-blue', fonts: 'playfair-archivo', ornament: 'masthead', style: 'hien-dai', layout: { cover: 'magazine', heading: 'numbered', events: 'editorial', album: 'film', interlude: 'full', closing: 'photo', kicker: "K-Wedding" } },
  'album-mini': { palette: 'champagne', fonts: 'prata-josefin', ornament: 'hairline', style: 'hien-dai', layout: { cover: 'collage', heading: 'caps', events: 'editorial', album: 'grid2', interlude: 'full', closing: 'photo', kicker: "Our story" } },
  'han-quoc': { palette: 'dusty-blue', fonts: 'cormorant-vibes', ornament: 'hairline', style: 'hien-dai', layout: { cover: 'collage', heading: 'script', events: 'columns', album: 'masonry', interlude: 'rounded', closing: 'photo', kicker: "Our wedding" } },
  'phim-den-trang': { palette: 'mono', fonts: 'prata-josefin', ornament: 'hairline', style: 'toi-gian', layout: { cover: 'collage', heading: 'caps', events: 'editorial', album: 'film', interlude: 'full', closing: 'plain', kicker: "Black & white", photoFilter: GRAY } },
  'xanh-hien-dai': { palette: 'dusty-blue', fonts: 'prata-josefin', ornament: 'hairline', style: 'hien-dai', layout: { cover: 'circle', heading: 'caps', events: 'editorial', album: 'grid2', interlude: 'full', closing: 'photo', kicker: "Save the date" } },
  'mat-troi': { palette: 'terracotta', fonts: 'playfair-vibes', ornament: 'hairline', style: 'hien-dai', layout: { cover: 'circle', heading: 'caps', events: 'editorial', album: 'masonry', interlude: 'full', closing: 'photo', kicker: "Under the sun" } },
  'vong-tron-hong': { palette: 'candy', fonts: 'quicksand-dancing', ornament: 'ribbon', style: 'de-thuong', layout: { cover: 'circle', heading: 'script', events: 'ticket', album: 'polaroid', interlude: 'rounded', closing: 'photo', kicker: "Yêu là cưới" } },
  've-may-bay': { palette: 'sky', fonts: 'bevn-nautigal', ornament: 'waves', style: 'hien-dai', layout: { cover: 'boarding', heading: 'script', events: 'ticket', album: 'masonry', interlude: 'full', closing: 'photo', kicker: "Hạnh Phúc Air" } },
  've-ra-dao': { palette: 'coral-sea', fonts: 'bevn-nautigal', ornament: 'waves', style: 'thien-nhien', layout: { cover: 'boarding', heading: 'script', events: 'ticket', album: 'masonry', interlude: 'full', closing: 'photo', kicker: "Island Air" } },
  'rap-chieu': { palette: 'cinema', fonts: 'playfair-archivo', ornament: 'masthead', style: 'hien-dai', layout: { cover: 'cinema', heading: 'numbered', events: 'editorial', album: 'film', interlude: 'full', closing: 'photo', kicker: "Một câu chuyện tình yêu" } },
  'bom-tan': { palette: 'midnight', fonts: 'prata-josefin', ornament: 'hairline', style: 'hien-dai', layout: { cover: 'cinema', heading: 'caps', events: 'editorial', album: 'film', interlude: 'full', closing: 'photo', kicker: "Tác phẩm của định mệnh" } },
  'phim-han': { palette: 'plum', fonts: 'cormorant-pinyon', ornament: 'baroque', style: 'sang-trong', layout: { cover: 'cinema', heading: 'ornament', events: 'panel', album: 'tall3', interlude: 'full', closing: 'photo', kicker: "Một chuyện tình đẹp" } },
  'bao-hy': { palette: 'newsprint', fonts: 'playfair-archivo', ornament: 'masthead', style: 'hien-dai', layout: { cover: 'newspaper', heading: 'numbered', events: 'editorial', album: 'grid2', interlude: 'full', closing: 'plain', kicker: "Tin Vui", coverPosition: '16% 60%' } },
  'nhat-bao': { palette: 'newsprint', fonts: 'oldstd-corinthia', ornament: 'hairline', style: 'co-dien', layout: { cover: 'newspaper', heading: 'caps', events: 'editorial', album: 'film', interlude: 'framed', closing: 'plain', kicker: "Báo Hỷ" } },
  'trang-ram': { palette: 'midnight', fonts: 'taviraj-ephesis', ornament: 'clouds', style: 'sang-trong', layout: { cover: 'medallion', heading: 'ornament', events: 'panel', album: 'tall3', interlude: 'full', closing: 'photo', kicker: "Lễ Thành Hôn" } },
  'ngoc-luc-bao': { palette: 'emerald-night', fonts: 'taviraj-ephesis', ornament: 'baroque', style: 'sang-trong', layout: { cover: 'medallion', heading: 'ornament', events: 'panel', album: 'tall3', interlude: 'framed', closing: 'photo', kicker: "The Wedding" } },
  'dem-ha': { palette: 'midnight', fonts: 'cormorant-pinyon', ornament: 'baroque', style: 'sang-trong', layout: { cover: 'noir', heading: 'ornament', events: 'panel', album: 'tall3', interlude: 'full', closing: 'photo', kicker: "The Wedding of", photoFilter: GRAY } },
  'nhung-den': { palette: 'noir-gold', fonts: 'cormorant-pinyon', ornament: 'baroque', style: 'sang-trong', layout: { cover: 'noir', heading: 'ornament', events: 'panel', album: 'tall3', interlude: 'full', closing: 'photo', kicker: "The Wedding of" } },
  'pha-le': { palette: 'plum', fonts: 'garamond-pinyon', ornament: 'baroque', style: 'sang-trong', layout: { cover: 'noir', heading: 'ornament', events: 'panel', album: 'tall3', interlude: 'full', closing: 'photo', kicker: "Dạ tiệc cưới" } },
  'sai-gon-dem': { palette: 'midnight', fonts: 'bevn-nautigal', ornament: 'hairline', style: 'hien-dai', layout: { cover: 'poster-script', heading: 'script', events: 'ticket', album: 'masonry', interlude: 'full', closing: 'photo', kicker: "Say yes" } },
  'ngoc-trai': { palette: 'rose-gold', fonts: 'cormorant-pinyon', ornament: 'lace', style: 'co-dien', layout: { cover: 'vintage', heading: 'ornament', events: 'columns', album: 'grid2', interlude: 'framed', closing: 'plain', kicker: "Save the Date", photoFilter: SEPIA } },
  'phong-thu-navy': { palette: 'royal-blue', fonts: 'viaoda-alex', ornament: 'clouds', style: 'sang-trong', layout: { cover: 'envelope', heading: 'ornament', events: 'panel', album: 'tall3', interlude: 'rounded', closing: 'photo', kicker: "Trân trọng báo tin" } },
  'champagne': { palette: 'noir-gold', fonts: 'cormorant-pinyon', ornament: 'baroque', style: 'sang-trong', layout: { cover: 'frame-inset', heading: 'ornament', events: 'panel', album: 'tall3', interlude: 'full', closing: 'photo', kicker: "The Wedding" } },
  'vom-vang': { palette: 'noir-gold', fonts: 'cormorant-pinyon', ornament: 'baroque', style: 'sang-trong', layout: { cover: 'triple-arch', heading: 'ornament', events: 'panel', album: 'tall3', interlude: 'full', closing: 'photo', kicker: "The Wedding" } },
  'thu-xua': { palette: 'champagne', fonts: 'oldstd-corinthia', ornament: 'lace', style: 'co-dien', layout: { cover: 'vintage', heading: 'ornament', events: 'columns', album: 'grid2', interlude: 'framed', closing: 'plain', kicker: "Save the Date", photoFilter: SEPIA } },
  'hoai-niem': { palette: 'terracotta', fonts: 'oldstd-corinthia', ornament: 'lace', style: 'co-dien', layout: { cover: 'vintage', heading: 'ornament', events: 'columns', album: 'polaroid', interlude: 'framed', closing: 'plain', kicker: "Ngày xưa ấy", photoFilter: SEPIA } },
  'phim-xua': { palette: 'cinema', fonts: 'oldstd-corinthia', ornament: 'hairline', style: 'co-dien', layout: { cover: 'cinema', heading: 'caps', events: 'editorial', album: 'film', interlude: 'full', closing: 'plain', kicker: "Chuyện tình xưa", photoFilter: SEPIA } },
  'tem-buu-dien': { palette: 'mustard', fonts: 'oldstd-corinthia', ornament: 'hairline', style: 'co-dien', layout: { cover: 'stamp', heading: 'caps', events: 'columns', album: 'grid2', interlude: 'framed', closing: 'plain', kicker: "Thư mời cưới" } },
  'dong-hoa': { palette: 'olive', fonts: 'josefin-brush', ornament: 'eucalyptus', style: 'thien-nhien', layout: { cover: 'poster', heading: 'script', events: 'columns', album: 'masonry', interlude: 'full', closing: 'photo', kicker: "Forever starts today" } },
  'mua-thu': { palette: 'terracotta', fonts: 'josefin-brush', ornament: 'rose-line', style: 'thien-nhien', layout: { cover: 'poster', heading: 'script', events: 'columns', album: 'masonry', interlude: 'full', closing: 'photo', kicker: "Fall in love" } },
  'cong-torii': { palette: 'jade', fonts: 'cormorant-moon', ornament: 'clouds', style: 'thien-nhien', layout: { cover: 'poster', heading: 'script', events: 'columns', album: 'masonry', interlude: 'full', closing: 'photo', kicker: "Hẹn ước mùa hoa" } },
  'thao-nguyen': { palette: 'champagne', fonts: 'bevn-corinthia', ornament: 'eucalyptus', style: 'thien-nhien', layout: { cover: 'poster', heading: 'script', events: 'columns', album: 'masonry', interlude: 'full', closing: 'photo', kicker: "Wild & free" } },
  'hoang-hon': { palette: 'coral-sea', fonts: 'bevn-nautigal', ornament: 'waves', style: 'thien-nhien', layout: { cover: 'poster-script', heading: 'script', events: 'ticket', album: 'masonry', interlude: 'full', closing: 'photo', kicker: "Forever" } },
  'bau-troi': { palette: 'sky', fonts: 'bevn-nautigal', ornament: 'waves', style: 'thien-nhien', layout: { cover: 'poster-script', heading: 'script', events: 'ticket', album: 'masonry', interlude: 'full', closing: 'photo', kicker: "Just us" } },
  'so-bien': { palette: 'ocean', fonts: 'bevn-nautigal', ornament: 'waves', style: 'thien-nhien', layout: { cover: 'big-date', heading: 'script', events: 'ticket', album: 'masonry', interlude: 'full', closing: 'photo', kicker: "Save the date" } },
  'gio-bien': { palette: 'ocean', fonts: 'bevn-nautigal', ornament: 'waves', style: 'thien-nhien', layout: { cover: 'frame-inset', heading: 'script', events: 'ticket', album: 'masonry', interlude: 'full', closing: 'photo', kicker: "Ocean of love" } },
  'lich-xanh': { palette: 'sage', fonts: 'josefin-brush', ornament: 'eucalyptus', style: 'thien-nhien', layout: { cover: 'calendar', heading: 'script', events: 'columns', album: 'masonry', interlude: 'full', closing: 'photo', kicker: "We’re getting married" } },
  'phong-thu-xanh': { palette: 'sage', fonts: 'viaoda-alex', ornament: 'eucalyptus', style: 'thien-nhien', layout: { cover: 'envelope', heading: 'ornament', events: 'columns', album: 'grid2', interlude: 'rounded', closing: 'photo', kicker: "Trân trọng báo tin" } },
  'ky-niem': { palette: 'champagne', fonts: 'bevn-corinthia', ornament: 'ribbon', style: 'de-thuong', layout: { cover: 'polaroid', heading: 'script', events: 'ticket', album: 'polaroid', interlude: 'rounded', closing: 'photo', kicker: "Our little story" } },
  'nang-ha': { palette: 'peach', fonts: 'quicksand-dancing', ornament: 'ribbon', style: 'de-thuong', layout: { cover: 'polaroid', heading: 'script', events: 'ticket', album: 'polaroid', interlude: 'rounded', closing: 'photo', kicker: "Hello, Mrs!" } },
  'bac-ha': { palette: 'sage', fonts: 'quicksand-dancing', ornament: 'eucalyptus', style: 'de-thuong', layout: { cover: 'polaroid', heading: 'script', events: 'ticket', album: 'polaroid', interlude: 'rounded', closing: 'photo', kicker: "Chúng mình cưới!" } },
  've-hong': { palette: 'candy', fonts: 'quicksand-dancing', ornament: 'ribbon', style: 'de-thuong', layout: { cover: 'boarding', heading: 'script', events: 'ticket', album: 'polaroid', interlude: 'rounded', closing: 'photo', kicker: "Love Airlines" } },
  'tem-hong': { palette: 'candy', fonts: 'quicksand-dancing', ornament: 'ribbon', style: 'de-thuong', layout: { cover: 'stamp', heading: 'script', events: 'ticket', album: 'polaroid', interlude: 'rounded', closing: 'photo', kicker: "Thư mời cưới" } },
  'so-hong': { palette: 'candy', fonts: 'quicksand-dancing', ornament: 'ribbon', style: 'de-thuong', layout: { cover: 'big-date', heading: 'script', events: 'ticket', album: 'polaroid', interlude: 'rounded', closing: 'photo', kicker: "Save the date" } },
  'lich-cuoi': { palette: 'ivory', fonts: 'prata-josefin', ornament: 'hairline', style: 'toi-gian', layout: { cover: 'calendar', heading: 'caps', events: 'editorial', album: 'grid2', interlude: 'full', closing: 'plain', kicker: "Save the date" } },
  'i-love-you': { palette: 'wine', fonts: 'viaoda-alex', ornament: 'rose-line', style: 'lang-man', layout: { cover: 'vertical', heading: 'ornament', events: 'panel', album: 'tall3', interlude: 'rounded', closing: 'photo', kicker: "Save the date" } },
  'cam-dat': { palette: 'terracotta', fonts: 'yeseva-alex', ornament: 'rose-line', style: 'hien-dai', layout: { cover: 'vertical', heading: 'ornament', events: 'columns', album: 'masonry', interlude: 'rounded', closing: 'photo', kicker: "Save the date" } },
};

export const INVITE_THEMES: Record<InvitationTemplateId, InviteTheme> = {
  ...LEGACY,
  ...(Object.fromEntries(Object.entries(CATALOGUE).map(([id, spec]) => [id, build(spec)])) as Record<Exclude<InvitationTemplateId, LegacyId>, InviteTheme>),
};

export const BANK_NAMES: Record<string, string> = {
  '970422': 'MB Bank',
  '970436': 'Vietcombank',
  '970407': 'Techcombank',
  '970415': 'VietinBank',
  '970418': 'BIDV',
  '970405': 'Agribank',
  '970416': 'ACB',
  '970432': 'VPBank',
  '970423': 'TPBank',
  '970403': 'Sacombank',
  '970437': 'HDBank',
  '970441': 'VIB',
  '970443': 'SHB',
  '970426': 'MSB',
  '970448': 'OCB',
};
