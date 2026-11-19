import {
  CELL_SIZE_M,
  GRID_COLS,
  GRID_ROWS,
  PREFAB_CATALOG,
  getGateSpawnCell,
  getRotatedFootprint,
  getTableSeatAnchors,
  gridCellToWorld,
  worldToGridCell,
} from './prefabs';
import type { PlacedPrefab, SceneLayoutDocument } from './types';

export interface SceneValidationResult {
  valid: boolean;
  errors: string[];
  blockedCells: Array<{ gx: number; gz: number }>;
}

/**
 * Generates a deterministic 60x60 walkability matrix (`true` = walkable, `false` = blocked).
 */
export function buildOccupancyGrid(layout: SceneLayoutDocument): boolean[][] {
  const grid: boolean[][] = Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => true)
  );

  for (const prefab of layout.prefabs) {
    const def = PREFAB_CATALOG[prefab.prefabType];
    if (!def || def.isWalkableSurface) continue;

    const { widthCells, depthCells } = getRotatedFootprint(prefab.prefabType, prefab.rotationDeg);

    if (prefab.prefabType === 'BANQUET_TABLE_10' || prefab.prefabType === 'BANQUET_TABLE_8') {
      // Only the inner center core (tabletop) is blocked; outer perimeter ring has SeatAnchors and stays walkable
      const minX = prefab.gridX + 1;
      const maxX = prefab.gridX + widthCells - 2;
      const minZ = prefab.gridZ + 1;
      const maxZ = prefab.gridZ + depthCells - 2;
      for (let z = minZ; z <= maxZ; z++) {
        for (let x = minX; x <= maxX; x++) {
          if (z >= 0 && z < GRID_ROWS && x >= 0 && x < GRID_COLS) {
            grid[z][x] = false;
          }
        }
      }
      continue;
    }

    if (prefab.prefabType === 'GATE_RECEPTION') {
      // Left and right gate pillars are blocked; center doorway arch stays walkable
      for (let dz = 0; dz < depthCells; dz++) {
        for (let dx = 0; dx < widthCells; dx++) {
          const isEdgeX = dx < 2 || dx >= widthCells - 2;
          const isEdgeZ = dz < 1 || dz >= depthCells - 1;
          const gx = prefab.gridX + dx;
          const gz = prefab.gridZ + dz;
          if (
            (prefab.rotationDeg === 0 || prefab.rotationDeg === 180 ? isEdgeX : isEdgeZ) &&
            gz >= 0 &&
            gz < GRID_ROWS &&
            gx >= 0 &&
            gx < GRID_COLS
          ) {
            grid[gz][gx] = false;
          }
        }
      }
      continue;
    }

    // Solid props (STAGE_MAIN, PHOTO_FRAME_STAND, GIFT_BOX_STAND, DECOR_FLOWER_PILLAR)
    for (let dz = 0; dz < depthCells; dz++) {
      for (let dx = 0; dx < widthCells; dx++) {
        const gx = prefab.gridX + dx;
        const gz = prefab.gridZ + dz;
        if (gz >= 0 && gz < GRID_ROWS && gx >= 0 && gx < GRID_COLS) {
          grid[gz][gx] = false;
        }
      }
    }
  }

  return grid;
}

function getAdjacentWalkableCells(
  grid: boolean[][],
  prefab: PlacedPrefab
): Array<{ gx: number; gz: number }> {
  const { widthCells, depthCells } = getRotatedFootprint(prefab.prefabType, prefab.rotationDeg);
  const candidates: Array<{ gx: number; gz: number }> = [];
  for (let gx = prefab.gridX - 1; gx <= prefab.gridX + widthCells; gx++) {
    for (let gz = prefab.gridZ - 1; gz <= prefab.gridZ + depthCells; gz++) {
      if (gx < 0 || gx >= GRID_COLS || gz < 0 || gz >= GRID_ROWS) continue;
      if (grid[gz][gx]) candidates.push({ gx, gz });
    }
  }
  return candidates;
}

function runBfsFromSpawn(grid: boolean[][], start: { gx: number; gz: number }): Set<string> {
  const visited = new Set<string>();
  if (
    start.gx < 0 ||
    start.gx >= GRID_COLS ||
    start.gz < 0 ||
    start.gz >= GRID_ROWS ||
    !grid[start.gz][start.gx]
  ) {
    return visited;
  }

  const queue: Array<{ gx: number; gz: number }> = [start];
  visited.add(`${start.gx},${start.gz}`);
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    for (const [dx, dz] of dirs) {
      const nx = cur.gx + dx;
      const nz = cur.gz + dz;
      if (nx < 0 || nx >= GRID_COLS || nz < 0 || nz >= GRID_ROWS) continue;
      if (!grid[nz][nx]) continue;
      const key = `${nx},${nz}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ gx: nx, gz: nz });
      }
    }
  }
  return visited;
}

export function validateSceneLayout(layout: SceneLayoutDocument): SceneValidationResult {
  const errors: string[] = [];
  const blockedCells: Array<{ gx: number; gz: number }> = [];

  if (!layout || !Array.isArray(layout.prefabs)) {
    return { valid: false, errors: ['Dữ liệu bố cục 3D không hợp lệ.'], blockedCells };
  }

  // 1. Check required core prefab counts & max caps
  const counts: Record<string, number> = {};
  for (const prefab of layout.prefabs) {
    counts[prefab.prefabType] = (counts[prefab.prefabType] ?? 0) + 1;
  }

  for (const [type, def] of Object.entries(PREFAB_CATALOG)) {
    const count = counts[type] ?? 0;
    if (count < def.minCount) {
      errors.push(`Thiếu vật phẩm bắt buộc: ${def.labelVi} (tối thiểu ${def.minCount}).`);
    }
    if (count > def.maxCount) {
      errors.push(`Vượt quá số lượng cho phép của ${def.labelVi} (tối đa ${def.maxCount}).`);
    }
  }

  // 2. Bounds and solid footprint overlap check
  const occupiedBySolid = new Map<string, string>();
  const reportedOverlapIds = new Set<string>();
  for (const prefab of layout.prefabs) {
    const def = PREFAB_CATALOG[prefab.prefabType];
    if (!def) {
      errors.push(`Prefab không xác định: ${prefab.prefabType}`);
      continue;
    }

    const { widthCells, depthCells } = getRotatedFootprint(prefab.prefabType, prefab.rotationDeg);
    if (
      prefab.gridX < 0 ||
      prefab.gridZ < 0 ||
      prefab.gridX + widthCells > GRID_COLS ||
      prefab.gridZ + depthCells > GRID_ROWS
    ) {
      errors.push(`${def.labelVi} (${prefab.instanceId}) bị đặt tràn ra ngoài biên sảnh.`);
      continue;
    }

    if (def.isWalkableSurface) continue;

    for (let dz = 0; dz < depthCells; dz++) {
      for (let dx = 0; dx < widthCells; dx++) {
        const gx = prefab.gridX + dx;
        const gz = prefab.gridZ + dz;
        const key = `${gx},${gz}`;
        if (occupiedBySolid.has(key)) {
          blockedCells.push({ gx, gz });
          if (!reportedOverlapIds.has(prefab.instanceId)) {
            reportedOverlapIds.add(prefab.instanceId);
            errors.push(`Vật phẩm đang chồng chéo lên nhau (${def.labelVi}).`);
          }
        } else {
          occupiedBySolid.set(key, prefab.instanceId);
        }
      }
    }
  }

  // 3. BFS Walkability check from Reception Gate spawn to Stage, all SeatAnchors, GiftBox & PhotoFrames
  const gate = layout.prefabs.find((p) => p.prefabType === 'GATE_RECEPTION');
  if (gate) {
    const grid = buildOccupancyGrid(layout);
    const spawn = getGateSpawnCell(gate);
    if (!grid[spawn.gz]?.[spawn.gx]) {
      errors.push('Cổng đón khách đang bị vật cản che kín lối bước vào.');
      blockedCells.push(spawn);
    } else {
      const reachable = runBfsFromSpawn(grid, spawn);

      for (const prefab of layout.prefabs) {
        if (prefab.prefabType === 'AISLE_CARPET_4X4' || prefab.prefabType === 'DECOR_FLOWER_PILLAR' || prefab.prefabType === 'GATE_RECEPTION') {
          continue;
        }

        if (prefab.prefabType === 'BANQUET_TABLE_10' || prefab.prefabType === 'BANQUET_TABLE_8') {
          const seats = getTableSeatAnchors(prefab);
          const unreachableSeat = seats.find((s) => !reachable.has(`${s.gridX},${s.gridZ}`));
          if (unreachableSeat) {
            errors.push(
              `Bàn tiệc "${prefab.meta?.tableLabel ?? prefab.instanceId}" có ghế bị bít lối đi.`
            );
            blockedCells.push({ gx: unreachableSeat.gridX, gz: unreachableSeat.gridZ });
          }
          continue;
        }

        const ring = getAdjacentWalkableCells(grid, prefab);
        const canReach = ring.some((c) => reachable.has(`${c.gx},${c.gz}`));
        if (!canReach) {
          const label = PREFAB_CATALOG[prefab.prefabType]?.labelVi ?? prefab.prefabType;
          errors.push(`Không thể đi tới ${label} từ Cổng đón khách.`);
          blockedCells.push({ gx: prefab.gridX, gz: prefab.gridZ });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    blockedCells,
  };
}

/**
 * 2D Grid A* pathfinder returning world-space waypoints for Tap-to-Move & Auto-NPC navigation.
 */
export function findGridPathAStar(
  grid: boolean[][],
  startWorld: { x: number; z: number },
  goalWorld: { x: number; z: number }
): Array<{ x: number; z: number }> {
  const start = worldToGridCell(startWorld.x, startWorld.z);
  const goal = worldToGridCell(goalWorld.x, goalWorld.z);

  if (!grid[goal.gz]?.[goal.gx]) {
    return [];
  }
  if (start.gx === goal.gx && start.gz === goal.gz) {
    return [goalWorld];
  }

  const key = (gx: number, gz: number) => `${gx},${gz}`;
  const open: Array<{ gx: number; gz: number; f: number; g: number }> = [
    {
      gx: start.gx,
      gz: start.gz,
      g: 0,
      f: Math.hypot(goal.gx - start.gx, goal.gz - start.gz),
    },
  ];
  const gScore = new Map<string, number>([[key(start.gx, start.gz), 0]]);
  const cameFrom = new Map<string, { gx: number; gz: number }>();
  const closed = new Set<string>();

  const neighbors = [
    [1, 0, 1],
    [-1, 0, 1],
    [0, 1, 1],
    [0, -1, 1],
    [1, 1, Math.SQRT2],
    [1, -1, Math.SQRT2],
    [-1, 1, Math.SQRT2],
    [-1, -1, Math.SQRT2],
  ];

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;
    const curKey = key(current.gx, current.gz);

    if (current.gx === goal.gx && current.gz === goal.gz) {
      const cells: Array<{ gx: number; gz: number }> = [{ gx: goal.gx, gz: goal.gz }];
      let traceKey = curKey;
      while (cameFrom.has(traceKey)) {
        const prev = cameFrom.get(traceKey)!;
        cells.push(prev);
        traceKey = key(prev.gx, prev.gz);
      }
      cells.reverse();
      // Drop starting cell and convert to world positions
      return cells.slice(1).map((c) => gridCellToWorld(c.gx, c.gz));
    }

    closed.add(curKey);

    for (const [dx, dz, cost] of neighbors) {
      const nx = current.gx + dx;
      const nz = current.gz + dz;
      if (nx < 0 || nx >= GRID_COLS || nz < 0 || nz >= GRID_ROWS) continue;
      if (!grid[nz][nx]) continue;
      // Prevent diagonal corner cutting through blocked cells
      if (dx !== 0 && dz !== 0 && (!grid[current.gz][nx] || !grid[nz][current.gx])) continue;

      const nKey = key(nx, nz);
      if (closed.has(nKey)) continue;

      const tentativeG = current.g + cost;
      const prevG = gScore.get(nKey) ?? Infinity;
      if (tentativeG < prevG) {
        cameFrom.set(nKey, { gx: current.gx, gz: current.gz });
        gScore.set(nKey, tentativeG);
        const h = Math.hypot(goal.gx - nx, goal.gz - nz);
        const existing = open.find((o) => o.gx === nx && o.gz === nz);
        if (existing) {
          existing.g = tentativeG;
          existing.f = tentativeG + h;
        } else {
          open.push({ gx: nx, gz: nz, g: tentativeG, f: tentativeG + h });
        }
      }
    }
  }

  // Fallback straight-line step if isolated
  return Math.hypot(goalWorld.x - startWorld.x, goalWorld.z - startWorld.z) <= CELL_SIZE_M * 1.5
    ? [goalWorld]
    : [];
}
