# Screen — Màn chơi (`#screen-play`)

Từ trên xuống (màn 375px):
1. HUD: vai (`#role-label`) · tình huống `#progress` ("2/5") · điểm `#score`.
2. `#prompt` — mô tả tình huống (1–2 câu).
3. `#field` — canvas góc nhìn thứ nhất, rộng 100% (tối đa 360px), khung vuông 1:1 (đường chân trời ở 40% chiều cao). Trời xanh đậm, cỏ xanh lá có vạch trắng,
   endzone tô đậm hơn. Đồng đội = vòng vàng, đối thủ = vòng trắng, đĩa = đĩa trắng; người xa vẽ nhỏ hơn.
3b. `#goal` — la bàn ở góc trên trái khung sân: `#goal-arrow` (mũi tên xoay, `data-deg`) + chữ `ENDZONE · 42m` (F7).
   Người kèm bạn màu đỏ, chuyển động liên tục; lao tới gần thì khung có viền đỏ chớp (`#field.pressure`, F8).
   F9: khung sân là pha bóng đang chạy — `state().phase` = `intro` → `decide` → `run` → `done`; `state().live` có `camera`, `mates`, `disc` đang vẽ.
   Trong `intro` gợi ý `#hint` = "Đang vào pha bóng…", chạm không tính.
4. `#feedback` — "Đúng! +1" (vàng) hoặc "Chưa đúng" (đỏ).
5. `#minimap` — canvas sân nhìn từ trên (ẩn tới khi chấm) · `#explain` — vì sao · nút `#next` "Tiếp".

Hợp đồng bot: `window.__game.state()` có `role, index, score, answered, camera, zoneScreen {x,y}` (pixel CSS trong `#field`), `goal {distance, bearing}`, `marker {sx}`, `animating`,
`drawn.players`. Bot click thẳng toạ độ trên `#field`.

Tính năng: [F1](../features/F1-san-goc-nhin.md) · [F2](../features/F2-tinh-huong.md) · [F4](../features/F4-cham-cham-diem.md) · [F5](../features/F5-dap-an.md) · [F7](../features/F7-endzone-dich.md) · [F8](../features/F8-nguoi-kem-chuyen-dong.md) · [F9](../features/F9-tran-dau-chuyen-dong.md)
