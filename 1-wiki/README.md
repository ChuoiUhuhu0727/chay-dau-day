# ① WIKI — nguồn sự thật (cùng kiến trúc với Lecture 1)

```
1-wiki/
├── raw/            ← ý tưởng gốc bạn đưa vào. KHÔNG BAO GIỜ sửa.
├── overview.md     ← app/game là gì, cho ai
├── features/       ← mỗi tính năng một trang, có danh sách "Done when"
├── screens/        ← mỗi màn hình một trang
├── decisions/      ← lựa chọn quan trọng và vì sao
├── design/         ← cách làm đẹp: README (nguyên tắc), assets (nguồn miễn phí), style.md (của game này), credits
├── learned.md      ← Learned Wiki: bài học từ lần sai (harness tự ghi thêm)
├── index.md        ← mọi trang, liệt kê
└── log.md          ← mỗi thay đổi một dòng
```

- `/game` (Harness Plan): Model đọc `raw/` → viết `features/`, `screens/`, `decisions/`, cập nhật `index.md` + `log.md`.
- `/build`: Model đọc trang feature → code; Verification chấm theo *Done when*.
- Muốn thêm tính năng? Chat ý tưởng với Claude; nó ghi vào `raw/` và viết trang mới.
