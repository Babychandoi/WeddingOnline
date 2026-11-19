import type { PlacedPrefab, PrefabType, SceneLayoutDocument, TemplateId } from './types';
import { VENUE_THEMES } from './venues';

export const GRID_COLS = 60;
export const GRID_ROWS = 60;
export const CELL_SIZE_M = 0.5;
export const HALL_WIDTH_M = GRID_COLS * CELL_SIZE_M; // 30m
export const HALL_DEPTH_M = GRID_ROWS * CELL_SIZE_M; // 30m

export interface PrefabDefinition {
  type: PrefabType;
  labelVi: string;
  widthCells: number;
  depthCells: number;
  minCount: number;
  maxCount: number;
  isWalkableSurface: boolean;
  seatCount: number;
}

export const PREFAB_CATALOG: Record<PrefabType, PrefabDefinition> = {
  STAGE_MAIN: {
    type: 'STAGE_MAIN',
    labelVi: 'Sân Khấu Chính & LED',
    widthCells: 12,
    depthCells: 8,
    minCount: 1,
    maxCount: 1,
    isWalkableSurface: false,
    seatCount: 0,
  },
  GATE_RECEPTION: {
    type: 'GATE_RECEPTION',
    labelVi: 'Cổng Hoa / Lá Dừa Đón Khách',
    widthCells: 8,
    depthCells: 4,
    minCount: 1,
    maxCount: 1,
    isWalkableSurface: false,
    seatCount: 0,
  },
  GIFT_BOX_STAND: {
    type: 'GIFT_BOX_STAND',
    labelVi: 'Bàn Hộp Mừng Cưới VietQR',
    widthCells: 3,
    depthCells: 3,
    minCount: 0,
    maxCount: 2,
    isWalkableSurface: false,
    seatCount: 0,
  },
  BANQUET_TABLE_10: {
    type: 'BANQUET_TABLE_10',
    labelVi: 'Bàn Tiệc Tròn 10 Ghế',
    widthCells: 6,
    depthCells: 6,
    minCount: 0,
    maxCount: 16,
    isWalkableSurface: false,
    seatCount: 10,
  },
  BANQUET_TABLE_8: {
    type: 'BANQUET_TABLE_8',
    labelVi: 'Bàn Tiệc Gọn 8 Ghế',
    widthCells: 5,
    depthCells: 5,
    minCount: 0,
    maxCount: 16,
    isWalkableSurface: false,
    seatCount: 8,
  },
  PHOTO_FRAME_STAND: {
    type: 'PHOTO_FRAME_STAND',
    labelVi: 'Khung Triển Lãm Ảnh Cưới',
    widthCells: 2,
    depthCells: 2,
    minCount: 0,
    maxCount: 24,
    isWalkableSurface: false,
    seatCount: 0,
  },
  AISLE_CARPET_4X4: {
    type: 'AISLE_CARPET_4X4',
    labelVi: 'Thảm Lối Đi & Pháo Điện',
    widthCells: 4,
    depthCells: 4,
    minCount: 0,
    maxCount: 30,
    isWalkableSurface: true,
    seatCount: 0,
  },
  DECOR_FLOWER_PILLAR: {
    type: 'DECOR_FLOWER_PILLAR',
    labelVi: 'Trụ Hoa / Cây Cảnh Trang Trí',
    widthCells: 2,
    depthCells: 2,
    minCount: 0,
    maxCount: 24,
    isWalkableSurface: false,
    seatCount: 0,
  },
};

export function getRotatedFootprint(
  prefabType: PrefabType,
  rotationDeg: 0 | 90 | 180 | 270
): { widthCells: number; depthCells: number } {
  const def = PREFAB_CATALOG[prefabType];
  if (rotationDeg === 90 || rotationDeg === 270) {
    return { widthCells: def.depthCells, depthCells: def.widthCells };
  }
  return { widthCells: def.widthCells, depthCells: def.depthCells };
}

export function gridCellToWorld(gx: number, gz: number): { x: number; z: number } {
  return {
    x: -HALL_WIDTH_M / 2 + (gx + 0.5) * CELL_SIZE_M,
    z: -HALL_DEPTH_M / 2 + (gz + 0.5) * CELL_SIZE_M,
  };
}

export function worldToGridCell(x: number, z: number): { gx: number; gz: number } {
  const gx = Math.max(0, Math.min(GRID_COLS - 1, Math.floor((x + HALL_WIDTH_M / 2) / CELL_SIZE_M)));
  const gz = Math.max(0, Math.min(GRID_ROWS - 1, Math.floor((z + HALL_DEPTH_M / 2) / CELL_SIZE_M)));
  return { gx, gz };
}

export function getPrefabCenterWorld(prefab: PlacedPrefab): { x: number; z: number } {
  const { widthCells, depthCells } = getRotatedFootprint(prefab.prefabType, prefab.rotationDeg);
  return {
    x: -HALL_WIDTH_M / 2 + (prefab.gridX + widthCells / 2) * CELL_SIZE_M,
    z: -HALL_DEPTH_M / 2 + (prefab.gridZ + depthCells / 2) * CELL_SIZE_M,
  };
}

export interface SeatAnchor {
  seatIndex: number;
  x: number;
  z: number;
  rotY: number;
  gridX: number;
  gridZ: number;
}

export function getTableSeatAnchors(prefab: PlacedPrefab): SeatAnchor[] {
  const def = PREFAB_CATALOG[prefab.prefabType];
  if (def.seatCount === 0) return [];
  const center = getPrefabCenterWorld(prefab);
  const radius = prefab.prefabType === 'BANQUET_TABLE_10' ? 1.25 : 1.05;
  const seats: SeatAnchor[] = [];
  for (let i = 0; i < def.seatCount; i++) {
    const angle = (i / def.seatCount) * Math.PI * 2;
    const x = center.x + Math.sin(angle) * radius;
    const z = center.z + Math.cos(angle) * radius;
    const { gx, gz } = worldToGridCell(x, z);
    seats.push({
      seatIndex: i,
      x,
      z,
      rotY: angle + Math.PI, // face inward toward table center
      gridX: gx,
      gridZ: gz,
    });
  }
  return seats;
}

export function getGateSpawnCell(gate: PlacedPrefab): { gx: number; gz: number } {
  const { widthCells, depthCells } = getRotatedFootprint(gate.prefabType, gate.rotationDeg);
  if (gate.rotationDeg === 0) {
    return {
      gx: gate.gridX + Math.floor(widthCells / 2),
      gz: Math.max(0, gate.gridZ - 1),
    };
  }
  if (gate.rotationDeg === 180) {
    return {
      gx: gate.gridX + Math.floor(widthCells / 2),
      gz: Math.min(GRID_ROWS - 1, gate.gridZ + depthCells),
    };
  }
  if (gate.rotationDeg === 90) {
    return {
      gx: Math.min(GRID_COLS - 1, gate.gridX + widthCells),
      gz: gate.gridZ + Math.floor(depthCells / 2),
    };
  }
  return {
    gx: Math.max(0, gate.gridX - 1),
    gz: gate.gridZ + Math.floor(depthCells / 2),
  };
}

function buildBasePrefabs(tableNames: string[]): PlacedPrefab[] {
  const prefabs: PlacedPrefab[] = [
    { instanceId: 'stage-main-1', prefabType: 'STAGE_MAIN', gridX: 24, gridZ: 2, rotationDeg: 0 },
    { instanceId: 'gate-1', prefabType: 'GATE_RECEPTION', gridX: 26, gridZ: 52, rotationDeg: 0 },
    { instanceId: 'gift-1', prefabType: 'GIFT_BOX_STAND', gridX: 36, gridZ: 46, rotationDeg: 0 },
    // Aisle carpets down the center
    ...([12, 16, 20, 24, 28, 32, 36, 40, 44, 48] as const).map((z, idx) => ({
      instanceId: `aisle-${idx + 1}`,
      prefabType: 'AISLE_CARPET_4X4' as const,
      gridX: 28,
      gridZ: z,
      rotationDeg: 0 as const,
    })),
    // 4 Photo gallery stands framing the aisle
    { instanceId: 'photo-1', prefabType: 'PHOTO_FRAME_STAND', gridX: 24, gridZ: 42, rotationDeg: 0, meta: { customLabel: 'Ảnh 1' } },
    { instanceId: 'photo-2', prefabType: 'PHOTO_FRAME_STAND', gridX: 24, gridZ: 34, rotationDeg: 0, meta: { customLabel: 'Ảnh 2' } },
    { instanceId: 'photo-3', prefabType: 'PHOTO_FRAME_STAND', gridX: 34, gridZ: 42, rotationDeg: 0, meta: { customLabel: 'Ảnh 3' } },
    { instanceId: 'photo-4', prefabType: 'PHOTO_FRAME_STAND', gridX: 34, gridZ: 34, rotationDeg: 0, meta: { customLabel: 'Ảnh 4' } },
    // 6 Banquet tables (3 Left, 3 Right)
    { instanceId: 'table-1', prefabType: 'BANQUET_TABLE_10', gridX: 12, gridZ: 16, rotationDeg: 0, meta: { tableNumber: 1, tableLabel: tableNames[0] } },
    { instanceId: 'table-2', prefabType: 'BANQUET_TABLE_10', gridX: 12, gridZ: 26, rotationDeg: 0, meta: { tableNumber: 2, tableLabel: tableNames[1] } },
    { instanceId: 'table-3', prefabType: 'BANQUET_TABLE_10', gridX: 12, gridZ: 36, rotationDeg: 0, meta: { tableNumber: 3, tableLabel: tableNames[2] } },
    { instanceId: 'table-4', prefabType: 'BANQUET_TABLE_10', gridX: 42, gridZ: 16, rotationDeg: 0, meta: { tableNumber: 4, tableLabel: tableNames[3] } },
    { instanceId: 'table-5', prefabType: 'BANQUET_TABLE_10', gridX: 42, gridZ: 26, rotationDeg: 0, meta: { tableNumber: 5, tableLabel: tableNames[4] } },
    { instanceId: 'table-6', prefabType: 'BANQUET_TABLE_10', gridX: 42, gridZ: 36, rotationDeg: 0, meta: { tableNumber: 6, tableLabel: tableNames[5] } },
    // Decorative pillars
    { instanceId: 'decor-1', prefabType: 'DECOR_FLOWER_PILLAR', gridX: 21, gridZ: 5, rotationDeg: 0 },
    { instanceId: 'decor-2', prefabType: 'DECOR_FLOWER_PILLAR', gridX: 37, gridZ: 5, rotationDeg: 0 },
    { instanceId: 'decor-3', prefabType: 'DECOR_FLOWER_PILLAR', gridX: 21, gridZ: 52, rotationDeg: 0 },
    { instanceId: 'decor-4', prefabType: 'DECOR_FLOWER_PILLAR', gridX: 37, gridZ: 52, rotationDeg: 0 },
  ];
  return prefabs;
}

export interface StarterTemplate {
  nameVi: string;
  descriptionVi: string;
  accentColor: string;
  layout: SceneLayoutDocument;
}

/**
 * One starter layout per venue theme (venues.ts). Every venue shares the same walkable
 * floor plan — validated by gridValidator — and differs in its 3D world and table names.
 */
export const STARTER_TEMPLATES: Record<TemplateId, StarterTemplate> = Object.fromEntries(
  VENUE_THEMES.map((venue) => [
    venue.id,
    {
      nameVi: venue.nameVi,
      descriptionVi: venue.descriptionVi,
      accentColor: venue.colors.a,
      layout: {
        schemaVersion: 1,
        templateId: venue.id,
        gridSize: { cols: 60, rows: 60, cellSizeMeters: 0.5 },
        themeAccentColor: venue.colors.a,
        prefabs: buildBasePrefabs(venue.tables),
      },
    },
  ])
);
