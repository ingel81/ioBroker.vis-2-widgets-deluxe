import { FlexMode, type ModeDefinition } from './index';

/**
 * Mode definitions registry
 */
export const MODE_DEFINITIONS: Record<FlexMode, ModeDefinition> = {
    [FlexMode.DIMMER_DIALOG]: {
        id: FlexMode.DIMMER_DIALOG,
        label: 'Dimmer (Dialog)',
        hasDialog: true,
        hasPercentage: true,
        description: 'Dimmer control with dialog (0-100)',
    },
    [FlexMode.SWITCH]: {
        id: FlexMode.SWITCH,
        label: 'Switch (Toggle)',
        hasDialog: false,
        hasPercentage: false,
        description: 'Simple on/off toggle',
    },
    [FlexMode.HEATING_KNX]: {
        id: FlexMode.HEATING_KNX,
        label: 'Heating (KNX)',
        hasDialog: true,
        hasPercentage: false,
        description: 'KNX heating control with setpoint and mode',
    },
    [FlexMode.WINDOW_SHUTTER]: {
        id: FlexMode.WINDOW_SHUTTER,
        label: 'Window & Shutter',
        hasDialog: true,
        hasPercentage: true,
        description: 'Window and shutter control with multiple panes',
    },
    [FlexMode.NUMERIC_DISPLAY]: {
        id: FlexMode.NUMERIC_DISPLAY,
        label: 'Numeric Display',
        hasDialog: false,
        hasPercentage: false,
        description: 'Read-only numeric value display with formatting',
    },
    [FlexMode.STRING_DISPLAY]: {
        id: FlexMode.STRING_DISPLAY,
        label: 'String Display',
        hasDialog: false,
        hasPercentage: false,
        description: 'Read-only text display with transformation',
    },
};

/**
 * Check if mode has dialog
 */
export function modeHasDialog(mode: FlexMode): boolean {
    return MODE_DEFINITIONS[mode]?.hasDialog ?? false;
}

/**
 * Check if mode has percentage
 */
export function modeHasPercentage(mode: FlexMode): boolean {
    return MODE_DEFINITIONS[mode]?.hasPercentage ?? false;
}

/**
 * Get mode definition safely
 */
export function getModeDefinition(mode: FlexMode): ModeDefinition | null {
    return MODE_DEFINITIONS[mode] || null;
}
