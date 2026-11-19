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
}

const f = (v: string, fallback: string) => `var(${v}), ${fallback}`;
const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';
const SCRIPT = '"Segoe Script", "Brush Script MT", cursive';

export const INVITE_THEMES: Record<InvitationTemplateId, InviteTheme> = {
  'song-hy-do': {
    ground: '#5e0b0e',
    paper: '#a3161b',
    ink: '#fff1d6',
    inkSoft: '#f3c9a0',
    accent: '#e8b64c',
    onAccent: '#5e0b0e',
    line: '#e8b64c',
    panel: '#8a1216',
    display: f('--f-noto-display', SERIF),
    script: f('--f-imperial', SCRIPT),
    body: f('--f-noto-display', SERIF),
    namesIn: 'script',
    namesUpper: false,
    ornament: 'song-hy',
    envelope: { body: '#b51a20', flap: '#9a1318', liner: '#e8b64c', seal: '#e8b64c', sealInk: '#9a1318', text: '#fff1d6' },
    petals: ['#f2c14e', '#ffe2a8'],
    grain: 0.35,
    frame: 'arch',
    shape: 'gentle',
    cardFrame: 'gold-inset',
    countdown: 'ruled',
    accentText: '#f6d27a',
  },
  'son-mai': {
    ground: '#160606',
    paper: '#3a0d0d',
    ink: '#f6e7c8',
    inkSoft: '#d9b98a',
    accent: '#d8a84e',
    onAccent: '#2a0b0b',
    line: '#b8893b',
    panel: '#4a1212',
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
  },
  'sen-hong': {
    ground: '#e9d8cf',
    paper: '#fffaf5',
    ink: '#3b2a2a',
    inkSoft: '#7d5a5c',
    accent: '#b23f5c',
    onAccent: '#fffaf5',
    line: '#d9a3ad',
    panel: '#fbeee9',
    display: f('--f-spectral', SERIF),
    script: f('--f-moon-dance', SCRIPT),
    body: f('--f-spectral', SERIF),
    namesIn: 'script',
    namesUpper: false,
    ornament: 'lotus',
    envelope: { body: '#f4dfd8', flap: '#ecccc3', liner: '#2f5d46', seal: '#c94f6d', sealInk: '#fffaf5', text: '#3b2a2a' },
    petals: ['#f2a7b8', '#f7c9d3'],
    grain: 0.25,
    frame: 'arch',
    shape: 'soft',
    cardFrame: 'none',
    countdown: 'tiles',
    accentText: '#a83a56',
  },
  'toi-gian': {
    ground: '#e8e4dd',
    paper: '#fdfcfa',
    ink: '#1e1e1e',
    inkSoft: '#6b655c',
    accent: '#1e1e1e',
    onAccent: '#fdfcfa',
    line: '#c9c3b8',
    panel: '#f4f1ec',
    display: f('--f-prata', SERIF),
    script: f('--f-prata', SERIF),
    body: f('--f-josefin', SANS),
    namesIn: 'display',
    namesUpper: false,
    namesWeight: 400,
    ornament: 'hairline',
    envelope: { body: '#f4f1ec', flap: '#ebe6de', liner: '#1e1e1e', seal: '#1e1e1e', sealInk: '#fdfcfa', text: '#1e1e1e' },
    petals: [],
    grain: 0.15,
    frame: 'rect',
    shape: 'square',
    cardFrame: 'hairline',
    countdown: 'ruled',
  },
  'mau-nuoc': {
    ground: '#f3e4e1',
    paper: '#fffdfb',
    ink: '#4f3237',
    inkSoft: '#8a6468',
    accent: '#a8505d',
    onAccent: '#fffdfb',
    line: '#e3b8bd',
    panel: '#fcf1ef',
    display: f('--f-garamond', SERIF),
    script: f('--f-great-vibes', SCRIPT),
    body: f('--f-garamond', SERIF),
    namesIn: 'script',
    namesUpper: false,
    ornament: 'watercolor',
    envelope: { body: '#f6e6e3', flap: '#efd6d2', liner: '#e9a8b2', seal: '#c8737f', sealInk: '#fffdfb', text: '#4f3237' },
    petals: ['#f4b6c0', '#fbd3cf', '#f9c4a8'],
    grain: 0.3,
    frame: 'oval',
    shape: 'soft',
    cardFrame: 'none',
    countdown: 'tiles',
    accentText: '#9e4855',
  },
  'la-xanh': {
    ground: '#c9b79c',
    paper: '#f6f3ea',
    ink: '#273326',
    inkSoft: '#5a6b57',
    accent: '#4a6346',
    onAccent: '#f6f3ea',
    line: '#a9b8a3',
    panel: '#ece9dd',
    display: f('--f-josefin', SANS),
    script: f('--f-water-brush', SCRIPT),
    body: f('--f-josefin', SANS),
    namesIn: 'script',
    namesUpper: false,
    ornament: 'eucalyptus',
    envelope: { body: '#c4a27a', flap: '#b8946b', liner: '#5f7a5b', seal: '#5f7a5b', sealInk: '#f6f3ea', text: '#2c241a' },
    petals: ['#9fb59a', '#c7d4bf'],
    grain: 0.45,
    frame: 'arch',
    shape: 'gentle',
    cardFrame: 'none',
    countdown: 'tiles',
    accentText: '#435c40',
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
    display: f('--f-prata', SERIF),
    script: f('--f-pinyon', SCRIPT),
    body: f('--f-prata', SERIF),
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
    grain: 0.15,
    frame: 'circle',
    shape: 'soft',
    cardFrame: 'none',
    countdown: 'tiles',
    accentText: '#b8365f',
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
    display: f('--f-archivo', SANS),
    script: f('--f-prata', SERIF),
    body: f('--f-archivo', SANS),
    namesIn: 'display',
    namesUpper: true,
    ornament: 'masthead',
    envelope: { body: '#f2f2f2', flap: '#e6e6e6', liner: '#c8102e', seal: '#c8102e', sealInk: '#ffffff', text: '#0f0f0f' },
    petals: [],
    grain: 0.1,
    frame: 'full',
    shape: 'square',
    cardFrame: 'none',
    countdown: 'ruled',
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
    grain: 0.15,
    frame: 'arch',
    shape: 'gentle',
    cardFrame: 'none',
    countdown: 'tiles',
  },
  'do-do': {
    ground: '#2a060f',
    paper: '#5a1022',
    ink: '#fbeee8',
    inkSoft: '#e7b8a8',
    accent: '#e7b8a8',
    onAccent: '#4a0d1c',
    line: '#b97a72',
    panel: '#6e1427',
    display: f('--f-yeseva', SERIF),
    script: f('--f-alex-brush', SCRIPT),
    body: f('--f-garamond', SERIF),
    namesIn: 'script',
    namesUpper: false,
    ornament: 'rose-line',
    envelope: { body: '#6e1427', flap: '#5a1022', liner: '#e7b8a8', seal: '#e7b8a8', sealInk: '#5a1022', text: '#fbeee8' },
    petals: ['#e7b8a8', '#b33a54'],
    grain: 0.4,
    frame: 'oval',
    shape: 'gentle',
    cardFrame: 'hairline',
    countdown: 'ruled',
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
