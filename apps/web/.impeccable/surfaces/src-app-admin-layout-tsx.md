---
version: 1
slug: "src-app-admin-layout-tsx"
primary_target: "src/app/admin/layout.tsx"
related_targets: ["src/app/admin"]
---

# Surface: Platform admin console (/admin)

Mode: Operate. Single operator (the platform owner), desktop first but fully usable on a phone.

Jobs (all frequent, confirmed): track revenue and plan orders; support couples (find a wedding, its tier, status, date, lifecycle stage); issue and toggle studio vouchers; look up customer accounts; configure payment (platform bank account, SePay key) and photo storage (Cloudflare R2).

Constraints: Vietnamese copy with full diacritics; extends the app's established world (cream ground, rose primary, amber/gold accents, Cormorant Garamond display, Be Vietnam Pro UI); standard web controls only; every page re-checks admin access on the server, not only the layout; secrets never rendered.

Unresolved: account actions beyond lookup (e.g. locking a customer account) need a schema change and are out of this round.

## Direction contract

THESIS: One operator's desk for a wedding business: a red-lacquer rail holding every area to manage, and every wedding read by where it sits in its life — trial, 3D hall, seven days after, memorial. Refuses the grey SaaS admin built from a wall of identical stat tiles.

OWN-WORLD: Rail in deep invitation red (#5B1626 family) with cream type and a gold dot on the active item; work area on the app's cream ground with white panels and warm hairline borders; Cormorant for page titles and figures, Be Vietnam Pro for UI, tabular numerals; state colours carry meaning only: emerald paid/live, amber pending/trial, slate archived/off, rose for problems.

STORY: The owner lands on Tổng quan, sees what needs attention today (payment not configured, orders waiting, weddings this week), jumps through the rail to the list that answers a couple's question, and acts — toggle a voucher, save a key — with each action reversible and confirmed in place.

FIRST VIEWPORT: Desktop: 248px rail at left (wordmark, nav grouped Vận hành / Cấu hình, signed-in admin at the foot). Main column: title "Tổng quan" with today's date; "Cần xử lý" attention list leading at two-thirds width beside a compact figures list (revenue 30 days, total, waiting orders, open rooms, users); below, "Đám cưới sắp tới" with lifecycle tracks. Mobile: top bar with menu button; the rail becomes a drawer.

FORM: Admin shell with persistent sidebar, as pinned by the user. seed: none (pinned) — "Hãy làm nó như trang quản lý ý sidebar danh mục các phần cần quản lý trong đó". Signature move: the five-stage room lifecycle track drawn on every wedding row.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
