import type photographs from './catalogPhotoReferences.json';
import type { ReferenceLight } from './photoHallProfiles';

type Position = [number, number, number];

export interface PhotoHallLighting {
  weather?: ReferenceLight;
  sky?: [zenith: string, horizon: string, cloudCover: number];
  key?: [position: Position, color: string, intensity: number];
  fill?: [color: string, intensity: number];
  haze?: [near: number, far: number];
  practical?: [position: Position, color: string, intensity: number];
}

type Photograph = keyof typeof photographs;

// The source photos for these venues have lighting that differs visibly from the broad
// weather preset. Directions are in hall space, with the stage behind the origin.
const photoLighting: Partial<Record<Photograph, PhotoHallLighting>> = {
  mekong_coconut_tent: {
    key: [[-28, 23, 12], '#ffe6bd', 1.92],
    fill: ['#dce5de', 0.75],
  },
  vn_da_lat: {
    sky: ['#588cb6', '#d0e0e7', 0.33],
    key: [[-26, 29, -13], '#fff2da', 1.89],
    fill: ['#d2e1e9', 0.77],
    haze: [46, 188],
  },
  vn_hue_imperial: {
    sky: ['#b9c4d4', '#e6e7ec', 0.83],
    key: [[-17, 31, 22], '#fff5ed', 1.22],
  },
  vn_mu_cang_chai: {
    sky: ['#91afbf', '#dce4d5', 0.46],
    key: [[-30, 28, 18], '#ffedc9', 1.91],
    haze: [70, 275],
  },
  jp_shinto: {
    sky: ['#91b3cf', '#dde5df', 0.46],
    key: [[-26, 34, 12], '#fff4dc', 1.82],
  },
  jp_sakura: {
    sky: ['#b9c4d3', '#e0e1dc', 0.68],
    fill: ['#e0e5ec', 0.82],
  },
  jp_hokkaido_snow: {
    sky: ['#526685', '#eda78e', 0.29],
    key: [[-28, 8, -31], '#ffc493', 0.79],
    fill: ['#a3b9e3', 0.94],
  },
  kr_seoul_hall: {
    key: [[19, 23, 12], '#e8eff9', 1.18],
    fill: ['#cfdbe6', 0.78],
    practical: [[-5, 5.0, -8], '#fff4e5', 34],
  },
  hk_harbour: {
    weather: 'night',
    sky: ['#1e2643', '#465772', 0],
    key: [[-32, 30, -15], '#a0b6ed', 0.43],
    practical: [[6, 4.9, -6], '#ffdeb1', 34],
  },
  tw_sky_lanterns: {
    sky: ['#8997b3', '#cbcfd9', 0.62],
    key: [[-23, 26, -19], '#dbe5f5', 0.85],
    fill: ['#b9c7e7', 0.88],
  },
  in_mandap: {
    sky: ['#9daebb', '#d7dce2', 0],
    key: [[-20, 24, 16], '#f5f0e5', 1.28],
    fill: ['#e0e3e9', 0.98],
  },
  in_udaipur: {
    sky: ['#566677', '#e0b877', 0.62],
    key: [[-28, 8, -31], '#ffd39c', 1.40],
  },
  pk_mehndi: {
    sky: ['#262a35', '#48494a', 0],
    fill: ['#c5ccd7', 0.68],
    practical: [[-5, 4.8, -7], '#fff0da', 54],
  },
  lk_poruwa: {
    sky: ['#969fbc', '#d8d5e8', 0],
    key: [[19, 25, 14], '#e6e5ff', 1.16],
    fill: ['#dfe2f5', 1.02],
    practical: [[-3, 3.7, -9], '#bfb7ff', 41],
  },
  id_java: {
    sky: ['#9db0be', '#d5d8d2', 0.65],
    key: [[-26, 23, -19], '#fff0dc', 1.29],
    fill: ['#ddd9d1', 0.71],
  },
  my_pelamin: {
    key: [[-18, 24, 14], '#e9efff', 1.12],
    fill: ['#d7dfeb', 0.78],
    practical: [[3, 4.4, -8], '#bcddff', 37],
  },
  sg_garden: {
    sky: ['#231f31', '#514450', 0],
    key: [[-12, 31, -19], '#b2b9ed', 0.42],
    practical: [[-5, 5.1, -8], '#97c8ff', 37],
  },
  il_chuppah: {
    weather: 'soft',
    sky: ['#a0b4c7', '#e1ded1', 0.67],
    key: [[-20, 24, -14], '#fff2db', 1.70],
  },
  ke_savanna: {
    sky: ['#819eb8', '#d6d9d8', 0.89],
    key: [[-27, 24, 13], '#f2eee1', 1.32],
    haze: [66, 264],
  },
  it_tuscany: {
    weather: 'clear',
    sky: ['#4883c4', '#c8dbef', 0.20],
    key: [[-24, 35, 9], '#fff3df', 2.25],
  },
  gr_santorini: {
    sky: ['#537994', '#eeab99', 0.26],
    key: [[-23, 16, 19], '#dfe8ff', 1.04],
    fill: ['#c2d3f5', 1.10],
    practical: [[4, 4.2, -6], '#ffd2a1', 33],
  },
  fr_provence: {
    sky: ['#858b9e', '#d0c7d0', 0.86],
    key: [[-24, 16, -23], '#f0dceb', 0.94],
    fill: ['#bdc8df', 1.07],
  },
  fr_paris: {
    sky: ['#3b5084', '#b8b1c2', 0.48],
    key: [[-27, 15, 17], '#dce3fa', 0.46],
    fill: ['#afc0e6', 1.11],
  },
  sc_highlands: {
    sky: ['#6f8fae', '#d2d7d7', 0.74],
    key: [[-27, 18, 17], '#ffebce', 1.87],
  },
  ie_celtic: {
    sky: ['#699aca', '#d5e4ed', 0.61],
    key: [[-26, 36, 15], '#fff4e1', 1.96],
  },
  nl_tulips: {
    weather: 'soft',
    sky: ['#a5aab6', '#d7d7d8', 0.90],
    key: [[-21, 29, 23], '#f5f2ec', 1.40],
    haze: [66, 244],
  },
  hr_dubrovnik: {
    sky: ['#646c8d', '#ceacaa', 0.46],
    key: [[-26, 16, 17], '#f1e0dc', 0.87],
    fill: ['#becbe3', 1.09],
  },
  hu_budapest: {
    weather: 'night',
    sky: ['#181f43', '#333f65', 0],
    practical: [[-5, 4.6, -9], '#ffd49a', 39],
  },
  us_vegas: {
    weather: 'soft',
    sky: ['#9cadaf', '#d2d8e0', 0.62],
    key: [[-26, 23, -18], '#f0efeb', 1.30],
  },
  us_nyc_rooftop: {
    sky: ['#385b8d', '#db9470', 0.16],
    key: [[-25, 8, -31], '#ffd0aa', 0.78],
    practical: [[5, 4.4, -6], '#ffd8a0', 29],
  },
  br_rio: {
    sky: ['#8297aa', '#e5cbbb', 0.47],
    key: [[-23, 10, -24], '#ffd9b7', 1.33],
    fill: ['#bacad6', 0.74],
  },
  ar_tango: {
    key: [[-20, 19, 16], '#ffdaa6', 0.88],
    fill: ['#d7c6b8', 0.70],
    practical: [[-4, 4.8, -7], '#ffcf94', 38],
  },
  cl_atacama: {
    key: [[-30, 18, 23], '#ffefcf', 2.40],
    sky: ['#527caa', '#b6c4cc', 0.23],
    haze: [76, 290],
  },
  jm_caribbean: {
    sky: ['#677486', '#d9c6ba', 0.87],
    key: [[-23, 8, -30], '#ffe3c7', 1.16],
  },
  ca_rockies: {
    sky: ['#586e88', '#ceaea8', 0.74],
    key: [[-28, 17, 21], '#ffd1b9', 1.29],
    fill: ['#bbcee6', 1.01],
    haze: [75, 275],
  },
  ca_maple: {
    weather: 'soft',
    sky: ['#9ca4ac', '#d4d4cf', 0.88],
    key: [[-25, 27, -18], '#fff1d8', 1.43],
  },
  au_sydney: {
    sky: ['#5376ad', '#e9c3b1', 0.20],
    key: [[-21, 15, 23], '#deebff', 0.93],
    fill: ['#b8cbea', 1.08],
  },
};

export function getPhotoHallLighting(id: string): PhotoHallLighting | undefined {
  return Object.hasOwn(photoLighting, id) ? photoLighting[id as Photograph] : undefined;
}
