# F8 — Trận đấu sống động: người kèm bám sát, bạn chạy, cả sân chạy

**Trạng thái:** xem `4-memory/features.json` · **Màn hình:** [màn chơi](../screens/man-choi.md)

Gộp hai ý của vịt (raw/idea-2.md "người kèm động, stressful" + raw/idea-3.md "ảnh động như trận thật") thành một tính năng.
Chỉ phần vẽ chuyển động; chấm điểm vẫn dùng vị trí và camera đứng yên của tình huống (F1–F4 không đổi).

**Người kèm bạn — áp lực như thật**
- Người kèm bạn (`scn.opponents[scn.myMarker]`) đứng **trước mặt** khoảng 3m, lệch về phía **ngược** vùng đúng (không che vùng đúng),
  áo đỏ, nhãn "KÈM BẠN", liên tục: lắc ngang, lao tới/lùi lại, giang tay đổi bên. Lao sát → khung sân chớp viền đỏ (`#field.pressure`).
- Ngoại lệ `markedBehind` (C3 — người kèm sau lưng): chấm đỏ ở mép khung nhấp nháy + chữ "Người kèm sau lưng!".
- Hàm thuần `markerPose(base, me, t)` trả `{ x, y, arms, lunge }` tại thời điểm `t` giây.

**Pha bóng đang diễn ra** — `state().phase`:
1. `intro` (2 giây): bạn chạy vào vị trí (camera tiến lên, nhún theo bước chạy), mọi người chạy về chỗ, đĩa bay tới người cầm đĩa.
   Chạm lúc này **không tính** ("⏳ Đang vào pha bóng…").
2. `decide`: bạn đứng, cả sân vẫn sống — đồng đội nhún/nhích, người cầm đĩa xoay người giả động tác, người kèm vẫn bám. Chạm như F4.
3. `run`: chạm xong bạn **chạy thật** tới chỗ đã chạm, người kèm đuổi theo, đĩa bay vòng cung. Tới nơi thì quay mặt về người ném.
   Đúng → đĩa vào tay bạn, `#feedback` thêm "Bắt được đĩa!". Sai → đĩa bay tới vùng đúng.
4. `done`: chạy xong.
- Hàm thuần: `introPose(scn, t)`, `runPose(from, to, u)`, `runDuration(d)`, `discArc(u)`.
- Vòng vẽ (`requestAnimationFrame`) chỉ chạy ở màn chơi.

## Done when
- [ ] Mỗi tình huống có `myMarker` (chỉ số trong `opponents`); trừ tình huống `markedBehind`, người kèm bạn hiện trong khung (view 360×480, 0 ≤ sx ≤ 360), cách bạn 1.5–4m, và cách tâm vùng đúng > `zone.r + 1`.
- [ ] `markerPose`: với t từ 0 tới 10 giây (bước 0.05), vị trí luôn cách `base` ≤ 0.9m, cách bạn ≥ 1.2m, nằm trong sân; `arms` và `lunge` trong [0, 1]; lắc ngang lớn nhất − nhỏ nhất ≥ 0.8m và `arms` thay đổi ≥ 0.5.
- [ ] `introPose(scn, t)`: lúc t = 0 camera cách `scn.me` ≥ 4m, mỗi cầu thủ cách chỗ cuối ≥ 2m và trong sân, đĩa cách người cầm ≥ 8m; t ≥ `INTRO` (2 giây) thì camera, 13 cầu thủ và đĩa trùng đúng vị trí tình huống (sai số ≤ 1e-9); khoảng cách camera → `scn.me` không tăng theo t.
- [ ] `runPose(from, to, u)`: u = 0 → `from`, u = 1 → `to`, khoảng cách tới `to` không tăng theo u; `runDuration(d)` = d / 7 giây, kẹp trong [0.8, 2]; `discArc(u)` = 1.1m ở u = 0 và u = 1, ≥ 2.5m ở u = 0.5.
- [ ] Bot: vừa chọn vai thì `state().phase` = `intro`; chạm vào `state().zoneScreen` lúc này thì `state().answered` vẫn `false`; `state().live.camera` đổi chỗ ≥ 0.3m sau 300ms.
- [ ] Bot: trong ≤ 2.5 giây `phase` thành `decide`; khi đó `state().live.mates` vẫn đổi sau 300ms; ở C1 `state().marker.sx` đổi ≥ 2px sau 300ms và `state().animating` = `true`.
- [ ] Bot: chạm đúng → `phase` = `run`, sau ≤ 2.5 giây `phase` = `done`, `state().live.camera` cách chỗ đã chạm ≤ 0.5m và `#feedback` có chữ `Bắt được`.
- [ ] Bot: sang màn kết quả thì `state().animating` = `false` (dừng vẽ cho đỡ tốn pin).
