import type { HeatingMode, HeatingModeState } from '../types';
import type { SocketLike } from '../types/socket';

export interface HeatingModeConfig {
    setpointShiftOid?: string;
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
     * Parse modes from JSON configuration
     */
    getModes(): HeatingMode[] {
        try {
            const parsed = JSON.parse(this.config.modesConfig || '[]');
            if (Array.isArray(parsed)) {
                return parsed;
            }
        } catch (error) {
            console.error('[HeatingMode] Error parsing modes config:', error);
        }
        // Default fallback
        return [
            { label: 'Auto', value: 0 },
            { label: 'Comfort', value: 1 },
            { label: 'Standby', value: 2 },
            { label: 'Night', value: 3 },
            { label: 'Frost', value: 4 },
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
     * Handle setpoint increase button
     */
    handleIncrease(editMode: boolean): void {
        if (this.config.setpointShiftOid && !editMode) {
            this.setValue(this.config.setpointShiftOid, true);
        }
    }

    /**
     * Handle setpoint decrease button
     */
    handleDecrease(editMode: boolean): void {
        if (this.config.setpointShiftOid && !editMode) {
            this.setValue(this.config.setpointShiftOid, false);
        }
    }

    /**
     * Handle mode switch button (cycle through modes)
     */
    handleModeSwitch(currentMode: number | null, editMode: boolean): void {
        if (this.config.modeControlOid && !editMode) {
            const modes = this.getModes();
            const currentIndex = modes.findIndex(m => m.value === currentMode);
            const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % modes.length : 0;
            this.setValue(this.config.modeControlOid, modes[nextIndex].value);
        }
    }

    /**
     * Handle mode select dropdown
     */
    handleModeSelect(value: number, editMode: boolean): void {
        if (this.config.modeControlOid && !editMode) {
            this.setValue(this.config.modeControlOid, value);
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
     * Get current mode name from value
     */
    getCurrentModeName(currentMode: number | null): string {
        const modes = this.getModes();
        const mode = modes.find(m => m.value === currentMode);
        return mode?.label || `Mode ${currentMode ?? 'Unknown'}`;
    }

    /**
     * Check if heating is active
     */
    isActive(setpointValue: number | null, valveValue: number | null): boolean {
        return (valveValue !== null && valveValue > 0) || (setpointValue !== null && setpointValue > 0);
    }
}
