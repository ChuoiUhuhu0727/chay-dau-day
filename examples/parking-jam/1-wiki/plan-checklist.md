# Checklist — một Wiki game "đủ để build"

> `/game` dùng file này để biết ý tưởng còn thiếu gì và hỏi lại. `bash 3-verification/plan-check.sh` kiểm tự động.

| # | Phần | Câu hỏi phải trả lời được | Nằm ở |
|---|---|---|---|
| 1 | **Cho ai** | Ai chơi? Bao nhiêu tuổi? Chơi bao lâu một lần? | `overview.md` |
| 2 | **Vòng chơi chính** | Mỗi lượt người chơi làm gì (bấm gì, kéo gì)? Game phản hồi ra sao? | `overview.md` |
| 3 | **Thắng / thua / kết thúc** | Khi nào ván kết thúc? Thắng thế nào? Thua thế nào? | `overview.md` |
| 4 | **Điều khiển** | Bấm, kéo, gõ phím? Trên điện thoại có chơi được không? | `overview.md` |
| 5 | **Tiến triển** | Có điểm, level, độ khó tăng dần, phần thưởng không? | `overview.md` |
| 6 | **Phạm vi bản đầu** | 3–6 tính năng nhỏ nhất để chơi được. Cái gì để *sau*? | `features/`, `overview.md` |
| 7 | **Màn hình** | Có những màn nào? Mỗi màn có gì (id/selector)? | `screens/` |
| 8 | **Phong cách** | 3 tính từ cảm xúc, 5 màu, 2 font, asset | `design/style.md` |

Chỗ nào người dùng chưa trả lời: AI **tạm chọn** cách hợp lý, ghi vào `decisions/` với chữ `(tạm chọn)`
và thêm `Câu hỏi cho PO: …` vào `4-memory/po-questions.md`. Không bỏ trống, không tự đoán im lặng.
