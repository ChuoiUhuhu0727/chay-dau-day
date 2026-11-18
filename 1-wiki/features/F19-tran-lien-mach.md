# F19 — Trận liền mạch (phần 1): chạy liên tục, đón đĩa

**Trạng thái:** xem `4-memory/features.json` · Ý gốc: [raw/idea-7.md](../raw/idea-7.md) ý 2 · Cần: F17, F18

PO (vịt): "thực tế trên sân là mình sẽ **di chuyển liên tục để đón đĩa** từ đồng đội hoặc clear về… game hiện tại cứ
theo từng lượt, mất đi sự liên kết vốn có của một hiệp chơi". Chia 2 kiểu chơi:
- **Luyện tình huống** — như bây giờ (5 pha, đáp án sau mỗi pha).
- **Trận liền mạch** — một point chạy liên tục, không dừng giữa chừng.

## Luật của trận liền mạch
- Màn mở đầu có 2 nút: "🎯 Luyện tình huống" và "🏃 Trận liền mạch". Trận liền mạch chơi vai Người chạy.
- **Chạm để chạy tới** (PO chọn): chạm cỏ → bạn chạy tới đó (≤ 6 m/s), chạm chỗ khác bất cứ lúc nào để đổi hướng.
- Cả sân **tự chạy** (mô phỏng `sim.js`, hàm thuần, bước thời gian cố định):
  - Đồng đội áo vàng cắt theo hàng dọc: lần lượt cắt ra, không ai bắt thì quay về.
  - Áo trắng bám người của mình, chậm hơn một nhịp (đổi hướng mất ~0.3 giây) → cắt gắt là thoát được.
  - Người cầm đĩa đếm stall 1–10 và **ném cho người đang trống** (trống = áo trắng gần nhất cách > 2.5m và
    đường bay không bị chặn). Bạn trống thì ưu tiên ném cho bạn.
- Đĩa tới bạn → bắt được → phần 2 (F20). Đĩa tới đồng đội → trận tiếp tục, người cầm đĩa đổi chỗ.
- Hết point: **bắt trong vùng ghi điểm** = ghi điểm; **stall 10** hoặc **bị cắt đĩa** = mất đĩa.
- Không dừng để giải thích giữa trận. Hết point mới có **xem lại 3 khoảnh khắc** (dùng hình F17).

## Done when
- [ ] `sim.js`: `createMatch(seed)` + `step(world, dt, input)` thuần, cùng seed + cùng input → cùng kết quả.
- [ ] Bạn chạy về phía điểm chạm, không nhanh hơn 6 m/s, tới nơi thì dừng; chạm chỗ mới giữa chừng thì đổi hướng ngay bước sau.
- [ ] Áo trắng kèm bạn đi theo bạn nhưng chậm một nhịp: bạn đổi hướng gắt thì trong 0.3 giây đầu khoảng cách tăng.
- [ ] Người cầm đĩa ném cho người trống: dựng thế có đúng 1 người trống → `step` tới lúc ném thì đĩa bay về người đó; không ai trống tới stall 10 → `turnover`.
- [ ] Đồng đội bắt đĩa trong vùng ghi điểm → `world.result = 'score'`.
- [ ] Bot: chọn "Trận liền mạch", chạm vài chỗ → bạn di chuyển trên màn (`state().match.me` đổi ≥ 3m), đồng đội và áo trắng cũng đổi chỗ; trận tự kết thúc (score hoặc turnover) trong 90 giây.
