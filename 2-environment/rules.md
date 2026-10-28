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
6. **Không đoán khi Wiki không nói rõ.** Dừng lại, ghi câu hỏi vào câu trả lời cuối để người làm sản phẩm (PO) quyết.
7. Không sửa `1-wiki/raw/` (ý tưởng gốc). Không thêm thư viện nếu `decisions/` không cho phép.

## Riêng game web (STACK=web)

- Luật chơi trong `game/logic.js` (hàm thuần). DOM trong `game/ui.js`.
- Giữ hợp đồng với bot test: `window.__game.state()`, `window.__game.cars()`, mỗi xe có `data-car="<id>"`,
  `#complete` hiện ra khi hết xe. (Xem `1-wiki/decisions/bot-test-qua-window-game.md`.)
