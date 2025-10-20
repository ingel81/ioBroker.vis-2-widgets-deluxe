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
