import {
  Archivo,
  Prata,
  Dancing_Script,
  EB_Garamond,
  Ephesis,
  Great_Vibes,
  Imperial_Script,
  Josefin_Sans,
  Be_Vietnam_Pro,
  Moon_Dance,
  Noto_Serif_Display,
  Old_Standard_TT,
  Quicksand,
  Spectral,
  Taviraj,
  Yeseva_One,
  Water_Brush,
  Corinthia,
  Pinyon_Script,
  The_Nautigal,
  Alex_Brush,
} from 'next/font/google';

/*
 * Every face carries the Vietnamese subset (diacritics stacked correctly). None is preloaded:
 * the browser downloads only the faces the chosen template actually uses.
 */
export const notoSerifDisplay = Noto_Serif_Display({ subsets: ['vietnamese', 'latin'], display: 'swap', preload: false, weight: ['400', '600', '700'], variable: '--f-noto-display' });
export const imperialScript = Imperial_Script({ subsets: ['vietnamese', 'latin'], display: 'swap', preload: false, weight: '400', variable: '--f-imperial' });
export const greatVibes = Great_Vibes({ subsets: ['vietnamese', 'latin'], display: 'swap', preload: false, weight: '400', variable: '--f-great-vibes' });
export const dancingScript = Dancing_Script({ subsets: ['vietnamese', 'latin'], display: 'swap', preload: false, weight: ['500', '700'], variable: '--f-dancing' });
export const prata = Prata({ subsets: ['vietnamese', 'latin'], display: 'swap', preload: false, weight: '400', variable: '--f-prata' });
export const josefinSans = Josefin_Sans({ subsets: ['vietnamese', 'latin'], display: 'swap', preload: false, weight: ['300', '400', '600'], variable: '--f-josefin' });
export const taviraj = Taviraj({ subsets: ['vietnamese', 'latin'], display: 'swap', preload: false, weight: ['400', '600'], variable: '--f-taviraj' });
export const ephesis = Ephesis({ subsets: ['vietnamese', 'latin'], display: 'swap', preload: false, weight: '400', variable: '--f-ephesis' });
export const moonDance = Moon_Dance({ subsets: ['vietnamese', 'latin'], display: 'swap', preload: false, weight: '400', variable: '--f-moon-dance' });
export const spectral = Spectral({ subsets: ['vietnamese', 'latin'], display: 'swap', preload: false, weight: ['400', '600'], variable: '--f-spectral' });
export const ebGaramond = EB_Garamond({ subsets: ['vietnamese', 'latin'], display: 'swap', preload: false, weight: ['400', '600'], variable: '--f-garamond' });
export const oldStandard = Old_Standard_TT({ subsets: ['vietnamese', 'latin'], display: 'swap', preload: false, weight: ['400', '700'], variable: '--f-old-standard' });
export const quicksand = Quicksand({ subsets: ['vietnamese', 'latin'], display: 'swap', preload: false, weight: ['400', '600'], variable: '--f-quicksand' });
export const archivo = Archivo({ subsets: ['vietnamese', 'latin'], display: 'swap', preload: false, weight: ['400', '700', '900'], variable: '--f-archivo' });
export const yesevaOne = Yeseva_One({ subsets: ['vietnamese', 'latin'], display: 'swap', preload: false, weight: '400', variable: '--f-yeseva' });
// Be Vietnam Pro, not Lexend: from some networks Google serves Lexend as extension-less /l/font URLs that break next/font at build
export const beVietnam = Be_Vietnam_Pro({ subsets: ['vietnamese', 'latin'], display: 'swap', preload: false, weight: ['300', '400', '600'], variable: '--f-be-vietnam' });
export const waterBrush = Water_Brush({ subsets: ['vietnamese', 'latin'], display: 'swap', preload: false, weight: '400', variable: '--f-water-brush' });
export const corinthia = Corinthia({ subsets: ['vietnamese', 'latin'], display: 'swap', preload: false, weight: '700', variable: '--f-corinthia' });
export const pinyonScript = Pinyon_Script({ subsets: ['vietnamese', 'latin'], display: 'swap', preload: false, weight: '400', variable: '--f-pinyon' });
export const theNautigal = The_Nautigal({ subsets: ['vietnamese', 'latin'], display: 'swap', preload: false, weight: '700', variable: '--f-nautigal' });
export const alexBrush = Alex_Brush({ subsets: ['vietnamese', 'latin'], display: 'swap', preload: false, weight: '400', variable: '--f-alex-brush' });

/** All variables, set once on the invitation root so any template can resolve its faces */
export const INVITATION_FONT_VARS = [
  notoSerifDisplay,
  imperialScript,
  greatVibes,
  dancingScript,
  prata,
  josefinSans,
  taviraj,
  ephesis,
  moonDance,
  spectral,
  ebGaramond,
  oldStandard,
  quicksand,
  archivo,
  yesevaOne,
  beVietnam,
  waterBrush,
  corinthia,
  pinyonScript,
  theNautigal,
  alexBrush,
]
  .map((f) => f.variable)
  .join(' ');
