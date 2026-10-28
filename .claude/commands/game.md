---
description: Bắt đầu game mới từ ý tưởng của bạn — AI viết Wiki và kế hoạch tính năng (Harness Plan)
argument-hint: <mô tả game: chơi thế nào, thắng khi nào, muốn có tính năng gì>
---

Đọc `2-environment/rules.md` trước. Người dùng là sinh viên, có thể chưa biết code. Trả lời tiếng Việt, ngắn, thân thiện.
Ý tưởng game của họ:

$ARGUMENTS

Làm lần lượt:

1. Nếu chưa có thư mục `examples/parking-jam/` thì chạy `bash new-game.sh` (cất game mẫu, tạo trang trắng).
   Nếu đã có game khác đang làm dở (có trang trong `1-wiki/features/`), hỏi người dùng có muốn bỏ game cũ không trước khi làm gì.
2. **Phỏng vấn ngắn nếu ý tưởng còn thiếu.** Đối chiếu ý tưởng với 8 phần trong `1-wiki/plan-checklist.md`.
   - Nếu thiếu **vòng chơi chính** hoặc **thắng/thua** (không thể build), hoặc thiếu từ 3 phần trở lên: đưa ra
     **tối đa 5 câu hỏi**, mỗi câu có 2–4 lựa chọn A/B/C (ngắn, cụ thể, lựa chọn đầu là gợi ý tốt nhất, ghi "(gợi ý)").
     Ví dụ: `2. Khi nào thua? A) Thú đói quá 3 lần (gợi ý)  B) Hết 3 phút  C) Không có thua, chơi mãi`
     Kết thúc bằng: "Trả lời kiểu **1A 2C 3B**, viết thêm ý riêng nếu muốn, hoặc gõ **ok** để lấy hết gợi ý." rồi **dừng**.
     Trước khi dừng, lưu ý tưởng gốc vào `1-wiki/raw/idea.md` và các câu hỏi vào `1-wiki/raw/questions.md`.
   - Khi người dùng trả lời (kể cả ở tin nhắn sau, không có /game): ghi câu trả lời vào `1-wiki/raw/answers.md`
     (câu nào họ không trả lời thì ghi "dùng gợi ý"), rồi làm tiếp bước 3–5.
   - Nếu ý tưởng đủ rõ: bỏ qua phỏng vấn, làm luôn bước 3.
3. Viết `1-wiki/raw/idea.md` theo mẫu có sẵn (Tên game · Cho ai · Chơi thế nào · Các tính năng muốn có),
   giữ nguyên ý người dùng. Game chơi bằng bấm/chạm, chạy trên trình duyệt.
4. **Harness Plan — bạn tự viết Wiki** theo kiến trúc trong `1-wiki/README.md`:
   - `1-wiki/features/F<số>-<ten-ngan>.md`: mỗi tính năng NHỎ một file. Dòng đầu đúng dạng `# F1 — Tên tính năng`.
     Có mục `## Done when` gồm các dòng `- [ ] …`, mỗi dòng là một điều máy kiểm được (đo được, không mơ hồ),
     có cả điều cho unit test lẫn điều bot bấm thử trên giao diện (nêu rõ id/selector, ví dụ `#moves`).
   - `1-wiki/screens/` (màn hình, các selector), `1-wiki/decisions/` (lựa chọn và vì sao), `overview.md`, `index.md`, thêm 1 dòng `log.md`.
   - Chỗ nào ý tưởng không nói rõ: chọn cách hợp lý, ghi `Câu hỏi cho PO: …` vào `4-memory/po-questions.md`.
   - `1-wiki/design/style.md`: đọc `1-wiki/design/README.md` rồi chốt **3 tính từ cảm xúc**, **5 màu** (`--bg --surface --primary --ink --accent`),
     **2 font** Google Fonts có dấu tiếng Việt, **hiệu ứng juice** cho từng hành động, và **danh sách asset** (URL cụ thể từ `1-wiki/design/assets.md`).
   - `overview.md` phải trả lời đủ 8 phần của `1-wiki/plan-checklist.md` (cho ai, vòng chơi, thắng/thua, điều khiển,
     tiến triển, phạm vi bản đầu + để sau, màn hình, phong cách). Phần nào là tạm chọn thì ghi `(tạm chọn)`.
   - Cuối cùng chạy `node 4-memory/features.mjs sync` rồi `bash 3-verification/plan-check.sh`.
     🔴 thì bổ sung Wiki cho đủ rồi chạy lại, tối đa 3 lần.
5. Trình bày kế hoạch cho người dùng duyệt:
   - Mỗi tính năng một dòng: `F1 · tên — điều quan trọng nhất trong Done when`
   - Phong cách: 3 tính từ + 5 màu + font + các asset sẽ dùng (một đoạn ngắn).
   - Các câu hỏi cho PO.
   - Kết quả plan-check (🟢/🔴).
   Kết thúc bằng: "Bạn là PO: muốn sửa gì cứ nói. Ổn rồi thì gõ **/build**."
6. Nếu người dùng muốn sửa: sửa trang tương ứng trong `1-wiki/features/`, rồi chạy `node 4-memory/features.mjs sync`.
   Không viết code game ở bước này.
