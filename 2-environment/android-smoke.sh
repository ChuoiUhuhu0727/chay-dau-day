#!/usr/bin/env bash
# ② ENVIRONMENT · "mắt" cho app Android: cài APK lên emulator/điện thoại qua adb, mở app,
# đợi vài giây, kiểm app còn sống (không crash), chụp màn hình vào reports/latest/.
#   bash 2-environment/android-smoke.sh
set -u
cd "$(dirname "$0")/.."
source ./harness.config
OUT=reports/latest
mkdir -p "$OUT"

if ! command -v adb >/dev/null; then
  echo "⚠ Không có adb → BỎ QUA chạy thử trên máy. (Bỏ qua ≠ đạt: cài Android SDK để harness nhìn được app.)"
  exit 0
fi
devices=$(adb devices | awk 'NR>1 && $2=="device" {print $1}')
if [ -z "$devices" ]; then
  echo "⚠ Không có emulator/điện thoại nào đang chạy → BỎ QUA. (Bỏ qua ≠ đạt: mở emulator trong Android Studio.)"
  exit 0
fi
if [ -n "${ANDROID_SERIAL:-}" ]; then
  export ANDROID_SERIAL
elif [ "$(echo "$devices" | wc -l | tr -d ' ')" -gt 1 ]; then
  echo "✗ Đang có nhiều thiết bị: $(echo $devices). Đặt ANDROID_SERIAL trong harness.config để chọn một (thường là emulator-5554)."
  exit 1
fi
[ -n "$ANDROID_PACKAGE" ] || { echo "✗ Chưa đặt ANDROID_PACKAGE trong harness.config"; exit 1; }

APK="$APP_DIR/$ANDROID_APK"
[ -f "$APK" ] || { echo "✗ Không thấy APK: $APK"; exit 1; }
adb install -r "$APK" >/dev/null || { echo "✗ Cài APK thất bại"; exit 1; }
adb logcat -c
adb shell monkey -p "$ANDROID_PACKAGE" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
sleep 5
adb exec-out screencap -p > "$OUT/android-launch.png"
if [ -z "$(adb shell pidof "$ANDROID_PACKAGE" | tr -d '\r')" ]; then
  echo "✗ App đã tắt sau khi mở (crash). Log:"
  adb logcat -d -s AndroidRuntime:E | tail -15
  exit 1
fi
echo "✓ App mở được và còn chạy sau 5 giây · ảnh: $OUT/android-launch.png"
