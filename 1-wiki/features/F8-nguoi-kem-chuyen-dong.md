# F8 — Người kèm bạn chuyển động (áp lực như thật)

**Trạng thái:** xem `4-memory/features.json` · **Màn hình:** [màn chơi](../screens/man-choi.md)

Trong trận, người kèm luôn bám sát, nhún nhảy, giang tay, lao lên lùi xuống. Để giống thật và gây áp lực:
- Người kèm bạn (`scn.opponents[scn.myMarker]`) đứng **trước mặt** 2–3m, lệch về phía **ngược** vùng đúng (không che vùng đúng),
  màu đỏ viền đen, liên tục: lắc ngang, nhún, lao tới/lùi lại, giang tay đổi bên.
- Khi họ lao tới gần, mép khung sân chớp viền đỏ (`#field.pressure`) — cảm giác bị ép.
- Ngoại lệ: tình huống có `markedBehind` (C3 — người kèm đứng sau lưng) thì không thấy họ;
  chấm đỏ ở mép khung nhấp nháy + chữ "Người kèm sau lưng!".
- Những người kèm khác lắc nhẹ tại chỗ. Chỉ phần vẽ chuyển động; vị trí dùng để chấm điểm không đổi.

Hàm thuần `markerPose(base, me, t)` trong `logic.js` trả `{ x, y, arms, lunge }` tại thời điểm `t` giây.

## Done when
- [ ] Mỗi tình huống có `myMarker` (chỉ số trong `opponents`); trừ tình huống `markedBehind`, người kèm bạn hiện trong khung (view 360×480, 0 ≤ sx ≤ 360), cách bạn 1.5–4m, và cách tâm vùng đúng > `zone.r + 1`.
- [ ] `markerPose`: với t từ 0 tới 10 giây (bước 0.05), vị trí luôn cách `base` ≤ 0.9m, cách bạn ≥ 1.2m, nằm trong sân; `arms` và `lunge` trong khoảng [0, 1].
- [ ] `markerPose` thật sự chuyển động: trong 10 giây, độ lệch ngang lớn nhất − nhỏ nhất ≥ 0.8m và `arms` thay đổi ≥ 0.5.
- [ ] Bot: ở tình huống C1, `state().marker.sx` đọc 2 lần cách nhau 300ms khác nhau ≥ 2px, `state().animating` = `true`.
- [ ] Bot: sang màn kết quả thì `state().animating` = `false` (dừng vẽ cho đỡ tốn pin).
