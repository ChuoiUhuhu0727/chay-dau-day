# F16 — Khoảnh khắc highlight: vệt đĩa, vòng đáp, quay chậm, lời tường thuật

**Trạng thái:** xem `4-memory/features.json` · Ý gốc: [raw/idea-5.md](../raw/idea-5.md) ý 3 · **Màn hình:** [chơi](../screens/man-choi.md)

Vịt gửi teaser một game Ultimate 3D làm "tăng dopamine cực kỳ". Học **nguyên lý**, không chép hình:
1. Đĩa bay có **vệt sáng** phía sau → mắt bám theo đĩa, thấy được đường bay.
2. Trên cỏ có **vòng đáp** chỗ đĩa sẽ rơi → hồi hộp "có kịp không".
3. Pha bắt đẹp được **quay chậm** đúng khoảnh khắc chạm tay, và người bắt **lao người** (layout) — máy quay hạ thấp.
4. Một **dòng tường thuật** kiểu bình luận viên: "chạy 23m, bắt gọn!" — biến mỗi pha thành một khoảnh khắc đáng kể.

## Cách làm trong game mình
- Lúc đĩa bay (pha `run`): vệt vàng mờ dần nối ~10 vị trí gần nhất của đĩa; vòng trắng nhấp nháy trên cỏ ở chỗ đĩa sẽ tới.
- Đọc đúng: 12% cuối đường chạy chậm lại còn 0.4× (`catchScale`); nếu chạy ≥ 6m thì máy quay hạ thấp dần như lao người
  (`layoutDip`, thấp nhất 0.55m ở lúc bắt) rồi đứng dậy trong 0.5 giây.
- Tấm đáp án có dòng tường thuật `#caption` ở trên cùng (`commentary(...)`), ví dụ:
  "📣 Pha 2 · chạy 9m vào chỗ trống, bắt gọn! · COMBO ×2 · +290" · "📣 Pha 3 · chạy 4m nhưng chỗ đó chưa trống — mất đĩa" ·
  "📣 Pha 4 · đứng yên quá 10 giây — mất đĩa".

## Done when
- [ ] `commentary({ phase, dist, correct, stalled, combo, gain })`: đúng → có `Pha ${phase}`, `${dist}m`, chữ "bắt" và `+${gain}`, combo ≥ 2 thì có "COMBO ×"; sai → có "mất đĩa"; stall → có "10 giây" và "mất đĩa".
- [ ] `catchScale(u)` = 1 khi u < 0.88, = 0.4 khi 0.88 ≤ u < 1. `layoutDip(dist, v)` = 0 khi dist < 6; khi dist ≥ 6: 0 ở v = 0, 0.55 ở v = 1, không giảm khi v tăng.
- [ ] Bot: chạm đúng ở C1 → trong lúc đĩa bay có vệt đĩa (`state().fx.trail` ≥ 3) và vòng đáp (`state().fx.landing` = true); máy quay hạ thấp (độ cao camera nhỏ nhất `live.camera.h` < 1.4) vì chạy ≥ 6m.
- [ ] Bot: sau khi chạm đúng, `#caption` hiện, có "Pha 1", "m" và "+"; sau khi chạm sai, `#caption` có "mất đĩa".
