@echo off
rem CappySlicer - budowanie wersji na Windows (instalator + wersja przenosna)
rem Uruchom: dwuklik w Eksploratorze albo w wierszu polecen:  scripts\build-windows.bat
rem Wynik:   release\CappySlicer-<wersja>-Windows-Setup.exe     (instalator)
rem          release\CappySlicer-<wersja>-Windows-Portable.exe  (bez instalacji)
setlocal
cd /d "%~dp0.."

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo BLAD: Nie znaleziono Node.js. Zainstaluj wersje LTS ^(18 lub nowsza^) z https://nodejs.org
  echo i uruchom skrypt ponownie.
  goto :fail
)
for /f %%v in ('node -p "parseInt(process.versions.node)"') do set NODE_MAJOR=%%v
if %NODE_MAJOR% LSS 18 (
  echo.
  echo BLAD: Wymagany Node.js 18 lub nowszy.
  goto :fail
)

echo.
echo [1/3] Instalowanie zaleznosci (npm install)...
call npm install --no-audit --no-fund
if errorlevel 1 goto :fail

echo.
echo [2/3] Skladanie aplikacji (node build.js)...
call node build.js
if errorlevel 1 goto :fail

echo.
echo [3/3] Budowanie instalatora i wersji przenosnej...
call npx electron-builder --win
if errorlevel 1 goto :fail

echo.
echo Gotowe. Pliki w folderze release\:
dir /b release\*.exe
start "" "release"
echo.
pause
exit /b 0

:fail
echo.
echo Budowanie nie powiodlo sie. Sprawdz komunikaty powyzej.
pause
exit /b 1
