# F2 — Bộ tình huống vertical stack

**Trạng thái:** xem `4-memory/features.json` · **Màn hình:** [màn chơi](../screens/man-choi.md)

Dữ liệu tình huống trong `logic.js` (`SCENARIOS.handler`, `SCENARIOS.cutter`). Mỗi tình huống:
`id, title, prompt` (mô tả ngắn), `me` (vị trí + hướng nhìn của bạn), `disc` (vị trí đĩa = người cầm đĩa),
`teammates` (6 người), `opponents` (7 người), `zone` (`{x, y, r}` vùng đúng, r = 4m), `explain` (vì sao).

Gợi ý nội dung (tấn công, vertical stack ở giữa sân):
- **Cutter**: cắt ngắn ra phía trống (under cut) · cắt hụt thì chạy về cuối stack (clear) · đĩa sát biên thì cắt sâu (deep) ·
  đĩa gần endzone thì đứng góc endzone phía trống · đồng đội đang cắt thì đứng yên trong stack, không chạy chung làn.
- **Handler**: đứng reset (dump) chéo sau người cầm đĩa ~5m · người cầm đĩa bị kẹp biên thì dump về giữa sân ·
  chuyền xong chạy lên (give-and-go) · stall cao thì swing ngang về giữa · gần endzone thì đứng reset trước endzone.

## Done when
- [ ] `SCENARIOS.handler` và `SCENARIOS.cutter` mỗi bên đúng 5 tình huống, `id` không trùng nhau.
- [ ] Mỗi tình huống có đúng 6 `teammates`, 7 `opponents`, có `prompt` và `explain` không rỗng.
- [ ] Mọi cầu thủ, đĩa và tâm `zone` nằm trong sân (0 ≤ x ≤ 100, 0 ≤ y ≤ 37); `zone.r` = 4.
- [ ] Tâm `zone` của mọi tình huống nằm trước mặt và hiện trong khung nhìn của `me` (`project` khác `null`, 0 ≤ sx ≤ 360 với view 360×480).
- [ ] Bot: khi vào màn chơi, `#prompt` hiện đúng `prompt` của tình huống hiện tại và canvas vẽ được 14 cầu thủ (`state().drawn.players` = 13 người khác + đĩa = 14).
