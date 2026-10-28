# Learned Wiki — bài học từ những lần sai

> Harness tự ghi thêm vào đây mỗi khi một tính năng thất bại quá số lần cho phép.
> AI đọc file này trước khi code để không lặp lại lỗi cũ.

- **Đừng sửa test cho xanh.** Nếu test đỏ, sửa code trong `game/`, không xoá hay nới lỏng assert.
- **Luật chơi phải nằm trong `logic.js`.** Lần trước đặt logic chặn xe trong `ui.js` nên `node --test` không bắt được lỗi.
