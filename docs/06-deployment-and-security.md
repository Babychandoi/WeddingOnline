# 06 — Production Deployment, VPS Infrastructure & Security

## 1. Ubuntu VPS Docker Compose Stack

The entire platform runs cost-effectively on a single scalable Linux VPS (recommended baseline: **4 vCPU, 8GB RAM, 100GB NVMe**, Ubuntu 24.04 LTS) behind Cloudflare DNS/WAF.

### 1.1 Reference `infra/docker-compose.yml`

```yaml
services:
  caddy:
    image: caddy:2.8-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - web
      - realtime
      - livekit

  web:
    build:
      context: ..
      dockerfile: apps/web/Dockerfile
    restart: unless-stopped
    env_file: .env
    environment:
      - NODE_ENV=production
      - PORT=3000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  realtime:
    build:
      context: ..
      dockerfile: apps/realtime/Dockerfile
    restart: unless-stopped
    env_file: .env
    environment:
      - NODE_ENV=production
      - PORT=2567
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  livekit:
    image: livekit/livekit-server:v1.8
    restart: unless-stopped
    command: --config /etc/livekit.yaml
    network_mode: host # Optimal UDP WebRTC throughput for 50000-60000 port range
    volumes:
      - ./livekit.yaml:/etc/livekit.yaml:ro
    depends_on:
      redis:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  caddy_data:
  caddy_config:
  pg_data:
  redis_data:
```

### 1.2 Reference `infra/Caddyfile`

```caddyfile
damcuoionline.vn, www.damcuoionline.vn {
    encode zstd gzip

    # Colyseus WebSocket & Matchmaker endpoints
    handle /colyseus/* {
        uri strip_prefix /colyseus
        reverse_proxy realtime:2567
    }

    # LiveKit Signaling WebSocket (Must bypass Cloudflare proxy OR use DNS-only subdomain lk.damcuoionline.vn)
    handle {
        reverse_proxy web:3000
    }
}

lk.damcuoionline.vn {
    reverse_proxy 127.0.0.1:7880
}
```

### 1.3 Reference `infra/livekit.yaml`

```yaml
port: 7880
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true
redis:
  address: 127.0.0.1:6379
  password: "${REDIS_PASSWORD}"
keys:
  ${LIVEKIT_API_KEY}: "${LIVEKIT_API_SECRET}"
room:
  auto_create: false        # Only backend API-minted tokens can instantiate rooms
  empty_timeout: 120        # Free memory 2m after last guest stands up
  max_participants: 15      # Strictly bounds per-table & stage speaker capacity
logging:
  level: warn
```

> **Important DNS Note**: Set `lk.damcuoionline.vn` to **DNS Only (Grey Cloud)** on Cloudflare so UDP WebRTC media packets reach the VPS LiveKit ports directly, while keeping `damcuoionline.vn` **Proxied (Orange Cloud)** for DDoS/WAF protection.

### 1.4 Reference `infra/.env.example`

```env
# Database & Cache
POSTGRES_USER=dco_admin
POSTGRES_PASSWORD=change_me_strong_pg_password
POSTGRES_DB=damcuoionline
DATABASE_URL=postgresql://dco_admin:change_me_strong_pg_password@postgres:5432/damcuoionline
REDIS_PASSWORD=change_me_strong_redis_password
REDIS_URL=redis://:change_me_strong_redis_password@redis:6379

# Auth & OAuth Providers
NEXTAUTH_URL=https://damcuoionline.vn
NEXTAUTH_SECRET=generate_32_byte_random_hex
ZALO_CLIENT_ID=your_zalo_app_id
ZALO_CLIENT_SECRET=your_zalo_app_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_CLIENT_ID=your_fb_app_id
FACEBOOK_CLIENT_SECRET=your_fb_app_secret

# LiveKit Self-Hosted SFU
LIVEKIT_URL=wss://lk.damcuoionline.vn
LIVEKIT_API_KEY=lk_prod_key
LIVEKIT_API_SECRET=generate_strong_livekit_secret

# Cloudflare R2 (Zero-Egress Asset & Photo Storage)
R2_ACCOUNT_ID=your_cf_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=damcuoionline-assets
R2_PUBLIC_CDN_URL=https://cdn.damcuoionline.vn

# Platform Billing Webhooks (SaaS Upgrades: DCOPLAN...)
PLATFORM_BANK_BIN=970422
PLATFORM_BANK_ACCOUNT=0123456789
PLATFORM_BANK_NAME=CONG TY DAMCUOIONLINE
PLATFORM_SEPAY_API_KEY=your_sepay_bearer_key

# Internal Service Secret
INTERNAL_SERVICE_SECRET=shared_hmac_between_web_and_realtime
```

---

## 2. Firewall & Port Rules (`ufw`)

| Port / Protocol | Exposure | Purpose |
| :--- | :--- | :--- |
| `22/tcp` | SSH Allowlist / Key-only | Server administration (disable password login) |
| `80/tcp`, `443/tcp`, `443/udp` | Public (`0.0.0.0/0`) | Caddy HTTPS + HTTP/3 + Colyseus WSS |
| `7881/tcp` | Public (`0.0.0.0/0`) | LiveKit WebRTC ICE/TCP fallback |
| `50000-60000/udp` | Public (`0.0.0.0/0`) | LiveKit WebRTC media streams |
| `5432/tcp` (Postgres), `6379/tcp` (Redis), `3000/tcp`, `2567/tcp` | **Internal Docker / Localhost Only** | Never exposed to public internet |

---

## 3. Cloudflare R2 Asset Architecture & Presigned Uploads

1. **Bucket Partitioning**:
   - `static-assets/v1/`: Versioned immutable `.glb` starter halls, Chibi rig, outfits, KTX2 textures (`Cache-Control: public, max-age=31536000, immutable`).
   - `weddings/<weddingId>/gallery/`: Couple pre-wedding photos (WebP resized client-side `<= 1920px`).
   - `weddings/<weddingId>/photobooth/`: Guest Polaroid captures (`1080x1350`).
   - `trials/<weddingId>/`: Isolated prefix for `TRIAL_24H` rooms.
2. **Direct Browser Presigned Upload**:
   - Authenticated user requests `POST /api/r2/presign` (`{ weddingId, contentType, byteSize }`).
   - Backend enforces tier photo caps (`6` Trial, `20` Happiness, `50` VIP; `3` Photobooth shots per guest), checks `byteSize <= 5MB` and MIME `image/webp | image/png | image/jpeg`, and issues a 60-second S3-compatible PUT URL directly to R2.
3. **R2 Lifecycle Rule**: Configure Cloudflare R2 lifecycle expiration on prefix `trials/` to auto-delete objects older than `7 days`, keeping storage costs lean when trial hosts do not upgrade.

---

## 4. Security & Anti-Troll Matrix

| Threat Vector | Mitigation Implemented |
| :--- | :--- |
| **Anonymous Wedding Crashers** | Real Wedding rooms (`TRIAL_24H`, `HAPPINESS`, `VIP_FULFILLMENT`) reject unauthenticated requests; **Zalo/Google/Facebook OAuth** + optional 4-digit Room PIN required before obtaining a Colyseus join token. |
| **Repeat Trolls Creating New Tabs** | Bans write `userId` (tied to verified Social UID in `Account`) into both `WeddingMember.moderationStatus = BANNED` and Redis `wedding:<id>:bans` (`TTL 30d`). Re-joining is blocked at `/join` and inside Colyseus `onAuth`. |
| **Avatar Body-Blocking / Crowding** | Zero player-to-player physics collision; avatars pass cleanly through each other. |
| **Toxic Text Chat / Profanity** | `packages/shared/src/profanity.ts` normalizes Vietnamese diacritics & leetspeak (`d.m`, `v.k.l`, etc.) and masks matches; rate limit enforced (`1 message / 1.5s`, max `80 chars` per bubble). |
| **Fake VietQR Transfer Pranks** | Guests cannot self-mark a gift paid. Celebrations fire **only** upon HMAC/API-Key verified `SePay` webhook + unique `providerTxId` deduplication. |
| **Webhook Replay / Spoofing** | Constant-time secret/HMAC verification + `UNIQUE(providerTxId)` constraint + timestamp tolerance check. |
| **Abusive Voice Flooding** | `MC`/`OWNER` 1-click Mute calls LiveKit Server SDK `mutePublishedTrack` immediately and sets `canPublish = false` in `WeddingMember`. |

---

## 5. Automated Maintenance & Archival Cron Jobs

| Job Name | Schedule | Exact Responsibility |
| :--- | :--- | :--- |
| **`expire-24h-trials`** | Every `15 minutes` | Finds `Wedding` rows where `tier = 'TRIAL_24H' AND status = 'TRIAL_ACTIVE' AND trialExpiresAt <= NOW()`. Sets `status = 'EXPIRED_TRIAL'`, publishes Redis `ROOM_EXPIRED` to disconnect active sockets, and schedules trial cleanup. |
| **`archive-weddings-to-2d`** | Daily at `03:00` (`Asia/Ho_Chi_Minh`) | Finds paid weddings where `status IN ('PUBLISHED_3D', 'GRACE_PERIOD_7D') AND archiveAt <= NOW()` (`weddingDate + 7 days`). Transitions `status = 'ARCHIVED_2D_FOREVER'`, `archivedAt = NOW()`, kicks lingering sockets cleanly via Redis `FORCE_ARCHIVE_ROOM`, and triggers Next.js ISR revalidation so `/w/<slug>` permanently renders the static 2D Forever Memorial Page. |
| **`pg-backup-to-r2`** | Daily at `03:30` (`Asia/Ho_Chi_Minh`) | Executes compressed `pg_dump` encrypted with `age`/`gpg` and uploads to a private non-public R2 backup bucket (`30-day` retention). |
