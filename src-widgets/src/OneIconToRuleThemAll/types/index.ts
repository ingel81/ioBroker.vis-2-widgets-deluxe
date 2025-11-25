import type { VisRxWidgetState } from '@iobroker/types-vis-2';

/**
 * Available control modes for OneIconToRuleThemAll
 */
export enum FlexMode {
    DIMMER_DIALOG = 'dimmer_dialog',
    SWITCH = 'switch',
    HEATING_KNX = 'heating_knx',
    WINDOW_SHUTTER = 'window_shutter',
    // Display-Modi (read-only)
    NUMERIC_DISPLAY = 'numeric_display',
    STRING_DISPLAY = 'string_display',
}

/**
 * Icon position for display modes
 */
export enum IconPosition {
    LEFT = 'left',
    RIGHT = 'right',
    TOP = 'top',
    BOTTOM = 'bottom',
}

/**
 * Decimal rounding mode
 */
export enum DecimalMode {
    ROUND = 'round',
    FLOOR = 'floor',
    CEIL = 'ceil',
    TRUNC = 'trunc',
}

/**
 * Decimal separator
 */
export enum DecimalSeparator {
    DOT = '.',
    COMMA = ',',
}

/**
 * Thousand separator
 */
export enum ThousandSeparator {
    NONE = 'none',
    DOT = '.',
    COMMA = ',',
    APOSTROPHE = "'",
    SPACE = ' ',
}

/**
 * Text transformation
 */
export enum TextTransform {
    NONE = 'none',
    UPPERCASE = 'uppercase',
    LOWERCASE = 'lowercase',
    CAPITALIZE = 'capitalize',
}

/**
 * Click action for display modes
 */
export enum ClickAction {
    NONE = 'none',
    NAVIGATE = 'navigate',
}

/**
 * Mode metadata and capabilities
 */
export interface ModeDefinition {
    id: FlexMode;
    label: string;
    hasDialog: boolean;
    hasPercentage: boolean;
    description?: string;
}

/**
 * Widget configuration data (from visAttrs)
 */
export interface OneIconToRuleThemAllRxData {
    // === COMMON SETTINGS (ALL MODES) ===
    mode: FlexMode;
    controlOid: string;
    showCard: boolean;

    // === ICON SETTINGS ===
    icon: string;
    iconSize: number;
    iconRotation?: number;
    useDifferentInactiveIcon?: boolean;
    iconInactive?: string;
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

    // === MODE: HEATING_KNX ===
    heatingSetpointShiftOid?: string;
    heatingSetpointIncreaseValue?: string;
    heatingSetpointDecreaseValue?: string;
    heatingValvePositionOid?: string;
    heatingSetpointOid?: string;
    heatingModeStatusOid?: string;
    heatingModeControlOid?: string;
    heatingShowUnits?: boolean;
    heatingModeControlType?: 'button' | 'dropdown' | 'buttons';
    heatingModesConfig?: string;

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

    // Rolladen-Werte (für KNX-Kompatibilität)
    shutterUpValue?: number | boolean; // Wert für "Hoch" (default: 0 für KNX)
    shutterDownValue?: number | boolean; // Wert für "Runter" (default: 1 für KNX)
    shutterStopValue?: number | boolean; // Wert für "Stop" (default: 1)

    // Fenster-Geometrie
    windowPaneCount?: number;

    // Farb-Konfiguration
    windowFrameColor?: string; // Gesamtrahmen
    windowPaneFrameColor?: string; // Flügel-Rahmen
    windowGlassColor?: string; // Glasscheiben
    windowHandleColor?: string; // Griffe
    windowPaneClosedColor?: string; // Status: geschlossen
    windowPaneOpenColor?: string; // Status: offen
    windowPaneTiltColor?: string; // Status: gekippt
    windowShutterColor?: string; // Rolladen
    windowBackgroundColorClosed?: string; // Hintergrund inaktiv
    windowBackgroundColorActive?: string; // Hintergrund aktiv

    // === MODE: DISPLAY (Common) ===
    displayIconPosition?: IconPosition;
    displayClickAction?: ClickAction;
    displayTargetView?: string;
    displayValueFontSize?: number;
    displayIconTextGap?: number;
    displayTextColor?: string;

    // === MODE: NUMERIC_DISPLAY ===
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
    numericDisplayValueMapping?: string;

    // === MODE: STRING_DISPLAY ===
    stringDisplayValueOid?: string;
    stringDisplayMaxLength?: number;
    stringDisplayEllipsis?: boolean;
    stringDisplayTextTransform?: TextTransform;
    stringDisplayPrefix?: string;
    stringDisplaySuffix?: string;
    stringDisplayValueMapping?: string;

    [key: string]: unknown;
}

/**
 * NumericDisplayMode config
 */
export interface NumericDisplayModeConfig {
    valueOid?: string;
    decimals?: number;
    decimalMode?: DecimalMode;
    decimalSeparator?: DecimalSeparator;
    thousandSeparator?: ThousandSeparator;
    unit?: string;
    prefix?: string;
    suffix?: string;
    valueMapping?: string; // JSON string
    useColorThresholds?: boolean;
    thresholdLow?: number;
    thresholdHigh?: number;
    colorLow?: string;
    colorMedium?: string;
    colorHigh?: string;
}

/**
 * NumericDisplayMode state
 */
export interface NumericDisplayModeState {
    value: number | null;
    formattedValue: string;
    currentColor: string;
}

/**
 * StringDisplayMode config
 */
export interface StringDisplayModeConfig {
    valueOid?: string;
    maxLength?: number;
    ellipsis?: boolean;
    textTransform?: TextTransform;
    prefix?: string;
    suffix?: string;
    valueMapping?: string; // JSON string
}

/**
 * StringDisplayMode state
 */
export interface StringDisplayModeState {
    value: string | null;
    formattedValue: string;
}

/**
 * Component state
 */
export interface OneIconToRuleThemAllState extends VisRxWidgetState {
    dialog: boolean;
    oidName: string | null;

    // Mode-specific states
    heating: HeatingModeState;
    dimmer: DimmerModeState;
    switch: SwitchModeState;
    windowShutter: WindowShutterModeState;
    numericDisplay: NumericDisplayModeState;
    stringDisplay: StringDisplayModeState;
}

/**
 * Heating mode state
 */
export interface HeatingModeState {
    setpointValue: number | null;
    valveValue: number | null;
    currentMode: number | null;
}

/**
 * Dimmer mode state
 */
export interface DimmerModeState {
    localValue: number;
    isChanging: boolean;
}

/**
 * Switch mode state
 */
export interface SwitchModeState {
    isOn: boolean;
}

/**
 * Window shutter mode state
 */
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

/**
 * Parsed value type (for switch mode)
 */
export type ParsedValue = boolean | number | string;

/**
 * Heating mode configuration
 */
export interface HeatingMode {
    label: string;
    statusValue: number; // Value received from status OID (for display/comparison)
    controlValue: number; // Value to send to control OID (for switching)
    value?: number; // Deprecated: backwards compatibility (used as both status and control if others not set)
}
