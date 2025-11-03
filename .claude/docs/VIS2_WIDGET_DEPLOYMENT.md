# vis-2 Widget Deployment Problem & Lösung

## Problem

Nach einem Widget-Update über npm erscheinen die Widgets nicht im vis-2 Editor:
- Browser Console: `404 Not Found` für `customWidgets.js`
- Fehler: `remoteEntryExports is undefined`
- Widgets nicht in der Widget-Palette sichtbar

## Root Cause

**vis-2's Widget-Synchronisations-Mechanismus wird durch alte/kaputte Kopien blockiert.**

### Wie vis-2 Widgets lädt (3-stufiger Prozess):

1. **Sync zu vis-2/www/widgets/**
   - Bei vis-2 Start/Restart ruft vis-2 `syncWidgetSets()` auf
   - Kopiert von `node_modules/iobroker.vis-2-widgets-*/widgets/` → `node_modules/iobroker.vis-2/www/widgets/`
   - **Prüft Checksummen** - wenn Dateien identisch sind, wird NICHT neu kopiert

2. **Upload ins File-System**
   - vis-2 uploaded `www/widgets/` automatisch ins Adapter-File-System
   - Ziel: `/opt/iobroker/iobroker-data/files/vis-2/widgets/`

3. **Browser lädt von File-System**
   - Browser lädt: `http://localhost:8082/vis-2/widgets/vis-2-widgets-deluxe/customWidgets.js`
   - vis-2 serviert aus: `/opt/iobroker/iobroker-data/files/vis-2/widgets/`
   - **NICHT** aus `node_modules/iobroker.vis-2/www/widgets/`!

### Das Problem mit Updates

Nach `npm install iobroker.vis-2-widgets-deluxe@0.3.5`:
- Neue Dateien landen in `node_modules/iobroker.vis-2-widgets-deluxe/widgets/`
- **ABER:** Alte Kopie in `vis-2/www/widgets/vis-2-widgets-deluxe/` hat gleiche Checksumme (oder ist korrupt)
- vis-2's Checksum-Vergleich blockiert das Re-Sync
- Widgets werden nie ins File-System uploaded
- Browser bekommt 404

## Die Lösung

**Nach jedem npm Update auf dem Produktiv-Server:**

```bash
# 1. Lösche die alte Kopie aus vis-2/www/widgets
docker exec iobroker bash -c "rm -rf /opt/iobroker/node_modules/iobroker.vis-2/www/widgets/vis-2-widgets-deluxe"

# 2. Restart vis-2 triggert automatisches Re-Sync
docker exec iobroker bash -c "iobroker restart vis-2.0"

# 3. Warten (~30 Sekunden)
sleep 30

# 4. Verifizieren
docker exec iobroker bash -c "curl -I http://localhost:8082/vis-2/widgets/vis-2-widgets-deluxe/customWidgets.js" | grep "200 OK"

# 5. Im Browser: Hard Refresh (Ctrl+Shift+R)
```

### One-Liner für schnelles Update:

```bash
docker exec iobroker bash -c "rm -rf /opt/iobroker/node_modules/iobroker.vis-2/www/widgets/vis-2-widgets-deluxe && iobroker restart vis-2.0" && echo "Warte 30 Sekunden..." && sleep 30 && echo "Update abgeschlossen - Browser refreshen!"
```

## Verzeichnis-Struktur erklärt

```
/opt/iobroker/
├── node_modules/
│   ├── iobroker.vis-2-widgets-deluxe/
│   │   └── widgets/
│   │       └── vis-2-widgets-deluxe/       # [1] npm install legt Dateien hier ab
│   │           ├── customWidgets.js
│   │           └── assets/
│   │
│   └── iobroker.vis-2/
│       └── www/widgets/
│           └── vis-2-widgets-deluxe/       # [2] vis-2 kopiert hierhin (syncWidgetSets)
│               ├── customWidgets.js        #     ⚠️ Alte Kopien blockieren Update!
│               └── assets/
│
└── iobroker-data/
    └── files/
        └── vis-2/
            └── widgets/
                └── vis-2-widgets-deluxe/   # [3] vis-2 uploaded hierhin (File-System)
                    ├── customWidgets.js    #     Browser lädt von hier!
                    └── assets/
```

## Warum funktioniert `iobroker upload vis-2-widgets-deluxe` nicht?

`iobroker upload` ist für **Adapter-Uploads**, nicht für Widget-Dateien:
- ✓ Kopiert Admin-Icons (`admin/`)
- ✓ Updated Adapter-Metadaten
- ✗ **Ignoriert** Widget-Dateien (`widgets/`)

vis-2 hat einen **eigenen** Sync-Mechanismus (`syncWidgetSets`), der aber durch alte Kopien blockiert wird.

## Vergleich: Warum funktionieren material/inventwo automatisch?

- **material/inventwo:** Via ioBroker Adapter-UI installiert → saubere Erst-Installation
- **deluxe:** Via npm manuell installiert → alte Kopien aus früheren Versuchen blockieren Updates

## Diagnostic Script

Falls Probleme auftreten, Diagnose ausführen:

```bash
docker exec iobroker bash -c "
echo '=== NPM Package ===' &&
ls -lh /opt/iobroker/node_modules/iobroker.vis-2-widgets-deluxe/widgets/vis-2-widgets-deluxe/customWidgets.js &&
echo '' &&
echo '=== vis-2 www/widgets ===' &&
ls -lh /opt/iobroker/node_modules/iobroker.vis-2/www/widgets/vis-2-widgets-deluxe/customWidgets.js &&
echo '' &&
echo '=== File-System (wo Browser lädt) ===' &&
ls -lh /opt/iobroker/iobroker-data/files/vis-2/widgets/vis-2-widgets-deluxe/customWidgets.js &&
echo '' &&
echo '=== HTTP Test ===' &&
curl -I http://localhost:8082/vis-2/widgets/vis-2-widgets-deluxe/customWidgets.js | grep HTTP
"
```

**Erwartete Ausgabe bei funktionierendem Setup:**
- Alle 3 Dateien existieren
- Alle 3 haben **identische Timestamps**
- HTTP Test zeigt: `HTTP/1.1 200 OK`

## Troubleshooting

### Problem: 404 nach Update

**Symptom:** Browser zeigt `404 Not Found` für `customWidgets.js`

**Diagnose:**
```bash
# Prüfe Timestamps
docker exec iobroker bash -c "stat /opt/iobroker/node_modules/iobroker.vis-2-widgets-deluxe/widgets/vis-2-widgets-deluxe/customWidgets.js | grep Modify"
docker exec iobroker bash -c "stat /opt/iobroker/node_modules/iobroker.vis-2/www/widgets/vis-2-widgets-deluxe/customWidgets.js | grep Modify"
docker exec iobroker bash -c "stat /opt/iobroker/iobroker-data/files/vis-2/widgets/vis-2-widgets-deluxe/customWidgets.js | grep Modify"
```

**Lösung:** Timestamps unterschiedlich → Alte Kopie löschen (siehe "Die Lösung" oben)

### Problem: vis-2 startet nicht neu

```bash
docker exec iobroker bash -c "iobroker stop vis-2.0 && sleep 5 && iobroker start vis-2.0 && sleep 30"
```

### Problem: Browser cached alte Version

```bash
# 1. Browser komplett schließen (alle Fenster/Tabs!)
# 2. Browser neu öffnen
# 3. Hard Refresh: Ctrl+Shift+R (Windows/Linux) oder Cmd+Shift+R (Mac)
```

### Problem: Permission denied

```bash
docker exec iobroker bash -c "chown -R iobroker:users /opt/iobroker/node_modules/iobroker.vis-2/www/widgets/vis-2-widgets-deluxe"
```

## Zukünftige Updates - Workflow

**Bei jedem Release von vis-2-widgets-deluxe:**

1. **Lokal:** `npm run release-patch/minor/major` (triggert GitHub Action)
2. **GitHub Action:** Baut und published zu npm
3. **Prod-Server (manuell):**
   ```bash
   # Im Docker Container
   docker exec -it iobroker bash

   # npm Update
   npm install iobroker.vis-2-widgets-deluxe@latest

   # Instanz erstellen (falls nicht vorhanden)
   iobroker add vis-2-widgets-deluxe 0

   # Alte Kopie löschen & vis-2 restart
   rm -rf /opt/iobroker/node_modules/iobroker.vis-2/www/widgets/vis-2-widgets-deluxe
   iobroker restart vis-2.0

   # Warten
   sleep 30

   # Test
   curl -I http://localhost:8082/vis-2/widgets/vis-2-widgets-deluxe/customWidgets.js
   ```
4. **Browser:** Hard Refresh (Ctrl+Shift+R)

## Lessons Learned

1. ✓ vis-2 hat einen 3-stufigen Widget-Sync-Mechanismus
2. ✓ Checksum-Vergleich verhindert unnötige Re-Syncs (aber blockiert auch Updates)
3. ✓ Alte Kopien in `vis-2/www/widgets/` müssen gelöscht werden
4. ✓ `iobroker upload` ist **nicht** für Widget-Dateien
5. ✓ vis-2 serviert aus File-System (`iobroker-data`), nicht aus `www/`
6. ✓ Adapter-Instanz muss existieren (`system.adapter.vis-2-widgets-deluxe.0`)

---

**Erstellt:** 2025-11-02
**Gelöst:** 2025-11-02 21:14
**Problem-ID:** vis-2-widget-sync-blocked-by-old-copy
**Status:** ✅ Gelöst - Workaround dokumentiert
