# Tiến Trình Hoàn Thiện Hệ Thống DamCuoiOnline

> File theo dõi tiến trình theo từng nhóm công việc hoàn thành.

## Giai Đoạn Nền Tảng (Đã hoàn thành trước đó)
- [x] Bộ tài liệu đặc tả kỹ thuật đầy đủ 9 file trong `docs/`
- [x] Cấu trúc Monorepo (`@dco/shared`, `@dco/database`, `@dco/realtime`, `@dco/web`, `infra/`)
- [x] Không gian 3D Low-Poly Chibi (Áo dài, Mấn, Voan cưới, Hoa cài ngực) & 3 chủ đề Việt Nam (Khách sạn, Sân vườn, Rạp Cưới Miền Tây Cổng Lá Dừa)
- [x] Server Colyseus `10Hz` Multiplayer, tự động chia sảnh (`Sharding`), Auto-NPC & Nhập vai trực tiếp, Tung hoa cưới vật lý
- [x] Trình thiết kế Grid-Snap `60×60` ô + kiểm tra lối đi BFS/A*
- [x] Thanh toán & Mừng cưới VietQR xác thực Webhook SePay/Casso, Dual-Mode PostgreSQL Prisma + OAuth 2.0

---

## Các Nhóm Hoàn Thiện Toàn Hệ Thống

### [x] Nhóm 1: Hệ thống Âm thanh Web Audio (Nhạc nền BGM lãng mạn, Hiệu ứng SFX & Tự động giảm âm `-20dB` khi MC phát biểu)
- [x] Tạo `apps/web/src/lib/soundEngine.ts` (Web Audio API không phụ thuộc file ngoài)
- [x] Tích hợp vào `HallExperience.tsx`: nút Bật/Tắt nhạc cưới, SFX cụng ly / vỗ tay / pháo hoa / tung hoa, giảm âm `-20dB` khi MC bật mic sân khấu

### [x] Nhóm 2: Hoàn thiện Dashboard Chủ Tiệc (Nâng cấp gói tại chỗ, Link mời MC/Cô dâu/Chú rể, Gỡ chặn Unban/Unmute & Hẹn giờ Auto-NPC làm lễ)
- [x] Thêm `signRoleInviteToken` / `verifyRoleInviteToken` trong `packages/shared/src/token.ts`
- [x] Mở rộng `/api/weddings/[slug]/members` & `/join` hỗ trợ đổi vai trò, Unban/Unmute, tạo link mời quyền `MC`/`BRIDE`/`GROOM`
- [x] Nâng cấp `WeddingHallRoom.ts` tự chạy nghi lễ & tung hoa đúng giờ `ceremonyTimeIso` + phát lời chào Auto-NPC
- [x] Nâng cấp `DashboardClient.tsx`: Nút nâng cấp gói VietQR ngay tại Dashboard, tab Thành viên/MC/Kiểm duyệt, form hẹn giờ lễ Auto-NPC

### [x] Nhóm 3: Thiệp Mời Điện Tử, Mã QR In Thiệp Giấy, OpenGraph Zalo/FB & Sổ Kỷ Niệm PDF
- [x] Thêm `generateMetadata` & `opengraph-image.tsx` (`1200×630`) cho `/w/[slug]`
- [x] Tạo trang thiệp mời 2D `/w/[slug]/invite`
- [x] Thêm tab **Thiệp Mời & Mã QR In Ấn** (`1200×1600` PNG tải về cho xưởng in) trong `DashboardClient.tsx`
- [x] Tạo trang in / xuất PDF **Sổ Kỷ Niệm** `/dashboard/[slug]/print` (`@media print` A4)

### [x] Nhóm 4: Cổng Đối Tác Studio Ảnh Cưới (B2B2C) & Hệ Thống Mã Voucher
- [x] Thêm model `PartnerVoucher` vào Prisma schema & repository (`prismaRepo.ts` + `store.ts`), seed sẵn `STUDIO35` & `STUDIOVIP100`
- [x] Tạo `/api/vouchers`, hỗ trợ áp mã giảm giá / kích hoạt ngay 100% vào `/api/orders`, `/create` & Dashboard
- [x] Xây dựng trang `/partner` quản lý mã giảm giá & lượt dùng cho Studio đối tác (kèm link từ Trang chủ)

### [x] Nhóm 5: Pipeline Tài Nguyên 3D `.glb` Chuẩn nhị phân & Tích hợp `GLTFLoader`
- [x] Tạo script `scripts/generate-glb-assets.mjs` xuất 4 `.glb` nhị phân chuẩn glTF 2.0 (`stage-cake.glb`, `gift-heart-box.glb`, `bouquet-flowers.glb`, `coconut-arch-crest.glb`, tổng `75.3 KB < 500 KB`) vào `apps/web/public/models/`
- [x] Tạo `GlbAssetMesh.tsx` & tích hợp vào `VenueScene.tsx` cho Bánh cưới, Hộp quà tim, Bó hoa cưới & Khánh tiết Cổng Lá Dừa

### [x] Nhóm 6: Cụm Docker Thực Tế (`PostgreSQL 16` + `Redis 7` + `LiveKit SFU`), Load Test `120+` CCU & Khởi Chạy Chính Thức
- [x] Tạo `infra/docker-compose.dev.yml` & `infra/livekit.dev.yaml` (`dco-postgres` `5433`, `dco-redis` `6380`, `dco-livekit` `7880-7882`) và khởi chạy toàn cụm healthy
- [x] Cấu hình `.env` gốc + tự nạp `.env` (`store.ts` & `next.config.mjs`), chạy `db:push` & `db:seed` lên PostgreSQL thật (`3 weddings`)
- [x] Chạy kiểm thử toàn diện: `npm test` (`6/6`), `npm run build` (`4/4` packages), `smoke-test.mjs` trên `prisma-postgres` (`PASS`), `load-test.mjs` (`120 CCU` qua 3 shards trong `4786ms` + `20` concurrent SePay webhooks: `15` verified / `5` duplicate, `PASS`)
- [x] Bật daemon `npm run dev` kết nối trực tiếp PostgreSQL 16 + Redis 7 + LiveKit SFU (`http://localhost:3000` & `ws://127.0.0.1:2567`) — **100% Hệ Thống Sẵn Sàng**

### [x] Nhóm 7: Rà Soát Lỗi Trình Duyệt, Tối Ưu Tương Tác 3D 60fps & Nâng Cấp UI/UX Toàn Diện
- [x] Khắc phục triệt để lỗi SSR hydration mismatch trên `/partner` & `/create`, thêm trạng thái chờ `!authChecked` tránh nhấp nháy UI chưa đăng nhập
- [x] Bổ sung nút **Vào nhanh Chủ Tiệc Demo** trên `OAuthModal.tsx`, màn hình khôi phục khi nhầm tài khoản Khách ở `DashboardClient.tsx`, cùng nút **Chép Link Mời / Đổi tài khoản / Thiệp 2D**
- [x] Tối ưu chuyển động 3D Chibi dự đoán `60fps` (`ChibiAvatar.tsx` + `VenueScene.tsx`), điều khiển `WASD` theo hướng camera & camera lướt theo nhân vật, chống kẹt phím khi mất focus (`blur`), trượt tường A*/lưới, con trỏ `pointer` khi hover vật phẩm và thanh đi nhanh (`Cổng Hoa` / `Sân Khấu` / `Bàn Tiệc`)
- [x] Mở đầy đủ bộ tùy chỉnh **6 kiểu tóc & 5 màu tóc Chibi** kèm thẻ xem trước trực quan, biểu cảm trên cả Mobile & Desktop, toast mượt không rung lắc, cùng Landing Page & Thiệp mời 2D chuẩn font Việt (`Cormorant Garamond` + `Be Vietnam Pro`)
- [x] Kiểm chứng sau sửa lỗi: Impeccable `detect.mjs` xử lý sạch cảnh báo tương phản, `tsc --noEmit` (`0` lỗi), `npm test` (`6/6`), `npm run build` (`4/4`), `smoke-test.mjs` (`ALL E2E SMOKE CHECKS PASSED SUCCESSFULLY (prisma-postgres)!`) — *(Lưu ý: Chrome tự động cần người dùng bật `chrome://inspect/#remote-debugging` vì máy chưa có `DevToolsActivePort`)*

### [x] Nhóm 8: Chuyển Xác Thực Sang Google-Only & Tự Động Hóa Kiểm Tra Go-Live
- [x] Chuyển hệ thống OAuth sang **chỉ dùng Google** (`OAuthModal.tsx`, `/api/auth/oauth/[provider]`, `/api/health`, `/api/auth/login` tự khóa bypass khi có khóa Google thật trên production)
- [x] Thêm `apps/web/src/lib/runtimeEnv.ts` đọc nóng `.env` gốc cho Google OAuth, R2, SePay/Casso mà không cần khởi động lại server
- [x] Cập nhật `.env`, `infra/.env.example`, `infra/docker-compose.yml` (tự chạy `db:push` & `seed` khi khởi chạy container mới) và tạo lệnh `npm run check:golive` (`scripts/check-go-live.mjs`)
- [x] **Bước Google OAuth 2.0**: Đã kết nối thành công `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` (`oauthConfigured.google = true`, redirect `307 -> accounts.google.com`)

---

### [x] Nhóm 9: Đóng Gói Toàn Bộ Backend & Frontend Vào Docker + Xuất Tên Miền Cloudflare Tunnel (`poiplegal.online`)
- [x] Tạo `Dockerfile` tối ưu hóa Alpine nhiều giai đoạn cho `@dco/web` (Next.js 14 standalone) và `@dco/realtime` (Colyseus).
- [x] Cấu hình cụm `docker-compose.dev.yml` chạy đồng bộ 6 container:
  - `dco-postgres` (PostgreSQL 16)
  - `dco-redis` (Redis 7)
  - `dco-livekit` (LiveKit WebRTC SFU)
  - `dco-realtime` (Colyseus Realtime Server)
  - `dco-web` (Next.js Web Frontend & API Backend)
  - `dco-cloudflared` (Cloudflare Zero Trust Tunnel)
- [x] Tích hợp Cloudflare Tunnel tự động với zone `poiplegal.online`, thiết lập các CNAME:
  - Web: `https://poiplegal.online` & `https://www.poiplegal.online` -> container `web:3000`
  - WebSocket: `wss://ws.poiplegal.online` -> container `realtime:2567`
  - LiveKit WebRTC: `wss://lk.poiplegal.online` -> container `livekit:7880`
- [x] Kiểm tra kết nối HTTPS công khai: `/api/health`, `/api/weddings/minh-va-linh`, `/api/auth/oauth/google` hoạt động 100% trơn tru và trả về mã phản hồi hợp lệ.

---

### [x] Nhóm 10: Vá Bảo Mật Trước Khi Mở Public (Secret mặc định, Webhook, Đường nội bộ Realtime)
- [x] Thêm `packages/shared/src/secrets.ts`: trên production (`NODE_ENV=production`, không có `ALLOW_DEV_AUTH=1`) mọi secret thiếu hoặc còn giá trị dev đều bị từ chối — không còn fallback ngầm về khóa mặc định trong code
- [x] Webhook SePay/Casso trả `503 WEBHOOK_NOT_CONFIGURED` trên production khi chưa có khóa thật (trước đây chấp nhận khóa mặc định → có thể tự kích hoạt gói VIP miễn phí)
- [x] Realtime từ chối khởi động nếu `INTERNAL_SERVICE_SECRET`/`SESSION_SECRET` yếu; chặn `/internal/*` & `/shards/*` với request đi qua Cloudflare + thêm luật ingress `404` trong `infra/cloudflared/config.yml`
- [x] `/api/auth/login` (đăng nhập dev) luôn tắt trên production; nút đăng nhập Dev/Demo chỉ hiện khi server cho phép (`devAuthEnabled` trong `/api/health`)
- [x] LiveKit token trả `503` thay vì ký bằng khóa mặc định; `check:golive` kiểm tra đủ mọi secret; thêm lệnh `npm run secrets:rotate`
- [x] Kiểm chứng: `npm test` (`7/7`), `npm run typecheck` (`6/6`), realtime production từ chối khởi động với secret mặc định, `cloudflared ingress validate` OK

### [x] Nhóm 11: Trang Quản Trị Nền Tảng `/admin/settings` & Khóa Quyền Phát Hành Voucher
- [x] Chuyển tài khoản ngân hàng nhận tiền gói, khóa SePay/Casso và Cloudflare R2 từ `.env` vào database (model `PlatformSetting`); khóa bí mật mã hóa AES-256-GCM bằng `SETTINGS_ENCRYPTION_KEY`, không bao giờ gửi lại trình duyệt (chỉ hiện 4 ký tự cuối)
- [x] Quyền admin theo `PLATFORM_ADMIN_EMAILS` trong `.env` (email Google đã xác minh); thay đổi cấu hình có hiệu lực ngay, không cần khởi động lại
- [x] `/api/vouchers`: chỉ admin được xem danh sách / tạo / bật-tắt mã (trước đây ai đăng nhập cũng tạo được mã 100% = lên VIP miễn phí); đã tắt 3 mã 100% đang lộ trên production
- [x] Production chưa cấu hình ngân hàng → tạo đơn trả `503` thay vì hiện QR tới tài khoản giả `0123456789`; Casso trả đúng `503` để tự gửi lại
- [x] Kiểm chứng: `npm test` (`8/8`), `npm run typecheck` (`6/6`), E2E admin trên server tạm (`12/12`)

### [x] Nhóm 12: Chỉ Dùng SePay (Bỏ Casso)
- [x] Xoá route `/api/webhooks/casso`, khóa `PLATFORM_CASSO_SECURE_TOKEN` (code, trang admin, `.env`, `.env.example`, script) và mọi nhắc tới Casso trong `docs/`
- [x] `PATCH /api/weddings/[slug]` chỉ nhận `webhookProvider` là `SEPAY` (hoặc để trống)

### [x] Nhóm 13: Bảng Điều Khiển Quản Trị `/admin` Có Sidebar
- [x] Ghi `apps/web/PRODUCT.md` (sự thật sản phẩm) và bản định hướng thiết kế `apps/web/.impeccable/surfaces/`
- [x] Khung quản trị: sidebar đỏ rượu (thu thành ngăn kéo trên di động) với 7 mục — Tổng quan, Phòng cưới, Đơn hàng, Mã voucher, Người dùng, Thanh toán, Lưu trữ ảnh
- [x] Tổng quan: danh sách "Cần xử lý" (thiếu cấu hình thanh toán, đơn chờ, mã 100% đang bật, đám cưới trong tuần), số liệu doanh thu/đơn/phòng/người dùng, đám cưới sắp tới, đơn gần đây
- [x] Thanh vòng đời 5 giai đoạn (Nháp → Dùng thử → Sảnh 3D → Sau ngày cưới → Kỷ niệm 2D) trên mọi dòng phòng cưới
- [x] Danh sách có tìm kiếm không dấu, bộ lọc, sắp xếp, cột đầu ghim khi cuộn ngang trên điện thoại; quản lý voucher chuyển từ `/partner` vào `/admin/vouchers`
- [x] Mỗi trang admin tự kiểm tra quyền phía server (không chỉ dựa vào layout)
- [x] Kiểm chứng: `npm test` (`8/8`), `npm run typecheck` (`6/6`), ảnh chụp desktop 1440/1280 + mobile 390, bộ phát hiện thiết kế Impeccable không có lỗi

### [x] Nhóm 14: Khoá Tài Khoản Khách Hàng Trong Admin
- [x] Thêm `isLocked`, `lockedAt`, `lockedReason`, `lockedById` vào model `User`; API `PATCH /api/admin/users/[id]` (chỉ admin, không khoá được tài khoản quản trị viên)
- [x] Khoá có hiệu lực ngay: phiên đăng nhập hiện tại vô hiệu, đăng nhập Google bị từ chối (`oauthError=account_locked`), bị mời ra khỏi mọi sảnh 3D đang mở (sự kiện `ACCOUNT_LOCKED` phát tới mọi phòng), không vào lại sảnh bằng token cũ
- [x] Trang `/admin/users`: cột trạng thái, lọc "Đã khoá", xác nhận khoá ngay trong dòng kèm lý do, mở khoá một chạm
- [x] Kiểm chứng: E2E khoá tài khoản với web + realtime thật trên dữ liệu tạm (`9/9`), E2E admin, `npm test`, `npm run typecheck`

### [x] Nhóm 15: Trang Chi Tiết Phòng Cưới `/admin/weddings/[slug]`
- [x] Vòng đời đầy đủ 5 giai đoạn kèm ngày (tạo, hết hạn dùng thử, kích hoạt, ngày cưới, chuyển kỷ niệm 2D)
- [x] Thông tin phòng (gói, chủ tiệc + trạng thái khoá, mẫu sảnh, sức chứa theo gói, PIN, video, giờ làm lễ tự động); hoạt động (khách đang trong sảnh, thành viên, lưu bút, ảnh, bắt hoa)
- [x] Mừng cưới qua SePay của cặp đôi: tài khoản nhận đã che số, đã có khoá SePay chưa, số lượt quà — không hiện số tiền mừng
- [x] Bảng thành viên (vai trò, bên, kiểm duyệt), đơn nâng cấp của phòng, lưu bút gần đây; liên kết tới trang này từ Phòng cưới, Tổng quan, Đơn hàng, Người dùng
- [x] Kiểm chứng: E2E admin (`14/14`), E2E khoá (`9/9`), `npm test`, `npm run typecheck`, ảnh chụp desktop + mobile

### [x] Nhóm 16: 101 Không Gian Cưới Việt Nam & Thế Giới + Xem Trước 3D
- [x] Hệ thống chủ đề sảnh theo dữ liệu (`packages/shared/src/venues.ts`): 11 không gian Việt (thêm Lễ Gia Tiên, Phú Quốc, Hội An, Đà Lạt, Huế, Mù Cang Chải, Hạ Long, Sài Gòn) + 90 không gian từ Đông Á, Nam & Đông Nam Á, Trung Đông & Châu Phi, Châu Âu, Châu Mỹ, Châu Đại Dương
- [x] Bộ chi tiết 3D dùng chung (`venueKits.tsx`): viền sảnh, trần, phông xa nhiều lớp, vật phẩm đặc trưng (bàn thờ gia tiên, chuppah, mandap, torii…), 6 kiểu cổng, ánh sáng ngày/hoàng hôn/đêm
- [x] Trang xem trước 3D `/khong-gian/[id]` (camera tự xoay, NPC cô dâu chú rể) và trang tổng hợp `/khong-gian` (lọc vùng, tìm không dấu); trang chủ hiện ảnh thật thay nền gradient
- [x] Ảnh đại diện chụp tự động từ sảnh 3D (`npm run assets:venues` → `apps/web/public/venues/*.webp`)
- [x] Trang tạo sảnh chọn được trong 101 không gian (nhận `?template=` từ trang xem trước); trình dựng sảnh chọn theo nhóm vùng

### [x] Nhóm 17: Sảnh 3D Chân Thực Hơn, Nhân Vật Người Thật & Di Chuyển Mượt
- [x] Ánh sáng & bầu trời (`venueAtmosphere.tsx`): bầu trời vẽ bằng shader (chuyển màu, mặt trời, mây) theo từng không gian — không cháy trắng; nắng đổ bóng mềm, ánh sáng môi trường (IBL), bloom cho đèn lồng/nến/đèn chùm; sao ban đêm; tự hạ chất lượng khi máy yếu
- [x] Vân bề mặt tự sinh (`surfaceTextures.ts`): cỏ, cát, ván gỗ, đá lát, gạch, cẩm thạch, tuyết — chọn theo màu và bối cảnh từng sảnh, không tải ảnh
- [x] Nhân vật người thật (`HumanAvatar.tsx`) thay chibi khối: tỉ lệ người lớn (~1,7 m), khớp hông–gối, vai–khuỷu, khuôn mặt (mắt, lông mày, mũi, miệng cười, tai), 6 kiểu tóc, 7 bộ trang phục (vest có ve áo/cà vạt/nơ, áo dài có tà bay theo bước chân, váy cưới xòe + voan + vương miện, khăn vấn cô dâu đỏ, đầm dạ hội, sơ mi), 4 tông da; tư thế ngồi bàn, vẫy tay, vỗ tay, cụng ly (cả khi đang ngồi), bắt hoa, cúi chào
- [x] Di chuyển mượt: người chơi khác được phát lại theo đồng hồ của người gửi (trường `mt` mới trong `PlayerSchema`) với độ trễ hiển thị tự thích nghi theo jitter mạng (`MotionTrack` trong `@dco/shared`); chu kỳ bước theo quãng đường thật nên chân không trượt; camera bám nhân vật khít từng khung hình; hội trường chỉ re-render React khi có thay đổi ngoài vị trí (tối đa 4 lần/giây khi mọi người đang đi) thay vì mỗi gói mạng
- [x] Trang xem trước có khách mời mẫu (ngồi bàn, đứng trò chuyện) và tham số camera cho ảnh chụp cận (`?capture=1&cam=x,y,z,tx,ty,tz`)
- [x] Kiểm chứng: mô phỏng mạng trễ 30–120 ms — dao động tốc độ hiển thị từ 48% xuống 5%, không còn khung khựng (unit test trong `npm test`); E2E realtime đồng bộ vị trí + dấu thời gian (`4/4`); `npm run typecheck`; ảnh chụp cận nhân vật và 101 ảnh đại diện

### [x] Nhóm 18: Sảnh 3D Photoreal (patch `photoreal-3d.patch` + chỉnh sửa)
- [x] Áp dụng patch: vật liệu PBR (vải, nhung, satin, vàng, bạc, kính, sứ, cẩm thạch), bàn tiệc phủ khăn đủ bộ đồ ăn, ghế Chiavari, bình hồng, sân khấu rèm nhung, tháp champagne, cây lá thật có gió, tường + đèn chùm pha lê cho sảnh trong nhà, đổ bóng góc (GTAO), chỉnh màu kiểu máy ảnh, HDRI chụp thật (`@pmndrs/assets`, CC0)
- [x] Chế độ nhẹ cho điện thoại / máy yếu (`deviceTier.ts`): hoa ít đa giác, không GTAO, bóng 2K, kính không khúc xạ, không thêm đèn chùm, ít cây hơn
- [x] Sửa lỗi hiển thị: HDRI ban ngày đổi `park` → `sky` (hết ám tím), váy/khăn bàn hướng mặt ra ngoài (hết "trong suốt"), bộ nạp GLB tự sửa tam giác đảo chiều (bánh cưới hết tối), ngưỡng bloom 1.8 + lọc NaN (hết sương/đốm chói), đèn bù ấm dạng bán cầu, bông hồng nở xòe, rừng nền thông thật
- [x] `npm run assets:venues` chờ cảnh vẽ xong mới chụp; `RENDER_GPU=1` dùng card đồ họa (101 ảnh ~10 phút thay vì vài giờ)

## Các Bước Tiếp Theo Khi Go-Live
- [x] **Đổi secret & khởi động lại** (`npm run secrets:rotate` → `npm run docker:up`)
- [x] **Triển khai trang admin**: `npm run db:push` (thêm bảng `PlatformSetting`) → `npm run docker:up`; `.env` đổi `NEXT_PUBLIC_APP_URL`/`NEXTAUTH_URL` sang `https://poiplegal.online`
- [x] **Triển khai bảng quản trị mới + bỏ Casso**: `npm run docker:up`
- [x] **Triển khai khoá tài khoản**: `npm run db:push` (thêm cột khoá vào bảng `User`) → `npm run docker:up`
- [x] **Triển khai trang chi tiết phòng cưới + 101 không gian**: `npm run docker:up` (không đổi database)
- [x] **Triển khai sảnh chân thực + nhân vật mới + di chuyển mượt**: `npm run docker:up` (không đổi database; cập nhật cả web và realtime cùng lúc)
- [ ] Vào `/admin/settings/payment` nhập tài khoản ngân hàng thật & khóa SePay
- [ ] Hoàn tất OAuth Consent Screen & thêm URI chuyển hướng trên Google Cloud Console (`poiplegal.online`)
- [ ] Khai báo webhook trên SePay trỏ về `https://poiplegal.online/api/webhooks/sepay`
- [ ] (Tùy chọn) Nhập Cloudflare R2 tại `/admin/settings/storage` để lưu trữ ảnh tiệc cưới không giới hạn
