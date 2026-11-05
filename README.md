# CappySlicer 1.1

© 2026 CappySoft.pl

**PL** · Edukacyjny slicer do druku 3D FDM – zamienia modele STL/OBJ w G-code. Działa w przeglądarce oraz jako aplikacja na Windows, macOS i Linux. Interfejs po polsku i angielsku (przełącznik PL/EN w górnym pasku).

**EN** · An educational FDM 3D-printing slicer that turns STL/OBJ models into G-code. Runs in the browser and as a desktop app for Windows, macOS and Linux. Polish and English interface (PL/EN switch in the top bar).

---

## Funkcje / Features

| PL | EN |
|---|---|
| 100 drukarek w 18 grupach + własna drukarka | 100 printers in 18 groups + custom printer |
| 405 profili filamentów: 72 materiały w 9 grupach, 31 producentów (w tym polscy: Fiberlogy, Spectrum, Devil Design, Rosa3D) | 405 filament profiles: 72 materials in 9 groups, 31 brands |
| Ostrzeżenia o zgodności drukarki i filamentu | Printer/filament compatibility warnings |
| **Podpory zwykłe** (4 wzory, poszerzenie) i **drzewiaste** (kąt gałęzi, odstęp końcówek, średnice, ściany) z warstwami styku | **Normal supports** (4 patterns, expansion) and **tree supports** (branch angle, tip spacing, diameters, walls) with interface layers |
| **Brim**: automatyczny, zewnętrzny, wewnętrzny, oba, mysie uszy; szerokość i odstęp | **Brim**: auto, outer, inner, both, mouse ears; width and gap |
| **Raft** (podkładka), skirt z wysokością | **Raft**, skirt with height |
| Wykrywanie mostków, prasowanie, tryb wazonu (spirala), fuzzy skin | Bridge detection, ironing, spiral vase mode, fuzzy skin |
| 7 wzorów wypełnienia, kąt wypełnienia, górna powierzchnia monotoniczna/koncentryczna | 7 infill patterns, infill angle, monotonic/concentric top surface |
| Tryb zaawansowany i wyszukiwarka ustawień | Advanced mode and settings search |
| Podgląd warstw, czas, masa i koszt wydruku; G-code dla Marlin, Klipper, Prusa, Griffin | Layer preview, print time, weight and cost; G-code for Marlin, Klipper, Prusa, Griffin |

## Technologia / Technology

JavaScript (ES2020), HTML, CSS · Three.js r147 (WebGL) · Clipper 6.4.2 (geometria 2D / 2D geometry) · Electron 33 (desktop).

## Struktura / Structure

```
src/        app.js (UI), engine.js (silnik cięcia / slicing engine), data.js (drukarki, filamenty / printers, filaments),
            i18n.js (PL/EN), app.css, body.html, icon.svg
vendor/     Three.js, Clipper – działanie offline / offline use
electron/   aplikacja desktop / desktop shell
assets/     ikony / icons (png, ico, icns)
tests/      test silnika / engine test (node)
build.js    składa jeden plik HTML / builds a single HTML file
tools/      pakowanie wersji desktop / desktop packaging
```

## Uruchamianie / Running

```bash
npm install          # Electron, electron-builder, @electron/packager, three
npm start            # aplikacja desktop / desktop app
npm test             # 13 testów silnika / 13 engine tests
node build.js        # dist/web/CappySlicer.html – wersja offline / offline web version
```

## Skrypty budowania / Build scripts

Wymagany jest tylko **Node.js 18+** (https://nodejs.org). Skrypty same instalują zależności i zapisują wynik w folderze `release/`.
Only **Node.js 18+** is required. The scripts install dependencies themselves and write results to `release/`.

| System | Uruchom / Run | Wynik / Output |
|---|---|---|
| Windows | dwuklik / double-click `scripts\build-windows.bat` | `CappySlicer-1.1.0-Windows-Setup.exe` (instalator / installer), `CappySlicer-1.1.0-Windows-Portable.exe` |
| macOS | dwuklik / double-click `scripts/build-macos.command` (1. raz: prawy przycisk → Otwórz / first time: right-click → Open) | `CappySlicer-1.1.0-macOS-arm64.dmg` + `.zip` (lub/or `x64`) |
| Linux | `bash scripts/build-linux.sh` | `CappySlicer-1.1.0-Linux-x86_64.AppImage`, `CappySlicer-1.1.0-Linux-amd64.deb` |
| Jeden plik HTML / Single HTML file | Windows: `scripts\build-html.bat` · macOS/Linux: `bash scripts/build-html.sh` | `CappySlicer-1.1.0.html` (offline) |

- Każdy system buduje swoją wersję (Windows na Windows, Mac na Macu, Linux na Linuksie). / Build each desktop version on its own OS.
- macOS: `bash scripts/build-macos.command all` buduje dla Apple Silicon i Intela; aplikacja ma podpis ad-hoc (bez certyfikatu Apple). / `all` builds both arm64 and x64; the app is ad-hoc signed (no Apple certificate).
- Linux: `bash scripts/build-linux.sh arm64` dla ARM. / for ARM.
- Plik HTML nie wymaga internetu ani `npm install`. / The HTML build needs no internet or `npm install`.

## Uwagi / Notes

- Drukarki Bambu Lab oczekują pliku `.gcode.3mf` – G-code z CappySlicer służy dla nich do podglądu. / Bambu Lab printers expect `.gcode.3mf` – CappySlicer G-code is preview-only for them.
- Sprawdź G-code startowy przed pierwszym drukiem. / Check the start G-code before your first print.
- Czas wydruku jest szacunkowy. / Print time is an estimate.

Licencja / License: MIT. Biblioteki / Libraries: Three.js (MIT), Clipper (Boost Software License), Electron (MIT).
