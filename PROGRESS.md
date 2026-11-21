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

### [x] Nhóm 19: Thiệp Cưới Online (12 mẫu) + Lời Chúc + Xác Nhận Tham Dự + Hộp Mừng Cưới SePay
- [x] 12 mẫu thiệp, mỗi mẫu một bộ màu, phông chữ có dấu tiếng Việt và hoạ tiết SVG riêng: Song Hỷ Đỏ, Sơn Mài Hồng Phúc, Sen Hồng, Tối Giản, Hoa Hồng Màu Nước, Lá Xanh Boho, Ren Cổ Điển, Baroque Vàng, Hồng Pastel, Tạp Chí, Biển Xanh, Đỏ Đô
- [x] Trang thiệp `/w/[slug]/invite` (link ngắn `/thiep/[slug]`): phong bì mở ra kèm nhạc nền (nhạc tự tổng hợp hoặc link riêng), `?khach=` ghi "Kính mời" đúng tên từng khách, ngày dương + âm lịch, đếm ngược, hai bên gia đình, lịch trình các lễ (chỉ đường Google Maps, lưu vào lịch), chuyện tình yêu, album, nút vào sảnh 3D
- [x] Lời chúc không cần đăng nhập (lọc từ thô tục, giới hạn tần suất theo IP); xác nhận tham dự (số người, bên nào, ghi chú) — chủ tiệc xem danh sách trong dashboard
- [x] Hộp mừng cưới VietQR: tiền vào thẳng tài khoản cô dâu chú rể, SePay webhook tự xác nhận, thiệp báo "Đã nhận" — số tiền không bao giờ hiện công khai; chỉ bật với gói có VietQR và đã cài tài khoản ngân hàng
- [x] Dashboard tab "Thiệp Cưới Online": đổi mẫu, sửa nội dung, tạo link riêng từng khách, xem trước trên khung điện thoại, danh sách xác nhận tham dự
- [x] Trang giới thiệu `/thiep-cuoi` + xem thử từng mẫu `/thiep-cuoi/[mau]` → "Dùng mẫu này" tạo phòng cưới với mẫu đã chọn và mở thẳng tab thiệp
- [x] DB: cột `Wedding.invitationConfig`, bảng `InvitationRsvp`; lời chúc/mừng cưới cho phép khách ẩn danh (`authorId`, `guestUserId` nullable) — cần `npm run db:push` trước khi deploy
- [x] Kiểm chứng: `npm test` (âm lịch Tết 2024–2026, tháng nhuận 2023, lọc cấu hình thiệp), `npm run typecheck`, E2E 18/18 (tạo phòng có mẫu, chặn sửa khi chưa đăng nhập, lọc link `javascript:`, lời chúc + RSVP ẩn danh, chặn spam 429, chặn mừng cưới khi chưa đủ điều kiện, link riêng có tên khách), ảnh chụp 12 mẫu trên điện thoại

- [x] Rà soát thiết kế (impeccable): mỗi mẫu có góc bo, khung viền in (đôi, nhũ vàng, chỉ mảnh), kiểu đếm ngược và phông chữ viết tay riêng; màu chữ nhấn đạt tương phản ≥ 4.5:1; phong bì dọc toàn màn hình; tên người không bị ngắt dòng; giấy có vân; `apps/web/DESIGN.md`

### [x] Nhóm 20: Khách Mời Là Người Thật (patch `real-people.patch` + `people-assets`)
- [x] 51 nhân vật người thật (Microsoft Rocketbox, MIT — `public/assets/people/CREDITS.md`): da, tóc, quần áo thật, chuyển động quay từ người thật: đứng thở, đi (nhanh/chậm theo tốc độ thật), ngồi ghế, vẫy tay, vỗ tay, reo hò, nâng ly
- [x] Patch gốc viết cho một bản "trình tạo nhân vật" chưa có trong repo nên được chuyển thủ công: trường `personId` mới (kiểm tra hợp lệ ở API join và máy chủ realtime, đồng bộ qua `PlayerSchema`), `RealPerson.tsx`, `loadGltfCached`; hình vẽ cũ hiện tạm khi đang tải và dùng cho cô dâu/chú rể (áo cưới, áo dài)
- [x] Sảnh chờ: lưới ảnh chân dung chọn nhân vật (lọc Nữ/Nam) hoặc "Hình vẽ tự phối" (áo dài, kiểu tóc); lựa chọn được nhớ trên máy
- [x] Điện thoại tải tối đa 10 nhân vật khác nhau mỗi trang (máy tính 36), người còn lại hiện hình vẽ — sảnh đông vẫn nhẹ
- [x] Trang xem trước không gian có khách mời người thật ngồi bàn, đứng trò chuyện
- [x] `scripts/convert-rocketbox.mjs`: chuyển FBX Rocketbox → GLB (cần cài tạm công cụ với `--no-save`)

### [x] Nhóm 21: Setup Phòng Cưới + Cô Dâu Chú Rể Người Thật
- [x] Tab dashboard "Setup Phòng Cưới": chọn nhân vật cho cô dâu (3 người thật mặc thêm váy cưới trắng, voan, vương miện, nơ eo nhũ vàng, hoặc hình vẽ) và chú rể (5 người thật mặc vest, hoặc hình vẽ)
- [x] Gắn ảnh cưới vào từng vị trí trong sảnh: màn hình LED sân khấu (mặc định ảnh đầu album, có thể tắt), bảng chào mừng ở cổng (ảnh + câu chào), từng giá ảnh dọc lối đi (ảnh + chú thích); ảnh được cắt vừa khung, không còn bị kéo méo
- [x] Lưu trong `layout.meta.mediaSlotId/customLabel` và `ceremonyConfig.bridePersonId/groomPersonId` (không đổi DB); API kiểm tra người hợp lệ và cắt độ dài chữ
- [x] Cô dâu chú rể (NPC và chủ phòng nhập vai) hiện bằng người đã chọn; luôn được tải kể cả khi điện thoại đã chạm giới hạn mô hình
- [x] Sảnh chờ 2 cột kiểu "tạo nhân vật": bên trái xem nhân vật 3D toàn thân (kéo xoay, cuộn phóng to, Toàn thân/Gương mặt, Tự xoay, Ngẫu nhiên, Đặt lại, thử Vẫy tay/Vỗ tay/Reo hò/Nâng ly), bên phải lưới chọn người có chú thích + nút "Mang nhân vật vào sảnh cưới" ghim đáy; "Hình vẽ tự phối" xem trước được khi đổi áo/tóc; điện thoại: khung xem ở trên, nút vào sảnh ghim cuối màn hình
- [x] Kiểm chứng: E2E trên stack cục bộ (tạo phòng, 4 ảnh, lưu setup, chặn id lạ, cắt chú thích 40 ký tự, cần đăng nhập, vào sảnh xem sân khấu/cổng), ảnh chụp cận cô dâu chú rể; test 2 trình duyệt trên production: thấy đúng nhân vật, đi, vẫy tay, vỗ tay đồng bộ hai chiều

### [x] Nhóm 22: Font Tự Lưu Trữ (build không cần mạng)
- [x] Bỏ `next/font/google`: `scripts/fetch-fonts.mjs` tải sẵn 23 font (bộ chữ Việt + Latin, 58 file, ~1,2 MB) vào `apps/web/public/fonts` và sinh `apps/web/src/app/fonts.css` (giữ unicode-range nên trình duyệt chỉ tải phần cần dùng; giữ nguyên các biến `--font-sans`, `--font-display`, `--f-*`)
- [x] Lý do: Google thỉnh thoảng trả link font dạng `/l/font?kit=…` không có đuôi file làm `next build` trong Docker hỏng ngẫu nhiên khi deploy
- [x] Thêm/đổi font: sửa danh sách trong script rồi chạy `node scripts/fetch-fonts.mjs`

### [x] Nhóm 23: 12 Mẫu Thiệp Bố Cục Riêng Có Ảnh (patch `0001-Online-invitations-12-photo-led-templates…`)
- [x] Mỗi mẫu có bìa riêng (mái vòm Song Hỷ, ảnh tròn sơn mài, khung vòm cài mẫu đơn, tối giản kiểu tạp chí kiến trúc, oval màu nước, poster tràn viền giữa vườn, oval ren tông nâu, đen trắng khung vàng, polaroid, bìa tạp chí LOVE, poster biển, ảnh cài trong phong bì), tiêu đề mục, thẻ lịch trình, lịch tháng, album và màn cảm ơn riêng; phong bì hé ảnh cặp đôi; nút "Thả tim"
- [x] 66 ảnh mẫu Unsplash (WebP, 2 cỡ; nguồn ở `public/invitation-samples/SOURCES.md`) cho thiệp mẫu và thẻ thư viện
- [x] Patch gốc thêm 3 font bằng `next/font` → chuyển sang font tự lưu trữ: Viaoda Libre, Playfair Display, Cormorant Garamond (thêm chữ nghiêng) trong `scripts/fetch-fonts.mjs`
- [x] Kiểm chứng: typecheck, `npm test`, E2E thiệp 18/18, chụp 12 mẫu trên điện thoại

### [x] Nhóm 24: Chỉ Tạo Thiệp Cưới (đám cưới offline, không sảnh 3D)
- [x] Trang `/thiep-cuoi/tao`: tên cô dâu chú rể, ngày cưới, nơi tổ chức, chọn mẫu (bìa xem trước đổi theo tên), đường dẫn tự sinh → vào thẳng tab thiệp trong dashboard
- [x] Cột mới `Wedding.invitationOnly` (cần `npm run db:push`): miễn phí, không có đồng hồ 24h nên thiệp không hết hạn (lời chúc, xác nhận tham dự luôn mở); mục "Sảnh cưới 3D" trong thiệp tắt sẵn; link sảnh `/w/[slug]` mở thiệp; API vào sảnh trả 403; album 12 ảnh
- [x] Dashboard của thiệp: chỉ tab Thiệp Cưới Online + Ảnh Cưới Cho Thiệp, chép link `/thiep/[slug]`, ẩn Mở Sảnh 3D / Nâng Cấp / Sổ Kỷ Niệm
- [x] Menu trang chủ có "Thiệp Cưới"; nút "Tạo thiệp miễn phí" và "Dùng mẫu này" dẫn tới trang tạo thiệp; vẫn có lối "Tạo sảnh cưới 3D kèm thiệp"
- [x] Kiểm chứng: E2E 19/19 (menu, điền form, link tự sinh, mẫu chọn sẵn, vào dashboard đúng tab, chỉ 2 tab, không đồng hồ dùng thử, mục 3D tắt, nơi tổ chức điền vào lịch lễ, link sảnh chuyển sang thiệp, chặn vào sảnh, lời chúc + RSVP hoạt động)

### [x] Nhóm 25: 100 Mẫu Thiệp + Form Mềm Hơn (patch `0002-Online-invitations-100-templates-softer-form-fields`)
- [x] 88 mẫu mới (giữ nguyên id 12 mẫu cũ), 8 phong cách: truyền thống 19, lãng mạn 18, hiện đại 15, thiên nhiên 15, sang trọng 11, cổ điển 8, dễ thương 8, tối giản 6; 14 kiểu bìa mới (tem thư, vé máy bay, báo Hỷ, poster phim, ba vòm cửa, "I love you", lịch tháng, khung lá…); 63 ảnh Unsplash mới + 3 cành bạch đàn tách nền
- [x] Form RSVP/lời chúc/mừng cưới theo từng mẫu (gạch chân, ô trắng mềm hoặc ô viền nhạt), 2 thẻ "Mình sẽ đến / Tiếc quá", chip chọn bên khách, thẻ lời chúc có ngoặc kép
- [x] Patch 0001 (1) trùng với 0001 đã áp dụng ở Nhóm 23 (chỉ khác dòng tiêu đề) nên không áp dụng lại
- [x] Chỉnh thêm: thư viện, trang tạo thiệp và trang soạn thiệp chỉ vẽ 16–24 bìa mỗi lượt + nút "Xem thêm mẫu" (thay vì vẽ cả 100 bìa có ảnh cùng lúc); trang tạo thiệp có chip lọc phong cách kèm số lượng, mẫu đang chọn luôn đứng đầu; chip lọc vuốt ngang trên điện thoại; nút "Thả tim" chỉ hiện khi đã cuộn qua bìa, nút nhạc mờ hơn trên bìa (không che ảnh); sửa nhận biết cuộn trang (trang cuộn bằng `<body>`); trang chủ trưng 4 mẫu khác kiểu (Song Hỷ, Tem Thư Hỷ, I Love You, Vé Ra Đảo)
- [x] Sửa tràn ngang trên điện thoại: trang tạo thiệp (hàng chip lọc kéo rộng cả form; ô ngày trên iPhone trông trống vì ngày bị căn giữa ngoài màn hình) và tab Thiết kế sảnh 3D (lưới 480px); CSS chung cho ô ngày/giờ trên iOS; thêm bản quét tràn ngang 15 trang × 375/390px
- [x] Kiểm chứng: typecheck, `npm test` 11/11, E2E thiệp 18/18 + E2E chỉ-thiệp 19/19, chụp 16 mẫu mới đủ 8 phong cách + thư viện, trang tạo, trang chủ

### [x] Nhóm 26: Soạn Thiệp Dễ Hơn (ảnh cưới, nhiều địa điểm, tự lưu)
- [x] Ảnh cưới ngay trong trang soạn thiệp: tải nhiều ảnh một lúc (ảnh điện thoại tự thu nhỏ còn ~2000px JPEG, ảnh 35 MB → 639 KB), chọn ảnh bìa bằng ngôi sao, xoá ảnh (API `DELETE /api/weddings/[slug]/photos/[photoId]`, chỉ cô dâu/chú rể/chủ tiệc; xoá ảnh bìa thì thiệp tự bỏ ảnh bìa); đếm x/12
- [x] Thẻ mẫu và bìa xem trước ghi rõ "Ảnh minh hoạ" khi chưa có ảnh (trước đây ảnh mẫu của cặp đôi khác làm tưởng thiệp có sẵn ảnh không đổi được)
- [x] "Các lễ & địa điểm": mỗi lễ một thẻ có nhãn rõ (loại lễ, ngày giờ, tên lễ, địa điểm, địa chỉ, link bản đồ, ghi chú), nút "Thêm lễ ở địa điểm khác"; trang tạo thiệp nhắc có thể sửa riêng từng lễ
- [x] Thanh mục lục dính đầu trang (Ảnh cưới · Tên · Các lễ · Gia đình · Mẫu · Chuyện tình · Nhạc · Khách), khung gửi thiệp gọn lại (link riêng gập trong "Tạo link mời riêng")
- [x] Tự lưu 1,2 giây sau khi sửa (vẫn có nút Lưu), trạng thái hiện cả trên điện thoại, cảnh báo khi rời trang lúc chưa lưu
- [x] Cô dâu chú rể mở thiệp của mình thấy nút "Thiệp của bạn · Sửa thiệp" (khách không thấy)
- [x] Nút tải ảnh ở tab ảnh và Setup phòng cũng dùng chung bộ thu nhỏ ảnh + báo lỗi, cho chọn nhiều ảnh
- [x] Kiểm chứng: E2E soạn thiệp 15/15 ở khổ điện thoại (tải 3 ảnh, chọn bìa, 2 địa điểm khác nhau, tự lưu, xoá ảnh, tải lại vẫn còn, bìa dùng ảnh thật, nút sửa chỉ hiện cho chủ), E2E thiệp 18/18, E2E chỉ-thiệp 19/19, quét tràn ngang 15 trang không lỗi, `npm test` 11/11

### [x] Nhóm 27: Sửa Thiệp Trực Quan + Tải Ảnh Ngay Khi Tạo Thiệp
- [x] Trang tạo thiệp `/thiep-cuoi/tao` có phần "Ảnh cưới" (tối đa 12): xem trước từ máy, chọn ảnh bìa bằng ngôi sao, bỏ ảnh; bìa xem trước và các thẻ mẫu đổi sang ảnh của bạn ngay; bấm "Tạo thiệp cưới" thì tải ảnh lên (nút báo "Đang tải ảnh 2/3…"), ảnh bìa đứng đầu album và được đặt làm bìa; ảnh lỗi được báo ở trang soạn thiệp
- [x] Chế độ "Sửa trực quan" (mặc định) trong trang soạn thiệp: thiệp hiện như khách thấy, mỗi phần có nhãn xanh "✎ Sửa…" (bìa, gia đình & lời mời, câu thơ, các lễ, ngày giờ, chuyện tình, album, các mục, lời cảm ơn), phần trống hiện "＋ Thêm…"; bấm vào thì bảng sửa đúng phần đó trượt lên (điện thoại) hoặc hiện bên phải (máy tính), gõ tới đâu thiệp đổi tới đó và tự lưu; trên điện thoại thiệp tự cuộn để dòng chữ đang gõ nằm ngay trên bảng sửa
- [x] Thanh công cụ: Đổi mẫu · Ảnh cưới · Các lễ · Nhạc & mục + trạng thái lưu; vẫn giữ "Sửa theo mục" (danh sách như cũ), lựa chọn được nhớ trên máy
- [x] `InvitationView` nhận `onEditPart`: chỉ ở trang soạn mới bấm được; khách xem thiệp không đổi gì
- [x] Kiểm chứng: E2E sửa trực quan 19/19 (tạo thiệp kèm 3 ảnh trong đó 1 ảnh 35 MB, bìa đúng ảnh chọn, bấm bìa → sửa tên → bìa đổi ngay và tên cuộn vào tầm nhìn, bấm các lễ → đổi địa điểm, ô trống chuyện tình → thêm cột mốc, tự lưu lên server, máy tính: bảng sửa bên phải, chuyển sang Sửa theo mục), E2E soạn thiệp 15/15, E2E thiệp 18/18, E2E chỉ-thiệp 19/19, quét tràn ngang không lỗi, `npm test` 11/11

### [x] Nhóm 28: Nhạc Cưới Có Sẵn + Hộp Mừng Cưới & SePay Cho Thiệp Miễn Phí
- [x] Thư viện 7 bài phát ngay trong trình duyệt (không file, không bản quyền): Canon in D (Pachelbel), Here Comes the Bride (Wagner), Ode to Joy (Beethoven) — nhạc cổ điển đã hết bản quyền, phối lại — và 4 bài tự soạn: Hộp nhạc ngọt ngào, Piano lãng mạn, Sáo trúc đồng quê (ngũ cung), Đàn tranh ngày vui; tiếng hộp nhạc, piano, violin, đàn dây nền, sáo trúc (luyến lên + hơi thổi), đàn tranh (rung nhấn); nút nghe thử từng bài; vẫn có "Nhạc của chúng mình (link)" và "Không phát nhạc"
- [x] `InvitationConfig.music.track` (thiệp cũ tự là "Hộp nhạc"); kiểm tra nhịp mọi bài khớp số phách
- [x] Theo lựa chọn của bạn: thiệp miễn phí được dùng hộp mừng cưới (mở ở thiệp, API tạo mã, webhook SePay, ghi sổ mừng cưới); tab "Sổ Mừng Cưới" hiện cho thiệp miễn phí
- [x] Phần "Hộp mừng cưới" trong trang soạn (cả sửa trực quan, dùng được trên điện thoại; bấm hộp mừng cưới trên thiệp cũng mở): bật/tắt trên thiệp, ngân hàng (xếp theo tên), số tài khoản (6–19 số), tên chủ tài khoản tự viết hoa không dấu; "Tự xác nhận bằng SePay": hướng dẫn 3 bước, đường dẫn webhook, nút tạo/đổi/tắt khoá API riêng của đám cưới
- [x] API `/api/weddings/[slug]/gift-settings` (GET/PUT, chỉ cô dâu/chú rể/chủ tiệc)
- [x] Sửa: ô cài đặt trùng mã với ô "tên người gửi" trong hộp mừng cưới xem trước (bấm nhãn nhảy nhầm ô)
- [x] Kiểm chứng: E2E nhạc + mừng cưới 30/30 (7 bài đều phát ra tiếng, lưu bài chọn, chặn số tài khoản sai, lưu tài khoản, tạo khoá SePay, thiệp miễn phí hiện hộp mừng cưới, khách nhận QR, webhook sai khoá bị từ chối, webhook đúng khoá xác nhận "Đã nhận"), các E2E cũ đạt, quét tràn ngang không lỗi, `npm test` 11/11

### [x] Nhóm 29: Bán Thiệp Cưới Riêng Với Phòng 3D (thiết kế miễn phí, trả phí khi phát hành)
- [x] Thiệp và sảnh 3D là hai sản phẩm riêng: soạn thiệp, tải ảnh, xem trước thoải mái, mọi thứ tự lưu nháp ("Đã lưu nháp"); khách chỉ mở được thiệp khi đã phát hành
- [x] Gói phát hành (`INVITATION_PLANS`): 1 tháng 150.000đ · 3 tháng 400.000đ · 6 tháng 750.000đ · 1 năm 1.400.000đ · trọn đời 3.000.000đ; gia hạn cộng dồn vào thời gian còn lại; hết hạn thì thiệp tạm ẩn, gia hạn là hiện lại
- [x] Gói Hạnh Phúc / Viên Mãn VIP của sảnh 3D đã kèm thiệp, nhưng chỉ khi sảnh đã trả tiền (PUBLISHED_3D / GRACE_PERIOD_7D); sảnh chọn gói trả phí mà chưa thanh toán không được phát hành thiệp miễn phí
- [x] Hộp "Phát hành thiệp" trong trang soạn: trạng thái (nháp / đến ngày / trọn đời / kèm sảnh 3D / đã hết hạn), "Xem trước như khách" mở đúng trang thật, chọn gói → VietQR (mã DCOPLAN, tài khoản nền tảng) → SePay xác nhận là thiệp phát hành ngay
- [x] Trang thiệp khi chưa phát hành: khách thấy "Cô dâu chú rể đang hoàn thiện thiệp…", cô dâu chú rể thấy bản xem trước kèm dải "Phát hành thiệp"; RSVP, lời chúc, mừng cưới trả 403 cho tới khi phát hành
- [x] Bảng giá ở `/thiep-cuoi`, đơn thiệp hiện trong trang quản trị ("Thiệp · gói")
- [x] Kiểm chứng: E2E phát hành 24/24, E2E nhạc + mừng cưới (sửa lại cho luồng trả phí) đạt, các E2E thiệp cũ đạt, `npm test` 12/12
- [x] Đã triển khai: `npm run db:push` (thêm `Wedding.invitationPaidUntil`, `SaasOrder.kind`, `SaasOrder.invitationPlan`) → `npm run docker:up`

### [x] Nhóm 30: Rà Soát Phòng 3D Sân Vườn (chỉnh sửa của chủ dự án)
- [x] "Tiệc Sân Vườn Hoàng Hôn": góc ảnh 3D dựng theo ảnh tham khảo (cổng hoa cẩm tú cầu, sofa vải, bàn ký, ghế gỗ chữ X, viền hoa lối đi, hàng cây), nút "Góc ảnh 3D / Toàn sảnh"; sân khấu trong sảnh thật dùng cổng hoa + màn hình video
- [x] Cây cọ / thông vẽ lại, rừng xa thành từng cụm, đồi thoải quanh sân cỏ, nước biển / hồ có sóng và bọt; điện thoại tải thêm cỏ, dương xỉ, bụi cây (~700 KB)
- [x] Kiểm tra: build sạch, không lỗi shader / console; chụp sân vườn, Phú Quốc, Hội An, Đà Lạt trên máy tính và điện thoại; đã triển khai cùng Nhóm 29

### [x] Nhóm 31: Chat Chung, Nhắn Tin Riêng & Bắn Pháo Hoa Trả Phí Trong Sảnh 3D (đã triển khai)
- [x] Khung "Chúc mừng" (góc phải): lời chúc chung cho mọi shard của đám cưới, lời chúc nhanh, giữ 80 dòng gần nhất cho người vào sau; dòng quà mừng / pháo hoa (không bao giờ hiện số tiền)
- [x] Bấm vào một khách → thẻ người chơi → "Nhắn tin riêng": chỉ hai người nhận, không lưu trên server, chủ tiệc không đọc được, có chặn; quảng trường công cộng không có tin riêng; chống spam (1,2 giây/dòng chat, 20 tin riêng/30 giây)
- [x] Pháo hoa 3 gói (nhỏ 20.000đ · lớn 50.000đ · đại tiệc 100.000đ, sửa giá ở `/admin/settings/payment`), trả bằng VietQR vào tài khoản nền tảng (mã DCOFW); SePay xác nhận một lần, bắn cho mọi khách cùng lúc, nhiều đơn thì xếp hàng; camera ngước lên trời; trang quản trị có danh sách đơn pháo hoa
- [x] Áp dụng patch `0001-feat-hall-public-chat-private-messages-and-paid-fire.patch` (VenueScene gộp tay với phần sân vườn); băng rôn pháo hoa trên điện thoại dời lên trên cần điều khiển
- [x] Kiểm chứng: E2E realtime 15/15 (chat tới mọi người, chặn spam, lịch sử cho người vào sau, tin riêng chỉ 2 người, mua pháo hoa cần đăng nhập, trả thiếu không bắn, trả đủ bắn cùng seed cho mọi người, webhook lặp không bắn lại, đơn thứ hai xếp hàng), E2E trình duyệt 16/16 trên máy tính và điện thoại, các E2E thiệp đạt, `npm test` 12/12
- [x] Triển khai: `npm run db:push` (thêm bảng `FireworkOrder`) → `npm run docker:up` (web + realtime); kiểm tra sau triển khai: trang 200, API gói pháo hoa trả 3 gói, trạng thái đơn đòi đăng nhập (401)
- [x] Sảnh 3D trên điện thoại gọn lại: các nút nổi (Nhạc, Lưu bút, Photobooth, Video, Mừng cưới, nút chat, thanh cảm xúc, bảng điều khiển chủ tiệc) gom vào một thanh điều hướng dưới đáy: Chúc mừng (có số tin mới) · Mừng cưới · Pháo hoa · Cảm xúc · Thêm (nhạc, lưu bút, chụp ảnh, video, đi nhanh tới cổng hoa / sân khấu / bàn tiệc, điều khiển chủ tiệc); cần điều khiển nằm trên thanh và ẩn khi đang ngồi bàn; máy tính giữ nguyên. E2E trình duyệt điện thoại + máy tính đạt, đã triển khai web
- [ ] Cấu hình tài khoản ngân hàng nền tảng + SePay API key ở `/admin/settings/payment` — chưa có thì khách bấm mua pháo hoa sẽ báo "Hệ thống chưa cấu hình tài khoản nhận thanh toán" (gói 3D/thiệp trả phí cũng vậy)

### [x] Nhóm 32: Trang Quản Trị Cặp Đôi: Ảnh Trong Sảnh 3D & Nhận Tiền Mừng (đã triển khai)
- [x] Thiết kế sảnh 3D: giá ảnh trên bản đồ có số (khớp "Giá ảnh N" ở Setup Phòng Cưới); thẻ "Ảnh cưới trong sảnh" + nút "Chọn ảnh cho sảnh"; chọn sân khấu / cổng / giá ảnh thì hiện "Chọn ảnh"; bố cục chưa lưu thì nút tự lưu trước khi chuyển tab (trước đây chuyển tab là mất thay đổi)
- [x] Tiền mừng cưới vào thẳng tài khoản cô dâu chú rể: phần "Nhận tiền mừng cưới" (ngân hàng, số tài khoản, khoá SePay của đám cưới) dùng chung một component cho tab Cài Đặt (sảnh 3D) và tab Thiệp Cưới Online
- [x] Sửa lỗi: form Cài Đặt luôn gửi ngân hàng MB (970422) nên mỗi lần lưu cài đặt là ghi đè ngân hàng cô dâu chú rể đã chọn; bỏ 3 ô ngân hàng cũ (chỉ 5 ngân hàng, không hiện số tài khoản đang dùng)
- [x] Tiền pháo hoa và tiền mua gói giữ nguyên vào tài khoản nền tảng (chủ dự án chọn)
- [x] Kiểm chứng: E2E trang quản trị 18/18 (giá ảnh có số, lối tắt lưu rồi mở Setup, góc xoay được lưu, Cài Đặt giữ Vietcombank sau khi lưu, tạo khoá SePay, QR mừng cưới trong sảnh dùng tài khoản cặp đôi và khoá của họ xác nhận được), E2E thiệp nhạc + mừng cưới đạt

### [x] Nhóm 33: Góc Ảnh 3D Chiều Sâu (Depth Relief) & Cảnh Quan 3D Theo Ảnh Tham Chiếu Cho 101 Không Gian (đã triển khai)
- [x] Bộ đối chiếu ảnh tham chiếu cho 101 không gian (`venuePhotoReferences.ts`, `catalogPhotoReferences.json`):
  - 3 cảnh 3D dựng chi tiết riêng theo ảnh mẫu: Tiệc Sân Vườn (`GardenCeremony.tsx`), Du thuyền Hạ Long (`HaLongPhotoScene.tsx`), Phố cổ Hội An (`HoiAnPhotoScene.tsx`)
  - 98 không gian còn lại dùng mô hình chiều sâu 3D (`VenuePhotoRelief` + `VenuePhotoCanvas.tsx`) từ 98 cặp ảnh `.webp` & bản đồ độ sâu `.depth.webp` sinh bằng AI **Depth Anything V2 Small ONNX** (`scripts/build-venue-depth.py`)
- [x] Cảnh quan 3D bao quanh sảnh tiệc đồng bộ theo từng địa danh (`photoHallProfiles.ts`, `photoHallSurroundings.tsx`):
  - Kiến trúc đặc trưng (`photoArchitecture.tsx`), địa hình núi/vịnh/ruộng bậc thang/đồi cát (`photoTerrain.tsx`), thảm thực vật bản địa (`photoVegetation.tsx`, `gardenBotany.tsx`, `architecturalScenery.tsx`) và thuyền trên mặt nước (sampan, gondola, felucca, nhà nổi)
- [x] Cập nhật lại bộ ảnh đại diện `apps/web/public/venues/*.webp` cho 101 không gian; nút chuyển đổi mượt giữa **Góc ảnh 3D** và **Toàn sảnh** tại `/khong-gian/[id]`
- [x] Kiểm chứng: `npm run typecheck` (`6/6`), `npm test` (`12/12`), đóng gói và triển khai lên cụm Docker `poiplegal.online` (`npm run docker:up`)

### [x] Nhóm 34: Nâng Cấp Thực Tế Hóa Đầy Đủ 101/101 Không Gian Cưới (Kết Hợp Cách 1 `<Splat />` + Depth Relief 224×168 & Cách 2 Quét 3D Photogrammetry `.glb`, 100% PBR Ảnh Thật, Shader Da/Mắt & ContactShadows)
- [x] **Cách 1 — 3D Gaussian Splatting & Góc ảnh 3D chiều sâu độ phân giải cao cho toàn bộ không gian** (`venuePhotoRelief.tsx`, `VenueScene.tsx`):
  - Tích hợp `<Splat />` (3D Gaussian Splatting từ `@react-three/drei`) hỗ trợ nạp trực tiếp file `.splat` đời thật
  - Nâng lưới `VenuePhotoRelief` từ `112×84` lên `224×168` kèm bộ lọc làm mượt song phương giữ biên (`Edge-Preserving Bilateral Depth Filter`), shader vi sai chiều sâu (`Sub-pixel Depth Parallax & Specular Glint`) và hạt ánh sáng nổi 3D (`DepthAtmosphereParticles`)
- [x] **Cách 2A — Kích hoạt toàn bộ 32 mô hình quét 3D Photogrammetry Poly Haven (`.glb`) phủ kín cả 101/101 không gian** (`photoArchitecture.tsx`, `photoTerrain.tsx`, `photoVegetation.tsx`, `realProps.tsx`, `HaLongPhotoScene.tsx`, `HoiAnPhotoScene.tsx`, `GardenCeremony.tsx`):
  - Toàn bộ **12 kiểu kiến trúc (`ArchitectureStyle`)** trong `photoArchitecture.tsx` đều dùng vật liệu PBR ảnh chụp thật (`stone_tiles`, `patterned_terracotta_tiling`, `wood_floor_deck`) và đặt mô hình `.glb` quét 3D đặc trưng (`Chandelier_01..03`, `chinese_chandelier`, `lantern_chandelier_01`, `wooden_lantern_01`, `Lantern_01`, `street_lamp_01`, `potted_plant_01..04`, `planter_box_01`, `painted_wooden_bench`)
  - Toàn bộ **12 kiểu địa hình (`TerrainStyle`)** trong `photoTerrain.tsx` rải đá tảng và đá phủ rêu quét 3D thật (`boulder_01.glb`, `rock_moss_set_01.glb`)
  - Toàn bộ **17 kiểu thảm thực vật (`PlantStyle`)** trong `photoVegetation.tsx` phủ cây quét 3D thật (`island_tree_01..03`, `tree_small_02`, `jacaranda_tree`) và thảm cỏ/dương xỉ/hoa/bụi cây quét 3D (`grass_medium_01..02`, `fern_02`, `flower_gazania`, `shrub_03..04`, `rock_moss_set_01`)
  - Cả 3 cảnh dựng riêng (`sunset_garden`, `vn_ha_long_cruise`, `vn_hoi_an`) và nội thất bàn tiệc (`realProps.tsx`: `brass_vase_01`, `ceramic_vase_01..03`, `brass_candleholders`, `standing_picture_frame_02`) đều tích hợp mô hình `.glb` quét 3D thật -> **đạt 101/101 không gian**
- [x] **Cách 2B — Mở khóa 100% PBR Texture ảnh chụp thật 2K & Bóng tiếp xúc `<ContactShadows>`** (`venueKits.tsx`, `VenueScene.tsx`):
  - Bật bộ texture ảnh chụp 2K Poly Haven (`_diff.webp`, `_nor.webp`, `_rough.webp`) cho cả 7 loại mặt sàn/mặt đất (bao gồm `stone` và `sand` kèm trộn UV 2 tỉ lệ chống lặp `antiTile`)
  - Thêm `<ContactShadows>` mềm dưới sàn sảnh `30m×30m` ghim chặt toàn bộ chân bàn, ghế Chiavari, trụ hoa và khách mời
- [x] **Cách 2C — Nâng cấp Nhân vật người thật (`RealPerson.tsx`)**:
  - Chuyển vật liệu 51 nhân vật Rocketbox sang `MeshPhysicalMaterial`: da có độ tán sắc ấm dưới da (`sheen: #ffcab8`), vân da vi mô (`detailNormal('micro')`), mắt có lớp phản xạ giác mạc ướt (`clearcoat: 1.0`), trang phục có vân sợi vải (`detailNormal('fabric')`)
  - Thêm cử động vi mô như người sống (`Bip01_Head`, `Bip01_Neck`, `Bip01_Spine1`): tự nhiên nhìn quanh, nghiêng đầu và thở lệch pha giữa các khách mời

### [x] Nhóm 35: Sửa Triệt Để Cảnh Toàn Sảnh 3D (`PhSky` HDRI 2K, Thảm Cỏ & Đồi Cây Quanh Sảnh, Bỏ Tường Hộp Đỏ & Ống Ngang, Ảnh Cưới Thật Trên Khung & Màn LED, Nút Chọn Đồ Họa & IBL Sảnh Chờ)
- [x] **Mở khóa bầu trời ảnh chụp thật 2K (`PhSky`) cho toàn bộ 98 sảnh có hồ sơ ảnh** (`venueAtmosphere.tsx`): xóa điều kiện `!reference` ở `photoSky` vốn tắt bầu trời HDRI thật và làm chân trời bị xám/nâu
- [x] **Sửa mặt đất 2400m & mặt sàn sân gạch (`venueKits.tsx`, `phAssets.tsx`)**:
  - Vùng đất ngoài sân sảnh (`role === 'ground'`) dùng thảm cỏ tự nhiên (`#587842`) kèm đồi cỏ (`useLandscapeGeometry`), thảm thực vật quét 3D (`GroundCover`) và vòng rừng xa (`DistantTreeline`) thay vì mặt phẳng màu nâu đất trống trải tới chân trời
  - Mặt sàn sân gạch (`tile`) dùng đá lát sáng màu (`stone_tiles` `3.4m`) kèm `antiTile` thay vì gạch lỗ đen lặp 19×19 lần
- [x] **Bỏ các khối hình hộp thừa đè lên kiến trúc 3D (`venueKits.tsx`, `realProps.tsx`)**:
  - Khi `PhotoHallSurroundings` đã dựng kiến trúc 3D (như Nhà Ba Gian), tắt `Centerpiece` hộp đỏ phẳng `AncestralAltar` và khung cột hộp `lacquer-pillars` chắn ngang cảnh
  - Đổi 3 thanh ống nâu cứng treo đèn lồng (`Canopy: silk-lanterns`) thành dây đèn võng mềm (`StringLights`)
  - Sửa `EaselFrame` hết xung đột 2 khung tranh đè nhau tạo khối đen trắng dọc thảm đỏ
- [x] **Ảnh cưới người thật trên Màn LED sân khấu & 4 giá ảnh + Nút chọn Đồ họa 3D + IBL Sảnh chờ** (`VenueScene.tsx`, `AvatarPreview.tsx`, `seedData.ts`):
  - Tự hiển thị 5 ảnh cưới thật (`/invitation-samples/*.webp`) trên màn LED sân khấu và 4 giá ảnh khi phòng chưa tải ảnh riêng; cập nhật luôn DB thật cho `minh-va-linh` và `duy-va-thao-kyniem`
  - Thêm thanh chọn nhanh **Đồ họa: Tự động / Cao (Photoreal) / Tiết kiệm pin** ngay trong sảnh 3D và thêm `<Environment>` IBL cho `AvatarPreview.tsx`

### [x] Nhóm 36: Tối Ưu Tốc Độ Load Sảnh 3D & Chống Giật/Lag GPU/CPU (`60fps`)
- [x] **Loại bỏ ~250ms đơ Main Thread khi nạp HDRI 2K** (`phAssets.tsx`): thay vòng lặp quét 2 triệu pixel HDR trên CPU (`sunDirection` + `horizonColor`) bằng vector mặt trời & màu chân trời tính sẵn (`PRECOMPUTED_SKY_INFO`)
- [x] **Loại bỏ nghẽn GPU ở chế độ mặc định (`venueAtmosphere.tsx`, `VenueScene.tsx`)**:
  - Giảm Shadow Map từ `4096×4096` (16 triệu pixel/frame) xuống `2048×2048` (`1024` trên mobile) — nhẹ GPU hơn 4 lần mà bóng vẫn mịn
  - Ở chế độ `Tự động`, dùng `<ContactShadows frames={1} resolution={256} />` (chỉ bake 1 frame đầu = `0ms/frame` về sau) và chỉ bật `GTAOPass` thời gian thực (ở half-res `8 samples`) khi người dùng chọn `Cao (Photoreal)`; hạ `UnrealBloomPass` xuống half-res và `MSAA samples: 2`
- [x] **Tái sử dụng VRAM Texture 2K & Nạp phân tầng (`phAssets.tsx`, `surfaceTextures.ts`, `next.config.mjs`)**:
  - Thêm `surfaceRepeatCache` tái sử dụng texture 2K cùng tỉ lệ lặp thay vì `.clone()` upload lại lên VRAM mỗi lần
  - Giảm kích thước canvas tạm `surfaceTextures.ts` từ `512×512` (23.000 nét vẽ CPU) xuống `256×256` (5.400 nét) — nhanh hơn 4 lần khi khởi tạo
  - Trì hoãn nhẹ `140ms` cho các model cây/đá lớn ngoài rìa (`usePhModel`) để khung hình sảnh chính mở tức thì; mở rộng `Cache-Control` 24h/7d cho toàn bộ `/assets/venue-references`, `/invitation-samples`, `/fonts` trên Cloudflare Edge
- [x] **Ly rượu/champagne 3D trên tay khi bấm "Nâng ly" (`drink` / `cheers`)** (`RealPerson.tsx`, `HumanAvatar.tsx`):
  - Gắn ly pha lê có rượu champagne vàng (`wineGlass` + `wineFill` + `glass` + `liquid`) bám chính xác giữa ngón cái (`Bip01_R_Finger02`) và ngón trỏ/giữa (`Bip01_R_Finger21`) trên bàn tay phải của cả 51 nhân vật người thật lẫn nhân vật tự phối

### [x] Nhóm 37: Cập Nhật Bảng Gói & Sức Chứa Đồng Thời (CCU) Sảnh Cưới 3D (`199.000đ` · `399.000đ / 50 khách` · `1.199.000đ / 200 khách`)
- [x] **Bỏ gói miễn phí, chuyển gói khởi đầu sang `199.000đ`** (`packages/shared/src/types.ts`, `apps/web/src/app/page.tsx`, `apps/web/src/app/create/page.tsx`, `apps/web/src/app/api/orders/route.ts`, `apps/web/src/lib/adminFormat.ts`):
  - `TRIAL_24H` (`Phòng Cưới 24h`): đổi từ `0đ (Miễn phí)` sang **`199.000đ` (`priceVnd: 199000`)**, tối đa `15` khách đồng thời (CCU), thanh toán qua VietQR hoặc mã voucher đối tác Studio
- [x] **Cập nhật số lượng khách đồng thời (CCU) & dòng tính năng Chat cá nhân 1-1 / Bắn pháo hoa 3D** (`packages/shared/src/types.ts`, `apps/web/src/app/page.tsx`, `apps/web/src/app/create/page.tsx`, `apps/web/src/components/dashboard/DashboardClient.tsx`, `packages/database/src/seedData.ts`, PostgreSQL DB):
  - `HAPPINESS` (`Gói Hạnh Phúc`, **`399.000đ`**): đổi từ `100` xuống **`50` khách đồng thời (`maxCcu: 50`)**
  - `VIP_FULFILLMENT` (`Gói Viên Mãn VIP`, **`1.199.000đ`**): đổi từ `1000` xuống **`200` khách đồng thời (`maxCcu: 200`)**
  - Bổ sung rõ 2 dòng tính năng có dấu tích xanh trên cả 3 gói: **`Chat cá nhân 1-1, chat chung, cụng ly & bắt hoa cưới`** và **`Bắn pháo hoa 3D chúc mừng rực rỡ toàn sảnh`**
- [x] **Sửa 2 lỗi phát hiện khi QA trình duyệt trực tiếp trên `poiplegal.online`** (`OAuthModal.tsx`, `VenueScene.tsx`):
  - Khởi tạo `googleConfigured` bằng `null` thay vì `false` để không nháy dòng cảnh báo `Chưa điền GOOGLE_CLIENT_ID` trong lúc `/api/health` đang tải
  - Dời thanh **Đồ họa: Tự động / Cao / Tiết kiệm pin** xuống góc dưới trái trên máy tính (`sm:bottom-3 sm:top-auto`) để không đè lên cả thanh **Cổng Hoa / Sân Khấu / Bàn Tiệc** lẫn bảng **ĐIỀU KHIỂN OWNER** của Chủ tiệc/Cô dâu/Chú rể
- [x] **Tối ưu thêm FPS & tốc độ vào sảnh 3D (`60fps` mặc định)** (`VenueScene.tsx`, `venueAtmosphere.tsx`, `phAssets.tsx`):
  - Giới hạn `dpr={[1, 1.25]}`, tắt `EffectComposer` PostFX ở chế độ `Tự động` (giữ ở `Cao (Photoreal)`), bật `FpsGuard` tự hạ chất lượng ngay cả trong sảnh thật
  - Bỏ đổ bóng cho cây/đá ở vòng ngoài bán kính `32m` (`ShadowCasters`), trì hoãn tải HDRI 5MB (`550ms`) và cây nền nặng (`650ms`) để sảnh & nhân vật hiện tức thì
  - Sửa lỗi giật/rung cảnh vật khi di chuyển (`CameraRigAndController` trong `VenueScene.tsx`): đặt `CameraRigAndController` chạy trước `HumanAvatar` để camera và nhân vật luôn đồng bộ đúng 1 khung hình, và bỏ gọi `OrbitControls.update()` 2 lần mỗi frame
  - Bỏ `distanceFactor` trên các nhãn `Ký Sổ Lưu Bút`, `Mừng Cưới VietQR`, `Bàn tiệc`, bảng chào mừng và giá ảnh, đồng thời đưa `CameraRigAndController` lên đầu `<Canvas>` kèm `camera.updateMatrixWorld()` (`VenueScene.tsx`) để toàn bộ nhãn `<Html>` đồng bộ đúng khung hình camera, hết rung giật khi di chuyển
  - Sửa lỗi trôi/lệch biển tên nhân vật (`HumanAvatar.tsx`, `VenueScene.tsx`): cố định `initPosition`/`initRotation` tránh Colyseus re-render kéo lùi vị trí, tách `AvatarFrameDriver` chạy trước `<Html>` kèm `root.updateMatrixWorld()`, bỏ `distanceFactor` và đặt `eps={0}` để biển tên bám khít đỉnh đầu nhân vật ở mọi khung hình
- [x] **Ẩn mục "Đối Tác Studio" (`/partner`) với người dùng thường** (`apps/web/src/app/page.tsx`, `apps/web/src/app/partner/page.tsx`): chỉ hiển thị liên kết/khối **Đối Tác Studio** trên trang chủ và cho phép truy cập `/partner` khi tài khoản **Admin** đã đăng nhập (`getAdminSession()`)

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
