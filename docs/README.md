# DamCuoiOnline — Technical & Product Specification Suite

> **A zero-friction, 3D multiplayer virtual wedding platform tailored for Vietnamese wedding culture**, combining the viral accessibility of browser-based social spaces (inspired by *Sansa Temple*) with a sustainable, non-custodial SaaS revenue engine for real weddings.

---

## Executive Summary

**DamCuoiOnline** enables guests anywhere in the world—especially relatives abroad, busy colleagues, or friends unable to attend in person—to step into a lively 3D Low-Poly Chibi wedding hall directly from a mobile or desktop browser in seconds without installing an app.

To overcome the inherent low purchase frequency of wedding products, the platform pairs a **free viral community funnel** (*24/7 Public Wedding Plaza* and *24-Hour Free Trial Rooms*) with **paid SaaS Private Wedding Halls** featuring a Grid-Snap 3D Scene Builder, table-zoned WebRTC voice chat, dual-mode Auto-NPC/Live Takeover Bride & Groom avatars, external livestream Picture-in-Picture overlays, and 100% webhook-verified VietQR wedding gifting. Seven days after the ceremony, paid rooms gracefully transition into a permanent, ultra-lightweight 2D Memorial Page.

---

## Documentation Index

| Document | Scope & Contents |
| :--- | :--- |
| **[00-overview-and-business-model.md](./00-overview-and-business-model.md)** | Product vision, Hybrid `1+2` PLG growth flywheel, strict Free/Paid safety firewall, tier comparison matrix, room lifecycle state machine, and Vietnamese payment legal compliance. |
| **[01-user-flows-and-features.md](./01-user-flows-and-features.md)** | End-to-end user journeys (Plaza, Trial, Couple Onboarding, OAuth Guest Entry), Dual-Mode Bride/Groom & MC Takeover, synchronized rituals, physics Bouquet Toss, Polaroid Photobooth, and 2D Memorial Archive. |
| **[02-3d-builder-and-assets-spec.md](./02-3d-builder-and-assets-spec.md)** | WebGL mobile performance budget (`< 5MB` initial load), modular Chibi avatar rig & shared animations, `0.5m` Grid-Snap 3D Scene Builder JSON schema, Smart Prefabs, 2D A*/BFS walkability validator, and Zalo WebView degradation strategy. |
| **[03-system-architecture.md](./03-system-architecture.md)** | `pnpm` + `Turborepo` monorepo layout, multi-protocol client-server traffic split, Colyseus hall sharding (`50-60` CCU/shard), and Redis Pub/Sub cross-hall synchronization. |
| **[04-database-schema.md](./04-database-schema.md)** | Entity-Relationship diagram, complete production Prisma schema (`schema.prisma`) for PostgreSQL, indexing strategy, strict privacy boundaries for `GiftLedger`, and archival queries. |
| **[05-realtime-and-webhook-protocols.md](./05-realtime-and-webhook-protocols.md)** | Colyseus `@colyseus/schema` definitions, `10Hz` WebSocket message catalog, lazy LiveKit table-zone voice & `-12dB` stage ducking, external PiP video sync, and HMAC-verified SePay VietQR webhook flows. |
| **[06-deployment-and-security.md](./06-deployment-and-security.md)** | Production Docker Compose stack (`Caddy`, `Next.js`, `Colyseus`, `LiveKit`, `PostgreSQL`, `Redis`), firewall rules, Cloudflare R2 presigned asset pipeline, anti-troll/OAuth enforcement, and automated cron jobs. |
| **[07-roadmap-and-mvp-checklist.md](./07-roadmap-and-mvp-checklist.md)** | 4-Phase (10-Week) engineering execution roadmap, milestone deliverables, and quantitative Go-Live verification checklist. |

---

## Summary of Locked Architectural Decisions (ADRs)

| ID | Decision Area | Locked Choice & Rationale |
| :--- | :--- | :--- |
| **ADR-01** | **Business Model** | **Hybrid `1+2` (Public Viral + Private SaaS)**: Free *24/7 Public Wedding Plaza* + *24h Free Trial Room* (15 CCU cap, Photobooth watermark, VietQR locked) funnel organic traffic into *Paid Real Wedding SaaS Rooms*. |
| **ADR-02** | **Bride & Groom Control** | **Dual Mode (Auto-NPC + Live Takeover + MC Delegation)**: Server-driven NPCs greet guests and run scheduled rituals automatically; authenticated Bride, Groom, or delegated `MC` can take over avatars live and trigger `STAGE_BROADCAST` (`-12dB` table voice ducking). |
| **ADR-03** | **Identity & Anti-Troll** | **Split Auth Policy**: Anonymous `GuestSession` in the *24/7 Public Plaza*; **Mandatory Social OAuth (`Zalo`, `Google`, `Facebook`)** for all hosts and guests in Real Wedding Rooms, paired with permanent Social-UID Mute/Ban, optional 4-digit Room PIN, and zero avatar collision. |
| **ADR-04** | **3D Engine & Builder** | **R3F + Grid-Snap 3D Scene Builder**: `Three.js` / `@react-three/fiber` using Draco `.glb`, KTX2/WebP, Baked Lightmaps (`< 5MB` initial load). Couples customize starter templates by snapping Smart Prefabs onto a `0.5m` floor grid with A*/BFS walkability validation. |
| **ADR-05** | **VietQR & Billing** | **100% Webhook-Verified, Non-Custodial**: Dynamic Napas VietQR pays directly into the couple's personal bank account (`DCO<code>`). 3D hall fireworks only fire after an HMAC-signed `SePay` webhook confirms receipt. VND amounts are strictly hidden from public 3D toasts. SaaS upgrades use `DCOPLAN<code>` webhooks at 0% gateway fee. |
| **ADR-06** | **Stage LED Video** | **External Embeds Only (Zero Video Bandwidth Cost)**: Supports `YouTube Live`, `YouTube Video`, `Vimeo`, and `Google Drive` URLs. Stage 3D LED displays a preview shader; clicking opens a synchronized draggable Picture-in-Picture (PiP) / Theater overlay. |
| **ADR-07** | **Infrastructure** | **Self-Hosted Docker VPS + Cloudflare R2**: Monorepo (`pnpm` + `Turborepo`) deployed on Ubuntu VPS (`Caddy`, `web`, `realtime`, self-hosted `livekit`, `postgres`, `redis`) with Cloudflare CDN & R2 (`0` egress fees for 3D & photo assets). |
| **ADR-08** | **Post-Wedding Lifecycle** | **7-Day Active Window -> Permanent 2D Memorial**: 3D Colyseus/LiveKit rooms remain active through `weddingDate + 7 days`, then an automated job closes realtime resources and renders `/w/<slug>` as a static/ISR 2D Forever Memorial Page. |

---

## Vietnamese Wedding Cultural Glossary

| Vietnamese Term | Literal / Cultural Meaning | System Implementation Mapping |
| :--- | :--- | :--- |
| **Sảnh Quảng Trường Cưới** | Community Wedding Plaza | Always-on, sharded public 3D space (`WeddingTier.PUBLIC_PLAZA`) open anonymously for social fun and viral discovery. |
| **Cổng Hoa / Cổng Lá Dừa** | Floral Gate / Mekong Coconut-Leaf Gate | `ReceptionGatePrefab` placed at the player spawn area (`SpawnGate`) supporting Modern Floral, Garden Arch, and *Rạp Cưới Miền Tây* coconut-leaf designs. |
| **Họ Nhà Trai / Họ Nhà Gái** | Groom's Side / Bride's Side | Guest affiliation badge selected during onboarding (`GROOM_SIDE`, `BRIDE_SIDE`, `FRIEND`, `COLLEAGUE`) displayed cleanly beside the avatar nameplate. |
| **Chủ Hôn / MC / Phụ Rể** | Ceremony Host / Emcee / Best Man | `WeddingMember` role `MC`, granted `NPC_TAKEOVER`, `TRIGGER_CEREMONY`, `STAGE_BROADCAST`, and room moderation (`Mute`/`Kick`) capabilities. |
| **Bàn Tiệc Tròn** | Round Banquet Table (10 seats) | `BanquetTablePrefab` containing `8-10` `SeatAnchor` coordinates and a scoped `LiveKit` voice channel (`wedding_<id>_table_<no>`). |
| **1... 2... 3... Dzô!!** | Traditional Vietnamese group toast | Synchronized table action (`TABLE_CHEERS`) that triggers raised-glass animations, chime SFX, and confetti bursts for all seated guests at that table. |
| **Sổ Lưu Bút** | Wedding Guestbook | Persistent `GuestbookEntry` messages signed by OAuth-verified guests, preserved permanently on the post-wedding 2D Memorial Page. |
| **Hộp Mừng Cưới (Tiền Mừng)** | Wedding Gift Box (Lucky Money) | `GiftBoxPrefab` generating a unique `DCO<code>` VietQR transfer slip; public celebration fires strictly on SePay webhook while hiding exact VND amounts in `GiftLedger`. |
| **Tung Hoa Cưới** | Bouquet Toss Ritual | Server-authoritative parabolic physics mini-game (`TOSS_BOUQUET`) awarding the catcher the *"Người tiếp theo lên xe hoa"* (Next to Get Married) overhead crown and shareable card. |
| **Áo Dài / Vest / Đầm** | Traditional Tunic / Suit / Evening Gown | Modular outfit meshes sharing the common Chibi humanoid armature and animation set. |
