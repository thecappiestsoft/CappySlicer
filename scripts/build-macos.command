#!/usr/bin/env bash
# CappySlicer – budowanie wersji na macOS (.dmg + .zip)
# Uruchom na Macu: dwuklik w Finderze (za pierwszym razem: prawy przycisk → Otwórz)
#                  albo w Terminalu:  bash scripts/build-macos.command
# Domyślnie buduje dla procesora tego Maca. Inne opcje:
#                  bash scripts/build-macos.command arm64   (Apple Silicon: M1–M4)
#                  bash scripts/build-macos.command x64     (Intel)
#                  bash scripts/build-macos.command all     (obie wersje)
# Wynik:           release/CappySlicer-<wersja>-macOS-<arch>.dmg i .zip
#
# Aplikacja dostaje podpis „ad-hoc” (bez certyfikatu Apple). Na swoim Macu działa od razu;
# na innych komputerach przy pierwszym uruchomieniu trzeba kliknąć prawym przyciskiem → Otwórz.
set -euo pipefail
cd "$(dirname "$0")/.."

info() { printf '\n\033[1;36m%s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31mBŁĄD: %s\033[0m\n' "$*" >&2; read -r -p "Naciśnij Enter, aby zamknąć…" _ || true; exit 1; }

[ "$(uname -s)" = "Darwin" ] || fail "Ten skrypt działa tylko na macOS (potrzebuje narzędzi codesign i hdiutil)."
command -v node >/dev/null 2>&1 || fail "Nie znaleziono Node.js. Zainstaluj wersję LTS (18 lub nowszą) z https://nodejs.org i uruchom skrypt ponownie."
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
[ "$NODE_MAJOR" -ge 18 ] || fail "Wymagany Node.js 18 lub nowszy (masz $(node -v))."

case "${1:-auto}" in
  auto) if [ "$(uname -m)" = "arm64" ]; then ARCHS="arm64"; else ARCHS="x64"; fi ;;
  arm64|x64) ARCHS="$1" ;;
  all) ARCHS="arm64 x64" ;;
  *) fail "Nieznana opcja: $1 (użyj arm64, x64 lub all)." ;;
esac

VERSION=$(node -p "require('./package.json').version")

info "[1/4] Instalowanie zależności (npm install)…"
npm install --no-audit --no-fund

info "[2/4] Składanie aplikacji (node build.js)…"
node build.js

for ARCH in $ARCHS; do
  OUTDIR="release/.mac-$ARCH"
  rm -rf "$OUTDIR"
  info "[3/4] Budowanie aplikacji dla $ARCH…"
  CSC_IDENTITY_AUTO_DISCOVERY=false npx electron-builder --mac dir --"$ARCH" -c.directories.output="$OUTDIR"
  APP=$(find "$OUTDIR" -maxdepth 2 -name "CappySlicer.app" -type d | head -n 1)
  [ -n "$APP" ] || fail "Nie znaleziono zbudowanej aplikacji w $OUTDIR."

  info "[4/4] Podpis ad-hoc i pakowanie ($ARCH)…"
  xattr -cr "$APP"
  codesign --force --deep --sign - "$APP"
  codesign --verify --deep "$APP"

  NAME="CappySlicer-$VERSION-macOS-$ARCH"
  rm -f "release/$NAME.zip" "release/$NAME.dmg"
  ditto -c -k --sequesterRsrc --keepParent "$APP" "release/$NAME.zip"
  STAGE=$(mktemp -d)
  cp -R "$APP" "$STAGE/"
  ln -s /Applications "$STAGE/Applications"
  hdiutil create -volname "CappySlicer" -srcfolder "$STAGE" -ov -format UDZO "release/$NAME.dmg" >/dev/null
  rm -rf "$STAGE" "$OUTDIR"
done

info "Gotowe. Pliki w folderze release/:"
ls -1 release/*.dmg release/*.zip 2>/dev/null || true
open release 2>/dev/null || true
