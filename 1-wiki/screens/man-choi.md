# Screen — Màn chơi (`#screen-play`)

**F9 — full màn hình:** `#field` phủ cả cửa sổ (dọc hoặc ngang); mọi thứ khác là lớp phủ đè lên sân. Nút ⛶ `#fullscreen` góc trên phải (mọi màn).

**F10 — point liên tục:** HUD có mạng `#lives` (❤️/🖤); dưới HUD là thanh 5 pha `#track`, `Pha 2/5`, điểm trận `#points`. Ở pha `decide` hiện `#stall` "Stall N" giữa đáy (đỏ từ 7).

Từ trên xuống (màn 375px):
1. HUD: vai (`#role-label`) · tình huống `#progress` ("2/5") · điểm `#score`.
2. `#prompt` — mô tả tình huống (1–2 câu).
3. `#field` — canvas góc nhìn thứ nhất, phủ cả cửa sổ (F9; đường chân trời ở 40% chiều cao, FOV 70° theo cạnh ngắn). Trời xanh đậm, cỏ xanh lá có vạch trắng,
   endzone tô đậm hơn. Đồng đội = vòng vàng, đối thủ = vòng trắng, đĩa = đĩa trắng; người xa vẽ nhỏ hơn.
3b. `#goal` — la bàn ở góc trên trái khung sân: `#goal-arrow` (mũi tên xoay, `data-deg`) + chữ `ENDZONE · 42m` (F7).
   Người kèm bạn màu đỏ, chuyển động liên tục; lao tới gần thì khung có viền đỏ chớp (`#field.pressure`).
   F8: khung sân là pha bóng đang chạy — `state().phase` = `intro` → `decide` → `run` → `done`; `state().live` có `camera`, `mates`, `disc` đang vẽ.
   Trong `intro` gợi ý `#hint` = "Đang vào pha bóng…", chạm không tính.
4. `#feedback` — chữ to giữa sân: "Đúng! +1" (vàng) hoặc "Chưa đúng" (đỏ).
5. Tấm đáy `#sheet` (trượt lên sau khi chạm; màn ngang thì nằm bên phải): `#minimap` — canvas sân nhìn từ trên · `#explain` — vì sao · nút `#next` "Tiếp".

Hợp đồng bot: `window.__game.state()` có `role, index, score, answered, camera, zoneScreen {x,y}` (pixel CSS trong `#field`), `goal {distance, bearing}`, `marker {sx}`, `animating`,
`drawn.players`. Bot click thẳng toạ độ trên `#field`.

Tính năng: [F1](../features/F1-san-goc-nhin.md) · [F2](../features/F2-tinh-huong.md) · [F4](../features/F4-cham-cham-diem.md) · [F5](../features/F5-dap-an.md) · [F7](../features/F7-endzone-dich.md) · [F8](../features/F8-tran-dau-song-dong.md) · [F9](../features/F9-full-man-hinh.md) · [F10](../features/F10-point-lien-tuc.md)

**F12:** HUD có nút `#home` (về màn mở đầu) thay icon ong; tên vai dễ hiểu ("Người chạy"). Người cầm đĩa có nhãn "ĐĨA".
Phần tập chơi dùng chính màn này: `state().role` = `tutorial`, HUD "TẬP 1/3", vòng sáng + bàn tay 👆 chỉ chỗ, ẩn mạng/điểm/stall (trừ bước 3).
Sau khi trả lời: `#explain` ngắn + nhãn `#term` "Dân Ultimate gọi là: …".
**F13:** `#countdown` "3… 2… 1… Chạm!" lúc vào pha · hạt bắn, chớp sáng `#flash`, chữ khen `.callout` · tim vỡ `.heart-break` · `#stage.hurry` 3 giây cuối stall · nút `#sound`.
**F14:** người cartoon có dáng chạy, mây, hàng cây 2 lớp, cột đèn, sương chân trời, viền tối.
Tính năng: [F12](../features/F12-de-hieu-cho-nguoi-moi.md) · [F13](../features/F13-cam-giac-da.md) · [F14](../features/F14-do-hoa-nguoi-va-san.md)
**F16:** lúc đĩa bay có vệt vàng + vòng đáp trắng trên cỏ; bắt đúng thì quay chậm, chạy ≥ 6m thì máy quay hạ thấp (lao người). Tấm đáp án có dòng tường thuật `#caption` trên cùng. HUD có 3 ❤️ (F10 mới). Tính năng: [F16](../features/F16-khoanh-khac-highlight.md)
