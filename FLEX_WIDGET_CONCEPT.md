# FlexWidget - Vollständiges Konzept

**Projekt:** ioBroker.vis-2-widgets-deluxe
**Widget:** FlexWidget (Neues Widget, parallel zu DimmerWidget)
**Widget-ID:** `tplDeluxeFlexWidget`
**Version:** 1.0.0
**Datum:** 2025-10-19
**Status:** Planungsphase - Bereit für Implementierung

---

## Inhaltsverzeichnis

1. [Übersicht](#1-übersicht)
2. [Ziele & Anforderungen](#2-ziele--anforderungen)
3. [Aktuelle Code-Analyse](#3-aktuelle-code-analyse)
4. [Architektur-Design](#4-architektur-design)
5. [Type-System](#5-type-system)
6. [Mode-System](#6-mode-system)
7. [Settings-Struktur](#7-settings-struktur)
8. [Rendering-Pipeline](#8-rendering-pipeline)
9. [Event-Handling](#9-event-handling)
10. [Dialog-System](#10-dialog-system)
11. [Validierung & Error-Handling](#11-validierung--error-handling)
12. [Testing-Strategie](#12-testing-strategie)
13. [Performance-Optimierung](#13-performance-optimierung)
14. [Erweiterbarkeits-Pattern](#14-erweiterbarkeits-pattern)
15. [Translation-Keys](#15-translation-keys)
16. [File-Struktur](#16-file-struktur)
17. [Implementierungs-Reihenfolge](#17-implementierungs-reihenfolge)
18. [Design-Entscheidungen](#18-design-entscheidungen)

---

## 1. Übersicht

### 1.1 Motivation

Das aktuelle `DimmerWidget` ist funktional, aber auf einen einzigen Use-Case beschränkt: Dimmer-Steuerung via Dialog. Das neue **FlexWidget** ist ein universelles Control Widget, das verschiedene Interaktionsmodi unterstützt:

- **Switch-Mode**: Einfacher Toggle ohne Dialog (Lichtschalter)
- **Dimmer-Dialog Mode**: Slider-basierte Steuerung via Dialog (wie DimmerWidget)
- **Zukünftige Modi**: RGB-Picker, Thermostat, Scene-Selector, Inline-Dimmer, etc.

### 1.2 Warum ein NEUES Widget?

- ✅ **Clean Slate**: Keine Legacy-Code-Ballast
- ✅ **Kein Migrations-Overhead**: DimmerWidget bleibt unverändert
- ✅ **Parallele Entwicklung**: User können DimmerWidget weiter nutzen
- ✅ **Saubere Architektur**: Von Anfang an für Multi-Mode designed

### 1.3 Projektziele

**Primär:**
- ✅ Maximale Erweiterbarkeit (neue Modi einfach hinzufügbar)
- ✅ Saubere Code-Struktur (SOLID-Prinzipien)
- ✅ Wartbarkeit (klare Verantwortlichkeiten)
- ✅ Wiederverwendbarkeit (gemeinsame Components)

**Sekundär:**
- Performance-Optimierung
- Testbarkeit
- Dokumentation
- Developer Experience

---

## 2. Ziele & Anforderungen

### 2.1 Funktionale Anforderungen

#### Must-Have (MVP)
- [x] Mode-Auswahl in Widget-Settings
- [x] **Dimmer-Dialog Mode**: Wie DimmerWidget, aber mit zentralisierten Dialog-Settings
- [x] **Switch Mode**: Toggle zwischen ON/OFF ohne Dialog
- [x] Zentrale Dialog-Settings (Titel, Farben, Größe) für alle Dialog-Modi
- [x] Icon-System mit activeColor/inactiveColor (von DimmerWidget übernommen)
- [x] Card-System (von DimmerWidget übernommen)

#### Should-Have (Phase 2)
- [ ] Dimmer-Inline Mode (Slider direkt im Widget)
- [ ] RGB-Dialog Mode (Farbauswahl)
- [ ] Validation der OID-Types (Console-Warnings)
- [ ] Error-States & Feedback

#### Could-Have (Später)
- [ ] Thermostat Mode
- [ ] Scene-Selector Mode
- [ ] Multi-OID Support (z.B. separate RGB-States)
- [ ] Permission-System (Read-Only)

### 2.2 Nicht-Funktionale Anforderungen

- **Code-Qualität**: ESLint-konform, TypeScript strict mode
- **Performance**: < 100ms Render-Zeit, < 50ms Click-Response
- **Bundle-Size**: < 50KB zusätzlich zum aktuellen Widget-Set
- **Browser-Support**: Chrome 81+, Firefox, Safari, Edge
- **Accessibility**: ARIA-Labels, Keyboard-Navigation
- **I18n**: Alle Labels übersetzt (EN, DE, weitere optional)

---

## 3. Aktuelle Code-Analyse

### 3.1 Referenz: DimmerWidget

Das FlexWidget übernimmt bewährte Patterns vom DimmerWidget:

```
DimmerWidget.tsx (521 LOC)
├── Icon-System mit Color-Switching
├── Card-Wrapper mit Border-Radius
├── Dialog mit Slider + Quick-Buttons
├── Debounced Value-Updates
└── OID Name-Fetching
```

**Was übernehmen wir:**
- ✅ Icon-Component-Integration
- ✅ Card-Styling-System
- ✅ Dialog-Basis-Struktur
- ✅ Debouncing-Pattern
- ✅ Generic-Basis-Klasse

**Was ändern wir:**
- 🔄 Mode-System (neu)
- 🔄 Settings-Hierarchie (zentralisiert)
- 🔄 Dialog-Settings (mode-übergreifend)
- 🔄 Click-Handler (mode-abhängig)

### 3.2 Abhängigkeiten

**Intern:**
- `Generic.tsx` - Basis-Klasse für alle Widgets
- `components/Icon.tsx` - SVG/Icon-Rendering mit Colorization
- `translations.ts` - i18n Strings

**Extern:**
- `@mui/material` - UI Components (Dialog, Slider, Button, etc.)
- `@mui/icons-material` - Material Icons
- `@iobroker/types-vis-2` - Type Definitions

**Wichtig:** Keine weiteren externen Dependencies hinzufügen (Bundle-Size!)

---

## 4. Architektur-Design

### 4.1 Design-Prinzipien

**SOLID:**
- **S**ingle Responsibility: Jede Funktion/Klasse hat eine klare Aufgabe
- **O**pen/Closed: Erweiterbar für neue Modi, ohne bestehenden Code zu ändern
- **L**iskov Substitution: Modi sind austauschbar
- **I**nterface Segregation: Kleine, fokussierte Interfaces
- **D**ependency Inversion: Abhängigkeiten zu Abstraktionen, nicht Konkretionen

**Weitere:**
- **DRY** (Don't Repeat Yourself): Gemeinsame Logik zentralisieren
- **KISS** (Keep It Simple): Einfachste Lösung bevorzugen
- **YAGNI** (You Aren't Gonna Need It): Keine Über-Abstraktion

### 4.2 Architektur-Pattern: Hybrid Approach

```
FlexWidget (Main Component)
│
├── Gemeinsame Logik
│   ├── Icon Rendering
│   ├── Card Wrapper
│   ├── Dialog Shell
│   └── Status Overlay
│
├── Mode-spezifische Methods
│   ├── renderDimmerDialog()
│   ├── handleSwitchClick()
│   ├── renderRgbDialog() (future)
│   └── ...
│
└── Switch-basierte Delegation
    ├── handleClick() → switch(mode)
    ├── renderModeContent() → switch(mode)
    └── getIsActive() → switch(mode)
```

**Vorteile:**
- ✅ Balance zwischen Einfachheit und Struktur
- ✅ Gute Testbarkeit (Methods isoliert testbar)
- ✅ Überschaubare Komplexität
- ✅ Flexibel erweiterbar ohne Pattern-Overhead

### 4.3 Component-Hierarchie

```
FlexWidget (Main Component)
│
├── Widget Body
│   ├── Card Wrapper (optional)
│   │   └── Icon + Status Overlay
│   │       ├── Icon Component
│   │       └── Status Text/Percentage
│   │
│   └── Mode-specific UI
│       ├── Dialog (if mode.hasDialog)
│       │   ├── Dialog Shell (gemeinsam)
│       │   └── Dialog Content (mode-spezifisch)
│       └── Inline UI (z.B. Inline-Slider)
│
└── State Management
    ├── Widget State (dialog, localValue, etc.)
    ├── OID Value (from props.context)
    └── Mode-specific State
```

---

## 5. Type-System

### 5.1 Core Types

```typescript
// ========================================
// MODE DEFINITIONS
// ========================================

/**
 * Available control modes for FlexWidget
 */
enum FlexMode {
    DIMMER_DIALOG = 'dimmer_dialog',
    SWITCH = 'switch',
    RGB_DIALOG = 'rgb_dialog',
    THERMOSTAT_DIALOG = 'thermostat_dialog',
    SCENE_DIALOG = 'scene_dialog',
    DIMMER_INLINE = 'dimmer_inline',
}

/**
 * Mode metadata and capabilities
 */
interface ModeDefinition {
    id: FlexMode;
    label: string;
    hasDialog: boolean;
    hasPercentage: boolean;
    description?: string;
}

/**
 * Mode definitions registry
 */
const MODE_DEFINITIONS: Record<FlexMode, ModeDefinition> = {
    dimmer_dialog: {
        id: FlexMode.DIMMER_DIALOG,
        label: 'Dimmer (Dialog)',
        hasDialog: true,
        hasPercentage: true,
        description: 'Dimmer control with dialog (0-100)',
    },
    switch: {
        id: FlexMode.SWITCH,
        label: 'Switch (Toggle)',
        hasDialog: false,
        hasPercentage: false,
        description: 'Simple on/off toggle',
    },
    rgb_dialog: {
        id: FlexMode.RGB_DIALOG,
        label: 'RGB Color Picker (Dialog)',
        hasDialog: true,
        hasPercentage: false,
        description: 'RGB color selection dialog',
    },
    thermostat_dialog: {
        id: FlexMode.THERMOSTAT_DIALOG,
        label: 'Thermostat (Dialog)',
        hasDialog: true,
        hasPercentage: false,
        description: 'Temperature control dialog',
    },
    scene_dialog: {
        id: FlexMode.SCENE_DIALOG,
        label: 'Scene Selector (Dialog)',
        hasDialog: true,
        hasPercentage: false,
        description: 'Scene/preset selection',
    },
    dimmer_inline: {
        id: FlexMode.DIMMER_INLINE,
        label: 'Dimmer (Inline Slider)',
        hasDialog: false,
        hasPercentage: true,
        description: 'Dimmer with inline slider (no dialog)',
    },
};

// ========================================
// WIDGET DATA INTERFACE
// ========================================

/**
 * Widget configuration data (from visAttrs)
 */
interface FlexWidgetRxData {
    // === COMMON SETTINGS (ALL MODES) ===
    mode: FlexMode;
    controlOid: string;
    showCard: boolean;

    // === ICON SETTINGS ===
    icon: string;
    iconSize: number;
    activeColor: string;
    inactiveColor: string;

    // === CARD SETTINGS ===
    cardBackgroundColor?: string;
    cardBorderRadiusTL?: number;
    cardBorderRadiusTR?: number;
    cardBorderRadiusBL?: number;
    cardBorderRadiusBR?: number;

    // === DIALOG SETTINGS (ALL DIALOG MODES) ===
    dialogTitle?: string;
    dialogBackgroundColor?: string;
    dialogPrimaryColor?: string;
    dialogTitleColor?: string;
    dialogWidth?: 'xs' | 'sm' | 'md';

    // === STATUS OVERLAY SETTINGS ===
    showPercentage?: boolean;
    showStatusText?: boolean;
    statusOnText?: string;
    statusOffText?: string;
    statusFontSize?: number;

    // === MODE: DIMMER_DIALOG ===
    dimmerMinValue?: number;
    dimmerMaxValue?: number;
    dimmerStep?: number;
    dimmerShowQuickButtons?: boolean;

    // === MODE: SWITCH ===
    switchOnValue?: string;
    switchOffValue?: string;

    // === MODE: RGB_DIALOG ===
    rgbFormat?: 'hex' | 'rgb' | 'hsv';
    rgbPickerType?: 'wheel' | 'sketch' | 'chrome';

    // === MODE: THERMOSTAT_DIALOG ===
    thermostatMinTemp?: number;
    thermostatMaxTemp?: number;
    thermostatStep?: number;
    thermostatUnit?: 'celsius' | 'fahrenheit';

    // === MODE: SCENE_DIALOG ===
    sceneList?: SceneItem[];

    // === MODE: DIMMER_INLINE ===
    inlineSliderPosition?: 'bottom' | 'top' | 'right' | 'left';
    inlineSliderShowOnHover?: boolean;
    inlineSliderHeight?: number;

    [key: string]: unknown;
}

/**
 * Scene item for scene selector mode
 */
interface SceneItem {
    value: string | number;
    label: string;
    icon?: string;
}

// ========================================
// WIDGET STATE INTERFACE
// ========================================

/**
 * Component state
 */
interface FlexWidgetState extends VisRxWidgetState {
    dialog: boolean;
    localValue: number;
    isChanging: boolean;
    oidName: string | null;
}

// ========================================
// HELPER TYPES
// ========================================

/**
 * Parsed value type (for switch mode)
 */
type ParsedValue = boolean | number | string;

/**
 * Click behavior types
 */
type ClickBehavior = 'dialog' | 'toggle' | 'none';
```

### 5.2 Type Guards

```typescript
/**
 * Check if mode has dialog
 */
function modeHasDialog(mode: FlexMode): boolean {
    return MODE_DEFINITIONS[mode]?.hasDialog ?? false;
}

/**
 * Check if mode has percentage
 */
function modeHasPercentage(mode: FlexMode): boolean {
    return MODE_DEFINITIONS[mode]?.hasPercentage ?? false;
}

/**
 * Get mode definition safely
 */
function getModeDefinition(mode: FlexMode): ModeDefinition | null {
    return MODE_DEFINITIONS[mode] || null;
}
```

---

## 6. Mode-System

### 6.1 Mode-Übersicht

| Mode | Dialog | OID Type | Value Range | Description |
|------|--------|----------|-------------|-------------|
| `dimmer_dialog` | ✅ | Number | 0-100 (configurable) | Dimmer mit Dialog, Slider + Quick-Buttons |
| `switch` | ❌ | Any | true/false, 0/1, "on"/"off" | Einfacher Toggle |
| `rgb_dialog` | ✅ | String/Number | HEX, RGB, HSV | Farbauswahl |
| `thermostat_dialog` | ✅ | Number | 10-30°C (configurable) | Temperatur-Steuerung |
| `scene_dialog` | ✅ | Number/String | Custom List | Szenen-Auswahl |
| `dimmer_inline` | ❌ | Number | 0-100 | Dimmer mit Inline-Slider |

### 6.2 Mode-Implementierungs-Status

#### Phase 1 (MVP)
- ✅ `dimmer_dialog` - Zu implementieren
- ✅ `switch` - Zu implementieren

#### Phase 2
- ⏳ `dimmer_inline` - Später
- ⏳ `rgb_dialog` - Später

#### Phase 3
- ⏳ `thermostat_dialog` - Später
- ⏳ `scene_dialog` - Später

### 6.3 Mode-Spezifikationen

#### 6.3.1 Dimmer Dialog Mode

**Verhalten:**
- Klick auf Widget → Dialog öffnen
- Dialog zeigt: Slider, Prozentanzeige, Quick-Buttons (optional)
- Slider: Debounced Value-Update (300ms)
- Quick-Buttons: 0%, 20%, 40%, 60%, 80%, 100% (hardcoded)

**Settings:**
- `dimmerMinValue` (default: 0)
- `dimmerMaxValue` (default: 100)
- `dimmerStep` (default: 1)
- `dimmerShowQuickButtons` (default: true)
- `showPercentage` (default: true)

**OID Requirements:**
- Type: Number
- Range: dimmerMinValue - dimmerMaxValue

**Icon Behavior:**
- Active (value > 0): activeColor
- Inactive (value = 0): inactiveColor
- Percentage shown below icon (if enabled)

#### 6.3.2 Switch Mode

**Verhalten:**
- Klick auf Widget → Toggle Wert
- Kein Dialog
- Direktes setValue

**Settings:**
- `switchOnValue` (default: "true")
- `switchOffValue` (default: "false")
- `showStatusText` (default: false)
- `statusOnText` (default: "ON")
- `statusOffText` (default: "OFF")

**OID Requirements:**
- Type: Any (Boolean, Number, String)
- ON = switchOnValue (parsed)
- OFF = switchOffValue (parsed)

**Icon Behavior:**
- Active (currentValue == onValue): activeColor
- Inactive (currentValue == offValue): inactiveColor
- Optional ON/OFF text below icon

**Value Parsing:**
```typescript
"true" → true (Boolean)
"false" → false (Boolean)
"1" → 1 (Number)
"0" → 0 (Number)
"on" → "on" (String)
"off" → "off" (String)
```

**Comparison:**
- Loose equality (`==`) für Flexibilität
- Boolean: `true` matches `1`, `"true"`, `"1"`
- Number: `0` matches `false`, `"0"`

#### 6.3.3 RGB Dialog Mode (Zukünftig)

**Verhalten:**
- Klick → Color-Picker Dialog
- Farbrad oder Sketch-Picker
- Preview + Hex-Input

**Settings:**
- `rgbFormat`: 'hex' | 'rgb' | 'hsv'
- `rgbPickerType`: 'wheel' | 'sketch' | 'chrome'

**OID Requirements:**
- Type: String (HEX) oder Number (RGB Int)
- Format abhängig von `rgbFormat`

#### 6.3.4 Thermostat Dialog Mode (Zukünftig)

**Verhalten:**
- Klick → Temperatur-Dialog
- +/- Buttons, Slider
- Anzeige mit Einheit (°C/°F)

**Settings:**
- `thermostatMinTemp` (default: 10)
- `thermostatMaxTemp` (default: 30)
- `thermostatStep` (default: 0.5)
- `thermostatUnit`: 'celsius' | 'fahrenheit'

#### 6.3.5 Scene Dialog Mode (Zukünftig)

**Verhalten:**
- Klick → Szenen-Auswahl Dialog
- Liste von Szenen (Buttons oder Dropdown)
- Optional Icons für Szenen

**Settings:**
- `sceneList`: Array<{value, label, icon}>

#### 6.3.6 Dimmer Inline Mode (Zukünftig)

**Verhalten:**
- Kein Dialog
- Slider direkt im Widget
- Optional nur bei Hover sichtbar

**Settings:**
- `inlineSliderPosition`: 'bottom' | 'top' | 'right' | 'left'
- `inlineSliderShowOnHover` (default: false)
- `inlineSliderHeight` (default: 4)

---

## 7. Settings-Struktur

### 7.1 visAttrs Hierarchie

```typescript
static getWidgetInfo(): RxWidgetInfo {
    return {
        id: 'tplDeluxeFlexWidget',
        visSet: 'vis-2-widgets-deluxe',
        visSetLabel: 'set_label',
        visSetColor: 'rgba(18, 179, 160, 1)',
        visWidgetLabel: 'flex_widget',
        visName: 'Flex Widget',
        visAttrs: [
            // ================================================
            // GROUP 1: COMMON SETTINGS (Always visible)
            // ================================================
            {
                name: 'common',
                label: 'deluxe_common',
                fields: [
                    {
                        name: 'mode',
                        label: 'flex_mode',
                        type: 'select',
                        options: [
                            { value: 'dimmer_dialog', label: 'Dimmer (Dialog)' },
                            { value: 'switch', label: 'Switch (Toggle)' },
                            // Future modes commented out
                            // { value: 'rgb_dialog', label: 'RGB Color Picker' },
                            // { value: 'thermostat_dialog', label: 'Thermostat' },
                        ],
                        default: 'dimmer_dialog',
                        tooltip: 'flex_mode_tooltip',
                    },
                    {
                        name: 'controlOid',
                        label: 'control_state',
                        type: 'id',
                        tooltip: 'control_state_tooltip',
                    },
                    {
                        name: 'showCard',
                        label: 'show_card',
                        type: 'checkbox',
                        default: true,
                    },
                ],
            },

            // ================================================
            // GROUP 2: ICON SETTINGS (Always visible)
            // ================================================
            {
                name: 'icon',
                label: 'deluxe_icon_settings',
                fields: [
                    {
                        name: 'icon',
                        label: 'icon',
                        type: 'icon64',
                        default: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik05IDIxYzAgLjUuNCAxIDEgMWg0Yy42IDAgMS0uNSAxLTF2LTFIOXYxem0zLTE5QzguMSAyIDUgNS4xIDUgOWMwIDIuNCAxLjIgNC41IDMgNS43VjE3YzAgLjUuNCAxIDEgMWg2Yy42IDAgMS0uNSAxLTF2LTIuM2MxLjgtMS4zIDMtMy40IDMtNS43YzAtMy45LTMuMS03LTctN3oiLz48L3N2Zz4=',
                    },
                    {
                        name: 'iconSize',
                        label: 'icon_size',
                        type: 'number',
                        default: 48,
                    },
                    {
                        name: 'activeColor',
                        label: 'active_color',
                        type: 'color',
                        default: '#FFC107',
                    },
                    {
                        name: 'inactiveColor',
                        label: 'inactive_color',
                        type: 'color',
                        default: '#555555',
                    },
                ],
            },

            // ================================================
            // GROUP 3: CARD SETTINGS (When showCard=true)
            // ================================================
            {
                name: 'card',
                label: 'deluxe_card_settings',
                hidden: 'data.showCard !== true',
                fields: [
                    {
                        name: 'cardBackgroundColor',
                        label: 'card_background_color',
                        type: 'color',
                        default: '#ffffff',
                    },
                    {
                        name: 'cardBorderRadiusTL',
                        label: 'card_border_radius_tl',
                        type: 'number',
                        default: 8,
                    },
                    {
                        name: 'cardBorderRadiusTR',
                        label: 'card_border_radius_tr',
                        type: 'number',
                        default: 8,
                    },
                    {
                        name: 'cardBorderRadiusBL',
                        label: 'card_border_radius_bl',
                        type: 'number',
                        default: 8,
                    },
                    {
                        name: 'cardBorderRadiusBR',
                        label: 'card_border_radius_br',
                        type: 'number',
                        default: 8,
                    },
                ],
            },

            // ================================================
            // GROUP 4: DIALOG SETTINGS (Modes with dialog)
            // ================================================
            {
                name: 'dialog',
                label: 'deluxe_dialog_settings',
                hidden: (data) => !MODE_DEFINITIONS[data.mode]?.hasDialog,
                fields: [
                    {
                        name: 'dialogTitle',
                        label: 'dialog_title',
                        type: 'text',
                        default: '',
                        tooltip: 'dialog_title_tooltip',
                    },
                    {
                        name: 'dialogBackgroundColor',
                        label: 'dialog_background_color',
                        type: 'color',
                        default: '#ffffff',
                    },
                    {
                        name: 'dialogPrimaryColor',
                        label: 'dialog_primary_color',
                        type: 'color',
                        default: '#2196F3',
                        tooltip: 'dialog_primary_color_tooltip',
                    },
                    {
                        name: 'dialogTitleColor',
                        label: 'dialog_title_color',
                        type: 'color',
                        default: '#000000',
                    },
                    {
                        name: 'dialogWidth',
                        label: 'dialog_width',
                        type: 'select',
                        options: [
                            { value: 'xs', label: 'Extra Small (320px)' },
                            { value: 'sm', label: 'Small (400px)' },
                            { value: 'md', label: 'Medium (600px)' },
                        ],
                        default: 'xs',
                    },
                ],
            },

            // ================================================
            // GROUP 5: STATUS OVERLAY (Percentage/Status Text)
            // ================================================
            {
                name: 'status',
                label: 'deluxe_status_settings',
                hidden: (data) => {
                    const mode = MODE_DEFINITIONS[data.mode];
                    return !mode?.hasPercentage && data.mode !== 'switch';
                },
                fields: [
                    // For Dimmer modes
                    {
                        name: 'showPercentage',
                        label: 'show_percentage',
                        type: 'checkbox',
                        default: true,
                        hidden: (data) => !MODE_DEFINITIONS[data.mode]?.hasPercentage,
                    },
                    // For Switch mode
                    {
                        name: 'showStatusText',
                        label: 'show_status_text',
                        type: 'checkbox',
                        default: false,
                        hidden: (data) => data.mode !== 'switch',
                    },
                    {
                        name: 'statusOnText',
                        label: 'status_on_text',
                        type: 'text',
                        default: 'ON',
                        hidden: (data) => data.mode !== 'switch' || !data.showStatusText,
                    },
                    {
                        name: 'statusOffText',
                        label: 'status_off_text',
                        type: 'text',
                        default: 'OFF',
                        hidden: (data) => data.mode !== 'switch' || !data.showStatusText,
                    },
                    {
                        name: 'statusFontSize',
                        label: 'status_font_size',
                        type: 'number',
                        default: 12,
                        tooltip: 'status_font_size_tooltip',
                    },
                ],
            },

            // ================================================
            // GROUP 6: MODE-SPECIFIC SETTINGS
            // ================================================

            // --- DIMMER DIALOG MODE ---
            {
                name: 'mode_dimmer',
                label: 'dimmer_specific_settings',
                hidden: 'data.mode !== "dimmer_dialog"',
                fields: [
                    {
                        name: 'dimmerMinValue',
                        label: 'dimmer_min_value',
                        type: 'number',
                        default: 0,
                        tooltip: 'dimmer_min_value_tooltip',
                    },
                    {
                        name: 'dimmerMaxValue',
                        label: 'dimmer_max_value',
                        type: 'number',
                        default: 100,
                        tooltip: 'dimmer_max_value_tooltip',
                    },
                    {
                        name: 'dimmerStep',
                        label: 'dimmer_step',
                        type: 'number',
                        default: 1,
                        tooltip: 'dimmer_step_tooltip',
                    },
                    {
                        name: 'dimmerShowQuickButtons',
                        label: 'dimmer_show_quick_buttons',
                        type: 'checkbox',
                        default: true,
                    },
                ],
            },

            // --- SWITCH MODE ---
            {
                name: 'mode_switch',
                label: 'switch_specific_settings',
                hidden: 'data.mode !== "switch"',
                fields: [
                    {
                        name: 'switchOnValue',
                        label: 'switch_on_value',
                        type: 'text',
                        default: 'true',
                        tooltip: 'switch_on_value_tooltip',
                    },
                    {
                        name: 'switchOffValue',
                        label: 'switch_off_value',
                        type: 'text',
                        default: 'false',
                        tooltip: 'switch_off_value_tooltip',
                    },
                ],
            },

            // Future modes: rgb_dialog, thermostat_dialog, scene_dialog, dimmer_inline
            // (commented out for MVP)
        ],
        visDefaultStyle: {
            width: 100,
            height: 100,
            position: 'absolute',
            'overflow-x': 'visible',
            'overflow-y': 'visible',
        },
        visResizable: true,
        visPrev: 'widgets/vis-2-widgets-deluxe/img/prev_flex_widget.png',
    };
}
```

### 7.2 Default Values Strategy

**Principle:** Sinnvolle Defaults, die ohne weitere Konfiguration funktionieren.

```typescript
const DEFAULT_VALUES: Partial<FlexWidgetRxData> = {
    // Common
    mode: 'dimmer_dialog',
    showCard: true,

    // Icon
    icon: '<lightbulb SVG>',
    iconSize: 48,
    activeColor: '#FFC107',
    inactiveColor: '#555555',

    // Card
    cardBackgroundColor: '#ffffff',
    cardBorderRadiusTL: 8,
    cardBorderRadiusTR: 8,
    cardBorderRadiusBL: 8,
    cardBorderRadiusBR: 8,

    // Dialog
    dialogBackgroundColor: '#ffffff',
    dialogPrimaryColor: '#2196F3',
    dialogTitleColor: '#000000',
    dialogWidth: 'xs',

    // Status
    showPercentage: true,
    showStatusText: false,
    statusOnText: 'ON',
    statusOffText: 'OFF',
    statusFontSize: 12,

    // Dimmer
    dimmerMinValue: 0,
    dimmerMaxValue: 100,
    dimmerStep: 1,
    dimmerShowQuickButtons: true,

    // Switch
    switchOnValue: 'true',
    switchOffValue: 'false',
};
```

---

## 8. Rendering-Pipeline

### 8.1 Render-Flow

```
renderWidgetBody()
│
├── renderCard()
│   │
│   ├── renderIcon()
│   │   ├── IconButton (onClick: handleClick)
│   │   ├── Icon Component (SVG/Image)
│   │   └── renderStatusOverlay()
│   │       ├── if mode.hasPercentage: Percentage Text
│   │       └── if mode == 'switch' && showStatusText: ON/OFF Text
│   │
│   └── renderModeSpecificUI()
│       ├── if mode.hasDialog && dialog open:
│       │   └── renderDialog()
│       │       ├── Dialog Shell (MUI Dialog)
│       │       │   ├── DialogTitle
│       │       │   │   ├── getDialogTitle()
│       │       │   │   └── Close Button
│       │       │   └── DialogContent
│       │       │       └── renderModeDialogContent()
│       │       │           ├── switch mode:
│       │       │           │   ├── 'dimmer_dialog': renderDimmerDialog()
│       │       │           │   ├── 'rgb_dialog': renderRgbDialog()
│       │       │           │   └── ...
│       │       │           └── default: null
│       │       │
│       └── if mode has inline UI:
│           └── renderInlineUI()
│
└── return JSX
```

### 8.2 Key Render Methods

```typescript
// Main render
renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
    super.renderWidgetBody(props);

    const content = (
        <>
            {this.renderIcon()}
            {this.renderModeSpecificUI()}
        </>
    );

    return this.wrapWithCard(content);
}

// Card wrapper
wrapWithCard(content: React.JSX.Element): React.JSX.Element {
    if (this.state.rxData.showCard === false || this.props.widget.usedInWidget) {
        return content;
    }

    return <Box sx={{ /* card styles */ }>{content}</Box>;
}

// Icon with status overlay
renderIcon(): React.JSX.Element {
    const isActive = this.getIsActive();
    const iconColor = isActive ? activeColor : inactiveColor;

    return (
        <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
            <IconButton onClick={this.handleClick}>
                <Icon src={icon} color={iconColor} />
            </IconButton>
            {this.renderStatusOverlay()}
        </Box>
    );
}

// Status overlay (percentage or ON/OFF text)
renderStatusOverlay(): React.JSX.Element | null {
    const mode = this.state.rxData.mode;

    switch (mode) {
        case 'dimmer_dialog':
        case 'dimmer_inline':
            if (!showPercentage) return null;
            return <Typography>{localValue}%</Typography>;

        case 'switch':
            if (!showStatusText) return null;
            const text = isActive ? statusOnText : statusOffText;
            return <Typography>{text}</Typography>;

        default:
            return null;
    }
}

// Mode-specific UI (dialog or inline)
renderModeSpecificUI(): React.JSX.Element | null {
    const mode = MODE_DEFINITIONS[this.state.rxData.mode];

    if (mode?.hasDialog && this.state.dialog) {
        return this.renderDialog();
    }

    if (this.state.rxData.mode === 'dimmer_inline') {
        return this.renderInlineSlider();
    }

    return null;
}

// Dialog shell (common for all dialog modes)
renderDialog(): React.JSX.Element | null {
    if (!this.state.dialog) return null;

    return (
        <Dialog
            fullWidth
            maxWidth={dialogWidth}
            open={true}
            onClose={this.handleDialogClose}
        >
            <DialogTitle>
                {this.getDialogTitle()}
                <IconButton onClick={this.handleDialogClose}>
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                {this.renderModeDialogContent()}
            </DialogContent>
        </Dialog>
    );
}

// Mode-specific dialog content
renderModeDialogContent(): React.JSX.Element {
    const primaryColor = dialogPrimaryColor;

    switch (this.state.rxData.mode) {
        case 'dimmer_dialog':
            return this.renderDimmerDialogContent(primaryColor);

        case 'rgb_dialog':
            return this.renderRgbDialogContent(primaryColor);

        // ... other modes

        default:
            return <></>;
    }
}

// Dimmer dialog content
renderDimmerDialogContent(primaryColor: string): React.JSX.Element {
    const { dimmerMinValue, dimmerMaxValue, dimmerStep } = this.state.rxData;

    return (
        <Box>
            <Typography variant="h4">{localValue}%</Typography>
            <Slider
                value={localValue}
                onChange={handleDimmerChange}
                min={dimmerMinValue ?? 0}
                max={dimmerMaxValue ?? 100}
                step={dimmerStep ?? 1}
                sx={{ color: primaryColor }}
            />
            {dimmerShowQuickButtons && this.renderQuickButtons(primaryColor)}
        </Box>
    );
}

// Quick buttons (hardcoded percentages)
renderQuickButtons(primaryColor: string): React.JSX.Element {
    const quickButtons = [
        { label: 'Off', value: min, icon: <PowerSettingsNew /> },
        { label: '20%', value: min + range * 0.2 },
        { label: '40%', value: min + range * 0.4 },
        { label: '60%', value: min + range * 0.6 },
        { label: '80%', value: min + range * 0.8 },
        { label: '100%', value: max },
    ];

    return (
        <>
            <ButtonGroup>
                {quickButtons.map(btn => (
                    <Button
                        key={btn.value}
                        onClick={() => handleQuickSet(btn.value)}
                        sx={{ color: primaryColor }}
                    >
                        {btn.icon || btn.label}
                    </Button>
                ))}
            </ButtonGroup>
        </>
    );
}
```

---

## 9. Event-Handling

### 9.1 Event-Flow

```
User Action → handleClick()
│
├── if editMode: return (ignore)
│
├── switch (mode)
│   ├── 'dimmer_dialog': setState({ dialog: true })
│   ├── 'switch': toggleSwitch()
│   ├── 'rgb_dialog': setState({ dialog: true })
│   └── ...
│
└── State Update / setValue
```

### 9.2 Event Handlers

```typescript
// Main click handler
handleClick = (): void => {
    if (this.state.editMode) return;

    switch (this.state.rxData.mode) {
        case 'dimmer_dialog':
        case 'rgb_dialog':
        case 'thermostat_dialog':
        case 'scene_dialog':
            this.setState({ dialog: true });
            break;

        case 'switch':
            this.toggleSwitch();
            break;

        case 'dimmer_inline':
            // No action (slider always visible)
            break;

        default:
            console.warn(`[FlexWidget] Unknown mode: ${this.state.rxData.mode}`);
    }
};

// Dialog handlers
handleDialogClose = (): void => {
    this.setState({ dialog: false });
};

// Dimmer handlers
private changeTimeout: ReturnType<typeof setTimeout> | null = null;

handleDimmerChange = (_e: Event, value: number | number[]): void => {
    const numValue = Array.isArray(value) ? value[0] : value;

    this.setState({ localValue: numValue, isChanging: true });

    if (this.changeTimeout) {
        clearTimeout(this.changeTimeout);
    }

    this.changeTimeout = setTimeout(() => {
        this.finishChanging(numValue);
    }, 300); // Debounce 300ms
};

handleDimmerChangeCommitted = (_e: Event, value: number | number[]): void => {
    const numValue = Array.isArray(value) ? value[0] : value;
    this.finishChanging(numValue);
};

finishChanging = (value: number): void => {
    if (this.state.rxData.controlOid && !this.state.editMode) {
        this.props.context.setValue(this.state.rxData.controlOid, value);
    }
    this.setState({ isChanging: false });
    this.changeTimeout = null;
};

handleQuickSet = (value: number): void => {
    this.setState({ localValue: value });
    if (this.state.rxData.controlOid && !this.state.editMode) {
        this.props.context.setValue(this.state.rxData.controlOid, value);
    }
};

// Switch handlers
toggleSwitch = (): void => {
    const isOn = this.getCurrentSwitchState();

    const onValue = this.parseValue(this.state.rxData.switchOnValue || 'true');
    const offValue = this.parseValue(this.state.rxData.switchOffValue || 'false');

    const newValue = isOn ? offValue : onValue;

    if (this.state.rxData.controlOid && !this.state.editMode) {
        this.props.context.setValue(this.state.rxData.controlOid, newValue);
    }
};

getCurrentSwitchState(): boolean {
    const value = this.getPropertyValue('controlOid');
    const onValue = this.parseValue(this.state.rxData.switchOnValue || 'true');

    return this.valuesEqual(value, onValue);
}

parseValue(value: string): ParsedValue {
    if (!value) return value;

    // Boolean
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Number
    const numValue = Number(value);
    if (!isNaN(numValue)) return numValue;

    // String (bleibt String)
    return value;
}

valuesEqual(a: unknown, b: unknown): boolean {
    // Loose comparison für Flexibilität
    // eslint-disable-next-line eqeqeq
    return a == b;
}

// Helper methods
isDimmerMode(): boolean {
    return this.state.rxData.mode === 'dimmer_dialog' ||
           this.state.rxData.mode === 'dimmer_inline';
}

getIsActive(): boolean {
    switch (this.state.rxData.mode) {
        case 'dimmer_dialog':
        case 'dimmer_inline':
            return this.state.localValue > 0;

        case 'switch':
            return this.getCurrentSwitchState();

        default:
            return false;
    }
}

getDialogTitle(): string {
    // Custom title
    if (this.state.rxData.dialogTitle) {
        return this.state.rxData.dialogTitle;
    }

    // OID name + mode label
    if (this.state.oidName) {
        const mode = MODE_DEFINITIONS[this.state.rxData.mode];
        return `${mode?.label || 'Control'} - ${this.state.oidName}`;
    }

    // Fallback to mode label
    const mode = MODE_DEFINITIONS[this.state.rxData.mode];
    return mode?.label || 'Control';
}

async fetchOidName(): Promise<void> {
    if (!this.state.rxData.controlOid) return;

    try {
        const obj = await this.props.context.socket.getObject(this.state.rxData.controlOid);
        if (obj?.common?.name) {
            const name = typeof obj.common.name === 'object'
                ? obj.common.name[this.props.context.lang] ||
                  obj.common.name.en ||
                  Object.values(obj.common.name)[0]
                : obj.common.name;
            this.setState({ oidName: String(name) });
        }
    } catch (error) {
        console.error('[FlexWidget] Error fetching OID name:', error);
    }
}
```

### 9.3 Lifecycle Methods

```typescript
componentDidMount(): void {
    super.componentDidMount();

    // NO migration needed (new widget!)

    // Initial value (Dimmer modes)
    if (this.state.rxData.controlOid && this.isDimmerMode()) {
        const value = this.getPropertyValue('controlOid');
        if (value !== null && value !== undefined) {
            this.setState({ localValue: Number(value) || 0 });
        }
    }

    // Fetch OID name for dialog title
    if (this.state.rxData.controlOid) {
        void this.fetchOidName();
    }
}

componentDidUpdate(prevProps: VisRxWidgetProps): void {
    super.componentDidUpdate(prevProps);

    // Update local value when OID value changes (if not currently changing)
    if (this.state.rxData.controlOid && !this.state.isChanging && this.isDimmerMode()) {
        const value = this.getPropertyValue('controlOid');
        if (value !== null && value !== undefined) {
            const numValue = Number(value) || 0;
            if (numValue !== this.state.localValue) {
                this.setState({ localValue: numValue });
            }
        }
    }
}

componentWillUnmount(): void {
    if (this.changeTimeout) {
        clearTimeout(this.changeTimeout);
    }
}
```

---

## 10. Dialog-System

### 10.1 Dialog-Architektur

**Prinzip:** Zentralisierte Dialog-Shell, mode-spezifischer Content

```
Dialog Component
├── Shell (Common for all modes)
│   ├── Dialog (MUI)
│   ├── DialogTitle
│   │   ├── Title Text (auto-generated or custom)
│   │   └── Close Button
│   └── DialogContent
│       └── Mode-specific Content (injected)
│
└── Content (Mode-specific)
    ├── Dimmer: Slider + Quick Buttons
    ├── RGB: Color Picker
    ├── Thermostat: Temperature Control
    └── Scene: Scene List
```

### 10.2 Dialog-Settings (Common)

Alle Dialog-Modi nutzen diese Settings:

- `dialogTitle` - Custom title (or auto from OID name)
- `dialogBackgroundColor` - Background color
- `dialogPrimaryColor` - Primary color (buttons, sliders, active elements)
- `dialogTitleColor` - Title text color
- `dialogWidth` - Dialog size ('xs', 'sm', 'md')

**Vorteil:** Ein Set an Farben/Settings für ALLE Modi mit Dialog!

---

## 11. Validierung & Error-Handling

### 11.1 Validation Strategy

**Approach:** Console warnings only, keine Blockierung

```typescript
async validateOid(oid: string): Promise<boolean> {
    if (!oid) {
        console.warn('[FlexWidget] No OID configured');
        return false;
    }

    try {
        const obj = await this.props.context.socket.getObject(oid);
        if (!obj) {
            console.warn(`[FlexWidget] OID "${oid}" not found`);
            return false;
        }

        // Mode-specific validation (warnings only)
        if (this.isDimmerMode() && obj.common?.type !== 'number') {
            console.warn(`[FlexWidget] OID "${oid}" is type "${obj.common?.type}", expected "number" for dimmer mode`);
        }

        return true;
    } catch (error) {
        console.error(`[FlexWidget] Failed to fetch OID:`, error);
        return false;
    }
}
```

### 11.2 Error Display

**Strategy:** Nur im Edit-Mode anzeigen

```typescript
renderError(): React.JSX.Element | null {
    if (!this.state.editMode) return null;

    if (!this.state.rxData.controlOid) {
        return (
            <Box sx={{ /* error styles */ }}>
                <Typography>No OID configured</Typography>
            </Box>
        );
    }

    return null;
}
```

### 11.3 Graceful Degradation

- **No OID:** Show placeholder, disable click
- **Invalid Value:** Show last known value or default
- **Network Error:** Show cached value
- **Config Error:** Use defaults, log warning

---

## 12. Testing-Strategie

### 12.1 Test-Levels

#### Unit Tests
- `parseValue()` - Value parsing logic
- `valuesEqual()` - Value comparison logic
- `getDialogTitle()` - Title generation
- `getIsActive()` - Active state detection

#### Component Tests
- Render-Tests (Snapshot-Tests)
- Event-Handler-Tests (Click, Change)
- Mode-Switching Tests

#### Integration Tests
- OID-Integration
- Dialog-Flow
- State-Updates

### 12.2 Example Tests

```typescript
describe('FlexWidget', () => {
    describe('Mode: dimmer_dialog', () => {
        it('opens dialog on click', async () => {
            const { container } = render(<FlexWidget {...mockProps} />);
            const icon = container.querySelector('[role="button"]');

            await userEvent.click(icon);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });
    });

    describe('Mode: switch', () => {
        it('toggles value on click', async () => {
            const setValue = vi.fn();
            const props = {
                ...mockProps,
                data: { mode: 'switch', switchOnValue: 'true', switchOffValue: 'false' },
                context: { ...mockProps.context, setValue }
            };

            const { container } = render(<FlexWidget {...props} />);
            const icon = container.querySelector('[role="button"]');

            await userEvent.click(icon);

            expect(setValue).toHaveBeenCalledWith(expect.anything(), true);
        });
    });

    describe('parseValue', () => {
        it('parses boolean strings', () => {
            expect(parseValue('true')).toBe(true);
            expect(parseValue('false')).toBe(false);
        });

        it('parses number strings', () => {
            expect(parseValue('0')).toBe(0);
            expect(parseValue('100')).toBe(100);
        });

        it('keeps strings as strings', () => {
            expect(parseValue('on')).toBe('on');
            expect(parseValue('off')).toBe('off');
        });
    });
});
```

---

## 13. Performance-Optimierung

### 13.1 Performance-Ziele

- **Initial Render:** < 100ms
- **Re-Render:** < 50ms
- **Click Response:** < 50ms
- **Dialog Open:** < 100ms
- **Value Update:** < 300ms (incl. debounce)

### 13.2 Optimierungs-Strategien

#### Debouncing
```typescript
// Slider updates debounced (300ms)
handleDimmerChange = (_e: Event, value: number | number[]): void => {
    // ... debounce logic
};
```

#### Lazy Rendering
```typescript
// Dialog nur rendern wenn offen
renderDialog(): React.JSX.Element | null {
    if (!this.state.dialog) return null;
    // ...
}
```

#### Conditional Rendering
- Status Overlay nur wenn enabled
- Quick Buttons nur wenn enabled
- Mode-specific UI nur wenn Mode passt

---

## 14. Erweiterbarkeits-Pattern

### 14.1 Neuen Mode hinzufügen (Step-by-Step)

#### Schritt 1: Mode definieren
```typescript
enum FlexMode {
    // ...existing
    NEW_MODE = 'new_mode',
}

const MODE_DEFINITIONS: Record<FlexMode, ModeDefinition> = {
    // ...existing
    new_mode: {
        id: FlexMode.NEW_MODE,
        label: 'New Mode Label',
        hasDialog: true,
        hasPercentage: false,
    },
};
```

#### Schritt 2: RxData erweitern
```typescript
interface FlexWidgetRxData {
    // ...existing
    newModeSetting1?: string;
}
```

#### Schritt 3: visAttrs ergänzen
```typescript
{
    name: 'mode_new',
    label: 'new_mode_settings',
    hidden: 'data.mode !== "new_mode"',
    fields: [/* ... */],
}
```

#### Schritt 4: Event-Handler
```typescript
handleClick = (): void => {
    // ...existing cases
    case 'new_mode':
        this.handleNewModeClick();
        break;
};
```

#### Schritt 5: Rendering
```typescript
renderModeDialogContent(): React.JSX.Element {
    // ...existing cases
    case 'new_mode':
        return this.renderNewModeDialog(primaryColor);
};
```

#### Schritt 6: Translations
```typescript
new_mode: 'New Mode',
new_mode_settings: 'New Mode Settings',
```

#### Schritt 7: Testing
```typescript
describe('Mode: new_mode', () => { /* ... */ });
```

### 14.2 Checkliste für neue Modi

- [ ] Mode in Enum definiert
- [ ] MODE_DEFINITIONS erweitert
- [ ] RxData Interface erweitert
- [ ] visAttrs Group hinzugefügt
- [ ] handleClick erweitert
- [ ] renderModeDialogContent erweitert (wenn Dialog)
- [ ] Mode-spezifische Render-Methods
- [ ] Translations hinzugefügt (EN + DE)
- [ ] Tests geschrieben

---

## 15. Translation-Keys

### 15.1 Neue Keys (EN)

```typescript
// Widget
flex_widget: 'Flex Widget',

// Common
flex_mode: 'Mode',
flex_mode_tooltip: 'Select widget interaction mode',
control_state: 'Control State',
control_state_tooltip: 'ioBroker state to control',

// Dialog
dialog_title: 'Dialog Title',
dialog_title_tooltip: 'Custom dialog title (leave empty for auto-generated)',
dialog_background_color: 'Dialog Background Color',
dialog_primary_color: 'Dialog Primary Color',
dialog_primary_color_tooltip: 'Color for buttons, sliders and interactive elements',
dialog_title_color: 'Dialog Title Color',
dialog_width: 'Dialog Width',

// Status
deluxe_status_settings: 'Deluxe - Status Settings',
show_status_text: 'Show Status Text',
status_on_text: 'ON Text',
status_off_text: 'OFF Text',
status_font_size: 'Status Font Size',
status_font_size_tooltip: 'Font size for percentage/status text',

// Dimmer Specific
dimmer_specific_settings: 'Dimmer Specific Settings',
dimmer_min_value: 'Minimum Value',
dimmer_min_value_tooltip: 'Minimum dimmer value (e.g., 0)',
dimmer_max_value: 'Maximum Value',
dimmer_max_value_tooltip: 'Maximum dimmer value (e.g., 100)',
dimmer_step: 'Step',
dimmer_step_tooltip: 'Step size for slider',
dimmer_show_quick_buttons: 'Show Quick Buttons',

// Switch Specific
switch_specific_settings: 'Switch Specific Settings',
switch_on_value: 'ON Value',
switch_on_value_tooltip: 'Value to set when turning ON (e.g., true, 1, "on")',
switch_off_value: 'OFF Value',
switch_off_value_tooltip: 'Value to set when turning OFF (e.g., false, 0, "off")',
```

### 15.2 Deutsche Übersetzungen

```typescript
// Widget
flex_widget: 'Flex Widget',

// Common
flex_mode: 'Modus',
flex_mode_tooltip: 'Wählen Sie den Widget-Interaktionsmodus',
control_state: 'Steuerzustand',
control_state_tooltip: 'ioBroker-Zustand zur Steuerung',

// Dialog
dialog_title: 'Dialog-Titel',
dialog_title_tooltip: 'Benutzerdefinierter Dialog-Titel (leer lassen für automatisch)',
dialog_background_color: 'Dialog-Hintergrundfarbe',
dialog_primary_color: 'Dialog-Primärfarbe',
dialog_primary_color_tooltip: 'Farbe für Schaltflächen, Schieberegler und interaktive Elemente',
dialog_title_color: 'Dialog-Titelfarbe',
dialog_width: 'Dialog-Breite',

// Status
deluxe_status_settings: 'Deluxe - Status-Einstellungen',
show_status_text: 'Statustext anzeigen',
status_on_text: 'EIN-Text',
status_off_text: 'AUS-Text',
status_font_size: 'Status-Schriftgröße',
status_font_size_tooltip: 'Schriftgröße für Prozent-/Statustext',

// Dimmer Specific
dimmer_specific_settings: 'Dimmer-spezifische Einstellungen',
dimmer_min_value: 'Minimalwert',
dimmer_min_value_tooltip: 'Minimaler Dimmerwert (z.B. 0)',
dimmer_max_value: 'Maximalwert',
dimmer_max_value_tooltip: 'Maximaler Dimmerwert (z.B. 100)',
dimmer_step: 'Schrittgröße',
dimmer_step_tooltip: 'Schrittgröße für Schieberegler',
dimmer_show_quick_buttons: 'Schnelltasten anzeigen',

// Switch Specific
switch_specific_settings: 'Schalter-spezifische Einstellungen',
switch_on_value: 'EIN-Wert',
switch_on_value_tooltip: 'Wert beim Einschalten (z.B. true, 1, "on")',
switch_off_value: 'AUS-Wert',
switch_off_value_tooltip: 'Wert beim Ausschalten (z.B. false, 0, "off")',
```

---

## 16. File-Struktur

### 16.1 Aktuelle Struktur

```
src-widgets/src/
├── index.tsx
├── Generic.tsx
├── HelloWorld.tsx
├── DimmerWidget.tsx         ← Bleibt unverändert
├── translations.ts
└── components/
    ├── index.ts
    └── Icon.tsx
```

### 16.2 Nach FlexWidget Implementation

```
src-widgets/src/
├── index.tsx
├── Generic.tsx
├── HelloWorld.tsx
├── DimmerWidget.tsx         ← Bleibt unverändert
├── FlexWidget.tsx           ← NEU (~800-1000 LOC)
├── translations.ts          ← Erweitert
└── components/
    ├── index.ts
    └── Icon.tsx
```

---

## 17. Implementierungs-Reihenfolge

### Phase 1: Foundation (MVP) - Dimmer + Switch

#### Sprint 1: Setup & Basis-Struktur (2-3 Tage)
- [ ] `FlexWidget.tsx` erstellen (Basis von DimmerWidget kopieren)
- [ ] Type-System implementieren
  - [ ] `FlexMode` Enum
  - [ ] `MODE_DEFINITIONS` Objekt
  - [ ] `FlexWidgetRxData` Interface
  - [ ] `FlexWidgetState` Interface
- [ ] Widget-ID: `tplDeluxeFlexWidget`
- [ ] Basis-Class-Structure aufbauen

#### Sprint 2: Settings-Struktur (2-3 Tage)
- [ ] `getWidgetInfo()` implementieren
  - [ ] Common Settings
  - [ ] Icon Settings (von DimmerWidget)
  - [ ] Card Settings (von DimmerWidget)
  - [ ] Dialog Settings (neu, zentralisiert)
  - [ ] Status Settings (neu)
  - [ ] Mode: Dimmer (angepasst)
  - [ ] Mode: Switch (neu)
- [ ] Default-Values definieren
- [ ] Translations erweitern (EN + DE)

#### Sprint 3: Rendering-Pipeline (3-4 Tage)
- [ ] `renderWidgetBody()` implementieren
- [ ] `wrapWithCard()` implementieren
- [ ] `renderIcon()` implementieren
- [ ] `renderStatusOverlay()` implementieren (mode-aware)
- [ ] `renderDialog()` implementieren (Shell)
- [ ] `renderModeDialogContent()` implementieren
- [ ] `renderDimmerDialogContent()` implementieren
- [ ] `renderQuickButtons()` implementieren
- [ ] `getIsActive()` implementieren (mode-aware)
- [ ] `getDialogTitle()` implementieren

#### Sprint 4: Switch Mode (2-3 Tage)
- [ ] `handleClick()` implementieren (mode-switch)
- [ ] `toggleSwitch()` implementieren
- [ ] `getCurrentSwitchState()` implementieren
- [ ] `parseValue()` implementieren
- [ ] `valuesEqual()` implementieren
- [ ] Switch-Mode Settings UI testen

#### Sprint 5: Event-Handling & Lifecycle (2-3 Tage)
- [ ] `handleDimmerChange()` implementieren (debounced)
- [ ] `handleDimmerChangeCommitted()` implementieren
- [ ] `finishChanging()` implementieren
- [ ] `handleQuickSet()` implementieren
- [ ] `handleDialogClose()` implementieren
- [ ] `componentDidMount()` implementieren
- [ ] `componentDidUpdate()` implementieren
- [ ] `componentWillUnmount()` implementieren
- [ ] `fetchOidName()` implementieren

#### Sprint 6: Testing & Bugfixing (2-3 Tage)
- [ ] Unit-Tests für Switch-Logik
- [ ] Unit-Tests für Helper-Methods
- [ ] Component-Tests für beide Modi
- [ ] Integration-Tests
- [ ] Manuelle Tests in vis-2
- [ ] Bugfixing

#### Sprint 7: Integration & Dokumentation (1-2 Tage)
- [ ] `vite.config.ts` anpassen (exposes FlexWidget)
- [ ] `io-package.json` anpassen (FlexWidget registrieren)
- [ ] Preview-Image erstellen
- [ ] README.md aktualisieren
- [ ] WIDGETS.md aktualisieren
- [ ] Release vorbereiten

**Geschätzte Dauer Phase 1:** 14-21 Tage

---

### Phase 2: Extended Modes (Future)

#### Sprint 8: Dimmer Inline Mode (3-4 Tage)
- [ ] Inline-Slider Component
- [ ] Position-Logic (bottom/top/left/right)
- [ ] Hover-Logic (optional)
- [ ] Settings UI
- [ ] Tests

#### Sprint 9: RGB Dialog Mode (4-5 Tage)
- [ ] Color-Picker Integration (react-color?)
- [ ] Format-Converter (HEX/RGB/HSV)
- [ ] Dialog UI
- [ ] Settings UI
- [ ] Tests

**Geschätzte Dauer Phase 2:** 7-9 Tage

---

### Phase 3: Advanced Modes (Future)

#### Sprint 10: Thermostat Mode (3-4 Tage)
#### Sprint 11: Scene Selector Mode (3-4 Tage)

**Geschätzte Dauer Phase 3:** 6-8 Tage

---

### Phase 4: Optimization & Polish (Future)

- Performance-Optimierung
- Accessibility-Verbesserungen
- Extended Testing
- Documentation finalisieren

---

## 18. Design-Entscheidungen

Alle wichtigen Entscheidungen für die Implementierung wurden getroffen:

### ✅ 1. Widget-Name
**Entscheidung:** FlexWidget
- Widget-ID: `tplDeluxeFlexWidget`
- File: `FlexWidget.tsx`

### ✅ 2. Neues Widget vs. Refactoring
**Entscheidung:** NEUES Widget (parallel zu DimmerWidget)
- Keine Migration nötig
- DimmerWidget bleibt unverändert
- Clean Slate

### ✅ 3. Quick-Buttons
**Entscheidung:** Hardcoded [0, 20, 40, 60, 80, 100]
- Einfacher
- Kann später erweitert werden wenn Bedarf
- Prozentual zwischen min/max berechnet

### ✅ 4. Dialog-Width
**Entscheidung:** Predefined Sizes (xs/sm/md)
- Select mit 3 Optionen
- Deckt 99% Use-Cases ab
- Einfacher als Custom Number Input

### ✅ 5. State-Type Validation
**Entscheidung:** Console-Warnings only
- Keine Blockierung
- User-freundlich
- Informativ für Debugging
- Beispiel: Dimmer-Mode + Boolean-OID → Warning

### ✅ 6. Error-Display
**Entscheidung:** Nur im Edit-Mode
- Runtime sollte störungsfrei sein
- Edit-Mode zeigt Konfigurations-Fehler
- Graceful Degradation im Runtime

### ✅ 7. Status-Overlay Font-Size
**Entscheidung:** Konfigurierbar
- Default: 12px
- Setting: `statusFontSize`
- Gibt User mehr Kontrolle

### ✅ 8. Architektur-Pattern
**Entscheidung:** Hybrid Approach
- Gemeinsame Logik zentral
- Mode-spezifische Methods
- Switch-basierte Delegation
- Kein Handler-Pattern (zu komplex für MVP)
- Später ggf. Refactoring wenn > 4 Modi

### ✅ 9. Bundle-Size Strategie
**Entscheidung:** Keine neuen Dependencies
- Nur MUI (bereits vorhanden)
- Code-Splitting später bei Bedarf
- Ziel: < 50KB zusätzlich

### ✅ 10. Testing-Framework
**Entscheidung:** Vitest + Testing Library
- Bereits in Projekt-Setup
- Modern, schnell
- Gute React-Integration

---

## Zusammenfassung

### Kern-Konzept

**FlexWidget** ist ein universelles Steuerungs-Widget mit verschiedenen Modi:
- **Dimmer Dialog**: Slider-basierte Steuerung via Dialog
- **Switch**: Direkter Toggle ohne Dialog
- **Weitere** (zukünftig): RGB, Thermostat, Szenen, Inline-Dimmer, etc.

### Design-Prinzipien

1. **Erweiterbarkeit**: Neue Modi einfach hinzufügbar
2. **Zentralisierung**: Gemeinsame Funktionen (Dialog, Icon, Card) zentral
3. **Separation**: Mode-spezifische Settings getrennt von allgemeinen
4. **KISS**: Einfachste Lösung bevorzugen, keine Über-Engineering
5. **Clean Slate**: Neues Widget, keine Legacy-Ballast

### Key Features

- ✅ Mode-System mit 6 geplanten Modi
- ✅ Zentralisierte Dialog-Settings (ein Set Farben für alle Modi!)
- ✅ Icon-System mit activeColor/inactiveColor
- ✅ Card-System mit Border-Radius
- ✅ Status-Overlay (Percentage oder ON/OFF Text)
- ✅ Debounced Updates (Dimmer)
- ✅ Flexible Switch-Werte (Boolean, Number, String)
- ✅ Hardcoded Quick-Buttons (einfach, bewährt)
- ✅ Console-Warnings für Type-Mismatches
- ✅ Graceful Degradation

### Geschätzte Aufwände

- **Phase 1 (MVP - Dimmer + Switch):** 14-21 Tage
- **Phase 2 (Inline + RGB):** 7-9 Tage
- **Phase 3 (Thermostat + Scene):** 6-8 Tage
- **Phase 4 (Polish):** 3-5 Tage

**Total:** 30-43 Tage (full-time)

---

## Anhang

### A. Vergleich: DimmerWidget vs. FlexWidget

| Feature | DimmerWidget | FlexWidget |
|---------|--------------|------------|
| Modi | 1 (Dimmer) | 6+ (erweiterbar) |
| Dialog-Settings | Mixed | Zentralisiert |
| Switch-Funktion | ❌ | ✅ |
| Quick-Buttons | Hardcoded | Hardcoded (gleich) |
| Icon-System | ✅ | ✅ (übernommen) |
| Card-System | ✅ | ✅ (übernommen) |
| Migration | - | Nicht nötig (neues Widget) |
| Erweiterbarkeit | ❌ | ✅✅✅ |

### B. Referenzen

- ioBroker vis-2 Docs: https://github.com/ioBroker/ioBroker.vis-2
- Module Federation: https://module-federation.io/
- Material-UI Dialog: https://mui.com/material-ui/react-dialog/
- React Testing Library: https://testing-library.com/react

### C. Glossar

- **OID**: Object ID in ioBroker (State-Identifier)
- **visAttrs**: Widget-Konfiguration für vis-2 Editor
- **rxData**: Widget-Konfigurations-Daten (vom User gesetzt)
- **Mode**: Betriebs-Modus des Widgets (dimmer, switch, etc.)
- **Dialog-Shell**: Gemeinsame Dialog-Struktur für alle Modi
- **FlexMode**: Enum der verfügbaren Modi

---

**Ende des Konzeptdokuments**

**Status:** ✅ Bereit für Implementierung

**Nächste Schritte:**
1. Sprint 1 starten: Setup & Basis-Struktur
2. Siehe Kapitel 17 (Implementierungs-Reihenfolge)

**Keine offenen Fragen!** Alle Entscheidungen getroffen (Kapitel 18).
