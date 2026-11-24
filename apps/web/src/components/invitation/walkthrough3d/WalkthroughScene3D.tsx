'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Walkthrough3DTemplateId } from '@dco/shared';
import { IS_HANDHELD } from '@/components/three/deviceTier';
import { formatShortDotsDate, walkthrough3DTheme, type PathStyle3D, type Walkthrough3DTheme } from './themes3d';

export interface WalkthroughPhotoItem {
  id: string;
  url: string;
  caption?: string | null;
}

export interface WalkthroughEventBoardItem {
  id: string;
  kicker: string;
  title: string;
  stationLabel: string;
  timeText: string;
  solarDateText: string;
  lunarDateText: string;
  venueName: string;
  address: string;
  note: string;
  dressCode: string;
  mapUrl: string;
}

export interface TourStation {
  id: string;
  label: string;
  kind: 'gate' | 'couple' | 'welcome' | 'photo' | 'event' | 'stage';
  photoIndex?: number;
  eventIndex?: number;
  camPos: [number, number, number];
  lookAt: [number, number, number];
  /** True for side easel boards so portrait mobile backs up slightly */
  isEaselCloseUp?: boolean;
}

export interface JoystickInput {
  x: number;
  y: number;
  active: boolean;
}

export interface WalkthroughSceneProps {
  themeId: Walkthrough3DTemplateId;
  stationIndex: number;
  stationRevision: number;
  stations: TourStation[];
  /** True when guest taps a photo or event easel to zoom closer + read the bottom story/event card */
  inspectFocused: boolean;
  joystickRef: React.MutableRefObject<JoystickInput>;
  freeWalkActive: boolean;
  onEnterFreeWalk: () => void;
  groom: string;
  bride: string;
  dateIso: string;
  guestName: string;
  welcomeSubtitle?: string;
  events: WalkthroughEventBoardItem[];
  coupleCutoutUrl?: string;
  photos: WalkthroughPhotoItem[];
  onInspectPhoto?: (photoIndex: number) => void;
  onInspectEvent?: (eventIndex: number) => void;
}

const ARCH_Z = -5.6;
const STANDEE_Z = -10.8;
const WELCOME_POS: [number, number, number] = [-2.28, 0, -14.2];
const WELCOME_ROT_Y = 1.08;
const PHOTO_Z_START = -17.3;
const PHOTO_Z_STEP = 2.2;
const EVENT_Z_STEP = 2.35;

export function computeLayoutZ(photoCount: number, eventCount: number) {
  const shownPhotos = Math.min(6, photoCount);
  const shownEvents = Math.min(3, eventCount);
  const eventZStart = PHOTO_Z_START - shownPhotos * PHOTO_Z_STEP - 0.85;
  const stageZ = Math.min(-34.5, eventZStart - shownEvents * EVENT_Z_STEP - 3.6);
  return { shownPhotos, shownEvents, eventZStart, stageZ };
}

function easelCamPose(
  easelPos: [number, number, number],
  rotY: number,
  distance = 2.86,
): { camPos: [number, number, number]; lookAt: [number, number, number] } {
  const nx = Math.sin(rotY);
  const nz = Math.cos(rotY);
  return {
    camPos: [easelPos[0] + nx * distance, 1.42, easelPos[2] + nz * distance],
    lookAt: [easelPos[0], 1.28, easelPos[2]],
  };
}

export function buildTourStations({
  themeId,
  photoCount,
  events,
}: {
  themeId: Walkthrough3DTemplateId;
  photoCount: number;
  events: WalkthroughEventBoardItem[];
}): TourStation[] {
  const theme = walkthrough3DTheme(themeId);
  const standeeX = theme.standeeSide === 'left' ? -0.58 : 0.58;
  const { shownPhotos, shownEvents, eventZStart, stageZ } = computeLayoutZ(photoCount, events.length);

  const list: TourStation[] = [
    {
      id: 'gate',
      label: 'Cổng cưới',
      kind: 'gate',
      camPos: [0, 1.88, 2.8],
      lookAt: [0, 2.05, -8.5],
    },
    {
      id: 'couple',
      label: 'Cô dâu chú rể',
      kind: 'couple',
      camPos: [standeeX * 0.18, 1.58, STANDEE_Z + 4.35],
      lookAt: [standeeX * 0.62, 1.36, STANDEE_Z],
    },
    {
      id: 'welcome',
      label: 'Lời chào',
      kind: 'welcome',
      isEaselCloseUp: true,
      ...easelCamPose(WELCOME_POS, WELCOME_ROT_Y, 2.86),
    },
  ];

  for (let i = 0; i < shownPhotos; i++) {
    const z = PHOTO_Z_START - i * PHOTO_Z_STEP;
    const side = i % 2 === 0 ? 1 : -1;
    const x = side * 2.28;
    const rotY = side * -1.08;
    list.push({
      id: `photo-${i}`,
      label: `Kỷ niệm ${i + 1}/${shownPhotos}`,
      kind: 'photo',
      photoIndex: i,
      isEaselCloseUp: true,
      ...easelCamPose([x, 0, z], rotY, 2.86),
    });
  }

  for (let i = 0; i < shownEvents; i++) {
    const ev = events[i];
    const z = eventZStart - i * EVENT_Z_STEP;
    const side = (shownPhotos + i) % 2 === 0 ? 1 : -1;
    const x = side * 2.28;
    const rotY = side * -1.08;
    list.push({
      id: `event-${ev.id}`,
      label: ev.stationLabel,
      kind: 'event',
      eventIndex: i,
      isEaselCloseUp: true,
      ...easelCamPose([x, 0, z], rotY, 2.88),
    });
  }

  list.push({
    id: 'stage',
    label: 'Lễ đài',
    kind: 'stage',
    camPos: [0, 2.05, stageZ + 9.2],
    lookAt: [0, 2.88, stageZ],
  });

  return list;
}

function useLoadedTexture(
  url: string | undefined,
  opts?: { repeatX?: number; repeatY?: number; mirrorWrapS?: boolean },
) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const rx = opts?.repeatX ?? 1;
  const ry = opts?.repeatY ?? 1;
  const mirrorWrapS = opts?.mirrorWrapS ?? false;

  useEffect(() => {
    if (!url) {
      setTex(null);
      return;
    }
    let alive = true;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const loaded = loader.load(
      url,
      (t) => {
        if (!alive) {
          t.dispose();
          return;
        }
        t.colorSpace = THREE.SRGBColorSpace;
        if (mirrorWrapS) {
          t.wrapS = THREE.MirroredRepeatWrapping;
          t.wrapT = THREE.ClampToEdgeWrapping;
          t.repeat.set(rx, ry);
        } else if (rx !== 1 || ry !== 1) {
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.repeat.set(rx, ry);
        }
        t.anisotropy = IS_HANDHELD ? 2 : 4;
        t.needsUpdate = true;
        setTex(t);
      },
      undefined,
      () => {
        if (alive) setTex(null);
      },
    );
    return () => {
      alive = false;
      loaded.dispose();
    };
  }, [url, rx, ry, mirrorWrapS]);

  return tex;
}

/** Ornate corner filigree for Welcome board */
function drawCornerFiligree(ctx: CanvasRenderingContext2D, w: number, h: number, gold: string, flower: string) {
  ctx.strokeStyle = gold;
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, w - 48, h - 48);
  ctx.lineWidth = 1.6;
  ctx.strokeRect(36, 36, w - 72, h - 72);

  const corners: Array<[number, number, number, number]> = [
    [34, 34, 1, 1],
    [w - 34, 34, -1, 1],
    [34, h - 34, 1, -1],
    [w - 34, h - 34, -1, -1],
  ];

  for (const [cx, cy, sx, sy] of corners) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(sx, sy);

    ctx.strokeStyle = gold;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 74);
    ctx.quadraticCurveTo(0, 12, 64, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(24, 24, 11, 0, Math.PI * 1.5);
    ctx.stroke();

    ctx.fillStyle = flower;
    const pts = [
      [18, 18, 12],
      [42, 12, 8],
      [12, 42, 8],
    ];
    for (const [fx, fy, r] of pts) {
      ctx.beginPath();
      ctx.arc(fx, fy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = gold;
      ctx.beginPath();
      ctx.arc(fx, fy, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = flower;
    }
    ctx.restore();
  }
}

/** Painterly floral corner bouquet (blush/ivory roses + eucalyptus leaves) matching @thiepcuoitiec3d Event Boards */
function drawFloralCornerBouquet(ctx: CanvasRenderingContext2D, x: number, y: number, flipX: number, flipY: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flipX, flipY);

  // Soft eucalyptus foliage leaves
  const leaves: Array<[number, number, number, number, number, string]> = [
    [65, 18, 34, 13, 0.35, '#4b6b59'],
    [102, 42, 30, 12, 0.6, '#5c7f6a'],
    [24, 72, 32, 13, 1.15, '#4b6b59'],
    [45, 108, 28, 11, 1.4, '#6b8e78'],
    [95, 86, 26, 10, 0.9, '#3d5a4a'],
  ];
  for (const [lx, ly, rx, ry, rot, col] of leaves) {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(rot);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Layered rose blooms
  const roses: Array<[number, number, number, string, string]> = [
    [34, 34, 28, '#f2b8c6', '#d47c93'],
    [76, 36, 22, '#fff5eb', '#e8ccb3'],
    [38, 78, 21, '#fff5eb', '#e8ccb3'],
    [68, 72, 16, '#f6cad5', '#cf7f94'],
    [16, 16, 15, '#fbe4ea', '#d697a8'],
  ];
  for (const [rx, ry, r, outer, inner] of roses) {
    ctx.fillStyle = outer;
    ctx.beginPath();
    ctx.arc(rx, ry, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = inner;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(rx, ry, r * 0.62, 0.2, Math.PI * 1.75);
    ctx.stroke();
    ctx.fillStyle = inner;
    ctx.beginPath();
    ctx.arc(rx, ry, r * 0.26, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Dynamic Welcome Card printed onto WelcomeEasel at Station "Lời chào" */
function makeWelcomeBoardCanvasTexture(
  guestName: string,
  bride: string,
  groom: string,
  dateText: string,
  subtitle: string,
  theme: Walkthrough3DTheme,
): THREE.CanvasTexture {
  const w = 768;
  const h = 960;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const pal = theme.welcomeBoard;

  const grad = ctx.createRadialGradient(w / 2, h * 0.42, 60, w / 2, h / 2, h * 0.68);
  grad.addColorStop(0, pal.bgTop);
  grad.addColorStop(1, pal.bgBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  drawCornerFiligree(ctx, w, h, pal.gold, pal.flower);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.42)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = pal.text;
  ctx.font = 'italic 600 84px "Imperial Script", "Dancing Script", Georgia, serif';
  ctx.fillText('Kính chào', w / 2, 232);

  ctx.fillStyle = '#fff5da';
  ctx.font = '700 58px "Cormorant Garamond", "Playfair Display", Georgia, serif';
  ctx.fillText(guestName.trim() || 'Quý khách', w / 2, 344, 620);

  ctx.fillStyle = pal.sub;
  ctx.font = 'italic 500 30px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(subtitle || 'đến dự lễ thành hôn của', w / 2, 434, 620);

  ctx.fillStyle = pal.text;
  ctx.font = 'italic 600 66px "Imperial Script", "Dancing Script", Georgia, serif';
  ctx.fillText(`${bride} & ${groom}`, w / 2, 548, 650);

  ctx.fillStyle = pal.gold;
  ctx.fillRect(w / 2 - 90, 646, 180, 2);
  ctx.beginPath();
  ctx.arc(w / 2, 647, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fdecc2';
  ctx.font = '600 34px "Cormorant Garamond", "Be Vietnam Pro", serif';
  ctx.fillText(dateText, w / 2, 726);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = IS_HANDHELD ? 2 : 4;
  tex.needsUpdate = true;
  return tex;
}

/** Luxury Dark-Velvet & Gold Floral Event Board ("Thông tin tiệc", "Lễ Vu Quy", "Lễ Thành Hôn") */
function makeEventBoardCanvasTexture(event: WalkthroughEventBoardItem, theme: Walkthrough3DTheme): THREE.CanvasTexture {
  const w = 768;
  const h = 960;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;

  const grad = ctx.createRadialGradient(w / 2, h * 0.38, 40, w / 2, h / 2, h * 0.72);
  grad.addColorStop(0, '#1d1a26');
  grad.addColorStop(1, '#0d0c12');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Sleek gold double hairline frame
  ctx.strokeStyle = theme.accentGold;
  ctx.lineWidth = 3.5;
  ctx.strokeRect(22, 22, w - 44, h - 44);
  ctx.strokeStyle = 'rgba(245, 215, 145, 0.45)';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(32, 32, w - 64, h - 64);

  // Top-right & bottom-left rose bouquets matching @thiepcuoitiec3d Event Board
  drawFloralCornerBouquet(ctx, w - 26, 26, -1, 1);
  drawFloralCornerBouquet(ctx, 26, h - 26, 1, -1);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#d4bc8c';
  ctx.font = '600 24px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillText(event.kicker.toUpperCase(), w / 2, 128, 520);

  ctx.fillStyle = '#f8dfaa';
  ctx.font = 'italic 600 72px "Imperial Script", "Dancing Script", Georgia, serif';
  ctx.fillText(event.title, w / 2, 212, 580);

  // Huge bold clock time (e.g. "18:00")
  ctx.fillStyle = '#fff9ec';
  ctx.font = '700 92px "Cormorant Garamond", "Playfair Display", Georgia, serif';
  ctx.fillText(event.timeText, w / 2, 336, 560);

  // Solar date
  ctx.fillStyle = '#efe2c8';
  ctx.font = '600 27px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillText(event.solarDateText.toUpperCase(), w / 2, 426, 620);

  // Lunar date
  if (event.lunarDateText) {
    ctx.fillStyle = '#d8c5a3';
    ctx.font = 'italic 500 24px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(`Nhằm ngày ${event.lunarDateText}`, w / 2, 474, 620);
  }

  // Gold divider
  ctx.fillStyle = 'rgba(243, 211, 152, 0.55)';
  ctx.fillRect(w / 2 - 90, 524, 180, 1.8);

  // Venue name
  ctx.fillStyle = '#fff5dc';
  ctx.font = '700 38px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(event.venueName || 'Địa điểm tổ chức', w / 2, 586, 610);

  // Address wrapped up to 2 lines
  ctx.fillStyle = '#d7cab6';
  ctx.font = '500 24px "Be Vietnam Pro", system-ui, sans-serif';
  const words = (event.address || '').split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(test).width > 560 && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  lines.slice(0, 2).forEach((line, i) => {
    ctx.fillText(line, w / 2, 650 + i * 36, 580);
  });

  // Note & dress code
  if (event.note) {
    ctx.fillStyle = '#f3d494';
    ctx.font = '600 25px "Be Vietnam Pro", system-ui, sans-serif';
    ctx.fillText(event.note, w / 2, 756, 560);
  }
  if (event.dressCode) {
    ctx.fillStyle = '#bfb3a0';
    ctx.font = 'italic 500 22px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(`Trang phục: ${event.dressCode}`, w / 2, 816, 520);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = IS_HANDHELD ? 2 : 4;
  tex.needsUpdate = true;
  return tex;
}

function makePathCanvasTexture(style: PathStyle3D, accentGold: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;

  if (style === 'red-carpet' || style === 'brick-red-carpet' || style === 'royal-blue-carpet' || style === 'blush-carpet') {
    const base =
      style === 'royal-blue-carpet'
        ? ['#243470', '#1d2b5e']
        : style === 'blush-carpet'
          ? ['#fcf2f5', '#f3dee5']
          : ['#8f141d', '#730e16'];
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, base[1]);
    grad.addColorStop(0.5, base[0]);
    grad.addColorStop(1, base[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = style === 'blush-carpet' ? 'rgba(180,120,140,0.05)' : 'rgba(255,255,255,0.035)';
    for (let y = 0; y < 512; y += 6) ctx.fillRect(0, y, 512, 2);

    ctx.fillStyle = accentGold;
    ctx.fillRect(14, 0, 10, 512);
    ctx.fillRect(32, 0, 4, 512);
    ctx.fillRect(488, 0, 10, 512);
    ctx.fillRect(476, 0, 4, 512);

    const petalColor =
      style === 'royal-blue-carpet'
        ? 'rgba(246,216,149,0.55)'
        : style === 'blush-carpet'
          ? 'rgba(225,130,160,0.5)'
          : 'rgba(252,216,162,0.48)';
    ctx.fillStyle = petalColor;
    for (let i = 0; i < 36; i++) {
      const px = 48 + ((i * 137) % 416);
      const py = (i * 89) % 512;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate((i * 1.1) % Math.PI);
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (style === 'cloud-aisle') {
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, '#f3ddf0');
    grad.addColorStop(0.18, '#ffffff');
    grad.addColorStop(0.82, '#ffffff');
    grad.addColorStop(1, '#f3ddf0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = accentGold;
    ctx.fillRect(18, 0, 7, 512);
    ctx.fillRect(487, 0, 7, 512);
  } else {
    ctx.fillStyle = '#5a3f2d';
    ctx.fillRect(0, 0, 512, 512);
    const plankCount = 12;
    const ph = 512 / plankCount;
    for (let i = 0; i < plankCount; i++) {
      const shade = 75 + ((i * 19) % 24);
      ctx.fillStyle = `rgb(${shade + 28}, ${shade + 2}, ${shade - 16})`;
      ctx.fillRect(6, i * ph + 2, 500, ph - 4);
      ctx.fillStyle = 'rgba(255,235,210,0.08)';
      ctx.fillRect(8, i * ph + 4, 496, 3);
    }
    ctx.fillStyle = '#473022';
    ctx.fillRect(0, 0, 20, 512);
    ctx.fillRect(492, 0, 20, 512);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 14);
  tex.anisotropy = IS_HANDHELD ? 2 : 4;
  return tex;
}

function makePlaqueCanvasTexture(groom: string, bride: string, dateText: string, theme: Walkthrough3DTheme): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 768;
  c.height = 420;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, c.width, c.height);

  const scriptFamily = theme.plaque.useScript ? '"Imperial Script", "Dancing Script", "Playfair Display", Georgia, serif' : '"Playfair Display", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (theme.plaque.hasShadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
  }

  ctx.fillStyle = theme.plaque.textColor;
  ctx.font = `italic 600 68px ${scriptFamily}`;
  ctx.fillText(bride, c.width / 2, 118, 680);

  ctx.font = `italic 500 42px ${scriptFamily}`;
  ctx.fillText('&', c.width / 2, 186);

  ctx.font = `italic 600 68px ${scriptFamily}`;
  ctx.fillText(groom, c.width / 2, 254, 680);

  ctx.fillStyle = theme.plaque.subColor;
  ctx.font = '600 30px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillText(dateText, c.width / 2, 342, 640);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeShadowDiscTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
  g.addColorStop(0, 'rgba(15, 8, 12, 0.48)');
  g.addColorStop(1, 'rgba(15, 8, 12, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/** Authentic 3D Wooden Tripod Easel shared by Welcome Board, Photo Frames & Event Boards */
function OrnateEaselFrame({
  position,
  rotationY,
  texture,
  matBoard = false,
  onSelect,
}: {
  position: [number, number, number];
  rotationY: number;
  texture: THREE.Texture | null;
  matBoard?: boolean;
  onSelect?: () => void;
}) {
  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={(e) => {
        if (!onSelect) return;
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Tripod legs leaning backward cleanly behind the gold molding */}
      <mesh position={[-0.31, 1.08, -0.08]} rotation={[-0.06, 0, -0.14]}>
        <boxGeometry args={[0.052, 2.26, 0.052]} />
        <meshStandardMaterial color="#734b2f" roughness={0.78} />
      </mesh>
      <mesh position={[0.31, 1.08, -0.08]} rotation={[-0.06, 0, 0.14]}>
        <boxGeometry args={[0.052, 2.26, 0.052]} />
        <meshStandardMaterial color="#734b2f" roughness={0.78} />
      </mesh>
      <mesh position={[0, 1.02, -0.4]} rotation={[-0.26, 0, 0]}>
        <boxGeometry args={[0.05, 2.18, 0.05]} />
        <meshStandardMaterial color="#593822" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.2, -0.07]} rotation={[-0.06, 0, 0]}>
        <boxGeometry args={[0.058, 2.18, 0.045]} />
        <meshStandardMaterial color="#6b442a" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.42, -0.02]}>
        <boxGeometry args={[0.74, 0.045, 0.045]} />
        <meshStandardMaterial color="#6b442a" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.78, 0.09]}>
        <boxGeometry args={[1.08, 0.055, 0.1]} />
        <meshStandardMaterial color="#7a5134" roughness={0.72} />
      </mesh>

      {/* Tilted Gold Frame + Artwork */}
      <group position={[0, 1.44, 0.1]} rotation={[-0.06, 0, 0]}>
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[1.02, 1.26, 0.042]} />
          <meshStandardMaterial color="#d4ad63" roughness={0.4} metalness={0.42} />
        </mesh>
        {matBoard && (
          <mesh position={[0, 0, 0.004]}>
            <planeGeometry args={[0.92, 1.16]} />
            <meshBasicMaterial color="#f6efe2" toneMapped={false} />
          </mesh>
        )}
        <mesh position={[0, 0, matBoard ? 0.012 : 0.009]}>
          <planeGeometry args={matBoard ? [0.82, 1.06] : [0.95, 1.19]} />
          <meshBasicMaterial
            key={texture?.uuid ?? 'easel-empty'}
            map={texture ?? undefined}
            color={texture ? '#ffffff' : '#f3e7d8'}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

function PhotoEasel({
  position,
  rotationY,
  photoUrl,
  onSelect,
}: {
  position: [number, number, number];
  rotationY: number;
  photoUrl: string;
  onSelect: () => void;
}) {
  const photoTex = useLoadedTexture(photoUrl);
  return <OrnateEaselFrame position={position} rotationY={rotationY} texture={photoTex} matBoard onSelect={onSelect} />;
}

function EventEasel({
  position,
  rotationY,
  event,
  theme,
  fontsReady,
  onSelect,
}: {
  position: [number, number, number];
  rotationY: number;
  event: WalkthroughEventBoardItem;
  theme: Walkthrough3DTheme;
  fontsReady: number;
  onSelect: () => void;
}) {
  const tex = useMemo(
    () => makeEventBoardCanvasTexture(event, theme),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [event, theme, fontsReady],
  );
  useEffect(() => () => tex.dispose(), [tex]);
  return <OrnateEaselFrame position={position} rotationY={rotationY} texture={tex} onSelect={onSelect} />;
}

function WillowTree3D({ position, scale = 1, tint = '#2b4a3e' }: { position: [number, number, number]; scale?: number; tint?: string }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.16, 0.28, 3.6, 8]} />
        <meshStandardMaterial color="#3c2b21" roughness={0.92} />
      </mesh>
      {[
        [0, 4.1, 0, 1.45],
        [-0.95, 3.6, 0.4, 1.1],
        [0.95, 3.55, -0.35, 1.12],
        [0.2, 3.7, 0.9, 1.05],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <dodecahedronGeometry args={[r, 0]} />
          <meshStandardMaterial color={tint} roughness={0.85} />
        </mesh>
      ))}
      {[-1.1, -0.55, 0, 0.55, 1.1].map((fx, i) => (
        <mesh key={fx} position={[fx, 2.35 + (i % 2) * 0.2, i % 2 === 0 ? 0.55 : -0.35]}>
          <cylinderGeometry args={[0.04, 0.24, 2.75, 6]} />
          <meshStandardMaterial color="#375d4d" roughness={0.88} />
        </mesh>
      ))}
    </group>
  );
}

function ScenicTree3D({
  position,
  scale = 1,
  foliageColor,
  conical = false,
}: {
  position: [number, number, number];
  scale?: number;
  foliageColor: string;
  conical?: boolean;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.14, 0.22, 2.8, 7]} />
        <meshStandardMaterial color="#422d1f" roughness={0.9} />
      </mesh>
      {conical ? (
        <>
          <mesh position={[0, 2.6, 0]}>
            <coneGeometry args={[1.3, 2.2, 8]} />
            <meshStandardMaterial color={foliageColor} roughness={0.85} />
          </mesh>
          <mesh position={[0, 3.7, 0]}>
            <coneGeometry args={[0.95, 1.8, 8]} />
            <meshStandardMaterial color={foliageColor} roughness={0.85} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 3.2, 0]}>
            <dodecahedronGeometry args={[1.3, 0]} />
            <meshStandardMaterial color={foliageColor} roughness={0.85} />
          </mesh>
          <mesh position={[-0.7, 2.9, 0.35]}>
            <dodecahedronGeometry args={[0.88, 0]} />
            <meshStandardMaterial color={foliageColor} roughness={0.85} />
          </mesh>
          <mesh position={[0.75, 2.95, -0.3]}>
            <dodecahedronGeometry args={[0.92, 0]} />
            <meshStandardMaterial color={foliageColor} roughness={0.85} />
          </mesh>
        </>
      )}
    </group>
  );
}

function LotusCluster3D({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[0.42, 12]} />
        <meshStandardMaterial color="#234d39" roughness={0.6} />
      </mesh>
      <group position={[0.1, 0.04, 0.05]}>
        <mesh>
          <cylinderGeometry args={[0.2, 0.12, 0.12, 8]} />
          <meshBasicMaterial color="#f57ea1" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshBasicMaterial color="#ffe28a" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function PavilionHorizon3D({ position, rotY }: { position: [number, number, number]; rotY: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[2.6, 1.5, 2.0]} />
        <meshBasicMaterial color="#201e3b" />
      </mesh>
      <mesh position={[0, 0.78, 1.02]}>
        <planeGeometry args={[1.65, 0.92]} />
        <meshBasicMaterial color="#ffcf78" toneMapped={false} />
      </mesh>
      <mesh position={[0, 2.05, 0]}>
        <coneGeometry args={[2.15, 0.95, 4]} />
        <meshBasicMaterial color="#18162e" />
      </mesh>
      <mesh position={[0, 2.75, 0]}>
        <coneGeometry args={[1.35, 0.72, 4]} />
        <meshBasicMaterial color="#18162e" />
      </mesh>
    </group>
  );
}

function ThemeSurroundScenery({ theme }: { theme: Walkthrough3DTheme }) {
  const treePositions: Array<[number, number, number, number]> = [
    [-5.1, 0, -13.6, 1.2],
    [5.1, 0, -14.8, 1.15],
    [-5.2, 0, -18.5, 1.25],
    [5.2, 0, -20.2, 1.2],
    [-5.3, 0, -23.8, 1.2],
    [5.2, 0, -25.8, 1.22],
    [-5.2, 0, -29.8, 1.25],
    [5.3, 0, -31.8, 1.15],
    [-5.3, 0, -35.8, 1.2],
    [5.3, 0, -37.8, 1.2],
    [-9.5, 0, -15.5, 1.35],
    [9.5, 0, -21.5, 1.35],
    [-9.8, 0, -27.0, 1.4],
    [9.2, 0, -33.0, 1.3],
  ];

  const waterTex = useMemo(() => {
    if (!theme.hasWaterSurface) return null;
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#272f72');
    g.addColorStop(0.5, '#1e265c');
    g.addColorStop(1, '#272f72');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = 'rgba(148, 163, 248, 0.08)';
    for (let i = 0; i < 42; i++) {
      const rx = (i * 53) % 256;
      const ry = (i * 37) % 256;
      ctx.fillRect(rx, ry, 28 + (i % 24), 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(16, 16);
    return t;
  }, [theme.hasWaterSurface]);
  useEffect(() => () => waterTex?.dispose(), [waterTex]);

  const isWillow = theme.id === '3d-ho-sen-hoa-dang' || theme.id === '3d-vuon-hoa-dao' || theme.id === '3d-rap-cuoi';
  const isConical = theme.id === '3d-rung-thong' || theme.id === '3d-mua-dong-tuyet';
  const foliageColor =
    theme.id === '3d-mua-thu'
      ? '#c94c1a'
      : theme.id === '3d-vuon-hoa-dao' || theme.id === '3d-rap-cuoi'
        ? '#f49ebb'
        : theme.id === '3d-oai-huong'
          ? '#6f548c'
          : theme.id === '3d-mua-dong-tuyet'
            ? '#38575c'
            : theme.id === '3d-rung-thong'
              ? '#2f5934'
              : '#36584b';

  return (
    <group>
      {(theme.hasWaterSurface || theme.id === '3d-co-truyen' || theme.id === '3d-dem-trang') && (
        <group>
          <PavilionHorizon3D position={[-20, 0.1, -13]} rotY={1.1} />
          <PavilionHorizon3D position={[21, 0.1, -18]} rotY={-1.15} />
          <PavilionHorizon3D position={[-19, 0.1, -28]} rotY={0.85} />
          <PavilionHorizon3D position={[20, 0.1, -35]} rotY={-0.95} />
        </group>
      )}

      {theme.id !== '3d-tren-may' &&
        treePositions.map(([x, y, z, s], idx) =>
          isWillow ? (
            <WillowTree3D
              key={idx}
              position={[x, y, z]}
              scale={s}
              tint={theme.id === '3d-vuon-hoa-dao' ? '#c96f8f' : '#2b4a3e'}
            />
          ) : (
            <ScenicTree3D
              key={idx}
              position={[x, y, z]}
              scale={s}
              foliageColor={idx % 2 === 0 ? foliageColor : '#4f6d42'}
              conical={isConical}
            />
          ),
        )}

      {theme.hasWaterSurface && (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.16, -22]}>
            <planeGeometry args={[112, 112]} />
            <meshBasicMaterial
              key={waterTex?.uuid ?? 'water-flat'}
              map={waterTex ?? undefined}
              color="#ffffff"
              toneMapped={false}
            />
          </mesh>
          {[
            [-2.4, -0.1, -11.5],
            [2.6, -0.1, -12.8],
            [-3.9, -0.1, -15.4],
            [3.9, -0.1, -17.2],
            [-3.7, -0.1, -20.0],
            [3.8, -0.1, -22.4],
            [-3.8, -0.1, -25.2],
            [3.9, -0.1, -28.0],
            [-4.1, -0.1, -31.2],
            [3.8, -0.1, -34.2],
            [-3.9, -0.1, -37.2],
            [2.1, -0.1, -15.2],
            [-2.2, -0.1, -22.0],
            [2.2, -0.1, -26.5],
          ].map((pos, idx) => (
            <LotusCluster3D key={idx} position={pos as [number, number, number]} />
          ))}
        </group>
      )}
    </group>
  );
}

function SeasonalParticles({ kind }: { kind: Walkthrough3DTheme['particleKind'] }) {
  const count = IS_HANDHELD ? 75 : 135;
  const pointsRef = useRef<THREE.Points>(null);

  const { geometry, speeds, rise } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sp = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (((i * 37) % 100) / 100 - 0.5) * 18;
      pos[i * 3 + 1] = ((i * 53) % 100) / 100 * 8.2 + 0.3;
      pos[i * 3 + 2] = -(((i * 79) % 100) / 100) * 44 + 3;
      sp[i] = 0.4 + ((i * 23) % 10) * 0.08;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const isRising = kind === 'lotus-glow' || kind === 'stardust-fireworks';
    return { geometry: geo, speeds: sp, rise: isRising };
  }, [count, kind]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const color =
    kind === 'lavender'
      ? '#e2c2f8'
      : kind === 'snow'
        ? '#ffffff'
        : kind === 'maple'
          ? '#f57836'
          : kind === 'lotus-glow'
            ? '#ffcf70'
            : kind === 'pine-mist'
              ? '#edf5dc'
              : kind === 'stardust-fireworks'
                ? '#ffe099'
                : kind === 'cloud-petals' || kind === 'peach-petals' || kind === 'blush-petals'
                  ? '#ffc2d6'
                  : '#f6cf78';

  useFrame(({ clock }, delta) => {
    const pts = pointsRef.current;
    if (!pts) return;
    const posAttr = pts.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const dt = Math.min(0.05, delta);
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      arr[idx] += Math.sin(t * 0.9 + i) * 0.25 * dt;
      if (rise) {
        arr[idx + 1] += speeds[i] * 0.45 * dt;
        if (arr[idx + 1] > 8.6) arr[idx + 1] = 0.25;
      } else {
        arr[idx + 1] -= speeds[i] * 0.55 * dt;
        if (arr[idx + 1] < 0.1) arr[idx + 1] = 8.4;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color={color}
        size={kind === 'snow' || kind === 'stardust-fireworks' ? 0.13 : 0.15}
        transparent
        opacity={0.86}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/** Themed side decorations placed outside easel sightlines so they never block photos */
function ThemeSideDecor({ theme }: { theme: Walkthrough3DTheme }) {
  const placements: Array<{ z: number; xOffset: number }> = [
    { z: -2.4, xOffset: 2.3 },
    { z: -8.4, xOffset: 2.3 },
    { z: -15.5, xOffset: 3.85 },
    { z: -20.5, xOffset: 3.85 },
    { z: -25.5, xOffset: 3.85 },
    { z: -30.5, xOffset: 3.85 },
    { z: -35.5, xOffset: 3.85 },
  ];

  if (theme.hasWaterSurface) return null;

  return (
    <group>
      {theme.hasMarqueeRoof && (
        <group position={[0, 5.3, -20]}>
          {[-2.8, -1.4, 0, 1.4, 2.8].map((rx, idx) => (
            <mesh key={rx} position={[rx, 0.18 * (idx % 2 === 0 ? 1 : -1), 0]} rotation={[0, 0, rx * -0.06]}>
              <planeGeometry args={[1.65, 48]} />
              <meshBasicMaterial
                color={idx % 2 === 0 ? '#f7d8e2' : '#fff8fa'}
                transparent
                opacity={0.78}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
        </group>
      )}

      {placements.map(({ z: zPos, xOffset }) => (
        <React.Fragment key={zPos}>
          {[-xOffset, xOffset].map((xPos, sideIdx) => (
            <group key={`${zPos}-${sideIdx}`} position={[xPos, 0, zPos]}>
              {theme.sidePropKind === 'peach-traps' || theme.sidePropKind === 'dragon-traps-mist' ? (
                <group>
                  <mesh position={[0, 0.22, 0]}>
                    <cylinderGeometry args={[0.3, 0.32, 0.36, 16]} />
                    <meshStandardMaterial color="#a9141d" roughness={0.45} />
                  </mesh>
                  <mesh position={[0, 0.42, 0]}>
                    <cylinderGeometry args={[0.33, 0.33, 0.06, 16]} />
                    <meshStandardMaterial color="#e8be66" roughness={0.35} metalness={0.4} />
                  </mesh>
                </group>
              ) : theme.sidePropKind === 'marquee-tables' ? (
                <group>
                  <mesh position={[0, 0.45, 0]}>
                    <cylinderGeometry args={[0.52, 0.65, 0.9, 16]} />
                    <meshStandardMaterial color="#fff3f7" roughness={0.85} />
                  </mesh>
                  <mesh position={[0, 0.92, 0]}>
                    <cylinderGeometry args={[0.53, 0.53, 0.08, 16]} />
                    <meshStandardMaterial color="#f2a8c0" roughness={0.6} />
                  </mesh>
                </group>
              ) : theme.sidePropKind === 'cloud-lamps' || theme.sidePropKind === 'floating-islands' ? (
                <mesh position={[0, 0.16, 0]} scale={[1.15, 0.5, 0.8]}>
                  <sphereGeometry args={[0.48, 10, 8]} />
                  <meshBasicMaterial color={theme.sidePropKind === 'floating-islands' ? '#fbe7f3' : '#cfd8f5'} />
                </mesh>
              ) : (
                <group>
                  <mesh position={[0, 0.72, 0]}>
                    <cylinderGeometry args={[0.032, 0.044, 1.44, 8]} />
                    <meshStandardMaterial color="#2a221f" roughness={0.7} />
                  </mesh>
                  <mesh position={[0, 1.5, 0]}>
                    <cylinderGeometry args={[0.1, 0.08, 0.22, 6]} />
                    <meshBasicMaterial color="#ffe094" toneMapped={false} />
                  </mesh>
                  <mesh position={[0, 1.65, 0]}>
                    <coneGeometry args={[0.15, 0.11, 6]} />
                    <meshStandardMaterial color="#2a221f" roughness={0.65} />
                  </mesh>
                </group>
              )}
            </group>
          ))}
        </React.Fragment>
      ))}
    </group>
  );
}

/** Cinematic Bezier Camera Flight + Close-Up Zoom Focus + Virtual Joystick Free-Roam */
function CameraDirector({
  stations,
  stationIndex,
  stationRevision,
  inspectFocused,
  stageZ,
  joystickRef,
  freeWalkActive,
  onEnterFreeWalk,
}: {
  stations: TourStation[];
  stationIndex: number;
  stationRevision: number;
  inspectFocused: boolean;
  stageZ: number;
  joystickRef: React.MutableRefObject<JoystickInput>;
  freeWalkActive: boolean;
  onEnterFreeWalk: () => void;
}) {
  const { camera, gl, size } = useThree();
  const keysRef = useRef<Set<string>>(new Set());

  const flight = useRef({
    active: false,
    t: 1,
    duration: 1.38,
    fromPos: new THREE.Vector3(0, 1.88, 2.8),
    midPos: new THREE.Vector3(0, 1.88, 0),
    toPos: new THREE.Vector3(0, 1.88, 2.8),
    fromQuat: new THREE.Quaternion(),
    toQuat: new THREE.Quaternion(),
  });

  const scratchMat = useMemo(() => new THREE.Matrix4(), []);
  const scratchVecA = useMemo(() => new THREE.Vector3(), []);
  const scratchVecB = useMemo(() => new THREE.Vector3(), []);
  const scratchVecC = useMemo(() => new THREE.Vector3(), []);
  const scratchFwd = useMemo(() => new THREE.Vector3(), []);
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, 'YXZ'), []);

  const targetStation = stations[Math.min(stations.length - 1, Math.max(0, stationIndex))] ?? stations[0];

  const resolvePose = (st: TourStation, zoomed: boolean) => {
    const aspect = size.width / Math.max(1, size.height);
    const look = new THREE.Vector3(...st.lookAt);
    const pos = new THREE.Vector3(...st.camPos);
    if (st.isEaselCloseUp) {
      const dir = pos.clone().sub(look);
      const len = dir.length() || 1;
      dir.divideScalar(len);
      const extraD = aspect < 0.85 ? (0.85 - aspect) * 2.25 : 0;
      const finalLen = zoomed ? Math.max(1.88, (len + extraD) * 0.78) : len + extraD;
      pos.copy(look).addScaledVector(dir, finalLen);
      if (zoomed) {
        // Shift camera aim slightly lower so the framed photo rises into the upper half above the slide-up story card
        look.y -= 0.34;
        pos.y -= 0.16;
      }
    }
    return { pos, look };
  };

  const firstMount = useRef(true);
  useEffect(() => {
    if (!targetStation) return;
    const { pos: destPos, look: destLook } = resolvePose(targetStation, inspectFocused);
    scratchMat.lookAt(destPos, destLook, camera.up);
    const destQuat = new THREE.Quaternion().setFromRotationMatrix(scratchMat);

    if (firstMount.current) {
      firstMount.current = false;
      camera.position.copy(destPos);
      camera.quaternion.copy(destQuat);
      flight.current.active = false;
      flight.current.t = 1;
      return;
    }

    const fromPos = camera.position.clone();
    const dist = fromPos.distanceTo(destPos);
    // Short zoom-in/out glides straight without swinging out to the center; station-to-station arcs cleanly around easels
    const isShortZoom = dist < 1.85;
    const midX = isShortZoom ? (fromPos.x + destPos.x) * 0.5 : THREE.MathUtils.lerp((fromPos.x + destPos.x) * 0.5, 0, 0.68);
    const midY = isShortZoom ? (fromPos.y + destPos.y) * 0.5 : Math.max(fromPos.y, destPos.y) + 0.14;
    const midZ = (fromPos.z + destPos.z) * 0.5;

    flight.current = {
      active: true,
      t: 0,
      duration: isShortZoom ? 0.65 : 1.38,
      fromPos,
      midPos: new THREE.Vector3(midX, midY, midZ),
      toPos: destPos,
      fromQuat: camera.quaternion.clone(),
      toQuat: destQuat,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationIndex, stationRevision, inspectFocused]);

  useEffect(() => {
    const dom = gl.domElement;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      if (Math.abs(dx) + Math.abs(dy) < 1.5) return;
      if (!freeWalkActive) onEnterFreeWalk();
      flight.current.active = false;
      euler.setFromQuaternion(camera.quaternion, 'YXZ');
      euler.y -= dx * 0.0042;
      euler.x = THREE.MathUtils.clamp(euler.x - dy * 0.0032, -0.55, 0.65);
      camera.quaternion.setFromEuler(euler);
    };
    const onUp = () => {
      dragging = false;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        keysRef.current.add(k);
        if (!freeWalkActive) onEnterFreeWalk();
        flight.current.active = false;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    dom.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      dom.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [camera, euler, freeWalkActive, gl.domElement, onEnterFreeWalk]);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(0.05, delta);
    const joy = joystickRef.current;
    const keys = keysRef.current;

    const kForward = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0);
    const kTurn = (keys.has('a') || keys.has('arrowleft') ? 1 : 0) - (keys.has('d') || keys.has('arrowright') ? 1 : 0);
    const hasManualInput = joy.active || kForward !== 0 || kTurn !== 0;

    if (hasManualInput) {
      flight.current.active = false;
      const turnRate = (-joy.x * 1.65 + kTurn * 1.45) * dt;
      if (Math.abs(turnRate) > 0.0001) {
        euler.setFromQuaternion(camera.quaternion, 'YXZ');
        euler.y += turnRate;
        camera.quaternion.setFromEuler(euler);
      }
      const moveForward = -joy.y + kForward;
      if (Math.abs(moveForward) > 0.04) {
        camera.getWorldDirection(scratchFwd);
        scratchFwd.y = 0;
        if (scratchFwd.lengthSq() > 1e-4) scratchFwd.normalize();
        camera.position.addScaledVector(scratchFwd, moveForward * 3.6 * dt);
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, -3.2, 3.2);
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, stageZ + 3.2, 4.2);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.76, dt * 4);
      }
      return;
    }

    if (flight.current.active) {
      const f = flight.current;
      f.t = Math.min(1, f.t + dt / f.duration);
      const u = f.t < 0.5 ? 4 * f.t * f.t * f.t : 1 - Math.pow(-2 * f.t + 2, 3) / 2;
      const inv = 1 - u;

      scratchVecA.copy(f.fromPos).multiplyScalar(inv * inv);
      scratchVecB.copy(f.midPos).multiplyScalar(2 * inv * u);
      scratchVecC.copy(f.toPos).multiplyScalar(u * u);
      camera.position.copy(scratchVecA).add(scratchVecB).add(scratchVecC);
      camera.quaternion.slerpQuaternions(f.fromQuat, f.toQuat, u);

      if (f.t >= 1) f.active = false;
      return;
    }

    if (!freeWalkActive && targetStation) {
      const { pos } = resolvePose(targetStation, inspectFocused);
      camera.position.y = pos.y + Math.sin(clock.elapsedTime * 1.1) * 0.012;
    }
  });

  return null;
}

function WalkthroughInnerScene(props: WalkthroughSceneProps) {
  const {
    themeId,
    stations,
    stationIndex,
    stationRevision,
    inspectFocused,
    joystickRef,
    freeWalkActive,
    onEnterFreeWalk,
    groom,
    bride,
    dateIso,
    guestName,
    welcomeSubtitle,
    events,
    coupleCutoutUrl,
    photos,
    onInspectPhoto,
    onInspectEvent,
  } = props;
  const theme = walkthrough3DTheme(themeId);
  const { shownPhotos, shownEvents, eventZStart, stageZ } = useMemo(
    () => computeLayoutZ(photos.length, events.length),
    [photos.length, events.length],
  );

  // Dynamically stretch walkway curve cleanly all the way to stageZ
  const curve = useMemo(() => {
    const pts = theme.curvePoints.map(([x, y, z], i, arr) => {
      if (i === arr.length - 1) return new THREE.Vector3(x, y, stageZ + 2.6);
      const ratio = i / (arr.length - 1);
      return new THREE.Vector3(x, y, THREE.MathUtils.lerp(2.6, stageZ + 2.6, ratio));
    });
    return new THREE.CatmullRomCurve3(pts);
  }, [theme.curvePoints, stageZ]);

  const skyTex = useLoadedTexture(`/invitation-3d/${theme.slug}/sky.webp`, {
    mirrorWrapS: true,
    repeatX: 4,
    repeatY: 1,
  });
  const archTex = useLoadedTexture(`/invitation-3d/${theme.slug}/arch.webp`);
  const stageTex = useLoadedTexture(`/invitation-3d/${theme.slug}/stage.webp`);
  const standeeTex = useLoadedTexture(coupleCutoutUrl || `/invitation-3d/standees/standee-${theme.standee}.webp`);

  const pathTex = useMemo(() => makePathCanvasTexture(theme.pathStyle, theme.accentGold), [theme.pathStyle, theme.accentGold]);
  useEffect(() => () => pathTex.dispose(), [pathTex]);

  const shadowTex = useMemo(() => makeShadowDiscTexture(), []);
  useEffect(() => () => shadowTex.dispose(), [shadowTex]);

  const dateText = useMemo(() => formatShortDotsDate(dateIso), [dateIso]);
  const [fontsReady, setFontsReady] = useState(0);
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => {
      if (alive) setFontsReady((v) => v + 1);
    });
    return () => {
      alive = false;
    };
  }, []);

  const plaqueTex = useMemo(
    () => makePlaqueCanvasTexture(groom, bride, dateText, theme),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groom, bride, dateText, theme, fontsReady],
  );
  useEffect(() => () => plaqueTex.dispose(), [plaqueTex]);

  const welcomeTex = useMemo(
    () => makeWelcomeBoardCanvasTexture(guestName, bride, groom, dateText, welcomeSubtitle || 'đến dự lễ thành hôn của', theme),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [guestName, bride, groom, dateText, welcomeSubtitle, theme, fontsReady],
  );
  useEffect(() => () => welcomeTex.dispose(), [welcomeTex]);

  const pathGeo = useMemo(() => {
    const segs = 54;
    const width = theme.hasCircularPlaza ? 2.45 : 2.3;
    const halfW = width / 2;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= segs; i++) {
      const p = curve.getPointAt(i / segs);
      pts.push(new THREE.Vector3(p.x, 0.015, p.z));
    }
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= segs; i++) {
      const curr = pts[i];
      const next = pts[Math.min(segs, i + 1)];
      const prev = pts[Math.max(0, i - 1)];
      const tangent = new THREE.Vector3().subVectors(next, prev).normalize();
      const perp = new THREE.Vector3(-tangent.z, 0, tangent.x);
      const l = curr.clone().addScaledVector(perp, halfW);
      const r = curr.clone().addScaledVector(perp, -halfW);
      positions.push(l.x, l.y, l.z, r.x, r.y, r.z);
      const v = (i / segs) * 12;
      uvs.push(0, v, 1, v);
      if (i < segs) {
        const b = i * 2;
        indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [curve, theme.hasCircularPlaza]);
  useEffect(() => () => pathGeo.dispose(), [pathGeo]);

  const standeeX = theme.standeeSide === 'left' ? -0.58 : 0.58;
  const stageH = 6.9;
  const stageY = 3.3;
  const plaqueY = stageY + theme.plaque.y;
  const plaqueX = theme.plaque.x ?? 0;
  const easelPhotos = photos.slice(0, shownPhotos);
  const easelEvents = events.slice(0, shownEvents);

  return (
    <>
      <color attach="background" args={[theme.fogColor]} />
      <fog attach="fog" args={[theme.fogColor, theme.fogNear, theme.fogFar + 14]} />

      <ambientLight intensity={0.95} color={theme.ambientColor} />
      <directionalLight position={[4, 9, 5]} intensity={1.15} color="#fff7e8" />

      <CameraDirector
        stations={stations}
        stationIndex={stationIndex}
        stationRevision={stationRevision}
        inspectFocused={inspectFocused}
        stageZ={stageZ}
        joystickRef={joystickRef}
        freeWalkActive={freeWalkActive}
        onEnterFreeWalk={onEnterFreeWalk}
      />

      {/* 360° Seamless Curved Skybox Cylinder */}
      <mesh position={[0, 2.4, -20]}>
        <cylinderGeometry args={[54, 54, 30, 64, 1, true]} />
        <meshBasicMaterial
          key={skyTex?.uuid ?? 'sky-loading'}
          map={skyTex ?? undefined}
          color={skyTex ? '#ffffff' : theme.fogColor}
          side={THREE.BackSide}
          fog={false}
          toneMapped={false}
        />
      </mesh>

      {!theme.hasWaterSurface && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -22]}>
          <planeGeometry args={[112, 112]} />
          <meshLambertMaterial color={theme.groundColor} />
        </mesh>
      )}

      {theme.hasCircularPlaza && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -13]}>
          <circleGeometry args={[4.2, 32]} />
          <meshStandardMaterial color="#e6ecf8" roughness={0.9} />
        </mesh>
      )}

      <mesh geometry={pathGeo}>
        <meshBasicMaterial key={pathTex.uuid} map={pathTex} toneMapped={false} />
      </mesh>

      {archTex && (
        <mesh position={[0, 2.78, ARCH_Z]}>
          <planeGeometry args={[6.1, 6.1]} />
          <meshBasicMaterial key={archTex.uuid} map={archTex} transparent alphaTest={0.05} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      )}

      <group position={[standeeX, 0, STANDEE_Z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <planeGeometry args={[1.55, 0.7]} />
          <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
        </mesh>
        {standeeTex && (
          <mesh position={[0, 1.24, 0]}>
            <planeGeometry args={[1.68, 2.52]} />
            <meshBasicMaterial key={standeeTex.uuid} map={standeeTex} transparent alphaTest={0.05} toneMapped={false} />
          </mesh>
        )}
      </group>

      {/* Ornate Welcome Easel ("Lời chào") */}
      <OrnateEaselFrame position={WELCOME_POS} rotationY={WELCOME_ROT_Y} texture={welcomeTex} />

      {/* Alternating Gilded Double-Matted Photo Easels ("Kỷ niệm 1/6..6/6") */}
      {easelPhotos.map((photo, idx) => {
        const z = PHOTO_Z_START - idx * PHOTO_Z_STEP;
        const side = idx % 2 === 0 ? 1 : -1;
        const x = side * 2.28;
        const rotY = side * -1.08;
        return (
          <PhotoEasel
            key={photo.id}
            position={[x, 0, z]}
            rotationY={rotY}
            photoUrl={photo.url}
            onSelect={() => onInspectPhoto?.(idx)}
          />
        );
      })}

      {/* Dedicated Dark-Velvet & Gold Floral Event Easels ("Lễ Vu Quy", "Lễ Thành Hôn", "Thông tin tiệc") */}
      {easelEvents.map((ev, idx) => {
        const z = eventZStart - idx * EVENT_Z_STEP;
        const side = (shownPhotos + idx) % 2 === 0 ? 1 : -1;
        const x = side * 2.28;
        const rotY = side * -1.08;
        return (
          <EventEasel
            key={ev.id}
            position={[x, 0, z]}
            rotationY={rotY}
            event={ev}
            theme={theme}
            fontsReady={fontsReady}
            onSelect={() => onInspectEvent?.(idx)}
          />
        );
      })}

      <ThemeSideDecor theme={theme} />
      <ThemeSurroundScenery theme={theme} />

      {/* Ceremony Stage */}
      <group position={[0, 0, stageZ]}>
        <mesh position={[0, 0.1, 1.2]}>
          <boxGeometry args={[5.4, 0.2, 2.1]} />
          <meshStandardMaterial color={theme.accentGold} roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.26, 0.6]}>
          <boxGeometry args={[4.6, 0.18, 1.6]} />
          <meshStandardMaterial color="#f4ead9" roughness={0.8} />
        </mesh>

        {stageTex && (
          <mesh position={[0, stageY, 0]}>
            <planeGeometry args={[stageH, stageH]} />
            <meshBasicMaterial key={stageTex.uuid} map={stageTex} transparent alphaTest={0.05} toneMapped={false} />
          </mesh>
        )}

        <mesh position={[plaqueX, plaqueY, 0.14]}>
          <planeGeometry args={[theme.plaque.width, theme.plaque.width * (420 / 768)]} />
          <meshBasicMaterial key={plaqueTex.uuid} map={plaqueTex} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      </group>

      <SeasonalParticles kind={theme.particleKind} />
    </>
  );
}

export function WalkthroughSceneCanvas(props: WalkthroughSceneProps) {
  return (
    <Canvas
      dpr={IS_HANDHELD ? [1, 1.5] : [1, 2]}
      camera={{ fov: 50, near: 0.1, far: 135, position: [0, 1.88, 2.8] }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      className="h-full w-full touch-pan-y"
    >
      <WalkthroughInnerScene {...props} />
    </Canvas>
  );
}
