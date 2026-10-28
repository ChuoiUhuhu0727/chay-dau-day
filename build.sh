#!/usr/bin/env bash
# BUILD — chạy execute.sh lần lượt cho mọi tính năng ⏳ tới khi hết, hoặc dừng khi có tính năng ⛔ bị chặn.
#   bash build.sh
set -u
cd "$(dirname "$0")"
while FID=$(node 4-memory/features.mjs next); do
  if ! bash execute.sh "$FID"; then
    echo
    echo "⛔ Dừng ở $FID. Đọc 4-memory/logs/$FID-*.txt và câu hỏi cho PO, sửa Wiki cho rõ, rồi:"
    echo "   node 4-memory/features.mjs set $FID pending && bash build.sh"
    exit 1
  fi
done
echo
echo "🎉 Xong hết. Mở game: node 2-environment/serve.mjs  ·  Xem bot chơi: bash test.sh"
if [ -s 4-memory/po-questions.md ]; then
  echo
  echo "❓ AI có câu hỏi cho bạn (PO) — xem 4-memory/po-questions.md, trả lời bằng cách sửa trang Wiki rồi chạy lại."
fi
node 4-memory/features.mjs list
