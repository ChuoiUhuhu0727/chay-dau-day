# F13 — Cảm giác "đã": âm thanh, hiệu ứng, combo, sao

**Trạng thái:** xem `4-memory/features.json` · Ý gốc: [raw/idea-4.md](../raw/idea-4.md) ý 2 · **Màn hình:** [chơi](../screens/man-choi.md), [kết quả](../screens/man-ket-qua.md)

PO (vịt): muốn cảm giác dopamine như game thường, qua thao tác, nhịp một ván và hiệu ứng.

## Nguyên tắc (giống game casual trên web)
1. **Mỗi chạm có phản hồi trong < 100ms**, gồm hình, tiếng và rung (nếu máy hỗ trợ).
2. **Thưởng to dần.** Đúng liền mạch thì tiếng cao dần, chữ to dần, hạt bắn nhiều dần.
3. **Sai cũng có cảm giác, nhưng ngắn.** Tiếng "bụp" trầm, tim vỡ, sân lắc. Không bắt đọc lâu.
4. **Căng thẳng có nhịp.** 3 giây cuối của stall: tiếng tích tắc, viền đỏ thở, số to lên.
5. **Kết thúc phải sướng.** Điểm chạy số, sao bật từng ngôi kèm tiếng, kỷ lục có kèn, nút Chơi lại nhấp nháy mời gọi.

## Âm thanh (Web Audio, tự tổng hợp — không file, không thư viện)
`game/sfx.js` · tên tiếng: `tap`, `correct`, `catch`, `wrong`, `tick`, `turnover`, `win`, `star`, `click`.
- `correct`: 3 nốt đi lên; **combo càng cao thì cao độ càng cao** (`toneFor('correct', combo)`).
- Nút `#sound` (🔊/🔇, 44px, góc phải dưới nút ⛶) bật/tắt; nhớ trong máy (`cdd-sound`). Tắt tiếng thì vẫn ghi
  `window.__sfx` (để bot kiểm), chỉ không phát ra loa.
- Trình duyệt chặn âm thanh trước lần chạm đầu → mở khoá ở lần bấm đầu tiên. Lỗi âm thanh không bao giờ làm hỏng game.

## Hiệu ứng
| Khi | Hiệu ứng |
|---|---|
| Chạm đúng | tiếng `correct` · rung 20ms · **hạt bắn** vàng/trắng tại chỗ chạm · chớp sáng trắng nhẹ toàn màn · chữ khen to giữa sân theo combo (`comboWord`) · "+170" bay lên **về phía ô điểm** rồi ô điểm nảy |
| Bắt được đĩa | tiếng `catch` · khung sân "đấm" nhẹ (phóng 1.03× rồi về) · chữ "Bắt được đĩa!" đóng dấu |
| Chạm sai / hết stall | tiếng `wrong` · rung 2 nhịp · chớp đỏ · **trái tim vỡ** bay ra khỏi HUD · sân lắc |
| 3 giây cuối stall (8, 9, 10) | tiếng `tick` mỗi giây · viền đỏ thở quanh màn (`#stage.hurry`) · số stall phóng to |
| Hết point | `win` (ghi điểm) hoặc `turnover` · **sao** bật lần lượt (mỗi sao một tiếng `star`) · điểm trận chạy số từ 0 · kỷ lục mới có kèn + confetti · nút `#retry` nhấp nháy |
| Màn mở đầu | ong ở logo nhún nhẹ, nút `#play` thở sáng (mời bấm) |

Chữ khen `comboWord(combo)`: 1 → "Hay!", 2 → "Tuyệt!", 3 → "Quá đỉnh!", ≥ 4 → "Không thể cản! 🔥".
Sao `starsFor(score)`: 5/5 → ⭐⭐⭐, 4/5 → ⭐⭐, 2–3 → ⭐, 0–1 → không sao.

## Nhịp một ván
Một point = 5 pha ≈ 1 phút: đủ ngắn để "thêm ván nữa", đủ dài để có câu chuyện (combo, suýt mất mạng).
Không đổi thời lượng vào pha (F8, 2 giây); đổi cảm giác **chờ** thành **xem**: trong lúc vào pha có chữ đếm
"3… 2… 1… Chạm!" để người chơi chuẩn bị tay, hết "Chạm!" là đồng hồ stall bắt đầu.

Chỉ animate `transform`/`opacity`. Máy bật **giảm chuyển động** (`prefers-reduced-motion`): bỏ lắc, nảy, confetti rơi; hạt chỉ loé tại chỗ chạm (không bắn xa); chữ khen, tiếng vẫn giữ.

## Done when
- [ ] `comboWord(1)` = "Hay!", `comboWord(2)` = "Tuyệt!", `comboWord(3)` = "Quá đỉnh!", `comboWord(7)` chứa "Không thể cản"; `comboWord(0)` = "".
- [ ] `starsFor(5)` = 3, `starsFor(4)` = 2, `starsFor(3)` = 1, `starsFor(2)` = 1, `starsFor(1)` = 0, `starsFor(0)` = 0.
- [ ] `toneFor('correct', combo)` trả về danh sách nốt (Hz) mà nốt cao nhất **tăng** khi combo tăng từ 1 → 2 → 3; `SOUNDS` có đủ 9 tên ở trên; gọi `sfx('…')` khi không có `AudioContext` không ném lỗi.
- [ ] Bot: có nút `#sound` ≥ 40px với `aria-pressed`; bấm → `state().sound` đổi và `localStorage['cdd-sound']` đổi theo; bấm lại → trở về như cũ.
- [ ] Bot: chạm đúng → `window.__sfx` có `correct`; trong 150ms có hạt bắn (`state().fx.particles` > 0) và chữ khen `.callout` có chữ "Hay!".
- [ ] Bot: đúng lần 2 liền → `.callout` có chữ "Tuyệt!".
- [ ] Bot: chạm sai → `window.__sfx` có `wrong`, có phần tử `.heart-break`.
- [ ] Bot: để stall chạy tới ≥ 8 → `#stage` có class `hurry` và `window.__sfx` có `tick`.
- [ ] Bot: hết point 4/5 → `#stars` có đúng 2 sao sáng (`.star.on`); sau 2 giây `#final-points` hiện đúng điểm trận cuối (chạy số xong).
- [ ] Bot: trong lúc vào pha có `#countdown` hiện chữ số đếm ngược; sang `decide` thì `#countdown` ẩn.
