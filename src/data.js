// ===== BAZA DRUKAREK =====
// [nazwa, X, Y, Z, kinematyka, firmware, opcje]
// opcje: fd=średnica filamentu, bow=bowden, enc=obudowa, maxT=maks. temp. dyszy, maxB=maks. stół,
//        v=maks. prędkość, a=przyspieszenie, round=okrągły stół (delta), center=początek w środku,
//        tpl=szablon startu, note=uwaga
const PRINTER_DB = {
  "Prusa Research": [
    ["Prusa Core One", 250, 220, 270, "CoreXY", "prusa", {enc:1, maxT:290, maxB:120, v:400, a:6000, tpl:"prusa4"}],
    ["Prusa MK4S", 250, 210, 220, "Bedslinger", "prusa", {maxT:290, maxB:120, v:300, a:4000, tpl:"prusa4"}],
    ["Prusa MK4", 250, 210, 220, "Bedslinger", "prusa", {maxT:290, maxB:120, v:250, a:4000, tpl:"prusa4"}],
    ["Prusa MK3S+", 250, 210, 210, "Bedslinger", "prusa", {maxT:300, maxB:120, v:200, a:1250, tpl:"prusa3"}],
    ["Prusa MINI+", 180, 180, 180, "Bedslinger", "prusa", {bow:1, maxT:280, maxB:100, v:180, a:2000, tpl:"prusa4"}],
    ["Prusa XL (1 głowica)", 360, 360, 360, "CoreXY", "prusa", {maxT:290, maxB:120, v:400, a:5000, tpl:"prusa4"}]
  ],
  "Bambu Lab": [
    ["Bambu Lab X1 Carbon", 256, 256, 256, "CoreXY", "bambu", {enc:1, maxT:300, maxB:110, v:500, a:20000, hard:1}],
    ["Bambu Lab X1E", 256, 256, 256, "CoreXY", "bambu", {enc:1, maxT:320, maxB:120, v:500, a:20000, hard:1}],
    ["Bambu Lab P1S", 256, 256, 256, "CoreXY", "bambu", {enc:1, maxT:300, maxB:100, v:500, a:20000}],
    ["Bambu Lab P1P", 256, 256, 256, "CoreXY", "bambu", {maxT:300, maxB:100, v:500, a:20000}],
    ["Bambu Lab P2S", 256, 256, 256, "CoreXY", "bambu", {enc:1, maxT:300, maxB:110, v:600, a:20000, hard:1}],
    ["Bambu Lab A1", 256, 256, 256, "Bedslinger", "bambu", {maxT:300, maxB:100, v:500, a:10000}],
    ["Bambu Lab A1 mini", 180, 180, 180, "Bedslinger", "bambu", {maxT:300, maxB:80, v:500, a:10000}],
    ["Bambu Lab H2D (1 dysza)", 350, 320, 325, "CoreXY", "bambu", {enc:1, maxT:350, maxB:120, v:1000, a:20000, hard:1}]
  ],
  "Creality": [
    ["Creality Ender-3 V2", 220, 220, 250, "Bedslinger", "marlin", {bow:1, maxT:260, maxB:100, v:120, a:500}],
    ["Creality Ender-3 V2 Neo", 220, 220, 250, "Bedslinger", "marlin", {bow:1, maxT:260, maxB:100, v:120, a:500}],
    ["Creality Ender-3 S1 Pro", 220, 220, 270, "Bedslinger", "marlin", {maxT:300, maxB:110, v:150, a:1000}],
    ["Creality Ender-3 V3 SE", 220, 220, 250, "Bedslinger", "marlin", {maxT:260, maxB:100, v:250, a:2500}],
    ["Creality Ender-3 V3 KE", 220, 220, 240, "Bedslinger", "klipper", {maxT:300, maxB:100, v:500, a:8000, tpl:"creality"}],
    ["Creality Ender-3 V3", 220, 220, 250, "CoreXZ", "klipper", {maxT:300, maxB:110, v:600, a:20000, tpl:"creality"}],
    ["Creality Ender-5 S1", 220, 220, 280, "CoreXY", "marlin", {maxT:300, maxB:110, v:250, a:2000}],
    ["Creality K1", 220, 220, 250, "CoreXY", "klipper", {enc:1, maxT:300, maxB:100, v:600, a:20000, tpl:"creality"}],
    ["Creality K1C", 220, 220, 250, "CoreXY", "klipper", {enc:1, maxT:300, maxB:100, v:600, a:20000, hard:1, tpl:"creality"}],
    ["Creality K1 Max", 300, 300, 300, "CoreXY", "klipper", {enc:1, maxT:300, maxB:100, v:600, a:20000, hard:1, tpl:"creality"}],
    ["Creality K2 Plus", 350, 350, 350, "CoreXY", "klipper", {enc:1, maxT:350, maxB:120, v:600, a:30000, hard:1, tpl:"creality"}],
    ["Creality Hi", 260, 260, 300, "Bedslinger", "klipper", {maxT:300, maxB:100, v:500, a:20000, tpl:"creality"}],
    ["Creality CR-10 SE", 220, 220, 265, "Bedslinger", "klipper", {maxT:300, maxB:100, v:600, a:20000, tpl:"creality"}],
    ["Creality CR-10 Smart Pro", 300, 300, 400, "Bedslinger", "marlin", {maxT:300, maxB:110, v:150, a:1000}]
  ],
  "Anycubic": [
    ["Anycubic Kobra 2 Neo", 220, 220, 250, "Bedslinger", "marlin", {maxT:260, maxB:110, v:250, a:2500}],
    ["Anycubic Kobra 2 Pro", 220, 220, 250, "Bedslinger", "klipper", {maxT:260, maxB:110, v:500, a:10000}],
    ["Anycubic Kobra 2 Max", 420, 420, 500, "Bedslinger", "klipper", {maxT:260, maxB:110, v:500, a:10000}],
    ["Anycubic Kobra 3", 250, 250, 260, "Bedslinger", "klipper", {maxT:300, maxB:110, v:600, a:20000}],
    ["Anycubic Kobra 3 Max", 420, 420, 500, "Bedslinger", "klipper", {maxT:300, maxB:110, v:600, a:20000}],
    ["Anycubic Kobra S1", 250, 250, 250, "CoreXY", "klipper", {enc:1, maxT:320, maxB:120, v:600, a:20000}],
    ["Anycubic Vyper", 245, 245, 260, "Bedslinger", "marlin", {maxT:260, maxB:110, v:100, a:1000}]
  ],
  "Elegoo": [
    ["Elegoo Neptune 4", 225, 225, 265, "Bedslinger", "klipper", {maxT:300, maxB:110, v:500, a:10000}],
    ["Elegoo Neptune 4 Pro", 225, 225, 265, "Bedslinger", "klipper", {maxT:300, maxB:110, v:500, a:10000}],
    ["Elegoo Neptune 4 Plus", 320, 320, 385, "Bedslinger", "klipper", {maxT:300, maxB:110, v:500, a:10000}],
    ["Elegoo Neptune 4 Max", 420, 420, 480, "Bedslinger", "klipper", {maxT:300, maxB:110, v:500, a:10000}],
    ["Elegoo Neptune 3 Pro", 225, 225, 280, "Bedslinger", "marlin", {maxT:260, maxB:110, v:180, a:1000}],
    ["Elegoo Centauri Carbon", 256, 256, 256, "CoreXY", "klipper", {enc:1, maxT:320, maxB:110, v:500, a:20000, hard:1}]
  ],
  "Voron Design": [
    ["Voron 0.2", 120, 120, 120, "CoreXY", "klipper", {enc:1, maxT:300, maxB:120, v:350, a:10000, tpl:"voron"}],
    ["Voron Trident 250", 250, 250, 250, "CoreXY", "klipper", {enc:1, maxT:300, maxB:120, v:400, a:10000, tpl:"voron"}],
    ["Voron Trident 300", 300, 300, 250, "CoreXY", "klipper", {enc:1, maxT:300, maxB:120, v:400, a:10000, tpl:"voron"}],
    ["Voron Trident 350", 350, 350, 250, "CoreXY", "klipper", {enc:1, maxT:300, maxB:120, v:400, a:10000, tpl:"voron"}],
    ["Voron 2.4 250", 250, 250, 230, "CoreXY", "klipper", {enc:1, maxT:300, maxB:120, v:400, a:10000, tpl:"voron"}],
    ["Voron 2.4 300", 300, 300, 280, "CoreXY", "klipper", {enc:1, maxT:300, maxB:120, v:400, a:10000, tpl:"voron"}],
    ["Voron 2.4 350", 350, 350, 330, "CoreXY", "klipper", {enc:1, maxT:300, maxB:120, v:400, a:10000, tpl:"voron"}]
  ],
  "QIDI Tech": [
    ["QIDI Q1 Pro", 245, 245, 240, "CoreXY", "klipper", {enc:1, maxT:350, maxB:120, v:600, a:20000, hard:1, tpl:"qidi"}],
    ["QIDI Plus4", 305, 305, 280, "CoreXY", "klipper", {enc:1, maxT:370, maxB:120, v:600, a:20000, hard:1, tpl:"qidi"}],
    ["QIDI X-Plus 3", 280, 280, 270, "CoreXY", "klipper", {enc:1, maxT:350, maxB:120, v:600, a:20000, hard:1, tpl:"qidi"}],
    ["QIDI X-Max 3", 325, 325, 315, "CoreXY", "klipper", {enc:1, maxT:350, maxB:120, v:600, a:20000, hard:1, tpl:"qidi"}],
    ["QIDI X-Smart 3", 175, 180, 170, "CoreXY", "klipper", {enc:1, maxT:350, maxB:120, v:500, a:20000, tpl:"qidi"}]
  ],
  "Sovol": [
    ["Sovol SV06", 220, 220, 250, "Bedslinger", "marlin", {maxT:300, maxB:100, v:180, a:1000}],
    ["Sovol SV06 Plus", 300, 300, 340, "Bedslinger", "marlin", {maxT:300, maxB:100, v:180, a:1000}],
    ["Sovol SV06 ACE", 220, 220, 250, "Bedslinger", "klipper", {maxT:300, maxB:100, v:600, a:20000}],
    ["Sovol SV07", 220, 220, 250, "Bedslinger", "klipper", {maxT:300, maxB:100, v:500, a:8000}],
    ["Sovol SV08", 350, 350, 345, "CoreXY", "klipper", {maxT:300, maxB:100, v:700, a:40000, tpl:"voron"}]
  ],
  "Artillery": [
    ["Artillery Sidewinder X2", 300, 300, 400, "Bedslinger", "marlin", {maxT:240, maxB:130, v:150, a:1000}],
    ["Artillery Sidewinder X4 Plus", 300, 300, 400, "Bedslinger", "klipper", {maxT:300, maxB:110, v:500, a:10000}],
    ["Artillery Sidewinder X4 Pro", 240, 240, 250, "Bedslinger", "klipper", {maxT:300, maxB:110, v:500, a:10000}],
    ["Artillery Genius Pro", 220, 220, 250, "Bedslinger", "marlin", {maxT:240, maxB:110, v:150, a:1000}]
  ],
  "FlashForge": [
    ["FlashForge Adventurer 5M", 220, 220, 220, "CoreXY", "klipper", {maxT:280, maxB:110, v:600, a:20000, tpl:"flashforge"}],
    ["FlashForge Adventurer 5M Pro", 220, 220, 220, "CoreXY", "klipper", {enc:1, maxT:280, maxB:110, v:600, a:20000, tpl:"flashforge"}],
    ["FlashForge AD5X", 220, 220, 220, "CoreXY", "klipper", {maxT:300, maxB:110, v:600, a:20000, tpl:"flashforge"}],
    ["FlashForge Guider 3 Ultra", 330, 330, 600, "CoreXY", "marlin", {enc:1, maxT:350, maxB:120, v:300, a:5000, hard:1}],
    ["FlashForge Creator 4", 400, 350, 500, "Cartesian", "marlin", {enc:1, maxT:360, maxB:120, v:200, a:3000, hard:1}]
  ],
  "Ultimaker (2,85 mm)": [
    ["UltiMaker S7", 330, 240, 300, "Cartesian", "griffin", {fd:2.85, bow:1, enc:1, maxT:280, maxB:140, v:300, a:3000}],
    ["UltiMaker S5", 330, 240, 300, "Cartesian", "griffin", {fd:2.85, bow:1, enc:1, maxT:280, maxB:140, v:300, a:3000}],
    ["UltiMaker S3", 230, 190, 200, "Cartesian", "griffin", {fd:2.85, bow:1, enc:1, maxT:280, maxB:140, v:300, a:3000}],
    ["Ultimaker 2+ Connect", 223, 220, 205, "Cartesian", "griffin", {fd:2.85, bow:1, maxT:260, maxB:100, v:200, a:3000}]
  ],
  "Raise3D": [
    ["Raise3D Pro3", 300, 300, 300, "Cartesian", "marlin", {enc:1, maxT:300, maxB:120, v:300, a:3000}],
    ["Raise3D Pro3 Plus", 300, 300, 605, "Cartesian", "marlin", {enc:1, maxT:300, maxB:120, v:300, a:3000}],
    ["Raise3D E2", 330, 240, 240, "Cartesian", "marlin", {enc:1, maxT:300, maxB:110, v:150, a:2000}]
  ],
  "Snapmaker": [
    ["Snapmaker J1", 300, 200, 200, "IDEX", "marlin", {enc:1, maxT:300, maxB:100, v:350, a:10000}],
    ["Snapmaker Artisan", 400, 400, 400, "Cartesian", "marlin", {enc:1, maxT:300, maxB:110, v:100, a:1000}],
    ["Snapmaker 2.0 A350T", 320, 350, 330, "Cartesian", "marlin", {maxT:275, maxB:110, v:100, a:1000}],
    ["Snapmaker U1", 270, 270, 270, "CoreXY", "klipper", {maxT:300, maxB:100, v:500, a:20000}]
  ],
  "Anker / AnkerMake": [
    ["AnkerMake M5", 235, 235, 250, "Bedslinger", "marlin", {maxT:260, maxB:100, v:500, a:5000}],
    ["AnkerMake M5C", 220, 220, 250, "Bedslinger", "marlin", {maxT:300, maxB:100, v:500, a:5000}]
  ],
  "RatRig": [
    ["RatRig V-Core 4 300", 300, 300, 300, "CoreXY", "klipper", {enc:1, maxT:300, maxB:120, v:500, a:20000, tpl:"ratrig"}],
    ["RatRig V-Core 4 400", 400, 400, 400, "CoreXY", "klipper", {enc:1, maxT:300, maxB:120, v:500, a:20000, tpl:"ratrig"}],
    ["RatRig V-Core 4 500", 500, 500, 500, "CoreXY", "klipper", {enc:1, maxT:300, maxB:120, v:500, a:20000, tpl:"ratrig"}],
    ["RatRig V-Minion", 180, 180, 180, "CoreXY", "klipper", {maxT:300, maxB:110, v:400, a:10000, tpl:"ratrig"}]
  ],
  "Delta: FLSUN / Anycubic": [
    ["FLSUN V400", 300, 300, 410, "Delta", "klipper", {round:1, center:1, maxT:300, maxB:110, v:600, a:20000}],
    ["FLSUN S1", 320, 320, 430, "Delta", "klipper", {round:1, center:1, enc:1, maxT:350, maxB:120, v:1000, a:30000}],
    ["FLSUN T1", 260, 260, 330, "Delta", "klipper", {round:1, center:1, maxT:300, maxB:110, v:1000, a:30000}],
    ["Anycubic Kossel Linear Plus", 230, 230, 300, "Delta", "marlin", {round:1, center:1, bow:1, maxT:260, maxB:100, v:100, a:1000}]
  ],
  "Inne": [
    ["BIQU B1", 235, 235, 270, "Bedslinger", "marlin", {bow:1, maxT:260, maxB:100, v:150, a:1000}],
    ["BIQU Hurakan", 220, 220, 270, "Bedslinger", "klipper", {maxT:300, maxB:100, v:300, a:5000}],
    ["Two Trees SK1", 256, 256, 256, "CoreXY", "klipper", {maxT:300, maxB:110, v:700, a:20000}],
    ["Geeetech A10 Pro", 220, 220, 260, "Bedslinger", "marlin", {bow:1, maxT:260, maxB:100, v:100, a:1000}],
    ["Tronxy X5SA Pro", 330, 330, 400, "CoreXY", "marlin", {maxT:270, maxB:100, v:150, a:1000}],
    ["Kingroon KP3S Pro V2", 200, 200, 200, "Bedslinger", "klipper", {maxT:260, maxB:100, v:350, a:10000}],
    ["Mingda Magician X2", 230, 230, 260, "Bedslinger", "marlin", {maxT:260, maxB:100, v:200, a:2000}],
    ["Creatbot F430", 400, 300, 300, "Cartesian", "marlin", {enc:1, maxT:420, maxB:150, v:150, a:1500, hard:1}],
    ["Intamsys Funmat HT", 260, 260, 260, "Cartesian", "marlin", {enc:1, maxT:450, maxB:160, v:150, a:1500, hard:1}],
    ["Zortrax M300 Dual (ref.)", 265, 265, 300, "Cartesian", "marlin", {enc:1, maxT:290, maxB:105, v:150, a:1500}]
  ],
  "Własna drukarka": [
    ["Własna drukarka (Marlin)", 220, 220, 250, "Bedslinger", "marlin", {custom:1, maxT:300, maxB:110, v:200, a:2000}],
    ["Własna drukarka (Klipper)", 250, 250, 250, "CoreXY", "klipper", {custom:1, maxT:300, maxB:110, v:400, a:10000}]
  ]
};

const START_TEMPLATES = {
  marlin: `M140 S{bed}            ; heat bed\nM104 S{nozzle}         ; heat nozzle\nG28                    ; home all axes\nM190 S{bed}\nM109 S{nozzle}\nM83                    ; relative extrusion\nG92 E0\nG1 Z2 F3000\nG1 X{px} Y{py} Z{lh} F5000\nG1 X{px2} Y{py} E{purge} F1500 ; purge line\nG1 Z1 F3000`,
  klipper: `PRINT_START BED={bed} HOTEND={nozzle}\nM83\nG92 E0`,
  voron: `PRINT_START BED={bed} HOTEND={nozzle} CHAMBER={chamber}\nM83\nG92 E0`,
  ratrig: `START_PRINT EXTRUDER_TEMP={nozzle} BED_TEMP={bed}\nM83\nG92 E0`,
  creality: `START_PRINT EXTRUDER_TEMP={nozzle} BED_TEMP={bed}\nM83\nG92 E0`,
  qidi: `PRINT_START BED={bed} HOTEND={nozzle} CHAMBER={chamber}\nM83\nG92 E0`,
  flashforge: `START_PRINT EXTRUDER_TEMP={nozzle} BED_TEMP={bed}\nM83\nG92 E0`,
  prusa3: `M140 S{bed}\nM104 S{nozzle}\nG28 W                  ; home without mesh bed level\nG80                    ; mesh bed leveling (MK3)\nM190 S{bed}\nM109 S{nozzle}\nM83\nG92 E0\nG1 Y-3 F1000\nG1 X60 E9 F1000\nG1 X100 E12.5 F1000\nG92 E0`,
  prusa4: `M140 S{bed}\nM104 S170              ; nozzle temp for probing\nG28\nM190 S{bed}\nG29                    ; mesh bed leveling\nM109 S{nozzle}\nM83\nG92 E0\nG1 X{px} Y{py} Z{lh} F5000\nG1 X{px2} Y{py} E{purge} F1500\nG1 Z1 F3000`,
  bambu: `; NOTE: Bambu Lab printers expect a .gcode.3mf file from Bambu Studio / Orca.\n; This G-code is for preview and learning, not for sending to the printer.\nM140 S{bed}\nM104 S{nozzle}\nG28\nM190 S{bed}\nM109 S{nozzle}\nM83\nG92 E0`,
  griffin: `;FLAVOR:Griffin\nM140 S{bed}\nM104 S{nozzle}\nG28\nM190 S{bed}\nM109 S{nozzle}\nM83\nG92 E0\nG1 Z2 F3000`
};
const END_TEMPLATES = {
  marlin: `G1 E-2 F2400\nG91\nG1 Z10 F3000\nG90\nG1 X0 Y{dy} F6000       ; present the bed\nM104 S0\nM140 S0\nM107\nM84`,
  klipper: `PRINT_END`, voron: `PRINT_END`, qidi: `PRINT_END`,
  ratrig: `END_PRINT`, creality: `END_PRINT`, flashforge: `END_PRINT`,
  prusa3: `G1 E-1 F2100\nG91\nG1 Z10 F720\nG90\nG1 X0 Y200 F3600\nM104 S0\nM140 S0\nM107\nM84`,
  prusa4: `G1 E-1 F2100\nG91\nG1 Z10 F720\nG90\nG1 X0 Y200 F3600\nM104 S0\nM140 S0\nM107\nM84`,
  bambu: `M104 S0\nM140 S0\nM107\nG91\nG1 Z10 F3000\nG90\nM84`,
  griffin: `M104 S0\nM140 S0\nM107\nG91\nG1 Z10 F3000\nG90\nM84`
};
const FLAVOR_LABEL = {marlin:"Marlin", klipper:"Klipper", prusa:"Prusa Firmware (Marlin)", bambu:"Bambu (podgląd)", griffin:"Griffin (Ultimaker)"};

// ===== BAZA MATERIAŁÓW =====
// id: [nazwa, grupa, dysza[min,max,domyślna], stół, gęstość g/cm3, wentylator %, maks. przepływ mm3/s,
//      komora °C, {enc: wymaga obudowy, abr: ścierny, dry:[°C,h], ret: retrakcja (direct), cena zł/kg, note}]
const MAT_GROUPS = [
  ["pla", "PLA i pochodne"],
  ["petg", "PETG i kopoliestry"],
  ["sty", "ABS / ASA / HIPS"],
  ["flex", "Elastyczne (TPU, TPE)"],
  ["pc", "Poliwęglany (PC)"],
  ["pa", "Nylony (PA)"],
  ["ht", "Wysokotemperaturowe (PEEK, PEI, PPS)"],
  ["spec", "Specjalne i z wypełniaczami"],
  ["sup", "Podporowe i rozpuszczalne"]
];
const MATERIALS = {
  "PLA":        ["PLA", "pla", [190,230,210], 60, 1.24, 100, 15, 0, {dry:[50,6], ret:0.8, p:85, note:"Najłatwiejszy materiał – idealny na start."}],
  "PLA+":       ["PLA+ / PLA Pro", "pla", [200,235,215], 60, 1.24, 100, 16, 0, {dry:[50,6], ret:0.8, p:90, note:"Modyfikowany PLA – mniej kruchy."}],
  "PLA-HS":     ["PLA High Speed", "pla", [200,240,220], 60, 1.24, 100, 24, 0, {dry:[50,6], ret:0.8, p:95, note:"Do szybkich drukarek (CoreXY, Klipper)."}],
  "PLA-MATTE":  ["PLA Matowy", "pla", [195,230,215], 60, 1.31, 100, 14, 0, {dry:[50,6], ret:0.8, p:95, note:"Matowa powierzchnia ukrywa warstwy."}],
  "PLA-SILK":   ["PLA Silk (jedwabisty)", "pla", [200,235,220], 60, 1.24, 100, 8, 0, {dry:[50,6], ret:0.8, p:95, note:"Drukuj wolniej dla połysku."}],
  "PLA-TOUGH":  ["PLA Tough / Impact", "pla", [205,240,220], 60, 1.22, 100, 15, 0, {dry:[50,6], ret:0.8, p:110, note:"Wyższa udarność, części funkcjonalne."}],
  "PLA-CF":     ["PLA-CF (włókno węglowe)", "pla", [210,240,220], 60, 1.30, 100, 14, 0, {abr:1, dry:[55,8], ret:0.6, p:150, note:"Ścierny – dysza hartowana."}],
  "PLA-WOOD":   ["PLA Wood (drewno)", "pla", [190,220,205], 60, 1.15, 100, 10, 0, {dry:[50,6], ret:0.6, p:120, note:"Użyj dyszy ≥ 0,5 mm, ryzyko zatkania."}],
  "PLA-MARBLE": ["PLA Marble (marmur)", "pla", [195,225,210], 60, 1.30, 100, 12, 0, {dry:[50,6], ret:0.8, p:110}],
  "PLA-GLOW":   ["PLA Glow (świecący w ciemności)", "pla", [200,225,210], 60, 1.28, 100, 12, 0, {abr:1, dry:[50,6], ret:0.8, p:120, note:"Lekko ścierny – zalecana dysza hartowana."}],
  "PLA-SPARK":  ["PLA Sparkle / Galaxy", "pla", [200,230,215], 60, 1.26, 100, 12, 0, {dry:[50,6], ret:0.8, p:110}],
  "PLA-METAL":  ["PLA Metal (efekt metalu)", "pla", [200,230,215], 60, 1.30, 100, 12, 0, {dry:[50,6], ret:0.8, p:110}],
  "PLA-TRANS":  ["PLA Transparentny", "pla", [200,230,215], 60, 1.24, 100, 12, 0, {dry:[50,6], ret:0.8, p:95}],
  "LW-PLA":     ["LW-PLA (spieniany, lekki)", "pla", [200,250,230], 55, 0.80, 100, 10, 0, {dry:[45,6], ret:0.5, p:180, note:"Temperatura steruje spienieniem; zmniejsz przepływ."}],
  "rPLA":       ["PLA z recyklingu", "pla", [195,230,210], 60, 1.24, 100, 14, 0, {dry:[50,6], ret:0.8, p:80}],
  "PLA-HT":     ["PLA HT (wyżarzalny)", "pla", [205,235,215], 60, 1.25, 100, 12, 0, {dry:[50,6], ret:0.8, p:140, note:"Po wyżarzeniu odporny do ~100 °C."}],

  "PETG":       ["PETG", "petg", [220,260,240], 80, 1.27, 40, 12, 0, {dry:[65,6], ret:1.0, p:85, note:"Wytrzymały, odporny chemicznie. Na PEI użyj kleju jako separatora."}],
  "PETG-HF":    ["PETG High Flow", "petg", [230,270,250], 75, 1.27, 40, 22, 0, {dry:[65,6], ret:0.8, p:100}],
  "PETG-CF":    ["PETG-CF", "petg", [230,270,250], 75, 1.30, 30, 12, 0, {abr:1, dry:[65,8], ret:0.8, p:170, note:"Ścierny – dysza hartowana."}],
  "PETG-GF":    ["PETG-GF (włókno szklane)", "petg", [235,270,250], 75, 1.38, 30, 12, 0, {abr:1, dry:[65,8], ret:0.8, p:160}],
  "PCTG":       ["PCTG", "petg", [230,270,250], 80, 1.23, 40, 12, 0, {dry:[65,6], ret:1.0, p:120, note:"Twardszy i bardziej przejrzysty niż PETG."}],
  "CPE":        ["CPE / CPE HT", "petg", [240,275,260], 80, 1.27, 40, 12, 0, {dry:[65,6], ret:1.0, p:150}],
  "PET-CF":     ["PET-CF", "petg", [260,290,280], 80, 1.33, 20, 10, 40, {enc:1, abr:1, dry:[80,8], ret:0.8, p:250}],
  "COPOLY":     ["Kopoliester (nGen / HT)", "petg", [230,270,250], 80, 1.20, 50, 12, 0, {dry:[60,6], ret:1.0, p:150}],
  "rPETG":      ["PETG z recyklingu", "petg", [220,250,235], 80, 1.27, 40, 12, 0, {dry:[65,6], ret:1.0, p:80}],
  "PETG-ESD":   ["PETG ESD (antystatyczny)", "petg", [240,270,255], 80, 1.30, 40, 10, 0, {abr:1, dry:[65,8], ret:1.0, p:300}],

  "ABS":        ["ABS", "sty", [240,270,255], 100, 1.04, 20, 18, 40, {enc:1, dry:[80,4], ret:0.8, p:85, note:"Wymaga obudowy i wentylacji pomieszczenia (opary)."}],
  "ABS+":       ["ABS+", "sty", [240,270,255], 100, 1.05, 20, 18, 40, {enc:1, dry:[80,4], ret:0.8, p:95}],
  "ABS-GF":     ["ABS-GF", "sty", [250,280,265], 100, 1.15, 15, 14, 45, {enc:1, abr:1, dry:[80,6], ret:0.8, p:170}],
  "ASA":        ["ASA", "sty", [240,275,260], 100, 1.07, 25, 16, 40, {enc:1, dry:[80,4], ret:0.8, p:100, note:"Odporny na UV – części zewnętrzne."}],
  "ASA-CF":     ["ASA-CF", "sty", [250,280,265], 100, 1.12, 20, 14, 45, {enc:1, abr:1, dry:[80,6], ret:0.8, p:190}],
  "HIPS":       ["HIPS", "sty", [230,250,240], 100, 1.04, 20, 14, 40, {enc:1, dry:[65,4], ret:0.8, p:90, note:"Podpora dla ABS – rozpuszcza się w limonenie."}],

  "TPU95":      ["TPU 95A", "flex", [210,240,225], 40, 1.21, 60, 3.6, 0, {flex:1, dry:[55,6], ret:0.4, p:130, note:"Drukuj wolno (≈25 mm/s), najlepiej direct drive."}],
  "TPU90":      ["TPU 90A", "flex", [210,240,225], 40, 1.20, 60, 3, 0, {flex:1, dry:[55,6], ret:0.3, p:140}],
  "TPU85":      ["TPU 85A (miękki)", "flex", [210,235,220], 40, 1.18, 60, 2.5, 0, {flex:1, dry:[55,6], ret:0.2, p:160, note:"Tylko direct drive."}],
  "TPU64D":     ["TPU 64D (twardy)", "flex", [220,250,235], 50, 1.22, 50, 5, 0, {flex:1, dry:[60,6], ret:0.6, p:150}],
  "TPU-HF":     ["TPU High Flow (AMS)", "flex", [220,240,230], 40, 1.21, 60, 6, 0, {flex:1, dry:[55,6], ret:0.4, p:140}],
  "TPE":        ["TPE", "flex", [210,230,220], 40, 1.15, 50, 2.5, 0, {flex:1, dry:[50,6], ret:0.2, p:170}],
  "TPC":        ["TPC / TPEE", "flex", [220,250,235], 60, 1.20, 50, 4, 0, {flex:1, dry:[70,6], ret:0.4, p:220}],

  "PC":         ["PC (poliwęglan)", "pc", [260,300,280], 110, 1.20, 10, 10, 50, {enc:1, dry:[80,8], ret:0.8, p:150, note:"Bardzo wytrzymały, wymaga obudowy i dyszy all-metal."}],
  "PC-ABS":     ["PC-ABS", "pc", [250,280,265], 100, 1.10, 15, 12, 45, {enc:1, dry:[80,6], ret:0.8, p:140}],
  "PC-CF":      ["PC-CF", "pc", [260,300,280], 110, 1.25, 10, 10, 50, {enc:1, abr:1, dry:[80,8], ret:0.8, p:280}],
  "PC-PBT":     ["PC-PBT", "pc", [250,270,260], 100, 1.22, 15, 10, 45, {enc:1, dry:[80,6], ret:0.8, p:170}],
  "PC-BLEND":   ["PC Blend (łatwy PC)", "pc", [265,285,275], 110, 1.22, 15, 10, 40, {enc:1, dry:[75,6], ret:0.8, p:170}],

  "PA6":        ["PA6 (Nylon)", "pa", [250,280,265], 80, 1.14, 0, 10, 45, {enc:1, dry:[80,12], ret:1.0, p:170, note:"Bardzo higroskopijny – susz przed drukiem. Klej na stół."}],
  "PA12":       ["PA12 (Nylon)", "pa", [240,270,255], 80, 1.01, 0, 10, 40, {enc:1, dry:[80,12], ret:1.0, p:200}],
  "PA11":       ["PA11", "pa", [240,270,255], 80, 1.04, 0, 10, 40, {enc:1, dry:[80,12], ret:1.0, p:250}],
  "PA6-CF":     ["PA6-CF / PA-CF", "pa", [270,300,285], 80, 1.20, 0, 10, 50, {enc:1, abr:1, dry:[80,12], ret:0.8, p:300}],
  "PA6-GF":     ["PA6-GF", "pa", [270,300,285], 80, 1.35, 0, 10, 50, {enc:1, abr:1, dry:[80,12], ret:0.8, p:270}],
  "PA12-CF":    ["PA12-CF", "pa", [260,290,275], 80, 1.10, 0, 10, 50, {enc:1, abr:1, dry:[80,12], ret:0.8, p:330}],
  "PAHT-CF":    ["PAHT-CF", "pa", [280,310,295], 90, 1.20, 0, 10, 60, {enc:1, abr:1, dry:[80,12], ret:0.8, p:400}],
  "PPA-CF":     ["PPA-CF", "pa", [290,320,310], 100, 1.24, 0, 8, 60, {enc:1, abr:1, dry:[100,12], ret:0.8, p:600}],

  "PEI9085":    ["PEI 9085 (ULTEM™ 9085)", "ht", [350,390,370], 160, 1.34, 0, 8, 90, {enc:1, dry:[150,4], ret:0.8, p:1500, note:"Wymaga drukarki przemysłowej (dysza ≥ 380 °C, grzana komora)."}],
  "PEI1010":    ["PEI 1010 (ULTEM™ 1010)", "ht", [370,410,390], 170, 1.27, 0, 8, 100, {enc:1, dry:[150,4], ret:0.8, p:1800}],
  "PEEK":       ["PEEK", "ht", [380,430,410], 130, 1.30, 0, 8, 120, {enc:1, dry:[120,6], ret:0.8, p:2500, note:"Materiał lotniczy i medyczny – tylko drukarki wysokotemperaturowe."}],
  "PEKK":       ["PEKK", "ht", [340,380,360], 130, 1.30, 0, 8, 100, {enc:1, dry:[120,6], ret:0.8, p:2600}],
  "PPS":        ["PPS", "ht", [300,340,320], 110, 1.35, 0, 8, 70, {enc:1, dry:[120,4], ret:0.8, p:700}],
  "PPS-CF":     ["PPS-CF", "ht", [310,350,330], 110, 1.40, 0, 8, 70, {enc:1, abr:1, dry:[120,4], ret:0.8, p:900}],
  "PPSU":       ["PSU / PPSU", "ht", [360,400,380], 150, 1.29, 0, 8, 100, {enc:1, dry:[140,4], ret:0.8, p:1600}],
  "PVDF":       ["PVDF", "ht", [240,270,255], 100, 1.78, 0, 8, 50, {enc:1, dry:[80,6], ret:0.8, p:900}],

  "PP":         ["PP (polipropylen)", "spec", [220,250,235], 85, 0.90, 30, 10, 0, {dry:[60,6], ret:1.0, p:150, note:"Słabo przywiera – użyj taśmy PP lub dedykowanej płyty."}],
  "PP-GF":      ["PP-GF", "spec", [230,260,245], 85, 1.03, 30, 10, 0, {abr:1, dry:[60,6], ret:1.0, p:220}],
  "POM":        ["POM (acetal)", "spec", [210,235,220], 110, 1.41, 0, 8, 0, {dry:[80,4], ret:1.0, p:250, note:"Bardzo śliski – trudna adhezja do stołu."}],
  "PLA-COND":   ["PLA przewodzący", "spec", [210,230,220], 60, 1.30, 100, 6, 0, {abr:1, dry:[50,6], ret:0.6, p:500}],
  "COPPER":     ["Wypełniony miedzią/brązem", "spec", [195,220,210], 60, 3.90, 100, 6, 0, {abr:1, dry:[50,6], ret:0.6, p:400, note:"Bardzo ciężki – policzona masa jest ~3× większa."}],
  "STONE":      ["Kamień / ceramika (fill)", "spec", [200,230,215], 60, 1.50, 100, 6, 0, {abr:1, dry:[50,6], ret:0.6, p:200}],
  "MAGNET":     ["Magnetyczny (żelazo)", "spec", [195,220,210], 60, 2.60, 100, 6, 0, {abr:1, dry:[50,6], ret:0.6, p:300}],
  "PVB":        ["PVB (wygładzany alkoholem)", "spec", [205,225,215], 75, 1.08, 60, 10, 0, {dry:[45,6], ret:0.8, p:200, note:"Wygładzanie izopropanolem."}],

  "PVA":        ["PVA (rozpuszczalny w wodzie)", "sup", [190,220,205], 60, 1.23, 100, 6, 0, {dry:[55,8], ret:1.0, p:300, note:"Rozpuszczalna podpora dla PLA. Trzymaj suchy!"}],
  "BVOH":       ["BVOH", "sup", [200,230,215], 60, 1.14, 100, 6, 0, {dry:[55,8], ret:1.0, p:450}],
  "SUP-PLA":    ["Podpora odrywana dla PLA", "sup", [200,230,215], 60, 1.25, 100, 10, 0, {dry:[50,6], ret:0.8, p:200}],
  "SUP-PA":     ["Podpora dla PA/PET", "sup", [250,280,265], 80, 1.20, 0, 8, 40, {enc:1, dry:[80,8], ret:0.8, p:350}]
};

// Producenci: [nazwa, kraj, mnożnik ceny, oferowane materiały]
const BRANDS = [
  ["Fiberlogy", "PL", 1.15, ["PLA","PLA-MATTE","PLA-SILK","PLA-TOUGH","PLA-WOOD","rPLA","PLA-HS","PETG","PCTG","CPE","ABS","ASA","HIPS","PC-PBT","PA12","PA12-CF","PP","TPU64D","TPU85","PETG-CF"]],
  ["Spectrum", "PL", 1.1, ["PLA","PLA+","PLA-MATTE","PLA-SILK","PLA-GLOW","PLA-SPARK","PLA-HT","PLA-CF","PETG","PETG-CF","PCTG","ABS","ASA","ASA-CF","HIPS","PC","PA6","PA6-CF","TPU90","TPU95","PP"]],
  ["Devil Design", "PL", 0.95, ["PLA","PLA-MATTE","PLA-SILK","PLA-HS","PLA-SPARK","PLA-GLOW","PLA-WOOD","PETG","ABS+","ASA","TPU95"]],
  ["Rosa3D", "PL", 1.0, ["PLA","PLA-HS","PLA-SILK","PLA-MATTE","PLA-WOOD","PETG","PETG-CF","PCTG","ASA","ABS","PA12","TPU95","PVA"]],
  ["Prusament", "CZ", 1.2, ["PLA","PLA-HS","rPLA","PETG","PETG-CF","ASA","PC-BLEND","PC-CF","PA11","PVB","TPU95"]],
  ["Fillamentum", "CZ", 1.3, ["PLA","PLA-WOOD","PETG","CPE","ASA","ABS","PA6","TPU95","TPU90","PC-ABS"]],
  ["Bambu Lab", "CN", 1.1, ["PLA","PLA-MATTE","PLA-SILK","PLA-TOUGH","PLA-CF","PLA-GLOW","PLA-MARBLE","PLA-METAL","PLA-WOOD","PLA-SPARK","PLA-TRANS","PETG-HF","PETG-CF","PETG","ABS","ABS-GF","ASA","ASA-CF","PC","TPU95","TPU-HF","PA6-CF","PA6-GF","PAHT-CF","PET-CF","PPA-CF","PPS-CF","PVA","SUP-PLA","SUP-PA"]],
  ["Polymaker", "CN", 1.1, ["PLA","PLA+","PLA-MATTE","PLA-SILK","PLA-TOUGH","LW-PLA","PLA-HS","PETG","ABS","ASA","PC","PC-ABS","PC-PBT","PA6-CF","PA6-GF","PA12-CF","PET-CF","PPS-CF","TPU95","PVA","SUP-PLA","PVB"]],
  ["eSUN", "CN", 0.9, ["PLA+","PLA-MATTE","PLA-SILK","PLA-HS","PLA-GLOW","PLA-MARBLE","LW-PLA","PLA-CF","PETG","ABS+","ASA","HIPS","PC","TPU95","PA6-CF","PVA","BVOH"]],
  ["Sunlu", "CN", 0.8, ["PLA","PLA+","PLA-MATTE","PLA-SILK","PLA-HS","PLA-WOOD","PLA-MARBLE","PLA-GLOW","PLA-TRANS","PETG","ABS","ASA","TPU95"]],
  ["Elegoo", "CN", 0.8, ["PLA","PLA+","PLA-MATTE","PLA-SILK","PLA-HS","PLA-CF","PETG","ABS","ASA","TPU95"]],
  ["Creality", "CN", 0.85, ["PLA","PLA-HS","PLA-MATTE","PLA-SILK","PLA-CF","PETG","ABS","ASA","TPU95","PAHT-CF"]],
  ["Anycubic", "CN", 0.8, ["PLA","PLA+","PLA-MATTE","PLA-SILK","PLA-HS","PETG","ABS","ASA","TPU95"]],
  ["QIDI Tech", "CN", 1.0, ["PLA-HS","PLA-MATTE","PETG","ABS","ASA","PC-ABS","TPU95","PA12-CF","PAHT-CF","PET-CF","PPS-CF"]],
  ["Jayo", "CN", 0.75, ["PLA","PLA+","PLA-MATTE","PLA-SILK","PETG","TPU95"]],
  ["Eryone", "CN", 0.85, ["PLA","PLA-MATTE","PLA-SILK","PLA-SPARK","PETG","TPU95"]],
  ["Kingroon", "CN", 0.75, ["PLA","PLA-SILK","PETG","TPU95"]],
  ["Overture", "US", 0.9, ["PLA","PLA+","PLA-MATTE","PLA-SILK","PLA-HS","PETG","ABS","ASA","TPU95"]],
  ["Hatchbox", "US", 1.0, ["PLA","PLA-SILK","PLA-WOOD","PETG","ABS","TPU95"]],
  ["3DXTech", "US", 1.3, ["PETG-CF","ASA-CF","PC","PC-CF","PA6-CF","PEI9085","PEI1010","PEEK","PEKK","PPS","PVDF","PP"]],
  ["ColorFabb", "NL", 1.35, ["PLA","LW-PLA","PLA-WOOD","COPOLY","PETG-CF","PA6-CF","COPPER","TPU95"]],
  ["Formfutura", "NL", 1.25, ["PLA","ABS","ASA","PETG","TPU95","PP","HIPS","STONE","PVA"]],
  ["Extrudr", "AT", 1.3, ["PLA","PETG","ABS","ASA","TPU90","TPU95","PLA-WOOD"]],
  ["Azurefilm", "SI", 1.0, ["PLA","PLA-SILK","PLA-WOOD","PLA-GLOW","PETG","ABS","ASA","TPU95"]],
  ["3DJake", "DE", 0.9, ["PLA","PLA-MATTE","PLA-SILK","PLA-HS","PLA-GLOW","PETG","ABS","ASA","TPU95"]],
  ["Ultimaker", "NL", 1.6, ["PLA","PLA-TOUGH","PETG","ABS","PA6","CPE","PC","PP","TPU95","PVA","SUP-PLA"]],
  ["Verbatim", "JP", 1.1, ["PLA","PETG","ABS","PP","BVOH","TPE"]],
  ["BASF Ultrafuse", "DE", 1.6, ["PETG","ABS","PLA-TOUGH","PAHT-CF","PET-CF","PP","PP-GF","TPU64D","TPC","PA6-GF","PPS"]],
  ["Proto-pasta", "US", 1.4, ["PLA-COND","MAGNET","PLA-CF","COPPER"]],
  ["NinjaTek", "US", 1.5, ["TPU85","TPU95","TPU64D","TPE"]],
  ["Kimya", "FR", 1.5, ["PETG-CF","PC-CF","PA12-CF","PEKK","PLA-HT"]]
];

const FLAG = {PL:"🇵🇱", CZ:"🇨🇿", CN:"🇨🇳", US:"🇺🇸", NL:"🇳🇱", AT:"🇦🇹", SI:"🇸🇮", DE:"🇩🇪", JP:"🇯🇵", FR:"🇫🇷"};

function buildFilamentList() {
  const list = [];
  for (const [id, m] of Object.entries(MATERIALS)) {
    list.push(makeFil("Generic", "", 1, id, m));
  }
  for (const [brand, cc, mult, mats] of BRANDS) {
    for (const id of mats) if (MATERIALS[id]) list.push(makeFil(brand, cc, mult, id, MATERIALS[id]));
  }
  return list;
}
function makeFil(brand, cc, mult, id, m) {
  const o = m[8] || {};
  return {
    key: brand + "|" + id, brand, cc, mat: id, name: (brand === "Generic" ? "Generic " : brand + " ") + m[0],
    matName: m[0], group: m[1], tMin: m[2][0], tMax: m[2][1], nozzle: m[2][2], bed: m[3], density: m[4],
    fan: m[5], maxVol: m[6], chamber: m[7], enc: !!o.enc, abr: !!o.abr, flex: !!o.flex,
    dry: o.dry || null, retract: o.ret ?? 0.8, price: Math.round((o.p || 100) * mult), note: o.note || ""
  };
}

function buildPrinterList() {
  const list = [];
  for (const [vendor, arr] of Object.entries(PRINTER_DB)) {
    for (const [name, x, y, z, kin, fw, o] of arr) {
      list.push({vendor, name, x, y, z, kin, fw, fd: o.fd || 1.75, bowden: !!o.bow, enc: !!o.enc,
        maxT: o.maxT || 260, maxB: o.maxB || 100, maxV: o.v || 150, accel: o.a || 1500, round: !!o.round,
        center: !!o.center, hard: !!o.hard, custom: !!o.custom, tpl: o.tpl || (fw === "prusa" ? "prusa4" : fw)});
    }
  }
  return list;
}
