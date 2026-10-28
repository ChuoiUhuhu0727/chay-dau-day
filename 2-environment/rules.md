# Luật làm việc của AI trong mini harness

Bạn là **Model** (bộ não). Bạn làm việc bên trong một harness gồm 4 phần:

| Phần | Ở đâu | Bạn dùng thế nào |
|---|---|---|
| ① Wiki | `1-wiki/` — `features/` (mỗi tính năng một trang, có *Done when*), `screens/`, `decisions/`, `learned.md` | ĐỌC trước khi code. Wiki là sự thật: code khác Wiki thì code sai. |
| ② Environment | Tool Calling (quyền trong `.claude/settings.json`), MCP, bot trong `2-environment/` | Tự chạy lệnh để kiểm tra, không đoán. |
| ③ Verification | `bash 3-verification/verify.sh` | Chỉ lệnh này được chuyển 🟡 claimed → ✅ passing. |
| ④ Memory | `4-memory/features.json` (qua `node 4-memory/features.mjs`), `progress.md`, `1-wiki/log.md` | Đọc để biết đang ở đâu. **Không sửa tay `features.json`.** |

Loại dự án (web hay Android) nằm trong `harness.config`.

## Chế độ duy nhất: model_led

Harness không xếp việc cho bạn. **Bạn (Model) tự xếp và tự làm**, harness chỉ giữ sổ và chấm:

1. Xem việc: `node 4-memory/features.mjs brief`.
2. Tự xếp thứ tự: **phụ thuộc trước → quan trọng trước → theo số F**. Làm được nhiều tính năng liên tiếp trong một lượt.
3. Với mỗi tính năng: đọc trang `1-wiki/features/F<số>-*.md`, **viết test trước** cho từng dòng *Done when*, chạy cho ĐỎ,
   rồi code cho XANH. Xong thì `node 4-memory/features.mjs claim F<số>` (🟡 = đã làm, **chưa** chứng minh).
4. Báo tiến độ sau mỗi mốc: `node 4-memory/features.mjs note "F2 xong code, đang làm F3"`.
5. Chạy **Verification một lần** cho mọi tính năng đã claim: `bash 3-verification/verify.sh`.
   - 🟢 xanh → verify.sh tự chuyển chúng sang ✅ passing.
   - 🔴 đỏ → đọc lỗi, sửa đúng chỗ, chạy lại. **Tối đa 3 lần đỏ cho một tính năng**; quá 3 lần thì
     `node 4-memory/features.mjs block F<số> "lý do"` và ghi **một dòng bài học** vào `1-wiki/learned.md`.
6. **Lặp tới khi mọi tính năng ✅ hoặc ⛔ có lý do.** Không kết thúc bằng "chắc là xong".

## Luật

1. **Không bao giờ tự nói "xong"** và không tự đánh dấu passing. Chỉ verify.sh xanh mới là xong.
2. Test đặt ở:
   - web: `game/tests/<FID>.test.js` dùng `node:test`
   - android: file trong `src/test/` có tên chứa `<FID>`, ví dụ `F5DemLuotTest.kt` (JUnit)
3. **Không sửa test cho xanh**, không xoá test của tính năng khác.
4. **Không đoán khi Wiki không nói rõ.** Làm theo cách hợp lý nhất, và ghi một dòng `Câu hỏi cho PO: …`
   vào `4-memory/po-questions.md` để người làm sản phẩm (PO) quyết.
5. Không sửa `1-wiki/raw/` (ý tưởng gốc). Không thêm thư viện nếu `decisions/` không cho phép.
6. **Luôn trả lời bằng tiếng Việt**, ngắn, dễ hiểu với người không biết code.

## Riêng game web (STACK=web)

- Luật chơi trong `game/logic.js` (hàm thuần, test bằng `node --test`). DOM trong `game/ui.js`.
- `game/ui.js` luôn có `window.__game = { state: () => … }` để bot đọc được trạng thái.
- Bot tự chơi theo kịch bản `game/e2e.mjs` (hàm `play`). **Tính năng nào có giao diện thì thêm bước vào `e2e.mjs`**
  để bot bấm thử và `check(...)` đúng như *Done when* — không chỉ unit test.
- Trong `e2e.mjs`: gọi `shot('…')` sau mỗi bước quan trọng để báo cáo có ảnh cho người xem.
- Tên của mỗi `check(...)` phải nói đúng điều nó kiểm. Không nới điều kiện cho xanh (ví dụ ghi "6 lượt" mà chấp nhận 7).
- Mở game: `node 2-environment/serve.mjs` → http://localhost:5173
