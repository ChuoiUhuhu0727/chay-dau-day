# F9 — Trận đấu chuyển động: bạn chạy, cả sân chạy

**Trạng thái:** xem `4-memory/features.json` · **Màn hình:** [màn chơi](../screens/man-choi.md)

Thay cho khung hình đứng yên, mỗi tình huống là một **pha bóng đang diễn ra** (theo raw/idea-3.md):

1. **Vào pha** (`phase = 'intro'`, 2 giây): bạn chạy vào vị trí (camera tiến lên, nhún theo bước chạy), mọi người chạy về chỗ của mình,
   đĩa bay tới tay người cầm đĩa. Chạm sân lúc này **không tính** (dòng gợi ý: "Đang vào pha bóng…").
2. **Quyết định** (`phase = 'decide'`): bạn đứng tại chỗ, nhưng cả sân vẫn sống — đồng đội nhún/nhích, người cầm đĩa xoay người giả động tác,
   người kèm (F8) vẫn bám. Chạm như cũ (F4).
3. **Chạy** (`phase = 'run'`): chạm xong thì bạn **chạy thật** tới chỗ đã chạm (camera di chuyển, nhún theo bước), người kèm đuổi theo.
   Chạm đúng → đĩa bay tới bạn, `#feedback` thêm "Bắt được đĩa!". Chạm sai → đĩa bay tới vùng đúng (chỗ lẽ ra bạn phải đứng).
4. Chạy xong → `phase = 'done'`.

Chấm điểm vẫn dùng vị trí và camera đứng yên của tình huống (F1–F4 không đổi). Chỉ phần vẽ là chuyển động.
Hàm thuần trong `logic.js`: `introPose(scn, t)`, `runPose(from, to, u)`, `runDuration(d)`, `discArc(u)`.

## Done when
- [ ] `introPose(scn, t)`: lúc t = 0 camera cách `scn.me` ≥ 4m; t ≥ `INTRO` (2 giây) thì camera, 13 cầu thủ và đĩa trùng đúng vị trí của tình huống (sai số ≤ 1e-9); khoảng cách camera → `scn.me` không tăng theo t.
- [ ] `introPose`: lúc t = 0 mỗi cầu thủ cách chỗ cuối ≥ 2m và nằm trong sân; đĩa lúc t = 0 cách người cầm đĩa ≥ 8m.
- [ ] `runPose(from, to, u)`: u = 0 → `from`, u = 1 → `to`, khoảng cách tới `to` không tăng theo u; `runDuration(d)` = d / 7 giây, kẹp trong [0.8, 2].
- [ ] `discArc(u)`: độ cao lúc u = 0 và u = 1 là 1.1m, giữa đường (u = 0.5) ≥ 2.5m.
- [ ] Bot: vừa chọn vai thì `state().phase` = `intro`; chạm vào `state().zoneScreen` lúc này thì `state().answered` vẫn `false`; `state().live.camera` đổi chỗ ≥ 0.3m sau 300ms.
- [ ] Bot: trong ≤ 2.5 giây `state().phase` thành `decide`; khi đó `state().live.mates` (vị trí đồng đội) vẫn đổi sau 300ms (cả sân vẫn chuyển động).
- [ ] Bot: chạm đúng → `phase` = `run`, sau ≤ 2.5 giây `phase` = `done`, `state().live.camera` cách chỗ đã chạm ≤ 0.5m và `#feedback` có chữ `Bắt được`.
