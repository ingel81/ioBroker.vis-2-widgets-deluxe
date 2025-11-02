import type { VisRxWidgetState } from '@iobroker/types-vis-2';

/**
 * Available control modes for OneIconToRuleThemAll
 */
export enum FlexMode {
    DIMMER_DIALOG = 'dimmer_dialog',
    SWITCH = 'switch',
    HEATING_KNX = 'heating_knx',
    WINDOW_SHUTTER = 'window_shutter',
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

    [key: string]: unknown;
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
