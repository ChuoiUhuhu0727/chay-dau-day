# F15 — Luật Ultimate trong 30 giây + mục tiêu rõ ở màn đầu

**Trạng thái:** xem `4-memory/features.json` · Ý gốc: [raw/idea-5.md](../raw/idea-5.md) ý 1 · **Màn hình:** [mở đầu](../screens/man-mo-dau.md)

Teammate chưa từng chơi frisbee: "nêu rõ goals của game hơn… hoặc 1 tab có thể check luật ở giao diện đầu tiên".
Vịt làm rõ: ý là **luật Ultimate tổng quan**, cho người chưa biết môn này.

## Màn mở đầu
- Dưới khiên có một dòng mục tiêu `#goal-line`: **"🎯 Mục tiêu: qua 5 pha, đưa đĩa tới vùng ghi điểm. Sai 3 lần là mất đĩa."**
  (số lần lấy từ `LIVES`, đổi luật thì chữ tự đổi.)
- Nút `#rules-btn` **"📖 Luật Ultimate"** luôn hiện. Bấm vào mở tấm `#rules` gồm 6 dòng có icon, đọc trong 30 giây;
  nút `#rules-close` **"Đã hiểu!"** đóng lại.

## 6 dòng luật (`RULES` trong `logic.js`, mỗi dòng ≤ 90 ký tự, lời thường)
1. 👥 Hai đội, mỗi đội 7 người, chơi bằng một chiếc đĩa.
2. 🏆 Ghi điểm = bắt được đĩa trong vùng ghi điểm của đối thủ.
3. ✋ Người cầm đĩa không được chạy — chỉ xoay người và ném.
4. 🏃 Vì vậy đồng đội phải chạy vào chỗ trống để nhận đĩa. Game này luyện đúng việc đó!
5. ⏱ Cầm đĩa tối đa 10 giây (đối thủ đếm "stall"). Đĩa rơi, ra ngoài hay bị chặn = mất đĩa.
6. 🤝 Không va chạm, tự làm trọng tài — tinh thần fair play.

## Tracking (thêm vào F11)
`rules_open` `{ from }` — bao nhiêu người cần đọc luật trước khi chơi → người chơi có phải dân mới hoàn toàn không.

## Done when
- [ ] `RULES` có đúng 6 dòng `{ icon, text }`, mỗi `text` ≤ 90 ký tự; gộp lại có đủ các ý: "7 người", "vùng ghi điểm", "không được chạy", "chỗ trống", "10 giây", "mất đĩa", "va chạm".
- [ ] `goalText()` có chữ "Mục tiêu", "5 pha" và `Sai ${LIVES} lần`.
- [ ] Bot: màn mở đầu có `#goal-line` chứa "Mục tiêu" và "Sai 3 lần"; nút `#rules-btn` hiện, cao ≥ 44px.
- [ ] Bot: bấm `#rules-btn` → `#rules` hiện với đúng 6 dòng `.rule`, có chữ "10 giây"; `window.__events` có `rules_open`; bấm `#rules-close` → `#rules` ẩn.
