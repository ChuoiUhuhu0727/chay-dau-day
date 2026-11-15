# F11 — Event tracking: đo người chơi làm gì

**Trạng thái:** xem `4-memory/features.json` · Quyết định: [tracking](../decisions/tracking.md)

Đề bài Apero bắt buộc: định nghĩa các hành động chính và cài tracking — đây là dữ liệu cho Round 2.
Mọi sự kiện đi qua **một hàm duy nhất** `track(name, params)` trong `game/track.js`:
- luôn ghi vào `window.__events` (bot và người phát triển đọc được) và `window.dataLayer`;
- nếu có `GA_ID` trong `game/track-config.js` thì gửi thêm lên **Google Analytics 4** (`gtag`). Để trống = không gửi gì ra ngoài.
- Đổi sang Firebase / PostHog ở Round 2 chỉ phải sửa `track.js`, không đụng game.

**Không thu dữ liệu cá nhân**: không tên, email, vị trí; chỉ hành động trong game. `makeEvent` từ chối tham số có tên
`name`, `email`, `phone`, `user`, `ip`.

## Tracking plan

Câu hỏi sản phẩm mà mỗi sự kiện trả lời — mỗi sự kiện phải giúp ra một quyết định, không đếm cho vui.

| Sự kiện | Khi nào | Tham số | Đo gì · vì sao quan trọng |
|---|---|---|---|
| `game_open` | Mở trang | `screen_w`, `screen_h`, `fullscreen_supported` | Đầu phễu. Tỉ lệ máy dọc/ngang → ưu tiên giao diện nào. |
| `role_select` | Bấm Handler / Cutter | `role` | Vai nào hút người mới hơn → soạn thêm tình huống cho vai đó trước. |
| `point_start` | Bắt đầu một point | `role`, `attempt` (lần thứ mấy trong phiên) | Phễu `game_open → point_start`: màn mở đầu có thuyết phục người ta bấm chơi không. |
| `phase_answer` | Mỗi pha được chấm | `role`, `scenario_id`, `phase` (1–5), `outcome` (`correct`/`wrong`/`stall`), `stall`, `combo`, `gain`, `decide_ms` | **Sự kiện quan trọng nhất.** Tỉ lệ sai theo `scenario_id` → tình huống nào quá khó / giải thích chưa rõ. `decide_ms`, tỉ lệ `stall` → đồng hồ stall có quá gắt không (câu hỏi PO). |
| `explanation_read` | Bấm Tiếp sau đáp án | `scenario_id`, `outcome`, `read_ms` | Người chơi có đọc giải thích không (giá trị *học* của app). `read_ms` < 1 giây = lướt qua. |
| `point_end` | Point kết thúc | `role`, `result` (`score`/`turnover`), `correct`, `points`, `phases_played`, `duration_ms`, `new_best`, `attempt` | Tỉ lệ ghi điểm (độ khó tổng), thời lượng một ván. `point_start` mà không có `point_end` = **bỏ giữa chừng** ở pha nào. |
| `retry_click` | Bấm Chơi lại | `role`, `last_result`, `attempt` | **Chỉ số giữ chân chính**: có "thêm một ván nữa" không (mục tiêu của F10). |
| `fullscreen_toggle` | Bấm ⛶ | `on` | Có ai dùng toàn màn hình (F9) không → đáng giữ hay bỏ. |
| `tutorial_step` | Xong một bước tập chơi (F12) | `step` (1–3), `tries` (số lần chạm sai trước khi đúng) | Bước nào nhiều `tries` → bước đó khó hiểu, sửa chữ/hình bước đó. |
| `tutorial_done` | Xong cả 3 bước tập (F12) | `ms` | Phễu `tutorial_step 1 → tutorial_done → point_start`: phần tập có giữ chân người mới không. |
| `sound_toggle` | Bấm 🔊/🔇 (F13) | `on` | Bao nhiêu người tắt tiếng → âm thanh có gây phiền không. |

**Chỉ số theo dõi ở Round 2:** tỉ lệ `game_open → point_start`; tỉ lệ ghi điểm; số ván / người (`retry_click`);
tỉ lệ sai và `decide_ms` theo `scenario_id`; tỉ lệ `stall`; trung vị `read_ms`.

> 2026-11-15 · PO thêm phần tập chơi (F12) và âm thanh (F13) → tracking plan thêm 3 sự kiện (8 → 11). Test F11 cập nhật theo plan mới.

## Done when
- [ ] `makeEvent(name, params)` trả `{ name, params }` với `params.t` (ms từ lúc mở trang, số ≥ 0); tên sự kiện không có trong `EVENTS` → ném lỗi; thiếu tham số bắt buộc → ném lỗi.
- [ ] `EVENTS` có đúng 11 sự kiện: `game_open`, `role_select`, `point_start`, `phase_answer`, `explanation_read`, `point_end`, `retry_click`, `fullscreen_toggle`, `tutorial_step`, `tutorial_done`, `sound_toggle`.
- [ ] `makeEvent` từ chối tham số tên `name`, `email`, `phone`, `user`, `ip` (ném lỗi) — không thu dữ liệu cá nhân.
- [ ] `GA_ID` mặc định để trống → trang không tải script nào từ `googletagmanager.com`.
- [ ] Bot: mở trang → `window.__events` có `game_open`; chọn Cutter → có `role_select` (`role` = `cutter`) rồi `point_start` (`attempt` = 1).
- [ ] Bot: chạm đúng → `phase_answer` với `outcome` = `correct`, `scenario_id` = `C1`, `phase` = 1, `decide_ms` > 0; chạm sai → `outcome` = `wrong`; hết stall → `outcome` = `stall`.
- [ ] Bot: bấm Tiếp sau đáp án → `explanation_read` có `read_ms` > 0.
- [ ] Bot: hết point → `point_end` với `result` = `score` (4/5) hoặc `turnover`, `correct` khớp `#final-score`; bấm Chơi lại → `retry_click`, rồi `point_start` lần sau có `attempt` = 2.
