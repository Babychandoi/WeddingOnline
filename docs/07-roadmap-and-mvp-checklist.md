# 07 — Implementation Roadmap & MVP Go-Live Checklist

## 1. Pragmatic 4-Phase (10-Week) Engineering Roadmap

Each phase produces a testable, shippable increment while strictly de-risking the highest technical challenges early (mobile WebGL FPS, Colyseus sharding, Zalo WebView OAuth, and SePay webhook reliability).

---

### Phase 1: Foundation, 3D Chibi World & Multiplayer Core (Weeks 1–3)
**Goal**: Prove mobile 3D performance (`>= 30 FPS`), build the `pnpm` + `Turborepo` monorepo, and ship an interactive **24/7 Public Wedding Plaza** prototype.

- **Week 1 — Monorepo & Infrastructure Bootstrap**:
  - Initialize `pnpm` + `Turborepo` workspace (`apps/web`, `apps/realtime`, `packages/shared`, `packages/database`).
  - Spin up local Docker Postgres + Redis + Prisma schema (`User`, `Account`, `Wedding`, `WeddingScene`, `WeddingMember`).
  - Configure Cloudflare R2 bucket and upload compressed Draco/Meshopt base Chibi rig (`avatar-rig.glb`) + first starter venue (`luxury_ballroom`).
- **Week 2 — R3F 3D Scene & Dual Controls**:
  - Implement React Three Fiber canvas with baked lightmap shading, adaptive `FPSMonitor` quality fallback, and `< 5MB` initial load verification.
  - Build modular Chibi outfit/hair tinting and shared animation state machine (`idle`, `walk`, `sit`, `wave`, `clap`, `cheers`, `jump_catch`, `bow`).
  - Implement **Virtual Joystick + 2D Grid A* Tap-to-Move + Desktop WASD/Orbit**.
- **Week 3 — Colyseus `10Hz` Multiplayer & 24/7 Plaza Loop**:
  - Implement `WeddingHallRoom` & `PublicPlazaRoom` with `@colyseus/schema` binary sync, `lerp` movement interpolation, and `50-60` CCU room sharding.
  - Add ephemeral overhead Chat Bubbles (`80 chars` + Vietnamese profanity filter) and 25-minute Auto-NPC scheduled ceremony loop for the Public Plaza.

---

### Phase 2: Grid-Snap 3D Scene Builder, Mini-Games & External PiP (Weeks 4–5)
**Goal**: Deliver the full creative toolset and viral wedding mechanics.

- **Week 4 — Grid-Snap 3D Scene Builder & Walkability Validator**:
  - Implement `0.5m` (`60x60`) floor grid editor with `90°` snapping and Smart Prefabs (`STAGE_MAIN`, `GATE_RECEPTION`, `GIFT_BOX_STAND`, `BANQUET_TABLE_10/8`, `PHOTO_FRAME_STAND`, `AISLE_CARPET_4X4`, `DECOR_FLOWER_PILLAR`).
  - Implement shared isomorphic **BFS/A* Walkability Validator** in `packages/shared` (blocks saving if footprints overlap or `SpawnGate` cannot reach `Stage` / any `SeatAnchor`).
  - Add remaining 2 starter templates: `sunset_garden` and `mekong_coconut_tent` (*Rạp Cưới Miền Tây*).
- **Week 5 — Galleries, Rituals, Bouquet Toss, Photobooth & Video PiP**:
  - Build R2 presigned pre-wedding photo uploads -> 3D Photo Frame lightbox + persistent **Sổ Lưu Bút** (`GuestbookEntry`).
  - Implement Synchronized Stage Ceremonies (cake cut, champagne tower, pathway sparklers), Banquet Table `"1-2-3 Dzô!"` synchronized cheers, and physics-based **Bouquet Toss (`TOSS_BOUQUET`)** with *"Người tiếp theo lên xe hoa"* crown reward.
  - Build **Polaroid 3D Photobooth** (offscreen 2D composite, Trial watermark toggle, R2 upload, social share) and **External Video/Livestream Draggable PiP Player** (YouTube/Vimeo/Drive).

---

### Phase 3: Social OAuth, Dual-Mode Bride/Groom & LiveKit Table Voice (Weeks 6–7)
**Goal**: Harden real wedding identity security, couple controls, and per-table audio.

- **Week 6 — Mandatory Social OAuth & Dual-Mode Controls**:
  - Integrate NextAuth/Auth.js for **Zalo OAuth, Google OAuth, Facebook OAuth**; enforce OAuth + optional 4-digit Room PIN on all Real Wedding routes (`/w/<slug>`).
  - Build **Auto-NPC + 1-Click Live Takeover (`NPC_TAKEOVER` / `NPC_RELEASE`)** for `OWNER`/`BRIDE`/`GROOM`/`MC` plus `MOD_ACTION` (`MUTE`, `KICK`, `BAN` synced to Redis).
  - Build **Zalo / Messenger In-App Browser** detector + 1-tap external browser handoff token for mic access.
- **Week 7 — Self-Hosted LiveKit Table Voice & Stage Ducking**:
  - Configure self-hosted LiveKit Go SFU in Docker + `/api/livekit/token` scoped to `VIP_FULFILLMENT` tables and stage.
  - Connect WebRTC audio **lazily on `SIT_TABLE`**, disconnect on `STAND_UP`, show green speaking rings above avatars, and implement **`-12dB` table audio ducking** during `STAGE_BROADCAST`.

---

### Phase 4: VietQR Webhooks, 2D Memorial Archival & Production Launch (Weeks 8–10)
**Goal**: Wire automated revenue, webhook-verified gifting, post-wedding archival, and production stress testing.

- **Week 8 — SePay VietQR Integration (Gifting & SaaS Billing)**:
  - Build EMVCo Napas VietQR generator (`DCO<code>` gifts, `DCOPLAN<code>` SaaS upgrades).
  - Implement hardened webhook receivers (`/api/webhooks/sepay`) with HMAC verification, `providerTxId` idempotency, Redis cross-shard celebration fireworks (hiding `amountVnd` from public view), and private `GiftLedger` CSV/PDF export for hosts.
- **Week 9 — 24h Trial Engine & `weddingDate + 7 days` 2D Memorial Archive**:
  - Enforce `15 CCU` cap, Photobooth watermark, and hard VietQR lock on `TRIAL_24H` rooms.
  - Build the static/ISR **2D Forever Memorial Page** rendering Album, Photobooth Wall, Guestbook, Bouquet Hall of Fame, and Embedded Video after archival.
  - Deploy `expire-24h-trials` and `archive-weddings-to-2d` background cron jobs.
- **Week 10 — Load Testing, Production VPS Hardening & Viral Launch**:
  - Deploy full Docker Compose stack (`Caddy`, `web`, `realtime`, `livekit`, `postgres`, `redis`) on production Ubuntu VPS behind Cloudflare DNS/R2.
  - Simulate `300+` concurrent bots across sharded rooms + burst `SePay` webhook traffic.
  - Launch the **24/7 Public Wedding Plaza** campaign on TikTok/Threads to ignite the `1+2` growth flywheel.

---

## 2. Quantitative Go-Live Readiness Checklist

Every item below must pass on staging/production before opening public traffic:

### Performance & 3D Asset Verification
- [ ] Initial WebGL asset bundle (`avatar-rig.glb` + starter venue + textures) transfers under **`5.0 MB`** (Draco + KTX2/WebP).
- [ ] Mid-range smartphone (4GB RAM Android / iPhone 11) sustains **`>= 30 FPS`** inside a `50-avatar` sharded hall (auto-quality fallback activates cleanly if below `28 FPS`).
- [ ] Grid-Snap Builder walkability validator catches overlapping tables and blocked `SpawnGate -> Stage / SeatAnchor` paths on both client and server.

### Realtime, Voice & Cross-Shard Verification
- [ ] `55+` simulated clients automatically shard cleanly into `Hall 1` and `Hall 2` without WebSocket drops.
- [ ] Seated VIP guests connect to scoped LiveKit table audio only when sitting, and `STAGE_BROADCAST` cleanly applies **`-12dB` ducking** across tables.
- [ ] Zalo / Messenger WebView renders 3D hall smoothly and presents the 1-tap Safari/Chrome handoff when `getUserMedia` is blocked.
- [ ] External YouTube Live / Drive PiP player synchronizes cleanly without passing video traffic through the VPS.

### Security, Privacy & Webhook Verification
- [ ] `PUBLIC_PLAZA` and `TRIAL_24H` rooms physically reject `GiftIntent` / VietQR endpoints (`403 Forbidden`).
- [ ] Real Wedding rooms block unauthenticated entry; Social-UID bans (`MOD_ACTION: BAN`) immediately terminate sockets and block re-entry across browsers.
- [ ] Duplicate `SePay` webhook deliveries with the same `providerTxId` execute **exactly once** (idempotency verified) and never expose `amountVnd` in public room broadcasts.
- [ ] Automated cron cleanly converts a past-due (`weddingDate + 7 days`) test wedding into the **2D Forever Memorial Page** while closing active Colyseus/LiveKit access.
