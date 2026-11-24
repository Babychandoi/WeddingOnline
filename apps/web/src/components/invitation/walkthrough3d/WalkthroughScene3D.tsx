'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Walkthrough3DTemplateId } from '@dco/shared';
import { IS_HANDHELD } from '@/components/three/deviceTier';
import {
  CelebrationFireworks3D,
  LayoutArchitectureExtras,
  ProceduralAltarStage3D,
  ProceduralEntranceGate3D,
  ThemedEaselFrame3D,
  makeProceduralSkyTexture,
} from './ProceduralWorld3D';
import {
  formatShortDotsDate,
  walkthrough3DTheme,
  type CameraFlightStyle3D,
  type PathStyle3D,
  type Walkthrough3DTheme,
} from './themes3d';

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
  inspectFocused: boolean;
  celebrationBursts?: number;
  cameraOverride?: CameraFlightStyle3D | null;
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
const WELCOME_Z = -14.2;
const PHOTO_Z_START = -17.3;
const PHOTO_Z_STEP = 2.25;
const EVENT_Z_STEP = 2.38;

export interface EaselPlacement {
  pos: [number, number, number];
  rotY: number;
}

export function computeScenePlacements(theme: Walkthrough3DTheme, photoCount: number, eventCount: number) {
  const shownPhotos = Math.min(6, photoCount);
  const shownEvents = Math.min(3, eventCount);
  const layout = theme.galleryLayout;
  const standeeX = theme.standeeSide === 'left' ? -0.58 : 0.58;

  const standeeY = layout === 'terraced-ascent' ? 0.18 : layout === 'floating-archipelago' ? 0.22 : 0;
  const welcomeY = layout === 'terraced-ascent' ? 0.42 : layout === 'floating-archipelago' ? 0.3 : 0;

  const standeePos: [number, number, number] = [standeeX, standeeY, STANDEE_Z];
  const welcomePlacement: EaselPlacement = { pos: [-2.28, welcomeY, WELCOME_Z], rotY: 1.08 };

  const rotundaCenterZ = -21.2;
  const rotundaRadius = 4.95;

  const photoPlacements: EaselPlacement[] = [];
  const alcoveZList: number[] = [];

  for (let i = 0; i < shownPhotos; i++) {
    if (layout === 'rotunda-circle') {
      const denom = Math.max(1, shownPhotos - 1);
      const angle = -1.16 + (i / denom) * 2.32;
      const px = Math.sin(angle) * rotundaRadius;
      const pz = rotundaCenterZ - Math.cos(angle) * rotundaRadius;
      photoPlacements.push({ pos: [px, 0, pz], rotY: -angle });
    } else if (layout === 'paired-alcoves') {
      const pairIdx = Math.floor(i / 2);
      const side = i % 2 === 0 ? 1 : -1;
      const pz = PHOTO_Z_START - pairIdx * 3.6 - (side === -1 ? 0.65 : 0);
      if (i % 2 === 0) alcoveZList.push(pz - 0.32);
      photoPlacements.push({ pos: [side * 2.36, 0, pz], rotY: side * -1.08 });
    } else {
      const pz = PHOTO_Z_START - i * PHOTO_Z_STEP;
      const side = i % 2 === 0 ? 1 : -1;
      const xAmp = layout === 'zigzag-courtyard' ? 2.48 : 2.28;
      const py =
        layout === 'terraced-ascent'
          ? 0.68 + i * 0.22
          : layout === 'floating-archipelago'
            ? 0.26 + (i % 3) * 0.16
            : 0;
      photoPlacements.push({ pos: [side * xAmp, py, pz], rotY: side * -1.08 });
    }
  }

  const lastPhotoZ =
    layout === 'rotunda-circle'
      ? rotundaCenterZ - rotundaRadius - 2.2
      : photoPlacements.length > 0
        ? photoPlacements[photoPlacements.length - 1].pos[2] - 2.5
        : PHOTO_Z_START - 1.2;

  const eventZStart = lastPhotoZ;
  const eventPlacements: EaselPlacement[] = [];
  for (let i = 0; i < shownEvents; i++) {
    const ez = eventZStart - i * EVENT_Z_STEP;
    const side = (shownPhotos + i) % 2 === 0 ? 1 : -1;
    const ey =
      layout === 'terraced-ascent'
        ? 2.02 + i * 0.2
        : layout === 'floating-archipelago'
          ? 0.34 + (i % 2) * 0.14
          : 0;
    eventPlacements.push({ pos: [side * 2.28, ey, ez], rotY: side * -1.08 });
  }

  const stageZ = Math.min(-34.5, eventZStart - shownEvents * EVENT_Z_STEP - 3.8);
  const stageY = layout === 'terraced-ascent' ? 2.55 : layout === 'floating-archipelago' ? 0.42 : 0;
  const stagePos: [number, number, number] = [0, stageY, stageZ];

  const islandPositions: Array<[number, number, number]> = [
    [0, standeeY, STANDEE_Z],
    welcomePlacement.pos,
    ...photoPlacements.map((p) => p.pos),
    ...eventPlacements.map((p) => p.pos),
    stagePos,
  ];

  return {
    shownPhotos,
    shownEvents,
    standeePos,
    welcomePlacement,
    photoPlacements,
    eventPlacements,
    stagePos,
    stageZ,
    rotundaCenterZ,
    alcoveZList,
    islandPositions,
  };
}

function easelCamPose(
  easelPos: [number, number, number],
  rotY: number,
  distance = 2.86,
): { camPos: [number, number, number]; lookAt: [number, number, number] } {
  const nx = Math.sin(rotY);
  const nz = Math.cos(rotY);
  return {
    camPos: [easelPos[0] + nx * distance, easelPos[1] + 1.42, easelPos[2] + nz * distance],
    lookAt: [easelPos[0], easelPos[1] + 1.28, easelPos[2]],
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
  const {
    shownPhotos,
    shownEvents,
    standeePos,
    welcomePlacement,
    photoPlacements,
    eventPlacements,
    stagePos,
  } = computeScenePlacements(theme, photoCount, events.length);

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
      camPos: [standeePos[0] * 0.18, standeePos[1] + 1.58, standeePos[2] + 4.35],
      lookAt: [standeePos[0] * 0.62, standeePos[1] + 1.36, standeePos[2]],
    },
    {
      id: 'welcome',
      label: 'Lời chào',
      kind: 'welcome',
      isEaselCloseUp: true,
      ...easelCamPose(welcomePlacement.pos, welcomePlacement.rotY, 2.86),
    },
  ];

  for (let i = 0; i < shownPhotos; i++) {
    const pl = photoPlacements[i];
    list.push({
      id: `photo-${i}`,
      label: `Kỷ niệm ${i + 1}/${shownPhotos}`,
      kind: 'photo',
      photoIndex: i,
      isEaselCloseUp: true,
      ...easelCamPose(pl.pos, pl.rotY, 2.86),
    });
  }

  for (let i = 0; i < shownEvents; i++) {
    const ev = events[i];
    const pl = eventPlacements[i];
    list.push({
      id: `event-${ev.id}`,
      label: ev.stationLabel,
      kind: 'event',
      eventIndex: i,
      isEaselCloseUp: true,
      ...easelCamPose(pl.pos, pl.rotY, 2.88),
    });
  }

  list.push({
    id: 'stage',
    label: 'Lễ đài',
    kind: 'stage',
    camPos: [0, stagePos[1] + 2.05, stagePos[2] + 9.2],
    lookAt: [0, stagePos[1] + 2.75, stagePos[2]],
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

function drawFloralCornerBouquet(ctx: CanvasRenderingContext2D, x: number, y: number, flipX: number, flipY: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flipX, flipY);

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
  const isLight = theme.boardSkin === 'ivory-floral' || theme.boardSkin === 'porcelain-blue' || theme.boardSkin === 'sakura-silk';

  const grad = ctx.createRadialGradient(w / 2, h * 0.42, 60, w / 2, h / 2, h * 0.68);
  grad.addColorStop(0, pal.bgTop);
  grad.addColorStop(1, pal.bgBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  drawCornerFiligree(ctx, w, h, pal.gold, pal.flower);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (!isLight) {
    ctx.shadowColor = 'rgba(0,0,0,0.42)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
  }

  ctx.fillStyle = pal.text;
  ctx.font = 'italic 600 84px "Imperial Script", "Dancing Script", Georgia, serif';
  ctx.fillText('Kính chào', w / 2, 232);

  ctx.fillStyle = isLight ? pal.text : '#fff5da';
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

  ctx.fillStyle = isLight ? pal.sub : '#fdecc2';
  ctx.font = '600 34px "Cormorant Garamond", "Be Vietnam Pro", serif';
  ctx.fillText(dateText, w / 2, 726);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = IS_HANDHELD ? 2 : 4;
  tex.needsUpdate = true;
  return tex;
}

function makeEventBoardCanvasTexture(event: WalkthroughEventBoardItem, theme: Walkthrough3DTheme): THREE.CanvasTexture {
  const w = 768;
  const h = 960;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;

  const skin = theme.boardSkin;
  const isLight = skin === 'ivory-floral' || skin === 'porcelain-blue' || skin === 'sakura-silk';
  const [bgA, bgB] =
    skin === 'ivory-floral'
      ? ['#fffdf8', '#f2e5d0']
      : skin === 'porcelain-blue'
        ? ['#f5f9ff', '#dde9f8']
        : skin === 'sakura-silk'
          ? ['#fff7fa', '#f9dce6']
          : skin === 'emerald-deco'
            ? ['#15382f', '#091c17']
            : skin === 'boho-terracotta'
              ? ['#5e2614', '#331208']
              : skin === 'son-mai'
                ? ['#520b12', '#2b0408']
                : ['#1d1a26', '#0d0c12'];

  const grad = ctx.createRadialGradient(w / 2, h * 0.38, 40, w / 2, h / 2, h * 0.72);
  grad.addColorStop(0, bgA);
  grad.addColorStop(1, bgB);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = isLight ? '#c99b49' : theme.accentGold;
  ctx.lineWidth = 3.5;
  ctx.strokeRect(22, 22, w - 44, h - 44);
  ctx.strokeStyle = isLight ? 'rgba(180, 130, 60, 0.4)' : 'rgba(245, 215, 145, 0.45)';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(32, 32, w - 64, h - 64);

  drawFloralCornerBouquet(ctx, w - 26, 26, -1, 1);
  drawFloralCornerBouquet(ctx, 26, h - 26, 1, -1);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const primaryInk = isLight ? '#2b1b17' : '#fff9ec';
  const accentInk = isLight ? theme.accentColor : '#f8dfaa';
  const subInk = isLight ? '#5c463c' : '#d8c5a3';

  ctx.fillStyle = isLight ? '#8a6840' : '#d4bc8c';
  ctx.font = '600 24px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillText(event.kicker.toUpperCase(), w / 2, 128, 520);

  ctx.fillStyle = accentInk;
  ctx.font = 'italic 600 72px "Imperial Script", "Dancing Script", Georgia, serif';
  ctx.fillText(event.title, w / 2, 212, 580);

  ctx.fillStyle = primaryInk;
  ctx.font = '700 92px "Cormorant Garamond", "Playfair Display", Georgia, serif';
  ctx.fillText(event.timeText, w / 2, 336, 560);

  ctx.fillStyle = isLight ? '#3d2a22' : '#efe2c8';
  ctx.font = '600 27px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillText(event.solarDateText.toUpperCase(), w / 2, 426, 620);

  if (event.lunarDateText) {
    ctx.fillStyle = subInk;
    ctx.font = 'italic 500 24px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(`Nhằm ngày ${event.lunarDateText}`, w / 2, 474, 620);
  }

  ctx.fillStyle = isLight ? 'rgba(180, 130, 60, 0.45)' : 'rgba(243, 211, 152, 0.55)';
  ctx.fillRect(w / 2 - 90, 524, 180, 1.8);

  ctx.fillStyle = primaryInk;
  ctx.font = '700 38px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(event.venueName || 'Địa điểm tổ chức', w / 2, 586, 610);

  ctx.fillStyle = subInk;
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

  if (event.note) {
    ctx.fillStyle = accentInk;
    ctx.font = '600 25px "Be Vietnam Pro", system-ui, sans-serif';
    ctx.fillText(event.note, w / 2, 756, 560);
  }
  if (event.dressCode) {
    ctx.fillStyle = subInk;
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

    ctx.fillStyle =
      style === 'royal-blue-carpet'
        ? 'rgba(246,216,149,0.55)'
        : style === 'blush-carpet'
          ? 'rgba(225,130,160,0.5)'
          : 'rgba(252,216,162,0.48)';
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
  } else if (style === 'marble-gold') {
    ctx.fillStyle = '#fbf8f1';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = 'rgba(180, 165, 140, 0.25)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo((i * 73) % 512, 0);
      ctx.bezierCurveTo(180, 170, 340, 340, ((i + 3) * 97) % 512, 512);
      ctx.stroke();
    }
    ctx.fillStyle = accentGold;
    ctx.fillRect(16, 0, 8, 512);
    ctx.fillRect(488, 0, 8, 512);
    ctx.fillRect(0, 254, 512, 3);
  } else if (style === 'starlight-glass') {
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, 'rgba(30, 41, 82, 0.92)');
    grad.addColorStop(0.5, 'rgba(52, 68, 125, 0.95)');
    grad.addColorStop(1, 'rgba(30, 41, 82, 0.92)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = accentGold;
    ctx.fillRect(12, 0, 7, 512);
    ctx.fillRect(493, 0, 7, 512);
    for (let i = 0; i < 48; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,245,200,0.75)' : 'rgba(190,225,255,0.65)';
      ctx.beginPath();
      ctx.arc(36 + ((i * 83) % 440), (i * 67) % 512, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (style === 'sand-aisle') {
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, '#e6cca8');
    grad.addColorStop(0.18, '#faf3e6');
    grad.addColorStop(0.82, '#faf3e6');
    grad.addColorStop(1, '#e6cca8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = accentGold;
    ctx.fillRect(22, 0, 5, 512);
    ctx.fillRect(485, 0, 5, 512);
  } else if (style === 'stone-garden') {
    ctx.fillStyle = '#6c7366';
    ctx.fillRect(0, 0, 512, 512);
    const stones = [
      [256, 85, 175, 62],
      [244, 248, 182, 66],
      [264, 415, 172, 64],
    ];
    for (const [sx, sy, rx, ry] of stones) {
      ctx.fillStyle = '#dcd7cc';
      ctx.beginPath();
      ctx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
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

function PhotoEasel({
  position,
  rotationY,
  photoUrl,
  theme,
  onSelect,
}: {
  position: [number, number, number];
  rotationY: number;
  photoUrl: string;
  theme: Walkthrough3DTheme;
  onSelect: () => void;
}) {
  const photoTex = useLoadedTexture(photoUrl);
  return (
    <ThemedEaselFrame3D
      position={position}
      rotationY={rotationY}
      texture={photoTex}
      matBoard
      frameStyle={theme.frameStyle}
      accentGold={theme.accentGold}
      accentColor={theme.accentColor}
      onSelect={onSelect}
    />
  );
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
  return (
    <ThemedEaselFrame3D
      position={position}
      rotationY={rotationY}
      texture={tex}
      frameStyle={theme.frameStyle}
      accentGold={theme.accentGold}
      accentColor={theme.accentColor}
      onSelect={onSelect}
    />
  );
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
          <meshStandardMaterial color={tint} roughness={0.88} />
        </mesh>
      ))}
    </group>
  );
}

function PalmTree3D({ position, scale = 1, foliageColor = '#2b6e40' }: { position: [number, number, number]; scale?: number; foliageColor?: string }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 2.1, 0]} rotation={[0.06, 0, 0.05]}>
        <cylinderGeometry args={[0.11, 0.21, 4.2, 8]} />
        <meshStandardMaterial color="#6e5036" roughness={0.9} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const ang = (i / 6) * Math.PI * 2;
        return (
          <group key={i} position={[0.1, 4.15, 0.1]} rotation={[0, ang, 0]}>
            <mesh position={[0.85, -0.12, 0]} rotation={[0, 0, -0.42]} scale={[1.6, 0.12, 0.42]}>
              <sphereGeometry args={[0.6, 8, 6]} />
              <meshStandardMaterial color={foliageColor} roughness={0.78} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function CypressTree3D({ position, scale = 1, foliageColor = '#2e523b' }: { position: [number, number, number]; scale?: number; foliageColor?: string }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 1.2, 8]} />
        <meshStandardMaterial color="#422d1f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.75, 0]}>
        <coneGeometry args={[0.65, 3.9, 10]} />
        <meshStandardMaterial color={foliageColor} roughness={0.85} />
      </mesh>
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
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
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
  const treeX = theme.galleryLayout === 'rotunda-circle' ? 7.2 : 5.2;
  const treePositions: Array<[number, number, number, number]> = [
    [-treeX, 0, -13.6, 1.2],
    [treeX, 0, -14.8, 1.15],
    [-treeX, 0, -18.5, 1.25],
    [treeX, 0, -20.2, 1.2],
    [-treeX, 0, -23.8, 1.2],
    [treeX, 0, -25.8, 1.22],
    [-treeX, 0, -29.8, 1.25],
    [treeX, 0, -31.8, 1.15],
    [-treeX, 0, -35.8, 1.2],
    [treeX, 0, -37.8, 1.2],
    [-10.2, 0, -15.5, 1.35],
    [10.2, 0, -21.5, 1.35],
    [-10.4, 0, -27.0, 1.4],
    [9.8, 0, -33.0, 1.3],
  ];

  const waterTex = useMemo(() => {
    if (!theme.hasWaterSurface) return null;
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, theme.groundColor);
    g.addColorStop(0.5, theme.fogColor);
    g.addColorStop(1, theme.groundColor);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = 'rgba(255, 245, 220, 0.1)';
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
  }, [theme.fogColor, theme.groundColor, theme.hasWaterSurface]);
  useEffect(() => () => waterTex?.dispose(), [waterTex]);

  return (
    <group>
      {(theme.hasWaterSurface || theme.category === 'co-do-truyen-thong') && (
        <group>
          <PavilionHorizon3D position={[-20, 0.1, -13]} rotY={1.1} />
          <PavilionHorizon3D position={[21, 0.1, -18]} rotY={-1.15} />
          <PavilionHorizon3D position={[-19, 0.1, -28]} rotY={0.85} />
          <PavilionHorizon3D position={[20, 0.1, -35]} rotY={-0.95} />
        </group>
      )}

      {theme.treeKind !== 'none' &&
        treePositions.map(([x, y, z, s], idx) =>
          theme.treeKind === 'willow' ? (
            <WillowTree3D key={idx} position={[x, y, z]} scale={s} tint={theme.foliageColor} />
          ) : theme.treeKind === 'palm' ? (
            <PalmTree3D key={idx} position={[x, y, z]} scale={s} foliageColor={theme.foliageColor} />
          ) : theme.treeKind === 'cypress' ? (
            <CypressTree3D key={idx} position={[x, y, z]} scale={s} foliageColor={theme.foliageColor} />
          ) : (
            <ScenicTree3D
              key={idx}
              position={[x, y, z]}
              scale={s}
              foliageColor={theme.foliageColor}
              conical={theme.treeKind === 'pine'}
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
            [-4.2, -0.1, -15.4],
            [4.2, -0.1, -17.2],
            [-4.1, -0.1, -20.0],
            [4.1, -0.1, -22.4],
            [-4.1, -0.1, -25.2],
            [4.2, -0.1, -28.0],
            [-4.2, -0.1, -31.2],
            [4.1, -0.1, -34.2],
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
    const isRising = kind === 'lotus-glow' || kind === 'stardust-fireworks' || kind === 'fireflies' || kind === 'sea-sparkles';
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
          : kind === 'fireflies'
            ? '#bef264'
            : kind === 'sea-sparkles'
              ? '#bae6fd'
              : kind === 'lotus-glow' || kind === 'stardust-fireworks'
                ? '#ffcf70'
                : kind === 'pine-mist'
                  ? '#edf5dc'
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
        size={kind === 'snow' || kind === 'stardust-fireworks' || kind === 'fireflies' ? 0.14 : 0.15}
        transparent
        opacity={0.86}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/** Themed side decorations placed safely outside easel sightlines (x >= 3.85 or 6.3 on rotundas) */
function ThemeSideDecor({ theme }: { theme: Walkthrough3DTheme }) {
  const galleryX = theme.galleryLayout === 'rotunda-circle' ? 6.35 : 3.95;
  const placements: Array<{ z: number; xOffset: number }> = [
    { z: -2.4, xOffset: 2.35 },
    { z: -8.4, xOffset: 2.35 },
    { z: -15.5, xOffset: galleryX },
    { z: -20.5, xOffset: galleryX },
    { z: -25.5, xOffset: galleryX },
    { z: -30.5, xOffset: galleryX },
    { z: -35.5, xOffset: galleryX },
  ];

  if (theme.hasWaterSurface) return null;

  return (
    <group>
      {theme.hasMarqueeRoof && (
        <group position={[0, 5.5, -20]}>
          {[-2.8, -1.4, 0, 1.4, 2.8].map((rx, idx) => (
            <mesh key={rx} position={[rx, 0.18 * (idx % 2 === 0 ? 1 : -1), 0]} rotation={[0, 0, rx * -0.06]}>
              <planeGeometry args={[1.65, 52]} />
              <meshBasicMaterial
                color={idx % 2 === 0 ? '#f7d8e2' : '#fff8fa'}
                transparent
                opacity={0.76}
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
              ) : theme.sidePropKind === 'roman-columns' ? (
                <group>
                  <mesh position={[0, 1.15, 0]}>
                    <cylinderGeometry args={[0.16, 0.19, 2.3, 14]} />
                    <meshStandardMaterial color="#f5efe4" roughness={0.55} />
                  </mesh>
                  <mesh position={[0, 2.42, 0]}>
                    <sphereGeometry args={[0.26, 10, 10]} />
                    <meshBasicMaterial color={theme.accentColor} toneMapped={false} />
                  </mesh>
                </group>
              ) : theme.sidePropKind === 'beach-torches' ? (
                <group>
                  <mesh position={[0, 0.82, 0]}>
                    <cylinderGeometry args={[0.04, 0.05, 1.64, 8]} />
                    <meshStandardMaterial color="#a16207" roughness={0.8} />
                  </mesh>
                  <mesh position={[0, 1.72, 0]}>
                    <coneGeometry args={[0.12, 0.28, 8]} />
                    <meshBasicMaterial color="#fb923c" toneMapped={false} />
                  </mesh>
                </group>
              ) : theme.sidePropKind === 'cinema-stanchions' || theme.sidePropKind === 'neon-halos' ? (
                <group>
                  <mesh position={[0, 0.52, 0]}>
                    <cylinderGeometry args={[0.035, 0.045, 1.04, 10]} />
                    <meshStandardMaterial color={theme.accentGold} metalness={0.6} roughness={0.25} />
                  </mesh>
                  <mesh position={[0, 1.12, 0]}>
                    <sphereGeometry args={[0.1, 10, 10]} />
                    <meshBasicMaterial color={theme.accentGold} toneMapped={false} />
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

/**
 * Cinematic Bezier Camera Flight supporting all 8 Camera Choreographies + Close-Up Zoom + Free-Roam!
 */
function CameraDirector({
  cameraStyle,
  stations,
  stationIndex,
  stationRevision,
  inspectFocused,
  stageZ,
  joystickRef,
  freeWalkActive,
  onEnterFreeWalk,
}: {
  cameraStyle: CameraFlightStyle3D;
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
    isShortZoom: false,
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
        look.y -= 0.34;
        pos.y -= 0.16;
      }
    } else if (cameraStyle === 'royal-procession') {
      // Heroic upward framing at Gate, Couple & Stage
      pos.y -= 0.12;
      look.y += 0.16;
    }
    return { pos, look };
  };

  const firstMount = useRef(true);
  useEffect(() => {
    if (!targetStation) return;
    const { pos: destPos, look: destLook } = resolvePose(targetStation, inspectFocused);
    scratchMat.lookAt(destPos, destLook, THREE.Object3D.DEFAULT_UP);
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
    const isShortZoom = dist < 1.85;

    let midX = (fromPos.x + destPos.x) * 0.5;
    let midY = Math.max(fromPos.y, destPos.y) + 0.14;
    const midZ = (fromPos.z + destPos.z) * 0.5;
    let duration = 1.38;

    if (isShortZoom) {
      midY = (fromPos.y + destPos.y) * 0.5;
      duration = 0.65;
    } else {
      switch (cameraStyle) {
        case 'crane-swoop':
          midX = THREE.MathUtils.lerp(midX, 0, 0.55);
          midY = Math.max(fromPos.y, destPos.y) + 1.58;
          duration = 1.55;
          break;
        case 'waltz-orbit':
          midX = (stationIndex % 2 === 0 ? 1 : -1) * 1.45;
          midY = Math.max(fromPos.y, destPos.y) + 0.38;
          duration = 1.52;
          break;
        case 'dolly-cinematic':
          midX = THREE.MathUtils.lerp(midX, 0, 0.72);
          midY = Math.max(fromPos.y, destPos.y) + 0.24;
          duration = 1.44;
          break;
        case 'boat-drift':
          midX = THREE.MathUtils.lerp(midX, 0, 0.45);
          midY = Math.min(fromPos.y, destPos.y) - 0.08;
          duration = 1.72;
          break;
        case 'zigzag-promenade':
          midX = THREE.MathUtils.lerp(midX, 0, 0.85);
          midY = (fromPos.y + destPos.y) * 0.5 + 0.06;
          duration = 1.15;
          break;
        case 'spiral-ascent':
          midX = midX + (stationIndex % 2 === 0 ? 0.85 : -0.85);
          midY = Math.max(fromPos.y, destPos.y) + 0.65;
          duration = 1.5;
          break;
        case 'royal-procession':
          midX = THREE.MathUtils.lerp(midX, 0, 0.78);
          midY = (fromPos.y + destPos.y) * 0.5;
          duration = 1.65;
          break;
        default:
          midX = THREE.MathUtils.lerp(midX, 0, 0.68);
          break;
      }
    }

    flight.current = {
      active: true,
      isShortZoom,
      t: 0,
      duration,
      fromPos,
      midPos: new THREE.Vector3(midX, midY, midZ),
      toPos: destPos,
      fromQuat: camera.quaternion.clone(),
      toQuat: destQuat,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationIndex, stationRevision, inspectFocused, cameraStyle]);

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
      euler.z = 0;
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
        euler.z = 0;
        camera.quaternion.setFromEuler(euler);
      }
      const moveForward = -joy.y + kForward;
      if (Math.abs(moveForward) > 0.04) {
        camera.getWorldDirection(scratchFwd);
        scratchFwd.y = 0;
        if (scratchFwd.lengthSq() > 1e-4) scratchFwd.normalize();
        camera.position.addScaledVector(scratchFwd, moveForward * 3.6 * dt);
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, -4.5, 4.5);
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, stageZ + 3.2, 4.2);
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

      // Dynamic waltz roll banking or dolly-zoom lens pulse during station-to-station flights
      if (!f.isShortZoom && camera instanceof THREE.PerspectiveCamera) {
        if (cameraStyle === 'dolly-cinematic') {
          const targetFov = f.t >= 1 ? 50 : 50 + Math.sin(u * Math.PI) * 10;
          if (Math.abs(camera.fov - targetFov) > 0.05) {
            camera.fov = targetFov;
            camera.updateProjectionMatrix();
          }
        } else if (camera.fov !== 50) {
          camera.fov = 50;
          camera.updateProjectionMatrix();
        }

        if (cameraStyle === 'waltz-orbit' && f.t < 1) {
          euler.setFromQuaternion(camera.quaternion, 'YXZ');
          euler.z = Math.sin(u * Math.PI) * (stationIndex % 2 === 0 ? 0.038 : -0.038);
          camera.quaternion.setFromEuler(euler);
        }
      }

      if (f.t >= 1) f.active = false;
      return;
    }

    if (!freeWalkActive && targetStation) {
      const { pos } = resolvePose(targetStation, inspectFocused);
      const swayAmp = cameraStyle === 'boat-drift' ? 0.022 : 0.012;
      camera.position.y = pos.y + Math.sin(clock.elapsedTime * 1.15) * swayAmp;
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
    celebrationBursts = 0,
    cameraOverride,
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
  const activeCameraStyle = cameraOverride ?? theme.cameraStyle;

  const {
    shownPhotos,
    shownEvents,
    standeePos,
    welcomePlacement,
    photoPlacements,
    eventPlacements,
    stagePos,
    stageZ,
    rotundaCenterZ,
    alcoveZList,
    islandPositions,
  } = useMemo(() => computeScenePlacements(theme, photos.length, events.length), [theme, photos.length, events.length]);

  const curve = useMemo(() => {
    const pts = theme.curvePoints.map(([x, , z], i, arr) => {
      const ratio = i / (arr.length - 1);
      const pz = i === arr.length - 1 ? stageZ + 2.4 : THREE.MathUtils.lerp(2.6, stageZ + 2.4, ratio);
      const py = theme.galleryLayout === 'terraced-ascent' ? ratio * stagePos[1] + 0.02 : theme.galleryLayout === 'floating-archipelago' ? ratio * stagePos[1] + 0.02 : 0.015;
      return new THREE.Vector3(x, py, pz);
    });
    return new THREE.CatmullRomCurve3(pts);
  }, [theme.curvePoints, theme.galleryLayout, stagePos, stageZ]);

  const rasterSkyTex = useLoadedTexture(theme.hasRasterAssets ? `/invitation-3d/${theme.slug}/sky.webp` : undefined, {
    mirrorWrapS: true,
    repeatX: 4,
    repeatY: 1,
  });
  const procSkyTex = useMemo(() => (theme.hasRasterAssets ? null : makeProceduralSkyTexture(theme)), [theme]);
  useEffect(() => () => procSkyTex?.dispose(), [procSkyTex]);
  const skyTex = theme.hasRasterAssets ? rasterSkyTex : procSkyTex;

  const archTex = useLoadedTexture(theme.hasRasterAssets ? `/invitation-3d/${theme.slug}/arch.webp` : undefined);
  const stageTex = useLoadedTexture(theme.hasRasterAssets ? `/invitation-3d/${theme.slug}/stage.webp` : undefined);
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
    const segs = 64;
    const width = theme.hasCircularPlaza ? 2.45 : 2.3;
    const halfW = width / 2;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= segs; i++) {
      const p = curve.getPointAt(i / segs);
      pts.push(new THREE.Vector3(p.x, p.y, p.z));
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

  const stageH = 6.9;
  const stageBillboardY = 3.3;
  const plaqueY = stageBillboardY + theme.plaque.y;
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
        cameraStyle={activeCameraStyle}
        stations={stations}
        stationIndex={stationIndex}
        stationRevision={stationRevision}
        inspectFocused={inspectFocused}
        stageZ={stageZ}
        joystickRef={joystickRef}
        freeWalkActive={freeWalkActive}
        onEnterFreeWalk={onEnterFreeWalk}
      />

      {/* 360° Skybox Cylinder */}
      <mesh position={[0, 3.2, -20]}>
        <cylinderGeometry args={[56, 56, 34, 64, 1, true]} />
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
          <planeGeometry args={[120, 120]} />
          <meshLambertMaterial color={theme.groundColor} />
        </mesh>
      )}

      {/* Ascending Terrace Platforms when galleryLayout === 'terraced-ascent' */}
      {theme.galleryLayout === 'terraced-ascent' &&
        photoPlacements.map((pl, idx) => (
          <mesh key={`terrace-${idx}`} position={[0, pl.pos[1] * 0.5, pl.pos[2]]}>
            <boxGeometry args={[6.8, Math.max(0.08, pl.pos[1]), 2.4]} />
            <meshStandardMaterial color="#e8e2d6" roughness={0.8} />
          </mesh>
        ))}

      <LayoutArchitectureExtras
        theme={theme}
        islandPositions={islandPositions}
        alcoveZList={alcoveZList}
        rotundaCenterZ={rotundaCenterZ}
      />

      <mesh geometry={pathGeo}>
        <meshBasicMaterial key={pathTex.uuid} map={pathTex} toneMapped={false} />
      </mesh>

      {/* Entrance Gate: Raster cutout for original 10, real 3D architecture for 90 procedural themes */}
      {theme.hasRasterAssets ? (
        archTex && (
          <mesh position={[0, 2.78, ARCH_Z]}>
            <planeGeometry args={[6.1, 6.1]} />
            <meshBasicMaterial key={archTex.uuid} map={archTex} transparent alphaTest={0.05} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        )
      ) : (
        <ProceduralEntranceGate3D theme={theme} zPos={ARCH_Z} />
      )}

      {/* Couple Standee */}
      <group position={standeePos}>
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

      {/* Welcome Board Easel ("Lời chào") */}
      <ThemedEaselFrame3D
        position={welcomePlacement.pos}
        rotationY={welcomePlacement.rotY}
        texture={welcomeTex}
        frameStyle={theme.frameStyle}
        accentGold={theme.accentGold}
        accentColor={theme.accentColor}
      />

      {/* Photo Memory Easels ("Kỷ niệm 1/6..6/6") */}
      {easelPhotos.map((photo, idx) => {
        const pl = photoPlacements[idx];
        return (
          <PhotoEasel
            key={photo.id}
            position={pl.pos}
            rotationY={pl.rotY}
            photoUrl={photo.url}
            theme={theme}
            onSelect={() => onInspectPhoto?.(idx)}
          />
        );
      })}

      {/* Event Board Easels ("Lễ Vu Quy", "Lễ Thành Hôn", "Thông tin tiệc") */}
      {easelEvents.map((ev, idx) => {
        const pl = eventPlacements[idx];
        return (
          <EventEasel
            key={ev.id}
            position={pl.pos}
            rotationY={pl.rotY}
            event={ev}
            theme={theme}
            fontsReady={fontsReady}
            onSelect={() => onInspectEvent?.(idx)}
          />
        );
      })}

      <ThemeSideDecor theme={theme} />
      <ThemeSurroundScenery theme={theme} />

      {/* Ceremony Stage: Raster stage for original 10, real 3D Altar for 90 procedural themes */}
      {theme.hasRasterAssets ? (
        <group position={stagePos}>
          <mesh position={[0, 0.1, 1.2]}>
            <boxGeometry args={[5.4, 0.2, 2.1]} />
            <meshStandardMaterial color={theme.accentGold} roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.26, 0.6]}>
            <boxGeometry args={[4.6, 0.18, 1.6]} />
            <meshStandardMaterial color="#f4ead9" roughness={0.8} />
          </mesh>
          {stageTex && (
            <mesh position={[0, stageBillboardY, 0]}>
              <planeGeometry args={[stageH, stageH]} />
              <meshBasicMaterial key={stageTex.uuid} map={stageTex} transparent alphaTest={0.05} toneMapped={false} />
            </mesh>
          )}
          <mesh position={[plaqueX, plaqueY, 0.14]}>
            <planeGeometry args={[theme.plaque.width, theme.plaque.width * (420 / 768)]} />
            <meshBasicMaterial key={plaqueTex.uuid} map={plaqueTex} transparent depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ) : (
        <ProceduralAltarStage3D theme={theme} position={stagePos} plaqueTex={plaqueTex} />
      )}

      <CelebrationFireworks3D
        burstCount={celebrationBursts}
        stagePos={stagePos}
        accentGold={theme.accentGold}
        accentColor={theme.accentColor}
      />

      <SeasonalParticles kind={theme.particleKind} />
    </>
  );
}

export function WalkthroughSceneCanvas(props: WalkthroughSceneProps) {
  return (
    <Canvas
      dpr={IS_HANDHELD ? [1, 1.5] : [1, 2]}
      camera={{ fov: 50, near: 0.1, far: 145, position: [0, 1.88, 2.8] }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      className="h-full w-full touch-pan-y"
    >
      <WalkthroughInnerScene {...props} />
    </Canvas>
  );
}
