# F20 — Trận liền mạch (phần 2): cầm đĩa, chuyền, rồi clear

**Trạng thái:** xem `4-memory/features.json` · Ý gốc: [raw/idea-7.md](../raw/idea-7.md) ý 2 · Cần: F19

PO (vịt) chọn: bắt được đĩa thì **mình đứng yên, chọn đồng đội để chuyền**, rồi phải **clear** để nhường chỗ.

## Luật
- Bắt được đĩa → bạn **không chạy được** (luật Ultimate). Áo trắng tới kèm, stall đếm 1–10 trên màn.
- Chạm vào **đồng đội áo vàng** để chuyền. Đồng đội đang trống có vòng sáng nhẹ (gợi ý, không chỉ đáp án sẵn).
- Chuyền cho người bị kèm sát (áo trắng < 1.5m) → có thể bị cắt đĩa → mất đĩa.
- Chuyền xong → bạn chạy lại được. Nếu bạn **đứng trong đường chuyền** của người cầm đĩa mới quá 2 giây → huấn luyện
  viên nhắc to kiểu F17: "**Clear!**" + mũi tên chỉ ra biên.
- Điểm: bắt đĩa, chuyền tốt, clear kịp đều cộng điểm; chuỗi liên tiếp = combo (dùng lại F13).

## Done when
- [ ] Bạn cầm đĩa: `step` với input chạy → vị trí bạn không đổi; stall tăng 1 mỗi giây; stall 10 → `turnover`.
- [ ] `throwTo(world, i)`: đồng đội trống → đĩa bay, đồng đội bắt; đồng đội bị kèm < 1.5m → có thể `turnover` (theo seed, lặp được).
- [ ] `inLane(world)`: bạn đứng giữa người cầm đĩa và vùng ghi điểm, gần đường thẳng < 2m → true; ngoài đó → false.
- [ ] Bot: đứng trong đường chuyền > 2 giây → hiện "Clear!" chữ cao ≥ 28px và mũi tên; ra khỏi đường → chữ tắt.
- [ ] Bot: trận liền mạch, bạn bắt được đĩa rồi chạm đồng đội trống → đĩa bay đi, `state().match.holder` đổi sang đồng đội.
- [ ] Hết point có màn "xem lại" với ≥ 1 khoảnh khắc (bắt / chuyền / clear) vẽ bằng hình F17.
