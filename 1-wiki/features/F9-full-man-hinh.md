# F9 — Full màn hình

**Trạng thái:** xem `4-memory/features.json` · **Màn hình:** [màn chơi](../screens/man-choi.md)

PO (vịt, 2026-11-15): "tớ muốn game full màn hình". Khung sân không còn là ô vuông 360px giữa trang,
mà phủ **cả cửa sổ** như game thật; chữ, điểm, nút nằm **đè lên sân** (lớp phủ).

**Góc nhìn khi đổi khung** — FOV 70° áp cho **cạnh ngắn** của khung:
- Điện thoại dọc (rộng < cao): như cũ, ngang 70°.
- Màn ngang / máy tính (rộng > cao): ngang **rộng hơn** 70° (thấy nhiều sân hơn), dọc vẫn thấy cỏ ngay trước chân
  → người kèm đứng 1.5–4m trước mặt không bị cắt mất.
- `focal(cam, view) = min(view.w, view.h) / (2·tan(fov/2))`. Khung 360×360 và 360×480 cho đúng số cũ (F1–F8 không đổi).

**Lớp phủ trên sân** (màn chơi): HUD (vai · tình huống · điểm · nút ⛶) ở trên cùng, thẻ tình huống ngay dưới,
la bàn endzone, gợi ý ở giữa đáy. Sau khi chạm: **tấm đáy** (bottom sheet) trượt lên với `#feedback`, sơ đồ, giải thích, nút Tiếp.

**Nút ⛶ `#fullscreen`** — góc trên phải, ở mọi màn: bấm để vào/thoát toàn màn hình thật (Fullscreen API, ẩn cả thanh trình duyệt).
Trình duyệt không hỗ trợ (iPhone Safari) thì nút ẩn đi; game vẫn phủ hết cửa sổ.

## Done when
- [ ] `focal(cam, view)` = `min(view.w, view.h) / (2·tan(fov/2))` (sai số ≤ 1e-9) với khung 360×480, 390×844, 844×390, 1280×720; khung 360×480 vẫn cho `focal` = 360 / (2·tan 35°).
- [ ] Với 4 khung 390×844, 844×390, 1280×720, 360×360: điểm trên cỏ 2.5m ngay trước mặt và điểm 30m ngay trước mặt đều chiếu vào trong khung (0 ≤ sx ≤ w, 0 ≤ sy ≤ h); `unproject` của điểm 2.5m trả lại đúng chỗ (sai số ≤ 0.05m).
- [ ] Bot: ở màn chơi trên màn 390×844, `#field` phủ cả cửa sổ (rộng = `innerWidth`, cao = `innerHeight`, sai số ≤ 1px; góc trên trái ở (0, 0)) và trang không cuộn dọc (`scrollHeight` ≤ `innerHeight` + 1).
- [ ] Bot: HUD `#score` và thẻ `#prompt` nằm trong khung sân (lớp phủ), không đẩy sân xuống.
- [ ] Bot: nút `#fullscreen` hiện ở màn mở đầu và màn chơi, cỡ ≥ 40×40px, có `aria-label`.
- [ ] Bot: sau khi chạm, nút `#next` nằm trọn trong cửa sổ (đáy ≤ `innerHeight`) mà không cần cuộn.
- [ ] Bot: chạm vào `state().zoneScreen` vẫn chấm "Đúng" khi sân phủ cả cửa sổ (F4 không vỡ).
