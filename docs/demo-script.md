# Kịch bản video demo — Chạy Đâu Đây? (2:30)

Đề yêu cầu: video 2–3 phút về **luồng chính** của sản phẩm, có link trong README.
Người chấm nhìn vào 5 thứ: sản phẩm giải quyết vấn đề gì, chạy có mượt không, quy trình AI-native,
tracking và khả năng launch, đóng góp của nhóm. Video nên chạm đủ cả 5, mỗi thứ một đoạn ngắn.

Lời thoại viết bằng tiếng Anh vì README và người chấm dùng tiếng Anh. Nói tiếng Việt cũng được, khi đó thêm phụ đề tiếng Anh.

---

## Chuẩn bị (10 phút, trước khi bấm quay)

- [ ] **Điện thoại:** mở link trong **tab ẩn danh** (Safari Private / Chrome Incognito) để game coi như lần đầu → có nút "Chơi ngay · 30 giây tập chơi".
  Link: https://chuoiuhuhu0727.github.io/chay-dau-day/
- [ ] Bật **âm thanh** (tắt chế độ im lặng), bật **Không làm phiền**, pin > 30%, độ sáng màn cao.
- [ ] Quay màn hình điện thoại **có tiếng máy** (iPhone: giữ nút quay màn hình → bật Micro nếu muốn nói luôn).
- [ ] **Laptop:** mở sẵn 3 thứ để quay đoạn AI-native:
  1. Trang wiki `1-wiki/features/F12-de-hieu-cho-nguoi-moi.md` (có mục *Done when*).
  2. Terminal ở thư mục repo, gõ sẵn `bash 3-verification/verify.sh` (chưa Enter).
  3. Báo cáo bot `reports/latest/report.html` (chạy `bash test.sh` trước để có ảnh mới).
- [ ] Đọc "Đáp án nhanh" ở cuối file để đừng thua ngay trên video.

---

## Kịch bản

| Thời gian | Hình (quay gì) | Lời thoại (EN) |
|---|---|---|
| **0:00–0:12** · Mở đầu | Mặt người nói, hoặc cảnh sân frisbee thật / ảnh CLB. Chữ to: **"Where do I run?"** | "Every new Ultimate player hears the same thing: *get open!* But nobody tells you **where** open is." |
| **0:12–0:30** · Vấn đề + người dùng | Điện thoại: màn mở đầu. Chỉ vào dòng 🎯 Mục tiêu. | "This is *Chạy Đâu Đây?*, a mobile web game for beginners at Fulbright Ultimate Club, and for people who have never played. You see the field from your own eyes and tap where you'd run." |
| **0:30–0:42** · Luật trong 30 giây | Bấm **📖 Luật Ultimate**, lướt 6 dòng, bấm **Đã hiểu!** | "Never played? Here's Ultimate in six lines: the thrower can't run, so teammates must run into open space. That's exactly what the game trains." |
| **0:42–1:05** · Tập chơi 3 bước | Bấm **▶ Chơi ngay**. Tập 1: chạm vòng sáng → bắt đĩa. Tập 2: **cố tình chạm vòng có áo trắng** → "Thử lại", rồi chạm vòng trống. Tập 3: tự tìm chỗ trống. | "A 30-second tutorial teaches by doing, not reading. Tap the glowing ring… avoid the white shirt… now find the space yourself before ten seconds." |
| **1:05–1:45** · Một point thật (đoạn quan trọng nhất) | Bấm **Vào trận thật**. Cho thấy: đếm **3-2-1 → Chạm!**, chạm đúng → **vệt đĩa, quay chậm, "HAY!"**, dòng tường thuật 📣. Pha sau đúng tiếp → **"Tuyệt!" COMBO ×2**. Một pha **chạm sai** → tim vỡ 💔. Một pha **để stall tới 8–9** cho thấy viền đỏ + tiếng tích tắc, rồi chạm. | "Each point is five plays. Read it right and you get the catch, the slow-mo, and a combo. Read it wrong and you lose a life — and the answer shows you why, in plain words, with a top-down diagram. And like real Ultimate, you only have a ten-second stall." |
| **1:45–1:55** · Kết quả | Màn kết quả: **sao bật từng ngôi**, điểm chạy số, "Kỷ lục mới!", nút **Chơi lại**. | "Stars, points, a personal best — and one tap to play again." |
| **1:55–2:10** · Tracking + launch | Laptop: bảng **Tracking plan** trong README (cuộn nhanh). Có thể mở DevTools gõ `window.__events` cho thấy sự kiện vừa ghi. | "It's live on the open web today, no install. Twelve tracked events, like which play people miss most and whether they hit *play again*, are ready for Google Analytics, with no personal data." |
| **2:10–2:30** · AI-native | Laptop: trang wiki F12 có *Done when* → Enter `verify.sh` (tua nhanh) → **🟢 XANH** → lướt `report.html` (bot tự chơi, có ảnh). | "We built it AI-native with Claude Code inside a harness: we write the spec, Claude writes tests first, then code, and only this verify script can mark a feature done — it runs 73 unit tests and a bot that plays the whole game." |
| **2:30–2:40** · Kết + nhóm | Màn hình link + tên các thành viên, mỗi người một vai. | "Built by [tên thành viên]. Next: a Google Play version and real player data. Go get open!" |

Tổng ~2:40. Thiếu thời gian thì cắt đoạn 1:55–2:10 ngắn lại. Không bỏ đoạn 1:05–1:45.

---

## Mẹo quay

- **Quay từng đoạn rồi ghép**, không cần một lần ăn ngay. Quay điện thoại trước, laptop sau, rồi lồng tiếng.
- Đoạn chơi thật nên **chậm tay một nhịp** trước khi chạm, để người xem kịp nhìn sân.
- Muốn có pha chạm sai đẹp: chạm vào **cỏ ngay dưới chân**. Chỗ đó luôn sai.
- `verify.sh` chạy khoảng 1–2 phút: quay rồi **tua x8** ở bước chờ, giữ lại dòng cuối **🟢 XANH — đạt**.
- Xuất video 1080p, đưa lên YouTube (chế độ *Không công khai*) hoặc Google Drive (ai có link đều xem được).
  Dán link vào dòng 🎬 ở đầu `README.md`.

## Đáp án nhanh (vai Người chạy — "Chơi ngay" xong là vào vai này)

Mẹo chung: **chạy vào chỗ không có áo trắng, ở phía đĩa ném tới được.**

Vị trí dưới đây tính từ toạ độ thật trong game (vùng đúng rộng bán kính 4m, nên chạm gần đúng là được).
Vạch đứt "10m" và "15m" trên cỏ giúp ước lượng khoảng cách.

| Pha | Tình huống | Chạm vào đâu trên màn hình |
|---|---|---|
| 1 | Chạy ra chỗ trống | Ngay **vạch 10m**, lệch **trái** một chút (~4m) |
| 2 | Đừng đứng chắn đường | Ngay **vạch 10m**, lệch **phải** (~5m), về phía biên |
| 3 | Bị chặn gần? Chạy xa! | Ngay **vạch 15m**, lệch **phải** một chút (~3m) |
| 4 | Ghi điểm ở góc trống | Hơi **xa hơn vạch 10m**, lệch **phải** (~4m), trong vùng vàng |
| 5 | Lấp chỗ vừa trống | Ngay **vạch 10m**, lệch **trái** (~4m) |

Chạm sai cũng không sao: có 3 mạng, và đáp án hiện ngay sau đó, nên pha sai cũng là một đoạn đáng quay.
