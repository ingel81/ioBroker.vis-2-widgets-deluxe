# Development Guide

Umfassende Entwicklungsdokumentation für ioBroker.vis-2-widgets-deluxe.

## Quick Start

### Initial Setup (einmalig)
```bash
npm run dev:setup  # Initialisiert dev-server
```

### Development
```bash
npm run dev  # Startet dev environment
```

Dies startet:
- **ioBroker dev-server** (Backend) auf Port 8082
- **Vite build watch** (auto-rebuild bei Änderungen)
- **File sync + vis-2 auto-restart** (bei jedem Build)

**Zugriff:**
- Admin: http://localhost:8082/admin
- vis-2: http://localhost:8082/vis-2-beta/

## Development Workflow

**WICHTIG: HMR (Hot Module Replacement) funktioniert NICHT mit Module Federation. Dies ist eine bekannte Einschränkung.**

### Der echte Workflow

1. **Dev-Umgebung starten (einmalig):**
   ```bash
   npm run dev
   ```

2. **Widget-Dateien bearbeiten** in `src-widgets/src/`

3. **Warten auf automatische Verarbeitung:**
   - Vite rebuilds (~2 Sekunden) - achte auf "built in XXXms"
   - Dateien werden nach widgets/ kopiert
   - **vis-2 Adapter startet automatisch neu** - achte auf "vis-2 restarted"
   - **~20 Sekunden warten** bis vis-2 vollständig neugestartet ist

4. **Browser aktualisieren** (F5) um Änderungen zu sehen
   - Änderungen sollten nun sichtbar sein!
   - ⚠️ **Wichtig**: Nicht sofort aktualisieren - ~20 Sekunden nach Restart-Meldung warten!

### Warum kein HMR?

Module Federation lädt Widgets als "Remotes" zur Laufzeit. Vites HMR kann Remotes nicht dynamisch aktualisieren. Das gilt für ALLE vis-2 Widget-Adapter, die Module Federation verwenden.

### Wie vis-2 Restart funktioniert

Der Dev-Workflow führt automatisch aus:
```bash
./.dev-server/default/iob restart vis-2
```

Dies startet die vis-2 Adapter-Instanz innerhalb ioBroker neu, was den Widget-Cache leert und Widgets von der Festplatte neu lädt. Das ist der Schlüssel zur Live-Development!

## Projekt-Struktur

```
ioBroker.vis-2-widgets-deluxe/
├── src-widgets/              # Widget-Quellcode
│   ├── src/
│   │   ├── HelloWorld.tsx   # Beispiel-Widget
│   │   ├── OneIconToRuleThemAll/ # Modulares Widget
│   │   ├── Generic.tsx      # Basis-Klasse
│   │   └── translations.ts  # i18n
│   ├── build/               # Vite-Output
│   ├── vite.config.ts       # Module Federation Config
│   └── package.json
├── widgets/                  # Production builds (von tasks.js)
├── .dev-server/             # Dev-server Umgebung
├── .claude/                 # Claude Code Dokumentation
│   └── docs/                # Entwickler-Dokumentation
├── dev.sh                   # Development-Script
├── tasks.js                 # Production build
└── io-package.json          # Widget-Metadaten
```

## Neue Widgets erstellen

### 1. Widget-Datei erstellen

```typescript
// src-widgets/src/MyWidget.tsx
import React from 'react';
import Generic from './Generic';
import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

class MyWidget extends Generic<MyWidgetData, MyWidgetState> {
    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplDeluxeMyWidget',
            visSet: 'vis-2-widgets-deluxe',
            visSetLabel: 'set_label',
            visWidgetLabel: 'my_widget',
            visName: 'My Widget',
            visAttrs: [/* Konfiguration */],
            visDefaultStyle: { width: 400, height: 300 }
        };
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        return <div>My Widget Content</div>;
    }
}

export default MyWidget;
```

### 2. In vite.config.ts registrieren

```typescript
exposes: {
    './HelloWorld': './src/HelloWorld',
    './MyWidget': './src/MyWidget',  // Hier hinzufügen
    './translations': './src/translations.ts',
}
```

### 3. In io-package.json registrieren

```json
"visWidgets": {
    "vis2deluxeWidgets": {
        "components": ["HelloWorld", "MyWidget"]
    }
}
```

### 4. Rebuild

```bash
npm run build  # Production build
```

Oder wenn dev läuft, einfach editieren und Browser aktualisieren.

## Commands

```bash
# Development
npm run dev          # Startet dev environment
npm run dev:setup    # Initialisiert dev-server

# Building
npm run build        # Production build
npm run check        # TypeScript check

# Testing
npm test             # Tests ausführen
npm run lint         # Code linten
npm run lint:fix     # Auto-fix lint issues

# Release
npm run release-patch  # 0.1.0 → 0.1.1
npm run release-minor  # 0.1.0 → 0.2.0
npm run release-major  # 0.1.0 → 1.0.0
```

## Troubleshooting

### Änderungen werden nicht angezeigt?

1. **Auf vis-2 Restart warten** - Achte auf "vis-2 restarted" in der Konsole
2. **~20 Sekunden warten** - vis-2 braucht Zeit zum vollständigen Neustart
3. **Browser aktualisieren** - F5 oder Ctrl+R
4. **Hard refresh falls nötig** - Ctrl+Shift+R
5. **Cache leeren falls nötig** - F12 → Application → Clear Storage

**Merke**: Der Workflow funktioniert, aber vis-2 braucht ~20 Sekunden zum Neustart nach jeder Änderung.

### Widget nicht in der Palette?

1. `io-package.json` components array prüfen
2. `vite.config.ts` exposes prüfen
3. `npm run build` ausführen
4. Bei Bedarf `dev-server upload` ausführen

### Build-Fehler?

1. TypeScript-Fehler prüfen: `npm run check`
2. Konsolen-Output von Vite prüfen
3. Alle Imports verifizieren

## Technische Details

### Development Architecture

Der Development-Workflow nutzt:
1. **Vite build watch** - Überwacht `src-widgets/src/` und rebuildet bei Änderungen
2. **watch-and-copy.js** - Pollt `src-widgets/build/` und kopiert nach `widgets/`
3. **Symlink** - `.dev-server/.../vis-2-widgets-deluxe → widgets/vis-2-widgets-deluxe`
4. **Auto-restart** - Startet vis-2 Adapter-Instanz neu via `./.dev-server/default/iob restart vis-2`

Dateifluss: `src-widgets/src/` → (vite) → `src-widgets/build/` → (copy) → `widgets/` → (symlink) → `.dev-server/`

### Module Federation

Widgets werden als Module Federation Remotes geladen:
- **Development**: Built files in `src-widgets/build/`
- **Production**: Built files in `widgets/`
- **Entry point**: `customWidgets.js`

### Build Process

**Development (npm run dev):**
```
Edit file → Vite rebuild (~2s) → Browser refresh (manuell)
```

**Production (npm run build):**
```
tasks.js → npm install → tsc → vite build → copy files
```

### File Watching

- Vite nutzt native file watchers (chokidar)
- Polling aktiviert mit 1s Intervall für Zuverlässigkeit
- Überwacht alle Dateien in `src-widgets/src/`

## Wichtige Hinweise

### Kein HMR

- HMR erfordert Host-Application zum Reload der Remotes
- Module Federation Remotes können nicht hot-reloaded werden
- Dies betrifft ALLE vis-2 Widget-Adapter
- **Lösung**: Build watch + Browser refresh

### Widget State

Widgets sind React-Komponenten, die Generic erweitern:
- `this.state.rxData` - Widget-Konfiguration
- `this.state.values` - ioBroker State-Werte
- `this.state.editMode` - Edit-Mode Flag

### Development vs Production

- **Development**: `vite build --watch` in src-widgets/
- **Production**: `node tasks` buildet nach widgets/
- Beide nutzen dieselbe vite.config.ts

## Best Practices

1. **Immer Browser aktualisieren** nach Änderungen
2. **Konsole prüfen** für Build-Completion
3. **TypeScript verwenden** - fängt Fehler früh ab
4. **Lint vor Commits** ausführen
5. **Im Edit-Mode testen** - die meisten Features sind dort sichtbar

## Widget Development Guidelines

### Translations

Alle Übersetzungen leben in `src-widgets/src/translations.ts`:

```typescript
const translations = {
    en: {
        set_label: 'Deluxe Widgets',    // Widget-Set Name (ERFORDERLICH)
        my_widget: 'My Widget',         // Widget-Name
        my_section: 'Deluxe - Section', // Abschnitts-Label
    },
    de: {
        set_label: 'Deluxe Widgets',
        my_widget: 'Mein Widget',
        my_section: 'Deluxe - Abschnitt',
    },
    prefix: 'vis_2_widgets_deluxe_',
};
```

### Icon Rendering

**WICHTIG**: Nutze die `Icon`-Komponente von `@iobroker/adapter-react-v5` für data URL Icons (SVG base64).

```typescript
import { Icon } from '@iobroker/adapter-react-v5';

// Im Rendering:
<Icon
    src={icon}  // data:image/svg+xml;base64,... oder http://...
    style={{
        width: iconSize,
        height: iconSize,
        color: iconColor,  // Funktioniert mit SVG currentColor!
    }}
/>
```

### Layout und Styling

**WICHTIG**: Immer `boxSizing: 'border-box'` für Card-Container mit Padding verwenden.

```typescript
<Box
    sx={{
        backgroundColor: '#ffffff',
        borderRadius: 1,
        boxShadow: 1,
        height: '100%',
        width: '100%',
        padding: 1,
        boxSizing: 'border-box',  // ERFORDERLICH: inkludiert padding in Dimensionen
        overflow: 'hidden',        // Verhindert Content-Overflow
        margin: 0,                 // MUI Defaults zurücksetzen
    }}
>
    {content}
</Box>
```

## Requirements

- Node.js 20 oder höher
- npm oder yarn
- ioBroker dev-server: `npm i -g @iobroker/dev-server`

---
*Letzte Aktualisierung: 2025-10-20*
