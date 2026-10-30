# F4 — Chạm chọn chỗ đứng + chấm đúng/sai

**Trạng thái:** xem `4-memory/features.json` · **Màn hình:** [màn chơi](../screens/man-choi.md)

Chạm lên mặt cỏ trong `#field` → `unproject` ra điểm trên sân → `judge`. Mỗi tình huống chỉ chấm lần chạm đầu tiên.

## Done when
- [ ] `judge(zone, point)` trả `true` khi khoảng cách từ `point` tới tâm `zone` ≤ `zone.r`, `false` khi lớn hơn; `point` = `null` thì trả `null` (không tính).
- [ ] `answer(state, point)` khi đúng tăng `score` thêm 1 và đặt `answered = true`; khi sai giữ nguyên `score`; gọi lần 2 trong cùng tình huống không đổi gì.
- [ ] Bot: chạm vào `state().zoneScreen` (toạ độ màn của tâm vùng đúng) → `#feedback` hiện chữ `Đúng`, `#score` tăng 1.
- [ ] Bot: ở tình huống sau, chạm vào điểm cách xa vùng đúng → `#feedback` hiện chữ `Chưa đúng`, `#score` giữ nguyên.
- [ ] Bot: chạm lên phần trời (trên đường chân trời) → `state().answered` vẫn `false`.
