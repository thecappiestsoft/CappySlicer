@echo off
rem CappySlicer - pakowanie calego projektu do jednego pliku .html (Windows)
rem Uruchom: dwuklik albo:  scripts\build-html.bat
rem Wynik:   release\CappySlicer-<wersja>.html - dziala offline, wystarczy otworzyc w przegladarce.
rem Nie wymaga internetu ani "npm install": biblioteki sa w folderze vendor\.
setlocal
cd /d "%~dp0.."

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo BLAD: Nie znaleziono Node.js. Zainstaluj wersje LTS ^(18 lub nowsza^) z https://nodejs.org
  goto :fail
)
for /f %%v in ('node -p "require('./package.json').version"') do set VERSION=%%v

call node build.js
if errorlevel 1 goto :fail
if not exist release mkdir release
copy /y "dist\web\CappySlicer.html" "release\CappySlicer-%VERSION%.html" >nul
if errorlevel 1 goto :fail

echo.
echo Gotowe: release\CappySlicer-%VERSION%.html
start "" "release"
pause
exit /b 0

:fail
echo.
echo Budowanie nie powiodlo sie. Sprawdz komunikaty powyzej.
pause
exit /b 1
