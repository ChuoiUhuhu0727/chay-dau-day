# F3 — Màn mở đầu kiểu CLB + chọn vai

**Trạng thái:** xem `4-memory/features.json` · **Màn hình:** [màn mở đầu](../screens/man-mo-dau.md)

Màn đầu tiên trông như logo Fulbright Ultimate Club: nền xanh gradient tròn, khiên đen viền vàng,
chữ FULBRIGHT (trắng) / ULTIMATE (trắng viền vàng, nghiêng) / CLUB (vàng), logo CLB ở trên.
Hai nút chọn vai bắt đầu bài 5 tình huống.

## Done when
- [ ] `startLesson(role)` trong `logic.js` trả state có `role`, `index = 0`, `score = 0`, `total = 5`; role khác `handler`/`cutter` thì báo lỗi.
- [ ] Bot: khi mở trang thấy `#screen-start` với `#crest` (khiên), `#logo` (ảnh logo tải được, naturalWidth > 0) và chữ `ULTIMATE`.
- [ ] Bot: có nút `#role-handler` và `#role-cutter`, mỗi nút cao ≥ 44px; bấm `#role-cutter` thì `#screen-play` hiện, `state().role` = `cutter`.
- [ ] Bot: màu nền `body` dùng gradient (`background-image` chứa `radial-gradient`), font tiêu đề không phải font mặc định.
