'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import type { VenueTheme } from '@dco/shared';
import { IS_HANDHELD } from './deviceTier';
import { painted, wood } from './realMaterials';
import { InstancedSet } from './realProps';

type Vec3 = [number, number, number];
type Piece = { position: Vec3; rotation?: Vec3; scale: Vec3; color?: string };
const BLOCK = new THREE.BoxGeometry(1, 1, 1);
const WINDOW_DAY = new THREE.MeshStandardMaterial({ color: '#a9bdc5', metalness: 0.16, roughness: 0.4 });
const WINDOW_NIGHT = new THREE.MeshBasicMaterial({ color: '#fce2ac' });
const CITY_NIGHT = new THREE.MeshBasicMaterial({ color: '#f8d9a0' });
const CITY_GLASS = new THREE.MeshStandardMaterial({ color: '#79919e', roughness: 0.57, metalness: 0.25 });

function detail(seed: number): number {
  const fraction = Math.sin(seed * 23.171 + 48.97) * 41219.91;
  return fraction - Math.floor(fraction);
}

function tint(hex: string, gain: number): string {
  return `#${new THREE.Color(hex).multiplyScalar(gain).getHexString()}`;
}

function pitchedRoof(hip: boolean) {
  const edge = hip ? 0.34 : 0.5;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -0.5, 0, 0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, -0.5,
    -edge, 1, 0, edge, 1, 0,
  ], 3));
  geometry.setIndex([0, 1, 4, 1, 5, 4, 1, 2, 5, 2, 3, 5, 3, 4, 5, 3, 0, 4]);
  const roof = geometry.toNonIndexed();
  geometry.dispose();
  roof.computeVertexNormals();
  return roof;
}

const HIP_ROOF = pitchedRoof(true);
const GABLE_ROOF = pitchedRoof(false);
const ROOF_TILE = new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide });

export function OldTownBackdrop({ theme }: { theme: VenueTheme }) {
  const { id, colors, mood } = theme;
  const flat = id === 'gr_santorini' || id === 'tn_sidi_bou_said';
  const hip = /^(vn|cn|kr)_/.test(id);
  const wallColor = colors.sc ?? '#d6b683';
  const roofColor = colors.k2 ?? (flat ? '#e1e2d5' : hip ? '#6c4939' : '#965c49');
  const { walls, masonry, roofs, eaves, openings, glass } = useMemo(() => {
    const walls: Piece[] = [];
    const masonry: Piece[] = [];
    const roofs: Piece[] = [];
    const eaves: Piece[] = [];
    const openings: Piece[] = [];
    const glass: Piece[] = [];
    const houses: Array<{ x: number; z: number; yaw: number }> = [];
    for (let i = 0; i < 8; i++) {
      houses.push({ x: -22.5, z: -14 + i * 4.45, yaw: Math.PI / 2 });
      houses.push({ x: 22.5, z: -14 + i * 4.45, yaw: -Math.PI / 2 });
    }
    for (let i = 0; i < 9; i++) houses.push({ x: -17.8 + i * 4.45, z: -24.5, yaw: 0 });

    houses.forEach(({ x, z, yaw }, i) => {
      const width = 3.55 + detail(i + 7) * 0.6;
      const height = 4.15 + detail(i + 64) * (hip ? 1.8 : 3.5);
      const depth = 3.3 + detail(i + 147) * 1.0;
      const face = depth / 2;
      const rear = z + (detail(i + 241) - 0.5) * 0.7;
      const plaster = tint(wallColor, 0.72 + detail(i + 291) * 0.37);
      const panelColor = tint(plaster, 0.83);
      const roof = tint(roofColor, 0.75 + detail(i + 337) * 0.34);
      const put = (pieces: Piece[], dx: number, dy: number, dz: number, scale: Vec3, color?: string) => {
        pieces.push({ position: [x + Math.cos(yaw) * dx + Math.sin(yaw) * dz, dy, rear - Math.sin(yaw) * dx + Math.cos(yaw) * dz], rotation: [0, yaw, 0], scale, color });
      };
      put(walls, 0, height / 2, 0, [width, height, depth], plaster);
      put(masonry, 0, 0.29, face + 0.02, [width, 0.58, 0.09], panelColor);
      put(masonry, 0, height * 0.55, face + 0.02, [width, 0.10, 0.09], tint(plaster, 1.24));
      put(eaves, 0, height - 0.06, 0, [width + 0.46, 0.12, depth + 0.49], roof);
      put(roofs, 0, height + (flat ? 0.07 : 0), 0, [width + 0.53, flat ? 0.20 : hip ? 0.95 : 1.34, depth + 0.53], roof);
      if (!flat) put(eaves, 0, height + (hip ? 0.94 : 1.33), 0, [width * (hip ? 0.74 : 1.12), 0.11, 0.14], tint(roof, 1.12));

      const frame = flat ? '#386783' : hip ? '#4f4836' : '#514031';
      put(openings, 0, 1.02, face + 0.04, [1.05, 2.04, 0.13], frame);
      put(glass, 0, 1.20, face + 0.115, [0.63, 1.12, 0.019]);
      for (const side of [-1, 1]) {
        const offset = side * width * 0.26;
        put(openings, offset, height * 0.73, face + 0.055, [0.86, 1.23, 0.14], frame);
        put(glass, offset, height * 0.73, face + 0.131, [0.58, 0.89, 0.011]);
        put(masonry, offset, height * 0.73 - 0.68, face + 0.10, [1.07, 0.10, 0.18], tint(plaster, 1.29));
        put(openings, offset, height * 0.73, face + 0.147, [0.067, 0.89, 0.025], frame);
        if (!IS_HANDHELD && hip) put(openings, offset, height * 0.73, face + 0.152, [0.58, 0.065, 0.024], frame);
        if (id === 'vn_hoi_an' || !hip) put(openings, side * 1.05, 1.12, face + 0.045, [0.65, 0.83, 0.12], frame);
      }
    });
    return { walls, masonry, roofs, eaves, openings, glass };
  }, [flat, hip, wallColor, roofColor, id]);

  return (
    <>
      <InstancedSet geometry={BLOCK} material={painted('#e9e5dc', 0.87)} items={walls} castShadow={false} />
      <InstancedSet geometry={BLOCK} material={painted('#f4eee2', 0.76)} items={masonry} castShadow={false} />
      <InstancedSet geometry={flat ? BLOCK : hip ? HIP_ROOF : GABLE_ROOF} material={ROOF_TILE} items={roofs} castShadow={false} />
      <InstancedSet geometry={BLOCK} material={ROOF_TILE} items={eaves} castShadow={false} />
      <InstancedSet geometry={BLOCK} material={wood('#e5d4bd', 0.38)} items={openings} castShadow={false} />
      <InstancedSet geometry={BLOCK} material={mood === 'night' ? WINDOW_NIGHT : WINDOW_DAY} items={glass} castShadow={false} />
    </>
  );
}

export function SkylineBackdrop({ theme }: { theme: VenueTheme }) {
  const color = theme.colors.sc ?? '#273743';
  const night = theme.mood === 'night';
  const { towers, crowns, windows } = useMemo(() => {
    const towers: Piece[] = [];
    const crowns: Piece[] = [];
    const windows: Piece[] = [];
    for (let i = 0; i < 26; i++) {
      const x = -77 + i * 6.15 + detail(i + 712) * 4;
      const z = -49 - detail(i + 975) * 37;
      const height = 9 + detail(i + 61) * 32;
      const width = 3.2 + detail(i + 101) * 4.05;
      const depth = width * (0.76 + detail(i + 377) * 0.56);
      const facade = tint(color, 0.54 + detail(i + 442) * 0.68);
      towers.push({ position: [x, height / 2, z], scale: [width, height, depth], color: facade });
      const top = 0.68 + detail(i + 114) * 2.1;
      crowns.push({ position: [x - width * 0.09, height + top / 2, z], scale: [width * 0.64, top, depth * 0.71], color: tint(facade, 0.84) });
      const columns = width > 5.1 ? 4 : 3;
      const stepY = IS_HANDHELD ? 2.7 : 2.0;
      for (let y = 1.6; y < height - 0.85; y += stepY) {
        for (let col = 0; col < columns; col++) {
          const lit = detail(i * 107 + Math.round(y * 5) + col * 3);
          if (night && lit < 0.41) continue;
          windows.push({
            position: [x + ((col + 0.5) / columns - 0.5) * width * 0.87, y, z + depth * 0.5 + 0.035],
            scale: [width * 0.60 / columns, 0.55 + lit * 0.32, 0.024],
            color: lit > 0.75 ? '#fff3dd' : lit > 0.61 ? '#b8d7e2' : '#a2a1a3',
          });
        }
      }
    }
    return { towers, crowns, windows };
  }, [color, night]);

  return (
    <>
      <InstancedSet geometry={BLOCK} material={painted('#d5dbe0', 0.72)} items={towers} castShadow={false} />
      <InstancedSet geometry={BLOCK} material={painted('#d5dbe0', 0.76)} items={crowns} castShadow={false} />
      <InstancedSet geometry={BLOCK} material={night ? CITY_NIGHT : CITY_GLASS} items={windows} castShadow={false} />
    </>
  );
}
