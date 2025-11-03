# CLAUDE.md

Leitfaden für Claude Code (claude.ai/code) beim Arbeiten mit diesem Repository.

## Projekt-Übersicht

**ioBroker.vis-2-widgets-deluxe** - Custom Widget Development Framework für ioBroker vis-2 mit Vite und Module Federation.

**Typ**: visualization-widgets (Pure UI)
**Author**: ingel81 (ingel81@sgeht.net)
**Repository**: https://github.com/ingel81/ioBroker.vis-2-widgets-deluxe
**Node**: >= 20.x

## 📚 Dokumentation

- **[.claude/docs/DEVELOPMENT.md](./.claude/docs/DEVELOPMENT.md)** - Umfassende Entwicklungsdokumentation (Workflow, Commands)
- **[.claude/docs/WIDGET_ARCHITECTURE.md](./.claude/docs/WIDGET_ARCHITECTURE.md)** - Modulare Widget-Architektur Richtlinien
- **[.claude/docs/TROUBLESHOOTING.md](./.claude/docs/TROUBLESHOOTING.md)** - Häufige Probleme und Lösungen

## Quick Start

```bash
# Einmalig: Dev-Server initialisieren
npm run dev:setup

# Development: Dev-Umgebung starten
npm run dev

# Production Build
npm run build
```

**Zugriff während Development:**

- Admin: http://127.0.0.1:8081
- vis-2 Editor: http://127.0.0.1:8082/vis-2/edit.html
- vis-2 Runtime: http://127.0.0.1:8082/vis-2/?main

## Development Workflow

**⚠️ WICHTIG: HMR funktioniert NICHT mit Module Federation!**

### Der Workflow

1. `npm run dev` starten (einmalig)
2. Widget-Dateien in `src-widgets/src/` bearbeiten
3. Warten auf:
    - Vite rebuild (~2s)
    - vis-2 auto-restart (~20s)
4. Browser manuell aktualisieren (F5)

**Merke**: ~20 Sekunden nach "vis-2 restarted" warten, dann Browser aktualisieren!

## Projekt-Struktur

```
ioBroker.vis-2-widgets-deluxe/
├── src-widgets/              # Widget-Quellcode
│   ├── src/
│   │   ├── HelloWorld.tsx   # Demo-Widget
│   │   ├── OneIconToRuleThemAll/ # Modulares Multi-Mode Widget
│   │   ├── Generic.tsx      # Basis-Klasse für alle Widgets
│   │   └── translations.ts  # i18n Übersetzungen
│   ├── build/               # Vite Output (Development)
│   └── vite.config.ts       # Module Federation Config
├── widgets/                  # Production builds (npm run build)
├── .dev-server/             # Dev-Server Umgebung
├── .claude/docs/            # Claude Code Dokumentation
├── tasks.js                 # Production Build-Script
└── io-package.json          # Widget-Metadaten
```

## Häufige Commands

```bash
# Development
npm run dev          # Dev-Umgebung starten (watch + auto-restart)
npm run dev:setup    # Dev-Server initialisieren (einmalig)

# Building & Testing
npm run build        # Production build
npm run check        # TypeScript check
npm run lint         # Code linten
npm run lint:fix     # ESLint auto-fix

# Release
npm run release-patch  # 0.1.0 → 0.1.1
npm run release-minor  # 0.1.0 → 0.2.0
npm run release-major  # 0.1.0 → 1.0.0
```

## Widget-Entwicklung

### Neues Widget erstellen

1. Widget-Datei in `src-widgets/src/MyWidget.tsx` erstellen
2. In `src-widgets/vite.config.ts` unter `exposes` registrieren
3. In `io-package.json` unter `components` hinzufügen
4. Übersetzungen in `src-widgets/src/translations.ts` ergänzen
5. `npm run build` ausführen

**Siehe [.claude/docs/DEVELOPMENT.md](./.claude/docs/DEVELOPMENT.md) für Details.**

### Widget-Architektur

Für komplexe Widgets (>500 Zeilen) empfehlen wir modulare Struktur:

```
WidgetName/
├── index.tsx           # Haupt-Komponente
├── types/              # TypeScript Definitionen
├── modes/              # Geschäftslogik-Klassen
├── components/         # UI-Komponenten
├── config/             # Widget-Konfiguration
└── utils/              # Hilfsfunktionen
```

**Siehe [.claude/docs/WIDGET_ARCHITECTURE.md](./.claude/docs/WIDGET_ARCHITECTURE.md) für Details.**

## Wichtige Hinweise

### Kein HMR

Module Federation Remotes können nicht hot-reloaded werden.
**Lösung**: Build watch + manueller Browser-Refresh (~20s Wartezeit)

### Widget-Registrierung

Jedes Widget benötigt:

- ✓ `visSetLabel: 'set_label'` in `getWidgetInfo()`
- ✓ Eintrag in `vite.config.ts` exposes
- ✓ Eintrag in `io-package.json` components
- ✓ Übersetzungen (min. EN + DE)

### Icons

Icon-Rendering via `@iobroker/adapter-react-v5`:

```typescript
import { Icon } from '@iobroker/adapter-react-v5';
<Icon src={iconDataUrl} style={{ color: '#fff' }} />
```

### Layout

Immer `boxSizing: 'border-box'` für Container mit Padding verwenden!

### i18n / Übersetzungen

**Präfix wird automatisch hinzugefügt!** vis-2 Framework fügt `translations.prefix` (z.B. `vis_2_widgets_deluxe_`) zu allen Keys hinzu.

```typescript
// translations.ts
{ en: { heating_valve_label: 'Valve' }, prefix: 'vis_2_widgets_deluxe_' }

// Zur Laufzeit wird Key zu: 'vis_2_widgets_deluxe_heating_valve_label'
private translate(key: string) {
    const fullKey = `${translations.prefix}${key}`;
    return translations[lang][fullKey];
}
```

## Troubleshooting

Für häufige Probleme siehe **[TROUBLESHOOTING.md](./.claude/docs/TROUBLESHOOTING.md)**.

**Quick-Fixes:**

- **Widget-Settings werden nicht übernommen?** → Browser komplett neu laden (F5)
- **Code-Änderungen nicht sichtbar?** → 20s warten nach "vis-2 restarted", dann F5
- **Cache-Problem?** → vis-2 stoppen, Browser schließen, vis-2 starten, Browser öffnen

## Commit-Richtlinien

**⚠️ WICHTIG**: Commits nur auf Anweisung durchführen!

- Einzeilige Commit-Message
- Kein Claude Footer
- Kein Co-Author

---

_Letzte Aktualisierung: 2025-10-22_

- du brauchst hier nicht bauen...es läuft nebenher immer ein prozess der npm run dev ausführt
