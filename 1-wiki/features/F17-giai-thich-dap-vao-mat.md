# F17 — Giải thích "đập vào mắt": chữ to + mũi tên vẽ ngay trên sân

**Trạng thái:** xem `4-memory/features.json` · Ý gốc: [raw/idea-7.md](../raw/idea-7.md) ý 1 · **Màn hình:** [chơi](../screens/man-choi.md)

PO (vịt): giải thích "chưa có điểm nhấn", "chưa nói được intuition **tại sao** phải chạy vào chỗ đó", bảng giải thích
"chỉn chu nhưng khó hình dung". Muốn nó **đập vào mắt như chữ "Chạm!"**, có **mũi tên** và hiệu ứng.

## Nguyên tắc
- **Nhìn trước, đọc sau.** Sau khi chạm, người chơi *thấy* lý do ngay trên sân góc nhìn thứ nhất (chỗ họ vừa nhìn),
  không phải đọc một đoạn văn ở tấm dưới.
- **Một câu chốt to** (`hook`, ≤ 18 ký tự) như chữ "Chạm!": ví dụ "Chỗ này trống!", "Đừng đứng chắn!".
- **Một câu "tại sao"** (`why`, ≤ 70 ký tự) nói **trực giác**, theo giọng vịt (xem *Văn phong* dưới).
- Văn phong lấy từ vịt. **Claude không tự bịa giọng**: chưa có câu của vịt thì giữ chữ cũ.

## Hình trên sân (dữ liệu `cues` của mỗi tình huống, hàm thuần)
Mỗi tình huống có danh sách `cues`, vẽ lần lượt (cách nhau ~0.4 giây) ngay sau khi chạm:
- `block` — **✕ đỏ** trên người áo trắng / đường chuyền bị chặn, chữ nhỏ "bị chặn".
- `space` — **vùng xanh nhấp nháy** + chữ "TRỐNG!" ở chỗ đúng.
- `arrow` — **mũi tên vàng chạy trên cỏ** từ chân bạn tới chỗ trống (nét đứt chảy theo hướng chạy).
- `throw` — **đường cong** từ người cầm đĩa tới chỗ trống (đường đĩa sẽ bay).
Tấm đáp án ngắn lại: `hook` to + `why` + mini-map (mini-map vẽ cùng mũi tên). Từ chuyên môn (`term`) vẫn để cuối.

## Văn phong (chờ vịt gửi — xem `4-memory/po-questions.md`)
- [ ] Vịt gửi cách vịt giải thích ít nhất 3 tình huống + "trước khi cắt mình nhìn gì".
- Claude chắt lọc thành `hook` / `why` cho cả 10 tình huống, giữ luật F12 (không từ chuyên môn, gọi người theo màu áo).

## Done when
- [ ] Cả 10 tình huống có `hook` (1–18 ký tự) và `why` (≤ 70 ký tự); cả hai không chứa từ trong `JARGON`.
- [ ] Cả 10 tình huống có `cues` ≥ 3, trong đó có đúng 1 `arrow` đi từ vị trí của bạn (`me`) tới tâm vùng đúng, ít nhất 1 `space` nằm trong vùng đúng, và ít nhất 1 `block` hoặc `throw`.
- [ ] `cueTimes(cues)` trả thời điểm xuất hiện tăng dần, cách nhau ≥ 0.3 giây; cue cuối xuất hiện trước 2 giây.
- [ ] Bot: chạm (đúng hoặc sai) ở C1 → trong 2 giây `#hook` hiện, chữ cao ≥ 28px, nội dung đúng `hook` của C1; `state().cuesDrawn` ≥ 3, mũi tên nằm trong màn hình.
- [ ] Bot: tấm đáp án có `hook` và `why`; tổng chữ trong tấm (trừ `term`) ≤ 120 ký tự.
- [ ] Bot: chụp ảnh lúc mũi tên + ✕ đang hiện để PO duyệt bằng mắt.
