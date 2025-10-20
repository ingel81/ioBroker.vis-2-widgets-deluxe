# Widget Architecture Guidelines

Diese Datei dokumentiert das modulare Architektur-Prinzip für Widgets in diesem Projekt.

## 📋 Inhaltsverzeichnis

- [Übersicht](#übersicht)
- [Verzeichnisstruktur](#verzeichnisstruktur)
- [Komponenten-Typen](#komponenten-typen)
- [Best Practices](#best-practices)
- [Beispiel: OneIconToRuleThemAll](#beispiel-oneicontorulethemall)
- [Migration bestehender Widgets](#migration-bestehender-widgets)

---

## Übersicht

**Problem:** Monolithische Widget-Dateien mit 1000+ Zeilen Code sind schwer wartbar und testbar.

**Lösung:** Modulare Architektur mit klarer Separation of Concerns.

### Prinzipien

1. **Single Responsibility**: Jede Datei hat genau eine Verantwortung
2. **Modularity**: Funktionalität ist in wiederverwendbare Module aufgeteilt
3. **Testability**: Logik ist isoliert und kann unabhängig getestet werden
4. **Maintainability**: Durchschnittlich ~100 Zeilen pro Datei statt 1000+
5. **Extensibility**: Neue Features lassen sich einfach als neue Module hinzufügen

---

## Verzeichnisstruktur

Für komplexe Widgets empfehlen wir folgende Struktur:

```
WidgetName/
├── index.tsx                    # Haupt-Widget-Komponente (~200-400 Zeilen)
├── types/
│   ├── index.ts                 # Interfaces, Enums, Types
│   ├── constants.ts             # Konstanten, Type Guards
│   └── socket.ts                # Socket-Interface (falls nötig)
├── modes/                       # Geschäftslogik-Klassen (bei Multi-Mode Widgets)
│   ├── ModeA.ts                 # Logik für Mode A
│   ├── ModeB.ts                 # Logik für Mode B
│   └── ModeC.ts                 # Logik für Mode C
├── components/                  # UI-Komponenten
│   ├── ComponentA.tsx           # Wiederverwendbare UI-Komponente
│   ├── ComponentB.tsx           # Dialog oder spezielle UI
│   └── ComponentC.tsx           # Weitere Komponenten
├── config/
│   └── widgetInfo.ts            # Widget-Konfiguration (visAttrs)
└── utils/                       # Hilfsfunktionen
    ├── formatters.ts            # Formatierungs-Funktionen
    └── helpers.ts               # Weitere Helpers

# Re-Export im Root für Kompatibilität
WidgetName.tsx                   # Re-export: export { default } from './WidgetName'
```

---

## Komponenten-Typen

### 1. **index.tsx** - Haupt-Komponente

Die Haupt-Widget-Komponente orchestriert alle Module:

```typescript
import Generic from '../Generic';
import { getWidgetInfo } from './config/widgetInfo';
import { ModeALogic } from './modes/ModeA';
import { ComponentA } from './components/ComponentA';

class MyWidget extends Generic<MyWidgetRxData, MyWidgetState> {
    private modeA!: ModeALogic;

    constructor(props: VisRxWidgetProps) {
        super(props);
        this.initializeModes();
    }

    private initializeModes(): void {
        this.modeA = new ModeALogic(
            this.state.rxData,
            this.props.context.socket,
            updates => this.setState(updates),
            (oid, value) => this.props.context.setValue(oid, value)
        );
    }

    static getWidgetInfo(): RxWidgetInfo {
        return getWidgetInfo();
    }

    getWidgetInfo(): RxWidgetInfo {
        return MyWidget.getWidgetInfo();
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        // Rendering-Logik
    }
}
```

**Verantwortlichkeiten:**
- State-Management
- Lifecycle-Management
- Koordination zwischen Logik und UI
- Event-Handling

**Ziel-Größe:** 200-400 Zeilen

---

### 2. **types/** - Type-Definitionen

#### types/index.ts

```typescript
import type { VisRxWidgetState } from '@iobroker/types-vis-2';

export enum WidgetMode {
    MODE_A = 'mode_a',
    MODE_B = 'mode_b',
}

export interface MyWidgetRxData {
    mode: WidgetMode;
    commonSetting: string;
    // Mode-spezifische Settings
    modeASpecific?: string;
    modeBSpecific?: number;
    [key: string]: unknown;
}

export interface MyWidgetState extends VisRxWidgetState {
    dialog: boolean;
    modeAState: ModeAState;
    modeBState: ModeBState;
}

export interface ModeAState {
    value: number;
    isActive: boolean;
}
```

**Verantwortlichkeiten:**
- Type-Definitionen
- Interfaces
- Enums
- State-Strukturen

**Ziel-Größe:** 50-150 Zeilen

#### types/constants.ts

```typescript
import { WidgetMode, type ModeDefinition } from './index';

export const MODE_DEFINITIONS: Record<WidgetMode, ModeDefinition> = {
    [WidgetMode.MODE_A]: {
        id: WidgetMode.MODE_A,
        label: 'Mode A',
        hasDialog: true,
    },
    // ...
};

export function modeHasDialog(mode: WidgetMode): boolean {
    return MODE_DEFINITIONS[mode]?.hasDialog ?? false;
}
```

**Verantwortlichkeiten:**
- Konstanten
- Type Guards
- Helper-Funktionen für Types

**Ziel-Größe:** 30-100 Zeilen

---

### 3. **modes/** - Geschäftslogik

Für Multi-Mode Widgets: Jeder Mode hat seine eigene Logik-Klasse.

```typescript
import type { ModeAState } from '../types';
import type { SocketLike } from '../types/socket';

export interface ModeAConfig {
    controlOid: string;
    setting1?: number;
    setting2?: boolean;
}

export class ModeALogic {
    private config: ModeAConfig;
    private socket: SocketLike;
    private setState: (state: Partial<ModeAState>) => void;
    private setValue: (oid: string, value: unknown) => void;

    constructor(
        config: ModeAConfig,
        socket: SocketLike,
        setState: (state: Partial<ModeAState>) => void,
        setValue: (oid: string, value: unknown) => void
    ) {
        this.config = config;
        this.socket = socket;
        this.setState = setState;
        this.setValue = setValue;
    }

    async initialize(): Promise<void> {
        // Lade initiale Werte von ioBroker
        if (this.config.controlOid) {
            const state = await this.socket.getState(this.config.controlOid);
            if (state?.val !== undefined) {
                this.setState({ value: Number(state.val) });
            }
        }
    }

    getSubscriptionOids(): string[] {
        return this.config.controlOid ? [this.config.controlOid] : [];
    }

    handleStateChange(value: unknown): void {
        this.setState({ value: Number(value) });
    }

    handleAction(editMode: boolean): void {
        if (this.config.controlOid && !editMode) {
            this.setValue(this.config.controlOid, someValue);
        }
    }

    isActive(state: ModeAState): boolean {
        return state.value > 0;
    }
}
```

**Verantwortlichkeiten:**
- Mode-spezifische Geschäftslogik
- ioBroker State-Management
- Validierung
- Berechnungen

**Ziel-Größe:** 100-200 Zeilen pro Mode

---

### 4. **components/** - UI-Komponenten

React-Komponenten für wiederverwendbare UI-Elemente.

```typescript
import React from 'react';
import { Box, Typography } from '@mui/material';

export interface ComponentAProps {
    value: number;
    isActive: boolean;
    onClick: () => void;
    color: string;
}

export const ComponentA: React.FC<ComponentAProps> = React.memo(({
    value,
    isActive,
    onClick,
    color,
}) => {
    return (
        <Box
            onClick={onClick}
            sx={{
                backgroundColor: isActive ? color : '#ccc',
                padding: 2,
            }}
        >
            <Typography>{value}</Typography>
        </Box>
    );
});

ComponentA.displayName = 'ComponentA';
```

**Verantwortlichkeiten:**
- UI-Rendering
- Visuelle Darstellung
- User-Interaktionen (onClick, onChange, etc.)

**Best Practices:**
- Verwende `React.memo` für Performance
- Props sollten primitiv sein (keine komplexen Objekte)
- Keine Geschäftslogik in Komponenten

**Ziel-Größe:** 50-150 Zeilen pro Komponente

---

### 5. **config/widgetInfo.ts** - Widget-Konfiguration

Extrahiere die `getWidgetInfo()` Konfiguration in eine separate Datei.

```typescript
import type { RxWidgetInfo } from '@iobroker/types-vis-2';
import { modeHasDialog } from '../types/constants';
import { WidgetMode, type MyWidgetRxData } from '../types';

export function getWidgetInfo(): RxWidgetInfo {
    return {
        id: 'tplDeluxeMyWidget',
        visSet: 'vis-2-widgets-deluxe',
        visSetLabel: 'set_label',
        visWidgetLabel: 'my_widget',
        visName: 'My Widget',
        visAttrs: [
            {
                name: 'common',
                label: 'Common Settings',
                fields: [
                    {
                        name: 'mode',
                        label: 'Mode',
                        type: 'select',
                        options: [
                            { value: 'mode_a', label: 'Mode A' },
                            { value: 'mode_b', label: 'Mode B' },
                        ],
                        default: 'mode_a',
                    },
                    // ...
                ],
            },
            // Mode-spezifische Gruppen
            {
                name: 'mode_a_settings',
                label: 'Mode A Settings',
                hidden: 'data.mode !== "mode_a"',
                fields: [
                    // Mode A spezifische Felder
                ],
            },
        ],
        visDefaultStyle: {
            width: 100,
            height: 100,
        },
    };
}
```

**Verantwortlichkeiten:**
- Widget-Metadaten
- Konfigurations-Felder (visAttrs)
- Default-Werte
- Conditional visibility

**Ziel-Größe:** 200-500 Zeilen (abhängig von Komplexität)

---

### 6. **utils/** - Hilfsfunktionen (optional)

```typescript
// utils/formatters.ts
export function formatTemperature(value: number | null, showUnit = true): string {
    if (value === null || value === undefined) {
        return '--';
    }
    const formatted = value.toFixed(1);
    return showUnit ? `${formatted}°C` : formatted;
}

export function formatPercentage(value: number): string {
    return `${Math.round(value)}%`;
}

// utils/helpers.ts
export function parseValue(value: string): boolean | number | string {
    if (value === 'true') return true;
    if (value === 'false') return false;
    const num = Number(value);
    return isNaN(num) ? value : num;
}
```

**Verantwortlichkeiten:**
- Formatierungs-Funktionen
- Parsing-Logik
- Allgemeine Helper-Funktionen

**Ziel-Größe:** 30-100 Zeilen

---

## Best Practices

### 1. Re-Export für Kompatibilität

Erstelle immer eine Re-Export-Datei im Root:

```typescript
// WidgetName.tsx (im src/ root)
import WidgetName from './WidgetName/index';
export default WidgetName;
```

### 2. Socket-Interface

Erstelle ein minimales Socket-Interface statt `any`:

```typescript
// types/socket.ts
export interface SocketLike {
    getState(oid: string): Promise<{ val?: unknown } | null | undefined>;
    getObject(oid: string): Promise<unknown>;
}
```

### 3. State Updates

Verwende Callback-Funktionen für State-Updates aus Logik-Klassen:

```typescript
// In der Hauptkomponente
this.modeA = new ModeALogic(
    config,
    socket,
    updates => this.setState({ modeA: { ...this.state.modeA, ...updates } }),
    (oid, value) => this.props.context.setValue(oid, value as string | number | boolean | null)
);
```

### 4. TypeScript Strictness

- Vermeide `any` - verwende `unknown` oder spezifische Interfaces
- Alle Public-APIs sollten typisiert sein
- Verwende Type Guards wo sinnvoll

### 5. React Memo

Verwende `React.memo` für UI-Komponenten:

```typescript
export const MyComponent: React.FC<MyComponentProps> = React.memo(({ ... }) => {
    // ...
});

MyComponent.displayName = 'MyComponent';
```

### 6. ESLint Compliance

- Geschweifte Klammern bei allen if-Statements (`curly` rule)
- Keine ungenutzten Variablen
- Konsistente Formatierung (Prettier)

---

## Beispiel: OneIconToRuleThemAll

### Struktur

```
OneIconToRuleThemAll/
├── index.tsx                    # 394 Zeilen (statt 1658)
├── types/
│   ├── index.ts                 # 111 Zeilen (Interfaces)
│   ├── constants.ts             # 43 Zeilen (Mode Definitions)
│   └── socket.ts                # 7 Zeilen (Socket Interface)
├── modes/
│   ├── HeatingMode.ts           # 186 Zeilen
│   ├── DimmerMode.ts            # 117 Zeilen
│   └── SwitchMode.ts            # 104 Zeilen
├── components/
│   ├── CardWrapper.tsx          # 53 Zeilen
│   ├── IconWithStatus.tsx       # 134 Zeilen
│   ├── HeatingDialog.tsx        # 154 Zeilen
│   └── DimmerDialog.tsx         # 122 Zeilen
└── config/
    └── widgetInfo.ts            # 429 Zeilen

# Re-Export
OneIconToRuleThemAll.tsx         # 3 Zeilen
```

### Vorteile

**Vorher:**
- 1 Datei mit 1658 Zeilen
- Schwer zu navigieren
- Hohe Kopplung
- Schwierig zu testen

**Nachher:**
- 20 Dateien mit durchschnittlich ~88 Zeilen
- Klare Verantwortlichkeiten
- Loose Coupling
- Einfach zu testen
- Mode-Logik kann isoliert getestet werden
- UI-Komponenten sind wiederverwendbar

---

## Migration bestehender Widgets

### Schritt 1: Analyse

1. Identifiziere verschiedene "Modes" oder Features
2. Finde wiederverwendbare UI-Komponenten
3. Erkenne Geschäftslogik-Blöcke

### Schritt 2: Verzeichnisstruktur erstellen

```bash
mkdir -p src-widgets/src/WidgetName/{types,modes,components,config,utils}
```

### Schritt 3: Types extrahieren

1. Erstelle `types/index.ts` mit allen Interfaces
2. Erstelle `types/constants.ts` mit Konstanten
3. Erstelle `types/socket.ts` falls nötig

### Schritt 4: Logik extrahieren

Für jeden Mode/Feature:
1. Erstelle `modes/ModeName.ts`
2. Extrahiere Logik in Klasse
3. Definiere Config-Interface
4. Implementiere `initialize()`, `handleStateChange()`, etc.

### Schritt 5: UI-Komponenten extrahieren

Für jeden wiederverwendbaren UI-Teil:
1. Erstelle `components/ComponentName.tsx`
2. Props-Interface definieren
3. Verwende `React.memo`
4. Keine Geschäftslogik!

### Schritt 6: Config extrahieren

1. Erstelle `config/widgetInfo.ts`
2. Exportiere `getWidgetInfo()` Funktion
3. Verwende Type Guards für conditional visibility

### Schritt 7: Hauptkomponente refactoren

1. Erstelle `index.tsx`
2. Importiere alle Module
3. Initialisiere Logik-Klassen im Constructor
4. Verwende Komponenten im Rendering

### Schritt 8: Re-Export erstellen

```typescript
// WidgetName.tsx
import WidgetName from './WidgetName/index';
export default WidgetName;
```

### Schritt 9: Testen

1. `npm run lint` - Keine Fehler
2. `npm run build` - Erfolgreich
3. Browser-Test - Funktionalität prüfen

---

## Wann sollte man dieses Prinzip anwenden?

### ✅ Verwende modulare Struktur wenn:

- Widget hat mehr als 500 Zeilen Code
- Widget hat mehrere Modi/Features
- Widget hat komplexe Geschäftslogik
- Widget wird aktiv weiterentwickelt
- Widget soll getestet werden

### ❌ Einfache Struktur ausreichend wenn:

- Widget hat weniger als 300 Zeilen
- Widget ist simpel (z.B. nur Anzeige)
- Widget ist stabil und wird nicht erweitert
- Widget hat keine komplexe Logik

---

## Zusammenfassung

**Kernprinzipien:**
1. 📦 **Modularität**: Kleine, fokussierte Dateien
2. 🎯 **Single Responsibility**: Eine Datei, eine Aufgabe
3. 🧪 **Testbarkeit**: Logik isoliert testbar
4. 🔧 **Wartbarkeit**: Leicht zu verstehen und zu ändern
5. 🚀 **Erweiterbarkeit**: Neue Features leicht hinzufügbar

**Dateigrößen-Richtlinien:**
- Types: 50-150 Zeilen
- Logik-Klassen: 100-200 Zeilen
- UI-Komponenten: 50-150 Zeilen
- Config: 200-500 Zeilen
- Hauptkomponente: 200-400 Zeilen

**Ziel:** Durchschnittlich ~100 Zeilen pro Datei statt 1000+ in einer Datei.

---

*Letzte Aktualisierung: 2025-10-20*
*Beispiel-Implementation: OneIconToRuleThemAll*
