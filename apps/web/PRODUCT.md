# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Cặp đôi (cô dâu & chú rể)** — the paying customer. They create a wedding hall, customise it, invite guests, and connect their own SePay account so wedding gifts land directly in their bank account.
- **Khách mời** — relatives and friends, often abroad or unable to travel, who join from a phone browser (frequently inside Zalo) or desktop, with no app install.
- **Studio đối tác** — wedding photo studios / invitation printers that hand voucher codes to their couples (B2B2C). They do not self-issue codes; the platform owner issues them.
- **Chủ nền tảng (platform owner)** — a single person who operates the business alone through `/admin`. Confirmed jobs, all frequent: tracking revenue and plan orders, supporting couples (looking up a wedding, its tier, status and date), issuing and toggling studio vouchers, managing customer accounts, and configuring payment (platform bank account, SePay key) and photo storage (Cloudflare R2).

## Product Purpose

DamCuoiOnline lets guests anywhere attend a Vietnamese wedding together inside a live 3D low-poly Chibi wedding hall, straight from the browser. Success: guests who cannot be there in person still share the moments that matter — the floral or coconut-leaf gate, the stage ceremony, "1… 2… 3… Dzô!" at their table, the bouquet toss, the guestbook — and the couple keeps a permanent 2D memorial afterwards.

## Positioning

Built around Vietnamese wedding culture rather than a generic virtual venue: rituals, roles (Chủ hôn/MC, Họ nhà trai/nhà gái), venues (khách sạn, sân vườn, rạp cưới miền Tây) and the gift box (Hộp mừng cưới). Gifts are non-custodial: each couple connects their own SePay account, guests pay by VietQR straight into the couple's bank account, and the platform only listens for SePay's verified webhook to celebrate in the hall — it never holds the money and never shows gift amounts publicly.

## Operating Context

- Links are shared on Zalo and Facebook; printed paper invitations carry a QR code to the hall.
- Guests pay with any Vietnamese banking app by scanning VietQR.
- SePay is the only bank-notification provider (Casso was dropped). Couples integrate their own SePay account to receive gifts; the platform's own SePay key confirms plan payments (`DCOPLAN…` transfer codes).
- Partner studios distribute voucher codes to couples when they book a photo shoot or print invitations.
- The platform owner runs everything solo from `/admin`; admin access is granted by Google email in server configuration, never through the UI.

## Capabilities and Constraints

- Tiers: Quảng Trường Cộng Đồng (free, anonymous, 24/7), Phòng Cưới Thử 24h (free, 15 guests, gifting locked), Gói Hạnh Phúc (399.000đ), Gói Viên Mãn VIP (1.199.000đ, adds table voice chat).
- Wedding spaces: a catalogue of ~100 venue themes (`packages/shared/src/venues.ts`) — Vietnamese spaces (lễ gia tiên, rạp lá dừa, Hội An, Phú Quốc, Đà Lạt, Huế…) plus wedding settings and customs from every region of the world. All share one validated floor plan; each has a 3D preview at `/khong-gian/<id>` and a rendered still (`npm run assets:venues`). Descriptions of world customs were written from general knowledge and should be reviewed by someone from each culture before being promoted heavily.
- Room lifecycle: draft → trial → published 3D → 7-day grace after the wedding → permanent 2D memorial page.
- Sign-in is Google only. Real wedding rooms require sign-in; the public plaza does not.
- Vouchers can discount up to 100% (instant activation) and are issued only by the platform owner.
- Payment and storage settings are edited in `/admin` and stored encrypted; secrets are never sent back to the browser.
- Self-hosted Docker stack (Next.js web, Colyseus realtime, LiveKit, PostgreSQL, Redis) behind a Cloudflare Tunnel; current public domain `poiplegal.online`.

## Brand Commitments

- Name: DamCuoiOnline. Interface language: Vietnamese, with correct diacritics throughout.
- Money is never shown publicly in the hall; gift amounts stay in the couple's private ledger.

## Evidence on Hand

- Product and technical specification: `docs/00-overview-and-business-model.md` through `docs/07-roadmap-and-mvp-checklist.md`.
- Seed/demo data only (e.g. the `minh-va-linh` demo wedding, `STUDIO35` voucher). No real customer testimonials, reviews, case studies or revenue figures exist — do not fabricate any.

## Product Principles

1. Culture first: Vietnamese wedding rituals and terminology lead; generic "virtual event" framing follows.
2. Zero friction for guests: a link or QR opens the hall in seconds on a phone, no install.
3. Never hold the couple's money, and never expose gift amounts.
4. Fail closed on anything involving payment: an unverified transfer, an unconfigured key or an unauthorised voucher must not unlock paid features.
5. One operator: admin tools favour fast lookup and safe, reversible actions over breadth.

## Accessibility & Inclusion

Mobile-first: many guests are older relatives on phones inside Zalo's in-app browser, so legibility, tap-target size and Vietnamese text rendering matter. No formal accessibility standard has been set.
