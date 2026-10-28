# Hướng dẫn nhanh — để AI tự build game của bạn

Bạn **không cần biết code**. Bạn viết ý tưởng, AI tự lên kế hoạch, tự code, tự kiểm tra.
Harness chỉ cho AI báo "xong" khi máy chơi thử và chấm đạt.

> Đã thử thật: game "Lật thẻ tìm cặp" (5 tính năng) build xong trong **khoảng 9 phút**, không gõ dòng code nào.

---

## Bước 0 · Cài đặt (một lần, ~10 phút)

| Cài | Kiểm tra trong Terminal |
|---|---|
| **Node.js 22** — https://nodejs.org (bản LTS) | `node -v` → ra `v22…` |
| **Google Chrome** | — |
| **Claude Code** — https://claude.com/claude-code | `claude --version` |
| **Windows:** cài thêm **Git Bash** (https://git-scm.com) và chạy mọi lệnh trong Git Bash | — |

Đăng nhập Claude Code một lần: gõ `claude`, làm theo hướng dẫn, rồi gõ `/exit`.

Giải nén `mini-harness.zip`, mở Terminal **trong thư mục `mini-harness`**.

Kiểm tra mọi thứ chạy được (khoảng 10 giây):

```bash
bash test.sh
```

Thấy `🟢 Automation test: ĐẠT` và trình duyệt mở báo cáo có ảnh là xong bước 0.

---

## Bước 1 · Bắt đầu game mới

```bash
bash new-game.sh
```

Game mẫu Parking Jam được cất vào `examples/` để bạn tham khảo.

## Bước 2 · Viết ý tưởng (đây là "prompt" của bạn)

Mở file **`1-wiki/raw/idea.md`** và điền. Ví dụ thật đã chạy thành công:

```markdown
**Tên game:** Lật thẻ tìm cặp
**Cho ai:** học sinh, người chơi casual, chơi 1–2 phút.
**Chơi thế nào:** Trên màn hình có 12 thẻ úp (6 cặp hình con vật, dùng emoji). Bấm một thẻ thì lật lên.
Lật 2 thẻ: nếu giống nhau thì 2 thẻ giữ ngửa; nếu khác thì sau một chút cả 2 úp lại. Ghép hết 6 cặp là thắng.
**Các tính năng muốn có:**
- Bàn 12 thẻ úp, xáo trộn mỗi lần chơi
- Bấm lật thẻ, lật 2 thẻ thì so cặp
- Đếm số lượt (mỗi lần lật 2 thẻ là 1 lượt)
- Thắng thì hiện "Bạn thắng!" kèm số lượt
- Nút "Chơi lại" xáo bài mới
```

**Mẹo viết ý tưởng tốt:**
- Nói rõ **người chơi làm gì** và **khi nào thắng/thua**.
- Mỗi tính năng **một dòng**, cái quan trọng nhất lên trước. 3–6 tính năng là vừa.
- Con số cụ thể ("12 thẻ", "3 mạng") tốt hơn chữ mơ hồ ("nhiều thẻ").
- Game nhỏ, chơi bằng bấm/chạm. Tránh game cần vật lý phức tạp hay nhiều người chơi online.

## Bước 3 · Để AI lên kế hoạch (~2–3 phút)

```bash
bash plan.sh
```

AI đọc ý tưởng và viết mỗi tính năng thành một trang trong `1-wiki/features/`, có mục **Done when** (thế nào là xong).
**Bạn là PO:** mở vài trang ra đọc. Chưa đúng ý thì sửa thẳng trong trang đó.

## Bước 4 · Để AI build (~2 phút mỗi tính năng)

```bash
bash build.sh
```

Bạn sẽ thấy từng vòng: AI viết test → code → máy chấm 🟢 hoặc 🔴 → đỏ thì AI tự sửa → tới khi xanh.

## Bước 5 · Chơi thử

```bash
node 2-environment/serve.mjs      # mở http://localhost:5173
bash test.sh                      # xem bot tự chơi, có ảnh từng bước
```

---

## Khi có chuyện

| Thấy gì | Làm gì |
|---|---|
| `❓ AI có câu hỏi cho bạn` | Mở `4-memory/po-questions.md`. Trả lời bằng cách sửa trang Wiki tương ứng, chạy lại `bash plan.sh` rồi `bash build.sh`. |
| `⛔ Dừng ở F3` | AI thử 3 lần chưa xanh. Đọc `4-memory/logs/F3-*`. Thường do ý tưởng chưa rõ: sửa trang `1-wiki/features/F3-….md` cho cụ thể hơn, rồi chạy `node 4-memory/features.mjs set F3 pending && bash build.sh`. |
| Báo giới hạn / rate limit của Claude | Cả lớp dùng chung tài khoản. Đợi vài phút rồi chạy lại `bash build.sh` — nó làm tiếp từ chỗ dừng. |
| `Không tìm thấy Chrome` | Cài Chrome, hoặc đặt đường dẫn: `export CHROME="/đường/dẫn/chrome"` |
| Muốn thêm tính năng sau khi xong | Tạo file mới trong `1-wiki/raw/` (ví dụ `them-am-thanh.md`), rồi `bash plan.sh` và `bash build.sh`. |

## Luật duy nhất cần nhớ

> **AI nói "xong" chưa phải là xong. Máy chấm 🟢 mới là xong.**

Muốn hiểu bên trong harness có gì? Đọc `README.md` và `README.md` trong từng thư mục `1-wiki/`, `2-environment/`, `3-verification/`, `4-memory/`.
