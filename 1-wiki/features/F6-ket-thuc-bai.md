# F6 — Kết thúc bài: X/5, qua bài, chơi lại

**Trạng thái:** xem `4-memory/features.json` · **Màn hình:** [màn kết quả](../screens/man-ket-qua.md)

## Done when
- [ ] `isFinished(state)` = `true` khi đã trả lời tình huống thứ 5; `passed(state)` = `true` khi `score ≥ 4`, `false` khi `score ≤ 3`.
- [ ] Bot: trả lời đủ 5 tình huống (4 đúng, 1 sai) rồi bấm `#next` → `#screen-result` hiện, `#final-score` ghi `4/5`, `#verdict` có chữ `Qua bài`.
- [ ] Bot: chơi lại sai cả 5 → `#final-score` ghi `0/5`, `#verdict` có chữ `Chưa qua`.
- [ ] Bot: bấm `#retry` → về `#screen-start`; sau khi chọn vai thì `state().score` = 0 và `state().index` = 0.
