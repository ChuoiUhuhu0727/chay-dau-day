# Hướng dẫn nhanh — chat với Claude để build game của bạn

Bạn **không cần biết code** và **không cần gõ lệnh**. Bạn nói ý tưởng, AI tự lên kế hoạch, tự code, tự kiểm tra.
Harness chỉ cho AI báo "xong" khi máy chơi thử và chấm đạt.

---

## 1 · Cài đặt (một lần)

1. **Claude Desktop** — https://claude.ai/download (đăng nhập tài khoản lớp)
2. **Node.js 22** — https://nodejs.org (bản LTS)
3. **Google Chrome**

## 2 · Mở dự án trong Claude Desktop

1. Giải nén `mini-harness.zip` (ví dụ vào **Downloads**).
2. Mở Claude Desktop → tab **Code** (biểu tượng `</>` góc trên).
3. Dưới ô chat bấm **Choose…** → **Open folder…** → chọn thư mục `mini-harness` → **Open**.
4. Khi hỏi *"Trust this workspace?"* → bấm **Trust workspace**. (Bước này cho phép AI chạy harness.)

Thấy chữ **mini-harness** dưới ô chat là sẵn sàng. Gõ `/` để thấy các lệnh `game`, `build`, `play`.

> Dùng Terminal thay Desktop? Mở Terminal trong thư mục, gõ `claude`, chọn **Yes, I trust this folder**. Các lệnh giống hệt.

## 3 · `/game` — nói ý tưởng

Gõ `/game` rồi mô tả game. Ví dụ đã chạy thật:

```
/game Đập chuột chũi: bàn 3x3 lỗ, mỗi giây một con chuột chũi hiện ở một lỗ ngẫu nhiên,
bấm trúng được 1 điểm, ván chơi 30 giây, hết giờ hiện Hết giờ kèm điểm, có nút Chơi lại
```

Khoảng 3 phút sau, Claude đưa **kế hoạch** (mỗi tính năng một dòng) và **câu hỏi cho bạn**.
Bạn là người làm sản phẩm (PO): muốn đổi gì cứ chat, ví dụ *"bấm trượt thì trừ 1 điểm"*.

**Ý tưởng còn sơ sài cũng được**, ví dụ `/game làm game nuôi thú cưng`. Claude sẽ hỏi lại tối đa 5 câu trắc nghiệm có gợi ý; trả lời kiểu `1A 2C 3B` (thêm ý riêng nếu muốn) hoặc gõ `ok`.

**Mẹo:** nói rõ *người chơi làm gì* và *khi nào thắng/thua*; dùng số cụ thể ("12 thẻ", "3 mạng");
game chơi bằng bấm/chạm, không cần online.
**Muốn đẹp?** Thêm vài chữ về cảm xúc và hình: *"phong cách vui nhộn, màu kẹo ngọt, nhân vật là con mèo"*. AI tự chọn màu, font, hình miễn phí (xem `1-wiki/design/`). Chơi thử thấy chưa đẹp thì chat: *"nút to hơn, thêm hiệu ứng khi thắng"*.

## 4 · `/build` — để AI làm

Gõ `/build`. Claude **tự xếp thứ tự** và làm các tính năng (khoảng 5 phút cho game 6 tính năng), rồi báo:

```
Đã làm F1–F6 🟡 · chạy verify.sh → 🟢 xanh · F1–F6 ✅ passing
```

- 🟡 = AI nói "đã làm" — **chưa** tính là xong.
- ✅ = máy (verify.sh) đã chơi thử và chấm đạt — **mới** là xong. AI không tự đánh ✅ được.
- 🔴 = máy chấm chưa đạt → AI tự sửa rồi chấm lại.

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
| Claude hỏi xin quyền chạy lệnh | Bạn chưa bấm *Trust workspace*. Mở phiên mới, chọn lại thư mục và bấm **Trust**. |

## Luật duy nhất cần nhớ

> **AI nói "xong" chưa phải là xong. Máy chấm 🟢 mới là xong.**

*Muốn xem bên trong harness có gì: đọc `README.md`.*
