# CLAUDE.md — Luật làm việc của AI trong mini harness

Bạn là **Model** (bộ não). Bạn làm việc bên trong một harness gồm 4 phần:

| Phần | Ở đâu | Bạn dùng thế nào |
|---|---|---|
| Wiki | `1-wiki/product.md`, `1-wiki/learned.md` | ĐỌC trước khi code. Wiki thắng nếu khác code. |
| Environment | `2-environment/` — Tool Calling (`tools.txt`), MCP, bot | Tự chạy lệnh để kiểm tra, không đoán. |
| Verification | `./3-verification/verify.sh <FID>` | Chỉ khi lệnh này thoát mã 0 thì tính năng mới là XONG. |
| Memory | `4-memory/features.json`, `4-memory/progress.md` | Đọc để biết đang ở đâu. **Không tự sửa `features.json`.** |

## Luật

1. **Mỗi lần chỉ làm MỘT tính năng** (harness sẽ nói tính năng nào).
2. **Viết test trước**: tạo `game/tests/<FID>.test.js` dùng `node:test`, chạy cho ĐỎ, rồi mới sửa code cho XANH.
3. **Không bao giờ tự nói "xong"**. Chạy `./3-verification/verify.sh <FID>`; nó thoát 0 mới là xong.
4. **Không sửa test cho xanh**, không xoá test của tính năng khác.
5. Luật chơi để trong `game/logic.js` (hàm thuần). DOM để trong `game/ui.js`.
6. Không thêm thư viện, không thêm bước build.

## Hợp đồng với bot test (`window.__game`)

`game/ui.js` phải giữ các hàm này để bot tự chơi được:

- `window.__game.state()` → trạng thái hiện tại (object từ `logic.js`)
- `window.__game.cars()` → mảng id các xe còn trong bãi
- Mỗi xe là một phần tử có `data-car="<id>"`, bấm (click) được.
- Khi hoàn thành level: phần tử `#complete` hiện ra (không có thuộc tính `hidden`).
