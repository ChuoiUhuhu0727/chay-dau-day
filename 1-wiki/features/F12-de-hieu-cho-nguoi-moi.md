# F12 — Dễ hiểu cho người chưa từng chơi: chữ ngắn + tập chơi 3 bước

**Trạng thái:** xem `4-memory/features.json` · Ý gốc: [raw/idea-4.md](../raw/idea-4.md) ý 3 · **Màn hình:** [mở đầu](../screens/man-mo-dau.md), [chơi](../screens/man-choi.md)

PO (vịt): chữ hướng dẫn "khó hiểu, dài, nặng kỹ thuật" — người đã chơi rồi đọc vẫn không hiểu.
Ưu tiên **người chưa từng chơi frisbee**.

## Ý tưởng chính: cả game chỉ dạy MỘT luật

> **Chạy vào chỗ trống — nơi đồng đội ném đĩa tới bạn được.**

Mọi tình huống đều là một cách nhìn ra "chỗ trống". Thuật ngữ (cutter, stack, under, reset…) **không bao giờ
nằm trong câu hỏi**. Nó chỉ hiện sau khi trả lời, dạng nhãn nhỏ "Dân Ultimate gọi là: …". Người mới học bằng
mắt trước, học tên gọi sau.

## Giọng văn (áp cho mọi chữ trong game)
- Câu hỏi (`prompt`) ≤ 80 ký tự: **thấy gì → hỏi gì**. Ví dụ: "Áo trắng chặn bên phải. Bên trái đang trống — chạy đâu?"
- Tên tình huống (`title`) ≤ 32 ký tự, là một **mẹo dễ nhớ**: "Chạy ra chỗ trống", "Ném xong thì chạy!".
- Giải thích (`explain`) ≤ 110 ký tự, lời nói thường, trả lời "vì sao".
- Gọi người theo **màu áo** (người chơi thấy màu ngay): *đồng đội áo vàng*, *đối thủ áo trắng*, *người kèm bạn áo đỏ*.
  Không gọi theo vai (handler/cutter) trong câu hỏi.
- Không dùng các từ sau trong `prompt`, `title`, `explain`: stack, cutter, handler, under, deep, clear, reset, dump, swing,
  give-and-go, endzone, stall, force, mark. Từ chuyên môn chỉ để trong `term`.
- Vai ở màn mở đầu: **Người chạy** (Cutter) · **Người ném** (Handler). Tên tiếng Anh nhỏ bên dưới.

## Tập chơi 3 bước (tutorial học bằng tay, không bằng chữ)
Ngay trên sân thật, mỗi bước dạy đúng một điều, chữ ≤ 1 câu, có vòng sáng và bàn tay 👆 chỉ chỗ:

| Bước | Trên sân | Dạy điều gì | Chữ |
|---|---|---|---|
| 1 | Bạn + 1 đồng đội cầm đĩa phía trước, **một vòng sáng** trên cỏ trống, không có đối thủ | Chạm cỏ = chạy tới đó, đồng đội ném đĩa cho bạn | "Chạm vào vòng sáng để chạy tới đó!" |
| 2 | **Hai vòng sáng**, một vòng có đối thủ áo trắng đứng trong | Áo trắng đứng đâu thì chỗ đó bị chặn | "Áo trắng là đối thủ. Chạy tới vòng KHÔNG có ai!" |
| 3 | Không còn vòng sáng, đối thủ dồn một bên, **đồng hồ 10 giây chạy** | Tự tìm chỗ trống, và phải nhanh | "Tự tìm chỗ trống — trước khi hết 10 giây!" |

- Chạm sai trong lúc tập **không mất mạng**: sân lắc nhẹ, chữ "Chưa trống! Thử lại 👀", chạm lại được ngay.
  Hết 10 giây ở bước 3 thì đếm lại từ đầu, không phạt.
- Xong bước 3: "Bạn đã biết đọc sân! 🎉", nút `#next` **"Vào trận thật"** → vào point Người chạy luôn (không quay về menu).
- Đã tập xong thì nhớ trong máy (`localStorage` `cdd-tutorial-done`). Lần sau nút chính là "Chơi", và có nút `#how` "Cách chơi" để tập lại.

## Màn mở đầu
- Nút chính to `#play`: chưa tập → **"▶ Chơi ngay"** + dòng nhỏ "30 giây tập chơi"; đã tập → **"▶ Chơi"** (vào vai chơi lần trước, mặc định Người chạy).
- Dưới đó: "Hoặc chọn vai" + hai nút vai (`#role-cutter`, `#role-handler`) — bấm là vào trận ngay, không qua phần tập.
- Tagline 1 dòng: "Đọc sân như dân Ultimate — chạm vào chỗ trống!"

## Trong trận
- HUD hiện tên vai dễ hiểu ("Người chạy"). Đồng đội đang cầm đĩa có nhãn nhỏ **"ĐĨA"** trên đầu — người mới luôn biết đĩa ở đâu.
- Gợi ý đáy `#hint`: "👆 Chạm vào cỏ chỗ bạn muốn chạy tới".
- Ở màn chơi có nút `#home` (góc trái HUD) để về màn mở đầu.

## Tracking (thêm vào F11)
- `tutorial_step` `{ step, tries }` — mỗi bước tập xong; `tries` = số lần chạm sai trước khi đúng. Bước nào nhiều `tries` → bước đó khó hiểu.
- `tutorial_done` `{ ms }` — tập xong 3 bước, tổng thời gian. Phễu `tutorial_step 1 → tutorial_done → point_start`.

## Done when
- [ ] Mọi tình huống trong `SCENARIOS`: `title` ≤ 32 ký tự, `prompt` ≤ 80 ký tự, `explain` ≤ 110 ký tự, có `term` không rỗng; `title`, `prompt`, `explain` không chứa từ nào trong `JARGON` (không phân biệt hoa thường, so nguyên từ).
- [ ] `TUTORIAL` có đúng 3 bước: bước 1 có 1 đồng đội, 0 đối thủ, `rings` = [vùng đúng]; bước 2 có 2 `rings`, một vòng có đối thủ đứng trong (≤ 1m tới tâm) và vòng đó **không** phải vùng đúng; bước 3 không có `rings`, `stall` = true, mọi đối thủ cách tâm vùng đúng ≥ 6m.
- [ ] `startTutorial()` → `role` = `tutorial`, `index` = 0, `total` = 3, `current()` trả về `TUTORIAL[index]`; tâm vùng đúng mỗi bước nằm trước mặt và trong khung 360×480.
- [ ] Trong lúc tập: `answer` chạm sai → `answered` = false, `lives` giữ nguyên, `misses` +1, `tap` = chỗ chạm; chạm đúng → `answered` = true, `correct` = true. `stallOut` → `answered` = false, `misses` +1. `isFinished` = true khi đã trả lời đúng bước 3.
- [ ] Bot: lần đầu mở trang, nút `#play` hiện, cao ≥ 48px, có chữ "Chơi ngay"; `#role-cutter` có chữ "Người chạy", `#role-handler` có chữ "Người ném".
- [ ] Bot: bấm `#play` → `state().role` = `tutorial`, `#prompt` ≤ 80 ký tự; bước 1 chạm vùng đúng → `#feedback` có "Bắt được"; bấm `#next` sang bước 2.
- [ ] Bot: bước 2 chạm vào vòng có đối thủ → `#feedback` có "Thử lại", `state().answered` = false, `lives` không đổi; chạm vùng đúng → đúng.
- [ ] Bot: bước 3 chạm đúng → `#next` có chữ "Vào trận"; bấm → `state().role` = `cutter`, `index` = 0; `localStorage['cdd-tutorial-done']` = `1`; `window.__events` có `tutorial_step` (3 lần, bước 2 có `tries` = 1) và `tutorial_done`.
- [ ] Bot: ở màn chơi có nút `#home` ≥ 40px; bấm → về `#screen-start`; lúc này `#play` không còn chữ "Chơi ngay" và nút `#how` hiện.
