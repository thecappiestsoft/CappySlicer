#!/usr/bin/env bash
# CappySlicer – budowanie wersji na Linuksa (AppImage + .deb)
# Uruchom:  bash scripts/build-linux.sh        (architektura komputera)
#           bash scripts/build-linux.sh arm64  (wymuszenie: x64 lub arm64)
# Wynik:    release/CappySlicer-<wersja>-Linux-<arch>.AppImage i .deb
set -euo pipefail
cd "$(dirname "$0")/.."

info() { printf '\n\033[1;36m%s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31mBŁĄD: %s\033[0m\n' "$*" >&2; exit 1; }

command -v node >/dev/null 2>&1 || fail "Nie znaleziono Node.js. Zainstaluj wersję LTS (18 lub nowszą) z https://nodejs.org lub menedżerem pakietów i uruchom skrypt ponownie."
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
[ "$NODE_MAJOR" -ge 18 ] || fail "Wymagany Node.js 18 lub nowszy (masz $(node -v))."

ARCH="${1:-}"
if [ -z "$ARCH" ]; then
  case "$(uname -m)" in
    aarch64|arm64) ARCH=arm64 ;;
    *) ARCH=x64 ;;
  esac
fi
[ "$ARCH" = "x64" ] || [ "$ARCH" = "arm64" ] || fail "Nieznana architektura: $ARCH (użyj x64 lub arm64)."

info "[1/3] Instalowanie zależności (npm install)…"
npm install --no-audit --no-fund

info "[2/3] Składanie aplikacji (node build.js)…"
node build.js

info "[3/3] Budowanie AppImage i .deb dla $ARCH…"
npx electron-builder --linux AppImage deb --"$ARCH"

info "Gotowe. Pliki w folderze release/:"
ls -1 release/*.AppImage release/*.deb 2>/dev/null || true
echo
echo "AppImage uruchomisz po nadaniu uprawnień:  chmod +x release/*.AppImage && ./release/CappySlicer-*.AppImage"
echo "Pakiet .deb zainstalujesz:                 sudo apt install ./release/CappySlicer-*.deb"
