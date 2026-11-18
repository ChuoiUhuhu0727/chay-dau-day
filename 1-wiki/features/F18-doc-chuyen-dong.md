# F18 — Đọc chuyển động: chỗ trống *sắp* mở ra

**Trạng thái:** xem `4-memory/features.json` · Ý gốc: [raw/idea-7.md](../raw/idea-7.md) ý 2 · Cần: F17

PO (vịt): "không chỉ có mình di chuyển mà đồng đội và đội bạn cũng di chuyển nữa, và **detect được sự di chuyển ấy và
biết chỗ tiếp theo mình cần đứng ở đâu, cần cắt về đâu** cũng siêu quan trọng".

Hiện tại (F8) mọi người chỉ đung đưa tại chỗ khi bạn nghĩ — chuyển động không mang ý nghĩa. F18 làm chuyển động **là
manh mối**: trong lúc stall đếm, một đồng đội cắt đi, áo trắng đuổi theo, và chỗ trống **mở ra dần**. Người đọc được
chuyển động sẽ chạm vào chỗ *sắp* trống, không phải chỗ đang trống.

## Cách làm
- Mỗi tình huống có thể có `motion`: danh sách người di chuyển trong pha `decide`, mỗi người `{who, to, start, dur}`
  (giây tính từ lúc bắt đầu `decide`). Vị trí lúc t: `posAt(scenario, who, t)` (hàm thuần, chuyển mượt).
- Vùng đúng tính theo **lúc đĩa tới** (khi bạn chạm), không phải lúc bắt đầu. Ví dụ C5: lúc đầu chỗ đó có áo trắng,
  sau 2 giây áo trắng đuổi theo đồng đội → chỗ đó trống.
- Trên sân: người đang chạy có **vệt mờ phía sau** (thấy hướng chạy). F17 thêm cue `follow`: mũi tên trắng nhỏ chỉ
  "áo trắng đuổi theo" để giải thích *vì sao* chỗ đó trống.
- Chạm **quá sớm** vào chỗ chưa trống = sai, kèm `why` "Chờ chút: áo trắng còn đứng đó".

## Done when
- [ ] Ít nhất 5/10 tình huống có `motion` không rỗng; `posAt` ở t = 0 bằng vị trí ban đầu, ở t ≥ start + dur bằng `to`, ở giữa thì nằm giữa (không vượt quá).
- [ ] Tình huống có `motion`: `judgeAt(scenario, tap, t)` — chạm vào vùng đúng khi chỗ đó **chưa** trống (áo trắng trong vùng, t nhỏ) → sai; cùng chỗ đó sau khi trống → đúng.
- [ ] Bot: ở một tình huống có `motion`, vị trí trên màn hình của người di chuyển lệch ≥ 30px giữa đầu `decide` và 2.5 giây sau.
- [ ] Bot: tấm đáp án của tình huống đó có cue `follow` được vẽ (`state().cuesDrawn` có `follow`).
