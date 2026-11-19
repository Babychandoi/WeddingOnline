# 02 — 3D Scene Builder & Asset Specification

## 1. Mobile WebGL Performance Budget

Because `80%+` of Vietnamese wedding guests open invitation links on mid-range smartphones over 4G/5G or inside social WebViews, strict asset budgets are enforced in CI/CD before deploying any 3D asset:

| Metric | Strict Target Budget | Enforcement Technique |
| :--- | :--- | :--- |
| **Initial Payload (Venue + Avatar Rig)** | **`< 5.0 MB` total transfer** | `.glb` compressed with **Draco / Meshopt** (`gltf-transform`); textures converted to **KTX2 (BasisU)** or **WebP** (`<= 1024x1024`). |
| **Venue Triangle Count** | `<= 35,000` triangles | Low-Poly stylized geometry; repeated chairs/plates/flowers use `THREE.InstancedMesh`. |
| **Draw Calls per Frame** | `<= 60` draw calls | Texture atlasing + material sharing + instanced prefabs. |
| **Lighting Cost** | **Zero real-time dynamic shadows** | **Baked Lightmaps / Ambient Occlusion** exported from Blender + lightweight Matcap / Lambert shaders + single fake blob shadow plane under each avatar. |
| **Auto Quality Scaler** | Target `30–60 FPS` | `FPSMonitor` measures rolling 3-second frame times; if `< 28 FPS`, dynamically reduces `dpr` to `1.0`, disables floating petals/sparkler particles, and hides distant nameplates (`> 18m`). |

---

## 2. Modular Chibi Avatar Specification

To keep downloads fast even with `50+` guests in one hall, all characters share **one base humanoid skeleton and animation bundle (`avatar-rig.glb`, ~600KB)** plus lightweight modular outfit overlays:

### 2.1 Shared Animation Clips
| Clip Name | Trigger Condition | Loop Mode |
| :--- | :--- | :--- |
| `idle` | Velocity `== 0` and not seated | Loop |
| `walk` | Velocity `> 0.1 m/s` | Loop (speed-scaled) |
| `sit` | Avatar attached to a `SeatAnchor` | Loop |
| `wave` | Player taps Greet emote or Auto-NPC reception loop | Once / Loop |
| `clap` | Player taps Clap emote or Stage Ceremony applause | Loop (3s) |
| `cheers` | `TABLE_CHEERS` (`1-2-3 Dzô!`) triggered while seated | Once (2.5s) |
| `jump_catch` | Player triggers `ATTEMPT_CATCH` during Bouquet Toss | Once (1.2s) |
| `bow` | Traditional Vietnamese greeting emote | Once (1.5s) |

### 2.2 Modular Slots & Customization
- **Head/Hair Slot**: `6` unisex/gendered stylized Low-Poly hairstyles with dynamic uniform color tinting.
- **Outfit Slot**:
  - Guest Outfits: `ao_dai_guest`, `vest_suit`, `evening_dress`, `smart_casual`
  - Couple Exclusive Outfits (locked to `BRIDE`/`GROOM`/`Auto-NPC`): `ao_dai_cuoi_do` (traditional red embroidered), `vay_cuoi_trang` (white bridal gown), `vest_chu_re` (groom tuxedo).
- **Accessories**: Bouquet winner golden floral crown (`hasBouquetCrown`), Host/MC lapel badge.
- **Zero Player-to-Player Collision**: Avatars pass smoothly through one another (no physics body blocking) so trolls cannot block gates or obstruct the stage.

---

## 3. Grid-Snap 3D Scene Builder Specification

Instead of fragile freeform X/Y/Z gizmos that let non-technical couples clip chairs into walls or block pathways, the **3D Scene Builder** uses an *Animal Crossing / The Sims*-inspired **2D Floor Grid-Snap system** paired with **Smart Prefabs**.

### 3.1 Coordinate System & Starter Templates
- **Floor Grid**: `30m x 30m` playable hall divided into **`60 x 60` cells** (`CELL_SIZE = 0.5m`). Grid cell `(0, 0)` maps to world origin `(-15.0, 0, -15.0)`.
- **Valid Rotations**: Snapped strictly to `90°` increments (`0`, `90`, `180`, `270`).
- **3 Starter Templates** (each provides distinct pre-baked floor/skybox/ambient props while sharing the exact same Smart Prefab catalog):
  1. `luxury_ballroom`: Crystal chandeliers, marble aisle, champagne gold palette.
  2. `sunset_garden`: Outdoor lawn, string fairy lights, wooden pergola, warm sunset skybox.
  3. `mekong_coconut_tent` (*Rạp Cưới Miền Tây*): Traditional woven coconut-leaf archway (`Cổng Lá Dừa`), vibrant red/pink silk drapery, tropical palms, rural festive ambiance.

### 3.2 Smart Prefab Catalog
Each prefab acts as a **self-contained functional bundle** rather than bare visual geometry:

| Prefab ID | Footprint (Cells) | Bundled Child Anchors & Functionality |
| :--- | :--- | :--- |
| `STAGE_MAIN` | `12 x 8` (`6m x 4m`) | `brideNpcAnchor`, `groomNpcAnchor`, `mcPodiumAnchor`, `bouquetOrigin`, `stageLedSlot` (displays external video thumbnail + click-to-PiP trigger). Min `1`, Max `1`. |
| `GATE_RECEPTION` | `8 x 4` (`4m x 2m`) | `spawnPoint` (where arriving guests appear), Guestbook lectern hotspot (`openGuestbook`). Min `1`, Max `1`. |
| `GIFT_BOX_STAND` | `3 x 3` (`1.5m x 1.5m`) | `vietQrTriggerHotspot` (hidden automatically in Plaza/Trial modes). Max `2`. |
| `BANQUET_TABLE_10` | `6 x 6` (`3m x 3m`) | Round table + `10` relative `SeatAnchor` transforms + scoped `LiveKitTableZone` (`tableNo`, `customLabel` e.g. *"Bàn Đại Học"*). |
| `BANQUET_TABLE_8` | `5 x 5` (`2.5m x 2.5m`) | Compact table + `8` relative `SeatAnchor` transforms + `LiveKitTableZone`. |
| `PHOTO_FRAME_STAND` | `2 x 2` (`1m x 1m`) | `mediaSlotIndex` linking to uploaded `PhotoAsset` on Cloudflare R2 + click-to-lightbox interaction. |
| `AISLE_CARPET_4X4` | `4 x 4` (`2m x 2m`) | Walkable decorative red/floral aisle tile + optional sparkler emitters triggered during ceremonies. |
| `DECOR_FLOWER_PILLAR` | `2 x 2` (`1m x 1m`) | Non-walkable decorative floral stand or palm tree. |

### 3.3 `SceneLayoutDocument` JSON Schema (TypeScript)

```typescript
export type TemplateId = 'luxury_ballroom' | 'sunset_garden' | 'mekong_coconut_tent';

export type PrefabType =
  | 'STAGE_MAIN'
  | 'GATE_RECEPTION'
  | 'GIFT_BOX_STAND'
  | 'BANQUET_TABLE_10'
  | 'BANQUET_TABLE_8'
  | 'PHOTO_FRAME_STAND'
  | 'AISLE_CARPET_4X4'
  | 'DECOR_FLOWER_PILLAR';

export interface PlacedPrefab {
  instanceId: string;           // UUID v4
  prefabType: PrefabType;
  gridX: number;                // 0..59 (top-left cell of footprint)
  gridZ: number;                // 0..59
  rotationDeg: 0 | 90 | 180 | 270;
  meta?: {
    tableNumber?: number;       // Required for BANQUET_TABLE_*
    tableLabel?: string;        // e.g. "Bàn Bạn Đại Học"
    mediaSlotId?: string;       // Links to PhotoAsset.id for PHOTO_FRAME_STAND
    customLabel?: string;
  };
}

export interface SceneLayoutDocument {
  schemaVersion: 1;
  templateId: TemplateId;
  gridSize: { cols: 60; rows: 60; cellSizeMeters: 0.5 };
  themeAccentColor: string;     // Hex e.g. "#D4AF37"
  prefabs: PlacedPrefab[];
}
```

### 3.4 Walkability Validation & 2D Grid A* Pathfinding
Both the **Builder Save Validator** and **Client Tap-to-Move Controller** share the exact same deterministic `60x60` occupancy matrix generated from `SceneLayoutDocument`:
1. **Occupancy Grid Construction**:
   - `AISLE_CARPET_4X4` marks cells as `WALKABLE`.
   - Solid props (`DECOR_FLOWER_PILLAR`, `PHOTO_FRAME_STAND`, table core `3x3` center, `STAGE_MAIN` deck) mark cells as `BLOCKED`.
   - Outer perimeter cells of `BANQUET_TABLE_*` (`SeatAnchor` ring) and `GATE_RECEPTION` arch opening remain `WALKABLE` so guests can walk up to seats.
2. **Pre-Publish Validation Rules (Server & Client)**:
   - **No Footprint Overlap**: Non-walkable footprints cannot intersect (`error: "Vật phẩm đang chồng chéo lên nhau"`).
   - **Required Core Prefabs**: Exactly `1` `STAGE_MAIN` and `1` `GATE_RECEPTION` must exist.
   - **BFS Reachability Check**: Starting from `GATE_RECEPTION.spawnPoint`, Breadth-First Search over walkable cells must reach:
     - The front-edge interaction zone of `STAGE_MAIN` (ensuring Bouquet Toss area is accessible).
     - Every `SeatAnchor` of every `BANQUET_TABLE_*`.
     - Any `GIFT_BOX_STAND` and `PHOTO_FRAME_STAND` interaction ring.
   - If any target is unreachable, the Builder highlights the blocking cell in red and blocks publishing until fixed.

---

## 4. Controls & Zalo / Messenger WebView Degradation

### 4.1 Universal Dual Input Controller
- **Mobile Touch (Primary)**:
  - **Tap-to-Move**: Tapping any walkable floor cell calculates a smoothed **2D Grid A* path** and walks the avatar automatically—crucial for parents and older relatives who struggle with dual-stick controls.
  - **Virtual Thumbstick**: Bottom-left floating joystick for gamers who prefer manual movement.
  - **One-Finger Camera Orbit**: Dragging anywhere else orbits horizontally (`polarAngle` clamped between `35°` and `75°` to prevent clipping under the floor).
- **Desktop**: `WASD` / Arrow keys + click-to-move + mouse drag orbit + scroll zoom (`minDistance: 4m`, `maxDistance: 20m`).

### 4.2 Zalo & Messenger In-App Browser Resilience
`80%+` of link clicks from wedding invitations happen inside Zalo or Facebook Messenger WebViews:
- **Always Works Inside WebView**: WebGL 3D rendering, avatar movement, text bubble chat, 3D Photo Gallery, Guestbook, Polaroid Photobooth, External Video PiP, and VietQR Gift Box image display (with 1-tap **"Lưu ảnh QR"** button for mobile banking apps).
- **Progressive WebRTC Mic Handoff**: When a VIP guest inside Zalo WebView taps **"Ngồi vào bàn & Bật Mic"**, the client probes `navigator.mediaDevices?.getUserMedia`. If blocked by the WebView sandbox:
  1. Guest still sits down and **hears** table audio (`subscribe-only` LiveKit mode).
  2. UI displays a crisp banner: *"Zalo đang khóa quyền Micro. Bấm để chuyển sang Safari/Chrome và tiếp tục nói chuyện tại bàn này"* with a short-lived (`60s`) deep-link handoff token (`?handoff=<token>&table=<id>`).
