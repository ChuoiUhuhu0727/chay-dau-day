# ① WIKI — nguồn sự thật (cùng kiến trúc với Lecture 1)

```
1-wiki/
├── raw/            ← ý tưởng gốc bạn đưa vào. KHÔNG BAO GIỜ sửa.
├── overview.md     ← app/game là gì, cho ai
├── features/       ← mỗi tính năng một trang, có danh sách "Done when"
├── screens/        ← mỗi màn hình một trang
├── decisions/      ← lựa chọn quan trọng và vì sao
├── learned.md      ← Learned Wiki: bài học từ lần sai (harness tự ghi thêm)
├── index.md        ← mọi trang, liệt kê
└── log.md          ← mỗi thay đổi một dòng
```

- `plan.sh` đọc `raw/` → viết `features/`, `screens/`, `decisions/`, cập nhật `index.md` + `log.md`.
- `execute.sh` đọc trang feature → Model code; Verification chấm theo *Done when*.
- Muốn thêm tính năng? Thêm ghi chú vào `raw/`, chạy `bash plan.sh`.
