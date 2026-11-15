# Learned Wiki — bài học từ những lần sai

> Harness tự ghi thêm vào đây mỗi khi một tính năng thất bại quá số lần cho phép.
> AI đọc file này trước khi code để không lặp lại lỗi cũ.

- **Đừng sửa test cho xanh.** Nếu test đỏ, sửa code trong `game/`, không xoá hay nới lỏng assert.
- **Luật chơi phải nằm trong `logic.js`.** Lần trước đặt logic chặn xe trong `ui.js` nên `node --test` không bắt được lỗi.
- **Máy này: node chỉ có trong WSL (v20, thiếu WebSocket) nên bot không chạy.** Dùng Node 22 portable: `export PATH=/c/Users/Admin/.local/node22:$PATH` trước khi chạy verify.sh trong Git Bash.
- 2026-11-15 · Check F8 "người kèm chuyển động (lệch ≥ 2px sau 300ms)" đôi khi đỏ (1/4 lần) vì 2 lần đo rơi vào 2 điểm đối xứng của chu kỳ lắc → nên đo lệch lớn nhất qua nhiều mẫu (cần PO đồng ý vì là test của F8).
