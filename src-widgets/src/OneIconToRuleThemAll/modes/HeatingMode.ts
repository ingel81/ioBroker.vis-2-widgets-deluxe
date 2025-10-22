import type { HeatingMode, HeatingModeState } from '../types';
import type { SocketLike } from '../types/socket';

export interface HeatingModeConfig {
    setpointShiftOid?: string;
    setpointIncreaseValue?: string;
    setpointDecreaseValue?: string;
    valvePositionOid?: string;
    setpointOid?: string;
    modeStatusOid?: string;
    modeControlOid?: string;
    modesConfig?: string;
    showUnits?: boolean;
}

export class HeatingModeLogic {
    private config: HeatingModeConfig;
    private socket: SocketLike;
    private setState: (state: Partial<HeatingModeState>) => void;
    private setValue: (oid: string, value: unknown) => void;

    constructor(
        config: HeatingModeConfig,
        socket: SocketLike,
        setState: (state: Partial<HeatingModeState>) => void,
        setValue: (oid: string, value: unknown) => void,
    ) {
        this.config = config;
        this.socket = socket;
        this.setState = setState;
        this.setValue = setValue;
    }

    /**
     * Parse modes from JSON configuration with backwards compatibility
     */
    getModes(): HeatingMode[] {
        try {
            const parsed = JSON.parse(this.config.modesConfig || '[]');
            if (Array.isArray(parsed)) {
                // Ensure backwards compatibility: if statusValue/controlValue missing, use value
                return parsed.map(mode => ({
                    label: mode.label,
                    statusValue: mode.statusValue ?? mode.value ?? 0,
                    controlValue: mode.controlValue ?? mode.value ?? 0,
                    value: mode.value, // Keep for backwards compat
                }));
            }
        } catch (error) {
            console.error('[HeatingMode] Error parsing modes config:', error);
        }
        // Default fallback
        return [
            { label: 'Komfort', statusValue: 33, controlValue: 1 },
            { label: 'Standby', statusValue: 34, controlValue: 2 },
            { label: 'Nacht', statusValue: 36, controlValue: 3 },
            { label: 'Frost', statusValue: 40, controlValue: 4 },
        ];
    }

    /**
     * Initialize: Load values from ioBroker
     */
    async initialize(): Promise<void> {
        const updates: Partial<HeatingModeState> = {};

        if (this.config.setpointOid) {
            const state = await this.socket.getState(this.config.setpointOid);
            if (state?.val !== undefined) {
                updates.setpointValue = Number(state.val);
            }
        }

        if (this.config.valvePositionOid) {
            const state = await this.socket.getState(this.config.valvePositionOid);
            if (state?.val !== undefined) {
                updates.valveValue = Number(state.val);
            }
        }

        if (this.config.modeStatusOid) {
            const state = await this.socket.getState(this.config.modeStatusOid);
            if (state?.val !== undefined) {
                updates.currentMode = Number(state.val);
            }
        }

        if (Object.keys(updates).length > 0) {
            this.setState(updates);
        }
    }

    /**
     * Get OIDs to subscribe to
     */
    getSubscriptionOids(): string[] {
        const oids: string[] = [];
        if (this.config.setpointOid) {
            oids.push(this.config.setpointOid);
        }
        if (this.config.valvePositionOid) {
            oids.push(this.config.valvePositionOid);
        }
        if (this.config.modeStatusOid) {
            oids.push(this.config.modeStatusOid);
        }
        return oids;
    }

    /**
     * Handle state changes from ioBroker
     */
    handleStateChange(id: string, value: unknown): void {
        if (id === this.config.setpointOid) {
            this.setState({ setpointValue: Number(value) });
        } else if (id === this.config.valvePositionOid) {
            this.setState({ valveValue: Number(value) });
        } else if (id === this.config.modeStatusOid) {
            this.setState({ currentMode: Number(value) });
        }
    }

    /**
     * Parse string value to appropriate type (boolean, number, or string)
     */
    private parseValue(value: string): boolean | number | string {
        // Try boolean
        if (value === 'true') {
            return true;
        }
        if (value === 'false') {
            return false;
        }

        // Try number
        const num = Number(value);
        if (!isNaN(num)) {
            return num;
        }

        // Return as string
        return value;
    }

    /**
     * Handle setpoint increase button
     */
    handleIncrease(editMode: boolean): void {
        if (this.config.setpointShiftOid && !editMode) {
            const value = this.parseValue(this.config.setpointIncreaseValue || 'true');
            this.setValue(this.config.setpointShiftOid, value);
        }
    }

    /**
     * Handle setpoint decrease button
     */
    handleDecrease(editMode: boolean): void {
        if (this.config.setpointShiftOid && !editMode) {
            const value = this.parseValue(this.config.setpointDecreaseValue || 'false');
            this.setValue(this.config.setpointShiftOid, value);
        }
    }

    /**
     * Handle mode switch button (cycle through modes)
     */
    handleModeSwitch(currentMode: number | null, editMode: boolean): void {
        if (this.config.modeControlOid && !editMode) {
            const modes = this.getModes();
            const currentIndex = modes.findIndex(m => m.statusValue === currentMode);
            const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % modes.length : 0;
            this.setValue(this.config.modeControlOid, modes[nextIndex].controlValue);
        }
    }

    /**
     * Handle mode select (receives controlValue from UI)
     */
    handleModeSelect(controlValue: number, editMode: boolean): void {
        if (this.config.modeControlOid && !editMode) {
            this.setValue(this.config.modeControlOid, controlValue);
        }
    }

    /**
     * Format temperature value with optional unit
     */
    formatTemperature(value: number | null): string {
        if (value === null || value === undefined) {
            return '--';
        }
        const formatted = value.toFixed(1);
        return this.config.showUnits ? `${formatted}°C` : formatted;
    }

    /**
     * Format valve position with optional unit
     */
    formatValvePosition(value: number | null): string {
        if (value === null || value === undefined) {
            return '--';
        }
        const formatted = Math.round(value);
        return this.config.showUnits ? `${formatted}%` : String(formatted);
    }

    /**
     * Get current mode name from status value
     */
    getCurrentModeName(currentMode: number | null): string {
        const modes = this.getModes();
        const mode = modes.find(m => m.statusValue === currentMode);
        return mode?.label || `Mode ${currentMode ?? 'Unknown'}`;
    }

    /**
     * Check if heating is active
     */
    isActive(setpointValue: number | null, valveValue: number | null): boolean {
        return (valveValue !== null && valveValue > 0) || (setpointValue !== null && setpointValue > 0);
    }
}
