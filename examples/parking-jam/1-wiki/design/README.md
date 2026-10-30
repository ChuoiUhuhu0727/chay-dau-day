# Design — để game/app đẹp, không chỉ chạy được

> AI đọc file này **trước khi làm giao diện**. Mỗi game có thêm `style.md` riêng (do `/game` viết)
> nói rõ màu, font, cảm xúc của game đó. `style.md` thắng nếu khác file này.

## 1. Chọn một "cảm xúc" trước, rồi mới chọn màu

Viết 3 tính từ cho game, ví dụ *vui nhộn · tươi sáng · trẻ con* hay *bí ẩn · tối · căng thẳng*.
Mọi lựa chọn bên dưới phải hợp 3 tính từ đó. Không chọn "đẹp" chung chung.

## 2. Màu: 5 màu, đặt tên theo vai trò

| Vai trò | Dùng cho | Ví dụ (vui nhộn) |
|---|---|---|
| `--bg` | nền trang | `#FFF6E5` kem |
| `--surface` | bàn chơi, thẻ, hộp | `#7CC46A` cỏ |
| `--primary` | nút chính, điểm nhấn | `#FF7A3D` cam |
| `--ink` | chữ, viền | `#2B2140` tím than |
| `--accent` | thắng, điểm, hiệu ứng | `#FFD23F` vàng |

- Khai báo **một lần** trong `:root { --bg: …; }`, mọi chỗ khác dùng `var(--bg)`. Không rải mã màu khắp nơi.
- Chữ trên nền phải đọc rõ: chữ đậm trên nền nhạt hoặc ngược lại (độ tương phản ≥ 4.5:1).
- Màu có nghĩa: xanh lá = đúng/thắng, đỏ = sai/thua, vàng = điểm/thưởng. Dùng nhất quán.

## 3. Chữ: 1 font tiêu đề có cá tính + 1 font dễ đọc

- Lấy từ Google Fonts (miễn phí, giấy phép OFL), có dấu tiếng Việt. Gợi ý:
  - Vui nhộn: **Baloo 2**, **Fredoka**, **Lilita One** (tiêu đề) + **Nunito** (chữ thường)
  - Hiện đại, gọn: **Be Vietnam Pro**, **Lexend**
  - Bí ẩn, cổ điển: **Cinzel** (tiêu đề) + **Lora**
- Cỡ chữ có thứ bậc rõ: tiêu đề ≥ 2× chữ thường; số điểm/thời gian to, đậm, dễ thấy.
- **Không** để font mặc định của trình duyệt (Times New Roman).

## 4. Bố cục: điện thoại trước

- Thiết kế cho màn **375px** chiều ngang trước. Không được có thanh cuộn ngang.
- Nút và vật bấm được **≥ 44×44px** (ngón tay người).
- Khoảng cách theo bậc 4/8/12/16/24/32px, không đặt số lẻ tuỳ hứng.
- Bo góc và đổ bóng **giống nhau** cho cùng loại vật (mọi nút cùng kiểu).

## 5. "Juice": cảm giác sống động (quan trọng nhất với game)

Mỗi hành động của người chơi phải có **phản hồi ngay** (≤ 100ms):

| Khi | Hiệu ứng gợi ý |
|---|---|
| Bấm nút | thu nhỏ 95% rồi bật lại (`transform: scale`) |
| Làm đúng / ghi điểm | số điểm nảy lên, "+1" bay lên rồi mờ dần, rung nhẹ màu vàng |
| Làm sai | lắc ngang 3 lần, chớp đỏ |
| Vật xuất hiện / biến mất | trượt lên từ dưới, phóng to từ 0 → 100% |
| Thắng | confetti bằng CSS/emoji, màn chúc mừng to, rõ |

- Chỉ animate `transform` và `opacity` (mượt, không giật). Thời lượng 150–400ms, `ease-out`.
- Âm thanh (nếu có) dùng Web Audio tạo tiếng "bíp" ngắn, có nút tắt tiếng. Không tự phát nhạc khi mở trang.

## 6. Hình ảnh (asset)

- Đừng vẽ hình bằng ô vuông màu khi có hình đẹp miễn phí. Xem `assets.md`.
- Lấy asset bằng lệnh: `bash 2-environment/get-asset.sh <url> <tên-file>` — tự lưu vào `game/assets/`
  và tự ghi nguồn + giấy phép vào `credits.md`.
- Mọi hình phải có `width`/`height` hoặc kích thước CSS rõ ràng; `alt` cho hình có nghĩa.

## 7. Trước khi `claim`, tự hỏi 5 câu

1. Nhìn 3 giây có biết phải làm gì không?
2. Có còn font mặc định, màu mặc định, nút xám mặc định nào không?
3. Mỗi lần bấm có phản hồi ngay không?
4. Trên màn 375px có bị tràn, chữ có bị cắt không?
5. Màn thắng/thua có "ăn mừng" đủ không?

Verification (bot) tự kiểm được câu 2, 4 và vật bấm ≥ 44px. Các câu còn lại: **PO (bạn) chơi thử và nói**.
