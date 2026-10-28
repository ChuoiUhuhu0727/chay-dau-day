# Hướng dẫn nhanh — chat với Claude để build game của bạn

Bạn **không cần biết code** và **không cần gõ lệnh**. Bạn nói ý tưởng, AI tự lên kế hoạch, tự code, tự kiểm tra.
Harness chỉ cho AI báo "xong" khi máy chơi thử và chấm đạt.

---

## 1 · Cài đặt (một lần)

1. **Node.js 22** — https://nodejs.org (tải bản LTS, cài như phần mềm bình thường)
2. **Google Chrome**
3. **Claude Code** — https://claude.com/claude-code
4. *(Chỉ Windows)* **Git Bash** — https://git-scm.com

## 2 · Mở dự án

1. Giải nén `mini-harness.zip`.
2. Mở Terminal **trong thư mục `mini-harness`** (macOS: chuột phải thư mục → *New Terminal at Folder*;
   Windows: chuột phải → *Open Git Bash here*).
3. Gõ `claude` rồi Enter.
4. Khi hỏi *"Do you trust the files in this folder?"* → chọn **Yes**. (Bước này cho phép AI chạy harness.)

Từ đây chỉ **chat**. Có 3 lệnh:

## 3 · `/game` — nói ý tưởng

Gõ `/game` rồi mô tả game. Ví dụ đã chạy thật:

```
/game Đoán số: máy nghĩ một số từ 1 đến 100, người chơi nhập số và bấm Đoán,
máy báo Cao quá hoặc Thấp quá, đoán đúng thì hiện Đúng rồi kèm số lần đoán, có nút Chơi lại
```

Khoảng 3 phút sau, Claude đưa **kế hoạch** (mỗi tính năng một dòng) và **câu hỏi cho bạn**.
Bạn là người làm sản phẩm (PO): muốn đổi gì cứ chat, ví dụ *"đoán quá 10 lần thì thua"*.

**Mẹo:** nói rõ *người chơi làm gì* và *khi nào thắng/thua*; dùng số cụ thể ("12 thẻ", "3 mạng");
game chơi bằng bấm/chạm, không cần online.

## 4 · `/build` — để AI làm

Gõ `/build`. Claude làm lần lượt từng tính năng (2–4 phút mỗi cái) và báo:

```
F1 · Số bí mật từ 1 đến 100 — 🟢 xanh ở vòng 1
F2 · Ô nhập số và nút Đoán — 🔴→🟢 xanh ở vòng 2
…
```

🔴 nghĩa là máy chấm chưa đạt → AI tự sửa. Chỉ 🟢 mới là xong.

## 5 · `/play` — chơi thử

Gõ `/play`. Trình duyệt mở game cho bạn chơi, và một báo cáo có ảnh bot tự chơi.
Muốn thêm tính năng? Cứ chat ý tưởng mới, rồi `/build` lại.

---

## Khi có chuyện

| Thấy gì | Làm gì |
|---|---|
| Claude hỏi lại | Trả lời bằng lời bình thường. |
| ⛔ dừng ở một tính năng | Claude sẽ giải thích lý do. Nói rõ hơn bạn muốn gì, rồi gõ `/build` tiếp. |
| Báo giới hạn / rate limit | Cả lớp dùng chung tài khoản. Đợi vài phút rồi gõ `/build` — nó làm tiếp từ chỗ dừng. |
| Claude hỏi xin quyền chạy lệnh | Bạn chưa chọn *Yes* ở bước Trust. Gõ `/exit`, mở lại `claude` và chọn **Yes**. |

## Luật duy nhất cần nhớ

> **AI nói "xong" chưa phải là xong. Máy chấm 🟢 mới là xong.**

*Muốn xem bên trong harness có gì: đọc `README.md`.*
