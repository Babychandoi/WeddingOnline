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
  | 'envelope'; // the photo tucked into an open envelope with a wax seal

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
  layout: InviteLayout;
}

const f = (v: string, fallback: string) => `var(${v}), ${fallback}`;
const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';
const SCRIPT = '"Segoe Script", "Brush Script MT", cursive';

const S = '/invitation-samples';

export const INVITE_THEMES: Record<InvitationTemplateId, InviteTheme> = {
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
