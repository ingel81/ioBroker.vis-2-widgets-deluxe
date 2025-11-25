# Implementierungsplan: Display-Modi für OneIconToRuleThemAll

**Version**: 1.0
**Datum**: 2025-11-25
**Status**: Genehmigt - Ready for Implementation

---

## 📋 Inhaltsverzeichnis

1. [Überblick & Ziele](#1-überblick--ziele)
2. [Feature-Spezifikation](#2-feature-spezifikation)
3. [Architektur-Analyse](#3-architektur-analyse)
4. [Neue Komponenten-Übersicht](#4-neue-komponenten-übersicht)
5. [Implementierung: Types & Enums](#5-implementierung-types--enums)
6. [Implementierung: Utility-Funktionen](#6-implementierung-utility-funktionen)
7. [Implementierung: NumericDisplayMode](#7-implementierung-numericdisplaymode)
8. [Implementierung: StringDisplayMode](#8-implementierung-stringdisplaymode)
9. [Implementierung: Widget-Integration](#9-implementierung-widget-integration)
10. [Implementierung: Config (widgetInfo.ts)](#10-implementierung-config-widgetinfots)
11. [Implementierung: Übersetzungen](#11-implementierung-übersetzungen)
12. [Testing-Strategie](#12-testing-strategie)
13. [Checkliste](#13-checkliste)

---

## 1. Überblick & Ziele

### 1.1 Motivation

Erweiterung von **OneIconToRuleThemAll** um zwei neue Display-Modi für reine Werteanzeige ohne Interaktion/Dialog.

**Use Cases:**
- Temperatur-Anzeige mit Schwellwert-Farben
- Status-Text mit Icon (z.B. "Online", "Offline")
- Numerische Sensordaten (Luftfeuchtigkeit, Leistung, etc.)
- Einfache Info-Kacheln in vis-2 Dashboards

### 1.2 Ziele

✅ **Nahtlose Integration** in bestehendes OneIconToRuleThemAll Widget
✅ **Keine Code-Duplizierung** - Wiederverwendung aller existierenden Komponenten
✅ **Konsistentes Pattern** - Gleiche Architektur wie Heating/Dimmer/Switch/WindowShutter
✅ **Flexibles Styling** - Analog zu bestehenden Modi (Farben, Größen, Layout)
✅ **Professional UX** - Formatierung, Farb-Schwellwerte, Value-Mapping

### 1.3 Neue Modi

| Modus | Zweck | Features |
|-------|-------|----------|
| **NumericDisplayMode** | Zahlenanzeige | Formatierung, Runden, Tausender-/Dezimaltrennzeichen, Unit, Schwellwert-Farben, Value-Mapping |
| **StringDisplayMode** | Text-Anzeige | Max-Length, Text-Transform, Value-Mapping |

---

## 2. Feature-Spezifikation

### 2.1 Gemeinsame Features (beide Modi)

#### 2.1.1 Layout-Optionen

**Icon-Position** (4 Varianten):
- `left` - Icon links, Wert rechts (Einzeiler)
- `right` - Icon rechts, Wert links (Einzeiler)
- `top` - Icon oben, Wert unten (gestackt)
- `bottom` - Icon unten, Wert oben (gestackt)

**Card-Support:**
- `showCard` - Optional Card-Wrapper (wie andere Modi)
- Alle Card-Config-Optionen (Border-Radius, Background, etc.)

#### 2.1.2 Farb-Schwellwerte (3-Zonen-Modell)

**Konfiguration:**
```
Niedrig  (<= Schwellwert 1) → Farbe 1 (z.B. Blau)
Mittel   (> SW1, <= SW2)    → Farbe 2 (z.B. Grün)
Hoch     (> Schwellwert 2)  → Farbe 3 (z.B. Rot)
```

**Anwendung:**
- Text-Farbe
- Icon-Farbe (optional separate Config)

**Beispiel:**
```
Temperatur:
  <= 18°C   → Blau
  18-25°C   → Grün
  > 25°C    → Rot
```

#### 2.1.3 Prefix/Suffix Text

**Statischer Text** vor/nach dem Wert:
```
Prefix: "Aktuell: "
Value:  "23.5"
Unit:   " °C"
Suffix: " im Wohnzimmer"

→ "Aktuell: 23.5 °C im Wohnzimmer"
```

#### 2.1.4 Größen & Styling

Analog zu bestehenden Modi:
- `iconSize` - Icon-Größe in px
- `iconRotation` - Icon-Drehung in Grad
- `textFontSize` - Schriftgröße des Wertes
- `textFontWeight` - Fett (normal, bold)
- `textAlign` - Ausrichtung (left, center, right)

#### 2.1.5 Interaktion (Optional)

**Click-Action:**
- `none` - Keine Aktion (default)
- `navigate` - Navigation zu anderer vis-2 View
  - Config: `targetView` (View-ID)

**Kein Dialog!** (Display-Modi sind read-only)

---

### 2.2 NumericDisplayMode Features

#### 2.2.1 Zahlen-Formatierung

**Dezimalstellen:**
- `decimals` - Anzahl Nachkommastellen (0-5)
- `decimalMode` - Runden vs. Abschneiden
  - `round` - Mathematisches Runden (default)
  - `floor` - Abrunden
  - `ceil` - Aufrunden
  - `trunc` - Abschneiden

**Trennzeichen:**
- `decimalSeparator` - Dezimaltrennzeichen (`.` oder `,`)
- `thousandSeparator` - Tausendertrennzeichen (`.`, `,`, `'`, ` `, oder `none`)

**Beispiele:**
```javascript
// Input: 1234.5678

decimals: 2, round, '.', ','     → "1,234.57"
decimals: 1, floor, ',', '.'     → "1.234,5"
decimals: 0, ceil,  '.', ' '     → "1 235"
decimals: 3, trunc, ',', 'none'  → "1234,567"
```

#### 2.2.2 Unit PostFix

**Unit-String** direkt nach dem Wert (vor Suffix):
```
Value: 23.5
Unit:  " °C"

→ "23.5 °C"
```

**Beispiele:**
- ` °C`, ` °F` - Temperatur
- ` kWh`, ` W` - Energie/Leistung
- ` %` - Prozent
- ` ppm` - Parts per million
- ` hPa` - Luftdruck

#### 2.2.3 Value-Mapping

**Wert-Ersetzung** für spezifische numerische Werte:

```javascript
ValueMap: {
  "0": "Geschlossen",
  "1": "Offen",
  "2": "Gekippt"
}

Input: 1 → Output: "Offen"
Input: 42 → Output: "42" (kein Mapping → formatierter Wert)
```

**Use Cases:**
- Boolean-States (0/1 → Off/On)
- Enums (0/1/2/3 → Status-Texte)
- Spezielle Werte (-999 → "N/A")

---

### 2.3 StringDisplayMode Features

#### 2.3.1 String-Optionen

**Max Length:**
- `maxLength` - Maximale Zeichenanzahl
- `ellipsis` - Abschneiden mit "..." (default: true)

```javascript
maxLength: 20, ellipsis: true
Input:  "Das ist ein sehr langer Text"
Output: "Das ist ein sehr..."
```

**Text Transform:**
- `none` - Keine Änderung (default)
- `uppercase` - GROSSBUCHSTABEN
- `lowercase` - kleinbuchstaben
- `capitalize` - Erster Buchstabe groß

#### 2.3.2 Value-Mapping

**String-Ersetzung:**

```javascript
ValueMap: {
  "online": "✓ Online",
  "offline": "✗ Offline",
  "error": "⚠ Fehler"
}
```

**Use Cases:**
- Status-Übersetzungen
- Icon-Präfixe hinzufügen
- Benutzerfreundliche Labels

---

## 3. Architektur-Analyse

### 3.1 Bestehende Patterns

#### 3.1.1 Mode-Klassen-Struktur

**Alle Mode-Klassen** folgen diesem Pattern:

```typescript
export class SomeMode {
    private config: SomeModeConfig;
    private socket: SocketLike;
    private setState: (state: Partial<SomeModeState>) => void;
    private setValue: (oid: string, value: unknown) => void;

    constructor(
        config: SomeModeConfig,
        socket: SocketLike,
        setState: (state: Partial<SomeModeState>) => void,
        setValue: (oid: string, value: unknown) => void
    ) {
        this.config = config;
        this.socket = socket;
        this.setState = setState;
        this.setValue = setValue;
    }

    async initialize(): Promise<void> { /* OID-Werte laden */ }

    getSubscriptionOids(): string[] { /* OIDs für Subscriptions */ }

    handleStateChange(id: string, value: unknown): void { /* State-Updates */ }

    isActive(state: SomeModeState): boolean { /* Widget "aktiv"? */ }

    destroy(): void { /* Cleanup */ }
}
```

**Wichtig:**
- ✅ Dependency Injection über Constructor
- ✅ Callbacks für State-Updates (`setState`)
- ✅ Callbacks für OID-Writes (`setValue`)
- ✅ Einheitliches Interface für alle Modi

#### 3.1.2 State-Management Pattern

**Widget-State-Struktur:**

```typescript
export interface OneIconToRuleThemAllState extends VisRxWidgetState {
    dialog: boolean;
    oidName: string | null;

    // Jeder Mode hat eigenen State-Namespace!
    heating: HeatingModeState;
    dimmer: DimmerModeState;
    switch: SwitchModeState;
    windowShutter: WindowShutterModeState;
}
```

**setState-Callback** merged Mode-State:

```typescript
// Im Widget-Constructor:
this.heatingMode = new HeatingMode(
    { /* config */ },
    this.props.context.socket,
    updates => this.setState({
        heating: { ...this.state.heating, ...updates }  // Merge!
    }),
    (oid, val) => this.props.context.setValue(oid, val)
);
```

#### 3.1.3 Config-Reading Pattern

**Aus `rxData` lesen:**

```typescript
// Im Widget-Code:
const setpointOid = this.state.rxData.heatingSetpointOid;
const minValue = this.state.rxData.heatingMinValue ?? 15;

// An Mode-Klasse übergeben:
this.heatingMode = new HeatingMode(
    {
        setpointOid: this.state.rxData.heatingSetpointOid,
        minValue: this.state.rxData.heatingMinValue,
        // ...
    },
    // ...
);
```

**Config-Values mit Default:**

```typescript
const decimals = this.state.rxData.displayDecimals ?? 0;
```

#### 3.1.4 componentDidUpdate Pattern

**OID-Value-Changes** werden über `getPropertyValue()` erkannt:

```typescript
componentDidUpdate(prevProps, prevState): void {
    switch (this.state.rxData.mode) {
        case FlexMode.HEATING_KNX:
            if (this.state.rxData.heatingSetpointOid) {
                const value = this.getPropertyValue('heatingSetpointOid');
                if (value !== null && value !== undefined) {
                    const numValue = Number(value);
                    if (numValue !== this.state.heating.setpointValue) {
                        this.setState({
                            heating: {
                                ...this.state.heating,
                                setpointValue: numValue
                            }
                        });
                    }
                }
            }
            break;
    }
}
```

**Config-Changes** erfordern Mode-Neuinitialisierung:

```typescript
const prevRxData = prevState.rxData as unknown as RxData;
const configChanged =
    this.state.rxData.someOid !== prevRxData.someOid;

if (configChanged) {
    this.someMode = new SomeMode(/* ... */);
    await this.someMode.initialize();
}
```

#### 3.1.5 Wiederverwendbare UI-Komponenten

**CardWrapper** - Card-Container:

```typescript
<CardWrapper
    showCard={this.state.rxData.showCard}
    backgroundColor={this.state.rxData.cardBackgroundColor}
    borderRadiusTL={this.state.rxData.cardBorderRadiusTL}
    borderRadiusTR={this.state.rxData.cardBorderRadiusTR}
    borderRadiusBL={this.state.rxData.cardBorderRadiusBL}
    borderRadiusBR={this.state.rxData.cardBorderRadiusBR}
    usedInWidget={this.props.widget.usedInWidget}
>
    {/* Content */}
</CardWrapper>
```

**IconWithStatus** - Icon + Text-Overlays:

```typescript
<IconWithStatus
    icon={this.state.rxData.icon}
    iconInactive={this.state.rxData.iconInactive}
    useDifferentInactiveIcon={this.state.rxData.useDifferentInactiveIcon}
    iconSize={this.state.rxData.iconSize}
    iconRotation={this.state.rxData.iconRotation}
    activeColor={this.state.rxData.activeColor}
    inactiveColor={this.state.rxData.inactiveColor}
    isActive={this.getIsActive()}
    onClick={this.handleClick}
    editMode={this.state.editMode}
    topText={this.getTopText()}      // Optional: Overlay oben
    bottomText={this.getBottomText()} // Optional: Overlay unten
    statusFontSize={this.state.rxData.statusFontSize}
/>
```

### 3.2 Pattern für Display-Modi

Display-Modi unterscheiden sich von interaktiven Modi:

| Aspekt | Interaktive Modi | Display-Modi |
|--------|------------------|--------------|
| **Dialog** | hasDialog: true | hasDialog: false |
| **setValue** | Wird genutzt | NICHT genutzt |
| **isActive()** | Logik implementiert | `return false` |
| **handleClick** | Dialog öffnen / Toggle | Optional Navigation |
| **UI** | Dialog-Komponente | Nur Icon + Text-Overlays |

**Minimal-Mode-Klasse für Display:**

```typescript
export class DisplayMode {
    private config: DisplayModeConfig;
    private socket: SocketLike;
    private setState: (state: Partial<DisplayModeState>) => void;
    // setValue wird NICHT genutzt!

    constructor(
        config: DisplayModeConfig,
        socket: SocketLike,
        setState: (state: Partial<DisplayModeState>) => void,
        _setValue: (oid: string, value: unknown) => void  // Unused!
    ) { /* ... */ }

    async initialize(): Promise<void> {
        // Nur getState(), kein setValue()
    }

    handleStateChange(_id: string, value: unknown): void {
        this.setState({ value });
    }

    isActive(_state: DisplayModeState): boolean {
        return false;  // Display-Modi sind nie "aktiv"
    }

    destroy(): void {
        // Noop
    }
}
```

---

## 4. Neue Komponenten-Übersicht

### 4.1 Dateistruktur

```
src-widgets/src/OneIconToRuleThemAll/
├── modes/
│   ├── HeatingMode.ts              # Bestehend
│   ├── DimmerMode.ts               # Bestehend
│   ├── SwitchMode.ts               # Bestehend
│   ├── WindowShutterMode.ts        # Bestehend
│   ├── NumericDisplayMode.ts       # ✨ NEU
│   └── StringDisplayMode.ts        # ✨ NEU
├── components/
│   ├── CardWrapper.tsx             # Bestehend (Wiederverwendung!)
│   ├── IconWithStatus.tsx          # Bestehend (Wiederverwendung!)
│   ├── DisplayValue.tsx            # ✨ NEU (Optional, für komplexes Layout)
│   └── ...
├── utils/
│   ├── numberFormatter.ts          # ✨ NEU
│   ├── colorThresholds.ts          # ✨ NEU
│   └── valueMapper.ts              # ✨ NEU
├── types/
│   └── index.ts                    # 🔧 UPDATE (neue Enums, Interfaces)
└── config/
    └── widgetInfo.ts               # 🔧 UPDATE (neue Config-Felder)
```

### 4.2 Komponenten-Verantwortlichkeiten

| Datei | Verantwortung | Code-Umfang |
|-------|---------------|-------------|
| `types/index.ts` | Enums, Interfaces für Display-Modi | ~50 Zeilen |
| `utils/numberFormatter.ts` | Zahlen-Formatierung (Decimals, Separators, Unit) | ~100 Zeilen |
| `utils/colorThresholds.ts` | 3-Zonen Farb-Logik | ~50 Zeilen |
| `utils/valueMapper.ts` | Value-Mapping (Object → String) | ~30 Zeilen |
| `modes/NumericDisplayMode.ts` | Numeric-Logik, Formatierung, Schwellwerte | ~150 Zeilen |
| `modes/StringDisplayMode.ts` | String-Logik, Transform, Mapping | ~100 Zeilen |
| `components/DisplayValue.tsx` | Optional: Layout-Komponente für komplexe Layouts | ~100 Zeilen |
| `config/widgetInfo.ts` | Config-Felder für Display-Modi | ~200 Zeilen |
| `index.tsx` | Integration in Hauptkomponente | ~100 Zeilen (Changes) |

**Gesamt**: ~880 Zeilen neuer Code (verteilt auf 7 Dateien)

---

## 5. Implementierung: Types & Enums

### 5.1 FlexMode Enum erweitern

**Datei**: `src-widgets/src/OneIconToRuleThemAll/types/index.ts`

```typescript
export enum FlexMode {
    DIMMER_DIALOG = 'dimmer_dialog',
    SWITCH = 'switch',
    HEATING_KNX = 'heating_knx',
    WINDOW_SHUTTER = 'window_shutter',

    // ✨ NEU: Display-Modi
    NUMERIC_DISPLAY = 'numeric_display',
    STRING_DISPLAY = 'string_display',
}
```

### 5.2 Icon-Position Enum

```typescript
export enum IconPosition {
    LEFT = 'left',
    RIGHT = 'right',
    TOP = 'top',
    BOTTOM = 'bottom',
}
```

### 5.3 Decimal Mode Enum

```typescript
export enum DecimalMode {
    ROUND = 'round',   // Mathematisches Runden
    FLOOR = 'floor',   // Abrunden
    CEIL = 'ceil',     // Aufrunden
    TRUNC = 'trunc',   // Abschneiden
}
```

### 5.4 Decimal/Thousand Separator Enums

```typescript
export enum DecimalSeparator {
    DOT = '.',
    COMMA = ',',
}

export enum ThousandSeparator {
    NONE = 'none',
    DOT = '.',
    COMMA = ',',
    APOSTROPHE = "'",
    SPACE = ' ',
}
```

### 5.5 Text Transform Enum

```typescript
export enum TextTransform {
    NONE = 'none',
    UPPERCASE = 'uppercase',
    LOWERCASE = 'lowercase',
    CAPITALIZE = 'capitalize',
}
```

### 5.6 Click Action Enum

```typescript
export enum ClickAction {
    NONE = 'none',
    NAVIGATE = 'navigate',
}
```

### 5.7 NumericDisplayMode Interfaces

#### 5.7.1 Config Interface

```typescript
export interface NumericDisplayModeConfig {
    // OID
    valueOid?: string;

    // Formatierung
    decimals?: number;                      // 0-5, default: 0
    decimalMode?: DecimalMode;              // default: ROUND
    decimalSeparator?: DecimalSeparator;    // default: DOT
    thousandSeparator?: ThousandSeparator;  // default: NONE
    unit?: string;                          // default: ''

    // Prefix/Suffix
    prefix?: string;                        // default: ''
    suffix?: string;                        // default: ''

    // Value-Mapping
    valueMapping?: Record<string, string>;  // { "0": "Off", "1": "On" }

    // Farb-Schwellwerte
    useColorThresholds?: boolean;           // default: false
    thresholdLow?: number;                  // default: 0
    thresholdHigh?: number;                 // default: 100
    colorLow?: string;                      // default: '#2196f3' (blue)
    colorMedium?: string;                   // default: '#4caf50' (green)
    colorHigh?: string;                     // default: '#f44336' (red)
}
```

#### 5.7.2 State Interface

```typescript
export interface NumericDisplayModeState {
    value: number | null;
    formattedValue: string;    // Formatierter String
    currentColor: string;      // Aktuelle Farbe (basierend auf Schwellwerten)
}
```

### 5.8 StringDisplayMode Interfaces

#### 5.8.1 Config Interface

```typescript
export interface StringDisplayModeConfig {
    // OID
    valueOid?: string;

    // String-Optionen
    maxLength?: number;                     // default: 50
    ellipsis?: boolean;                     // default: true
    textTransform?: TextTransform;          // default: NONE

    // Prefix/Suffix
    prefix?: string;                        // default: ''
    suffix?: string;                        // default: ''

    // Value-Mapping
    valueMapping?: Record<string, string>;  // { "online": "✓ Online" }
}
```

#### 5.8.2 State Interface

```typescript
export interface StringDisplayModeState {
    value: string | null;
    formattedValue: string;    // Formatierter String
}
```

### 5.9 Widget-State erweitern

```typescript
export interface OneIconToRuleThemAllState extends VisRxWidgetState {
    dialog: boolean;
    oidName: string | null;

    // Bestehende Modi
    heating: HeatingModeState;
    dimmer: DimmerModeState;
    switch: SwitchModeState;
    windowShutter: WindowShutterModeState;

    // ✨ NEU
    numericDisplay: NumericDisplayModeState;
    stringDisplay: StringDisplayModeState;
}
```

### 5.10 RxData Interface erweitern

```typescript
export interface RxData {
    // ... bestehende Felder

    // ✨ NEU: Gemeinsame Display-Felder
    displayIconPosition: IconPosition;
    displayClickAction: ClickAction;
    displayTargetView?: string;

    // ✨ NEU: NumericDisplayMode
    numericDisplayValueOid?: string;
    numericDisplayDecimals?: number;
    numericDisplayDecimalMode?: DecimalMode;
    numericDisplayDecimalSeparator?: DecimalSeparator;
    numericDisplayThousandSeparator?: ThousandSeparator;
    numericDisplayUnit?: string;
    numericDisplayPrefix?: string;
    numericDisplaySuffix?: string;
    numericDisplayUseColorThresholds?: boolean;
    numericDisplayThresholdLow?: number;
    numericDisplayThresholdHigh?: number;
    numericDisplayColorLow?: string;
    numericDisplayColorMedium?: string;
    numericDisplayColorHigh?: string;
    numericDisplayValueMapping?: string;  // JSON-String!

    // ✨ NEU: StringDisplayMode
    stringDisplayValueOid?: string;
    stringDisplayMaxLength?: number;
    stringDisplayEllipsis?: boolean;
    stringDisplayTextTransform?: TextTransform;
    stringDisplayPrefix?: string;
    stringDisplaySuffix?: string;
    stringDisplayValueMapping?: string;  // JSON-String!
}
```

**Wichtig**: Value-Mapping wird als **JSON-String** in Config gespeichert!

---

## 6. Implementierung: Utility-Funktionen

### 6.1 numberFormatter.ts

**Datei**: `src-widgets/src/OneIconToRuleThemAll/utils/numberFormatter.ts`

```typescript
import {
    DecimalMode,
    DecimalSeparator,
    ThousandSeparator,
} from '../types';

export interface NumberFormatOptions {
    decimals?: number;                      // Default: 0
    decimalMode?: DecimalMode;              // Default: ROUND
    decimalSeparator?: DecimalSeparator;    // Default: DOT
    thousandSeparator?: ThousandSeparator;  // Default: NONE
    unit?: string;                          // Default: ''
}

/**
 * Formatiert eine Zahl mit konfigurierbaren Optionen
 */
export function formatNumber(
    value: number | null | undefined,
    options: NumberFormatOptions = {}
): string {
    // Defaults
    const decimals = options.decimals ?? 0;
    const decimalMode = options.decimalMode ?? DecimalMode.ROUND;
    const decimalSeparator = options.decimalSeparator ?? DecimalSeparator.DOT;
    const thousandSeparator = options.thousandSeparator ?? ThousandSeparator.NONE;
    const unit = options.unit ?? '';

    // Null/Undefined-Handling
    if (value === null || value === undefined || isNaN(value)) {
        return '--';
    }

    // 1. Dezimal-Modus anwenden
    let processedValue: number;
    const factor = Math.pow(10, decimals);

    switch (decimalMode) {
        case DecimalMode.ROUND:
            processedValue = Math.round(value * factor) / factor;
            break;
        case DecimalMode.FLOOR:
            processedValue = Math.floor(value * factor) / factor;
            break;
        case DecimalMode.CEIL:
            processedValue = Math.ceil(value * factor) / factor;
            break;
        case DecimalMode.TRUNC:
            processedValue = Math.trunc(value * factor) / factor;
            break;
        default:
            processedValue = Math.round(value * factor) / factor;
    }

    // 2. Zu Fixed-String konvertieren
    const fixedString = processedValue.toFixed(decimals);

    // 3. In Integer- und Decimal-Teil splitten
    const [integerPart, decimalPart] = fixedString.split('.');

    // 4. Tausendertrennzeichen einfügen
    let formattedInteger = integerPart;
    if (thousandSeparator !== ThousandSeparator.NONE) {
        const separator = thousandSeparator === ThousandSeparator.SPACE
            ? ' '
            : thousandSeparator;

        // Regex: Füge Separator alle 3 Ziffern (von rechts) ein
        formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    }

    // 5. Dezimaltrennzeichen anwenden
    let result = formattedInteger;
    if (decimals > 0 && decimalPart) {
        result += decimalSeparator + decimalPart;
    }

    // 6. Unit anhängen
    if (unit) {
        result += unit;
    }

    return result;
}

/**
 * Testet ob ein Wert eine valide Zahl ist
 */
export function isValidNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Konvertiert unknown zu number (sicher)
 */
export function toNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === 'number') {
        return isValidNumber(value) ? value : null;
    }

    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isValidNumber(parsed) ? parsed : null;
    }

    return null;
}
```

**Tests** (Beispiele):

```typescript
formatNumber(1234.5678, { decimals: 2 })
// → "1234.57"

formatNumber(1234.5678, { decimals: 2, thousandSeparator: ThousandSeparator.COMMA })
// → "1,234.57"

formatNumber(1234.5678, { decimals: 1, decimalSeparator: DecimalSeparator.COMMA })
// → "1234,6"

formatNumber(1234.5678, { decimals: 2, unit: ' °C' })
// → "1234.57 °C"

formatNumber(1234.5678, {
    decimals: 2,
    decimalSeparator: DecimalSeparator.COMMA,
    thousandSeparator: ThousandSeparator.DOT,
    unit: ' €'
})
// → "1.234,57 €"
```

---

### 6.2 colorThresholds.ts

**Datei**: `src-widgets/src/OneIconToRuleThemAll/utils/colorThresholds.ts`

```typescript
export interface ColorThresholdConfig {
    enabled: boolean;
    thresholdLow: number;
    thresholdHigh: number;
    colorLow: string;
    colorMedium: string;
    colorHigh: string;
}

/**
 * Berechnet Farbe basierend auf 3-Zonen-Schwellwerten
 *
 * Logik:
 *   value <= thresholdLow  → colorLow
 *   value <= thresholdHigh → colorMedium
 *   value >  thresholdHigh → colorHigh
 */
export function getColorByThreshold(
    value: number | null,
    config: ColorThresholdConfig
): string | null {
    // Disabled oder kein Wert
    if (!config.enabled || value === null) {
        return null;
    }

    // 3-Zonen-Logik
    if (value <= config.thresholdLow) {
        return config.colorLow;
    } else if (value <= config.thresholdHigh) {
        return config.colorMedium;
    } else {
        return config.colorHigh;
    }
}

/**
 * Validiert Threshold-Konfiguration
 */
export function validateThresholdConfig(config: ColorThresholdConfig): {
    valid: boolean;
    error?: string;
} {
    if (config.thresholdLow >= config.thresholdHigh) {
        return {
            valid: false,
            error: 'Threshold Low must be less than Threshold High'
        };
    }

    // Farb-Validation (HEX-Format)
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexRegex.test(config.colorLow) ||
        !hexRegex.test(config.colorMedium) ||
        !hexRegex.test(config.colorHigh)) {
        return {
            valid: false,
            error: 'Colors must be in HEX format (#RRGGBB)'
        };
    }

    return { valid: true };
}
```

**Tests** (Beispiele):

```typescript
const config = {
    enabled: true,
    thresholdLow: 18,
    thresholdHigh: 25,
    colorLow: '#2196f3',    // Blau
    colorMedium: '#4caf50', // Grün
    colorHigh: '#f44336',   // Rot
};

getColorByThreshold(15, config)  // → '#2196f3' (Blau)
getColorByThreshold(20, config)  // → '#4caf50' (Grün)
getColorByThreshold(30, config)  // → '#f44336' (Rot)
getColorByThreshold(null, config) // → null
```

---

### 6.3 valueMapper.ts

**Datei**: `src-widgets/src/OneIconToRuleThemAll/utils/valueMapper.ts`

```typescript
/**
 * Mappt einen Wert zu einem String basierend auf Mapping-Object
 *
 * @param value - Der zu mappende Wert
 * @param mapping - Mapping-Object { "key": "value" }
 * @param fallback - Fallback-String wenn kein Mapping gefunden
 * @returns Gemappter String oder fallback
 */
export function mapValue(
    value: unknown,
    mapping: Record<string, string> | undefined,
    fallback: string
): string {
    // Kein Mapping definiert
    if (!mapping || Object.keys(mapping).length === 0) {
        return fallback;
    }

    // Value zu String konvertieren
    const valueStr = String(value);

    // Mapping vorhanden?
    if (valueStr in mapping) {
        return mapping[valueStr];
    }

    // Kein Mapping gefunden → Fallback
    return fallback;
}

/**
 * Parsed JSON-String zu Mapping-Object
 *
 * @param jsonString - JSON-String aus Config
 * @returns Mapping-Object oder undefined bei Fehler
 */
export function parseValueMapping(
    jsonString: string | undefined
): Record<string, string> | undefined {
    if (!jsonString || jsonString.trim() === '') {
        return undefined;
    }

    try {
        const parsed = JSON.parse(jsonString);

        // Validierung: Muss Object sein
        if (typeof parsed !== 'object' || Array.isArray(parsed)) {
            console.warn('Value mapping must be an object:', jsonString);
            return undefined;
        }

        // Validierung: Alle Values müssen Strings sein
        const mapping: Record<string, string> = {};
        for (const [key, value] of Object.entries(parsed)) {
            if (typeof value !== 'string') {
                console.warn(`Value mapping for key "${key}" must be a string:`, value);
                continue;
            }
            mapping[key] = value;
        }

        return Object.keys(mapping).length > 0 ? mapping : undefined;
    } catch (error) {
        console.error('Failed to parse value mapping:', jsonString, error);
        return undefined;
    }
}
```

**Tests** (Beispiele):

```typescript
const mapping = {
    "0": "Aus",
    "1": "An",
    "2": "Auto"
};

mapValue(0, mapping, '0')      // → "Aus"
mapValue(1, mapping, '1')      // → "An"
mapValue(42, mapping, '42')    // → "42" (Fallback)
mapValue(null, mapping, '--')  // → "--" (Fallback)

// JSON-Parsing
parseValueMapping('{"0":"Off","1":"On"}')
// → { "0": "Off", "1": "On" }

parseValueMapping('invalid json')
// → undefined (+ console.error)
```

---

## 7. Implementierung: NumericDisplayMode

**Datei**: `src-widgets/src/OneIconToRuleThemAll/modes/NumericDisplayMode.ts`

```typescript
import type { SocketLike } from '../types';
import type {
    NumericDisplayModeConfig,
    NumericDisplayModeState
} from '../types';
import { formatNumber, toNumber } from '../utils/numberFormatter';
import { getColorByThreshold } from '../utils/colorThresholds';
import { mapValue, parseValueMapping } from '../utils/valueMapper';

/**
 * NumericDisplayMode - Read-only numerische Werteanzeige
 *
 * Features:
 * - Zahlen-Formatierung (Decimals, Separators, Unit)
 * - 3-Zonen Farb-Schwellwerte
 * - Value-Mapping (für numerische Enums)
 * - Prefix/Suffix
 */
export class NumericDisplayMode {
    private config: NumericDisplayModeConfig;
    private socket: SocketLike;
    private setState: (state: Partial<NumericDisplayModeState>) => void;

    // setValue wird für Display-Modi NICHT benötigt!

    constructor(
        config: NumericDisplayModeConfig,
        socket: SocketLike,
        setState: (state: Partial<NumericDisplayModeState>) => void,
        _setValue: (oid: string, value: unknown) => void  // Unused
    ) {
        this.config = config;
        this.socket = socket;
        this.setState = setState;
    }

    /**
     * Initialisierung: OID-Wert laden
     */
    async initialize(): Promise<void> {
        if (!this.config.valueOid) {
            this.setState({
                value: null,
                formattedValue: '--',
                currentColor: this.getDefaultColor()
            });
            return;
        }

        try {
            const state = await this.socket.getState(this.config.valueOid);
            if (state?.val !== undefined) {
                this.updateValue(state.val);
            } else {
                this.setState({
                    value: null,
                    formattedValue: '--',
                    currentColor: this.getDefaultColor()
                });
            }
        } catch (error) {
            console.error('Failed to initialize NumericDisplayMode:', error);
            this.setState({
                value: null,
                formattedValue: '--',
                currentColor: this.getDefaultColor()
            });
        }
    }

    /**
     * OIDs für Subscriptions
     */
    getSubscriptionOids(): string[] {
        return this.config.valueOid ? [this.config.valueOid] : [];
    }

    /**
     * State-Change Handler
     */
    handleStateChange(_id: string, value: unknown): void {
        this.updateValue(value);
    }

    /**
     * Aktualisiert Value + formattierten String + Farbe
     */
    private updateValue(rawValue: unknown): void {
        const numValue = toNumber(rawValue);

        if (numValue === null) {
            this.setState({
                value: null,
                formattedValue: '--',
                currentColor: this.getDefaultColor()
            });
            return;
        }

        // Value-Mapping hat Priorität!
        const valueMapping = parseValueMapping(this.config.valueMapping);
        if (valueMapping) {
            const mapped = mapValue(
                numValue,
                valueMapping,
                this.formatNumberValue(numValue)
            );

            // Bei Mapping: Farbe basierend auf Schwellwerten
            const color = this.getColorForValue(numValue);

            this.setState({
                value: numValue,
                formattedValue: this.applyPrefixSuffix(mapped),
                currentColor: color
            });
            return;
        }

        // Standard-Formatierung
        const formatted = this.formatNumberValue(numValue);
        const color = this.getColorForValue(numValue);

        this.setState({
            value: numValue,
            formattedValue: this.applyPrefixSuffix(formatted),
            currentColor: color
        });
    }

    /**
     * Formatiert numerischen Wert
     */
    private formatNumberValue(value: number): string {
        return formatNumber(value, {
            decimals: this.config.decimals,
            decimalMode: this.config.decimalMode,
            decimalSeparator: this.config.decimalSeparator,
            thousandSeparator: this.config.thousandSeparator,
            unit: this.config.unit,
        });
    }

    /**
     * Fügt Prefix/Suffix hinzu
     */
    private applyPrefixSuffix(value: string): string {
        const prefix = this.config.prefix ?? '';
        const suffix = this.config.suffix ?? '';
        return `${prefix}${value}${suffix}`;
    }

    /**
     * Berechnet Farbe basierend auf Schwellwerten
     */
    private getColorForValue(value: number | null): string {
        if (!this.config.useColorThresholds || value === null) {
            return this.getDefaultColor();
        }

        const color = getColorByThreshold(value, {
            enabled: true,
            thresholdLow: this.config.thresholdLow ?? 0,
            thresholdHigh: this.config.thresholdHigh ?? 100,
            colorLow: this.config.colorLow ?? '#2196f3',
            colorMedium: this.config.colorMedium ?? '#4caf50',
            colorHigh: this.config.colorHigh ?? '#f44336',
        });

        return color ?? this.getDefaultColor();
    }

    /**
     * Default-Farbe (keine Schwellwerte)
     */
    private getDefaultColor(): string {
        // Verwendet die Standard-Text-Farbe vom Widget
        return '';  // Empty string = keine spezielle Farbe (Widget-Default)
    }

    /**
     * Display-Modi sind nie "aktiv"
     */
    isActive(_state: NumericDisplayModeState): boolean {
        return false;
    }

    /**
     * Cleanup (noop für Display-Modi)
     */
    destroy(): void {
        // Noop
    }
}
```

**Verwendung im Widget:**

```typescript
// Constructor
this.numericDisplayMode = new NumericDisplayMode(
    {
        valueOid: this.state.rxData.numericDisplayValueOid,
        decimals: this.state.rxData.numericDisplayDecimals ?? 0,
        decimalMode: this.state.rxData.numericDisplayDecimalMode,
        decimalSeparator: this.state.rxData.numericDisplayDecimalSeparator,
        thousandSeparator: this.state.rxData.numericDisplayThousandSeparator,
        unit: this.state.rxData.numericDisplayUnit,
        prefix: this.state.rxData.numericDisplayPrefix,
        suffix: this.state.rxData.numericDisplaySuffix,
        useColorThresholds: this.state.rxData.numericDisplayUseColorThresholds ?? false,
        thresholdLow: this.state.rxData.numericDisplayThresholdLow,
        thresholdHigh: this.state.rxData.numericDisplayThresholdHigh,
        colorLow: this.state.rxData.numericDisplayColorLow,
        colorMedium: this.state.rxData.numericDisplayColorMedium,
        colorHigh: this.state.rxData.numericDisplayColorHigh,
        valueMapping: this.state.rxData.numericDisplayValueMapping,
    },
    this.props.context.socket,
    updates => this.setState({
        numericDisplay: { ...this.state.numericDisplay, ...updates }
    }),
    (oid, val) => this.props.context.setValue(oid, val)
);
```

---

## 8. Implementierung: StringDisplayMode

**Datei**: `src-widgets/src/OneIconToRuleThemAll/modes/StringDisplayMode.ts`

```typescript
import type { SocketLike } from '../types';
import type {
    StringDisplayModeConfig,
    StringDisplayModeState,
    TextTransform
} from '../types';
import { mapValue, parseValueMapping } from '../utils/valueMapper';

/**
 * StringDisplayMode - Read-only String-Anzeige
 *
 * Features:
 * - Max Length + Ellipsis
 * - Text Transform (uppercase, lowercase, capitalize)
 * - Value-Mapping
 * - Prefix/Suffix
 */
export class StringDisplayMode {
    private config: StringDisplayModeConfig;
    private socket: SocketLike;
    private setState: (state: Partial<StringDisplayModeState>) => void;

    constructor(
        config: StringDisplayModeConfig,
        socket: SocketLike,
        setState: (state: Partial<StringDisplayModeState>) => void,
        _setValue: (oid: string, value: unknown) => void  // Unused
    ) {
        this.config = config;
        this.socket = socket;
        this.setState = setState;
    }

    /**
     * Initialisierung: OID-Wert laden
     */
    async initialize(): Promise<void> {
        if (!this.config.valueOid) {
            this.setState({
                value: null,
                formattedValue: '--'
            });
            return;
        }

        try {
            const state = await this.socket.getState(this.config.valueOid);
            if (state?.val !== undefined) {
                this.updateValue(state.val);
            } else {
                this.setState({
                    value: null,
                    formattedValue: '--'
                });
            }
        } catch (error) {
            console.error('Failed to initialize StringDisplayMode:', error);
            this.setState({
                value: null,
                formattedValue: '--'
            });
        }
    }

    /**
     * OIDs für Subscriptions
     */
    getSubscriptionOids(): string[] {
        return this.config.valueOid ? [this.config.valueOid] : [];
    }

    /**
     * State-Change Handler
     */
    handleStateChange(_id: string, value: unknown): void {
        this.updateValue(value);
    }

    /**
     * Aktualisiert Value + formattierten String
     */
    private updateValue(rawValue: unknown): void {
        const strValue = this.toString(rawValue);

        if (strValue === null) {
            this.setState({
                value: null,
                formattedValue: '--'
            });
            return;
        }

        // Value-Mapping hat Priorität!
        const valueMapping = parseValueMapping(this.config.valueMapping);
        if (valueMapping) {
            const mapped = mapValue(
                strValue,
                valueMapping,
                this.formatStringValue(strValue)
            );

            this.setState({
                value: strValue,
                formattedValue: this.applyPrefixSuffix(mapped)
            });
            return;
        }

        // Standard-Formatierung
        const formatted = this.formatStringValue(strValue);

        this.setState({
            value: strValue,
            formattedValue: this.applyPrefixSuffix(formatted)
        });
    }

    /**
     * Konvertiert unknown zu String
     */
    private toString(value: unknown): string | null {
        if (value === null || value === undefined) {
            return null;
        }

        return String(value);
    }

    /**
     * Formatiert String-Wert
     */
    private formatStringValue(value: string): string {
        let result = value;

        // 1. Text Transform
        result = this.applyTextTransform(result);

        // 2. Max Length + Ellipsis
        result = this.applyMaxLength(result);

        return result;
    }

    /**
     * Wendet Text-Transformation an
     */
    private applyTextTransform(value: string): string {
        const transform = this.config.textTransform ?? 'none';

        switch (transform) {
            case 'uppercase':
                return value.toUpperCase();
            case 'lowercase':
                return value.toLowerCase();
            case 'capitalize':
                return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            case 'none':
            default:
                return value;
        }
    }

    /**
     * Wendet Max-Length an (mit Ellipsis)
     */
    private applyMaxLength(value: string): string {
        const maxLength = this.config.maxLength ?? 50;
        const ellipsis = this.config.ellipsis ?? true;

        if (value.length <= maxLength) {
            return value;
        }

        if (ellipsis) {
            return value.substring(0, maxLength - 3) + '...';
        } else {
            return value.substring(0, maxLength);
        }
    }

    /**
     * Fügt Prefix/Suffix hinzu
     */
    private applyPrefixSuffix(value: string): string {
        const prefix = this.config.prefix ?? '';
        const suffix = this.config.suffix ?? '';
        return `${prefix}${value}${suffix}`;
    }

    /**
     * Display-Modi sind nie "aktiv"
     */
    isActive(_state: StringDisplayModeState): boolean {
        return false;
    }

    /**
     * Cleanup (noop für Display-Modi)
     */
    destroy(): void {
        // Noop
    }
}
```

**Verwendung im Widget:**

```typescript
// Constructor
this.stringDisplayMode = new StringDisplayMode(
    {
        valueOid: this.state.rxData.stringDisplayValueOid,
        maxLength: this.state.rxData.stringDisplayMaxLength ?? 50,
        ellipsis: this.state.rxData.stringDisplayEllipsis ?? true,
        textTransform: this.state.rxData.stringDisplayTextTransform,
        prefix: this.state.rxData.stringDisplayPrefix,
        suffix: this.state.rxData.stringDisplaySuffix,
        valueMapping: this.state.rxData.stringDisplayValueMapping,
    },
    this.props.context.socket,
    updates => this.setState({
        stringDisplay: { ...this.state.stringDisplay, ...updates }
    }),
    (oid, val) => this.props.context.setValue(oid, val)
);
```

---

## 9. Implementierung: Widget-Integration

**Datei**: `src-widgets/src/OneIconToRuleThemAll/index.tsx`

### 9.1 Imports erweitern

```typescript
// Bestehende Imports...

// ✨ NEU: Display-Modi
import { NumericDisplayMode } from './modes/NumericDisplayMode';
import { StringDisplayMode } from './modes/StringDisplayMode';
import type {
    NumericDisplayModeState,
    StringDisplayModeState,
    IconPosition,
    ClickAction
} from './types';
```

### 9.2 Class Properties erweitern

```typescript
export default class OneIconToRuleThemAll extends Generic<RxData, OneIconToRuleThemAllState> {
    // Bestehende Mode-Instanzen...
    private heatingMode!: HeatingMode;
    private dimmerMode!: DimmerMode;
    private switchMode!: SwitchMode;
    private windowShutterMode!: WindowShutterMode;

    // ✨ NEU: Display-Modi
    private numericDisplayMode!: NumericDisplayMode;
    private stringDisplayMode!: StringDisplayMode;

    // ...
}
```

### 9.3 Constructor - State initialisieren

```typescript
constructor(props: RxWidgetInfoWriteable) {
    super(props);
    this.state = {
        ...this.state,
        dialog: false,
        oidName: null,
        heating: { /* ... */ },
        dimmer: { /* ... */ },
        switch: { /* ... */ },
        windowShutter: { /* ... */ },

        // ✨ NEU
        numericDisplay: {
            value: null,
            formattedValue: '--',
            currentColor: '',
        },
        stringDisplay: {
            value: null,
            formattedValue: '--',
        },
    };
}
```

### 9.4 initializeModes() erweitern

```typescript
private initializeModes(): void {
    // Bestehende Modi...

    // ✨ NEU: NumericDisplayMode
    this.numericDisplayMode = new NumericDisplayMode(
        {
            valueOid: this.state.rxData.numericDisplayValueOid,
            decimals: this.state.rxData.numericDisplayDecimals ?? 0,
            decimalMode: this.state.rxData.numericDisplayDecimalMode,
            decimalSeparator: this.state.rxData.numericDisplayDecimalSeparator,
            thousandSeparator: this.state.rxData.numericDisplayThousandSeparator,
            unit: this.state.rxData.numericDisplayUnit,
            prefix: this.state.rxData.numericDisplayPrefix,
            suffix: this.state.rxData.numericDisplaySuffix,
            useColorThresholds: this.state.rxData.numericDisplayUseColorThresholds ?? false,
            thresholdLow: this.state.rxData.numericDisplayThresholdLow,
            thresholdHigh: this.state.rxData.numericDisplayThresholdHigh,
            colorLow: this.state.rxData.numericDisplayColorLow,
            colorMedium: this.state.rxData.numericDisplayColorMedium,
            colorHigh: this.state.rxData.numericDisplayColorHigh,
            valueMapping: this.state.rxData.numericDisplayValueMapping,
        },
        this.props.context.socket,
        updates => this.setState({
            numericDisplay: { ...this.state.numericDisplay, ...updates }
        }),
        (oid, val) => this.props.context.setValue(oid, val)
    );

    // ✨ NEU: StringDisplayMode
    this.stringDisplayMode = new StringDisplayMode(
        {
            valueOid: this.state.rxData.stringDisplayValueOid,
            maxLength: this.state.rxData.stringDisplayMaxLength ?? 50,
            ellipsis: this.state.rxData.stringDisplayEllipsis ?? true,
            textTransform: this.state.rxData.stringDisplayTextTransform,
            prefix: this.state.rxData.stringDisplayPrefix,
            suffix: this.state.rxData.stringDisplaySuffix,
            valueMapping: this.state.rxData.stringDisplayValueMapping,
        },
        this.props.context.socket,
        updates => this.setState({
            stringDisplay: { ...this.state.stringDisplay, ...updates }
        }),
        (oid, val) => this.props.context.setValue(oid, val)
    );
}
```

### 9.5 componentDidMount erweitern

```typescript
async componentDidMount(): Promise<void> {
    super.componentDidMount();

    switch (this.state.rxData.mode) {
        // Bestehende Cases...

        // ✨ NEU
        case FlexMode.NUMERIC_DISPLAY:
            await this.numericDisplayMode.initialize();
            break;

        case FlexMode.STRING_DISPLAY:
            await this.stringDisplayMode.initialize();
            break;
    }

    // Dialog-Titel laden
    await this.fetchOidName();
}
```

### 9.6 componentDidUpdate erweitern

```typescript
componentDidUpdate(prevProps: RxWidgetInfoWriteable, prevState: OneIconToRuleThemAllState): void {
    // Dialog-Positionierung (bestehend)
    if (!prevState.dialog && this.state.dialog) {
        this.moveDialogIntoView();
    }

    const prevRxData = prevState.rxData as unknown as RxData;

    switch (this.state.rxData.mode) {
        // Bestehende Cases...

        // ✨ NEU: NumericDisplayMode
        case FlexMode.NUMERIC_DISPLAY: {
            // OID-Value-Change
            if (this.state.rxData.numericDisplayValueOid) {
                const value = this.getPropertyValue('numericDisplayValueOid');
                if (value !== null && value !== undefined) {
                    const numValue = Number(value);
                    if (numValue !== this.state.numericDisplay.value) {
                        this.numericDisplayMode.handleStateChange(
                            this.state.rxData.numericDisplayValueOid,
                            value
                        );
                    }
                }
            }

            // Config-Change → Neuinitialisierung
            const numericConfigChanged =
                this.state.rxData.numericDisplayValueOid !== prevRxData.numericDisplayValueOid ||
                this.state.rxData.numericDisplayDecimals !== prevRxData.numericDisplayDecimals ||
                this.state.rxData.numericDisplayUnit !== prevRxData.numericDisplayUnit ||
                this.state.rxData.numericDisplayUseColorThresholds !== prevRxData.numericDisplayUseColorThresholds;

            if (numericConfigChanged) {
                this.initializeModes();
                void this.numericDisplayMode.initialize();
            }
            break;
        }

        // ✨ NEU: StringDisplayMode
        case FlexMode.STRING_DISPLAY: {
            // OID-Value-Change
            if (this.state.rxData.stringDisplayValueOid) {
                const value = this.getPropertyValue('stringDisplayValueOid');
                if (value !== null && value !== undefined) {
                    if (value !== this.state.stringDisplay.value) {
                        this.stringDisplayMode.handleStateChange(
                            this.state.rxData.stringDisplayValueOid,
                            value
                        );
                    }
                }
            }

            // Config-Change → Neuinitialisierung
            const stringConfigChanged =
                this.state.rxData.stringDisplayValueOid !== prevRxData.stringDisplayValueOid ||
                this.state.rxData.stringDisplayMaxLength !== prevRxData.stringDisplayMaxLength ||
                this.state.rxData.stringDisplayTextTransform !== prevRxData.stringDisplayTextTransform;

            if (stringConfigChanged) {
                this.initializeModes();
                void this.stringDisplayMode.initialize();
            }
            break;
        }
    }
}
```

### 9.7 getTopText() / getBottomText() erweitern

Je nach Icon-Position wird der Wert als Top- oder Bottom-Text angezeigt:

```typescript
private getTopText(): string | undefined {
    const mode = this.state.rxData.mode;
    const iconPos = this.state.rxData.displayIconPosition;

    // Bestehende Modi...

    // ✨ NEU: Display-Modi
    if (mode === FlexMode.NUMERIC_DISPLAY || mode === FlexMode.STRING_DISPLAY) {
        // Wert oben anzeigen wenn Icon unten ist
        if (iconPos === IconPosition.BOTTOM) {
            return mode === FlexMode.NUMERIC_DISPLAY
                ? this.state.numericDisplay.formattedValue
                : this.state.stringDisplay.formattedValue;
        }

        // Wert rechts anzeigen als Top-Text (Einzeiler)
        if (iconPos === IconPosition.LEFT) {
            return mode === FlexMode.NUMERIC_DISPLAY
                ? this.state.numericDisplay.formattedValue
                : this.state.stringDisplay.formattedValue;
        }
    }

    return undefined;
}

private getBottomText(): string | undefined {
    const mode = this.state.rxData.mode;
    const iconPos = this.state.rxData.displayIconPosition;

    // Bestehende Modi...

    // ✨ NEU: Display-Modi
    if (mode === FlexMode.NUMERIC_DISPLAY || mode === FlexMode.STRING_DISPLAY) {
        // Wert unten anzeigen wenn Icon oben ist
        if (iconPos === IconPosition.TOP) {
            return mode === FlexMode.NUMERIC_DISPLAY
                ? this.state.numericDisplay.formattedValue
                : this.state.stringDisplay.formattedValue;
        }

        // Wert links anzeigen als Bottom-Text (Einzeiler)
        if (iconPos === IconPosition.RIGHT) {
            return mode === FlexMode.NUMERIC_DISPLAY
                ? this.state.numericDisplay.formattedValue
                : this.state.stringDisplay.formattedValue;
        }
    }

    return undefined;
}
```

**Hinweis**: Für `IconPosition.LEFT` und `RIGHT` müssen Top/Bottom-Text kreativ genutzt werden, da IconWithStatus nur vertikal stackt. Alternativ: Eigene Display-Komponente für Horizontal-Layout.

### 9.8 handleClick() erweitern

```typescript
private handleClick = (): void => {
    if (this.state.editMode) return;

    switch (this.state.rxData.mode) {
        // Bestehende Modi mit Dialog...

        // ✨ NEU: Display-Modi
        case FlexMode.NUMERIC_DISPLAY:
        case FlexMode.STRING_DISPLAY: {
            const clickAction = this.state.rxData.displayClickAction ?? ClickAction.NONE;

            if (clickAction === ClickAction.NAVIGATE) {
                const targetView = this.state.rxData.displayTargetView;
                if (targetView) {
                    // Navigation zu anderer View
                    // @ts-ignore - vis-2 API
                    window.vis.changeView(targetView);
                }
            }

            // ClickAction.NONE → Noop
            break;
        }
    }
};
```

### 9.9 getIsActive() erweitern

```typescript
private getIsActive(): boolean {
    switch (this.state.rxData.mode) {
        // Bestehende Modi...

        // ✨ NEU: Display-Modi sind nie aktiv
        case FlexMode.NUMERIC_DISPLAY:
            return false;
        case FlexMode.STRING_DISPLAY:
            return false;

        default:
            return false;
    }
}
```

### 9.10 Text-Farbe (Threshold-Colors)

Für NumericDisplayMode muss die Text-Farbe dynamisch gesetzt werden:

```typescript
private getTextColor(): string | undefined {
    if (this.state.rxData.mode === FlexMode.NUMERIC_DISPLAY) {
        // Schwellwert-Farbe hat Priorität
        if (this.state.numericDisplay.currentColor) {
            return this.state.numericDisplay.currentColor;
        }
    }

    // Default-Farbe vom Widget
    return undefined;
}
```

**In IconWithStatus übergeben:**

```typescript
<IconWithStatus
    // ... bestehende Props
    topTextColor={this.getTextColor()}
    bottomTextColor={this.getTextColor()}
/>
```

**ACHTUNG**: IconWithStatus muss ggf. erweitert werden um `topTextColor` / `bottomTextColor` Props zu unterstützen!

---

## 10. Implementierung: Config (widgetInfo.ts)

**Datei**: `src-widgets/src/OneIconToRuleThemAll/config/widgetInfo.ts`

### 10.1 Mode-Selection erweitern

```typescript
{
    name: 'mode',
    type: 'select',
    label: 'one_icon_mode_label',
    default: 'switch',
    options: [
        { value: 'dimmer_dialog', label: 'one_icon_mode_dimmer_dialog' },
        { value: 'switch', label: 'one_icon_mode_switch' },
        { value: 'heating_knx', label: 'one_icon_mode_heating_knx' },
        { value: 'window_shutter', label: 'one_icon_mode_window_shutter' },

        // ✨ NEU
        { value: 'numeric_display', label: 'one_icon_mode_numeric_display' },
        { value: 'string_display', label: 'one_icon_mode_string_display' },
    ],
}
```

### 10.2 Gemeinsame Display-Felder

```typescript
{
    name: 'display_layout',
    label: 'one_icon_display_layout_group',
    hidden: 'data.mode !== "numeric_display" && data.mode !== "string_display"',
    fields: [
        {
            name: 'displayIconPosition',
            type: 'select',
            label: 'one_icon_display_icon_position',
            default: 'left',
            options: [
                { value: 'left', label: 'one_icon_display_icon_position_left' },
                { value: 'right', label: 'one_icon_display_icon_position_right' },
                { value: 'top', label: 'one_icon_display_icon_position_top' },
                { value: 'bottom', label: 'one_icon_display_icon_position_bottom' },
            ],
        },
        {
            name: 'displayClickAction',
            type: 'select',
            label: 'one_icon_display_click_action',
            default: 'none',
            options: [
                { value: 'none', label: 'one_icon_display_click_action_none' },
                { value: 'navigate', label: 'one_icon_display_click_action_navigate' },
            ],
        },
        {
            name: 'displayTargetView',
            type: 'select',  // vis-2 View-Picker
            label: 'one_icon_display_target_view',
            hidden: 'data.displayClickAction !== "navigate"',
            // views: true - Zeigt View-Liste an
        },
    ],
}
```

### 10.3 NumericDisplayMode Config

```typescript
{
    name: 'numeric_display_config',
    label: 'one_icon_numeric_display_config_group',
    hidden: 'data.mode !== "numeric_display"',
    fields: [
        // ===== OID =====
        {
            name: 'numericDisplayValueOid',
            type: 'id',
            label: 'one_icon_numeric_display_value_oid',
            tooltip: 'one_icon_numeric_display_value_oid_tooltip',
        },

        // ===== Formatierung =====
        {
            name: 'numericDisplayDecimals',
            type: 'number',
            label: 'one_icon_numeric_display_decimals',
            default: 0,
            min: 0,
            max: 5,
        },
        {
            name: 'numericDisplayDecimalMode',
            type: 'select',
            label: 'one_icon_numeric_display_decimal_mode',
            default: 'round',
            options: [
                { value: 'round', label: 'one_icon_numeric_display_decimal_mode_round' },
                { value: 'floor', label: 'one_icon_numeric_display_decimal_mode_floor' },
                { value: 'ceil', label: 'one_icon_numeric_display_decimal_mode_ceil' },
                { value: 'trunc', label: 'one_icon_numeric_display_decimal_mode_trunc' },
            ],
        },
        {
            name: 'numericDisplayDecimalSeparator',
            type: 'select',
            label: 'one_icon_numeric_display_decimal_separator',
            default: '.',
            options: [
                { value: '.', label: 'one_icon_numeric_display_separator_dot' },
                { value: ',', label: 'one_icon_numeric_display_separator_comma' },
            ],
        },
        {
            name: 'numericDisplayThousandSeparator',
            type: 'select',
            label: 'one_icon_numeric_display_thousand_separator',
            default: 'none',
            options: [
                { value: 'none', label: 'one_icon_numeric_display_separator_none' },
                { value: '.', label: 'one_icon_numeric_display_separator_dot' },
                { value: ',', label: 'one_icon_numeric_display_separator_comma' },
                { value: "'", label: 'one_icon_numeric_display_separator_apostrophe' },
                { value: ' ', label: 'one_icon_numeric_display_separator_space' },
            ],
        },
        {
            name: 'numericDisplayUnit',
            type: 'text',
            label: 'one_icon_numeric_display_unit',
            default: '',
            placeholder: ' °C',
        },

        // ===== Prefix/Suffix =====
        {
            name: 'numericDisplayPrefix',
            type: 'text',
            label: 'one_icon_numeric_display_prefix',
            default: '',
            placeholder: 'Aktuell: ',
        },
        {
            name: 'numericDisplaySuffix',
            type: 'text',
            label: 'one_icon_numeric_display_suffix',
            default: '',
            placeholder: ' im Wohnzimmer',
        },

        // ===== Farb-Schwellwerte =====
        {
            name: 'numericDisplayUseColorThresholds',
            type: 'checkbox',
            label: 'one_icon_numeric_display_use_color_thresholds',
            default: false,
        },
        {
            name: 'numericDisplayThresholdLow',
            type: 'number',
            label: 'one_icon_numeric_display_threshold_low',
            default: 0,
            hidden: '!data.numericDisplayUseColorThresholds',
        },
        {
            name: 'numericDisplayThresholdHigh',
            type: 'number',
            label: 'one_icon_numeric_display_threshold_high',
            default: 100,
            hidden: '!data.numericDisplayUseColorThresholds',
        },
        {
            name: 'numericDisplayColorLow',
            type: 'color',
            label: 'one_icon_numeric_display_color_low',
            default: '#2196f3',  // Blau
            hidden: '!data.numericDisplayUseColorThresholds',
        },
        {
            name: 'numericDisplayColorMedium',
            type: 'color',
            label: 'one_icon_numeric_display_color_medium',
            default: '#4caf50',  // Grün
            hidden: '!data.numericDisplayUseColorThresholds',
        },
        {
            name: 'numericDisplayColorHigh',
            type: 'color',
            label: 'one_icon_numeric_display_color_high',
            default: '#f44336',  // Rot
            hidden: '!data.numericDisplayUseColorThresholds',
        },

        // ===== Value-Mapping =====
        {
            name: 'numericDisplayValueMapping',
            type: 'text',
            label: 'one_icon_numeric_display_value_mapping',
            default: '',
            placeholder: '{"0":"Aus","1":"An"}',
            tooltip: 'one_icon_numeric_display_value_mapping_tooltip',
        },
    ],
}
```

### 10.4 StringDisplayMode Config

```typescript
{
    name: 'string_display_config',
    label: 'one_icon_string_display_config_group',
    hidden: 'data.mode !== "string_display"',
    fields: [
        // ===== OID =====
        {
            name: 'stringDisplayValueOid',
            type: 'id',
            label: 'one_icon_string_display_value_oid',
            tooltip: 'one_icon_string_display_value_oid_tooltip',
        },

        // ===== String-Optionen =====
        {
            name: 'stringDisplayMaxLength',
            type: 'number',
            label: 'one_icon_string_display_max_length',
            default: 50,
            min: 1,
            max: 200,
        },
        {
            name: 'stringDisplayEllipsis',
            type: 'checkbox',
            label: 'one_icon_string_display_ellipsis',
            default: true,
        },
        {
            name: 'stringDisplayTextTransform',
            type: 'select',
            label: 'one_icon_string_display_text_transform',
            default: 'none',
            options: [
                { value: 'none', label: 'one_icon_string_display_text_transform_none' },
                { value: 'uppercase', label: 'one_icon_string_display_text_transform_uppercase' },
                { value: 'lowercase', label: 'one_icon_string_display_text_transform_lowercase' },
                { value: 'capitalize', label: 'one_icon_string_display_text_transform_capitalize' },
            ],
        },

        // ===== Prefix/Suffix =====
        {
            name: 'stringDisplayPrefix',
            type: 'text',
            label: 'one_icon_string_display_prefix',
            default: '',
            placeholder: 'Status: ',
        },
        {
            name: 'stringDisplaySuffix',
            type: 'text',
            label: 'one_icon_string_display_suffix',
            default: '',
            placeholder: '',
        },

        // ===== Value-Mapping =====
        {
            name: 'stringDisplayValueMapping',
            type: 'text',
            label: 'one_icon_string_display_value_mapping',
            default: '',
            placeholder: '{"online":"✓ Online","offline":"✗ Offline"}',
            tooltip: 'one_icon_string_display_value_mapping_tooltip',
        },
    ],
}
```

---

## 11. Implementierung: Übersetzungen

**Datei**: `src-widgets/src/translations.ts`

### 11.1 Englisch (EN)

```typescript
export default {
    prefix: 'vis_2_widgets_deluxe_',
    en: {
        // ... bestehende Übersetzungen

        // ===== Mode-Selection =====
        'vis_2_widgets_deluxe_one_icon_mode_numeric_display': 'Numeric Display',
        'vis_2_widgets_deluxe_one_icon_mode_string_display': 'Text Display',

        // ===== Gemeinsame Display-Felder =====
        'vis_2_widgets_deluxe_one_icon_display_layout_group': 'Display Layout',
        'vis_2_widgets_deluxe_one_icon_display_icon_position': 'Icon Position',
        'vis_2_widgets_deluxe_one_icon_display_icon_position_left': 'Left (Value right)',
        'vis_2_widgets_deluxe_one_icon_display_icon_position_right': 'Right (Value left)',
        'vis_2_widgets_deluxe_one_icon_display_icon_position_top': 'Top (Value bottom)',
        'vis_2_widgets_deluxe_one_icon_display_icon_position_bottom': 'Bottom (Value top)',
        'vis_2_widgets_deluxe_one_icon_display_click_action': 'Click Action',
        'vis_2_widgets_deluxe_one_icon_display_click_action_none': 'None',
        'vis_2_widgets_deluxe_one_icon_display_click_action_navigate': 'Navigate to View',
        'vis_2_widgets_deluxe_one_icon_display_target_view': 'Target View',

        // ===== NumericDisplayMode =====
        'vis_2_widgets_deluxe_one_icon_numeric_display_config_group': 'Numeric Display Settings',
        'vis_2_widgets_deluxe_one_icon_numeric_display_value_oid': 'Value OID',
        'vis_2_widgets_deluxe_one_icon_numeric_display_value_oid_tooltip': 'ioBroker Object-ID with numeric value',

        'vis_2_widgets_deluxe_one_icon_numeric_display_decimals': 'Decimal Places',
        'vis_2_widgets_deluxe_one_icon_numeric_display_decimal_mode': 'Decimal Mode',
        'vis_2_widgets_deluxe_one_icon_numeric_display_decimal_mode_round': 'Round',
        'vis_2_widgets_deluxe_one_icon_numeric_display_decimal_mode_floor': 'Floor (Round down)',
        'vis_2_widgets_deluxe_one_icon_numeric_display_decimal_mode_ceil': 'Ceiling (Round up)',
        'vis_2_widgets_deluxe_one_icon_numeric_display_decimal_mode_trunc': 'Truncate',

        'vis_2_widgets_deluxe_one_icon_numeric_display_decimal_separator': 'Decimal Separator',
        'vis_2_widgets_deluxe_one_icon_numeric_display_thousand_separator': 'Thousand Separator',
        'vis_2_widgets_deluxe_one_icon_numeric_display_separator_dot': 'Dot (.)',
        'vis_2_widgets_deluxe_one_icon_numeric_display_separator_comma': 'Comma (,)',
        'vis_2_widgets_deluxe_one_icon_numeric_display_separator_apostrophe': "Apostrophe (')",
        'vis_2_widgets_deluxe_one_icon_numeric_display_separator_space': 'Space',
        'vis_2_widgets_deluxe_one_icon_numeric_display_separator_none': 'None',

        'vis_2_widgets_deluxe_one_icon_numeric_display_unit': 'Unit',
        'vis_2_widgets_deluxe_one_icon_numeric_display_prefix': 'Prefix',
        'vis_2_widgets_deluxe_one_icon_numeric_display_suffix': 'Suffix',

        'vis_2_widgets_deluxe_one_icon_numeric_display_use_color_thresholds': 'Use Color Thresholds',
        'vis_2_widgets_deluxe_one_icon_numeric_display_threshold_low': 'Threshold Low',
        'vis_2_widgets_deluxe_one_icon_numeric_display_threshold_high': 'Threshold High',
        'vis_2_widgets_deluxe_one_icon_numeric_display_color_low': 'Color Low (≤ Threshold Low)',
        'vis_2_widgets_deluxe_one_icon_numeric_display_color_medium': 'Color Medium',
        'vis_2_widgets_deluxe_one_icon_numeric_display_color_high': 'Color High (> Threshold High)',

        'vis_2_widgets_deluxe_one_icon_numeric_display_value_mapping': 'Value Mapping (JSON)',
        'vis_2_widgets_deluxe_one_icon_numeric_display_value_mapping_tooltip': 'Map numeric values to text, e.g. {"0":"Off","1":"On"}',

        // ===== StringDisplayMode =====
        'vis_2_widgets_deluxe_one_icon_string_display_config_group': 'Text Display Settings',
        'vis_2_widgets_deluxe_one_icon_string_display_value_oid': 'Value OID',
        'vis_2_widgets_deluxe_one_icon_string_display_value_oid_tooltip': 'ioBroker Object-ID with string value',

        'vis_2_widgets_deluxe_one_icon_string_display_max_length': 'Max Length',
        'vis_2_widgets_deluxe_one_icon_string_display_ellipsis': 'Show Ellipsis (...)',
        'vis_2_widgets_deluxe_one_icon_string_display_text_transform': 'Text Transform',
        'vis_2_widgets_deluxe_one_icon_string_display_text_transform_none': 'None',
        'vis_2_widgets_deluxe_one_icon_string_display_text_transform_uppercase': 'UPPERCASE',
        'vis_2_widgets_deluxe_one_icon_string_display_text_transform_lowercase': 'lowercase',
        'vis_2_widgets_deluxe_one_icon_string_display_text_transform_capitalize': 'Capitalize',

        'vis_2_widgets_deluxe_one_icon_string_display_prefix': 'Prefix',
        'vis_2_widgets_deluxe_one_icon_string_display_suffix': 'Suffix',

        'vis_2_widgets_deluxe_one_icon_string_display_value_mapping': 'Value Mapping (JSON)',
        'vis_2_widgets_deluxe_one_icon_string_display_value_mapping_tooltip': 'Map string values, e.g. {"online":"✓ Online","offline":"✗ Offline"}',
    },
    // ... weitere Sprachen
};
```

### 11.2 Deutsch (DE)

```typescript
de: {
    // ... bestehende Übersetzungen

    // ===== Mode-Selection =====
    'vis_2_widgets_deluxe_one_icon_mode_numeric_display': 'Zahlen-Anzeige',
    'vis_2_widgets_deluxe_one_icon_mode_string_display': 'Text-Anzeige',

    // ===== Gemeinsame Display-Felder =====
    'vis_2_widgets_deluxe_one_icon_display_layout_group': 'Anzeige-Layout',
    'vis_2_widgets_deluxe_one_icon_display_icon_position': 'Icon-Position',
    'vis_2_widgets_deluxe_one_icon_display_icon_position_left': 'Links (Wert rechts)',
    'vis_2_widgets_deluxe_one_icon_display_icon_position_right': 'Rechts (Wert links)',
    'vis_2_widgets_deluxe_one_icon_display_icon_position_top': 'Oben (Wert unten)',
    'vis_2_widgets_deluxe_one_icon_display_icon_position_bottom': 'Unten (Wert oben)',
    'vis_2_widgets_deluxe_one_icon_display_click_action': 'Klick-Aktion',
    'vis_2_widgets_deluxe_one_icon_display_click_action_none': 'Keine',
    'vis_2_widgets_deluxe_one_icon_display_click_action_navigate': 'Zu View navigieren',
    'vis_2_widgets_deluxe_one_icon_display_target_view': 'Ziel-View',

    // ===== NumericDisplayMode =====
    'vis_2_widgets_deluxe_one_icon_numeric_display_config_group': 'Zahlen-Anzeige Einstellungen',
    'vis_2_widgets_deluxe_one_icon_numeric_display_value_oid': 'Wert-OID',
    'vis_2_widgets_deluxe_one_icon_numeric_display_value_oid_tooltip': 'ioBroker Objekt-ID mit numerischem Wert',

    'vis_2_widgets_deluxe_one_icon_numeric_display_decimals': 'Nachkommastellen',
    'vis_2_widgets_deluxe_one_icon_numeric_display_decimal_mode': 'Dezimal-Modus',
    'vis_2_widgets_deluxe_one_icon_numeric_display_decimal_mode_round': 'Runden',
    'vis_2_widgets_deluxe_one_icon_numeric_display_decimal_mode_floor': 'Abrunden',
    'vis_2_widgets_deluxe_one_icon_numeric_display_decimal_mode_ceil': 'Aufrunden',
    'vis_2_widgets_deluxe_one_icon_numeric_display_decimal_mode_trunc': 'Abschneiden',

    'vis_2_widgets_deluxe_one_icon_numeric_display_decimal_separator': 'Dezimaltrennzeichen',
    'vis_2_widgets_deluxe_one_icon_numeric_display_thousand_separator': 'Tausendertrennzeichen',
    'vis_2_widgets_deluxe_one_icon_numeric_display_separator_dot': 'Punkt (.)',
    'vis_2_widgets_deluxe_one_icon_numeric_display_separator_comma': 'Komma (,)',
    'vis_2_widgets_deluxe_one_icon_numeric_display_separator_apostrophe': "Apostroph (')",
    'vis_2_widgets_deluxe_one_icon_numeric_display_separator_space': 'Leerzeichen',
    'vis_2_widgets_deluxe_one_icon_numeric_display_separator_none': 'Keins',

    'vis_2_widgets_deluxe_one_icon_numeric_display_unit': 'Einheit',
    'vis_2_widgets_deluxe_one_icon_numeric_display_prefix': 'Präfix',
    'vis_2_widgets_deluxe_one_icon_numeric_display_suffix': 'Suffix',

    'vis_2_widgets_deluxe_one_icon_numeric_display_use_color_thresholds': 'Farb-Schwellwerte verwenden',
    'vis_2_widgets_deluxe_one_icon_numeric_display_threshold_low': 'Schwellwert Niedrig',
    'vis_2_widgets_deluxe_one_icon_numeric_display_threshold_high': 'Schwellwert Hoch',
    'vis_2_widgets_deluxe_one_icon_numeric_display_color_low': 'Farbe Niedrig (≤ Schwellwert Niedrig)',
    'vis_2_widgets_deluxe_one_icon_numeric_display_color_medium': 'Farbe Mittel',
    'vis_2_widgets_deluxe_one_icon_numeric_display_color_high': 'Farbe Hoch (> Schwellwert Hoch)',

    'vis_2_widgets_deluxe_one_icon_numeric_display_value_mapping': 'Wert-Mapping (JSON)',
    'vis_2_widgets_deluxe_one_icon_numeric_display_value_mapping_tooltip': 'Numerische Werte auf Text mappen, z.B. {"0":"Aus","1":"An"}',

    // ===== StringDisplayMode =====
    'vis_2_widgets_deluxe_one_icon_string_display_config_group': 'Text-Anzeige Einstellungen',
    'vis_2_widgets_deluxe_one_icon_string_display_value_oid': 'Wert-OID',
    'vis_2_widgets_deluxe_one_icon_string_display_value_oid_tooltip': 'ioBroker Objekt-ID mit String-Wert',

    'vis_2_widgets_deluxe_one_icon_string_display_max_length': 'Max. Länge',
    'vis_2_widgets_deluxe_one_icon_string_display_ellipsis': 'Auslassungspunkte (...) anzeigen',
    'vis_2_widgets_deluxe_one_icon_string_display_text_transform': 'Text-Transformation',
    'vis_2_widgets_deluxe_one_icon_string_display_text_transform_none': 'Keine',
    'vis_2_widgets_deluxe_one_icon_string_display_text_transform_uppercase': 'GROSSBUCHSTABEN',
    'vis_2_widgets_deluxe_one_icon_string_display_text_transform_lowercase': 'kleinbuchstaben',
    'vis_2_widgets_deluxe_one_icon_string_display_text_transform_capitalize': 'Erster Buchstabe groß',

    'vis_2_widgets_deluxe_one_icon_string_display_prefix': 'Präfix',
    'vis_2_widgets_deluxe_one_icon_string_display_suffix': 'Suffix',

    'vis_2_widgets_deluxe_one_icon_string_display_value_mapping': 'Wert-Mapping (JSON)',
    'vis_2_widgets_deluxe_one_icon_string_display_value_mapping_tooltip': 'String-Werte mappen, z.B. {"online":"✓ Online","offline":"✗ Offline"}',
},
```

---

## 12. Testing-Strategie

### 12.1 Unit-Tests (Utility-Funktionen)

**numberFormatter.ts:**
- Decimals: 0-5 Nachkommastellen
- Decimal-Modes: round, floor, ceil, trunc
- Separators: Alle Kombinationen (., , ' Leerzeichen)
- Unit: Mit/ohne Unit
- Edge-Cases: null, undefined, NaN, Infinity

**colorThresholds.ts:**
- 3-Zonen-Logik: <= low, <= high, > high
- Disabled-State
- Edge-Cases: null-Werte, ungültige Farben

**valueMapper.ts:**
- Mapping: Exact-Match, Fallback
- JSON-Parsing: Valid/Invalid JSON
- Edge-Cases: Leere Mappings, nicht-String-Values

### 12.2 Integration-Tests (Mode-Klassen)

**NumericDisplayMode:**
- OID-Initialisierung
- State-Change-Handling
- Formatierung (verschiedene Configs)
- Farb-Schwellwerte (3 Zonen)
- Value-Mapping
- Prefix/Suffix

**StringDisplayMode:**
- OID-Initialisierung
- State-Change-Handling
- Max-Length + Ellipsis
- Text-Transform (4 Varianten)
- Value-Mapping
- Prefix/Suffix

### 12.3 E2E-Tests (Widget in vis-2)

**Test-Szenarien:**

1. **Temperatur-Anzeige (Numeric)**
   - OID: `hm-rpc.0.NEQ1234567.1.ACTUAL_TEMPERATURE`
   - Config: 1 Decimal, ` °C`, Schwellwerte (<18=blau, 18-25=grün, >25=rot)
   - Test: Wert-Änderungen, Farb-Wechsel

2. **Boolean-Status (Numeric mit Mapping)**
   - OID: `hm-rpc.0.NEQ1234567.1.STATE`
   - Mapping: `{"0":"Geschlossen","1":"Offen"}`
   - Test: Toggle 0/1, Mapped-Text

3. **String-Status (String mit Mapping)**
   - OID: `0_userdata.0.system.status`
   - Mapping: `{"online":"✓ Online","offline":"✗ Offline"}`
   - Test: Status-Wechsel, Farbe (optional mit Threshold)

4. **Layout-Varianten**
   - Alle 4 Icon-Positionen (left, right, top, bottom)
   - Test: Korrekte Positionierung, Responsive

5. **Click-Actions**
   - None: Kein Verhalten
   - Navigate: Wechsel zu anderer View

### 12.4 Browser-Testing

- Chrome, Firefox, Safari, Edge
- Mobile: iOS Safari, Android Chrome
- Responsive: verschiedene Widget-Größen

---

## 13. Checkliste

### Phase 1: Foundation

- [ ] `types/index.ts` - Enums & Interfaces definieren
- [ ] `utils/numberFormatter.ts` - Implementieren + Tests
- [ ] `utils/colorThresholds.ts` - Implementieren + Tests
- [ ] `utils/valueMapper.ts` - Implementieren + Tests

### Phase 2: Mode-Klassen

- [ ] `modes/NumericDisplayMode.ts` - Implementieren
- [ ] `modes/StringDisplayMode.ts` - Implementieren
- [ ] Unit-Tests für beide Mode-Klassen

### Phase 3: Widget-Integration

- [ ] `index.tsx` - State erweitern
- [ ] `index.tsx` - Mode-Instanzen erstellen
- [ ] `index.tsx` - componentDidMount erweitern
- [ ] `index.tsx` - componentDidUpdate erweitern
- [ ] `index.tsx` - getTopText() / getBottomText() erweitern
- [ ] `index.tsx` - handleClick() erweitern
- [ ] `index.tsx` - getIsActive() erweitern
- [ ] `index.tsx` - Text-Farbe (Threshold-Colors) implementieren

### Phase 4: Config & UI

- [ ] `config/widgetInfo.ts` - Mode-Selection erweitern
- [ ] `config/widgetInfo.ts` - Gemeinsame Display-Felder
- [ ] `config/widgetInfo.ts` - NumericDisplayMode Config
- [ ] `config/widgetInfo.ts` - StringDisplayMode Config
- [ ] `components/IconWithStatus.tsx` - Text-Farbe-Props (falls nötig)

### Phase 5: Übersetzungen

- [ ] `translations.ts` - Englisch (EN)
- [ ] `translations.ts` - Deutsch (DE)
- [ ] `translations.ts` - Russisch (RU) (optional)

### Phase 6: Testing

- [ ] Unit-Tests (Utils)
- [ ] Integration-Tests (Mode-Klassen)
- [ ] E2E-Tests (5 Szenarien)
- [ ] Browser-Testing (Desktop + Mobile)

### Phase 7: Dokumentation & Release

- [ ] README.md - Feature-Liste aktualisieren
- [ ] Screenshots/GIFs - Display-Modi
- [ ] Changelog - Version Bump (Patch/Minor)
- [ ] npm run build - Production Build
- [ ] Git Commit + Tag
- [ ] Release Notes

---

## 14. Zeitplan & Priorisierung

### Sprint 1 (Foundation) - 3-4h
- Types & Enums
- Utility-Funktionen (inkl. Tests)

### Sprint 2 (Mode-Klassen) - 4-5h
- NumericDisplayMode
- StringDisplayMode
- Unit-Tests

### Sprint 3 (Integration) - 3-4h
- Widget-Integration (index.tsx)
- IconWithStatus erweitern (falls nötig)

### Sprint 4 (Config & i18n) - 2-3h
- widgetInfo.ts
- Übersetzungen (EN, DE)

### Sprint 5 (Testing & Polish) - 2-3h
- E2E-Tests
- Bug-Fixes
- Dokumentation

**Gesamt**: 14-19 Stunden

---

## 15. Offene Fragen & Entscheidungen

### 15.1 Icon-Position: Horizontal-Layout

**Problem**: IconWithStatus stackt nur vertikal (top/bottom).

**Optionen**:
1. Top/Bottom-Text kreativ nutzen (Links → Top-Text, Rechts → Bottom-Text)
2. Neue Komponente `DisplayValue.tsx` für echtes Horizontal-Layout
3. IconWithStatus erweitern um `layout: 'horizontal' | 'vertical'`

**Empfehlung**: Option 2 - Eigene Komponente für sauberes Horizontal-Layout

### 15.2 Text-Farbe (Threshold-Colors)

**Problem**: IconWithStatus unterstützt aktuell keine dynamische Text-Farbe.

**Lösung**: IconWithStatus erweitern um `topTextColor` / `bottomTextColor` Props.

### 15.3 View-Navigation

**Problem**: vis-2 API für View-Wechsel?

**Lösung**: Recherche in vis-2 Docs oder bestehenden Widgets.

**Fallback**: `window.location.hash = '#view-name'`

---

## 16. Best Practices & Learnings

### 16.1 Wiederverwendung

✅ **Maximal wiederverwendet:**
- CardWrapper (unverändert)
- IconWithStatus (evtl. kleine Erweiterung)
- Generic-Basis-Klasse
- Translations-System

✅ **Neue Utils sind generisch:**
- numberFormatter, colorThresholds, valueMapper können auch von anderen Modi/Widgets genutzt werden

### 16.2 SOLID-Prinzipien

✅ **Single Responsibility:**
- Mode-Klassen: Nur Logik
- UI-Komponenten: Nur Präsentation
- Utils: Reine Funktionen

✅ **Open/Closed:**
- Widget-Architektur offen für neue Modi (einfach erweitern)

✅ **Dependency Injection:**
- Mode-Klassen erhalten Dependencies über Constructor

### 16.3 Performance

✅ **React.memo()** für alle UI-Komponenten
✅ **Partial State-Updates** vermeiden unnötige Re-Renders
✅ **Lazy-Init** - Modi nur initialisieren wenn aktiv

### 16.4 Maintenance

✅ **TypeScript** - Typ-Sicherheit
✅ **Dokumentierte Utils** - JSDoc-Comments
✅ **Unit-Tests** - Regressions-Schutz
✅ **Konsistente Patterns** - Einfach zu verstehen

---

## Anhang: Code-Beispiele

### A.1 Verwendungs-Beispiel: Temperatur-Anzeige

**Config:**
```json
{
  "mode": "numeric_display",
  "numericDisplayValueOid": "hm-rpc.0.NEQ1234567.1.ACTUAL_TEMPERATURE",
  "numericDisplayDecimals": 1,
  "numericDisplayUnit": " °C",
  "numericDisplayUseColorThresholds": true,
  "numericDisplayThresholdLow": 18,
  "numericDisplayThresholdHigh": 25,
  "numericDisplayColorLow": "#2196f3",
  "numericDisplayColorMedium": "#4caf50",
  "numericDisplayColorHigh": "#f44336",
  "displayIconPosition": "left",
  "icon": "data:image/svg+xml;base64,..." // Thermometer-Icon
}
```

**Rendering:**
```
┌─────────────────┐
│  🌡️  23.5 °C   │  ← Icon links, Wert rechts, grün (18-25°C)
└─────────────────┘
```

### A.2 Verwendungs-Beispiel: Boolean-Status

**Config:**
```json
{
  "mode": "numeric_display",
  "numericDisplayValueOid": "hm-rpc.0.NEQ1234567.1.STATE",
  "numericDisplayValueMapping": "{\"0\":\"Geschlossen\",\"1\":\"Offen\"}",
  "displayIconPosition": "top",
  "icon": "data:image/svg+xml;base64,..." // Door-Icon
}
```

**Rendering (State=1):**
```
┌─────────────┐
│      🚪     │
│    Offen    │
└─────────────┘
```

### A.3 Verwendungs-Beispiel: String-Status

**Config:**
```json
{
  "mode": "string_display",
  "stringDisplayValueOid": "0_userdata.0.system.status",
  "stringDisplayValueMapping": "{\"online\":\"✓ Online\",\"offline\":\"✗ Offline\"}",
  "displayIconPosition": "left",
  "displayClickAction": "navigate",
  "displayTargetView": "system-details",
  "icon": "data:image/svg+xml;base64,..." // Server-Icon
}
```

**Rendering:**
```
┌─────────────────┐
│  🖥️  ✓ Online  │  ← Klickbar → Wechsel zu "system-details" View
└─────────────────┘
```

---

**Ende des Implementierungsplans**

_Dieser Plan ist vollständig und ready for implementation!_ 🚀
