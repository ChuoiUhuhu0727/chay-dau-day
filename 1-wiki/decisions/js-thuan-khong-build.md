# Decision — JavaScript thuần, không thư viện, không bước build

**Quyết định:** chỉ dùng HTML + CSS + JS thuần. Không npm package, không bundler.

**Vì sao:** sinh viên clone về là chạy được ngay với Node 22 + Chrome; AI không tốn vòng lặp vì lỗi cài đặt.

**Hệ quả:** luật chơi trong `game/logic.js` là hàm thuần để `node --test` chạy được; DOM trong `game/ui.js`.
