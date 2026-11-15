# F14 — Đồ hoạ: người đẹp hơn, sân có không khí

**Trạng thái:** xem `4-memory/features.json` · Ý gốc: [raw/idea-4.md](../raw/idea-4.md) ý 1 · Quyết định: [phối cảnh canvas](../decisions/phoi-canh-canvas.md)

PO (vịt): "chơi thì mượt nhưng mấy hình người xấu quá". Vẫn canvas 2D, không thư viện (3D thật để Round 2).
Hướng nghệ thuật: **cartoon thể thao** — khối tròn, viền đậm, màu áo rực, giống sticker/huy hiệu của CLB.

## Người
- Tỉ lệ người thật (cao ~1.8m): giày · chân (quần short) · thân áo vai tròn · cổ · đầu có tóc · hai tay. Chân/tay là
  nét bo tròn dày (không còn hình chữ nhật), có viền đậm cho dễ nhìn trên cỏ.
- **Dáng chạy**: khi đang di chuyển (vào pha, đuổi theo), chân bước, tay đánh ngược nhịp chân, người nhún. Đứng yên thì
  nhún nhẹ, chân gần như đứng. Hàm thuần `bodyPose(t, speed)` trả góc chân/tay.
- **Áo**: đồng đội áo vàng có sọc đen ngang ngực + số áo; đối thủ áo trắng viền xanh navy; người kèm bạn áo đỏ.
  Áo có đổ bóng (sáng trên, tối dưới). Mỗi người một màu da/tóc riêng (`lookOf(i)`, cố định theo thứ tự) — cả sân không còn 13 bản sao giống hệt.
- Người ở xa vẽ giản lược (ít nét hơn) cho nhẹ máy; bóng mềm dưới chân.
- Người cầm đĩa: tay cầm đĩa giơ ra, nhãn "ĐĨA" (F12).

## Sân và cảnh

> 2026-11-15 tối · PO ([raw/idea-6.md](../raw/idea-6.md)): trời xanh thẫm ban đêm trông **ngột ngạt** → đổi sang **trời ban ngày, thoáng đãng**: trời xanh sáng, mặt trời, mây trắng bồng bềnh, đồi xa xanh nhạt, hàng cây xanh lá, cỏ xanh tươi. Màu CLB (xanh đậm, vàng, đen) giữ ở màn mở đầu, HUD và nút.

- Trời: gradient **xanh da trời sáng** về chân trời trắng nhạt, **mặt trời** có quầng, **mây trắng bồng bềnh** trôi chậm.
- Xa xa: **đồi xanh nhạt** + **hàng cây xanh lá** (2 lớp) + **cột đèn sân** (ban ngày nên tắt). Hai lớp trôi khác tốc độ khi bạn quay người (thị sai, có chiều sâu).
- Cỏ: sọc cắt cỏ rõ hơn, **sương mờ** gần đường chân trời (xa thì nhạt, như mắt thật).
- **Viền tối nhẹ** (vignette) quanh màn hình để mắt dồn vào giữa — nhẹ thôi để vẫn thoáng.

## Done when
- [ ] `bodyPose(t, speed)`: `speed` ≥ 3 (m/s) → biên độ góc chân (max |leg| qua một chu kỳ) ≥ 0.5 rad; `speed` = 0 → ≤ 0.1 rad; tay luôn ngược pha chân (`armL` cùng dấu với `legR`).
- [ ] `lookOf(i)` cố định (gọi 2 lần ra như nhau), trả `skin`, `hair`, `number`; 13 cầu thủ (i = 0…12) có ít nhất 4 màu da khác nhau và `number` khác nhau trong cùng một đội.
- [ ] Bot: lúc vào pha (`intro`) có ít nhất 1 người được vẽ với dáng chạy (`state().drawn.running` ≥ 1); ở `decide` vẫn vẽ 14 (13 người + đĩa) như F2.
- [ ] Bot: cảnh vẽ đủ lớp: `state().drawn.scenery` có `clouds` ≥ 2, `trees` ≥ 2 lớp, `lights` ≥ 1.
- [ ] Bot: trời ban ngày — điểm ảnh trên cùng giữa `#field` sáng (độ sáng > 0.45) và xanh da trời (B > R); điểm ảnh cỏ ngay dưới chân có G lớn nhất trong R, G, B.
- [ ] Bot: chụp ảnh màn chơi để PO duyệt bằng mắt (đẹp hay chưa là PO quyết, không phải bot).
