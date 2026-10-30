# F5 — Đáp án: vùng đúng + sơ đồ nhìn từ trên

**Trạng thái:** xem `4-memory/features.json` · **Màn hình:** [màn chơi](../screens/man-choi.md)

Sau khi chấm: vùng đúng sáng màu vàng trên `#field`, sơ đồ nhỏ `#minimap` vẽ cả sân nhìn từ trên xuống
(bạn, đồng đội, đối thủ, đĩa, vùng đúng, điểm bạn chạm) với mũi tên từ bạn tới vùng đúng, và câu `explain`.

## Done when
- [ ] `toMinimap({x, y}, w, h)` trong `logic.js` đổi toạ độ sân ra pixel sơ đồ: `(0,0)` → `(0,0)`, `(100,37)` → `(w,h)`.
- [ ] Bot: trước khi chạm, `#minimap` và `#explain` bị ẩn; sau khi chạm, cả hai hiện và `#explain` chứa đúng chữ `explain` của tình huống.
- [ ] Bot: sau khi chạm, nút `#next` hiện (cao ≥ 44px); bấm `#next` thì `state().index` tăng 1 và `#minimap` ẩn lại.
