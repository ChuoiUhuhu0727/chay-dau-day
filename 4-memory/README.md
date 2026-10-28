# ④ MEMORY — sổ tay của harness

| File | Là gì |
|---|---|
| `features.json` | Danh sách tính năng + trạng thái: ⏳ pending · ✅ passing · ⛔ blocked. **Chỉ harness được sửa.** |
| `progress.md` | Nhật ký: làm tới đâu, mấy vòng. |
| `logs/` | Log từng vòng lặp (Model nói gì, Verification chấm gì). Tự sinh. |
| `features.mjs` | Lệnh đọc/ghi sổ: `node 4-memory/features.mjs list` |

Nhờ sổ tay nằm trên ổ đĩa, tắt máy mai mở lại vẫn biết đang ở đâu.
