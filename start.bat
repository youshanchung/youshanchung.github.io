@echo off
cd /d "%~dp0"
echo Starting HIIT Timer dev server...
echo.
echo When the QR code appears, open the Camera app on your iPhone and point it at the QR code.
echo (Expo Go must already be installed on the phone - App Store, one-time.)
echo.
npx expo start
pause
