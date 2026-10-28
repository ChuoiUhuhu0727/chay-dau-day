#!/usr/bin/env bash
# HARNESS EXECUTE — vòng lặp: Model code → Verification chấm → đỏ thì đưa lỗi cho Model sửa → lặp tới khi xanh.
#   bash harness/execute.sh          → làm tính năng "pending" kế tiếp
#   bash harness/execute.sh F6       → làm đúng F6
#   MAX_ATTEMPTS=5 bash harness/execute.sh
set -u
cd "$(dirname "$0")/.."
command -v claude >/dev/null || { echo "Cần cài Claude Code: https://claude.com/claude-code"; exit 1; }
MAX="${MAX_ATTEMPTS:-3}"
FID="${1:-$(node harness/lib/features.mjs next)}" || true
[ -n "$FID" ] || { echo "🎉 Không còn tính năng nào đang chờ."; node harness/lib/features.mjs list; exit 0; }
FEATURE=$(node harness/lib/features.mjs show "$FID") || exit 1
TITLE=$(node -e 'console.log(JSON.parse(process.argv[1]).title)' "$FEATURE")
mkdir -p memory/logs
today=$(date +%F)
feedback=""

for attempt in $(seq 1 "$MAX"); do
  node harness/lib/features.mjs attempt "$FID" >/dev/null
  echo
  echo "════════ VÒNG LẶP $attempt/$MAX · $FID · $TITLE ════════"
  echo "① Model đọc Wiki + Memory, rồi code bằng Tool Calling…"
  PROMPT="Làm tính năng $FID theo đúng luật trong CLAUDE.md.

Tính năng (từ memory/features.json):
$FEATURE

Trước khi code: đọc wiki/product.md và wiki/learned.md.
Viết test game/tests/$FID.test.js trước, chạy cho đỏ, rồi sửa game/ cho xanh.
Khi nghĩ đã xong, tự chạy: bash harness/verify.sh $FID
Trả lời cuối cùng bằng 2–3 dòng: đã sửa file nào, test nào."
  if [ -n "$feedback" ]; then
    PROMPT="$PROMPT

LẦN TRƯỚC VERIFICATION BÁO ĐỎ. Đây là lỗi, sửa đúng chỗ này:
$feedback"
  fi
  echo "$PROMPT" | claude -p \
      --permission-mode acceptEdits \
      --allowedTools "Read,Edit,Write,Glob,Grep,Bash(node:*),Bash(bash harness/verify.sh:*),Bash(./harness/verify.sh:*),Bash(bash ./harness/verify.sh:*)" \
      ${MODEL:+--model "$MODEL"} \
    | tee "memory/logs/$FID-$attempt-model.txt" | sed 's/^/   │ /'

  echo "② Verification chấm (harness tự chạy, không tin lời Model)…"
  if bash harness/verify.sh "$FID" > "memory/logs/$FID-$attempt-verify.txt" 2>&1; then
    sed 's/^/   /' "memory/logs/$FID-$attempt-verify.txt"
    node harness/lib/features.mjs set "$FID" passing
    echo "- $today · $FID ✅ passing sau $attempt vòng." >> memory/progress.md
    if git rev-parse --git-dir >/dev/null 2>&1; then
      git add -A >/dev/null && git commit -q -m "feat($FID): $TITLE" && echo "③ Đã lưu một commit cho $FID (lùi lại được nếu cần)."
    fi
    echo
    echo "🟢 $FID XONG — Verification xanh ở vòng $attempt."
    node harness/lib/features.mjs list
    exit 0
  fi
  sed 's/^/   /' "memory/logs/$FID-$attempt-verify.txt"
  feedback=$(tail -40 "memory/logs/$FID-$attempt-verify.txt")
  echo "🔴 Chưa đạt → đưa lỗi cụ thể quay lại cho Model."
done

node harness/lib/features.mjs set "$FID" blocked
echo "- $today · $FID ⛔ blocked sau $MAX vòng. Người cần vào xem memory/logs/$FID-*." >> memory/progress.md
lesson=$(printf 'Tính năng %s thất bại %s lần. Log lỗi cuối:\n%s\n\nViết MỘT dòng bài học tiếng Việt (bắt đầu bằng "- "), để lần sau không lặp lại lỗi này. Chỉ in dòng đó.' "$FID" "$MAX" "$feedback" \
  | claude -p --output-format text 2>/dev/null | grep -m1 '^- ' || echo "- $FID thất bại $MAX lần, xem memory/logs/$FID-*.")
echo "$lesson" >> wiki/learned.md
echo
echo "⛔ $FID bị chặn sau $MAX vòng. Đã ghi bài học vào wiki/learned.md:"
echo "   $lesson"
exit 1
