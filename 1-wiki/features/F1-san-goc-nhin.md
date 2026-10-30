# F1 — Sân góc nhìn thứ nhất

**Trạng thái:** xem `4-memory/features.json` · **Màn hình:** [màn chơi](../screens/man-choi.md)

Vẽ sân Ultimate theo góc nhìn ngang tầm mắt của "bạn". Đơn vị mét. Trục `x` dọc chiều dài sân
(0 → 100, đội mình tấn công về endzone `x` 82–100), trục `y` ngang sân (0 → 37). Endzone dài 18m mỗi đầu.
Mắt cao 1.7m, góc nhìn ngang (FOV) 70°. Luật toán nằm trong `logic.js`, chỉ việc vẽ nằm trong `ui.js`.

## Done when
- [ ] `FIELD` trong `logic.js` = `{ length: 100, width: 37, endzone: 18 }`.
- [ ] `project(cam, {x, y}, view)` trả về `{sx, sy}` pixel; điểm ngay trước mặt (cùng `y`, xa hơn 10m theo hướng nhìn) có `sx` = giữa màn (sai số ≤ 1px).
- [ ] Điểm xa hơn nằm cao hơn trên màn (`sy` nhỏ hơn) và gần đường chân trời hơn; điểm ở sau lưng camera trả về `null`.
- [ ] `unproject(cam, sx, sy, view)` là ngược của `project`: với 20 điểm trong sân trước mặt, sai số ≤ 0.05m; chạm trên đường chân trời trả về `null`.
- [ ] Bot: `#field` là `<canvas>` hiện trên màn chơi, rộng ≤ 390px trên màn 390px, và `window.__game.state().camera` có `x, y, heading`.
