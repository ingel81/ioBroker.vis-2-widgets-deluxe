# Troubleshooting Guide

Häufige Probleme und deren Lösungen beim Entwickeln mit ioBroker.vis-2-widgets-deluxe.

---

## Widget-Einstellungen werden nicht sofort übernommen

### Problem

**Symptome:**
- Änderungen an Widget-Einstellungen im vis-2 Editor werden nicht wirksam
- Widget verhält sich so, als hätte es noch die alten Werte
- Betrifft **ALLE Widget-Einstellungen** (nicht nur spezifische Felder)
- Tritt sowohl bei OIDs als auch bei einfachen Werten auf (Numbers, Strings, Booleans)

### Ursache

**React Binding/Reactivity Problem:**
- vis-2 Editor ändert die Widget-Settings (rxData)
- Widget-Komponente erhält die neuen Props via `componentDidUpdate()`
- Mode-Logic-Klassen werden aber **NICHT automatisch neu initialisiert**
- Werte werden nur im **Konstruktor** der Mode-Logic-Klassen gesetzt
- `componentDidUpdate()` muss explizit auf Config-Änderungen reagieren und Re-Initialisierung triggern

**Beispiel:**
```typescript
// ❌ Problem: Mode-Logic wird nur im constructor initialisiert
constructor(props) {
    super(props);
    this.windowShutterMode = new WindowShutterModeLogic({
        shutterUpValue: this.state.rxData.shutterUpValue,  // Wird nie aktualisiert!
    });
}

// ✓ Lösung: Re-Initialisierung in componentDidUpdate()
componentDidUpdate(prevProps, prevState) {
    if (this.state.rxData.shutterUpValue !== prevState.rxData.shutterUpValue) {
        // Mode-Logic neu initialisieren mit neuen Werten
        this.windowShutterMode = new WindowShutterModeLogic({
            shutterUpValue: this.state.rxData.shutterUpValue,
        });
    }
}
```

### Workaround (Entwicklung)

1. **Sofort-Workaround:**
   - Komplettes Browser-Reload (F5)
   - Oder Hard-Refresh (Ctrl+Shift+R / Cmd+Shift+R)

2. **Sicherer Workflow:**
   ```bash
   # Nach Widget-Config-Änderungen:
   1. Settings speichern
   2. Browser komplett neu laden (F5)
   3. Widget testen
   ```

3. **Bei hartnäckigen Caching-Problemen:**
   ```bash
   # vis-2 Adapter komplett neu starten
   ./.dev-server/default/iob restart vis-2
   # 20 Sekunden warten
   # Browser KOMPLETT schließen (alle Fenster/Tabs)
   # Browser neu öffnen
   ```

### Permanente Lösung (Code-Fix)

**Für neue Mode-Config-Felder:**
1. In `index.tsx` → `componentDidUpdate()` prüfen, ob sich das Feld geändert hat
2. Bei Änderung: Mode-Logic neu initialisieren

**Beispiel aus WindowShutterMode:**
```typescript
componentDidUpdate(prevProps, prevState) {
    const prevRxData = prevState.rxData;
    const configChanged =
        this.state.rxData.shutterUpValue !== prevRxData.shutterUpValue ||
        this.state.rxData.shutterDownValue !== prevRxData.shutterDownValue;

    if (configChanged) {
        // Re-initialisierung
        this.windowShutterMode = new WindowShutterModeLogic({
            shutterUpValue: this.state.rxData.shutterUpValue,
            shutterDownValue: this.state.rxData.shutterDownValue,
            // ... andere Felder
        }, this.socket, this.setState, this.setValue);

        // Neu initialisieren
        await this.windowShutterMode.initialize();
    }
}
```

---

## Module Federation Cache-Probleme

### Problem

**Symptome:**
- Code-Änderungen werden nicht sichtbar, obwohl Vite rebuild erfolgreich war
- Alte Widget-Versionen werden geladen
- Browser scheint gecachte Version zu verwenden

### Ursache

Module Federation cached Remote-Module aggressiv (Browser + Vite).

### Lösung

**Standard-Workflow:**
```bash
# 1. Code ändern
# 2. Auf Vite rebuild warten (~2s)
# 3. Auf "vis-2 restarted" warten (~20s)
# 4. Browser aktualisieren (F5)
```

**Bei hartnäckigem Cache:**
```bash
# 1. vis-2 stoppen
./.dev-server/default/iob stop vis-2

# 2. Browser KOMPLETT schließen (alle Fenster!)

# 3. vis-2 starten
./.dev-server/default/iob start vis-2

# 4. 20 Sekunden warten

# 5. Browser neu öffnen
```

**Hard Refresh:**
- Chrome/Firefox: `Ctrl+Shift+R`
- macOS: `Cmd+Shift+R`

---

## Änderungen nicht sichtbar

### Problem

Widget-Code wurde geändert, aber Änderungen erscheinen nicht im Browser.

### Checkliste

1. **Vite Rebuild abgeschlossen?**
   ```
   ✓ Terminal: "built in XXms"
   ```

2. **vis-2 Adapter neu gestartet?**
   ```
   ✓ Terminal: "vis-2 restarted"
   ```

3. **20 Sekunden gewartet?**
   ```
   ⏱ vis-2 braucht ~20s zum vollständigen Start
   ```

4. **Browser aktualisiert?**
   ```
   F5 oder Ctrl+Shift+R (Hard Refresh)
   ```

5. **Immer noch nicht?**
   ```bash
   # vis-2 komplett neu starten + Browser schließen
   ./.dev-server/default/iob stop vis-2
   # Browser ALLE Fenster schließen
   ./.dev-server/default/iob start vis-2
   # 20s warten, Browser neu öffnen
   ```

---

## Build-Fehler

### TypeScript-Fehler

```bash
# TypeScript-Fehler anzeigen
npm run check

# Häufige Fehler:
# - Fehlende Type-Imports
# - Ungültige Property-Zugriffe
# - Nicht-übereinstimmende Typen
```

### ESLint-Fehler

```bash
# Lint-Fehler anzeigen
npm run lint

# Auto-Fix versuchen
npm run lint:fix
```

### Build schlägt fehl

```bash
# 1. node_modules löschen und neu installieren
rm -rf node_modules package-lock.json
npm install

# 2. Build-Cache löschen
rm -rf src-widgets/build widgets

# 3. Erneut builden
npm run build
```

---

## Widget nicht in Palette sichtbar

### Problem

Neues Widget erscheint nicht in der vis-2 Widget-Palette.

### Checkliste

**1. Widget in `vite.config.ts` exposes registriert?**
```typescript
// src-widgets/vite.config.ts
exposes: {
    './MyWidget': './src/MyWidget.tsx',  // ← Hier!
}
```

**2. Widget in `io-package.json` components registriert?**
```json
{
  "native": {
    "components": [
      "vis-2-widgets-deluxe/MyWidget"  // ← Hier!
    ]
  }
}
```

**3. Build ausgeführt?**
```bash
npm run build
```

**4. vis-2 Adapter neu gestartet?**
```bash
./.dev-server/default/iob restart vis-2
# Oder in Production: Adapter über Admin neu starten
```

**5. Browser-Cache geleert?**
```
Ctrl+Shift+R (Hard Refresh)
```

---

## Übersetzungen funktionieren nicht

### Problem

Übersetzungs-Keys werden nicht aufgelöst oder zeigen falschen Text.

### Debugging

**1. Im Browser Developer Console:**
```javascript
// Verfügbare Keys prüfen
Object.keys(translations.de)

// Spezifischen Key suchen
Object.keys(translations.de).filter(k => k.includes('valve'))
// Erwartetes Ergebnis: ['vis_2_widgets_deluxe_heating_valve_label']
```

**2. Prefix wird automatisch hinzugefügt!**
```typescript
// ❌ FALSCH: Prefix manuell hinzufügen
this.translate('vis_2_widgets_deluxe_heating_valve_label')

// ✓ RICHTIG: Nur Key ohne Prefix
this.translate('heating_valve_label')

// translations.ts:
{
  en: { heating_valve_label: 'Valve' },
  prefix: 'vis_2_widgets_deluxe_'  // ← Wird automatisch hinzugefügt
}
```

**3. Translation-Key in `widgetInfo.ts` korrekt?**
```typescript
// widgetInfo.ts
{
    name: 'heatingValvePositionOid',
    label: 'heating_valve_label',  // ← Ohne Prefix!
}
```

**4. Übersetzung in `translations.ts` vorhanden?**
```typescript
// src-widgets/src/translations.ts
export default {
    en: {
        heating_valve_label: 'Valve Position',
    },
    de: {
        heating_valve_label: 'Ventilstellung',
    },
    prefix: 'vis_2_widgets_deluxe_',
};
```

---

## KNX State Role/Type Probleme

### Problem

**Symptome:**
- KNX-Kommandos lösen READ statt WRITE aus
- Button sendet falschen Wert
- Rolladen fährt in falsche Richtung

### Ursache

**ioBroker State Role/Type falsch konfiguriert:**
- `role: "indicator"` = Read-Only (Statusrückmeldung)
- `role: "switch"` / `role: "button.*"` = Write (Kommando)

**DPT-Typen (KNX):**
- `DPT 1.007` (Step): 0 = decrease, 1 = increase (Dimmer)
- `DPT 1.008` (Up/Down): 0 = Up, 1 = Down (Rolladen)
- `DPT 1.010` (Start/Stop): 0 = Stop, 1 = Start

### Lösung

**1. State Role prüfen:**
```javascript
// Im ioBroker Admin → Objects → State öffnen
{
  "role": "switch",      // ✓ Richtig für Commands
  // NICHT:
  "role": "indicator"    // ❌ Nur für Status-Rückmeldung
}
```

**2. DPT-Typ prüfen (KNX):**
```javascript
// Für Rolladen Up/Down/Stop:
{
  "role": "button.play",
  "type": "boolean",
  "read": false,
  "write": true
}
```

**3. Widget-Werte anpassen:**
```
Widget-Settings:
- Hoch-Wert: 0 (für DPT 1.008 Up)
- Runter-Wert: 1 (für DPT 1.008 Down)
- Stop-Wert: true (Boolean für DPT 1.010)
```

### Beispiel: Rolladen Stop-Button

**Problem:** Stop-Button löst READ aus
**Ursache:** State Role = `indicator` statt `switch`
**Lösung:**
```javascript
// ioBroker Object:
{
  "_id": "knx.0.1/2/3",
  "common": {
    "name": "Rolladen Stop",
    "role": "switch",        // ← Hier ändern!
    "type": "boolean",
    "read": false,
    "write": true
  }
}
```

---

## Development Server Probleme

### vis-2 startet nicht

```bash
# Logs prüfen
./.dev-server/default/iob logs vis-2

# Adapter-Status prüfen
./.dev-server/default/iob list instances

# Neu starten
./.dev-server/default/iob restart vis-2
```

### Port bereits belegt

```bash
# Standard-Ports:
# - Admin: 8081
# - vis-2: 8082

# Prozess beenden
pkill -f "ioBroker"

# Dev-Server neu aufsetzen
npm run dev:setup
```

### npm run dev hängt

```bash
# Prozess beenden
Ctrl+C

# Background-Prozesse killen
pkill -f "node tasks"
pkill -f "vite"

# Neu starten
npm run dev
```

---

## Weitere Hilfe

- **Development Docs:** [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Widget-Architektur:** [WIDGET_ARCHITECTURE.md](./WIDGET_ARCHITECTURE.md)
- **GitHub Issues:** https://github.com/ingel81/ioBroker.vis-2-widgets-deluxe/issues

---

_Letzte Aktualisierung: 2025-11-02_
