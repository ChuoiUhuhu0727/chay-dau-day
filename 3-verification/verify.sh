#!/usr/bin/env bash
# ③ VERIFICATION — giám khảo chấm đậu/rớt. Chỉ khi script này thoát mã 0 thì tính năng mới là XONG.
#   bash 3-verification/verify.sh F5
# Chấm theo loại dự án trong harness.config (STACK=web | android).
set -u
cd "$(dirname "$0")/.."
# shellcheck source=../harness.config
source ./harness.config
FID="${1:-}"
fail=0

echo "┌─ VERIFICATION ${FID:+· $FID} · stack=$STACK"

# 0) Luật "viết test trước": tính năng phải có file test mang tên của nó.
if [ -n "$FID" ]; then
  if [ "$STACK" = android ]; then
    found=$(find "$APP_DIR" -path '*/src/test/*' -name "*${FID}*" 2>/dev/null | head -1)
  else
    found=$(ls "$APP_DIR/tests/$FID.test.js" 2>/dev/null)
  fi
  if [ -n "$found" ]; then
    echo "│ ✓ Có test cho $FID ($found)"
  else
    echo "│ ✗ Thiếu test cho $FID — luật: viết test trước rồi mới code"
    fail=1
  fi
fi

if [ "$STACK" = android ]; then
  # ---------------------------------------------------------------- Android
  echo "│"
  echo "│ 1) Unit test (Gradle $ANDROID_UNIT_TEST)"
  if out=$(cd "$APP_DIR" && ./gradlew -q "$ANDROID_UNIT_TEST" 2>&1); then
    echo "│    ✓ unit test xanh"
  else
    echo "$out" | grep -E 'FAILED|Exception|expected|error:' | head -20 | sed 's/^/│    /'
    fail=1
  fi
  echo "│"
  echo "│ 2) Build APK (Gradle $ANDROID_BUILD)"
  if out=$(cd "$APP_DIR" && ./gradlew -q "$ANDROID_BUILD" 2>&1); then
    echo "│    ✓ build được APK"
  else
    echo "$out" | grep -E 'error:|e: |FAILED' | head -20 | sed 's/^/│    /'
    fail=1
  fi
  echo "│"
  echo "│ 3) Automation test (cài APK lên emulator, mở app, xem có crash không)"
  if [ "$fail" = 0 ]; then
    bash 2-environment/android-smoke.sh 2>&1 | sed 's/^/│    /'
    [ "${PIPESTATUS[0]}" = 0 ] || fail=1
  else
    echo "│    – bỏ qua vì bước trước đã đỏ"
  fi
else
  # ---------------------------------------------------------------- Web
  echo "│"
  echo "│ 1) Unit test luật chơi (node --test)"
  if out=$(node --test --test-reporter=spec "$APP_DIR/tests/*.test.js" 2>&1); then
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
fi

echo "│"
if [ "$fail" = 0 ]; then echo "└─ 🟢 XANH — đạt"; else echo "└─ 🔴 ĐỎ — chưa đạt"; fi
exit "$fail"
