# F7 — Endzone đích: biết mình đang tấn công về đâu

**Trạng thái:** xem `4-memory/features.json` · **Màn hình:** [màn chơi](../screens/man-choi.md)

Người mới hay quên hướng tấn công. Endzone đối thủ (x 82–100, nơi ghi điểm) luôn được chỉ rõ:
- Trên `#field`: endzone đích tô **vàng nhạt**, có chữ **ENDZONE** sơn trên cỏ, cờ vàng ở 4 góc, và cổng vòm "GHI ĐIỂM" (logo ong) ở cuối sân.
- La bàn `#goal` ở góc trên khung sân: mũi tên `#goal-arrow` xoay về phía endzone đích + chữ `ENDZONE · 42m`.

Hàm thuần `goalInfo(cam)` trong `logic.js`:
`distance` = số mét từ bạn tới vạch đầu endzone đích (x = 82), làm tròn, nhỏ nhất 0;
`bearing` = góc (radian, trong (−π, π]) của tâm endzone đích (91, 18.5) so với hướng nhìn: 0 = thẳng trước mặt, dương = bên phải.

## Done when
- [ ] `goalInfo(makeCamera(40, 18.5, 0))` = `{ distance: 42, bearing: 0 }`; camera quay ngược (heading π) thì `|bearing|` = π (sai số ≤ 0.001).
- [ ] Đứng trong endzone đích (x = 90) thì `distance` = 0; điểm tâm endzone ở bên phải hướng nhìn thì `bearing` > 0.
- [ ] Bot: trên màn chơi `#goal` hiện, chữ có `ENDZONE` và `<distance>m` đúng bằng `state().goal.distance`.
- [ ] Bot: `#goal-arrow` có `data-deg` = `Math.round(bearing × 180/π)` của `state().goal`.
- [ ] Bot: ở tình huống H1 (Handler, nhìn về phía endzone đích) `state().drawn.goal` = `true` (đã vẽ cổng vòm endzone trên canvas).
