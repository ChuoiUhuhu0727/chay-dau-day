# Style — Fulbright Ultimate: Chạy Đâu Đây?

Lấy cảm hứng trực tiếp từ logo Fulbright Ultimate Club.

## 3 tính từ cảm xúc
**sung sức · đồng đội · tự tin** — như huy hiệu đội thể thao.

## 5 màu
| Biến | Mã | Dùng cho |
|---|---|---|
| `--bg` | `#0A3FA8` | nền xanh dương; `body` = `radial-gradient(circle at 50% 40%, #1560E0, #0A3FA8 45%, #050A1F)` |
| `--surface` | `#111111` | khiên, thẻ, HUD (đen) |
| `--primary` | `#F5A300` | nút chính, viền khiên, đồng đội, vùng đúng (vàng cam) |
| `--ink` | `#FFFFFF` | chữ trên nền tối, đối thủ, đĩa |
| `--accent` | `#FFC93C` | điểm, "+1", confetti (vàng sáng) |

Màu nghĩa thêm: sai = `#E5484D` (đỏ). Cỏ trong canvas: `#2E8B3E` / endzone `#25733A`, vạch trắng.

## Font (Google Fonts, có dấu tiếng Việt)
- Tiêu đề: **Montserrat** 900 (FULBRIGHT, ULTIMATE, điểm) — chữ in hoa đậm kiểu logo.
- Chữ "CLUB", nhãn HUD: **Oswald** 600 (chữ hẹp, giống chữ CLUB).
- `https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;900&family=Oswald:wght@500;600&display=swap`

## Hình khối
- Khiên: `clip-path` hình khiên (trên phẳng, đáy nhọn), nền `--surface`, viền `--primary` 6px.
- `ULTIMATE`: trắng, bóng vàng lệch 3px phía dưới, `transform: skewY(-4deg)`.
- Nút: vàng `--primary`, chữ đen, bo 12px, bóng đen lệch 4px (kiểu sticker), cao ≥ 48px.

## Juice
| Khi | Hiệu ứng |
|---|---|
| Bấm nút | scale 0.95 → 1 (120ms) |
| Chạm sân | vòng tròn trắng loang ra tại điểm chạm (scale 0→1, opacity 1→0, 300ms) |
| Đúng | "+1" vàng bay lên mờ dần, `#score` nảy 1.3×, vùng đúng nhấp nháy vàng |
| Sai | `#field` lắc ngang 3 lần, `#feedback` chớp đỏ |
| Hiện đáp án | `#minimap` + `#explain` trượt lên từ dưới (translateY 16px → 0) |
| Qua bài | confetti 🐝🥏 rơi, khiên phóng to 0.8 → 1 |
| Người kèm lao tới (F8) | viền đỏ chớp quanh `#field` (opacity), người kèm đỏ `#E5484D` giang tay |
| La bàn endzone (F7) | mũi tên `#goal-arrow` xoay mượt (transform 200ms) |
| Bạn đang chạy (F9) | camera nhún 4cm theo bước chạy, đĩa bay vòng cung; "Bắt được đĩa!" nảy vàng |

## Asset
- Logo CLB: `game/assets/logo.jpg` (ảnh người dùng gửi).
- 🐝 Twemoji: `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/1f41d.svg` → `bee.svg`
- 🥏 Twemoji: `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/1f94f.svg` → `disc.svg`
- Lucide: `https://cdn.jsdelivr.net/npm/lucide-static@0.460.0/icons/rotate-ccw.svg` (chơi lại), `arrow-right.svg` (tiếp), `trophy.svg` (kết quả)
