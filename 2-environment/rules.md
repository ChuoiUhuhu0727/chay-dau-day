# Luật làm việc của AI trong mini harness

Bạn là **Model** (bộ não). Bạn làm việc bên trong một harness gồm 4 phần:

| Phần | Ở đâu | Bạn dùng thế nào |
|---|---|---|
| ① Wiki | `1-wiki/` — `features/` (mỗi tính năng một trang, có *Done when*), `screens/`, `decisions/`, `learned.md` | ĐỌC trước khi code. Wiki là sự thật: code khác Wiki thì code sai. |
| ② Environment | `2-environment/` — Tool Calling (`tools.txt`), MCP, bot | Tự chạy lệnh để kiểm tra, không đoán. |
| ③ Verification | `bash 3-verification/verify.sh <FID>` | Chỉ khi lệnh này thoát mã 0 thì tính năng mới là XONG. |
| ④ Memory | `4-memory/features.json`, `4-memory/progress.md`, `1-wiki/log.md` | Đọc để biết đang ở đâu. **Không tự sửa `features.json`.** |

Loại dự án (web hay Android) nằm trong `harness.config`.

## Luật

1. **Mỗi lần chỉ làm MỘT tính năng** (harness sẽ nói tính năng nào).
2. **Đọc trang feature trước**: `1-wiki/features/F<số>-*.md`. Mỗi dòng *Done when* phải có ít nhất một test.
3. **Viết test trước**, chạy cho ĐỎ, rồi mới sửa code cho XANH.
   - web: `game/tests/<FID>.test.js` dùng `node:test`
   - android: file test trong `src/test/` có tên chứa `<FID>`, ví dụ `F5DemLuotTest.kt` (JUnit)
4. **Không bao giờ tự nói "xong"**. Chạy `bash 3-verification/verify.sh <FID>`; nó thoát 0 mới là xong.
5. **Không sửa test cho xanh**, không xoá test của tính năng khác.
6. **Không đoán khi Wiki không nói rõ.** Làm theo cách hợp lý nhất, và ghi một dòng bắt đầu bằng `Câu hỏi cho PO:` trong câu trả lời cuối để người làm sản phẩm (PO) quyết.
8. **Luôn trả lời bằng tiếng Việt.**
7. Không sửa `1-wiki/raw/` (ý tưởng gốc). Không thêm thư viện nếu `decisions/` không cho phép.

## Riêng game web (STACK=web)

- Luật chơi trong `game/logic.js` (hàm thuần, test bằng `node --test`). DOM trong `game/ui.js`.
- `game/ui.js` luôn có `window.__game = { state: () => … }` để bot đọc được trạng thái.
- Bot tự chơi theo kịch bản `game/e2e.mjs` (hàm `play`). **Tính năng nào có giao diện thì thêm bước vào `e2e.mjs`**
  để bot bấm thử và `check(...)` đúng như *Done when* — không chỉ unit test.
- Trong `e2e.mjs`: gọi `shot('…')` sau mỗi bước quan trọng để báo cáo có ảnh cho người xem.
- Tên của mỗi `check(...)` phải nói đúng điều nó kiểm. Không nới điều kiện cho xanh (ví dụ ghi "6 lượt" mà chấp nhận 7).
- Mở game: `node 2-environment/serve.mjs` → http://localhost:5173
