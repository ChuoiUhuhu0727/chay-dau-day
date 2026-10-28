#!/usr/bin/env bash
# HARNESS AUTOMATION TEST — bot tự mở game, tự chơi như người, chụp ảnh từng bước, xuất báo cáo.
#   bash test.sh
set -u
cd "$(dirname "$0")"
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
