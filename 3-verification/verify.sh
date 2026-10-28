#!/usr/bin/env bash
# VERIFICATION — cổng chấm đậu/rớt. Chỉ khi script này thoát mã 0 thì tính năng mới là XONG.
#   bash 3-verification/verify.sh F5
set -u
cd "$(dirname "$0")/.."
FID="${1:-}"
fail=0

echo "┌─ VERIFICATION ${FID:+· $FID}"
if [ -n "$FID" ]; then
  if [ -f "game/tests/$FID.test.js" ]; then
    echo "│ ✓ Có test cho $FID (game/tests/$FID.test.js)"
  else
    echo "│ ✗ Thiếu test game/tests/$FID.test.js — luật: viết test trước rồi mới code"
    fail=1
  fi
fi

echo "│"
echo "│ 1) Unit test luật chơi (node --test)"
if out=$(node --test --test-reporter=spec 'game/tests/*.test.js' 2>&1); then
  echo "$out" | grep -E '^ℹ (tests|pass|fail) ' | sed 's/^/│    /'
else
  echo "$out" | grep -E '✖|Error|expected|actual|^ℹ (tests|pass|fail) ' | head -25 | sed 's/^/│    /'
  fail=1
fi

echo "│"
echo "│ 2) Automation test (bot tự chơi game trong Chrome)"
bot=$(node 2-environment/bot.mjs --quiet 2>&1) || fail=1
echo "$bot" | sed 's/^/│    /'
if [ "$fail" != 0 ] && [ -f reports/latest/report.json ]; then
  node -e 'for (const c of JSON.parse(require("fs").readFileSync("reports/latest/report.json","utf8")).checks) if (!c.ok) console.log("│    ✗ " + c.name + (c.detail ? " — " + c.detail : ""))'
fi

echo "│"
if [ "$fail" = 0 ]; then echo "└─ 🟢 XANH — đạt"; else echo "└─ 🔴 ĐỎ — chưa đạt"; fi
exit "$fail"
