# Asset miễn phí — nguồn đã kiểm, dùng được

Lấy bằng: `bash 2-environment/get-asset.sh <url> <tên-file>` (chỉ cho phép các nguồn dưới đây; tự ghi `credits.md`).

| Nguồn | Có gì | Giấy phép | Mẫu đường dẫn |
|---|---|---|---|
| **Twemoji** | 3.700 emoji vẽ đẹp, SVG (con vật, đồ ăn, đồ vật…) | CC BY 4.0 — ghi nguồn | `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/<mã>.svg` |
| **game-icons.net** | 4.000+ icon game (búa, kiếm, tim, sao…), SVG một màu | CC BY 3.0 — ghi nguồn | `https://cdn.jsdelivr.net/gh/game-icons/icons@master/<tác-giả>/<tên>.svg` |
| **Lucide** | icon giao diện (play, pause, volume, settings…), SVG nét | ISC — tự do | `https://cdn.jsdelivr.net/npm/lucide-static@0.460.0/icons/<tên>.svg` |
| **Google Fonts** | font có dấu tiếng Việt | OFL — tự do | `<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&display=swap">` |
| **Kenney.nl** | gói sprite 2D/3D, UI, âm thanh trọn bộ | CC0 — tự do | tải tay ở kenney.nl rồi chép vào `game/assets/` |

## Cách tìm mã

- **Twemoji**: mã là mã Unicode viết thường của emoji. 🐹 = `1f439`, 🔨 = `1f528`, ⭐ = `2b50`, 🎉 = `1f389`,
  🍎 = `1f34e`, 🐶 = `1f436`, 💣 = `1f4a3`, ❤️ = `2764`. Tra nhanh: https://emojipedia.org (mục "Codepoints").
- **game-icons**: tìm ở https://game-icons.net, tên tác giả và tên icon có trong đường dẫn trang icon
  (ví dụ `lorc/hammer-drop`, `delapouite/mole`, `lorc/heart-beats`).
- **Lucide**: tên ở https://lucide.dev/icons (ví dụ `volume-2`, `rotate-ccw`, `trophy`).

## Mẹo dùng

- SVG đổi màu được bằng CSS (`fill: currentColor`) — hợp với bảng màu của game.
- Emoji Twemoji to (≥ 64px) trông như hình vẽ tay — rất hợp game trẻ em/vui nhộn.
- Font chỉ dùng 1–2 họ, tải đúng các độ đậm cần (`wght@600;800`) để trang nhẹ.
