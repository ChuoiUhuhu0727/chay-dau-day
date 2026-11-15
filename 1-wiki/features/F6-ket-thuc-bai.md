# F6 — Kết thúc bài: X/5, qua bài, chơi lại

**Trạng thái:** xem `4-memory/features.json` · **Màn hình:** [màn kết quả](../screens/man-ket-qua.md)

> 2026-11-15 · PO đổi luật kết thúc theo [F10 — point liên tục](F10-point-lien-tuc.md): có 2 mạng, sai 2 lần là **Turnover** (kết thúc sớm).
> Ngưỡng qua bài **không đổi**: sống sót hết 5 pha ⇔ đúng ≥ 4/5. Bản cũ: luôn chơi đủ 5 tình huống, `passed` = `score ≥ 4`.

## Done when
- [ ] `isFinished(state)` = `true` khi đã trả lời tình huống thứ 5 hoặc khi hết mạng; `passed(state)` = `true` khi kết thúc với 4/5 hoặc 5/5 đúng, `false` khi sai 2 lần (turnover).
- [ ] Bot: trả lời đủ 5 tình huống (4 đúng, 1 sai) rồi bấm `#next` → `#screen-result` hiện, `#final-score` ghi `4/5`, `#verdict` có chữ `Qua bài`.
- [ ] Bot: chơi lại, sai 2 lần đầu (một lần để hết đếm stall, một lần chạm sai) → turnover: `#final-score` ghi `0/5`, `#verdict` có chữ `Chưa qua`.
- [ ] Bot: bấm `#retry` → về `#screen-start`; sau khi chọn vai thì `state().score` = 0 và `state().index` = 0.
