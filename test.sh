#!/usr/bin/env bash
# HARNESS AUTOMATION TEST — máy tự chạy thử sản phẩm như người dùng, chụp ảnh, xuất báo cáo.
#   bash test.sh
#   web:     bot mở game trong Chrome, chơi hết level   → reports/latest/report.html
#   android: cài APK lên emulator, mở app, xem có crash → reports/latest/android-launch.png
set -u
cd "$(dirname "$0")"
source ./harness.config
if [ "$STACK" = android ]; then
  bash 2-environment/android-smoke.sh
  exit $?
fi
node 2-environment/bot.mjs
rc=$?
REPORT="reports/latest/report.html"
if [ -f "$REPORT" ]; then
  case "$(uname -s)" in
    Darwin) open "$REPORT" ;;
    Linux) xdg-open "$REPORT" >/dev/null 2>&1 || true ;;
    MINGW*|MSYS*|CYGWIN*) start "" "$REPORT" ;;
  esac
fi
exit $rc
