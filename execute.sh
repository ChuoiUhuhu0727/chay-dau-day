#!/usr/bin/env bash
# HARNESS EXECUTE — vòng lặp: Model code → Verification chấm → đỏ thì đưa lỗi cho Model sửa → lặp tới khi xanh.
#   bash execute.sh          → làm tính năng "pending" kế tiếp
#   bash execute.sh F6       → làm đúng F6
#   MAX_ATTEMPTS=5 bash execute.sh
set -u
cd "$(dirname "$0")"
command -v claude >/dev/null || { echo "Cần cài Claude Code: https://claude.com/claude-code"; exit 1; }
MAX="${MAX_ATTEMPTS:-3}"
FID="${1:-$(node 4-memory/features.mjs next)}" || true
[ -n "$FID" ] || { echo "🎉 Không còn tính năng nào đang chờ."; node 4-memory/features.mjs list; exit 0; }
FEATURE=$(node 4-memory/features.mjs show "$FID") || exit 1
TITLE=$(node -e 'console.log(JSON.parse(process.argv[1]).title)' "$FEATURE")
PAGE=$(node -e 'console.log(JSON.parse(process.argv[1]).page)' "$FEATURE")
source ./harness.config
# ② Environment: danh sách công cụ AI được phép gọi (Tool Calling)
TOOLS=$(grep -v '^#' 2-environment/tools.txt | grep -v '^$' | paste -sd, -)
mkdir -p 4-memory/logs
today=$(date +%F)
feedback=""

for attempt in $(seq 1 "$MAX"); do
  node 4-memory/features.mjs attempt "$FID" >/dev/null
  echo
  echo "════════ VÒNG LẶP $attempt/$MAX · $FID · $TITLE ════════"
  echo "① Model đọc Wiki + Memory, rồi code bằng Tool Calling…"
  PROMPT="Làm tính năng $FID theo đúng luật trong 2-environment/rules.md (loại dự án: $STACK, thư mục: $APP_DIR).

Tính năng (từ 4-memory/features.json):
$FEATURE

Trước khi code: đọc trang Wiki $PAGE, 1-wiki/learned.md và các trang screens/ decisions/ liên quan.
Viết test cho từng dòng Done when trước, chạy cho đỏ, rồi sửa code cho xanh.
Khi nghĩ đã xong, tự chạy: bash 3-verification/verify.sh $FID
Trả lời cuối cùng bằng 2–3 dòng: đã sửa file nào, test nào. Nếu Wiki không rõ, ghi câu hỏi cho PO."
  if [ -n "$feedback" ]; then
    PROMPT="$PROMPT

LẦN TRƯỚC VERIFICATION BÁO ĐỎ. Đây là lỗi, sửa đúng chỗ này:
$feedback"
  fi
  echo "$PROMPT" | claude -p \
      --permission-mode acceptEdits \
      --allowedTools "$TOOLS" \
      ${MODEL:+--model "$MODEL"} \
    | tee "4-memory/logs/$FID-$attempt-model.txt" | sed 's/^/   │ /'

  echo "② Verification chấm (harness tự chạy, không tin lời Model)…"
  if bash 3-verification/verify.sh "$FID" > "4-memory/logs/$FID-$attempt-verify.txt" 2>&1; then
    sed 's/^/   /' "4-memory/logs/$FID-$attempt-verify.txt"
    node 4-memory/features.mjs set "$FID" passing
    echo "- $today · $FID ✅ passing sau $attempt vòng." >> 4-memory/progress.md
    echo "- $today · build · $FID ✅ passing ($TITLE)" >> 1-wiki/log.md
    if git rev-parse --git-dir >/dev/null 2>&1; then
      git add -A >/dev/null && git commit -q -m "feat($FID): $TITLE" && echo "③ Đã lưu một commit cho $FID (lùi lại được nếu cần)."
    fi
    echo
    echo "🟢 $FID XONG — Verification xanh ở vòng $attempt."
    node 4-memory/features.mjs list
    exit 0
  fi
  sed 's/^/   /' "4-memory/logs/$FID-$attempt-verify.txt"
  feedback=$(tail -40 "4-memory/logs/$FID-$attempt-verify.txt")
  echo "🔴 Chưa đạt → đưa lỗi cụ thể quay lại cho Model."
done

node 4-memory/features.mjs set "$FID" blocked
echo "- $today · $FID ⛔ blocked sau $MAX vòng. Người cần vào xem 4-memory/logs/$FID-*." >> 4-memory/progress.md
lesson=$(printf 'Tính năng %s thất bại %s lần. Log lỗi cuối:\n%s\n\nViết MỘT dòng bài học tiếng Việt (bắt đầu bằng "- "), để lần sau không lặp lại lỗi này. Chỉ in dòng đó.' "$FID" "$MAX" "$feedback" \
  | claude -p --output-format text 2>/dev/null | grep -m1 '^- ' || echo "- $FID thất bại $MAX lần, xem 4-memory/logs/$FID-*.")
echo "$lesson" >> 1-wiki/learned.md
echo
echo "⛔ $FID bị chặn sau $MAX vòng. Đã ghi bài học vào 1-wiki/learned.md:"
echo "   $lesson"
exit 1
