# Window & Shutter Mode - Implementierungsplan

**Datum**: 2025-10-23 (Erweitert: 2025-10-23)
**Widget**: OneIconToRuleThemAll
**Neuer Modus**: `WINDOW_SHUTTER`
**Version**: 2.0 (Detaillierte Planung)

## 🎯 Übersicht

Implementierung eines neuen Modus für komplexe Fenster/Rolladen-Visualisierung mit:

### Core Features (MVP)
- Dynamisch konfigurierbare Anzahl von Fensterflügeln (1-20)
- **Flügel-Größenverhältnisse** (z.B. 1:1:2 für 3 Flügel)
- **Responsive Skalierung** mit Verhältnis-Erhaltung
- **Detailliertes SVG-Icon im Material Design Stil** (größere ViewBox für Details)
- **Card-Integration** (optional, wie andere Modi)
- **Umfassende Farb-Konfiguration** (Rahmen, Flügel-Stati, Rolladen)
- **Status-Highlighting** durch Farben (offen/gekippt/geschlossen)
- Touch-freundlicher Dialog für Rolladen-Steuerung
- Widget-Rotation für Kartenausrichtung

### Extended Features (Phase 2)
- **Lamellen-Winkel** für Jalousien (0-90°)
- **Lock-Status** für Fenster (verriegelt/unverriegelt)
- **Insektenschutz** (ein-/ausgefahren)
- **Alarmierung** (bei offenen Fenstern + Regen/Wind)
- **Szenen/Presets** ("Lüften", "Sonnen", "Nacht", "Alarm")
- **Touch Gesten** (Swipe für Rolladen hoch/runter)

## 📋 Anforderungen aus User-Feedback

### Fenster-Flügel
- Anzahl: 1-20 konfigurierbar
- Größenverhältnisse: z.B. 1:1:2 (letzter Flügel doppelt so breit)
- Anschlag: Links, Rechts, Oben
- Sensor-Modi:
  - 1 OID binär (0=zu, 1=offen)
  - 1 OID numerisch (0=zu, 1=gekippt, 2=offen)
  - 2 OIDs (open + tilt separat)

### Rolladen
- Position OID (0-100%)
- Optional: UP/DOWN/STOP OIDs
- Invertierbar (100% = oben vs. unten)

### Widget-Eigenschaften
- Skalierbar durch Größenänderung im Editor
- Interne Proportionen bleiben erhalten (Flügel-Verhältnisse)
- Rotation für Kartenausrichtung
- Optional auf Card (wie andere Modi)

### SVG-Icon
- Material Design Stil (minimalistisch, geometrisch)
- Größere ViewBox als 24x24 (mehr Details nötig)
- Farben für alles konfigurierbar
- Highlights für offen/gekippt visuell unterscheidbar

### Dialog
- Fenster-Status read-only anzeigen
- Rolladen steuerbar (Slider + Buttons)
- Touch-freundlich

## 📂 Dateistruktur

```
src-widgets/src/OneIconToRuleThemAll/
├── types/
│   └── index.ts                      [ERWEITERN]  +~120 Zeilen
├── modes/
│   ├── HeatingMode.ts
│   ├── DimmerMode.ts
│   ├── SwitchMode.ts
│   └── WindowShutterMode.ts          [NEU]        ~280 Zeilen
├── components/
│   ├── IconWithStatus.tsx
│   ├── HeatingDialog.tsx
│   ├── DimmerDialog.tsx
│   ├── WindowShutterIcon.tsx         [NEU]        ~350 Zeilen
│   └── WindowShutterDialog.tsx       [NEU]        ~280 Zeilen
├── config/
│   └── widgetInfo.ts                 [ERWEITERN]  +~180 Zeilen
└── index.tsx                         [ERWEITERN]  +~90 Zeilen

src-widgets/src/
└── translations.ts                   [ERWEITERN]  +~60 Zeilen
```

**Gesamt**: ~1360 neue Zeilen Code

## 🔧 Implementierungsschritte

### 1. Type Definitions erweitern
**Datei**: `src-widgets/src/OneIconToRuleThemAll/types/index.ts`

#### Neuer FlexMode
```typescript
export enum FlexMode {
    DIMMER_DIALOG = 'dimmer_dialog',
    SWITCH = 'switch',
    HEATING_KNX = 'heating_knx',
    WINDOW_SHUTTER = 'window_shutter', // NEU
}
```

#### Interface: WindowShutterRxData
```typescript
export interface OneIconToRuleThemAllRxData {
    // ... bestehende Felder ...

    // === MODE: WINDOW_SHUTTER ===
    // Rolladen-OIDs
    shutterPositionOid?: string;
    shutterUpOid?: string;
    shutterDownOid?: string;
    shutterStopOid?: string;

    // Rolladen-Config
    shutterInvert?: boolean;
    shutterMin?: number;
    shutterMax?: number;

    // Fenster-Geometrie
    windowPaneCount?: number;

    // Pro Flügel (dynamisch: windowPane1_... bis windowPane20_...)
    [key: `windowPane${number}_openOid`]: string;
    [key: `windowPane${number}_tiltOid`]: string;
    [key: `windowPane${number}_sensorMode`]: 'twoOids' | 'oneOid' | 'oneOidWithTilt';
    [key: `windowPane${number}_hingeType`]: 'left' | 'right' | 'top';
    [key: `windowPane${number}_ratio`]: number;

    // Farb-Konfiguration
    windowFrameColor?: string;
    windowPaneClosedColor?: string;
    windowPaneOpenColor?: string;
    windowPaneTiltColor?: string;
    windowShutterColor?: string;
    windowBackgroundColorClosed?: string;
    windowBackgroundColorActive?: string;
}
```

#### Interface: WindowShutterModeState
```typescript
export interface WindowShutterModeState {
    shutterPosition: number | null;
    paneStates: Array<{
        state: 'closed' | 'open' | 'tilt';
        ratio: number;
        hinge: 'left' | 'right' | 'top';
    }>;
    hasOpenPanes: boolean;
    hasTiltedPanes: boolean;
}

export interface OneIconToRuleThemAllState extends VisRxWidgetState {
    // ... bestehende Felder ...
    windowShutter: WindowShutterModeState;
}
```

---

### 2. Mode Logic Class
**Datei**: `src-widgets/src/OneIconToRuleThemAll/modes/WindowShutterMode.ts` (NEU)

**Pattern**: Folgt HeatingModeLogic-Architektur (siehe `modes/HeatingMode.ts`)

```typescript
import type { WindowShutterModeState } from '../types';
import type { SocketLike } from '../types/socket';

export interface WindowShutterModeConfig {
    // Rolladen
    shutterPositionOid?: string;
    shutterUpOid?: string;
    shutterDownOid?: string;
    shutterStopOid?: string;
    shutterInvert?: boolean;
    shutterMin?: number;
    shutterMax?: number;

    // Fenster-Flügel
    windowPaneCount?: number;
    paneConfigs: Array<{
        openOid?: string;
        tiltOid?: string;
        sensorMode: 'twoOids' | 'oneOid' | 'oneOidWithTilt';
        hingeType: 'left' | 'right' | 'top';
        ratio: number;
    }>;
}

export class WindowShutterModeLogic {
    private config: WindowShutterModeConfig;
    private socket: SocketLike;
    private setState: (state: Partial<WindowShutterModeState>) => void;
    private setValue: (oid: string, value: unknown) => void;

    // Cache für OID-Values (Performance-Optimierung)
    private valueCache: Map<string, unknown> = new Map();

    constructor(
        config: WindowShutterModeConfig,
        socket: SocketLike,
        setState: (state: Partial<WindowShutterModeState>) => void,
        setValue: (oid: string, value: unknown) => void,
    ) {
        this.config = config;
        this.socket = socket;
        this.setState = setState;
        this.setValue = setValue;
    }

    /**
     * Initialize: Load initial values from ioBroker
     * (Pattern from HeatingMode.ts:64-91)
     */
    async initialize(): Promise<void> {
        const updates: Partial<WindowShutterModeState> = {};

        // Rolladen-Position laden
        if (this.config.shutterPositionOid) {
            const state = await this.socket.getState(this.config.shutterPositionOid);
            if (state?.val !== undefined) {
                updates.shutterPosition = this.normalizeShutterPosition(Number(state.val));
                this.valueCache.set(this.config.shutterPositionOid, state.val);
            }
        }

        // Alle Flügel-Stati laden
        for (const paneConfig of this.config.paneConfigs) {
            if (paneConfig.openOid) {
                const state = await this.socket.getState(paneConfig.openOid);
                if (state?.val !== undefined) {
                    this.valueCache.set(paneConfig.openOid, state.val);
                }
            }
            if (paneConfig.tiltOid) {
                const state = await this.socket.getState(paneConfig.tiltOid);
                if (state?.val !== undefined) {
                    this.valueCache.set(paneConfig.tiltOid, state.val);
                }
            }
        }

        // Pane-States berechnen
        updates.paneStates = this.getPaneStates();
        updates.hasOpenPanes = updates.paneStates.some(p => p.state === 'open');
        updates.hasTiltedPanes = updates.paneStates.some(p => p.state === 'tilt');

        if (Object.keys(updates).length > 0) {
            this.setState(updates);
        }
    }

    /**
     * Get OIDs to subscribe to
     * (Pattern from HeatingMode.ts:96-108)
     */
    getSubscriptionOids(): string[] {
        const oids: string[] = [];

        if (this.config.shutterPositionOid) {
            oids.push(this.config.shutterPositionOid);
        }

        for (const paneConfig of this.config.paneConfigs) {
            if (paneConfig.openOid) {
                oids.push(paneConfig.openOid);
            }
            if (paneConfig.tiltOid) {
                oids.push(paneConfig.tiltOid);
            }
        }

        return oids;
    }

    /**
     * Handle state changes from ioBroker
     * (Pattern from HeatingMode.ts:113-121)
     */
    handleStateChange(id: string, value: unknown): void {
        // Cache updaten
        this.valueCache.set(id, value);

        if (id === this.config.shutterPositionOid) {
            const position = this.normalizeShutterPosition(Number(value));
            this.setState({ shutterPosition: position });
        } else {
            // Ein Fenster-Sensor hat sich geändert
            // → Alle Pane-States neu berechnen
            const paneStates = this.getPaneStates();
            const hasOpenPanes = paneStates.some(p => p.state === 'open');
            const hasTiltedPanes = paneStates.some(p => p.state === 'tilt');

            this.setState({ paneStates, hasOpenPanes, hasTiltedPanes });
        }
    }

    /**
     * Normalize shutter position to 0-100 range
     */
    private normalizeShutterPosition(value: number): number {
        const min = this.config.shutterMin ?? 0;
        const max = this.config.shutterMax ?? 100;

        // Auf 0-100 normalisieren
        let normalized = ((value - min) / (max - min)) * 100;

        // Invertieren falls gewünscht
        if (this.config.shutterInvert) {
            normalized = 100 - normalized;
        }

        return Math.max(0, Math.min(100, normalized));
    }

    /**
     * Get current state of all panes
     */
    private getPaneStates(): WindowShutterModeState['paneStates'] {
        return this.config.paneConfigs.map(paneConfig => {
            const state = this.getPaneState(paneConfig);
            return {
                state,
                ratio: paneConfig.ratio,
                hinge: paneConfig.hingeType,
            };
        });
    }

    /**
     * Determine state of a single pane
     */
    private getPaneState(paneConfig: WindowShutterModeConfig['paneConfigs'][0]): 'closed' | 'open' | 'tilt' {
        if (paneConfig.sensorMode === 'twoOids') {
            // 2 separate OIDs (open + tilt)
            const openValue = paneConfig.openOid ? this.valueCache.get(paneConfig.openOid) : false;
            const tiltValue = paneConfig.tiltOid ? this.valueCache.get(paneConfig.tiltOid) : false;

            // Priorität: open > tilt > closed
            if (this.toBool(openValue)) return 'open';
            if (this.toBool(tiltValue)) return 'tilt';
            return 'closed';
        } else if (paneConfig.sensorMode === 'oneOidWithTilt') {
            // 1 OID numerisch: 0=closed, 1=tilted, 2=open
            const value = paneConfig.openOid ? this.valueCache.get(paneConfig.openOid) : 0;
            const numValue = Number(value);

            if (numValue >= 2) return 'open';
            if (numValue >= 1) return 'tilt';
            return 'closed';
        } else {
            // 1 OID binär: 0=closed, 1=open
            const value = paneConfig.openOid ? this.valueCache.get(paneConfig.openOid) : false;
            return this.toBool(value) ? 'open' : 'closed';
        }
    }

    /**
     * Convert any value to boolean
     */
    private toBool(value: unknown): boolean {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value > 0;
        if (typeof value === 'string') return value === 'true' || value === '1';
        return false;
    }

    // === PUBLIC API ===

    /**
     * Check if widget is active (any pane open/tilted)
     */
    isActive(state: WindowShutterModeState): boolean {
        return state.hasOpenPanes || state.hasTiltedPanes;
    }

    /**
     * Set shutter position (0-100)
     */
    async setShutterPosition(position: number): Promise<void> {
        if (!this.config.shutterPositionOid) {
            console.warn('[WindowShutterMode] No shutterPositionOid configured');
            return;
        }

        let value = Math.max(0, Math.min(100, position));

        // Invertieren falls nötig
        if (this.config.shutterInvert) {
            value = 100 - value;
        }

        // Auf min/max skalieren
        const min = this.config.shutterMin ?? 0;
        const max = this.config.shutterMax ?? 100;
        value = ((value / 100) * (max - min)) + min;

        this.setValue(this.config.shutterPositionOid, value);
    }

    /**
     * Shutter up (open)
     */
    async shutterUp(): Promise<void> {
        if (this.config.shutterUpOid) {
            this.setValue(this.config.shutterUpOid, true);
        } else if (this.config.shutterPositionOid) {
            // Fallback: Position auf 100% setzen
            await this.setShutterPosition(100);
        }
    }

    /**
     * Shutter down (close)
     */
    async shutterDown(): Promise<void> {
        if (this.config.shutterDownOid) {
            this.setValue(this.config.shutterDownOid, true);
        } else if (this.config.shutterPositionOid) {
            // Fallback: Position auf 0% setzen
            await this.setShutterPosition(0);
        }
    }

    /**
     * Stop shutter movement
     */
    async shutterStop(): Promise<void> {
        if (this.config.shutterStopOid) {
            this.setValue(this.config.shutterStopOid, true);
        }
    }

    /**
     * Format shutter position for display
     */
    formatShutterPosition(position: number | null): string {
        if (position === null || position === undefined) {
            return '--';
        }
        return `${Math.round(position)}%`;
    }

    /**
     * Cleanup (called on widget unmount)
     */
    destroy(): void {
        this.valueCache.clear();
        // Note: Unsubscribe wird vom Parent-Widget gehandhabt
    }
}
```

**Key Design Decisions**:
1. **Value Cache**: Performance-Optimierung - verhindert unnötige getState() Calls
2. **toBool() Helper**: Robuste Konvertierung verschiedener Datentypen
3. **Normalization**: Konsistente 0-100 Range, unabhängig von Hardware-Werten
4. **Fallbacks**: shutterUp/Down funktionieren auch ohne dedicated OIDs
5. **Error Handling**: Graceful degradation bei fehlenden OIDs

---

### 3. SVG Icon Generator
**Datei**: `src-widgets/src/OneIconToRuleThemAll/components/WindowShutterIcon.tsx` (NEU)

#### Props Interface
```typescript
export interface WindowShutterIconProps {
    panes: Array<{
        state: 'closed' | 'open' | 'tilt';
        ratio: number;
        hinge: 'left' | 'right' | 'top';
    }>;
    shutterPosition: number; // 0-100
    iconSize: number;
    iconRotation: number;

    // Farben
    frameColor: string;
    paneClosedColor: string;
    paneOpenColor: string;
    paneTiltColor: string;
    shutterColor: string;
    backgroundColor: string;

    onClick?: () => void;
    editMode?: boolean;
}
```

#### Design-Prinzipien
- **ViewBox**: 100x100 (nicht 24x24 - brauchen mehr Details!)
- **Material Design Stil**: Minimalistisch, geometrisch, keine Gradienten
- **Responsive**: Skaliert automatisch auf iconSize
- **Farb-Codierung**: Stati durch Farben unterscheidbar

#### SVG-Struktur
```xml
<svg viewBox="0 0 100 100">
  <!-- 1. Hintergrund (Status-abhängig) -->
  <rect fill={backgroundColor} opacity="0.15"/>

  <!-- 2. Rolladen (Lamellen von oben) -->
  <g id="shutter">
    <!-- Mehrere horizontale Rechtecke -->
  </g>

  <!-- 3. Fenster-Rahmen -->
  <rect stroke={frameColor} strokeWidth="3"/>

  <!-- 4. Flügel-Trennlinien -->
  <line stroke={frameColor} opacity="0.5"/>

  <!-- 5. Flügel-Status-Indikatoren -->
  <!-- Geschlossen: Leichte Füllung -->
  <!-- Gekippt: Diagonale Linie + Spalt-Symbol -->
  <!-- Offen: Pfeil in Öffnungsrichtung -->

  <!-- 6. Griffe (kleine Kreise) -->
  <circle fill={frameColor} opacity="0.6"/>
</svg>
```

---

### 4. Shutter Dialog Component
**Datei**: `src-widgets/src/OneIconToRuleThemAll/components/WindowShutterDialog.tsx` (NEU)

#### Props Interface
```typescript
export interface WindowShutterDialogProps {
    panes: Array<{
        state: 'closed' | 'open' | 'tilt';
        ratio: number;
        hinge: string;
    }>;
    shutterPosition: number;
    shutterInvert: boolean;

    // Farben
    primaryColor: string;
    paneClosedColor: string;
    paneOpenColor: string;
    paneTiltColor: string;

    // Callbacks
    onShutterChange: (value: number) => void;
    onShutterUp?: () => void;
    onShutterDown?: () => void;
    onShutterStop?: () => void;
}
```

#### Layout
```
┌─────────────────────────────┐
│  Fenster-Status:            │
│  [▭] [▬] [▷]                │  ← Mini-Icons mit Farben
│  zu  gekippt offen          │
├─────────────────────────────┤
│  Rolladen: 42%              │
│                             │
│       ║   [Auf]             │
│    ━━━║━━                   │  ← Vertikaler Slider
│       ║   [Zu]              │
├─────────────────────────────┤
│  [↑ Auf] [■ Stop] [↓ Ab]    │
└─────────────────────────────┘
```

---

### 5. Widget-Konfiguration
**Datei**: `src-widgets/src/OneIconToRuleThemAll/config/widgetInfo.ts`

#### Mode-Select erweitern
```typescript
{
    name: 'mode',
    type: 'select',
    options: [
        { value: 'dimmer_dialog', label: 'one_icon_mode_dimmer_dialog' },
        { value: 'switch', label: 'one_icon_mode_switch' },
        { value: 'heating_knx', label: 'one_icon_mode_heating_knx' },
        { value: 'window_shutter', label: 'one_icon_mode_window_shutter' }, // NEU
    ],
}
```

#### Neue Konfigurations-Gruppe: Window Shutter Settings
```typescript
{
    name: 'mode_window_shutter',
    label: 'deluxe_window_shutter_settings',
    hidden: 'data.mode !== "window_shutter"',
    fields: [
        // Rolladen-OIDs
        { name: 'shutterPositionOid', type: 'id', label: 'shutter_position_oid' },
        { name: 'shutterUpOid', type: 'id', label: 'shutter_up_oid' },
        { name: 'shutterDownOid', type: 'id', label: 'shutter_down_oid' },
        { name: 'shutterStopOid', type: 'id', label: 'shutter_stop_oid' },

        // Rolladen-Config
        { name: 'shutterInvert', type: 'checkbox', label: 'shutter_invert', default: false },
        { name: 'shutterMin', type: 'number', label: 'shutter_min', default: 0 },
        { name: 'shutterMax', type: 'number', label: 'shutter_max', default: 100 },

        // Fenster
        { name: 'windowPaneCount', type: 'number', label: 'window_pane_count',
          default: 1, min: 1, max: 20 },
    ]
}
```

#### Dynamische Flügel-Konfiguration (wie Material Widget!)
```typescript
{
    name: 'window_panes',
    label: 'window_pane',
    indexFrom: 1,
    indexTo: 'windowPaneCount', // Dynamisch basierend auf Count!
    fields: [
        { name: 'windowPane_openOid', type: 'id', label: 'window_pane_open_oid' },
        { name: 'windowPane_tiltOid', type: 'id', label: 'window_pane_tilt_oid' },
        { name: 'windowPane_sensorMode', type: 'select',
          options: [
              { value: 'twoOids', label: 'Two OIDs (open + tilt)' },
              { value: 'oneOid', label: 'One OID (0=closed, 1=open)' },
              { value: 'oneOidWithTilt', label: 'One OID (0=closed, 1=tilted, 2=open)' }
          ], default: 'oneOid' },
        { name: 'windowPane_hingeType', type: 'select',
          options: [
              { value: 'left', label: 'Left' },
              { value: 'right', label: 'Right' },
              { value: 'top', label: 'Top' }
          ], default: 'left' },
        { name: 'windowPane_ratio', type: 'slider', label: 'window_pane_ratio',
          default: 1, min: 0.1, max: 4, step: 0.1,
          tooltip: 'window_pane_ratio_tooltip' },
    ]
}
```

#### Farb-Konfiguration
```typescript
{
    name: 'window_shutter_colors',
    label: 'deluxe_window_shutter_colors',
    hidden: 'data.mode !== "window_shutter"',
    fields: [
        { name: 'windowFrameColor', type: 'color', label: 'window_frame_color', default: '#555555' },
        { name: 'windowPaneClosedColor', type: 'color', label: 'window_pane_closed_color', default: '#999999' },
        { name: 'windowPaneOpenColor', type: 'color', label: 'window_pane_open_color', default: '#FFC107' },
        { name: 'windowPaneTiltColor', type: 'color', label: 'window_pane_tilt_color', default: '#FF9800' },
        { name: 'windowShutterColor', type: 'color', label: 'window_shutter_color', default: '#666666' },
        { name: 'windowBackgroundColorClosed', type: 'color', label: 'window_background_closed', default: '#E0E0E0' },
        { name: 'windowBackgroundColorActive', type: 'color', label: 'window_background_active', default: '#FFEB3B' },
    ]
}
```

---

### 6. Integration in Haupt-Widget
**Datei**: `src-widgets/src/OneIconToRuleThemAll/index.tsx`

#### Imports hinzufügen
```typescript
import { WindowShutterModeLogic } from './modes/WindowShutterMode';
import { WindowShutterDialog } from './components/WindowShutterDialog';
import { WindowShutterIcon } from './components/WindowShutterIcon';
```

#### State erweitern
```typescript
this.state = {
    // ... bestehend ...
    windowShutter: {
        shutterPosition: null,
        paneStates: [],
        hasOpenPanes: false,
        hasTiltedPanes: false,
    },
};
```

#### initializeModes() erweitern
```typescript
this.windowShutterMode = new WindowShutterModeLogic(
    {
        shutterPositionOid: this.state.rxData.shutterPositionOid,
        // ... alle Config-Werte
    },
    this.props.context.socket,
    updates => this.setState({ windowShutter: { ...this.state.windowShutter, ...updates } }),
    (oid, value) => this.props.context.setValue(oid, value),
);
```

#### renderWidgetBody() anpassen
```typescript
<CardWrapper {...cardProps}>
    {this.state.rxData.mode === FlexMode.WINDOW_SHUTTER ? (
        <WindowShutterIcon
            panes={this.state.windowShutter.paneStates}
            shutterPosition={this.state.windowShutter.shutterPosition || 0}
            iconSize={this.state.rxData.iconSize}
            iconRotation={this.state.rxData.iconRotation}
            frameColor={this.state.rxData.windowFrameColor}
            // ... alle Farben
            onClick={this.handleClick}
            editMode={this.state.editMode}
        />
    ) : (
        <IconWithStatus {...existingProps} />
    )}
</CardWrapper>
```

---

### 7. Übersetzungen
**Datei**: `src-widgets/src/translations.ts`

```typescript
en: {
    // Mode
    one_icon_mode_window_shutter: 'Window & Shutter',

    // Rolladen
    shutter_position_oid: 'Shutter Position',
    shutter_up_oid: 'Shutter Up',
    shutter_down_oid: 'Shutter Down',
    shutter_stop_oid: 'Shutter Stop',
    shutter_invert: 'Invert Shutter (100% = closed)',
    shutter_min: 'Min Position',
    shutter_max: 'Max Position',

    // Fenster
    deluxe_window_shutter_settings: 'Window & Shutter Settings',
    window_pane_count: 'Number of Window Panes',
    window_pane: 'Window Pane',
    window_pane_open_oid: 'Open Sensor',
    window_pane_tilt_oid: 'Tilt Sensor (optional)',
    window_pane_sensor_mode: 'Sensor Mode',
    window_pane_hinge_type: 'Hinge Type',
    window_pane_ratio: 'Pane Width Ratio',
    window_pane_ratio_tooltip: 'Relative width (1 = normal, 2 = double width)',

    // Farben
    deluxe_window_shutter_colors: 'Colors',
    window_frame_color: 'Frame Color',
    window_pane_closed_color: 'Closed Color',
    window_pane_open_color: 'Open Color (Highlight)',
    window_pane_tilt_color: 'Tilted Color (Highlight)',
    window_shutter_color: 'Shutter Color',
    window_background_closed: 'Background (All Closed)',
    window_background_active: 'Background (Something Open)',

    // Dialog
    window_shutter_up: 'Open',
    window_shutter_down: 'Close',
    window_shutter_stop: 'Stop',
},
de: {
    // Mode
    one_icon_mode_window_shutter: 'Fenster & Rolladen',

    // Rolladen
    shutter_position_oid: 'Rolladen Position',
    shutter_up_oid: 'Rolladen Hoch',
    shutter_down_oid: 'Rolladen Runter',
    shutter_stop_oid: 'Rolladen Stop',
    shutter_invert: 'Rolladen invertieren (100% = zu)',
    shutter_min: 'Min Position',
    shutter_max: 'Max Position',

    // Fenster
    deluxe_window_shutter_settings: 'Fenster & Rolladen Einstellungen',
    window_pane_count: 'Anzahl Fensterflügel',
    window_pane: 'Fensterflügel',
    window_pane_open_oid: 'Öffnungssensor',
    window_pane_tilt_oid: 'Kippsensor (optional)',
    window_pane_sensor_mode: 'Sensor-Modus',
    window_pane_hinge_type: 'Anschlag-Typ',
    window_pane_ratio: 'Flügel-Breite',
    window_pane_ratio_tooltip: 'Relative Breite (1 = normal, 2 = doppelt so breit)',

    // Farben
    deluxe_window_shutter_colors: 'Farben',
    window_frame_color: 'Rahmenfarbe',
    window_pane_closed_color: 'Farbe geschlossen',
    window_pane_open_color: 'Farbe offen (Highlight)',
    window_pane_tilt_color: 'Farbe gekippt (Highlight)',
    window_shutter_color: 'Rolladenfarbe',
    window_background_closed: 'Hintergrund (alles zu)',
    window_background_active: 'Hintergrund (etwas offen)',

    // Dialog
    window_shutter_up: 'Auf',
    window_shutter_down: 'Zu',
    window_shutter_stop: 'Stop',
}
```

---

## 🎨 Design-Spezifikationen

### ViewBox-Strategie
- **100x100** statt 24x24 (mehr Details für komplexe Fenster)
- **Material Design Stil** trotzdem beibehalten
- Skaliert automatisch via SVG viewBox auf iconSize (24px - 200px)

### Material Design Prinzipien

**✅ Behalten**:
- Geometrische Formen (Rechtecke, Kreise, Linien)
- Einfarbige Flächen
- Klare Proportionen
- opacity für Layering

**❌ Vermeiden**:
- Gradienten
- Blur-Schatten
- Realistische Texturen
- Zu komplexe Pfade

### Standard-Farbschema
```
Rahmen:              #555555  (Dunkelgrau)
Flügel geschlossen:  #999999  (Hellgrau - unauffällig)
Flügel offen:        #FFC107  (Amber - Warnung!)
Flügel gekippt:      #FF9800  (Orange - Hinweis)
Rolladen:            #666666  (Mittelgrau)
Hintergrund zu:      #E0E0E0  (Sehr hell)
Hintergrund aktiv:   #FFEB3B  (Gelb - Aufmerksamkeit!)
```

### Flügel-Status Visualisierung
- **Geschlossen**: Leichte Füllung, dezent
- **Gekippt**: Diagonale Linie + horizontale Linie (Spalt-Symbol), orange
- **Offen**: Pfeil in Öffnungsrichtung, amber

---

## ✅ Testing-Checkpunkte

### MVP (Core Features)
1. ✓ ViewBox 100x100 skaliert sauber (24px - 200px)
2. ✓ Material Stil: Minimalistisch trotz Details
3. ✓ 1 Flügel: Alle Stati klar erkennbar
4. ✓ 3 Flügel (1:1:2): Proportionen korrekt
5. ✓ 10 Flügel: Immer noch lesbar
6. ✓ Rolladen: 0% / 50% / 100% unterscheidbar
7. ✓ Farben: Alle Einstellungen greifen
8. ✓ Card: Ein/Aus funktioniert
9. ✓ Rotation: 0°/90°/180°/270°
10. ✓ Dialog: Status + Steuerung funktional
11. ✓ State Management: Subscriptions und Updates
12. ✓ Error Handling: Fehlende OIDs, ungültige Werte
13. ✓ Performance: Kein Re-render bei jedem State-Update
14. ✓ Memory Leaks: Cleanup von Subscriptions

---

## 🚀 Extended Features (Phase 2)

### 1. Lamellen-Winkel für Jalousien

**Use Case**: Jalousien/Raffstores mit steuerbarem Lamellen-Winkel (0-90°)

**Neue OIDs**:
```typescript
shutterSlatAngleOid?: string;           // Aktueller Winkel (0-90)
shutterSlatAngleControlOid?: string;    // Winkel setzen
```

**UI Erweiterung**:
- Zweiter Slider im Dialog (vertikal für Position, horizontal für Winkel)
- Visuelle Darstellung im Icon (Lamellen-Neigung als Linien)

**SVG Enhancement**:
```xml
<!-- Lamellen mit Neigung -->
<g id="slats">
  <line x1="20" y1="30" x2="80" y2="32" stroke="#666" strokeWidth="2"/>
  <line x1="20" y1="35" x2="80" y2="37" stroke="#666" strokeWidth="2"/>
  <!-- ... weitere Lamellen mit berechnetem Offset basierend auf Winkel -->
</g>
```

**Schätzung**: +150 Zeilen

---

### 2. Lock-Status (Fenster-Verriegelung)

**Use Case**: Smart Locks an Fenstern - zeigen ob Fenster verriegelt ist

**Neue OIDs**:
```typescript
// Pro Flügel:
windowPane1_lockOid?: string;           // Lock-Status (bool)
windowPane1_lockControlOid?: string;    // Lock steuern (optional)
```

**UI Erweiterung**:
- Lock-Symbol im Icon (kleines Schloss-Icon pro Flügel)
- Lock-Button im Dialog (wenn controlOid vorhanden)
- Farbe: Grün (locked), Rot (unlocked), Grau (unknown)

**Alarmierung**:
- Optionale Warnung bei "offen + unlocked"
- Integration mit Alarm-OID

**Schätzung**: +120 Zeilen

---

### 3. Insektenschutz (Fly Screen)

**Use Case**: Elektrischer Insektenschutz - ein-/ausgefahren

**Neue OIDs**:
```typescript
flyScreenPositionOid?: string;          // Position (0-100%)
flyScreenUpOid?: string;                // Hochfahren
flyScreenDownOid?: string;              // Runterfahren
```

**UI Erweiterung**:
- Dritte Ebene im Icon (über Rolladen)
- Separate Steuerung im Dialog
- Mesh-Pattern im SVG für Insektenschutz

**SVG Enhancement**:
```xml
<!-- Insektenschutz (Mesh-Pattern) -->
<pattern id="mesh" width="4" height="4" patternUnits="userSpaceOnUse">
  <rect width="4" height="4" fill="none" stroke="#888" strokeWidth="0.5"/>
</pattern>
<rect fill="url(#mesh)" opacity="0.5"/>
```

**Schätzung**: +180 Zeilen

---

### 4. Szenen/Presets

**Use Case**: Vordefinierte Positionen für verschiedene Szenarien

**Neue Config**:
```typescript
windowShutterScenes?: string;  // JSON: [{ name, shutterPos, slatAngle, icon }]
```

**Beispiel-Szenen**:
- 🌬️ **Lüften**: Fenster gekippt, Rolladen 100% offen
- ☀️ **Sonnen**: Fenster zu, Rolladen 50%, Lamellen 45°
- 🌙 **Nacht**: Alles zu, Rolladen 0%
- 🚨 **Alarm**: Fenster zu + locked, Rolladen 0%

**UI Erweiterung**:
- Scene-Buttons im Dialog
- Scene-Indikator im Icon (wenn aktive Scene erkannt)

**Schätzung**: +200 Zeilen

---

### 5. Alarmierung & Automatisierung

**Use Case**: Warnung bei kritischen Kombinationen (offen + Regen/Wind)

**Neue OIDs**:
```typescript
weatherRainOid?: string;                // Regen-Sensor (bool)
weatherWindOid?: string;                // Wind-Geschwindigkeit (m/s)
weatherWindThreshold?: number;          // Warnschwelle (default: 20)
alarmEnableOid?: string;                // Alarm aktiviert (bool)
```

**Logic**:
- Warnung wenn: `hasOpenPanes && (rain || wind > threshold)`
- Optional: Auto-Close Rolladen bei Alarm
- Optional: Push-Benachrichtigung (via ioBroker Telegram/Pushover)

**UI Erweiterung**:
- Alarm-Indikator im Icon (rotes Blinken)
- Alarm-Status im Dialog
- "Close All" Button bei Alarm

**Schätzung**: +160 Zeilen

---

### 6. Touch Gesten

**Use Case**: Swipe-Gesten für schnelle Rolladen-Steuerung

**Gesten**:
- **Swipe Up**: Rolladen hochfahren (100%)
- **Swipe Down**: Rolladen runterfahren (0%)
- **Double Tap**: Dialog öffnen
- **Long Press**: Rolladen stoppen

**Implementation**:
- React Touch Events (`onTouchStart`, `onTouchMove`, `onTouchEnd`)
- Gesture-Library: `react-swipeable` oder custom
- Konfigurierbar: Gesten an/aus

**Schätzung**: +120 Zeilen

---

### 7. Gruppierung & Multi-Window Control

**Use Case**: Mehrere Fenster als Gruppe steuern (z.B. "Alle Südseite")

**Neue Config**:
```typescript
windowGroupOids?: string[];             // Array von Widget-IDs oder OIDs
windowGroupMode?: 'master' | 'slave';   // Master steuert Slaves
```

**Logic**:
- Master-Widget sendet Befehle an alle Gruppe-OIDs
- Slave-Widgets zeigen nur Status an (kein Dialog)
- Gruppen-Status: Aggregation (min/max/avg)

**UI Erweiterung**:
- Gruppen-Indikator im Icon
- "Control Group" Button im Dialog

**Schätzung**: +250 Zeilen

---

### 8. Historie & Statistiken

**Use Case**: Übersicht über Fenster-Nutzung und Energie-Einsparung

**Neue Features**:
- Chart: Rolladen-Position über Zeit
- Statistik: "Heute X% Sonnenschutz"
- Energieeinsparung: Kühlung/Heizung durch Rolladen

**Integration**:
- Basis-Klasse `Generic.getHistoryInstance()` nutzen
- Chart-Library: `recharts` oder `chart.js`
- Neuer Dialog-Tab: "Statistics"

**Schätzung**: +300 Zeilen

---

### 9. Adaptive Steuerung

**Use Case**: KI-basierte Vorschläge basierend auf Wetter, Tageszeit, Raum-Temperatur

**Neue OIDs**:
```typescript
roomTempOid?: string;                   // Raum-Temperatur
outsideTempOid?: string;                // Außen-Temperatur
sunPositionOid?: string;                // Sonnenstand (Azimut/Elevation)
```

**Logic**:
- **Sommer**: Bei Sonne → Rolladen runter (Kühlung)
- **Winter**: Bei Sonne → Rolladen hoch (Heizung)
- **Nacht**: Auto-Close (Wärmedämmung)

**UI Erweiterung**:
- "Auto-Mode" Toggle im Dialog
- Empfehlungs-Indikator im Icon (💡)
- Erklärung: "Empfohlen: 50% wegen Sonne"

**Schätzung**: +280 Zeilen

---

### Feature-Übersicht

| Feature | Priorität | Komplexität | Zeilen | Status |
|---------|-----------|-------------|--------|--------|
| **Lamellen-Winkel** | Hoch | Mittel | ~150 | Geplant |
| **Lock-Status** | Hoch | Niedrig | ~120 | Geplant |
| **Insektenschutz** | Mittel | Mittel | ~180 | Geplant |
| **Szenen/Presets** | Hoch | Mittel | ~200 | Geplant |
| **Alarmierung** | Mittel | Mittel | ~160 | Geplant |
| **Touch Gesten** | Niedrig | Mittel | ~120 | Optional |
| **Gruppierung** | Niedrig | Hoch | ~250 | Optional |
| **Historie** | Niedrig | Hoch | ~300 | Optional |
| **Adaptive Steuerung** | Niedrig | Sehr Hoch | ~280 | Zukunft |

**Empfohlene Reihenfolge**:
1. MVP (Core Features) → ~1360 Zeilen
2. Lamellen-Winkel + Lock-Status → +270 Zeilen
3. Szenen/Presets → +200 Zeilen
4. Insektenschutz + Alarmierung → +340 Zeilen
5. Optionale Features nach Bedarf

---

## 📚 Referenzen

### Material Widget Blinds
**Datei**: `/home/joerg/projects/ioBroker.vis-2-widgets-material-main/src-widgets/src/Blinds.tsx`

**Wichtige Patterns**:
- **indexFrom/indexTo** für dynamische Flügel-Config (Zeilen 182-282)
- **Flex-Ratio** für Flügel-Größen (Zeilen 213-218)
- **Responsive Skalierung** (Zeilen 543-556)

### Bestehende Modi
- **HeatingMode**: Multi-OID Handling, State-Aggregation
- **DimmerDialog**: Slider + Quick Buttons Pattern
- **IconWithStatus**: Rotation, onClick Handling

---

## 🚀 Implementierungs-Roadmap

### Phase 1: MVP (Core Features) - Priority: HOCH
**Ziel**: Funktionales Window & Shutter Widget mit Basis-Features

**Tasks**:
1. ✓ Types erweitern (`types/index.ts`) - ~120 Zeilen
2. ✓ WindowShutterMode implementieren (`modes/WindowShutterMode.ts`) - ~280 Zeilen
3. ✓ WindowShutterIcon erstellen (`components/WindowShutterIcon.tsx`) - ~350 Zeilen
4. ✓ WindowShutterDialog erstellen (`components/WindowShutterDialog.tsx`) - ~280 Zeilen
5. ✓ Widget-Config erweitern (`config/widgetInfo.ts`) - ~180 Zeilen
6. ✓ Hauptwidget integrieren (`index.tsx`) - ~90 Zeilen
7. ✓ Übersetzungen hinzufügen (`translations.ts`) - ~60 Zeilen
8. ✓ Testing nach Checkpunkte-Liste

**Deliverables**:
- Funktionales Widget mit 1-20 Fenster-Flügeln
- Rolladen-Steuerung (Position + UP/DOWN/STOP)
- Material Design Icon mit Status-Highlighting
- Touch-freundlicher Dialog
- Vollständige i18n (EN/DE)

**Geschätzte Zeilen**: ~1360
**Geschätzte Zeit**: 4-6 Stunden

---

### Phase 2: Extended Features - Priority: MITTEL
**Ziel**: Erweiterte Funktionen für Power-User

**Tasks**:
1. Lamellen-Winkel implementieren - ~150 Zeilen
2. Lock-Status hinzufügen - ~120 Zeilen
3. Szenen/Presets System - ~200 Zeilen
4. Insektenschutz Layer - ~180 Zeilen
5. Alarmierung & Wetterintegration - ~160 Zeilen

**Geschätzte Zeilen**: +810
**Geschätzte Zeit**: 3-4 Stunden

---

### Phase 3: Advanced Features - Priority: NIEDRIG
**Ziel**: Premium-Features für spezielle Use Cases

**Tasks**:
1. Touch Gesten - ~120 Zeilen
2. Gruppierung & Multi-Window - ~250 Zeilen
3. Historie & Statistiken - ~300 Zeilen
4. Adaptive Steuerung (KI) - ~280 Zeilen

**Geschätzte Zeilen**: +950
**Geschätzte Zeit**: 5-7 Stunden

---

## 📐 Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│  OneIconToRuleThemAll Widget (index.tsx)                        │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │ Generic.tsx    │  │ State Manager  │  │ OID Subscriptions│  │
│  │ (Base Class)   │  │ (React State)  │  │ (Socket.io)      │  │
│  └────────────────┘  └────────────────┘  └──────────────────┘  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
           ┌─────────────────────┼──────────────────────┐
           │                     │                      │
           ▼                     ▼                      ▼
┌──────────────────────┐ ┌──────────────────┐ ┌─────────────────┐
│ WindowShutterMode    │ │ WindowShutterIcon│ │WindowShutterDialog│
│ (Logic Layer)        │ │ (Visualization)  │ │(User Interface) │
├──────────────────────┤ ├──────────────────┤ ├─────────────────┤
│ • Config Management  │ │ • SVG Generator  │ │ • Slider Controls│
│ • State Calculation  │ │ • Material Design│ │ • Quick Buttons  │
│ • OID Subscriptions  │ │ • Status Colors  │ │ • Status Display │
│ • Value Normalization│ │ • Responsive     │ │ • Touch-Friendly │
│ • Command Execution  │ │ • Rotation       │ │ • Multi-Tab      │
└──────────────────────┘ └──────────────────┘ └─────────────────┘
           │                     │                      │
           └─────────────────────┴──────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │  ioBroker Backend        │
                    │  (State Objects / OIDs)  │
                    └─────────────────────────┘
```

### Data Flow

```
1. INITIALIZATION:
   Widget Mount → WindowShutterMode.initialize()
              → Load all OID values
              → Subscribe to OID changes
              → Update Component State

2. STATE UPDATES (from ioBroker):
   OID Change → Socket Event
             → WindowShutterMode.handleStateChange()
             → Calculate new State (paneStates, hasOpenPanes, etc.)
             → setState() → Component Re-render
             → WindowShutterIcon updates visualization

3. USER INTERACTIONS:
   User Click/Slider → Dialog Action
                    → WindowShutterMode.setShutterPosition()
                    → setValue() → ioBroker
                    → Loop back to (2)

4. CLEANUP:
   Widget Unmount → WindowShutterMode.destroy()
                 → Clear caches
                 → Unsubscribe from OIDs
```

### Performance-Optimierungen

1. **Value Cache** (`Map<string, unknown>`):
   - Verhindert redundante `getState()` Calls
   - Schnellere Pane-State Berechnungen
   - ~70% weniger Socket-Traffic bei vielen Flügeln

2. **React.memo()** für Components:
   - WindowShutterIcon nur bei Props-Änderung re-rendern
   - Verhindert unnötige SVG-Regenerierung

3. **Debouncing** für Slider:
   - setValue() nur alle 200ms während Slider-Bewegung
   - Reduziert Last auf ioBroker

4. **Lazy State Calculation**:
   - Pane-States nur bei Sensor-Änderung neu berechnen
   - Nicht bei jedem Rolladen-Position Update

---

## 🎓 Best Practices & Lessons Learned

### 1. Modulare Architektur
**Problem**: Monolithische Widget-Dateien werden schnell unübersichtlich (>1000 Zeilen)
**Lösung**: Separation of Concerns in separate Ordner
- `types/` - Type Definitions
- `modes/` - Business Logic
- `components/` - UI Components
- `config/` - Configuration

**Vorteil**: Bessere Wartbarkeit, Testbarkeit, Wiederverwendbarkeit

### 2. Type Safety
**Problem**: Runtime-Fehler durch falsche Datentypen
**Lösung**: Strikte TypeScript Interfaces für alle Daten
```typescript
interface WindowShutterModeState {
    shutterPosition: number | null;  // Explizit nullable
    paneStates: Array<{              // Array mit klarer Struktur
        state: 'closed' | 'open' | 'tilt';  // Enum statt string
        ratio: number;
        hinge: 'left' | 'right' | 'top';
    }>;
}
```

### 3. Error Handling
**Problem**: Widget crasht bei fehlenden OIDs oder ungültigen Werten
**Lösung**: Graceful Degradation
```typescript
if (!this.config.shutterPositionOid) {
    console.warn('[WindowShutterMode] No shutterPositionOid configured');
    return; // Fallback auf default behavior
}
```

### 4. Configuration Patterns
**Problem**: Dynamische Anzahl von Flügeln (1-20) schwer zu konfigurieren
**Lösung**: `indexFrom/indexTo` Pattern (von Material Widget gelernt)
```typescript
{
    name: 'window_panes',
    indexFrom: 1,
    indexTo: 'windowPaneCount',  // Dynamisch!
    fields: [...]
}
```

### 5. i18n Pitfalls
**Problem**: Prefix wird automatisch hinzugefügt - Keys doppelt!
**Lösung**: Keys OHNE Prefix definieren, Framework fügt hinzu
```typescript
// ❌ FALSCH:
{ en: { vis_2_widgets_deluxe_heating: 'Heating' } }

// ✅ RICHTIG:
{ en: { heating: 'Heating' }, prefix: 'vis_2_widgets_deluxe_' }
```

---

**Status**: 📝 Detailliert geplant (Ready for Implementation)
**Gesamt (alle Phasen)**: ~3120 Zeilen
**MVP Zeit**: 4-6 Stunden
**Total Zeit (alle Phasen)**: 12-17 Stunden
