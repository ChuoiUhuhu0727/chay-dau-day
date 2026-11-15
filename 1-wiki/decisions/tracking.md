# Quyết định — Tracking qua một hàm `track()`, GA4 là đích mặc định (tắt khi chưa có ID)

- Đề Apero bắt buộc event tracking (2026-11-15). Ngoại lệ có kiểm soát cho luật "không thư viện": **chỉ** script `gtag.js` của
  Google Analytics 4, và **chỉ tải khi** `game/track-config.js` có `GA_ID`. Không npm, không build.
- Lý do GA4: miễn phí, chạy trên open web, có báo cáo phễu sẵn; Apero quen hệ Google (Firebase dùng chung GA4 nếu sau này lên Google Play).
- Mọi sự kiện đi qua `track()` trong `game/track.js` → đổi đích (Firebase, PostHog…) chỉ sửa một file.
- `makeEvent` là hàm thuần (test bằng `node --test`); `window.__events` giữ bản sao để bot kiểm.
- Riêng tư: không thu dữ liệu cá nhân; GA4 đặt `allow_google_signals: false`, `allow_ad_personalization_signals: false`.
  Khi bật GA_ID cần thêm trang chính sách quyền riêng tư ngắn (Câu hỏi cho PO).
