#!/usr/bin/env bash
# CappySlicer – pakowanie całego projektu do jednego pliku .html (macOS i Linux)
# Uruchom:  bash scripts/build-html.sh
# Wynik:    release/CappySlicer-<wersja>.html – działa offline, wystarczy otworzyć w przeglądarce.
# Nie wymaga internetu ani „npm install”: biblioteki są w folderze vendor/.
set -euo pipefail
cd "$(dirname "$0")/.."

fail() { printf '\n\033[1;31mBŁĄD: %s\033[0m\n' "$*" >&2; exit 1; }
command -v node >/dev/null 2>&1 || fail "Nie znaleziono Node.js. Zainstaluj wersję LTS (18 lub nowszą) z https://nodejs.org i uruchom skrypt ponownie."

VERSION=$(node -p "require('./package.json').version")
node build.js
mkdir -p release
cp dist/web/CappySlicer.html "release/CappySlicer-$VERSION.html"
printf '\n\033[1;36mGotowe: release/CappySlicer-%s.html\033[0m\n' "$VERSION"
