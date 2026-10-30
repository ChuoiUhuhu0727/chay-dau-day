# Screen — Màn chơi (`#screen-play`)

Từ trên xuống (màn 375px):
1. HUD: vai (`#role-label`) · tình huống `#progress` ("2/5") · điểm `#score`.
2. `#prompt` — mô tả tình huống (1–2 câu).
3. `#field` — canvas góc nhìn thứ nhất, rộng 100% (tối đa 360px), khung vuông 1:1 (đường chân trời ở 40% chiều cao). Trời xanh đậm, cỏ xanh lá có vạch trắng,
   endzone tô đậm hơn. Đồng đội = vòng vàng, đối thủ = vòng trắng, đĩa = đĩa trắng; người xa vẽ nhỏ hơn.
4. `#feedback` — "Đúng! +1" (vàng) hoặc "Chưa đúng" (đỏ).
5. `#minimap` — canvas sân nhìn từ trên (ẩn tới khi chấm) · `#explain` — vì sao · nút `#next` "Tiếp".

Hợp đồng bot: `window.__game.state()` có `role, index, score, answered, camera, zoneScreen {x,y}` (pixel CSS trong `#field`),
`drawn.players`. Bot click thẳng toạ độ trên `#field`.

Tính năng: [F1](../features/F1-san-goc-nhin.md) · [F2](../features/F2-tinh-huong.md) · [F4](../features/F4-cham-cham-diem.md) · [F5](../features/F5-dap-an.md)
