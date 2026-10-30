# Quyết định — Góc nhìn thứ nhất vẽ bằng Canvas 2D + phép chiếu phối cảnh tự viết

- PO chọn góc nhìn ngang tầm mắt (câu 2C). Repo **không có** Three.js trong `game/vendor/`, và không được thêm thư viện tuỳ ý.
- Sân là mặt phẳng, cầu thủ vẽ thành hình đứng (billboard) → chỉ cần phép chiếu pinhole: `project` / `unproject`
  là hàm thuần trong `logic.js`, test được bằng `node --test`. Vẫn là phối cảnh thật (xa nhỏ, có đường chân trời), không giả bằng CSS.
- Camera không xoay được ở bản đầu (tạm chọn): mỗi tình huống đặt sẵn hướng nhìn sao cho vùng đúng nằm trong khung.
  `logic.js` tự xoay nhẹ (±0.6 rad) quanh hướng gợi ý để thấy được nhiều cầu thủ nhất.
- Người ngoài tầm mắt (sau lưng/hai bên) được vẽ thành chấm màu ở mép khung kèm chữ "N ngoài tầm mắt" —
  nhìn bằng mắt thật thì cutter quay mặt về đĩa sẽ không thấy stack sau lưng; chấm mép giúp người mới nhớ là có người ở đó.
- Người kèm bạn (F8) đứng trước mặt 2–3m, lệch về phía ngược vùng đúng để không che chỗ cần chạm (bản đầu: chếch sau vai). Vạch mốc 5m / 10m / 15m trên cỏ giúp ước lượng khoảng cách.
- Khung `#field` vuông 1:1, đường chân trời ở 40% chiều cao (bản đầu 3:4 bị trống nửa dưới).
- Pha bóng chuyển động (F8, gộp từ F9 cũ): chỉ phần vẽ chạy theo thời gian; chấm điểm vẫn dùng camera đứng yên của tình huống, nên chỉ cho chạm ở pha `decide` (sau 2 giây vào pha). Vị trí theo thời gian là hàm thuần (`introPose`, `runPose`, `discArc`) để test được.
