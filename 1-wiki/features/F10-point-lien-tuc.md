# F10 — Một point liên tục: mạng, đếm stall, combo

**Trạng thái:** xem `4-memory/features.json` · **Màn hình:** [màn chơi](../screens/man-choi.md), [màn kết quả](../screens/man-ket-qua.md)

PO (vịt, 2026-11-15): "thời gian trong game ngắn quá, giống thi trắc nghiệm hơn là game chơi vui".
Đổi **khung** của bài từ "5 câu hỏi rời" thành **một point** (một pha tấn công) đang chạy: 5 pha liên tiếp đưa đĩa tới endzone.
Mỗi lần chạm vẫn là một quyết định đọc sân có giải thích (F4, F5 giữ nguyên) — chỉ thêm áp lực và lý do để chơi lại.

**Mạng ❤️❤️❤️ (`LIVES = 3`)** — mỗi lần đọc sai = mất đĩa = −1 ❤️. Hết mạng → **Turnover**, point kết thúc ngay.
Sống sót hết 5 pha → **Ghi điểm!** (tương đương đúng ≥ 3/5).

> 2026-11-15 tối · PO đổi 2 → 3 mạng ([raw/idea-5.md](../raw/idea-5.md)): người chưa từng chơi sai 2 lần là hết ván "như tia chớp". 5 mạng thì không bao giờ thua nên chọn 3.

**Đếm stall (`STALL = 10`)** — như luật Ultimate: khi tới lượt bạn quyết định (pha `decide`), người kèm đếm "Stall 1… 10", mỗi giây một số.
Tới 10 mà chưa chạm → **Stall!** = tính là sai (−1 ❤️), hiện đáp án như chạm sai. Số stall đổi màu đỏ từ 7.

**Điểm & combo** — `#score` (⭐) vẫn đếm số lần đọc đúng (F4). Thêm **điểm trận** `points`:
- Đọc đúng: `pointsFor(combo, stall)` = `100 × min(combo, 3) + 10 × (10 − stall)`; `combo` = số lần đúng liên tiếp tính cả lần này.
  → nhanh tay và đúng liền mạch được nhiều điểm hơn. Đúng từ lần thứ 2 liên tiếp hiện "COMBO ×2" bay lên.
- Sai hoặc stall: `combo` về 0, không cộng điểm.
- Kỷ lục (điểm cao nhất mỗi vai) lưu trong máy (`localStorage`), hiện ở màn kết quả: "Kỷ lục mới!" khi phá.

**Thanh tiến độ** dưới HUD: 5 ô (ô vàng = đúng, ô đỏ = sai, ô đang chơi nhấp nháy), chữ `Pha 2/5`, điểm trận `#points`, mạng `#lives`.

## Done when
- [ ] `startLesson(role)` có `lives = 3`, `combo = 0`, `points = 0`; `LIVES` = 3, `STALL` = 10.
- [ ] `answer(state, point, stall)` khi đúng: `score` +1, `combo` +1, `points` + `pointsFor(combo mới, stall)`, `lives` giữ nguyên; khi sai: `lives` −1, `combo` = 0, `points` giữ nguyên; gọi lần 2 không đổi gì.
- [ ] `pointsFor(1, 0)` = 200, `pointsFor(2, 3)` = 270, `pointsFor(5, 10)` = 300 (combo tối đa ×3, stall 10 không thưởng tốc độ).
- [ ] `stallOut(state)`: tình huống chưa trả lời → `answered = true`, `correct = false`, `stalled = true`, `lives` −1, `combo` = 0, `tap` = `null`; đã trả lời rồi thì không đổi gì. `stallCount(t)` = 1 ở t = 0, 4 ở t = 3.5, và luôn trong [1, 10].
- [ ] `isFinished(state)` = `true` khi đã trả lời pha thứ 5, **hoặc** khi `lives` = 0 (turnover giữa chừng); `passed(state)` = `lives > 0` khi đã kết thúc.
- [ ] Bot: vào màn chơi thấy `#lives` có 3 ❤️, `#points` = 0, và `#stall` hiện chữ `Stall` khi tới pha `decide`; sau 1.5 giây số stall (`state().stall`) ≥ 2.
- [ ] Bot: chạm đúng 2 lần liền → `#points` > 0 và tăng sau lần đúng thứ 2 nhiều hơn lần thứ nhất (combo), `state().combo` = 2.
- [ ] Bot: chạm sai → `#lives` còn 2 ❤️, `state().combo` = 0.
- [ ] Bot: không chạm tới hết đếm stall (≤ 11 giây) → `#feedback` có chữ `Stall`, `state().lives` giảm 1, nút `#next` hiện.
- [ ] Bot: màn kết quả có `#final-points` (điểm trận) và `#best` (kỷ lục).
