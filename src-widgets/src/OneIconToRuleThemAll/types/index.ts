import type { VisRxWidgetState } from '@iobroker/types-vis-2';

/**
 * Available control modes for OneIconToRuleThemAll
 */
export enum FlexMode {
    DIMMER_DIALOG = 'dimmer_dialog',
    SWITCH = 'switch',
    HEATING_KNX = 'heating_knx',
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
    heatingValvePositionOid?: string;
    heatingSetpointOid?: string;
    heatingModeStatusOid?: string;
    heatingModeControlOid?: string;
    heatingShowUnits?: boolean;
    heatingModeControlType?: 'button' | 'dropdown' | 'buttons';
    heatingModesConfig?: string;

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
