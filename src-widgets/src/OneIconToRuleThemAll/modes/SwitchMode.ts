import type { ParsedValue, SwitchModeState } from '../types';
import type { SocketLike } from '../types/socket';

export interface SwitchModeConfig {
    controlOid: string;
    onValue?: string;
    offValue?: string;
}

export class SwitchModeLogic {
    private config: SwitchModeConfig;
    private socket: SocketLike;
    private setState: (state: Partial<SwitchModeState>) => void;
    private setValue: (oid: string, value: unknown) => void;

    constructor(
        config: SwitchModeConfig,
        socket: SocketLike,
        setState: (state: Partial<SwitchModeState>) => void,
        setValue: (oid: string, value: unknown) => void,
    ) {
        this.config = config;
        this.socket = socket;
        this.setState = setState;
        this.setValue = setValue;
    }

    /**
     * Initialize: Load value from ioBroker
     */
    async initialize(): Promise<void> {
        if (this.config.controlOid) {
            const state = await this.socket.getState(this.config.controlOid);
            if (state?.val !== undefined) {
                const isOn = this.checkIsOn(state.val);
                this.setState({ isOn });
            }
        }
    }

    /**
     * Get OIDs to subscribe to
     */
    getSubscriptionOids(): string[] {
        return this.config.controlOid ? [this.config.controlOid] : [];
    }

    /**
     * Handle state changes from ioBroker
     */
    handleStateChange(value: unknown): void {
        const isOn = this.checkIsOn(value);
        this.setState({ isOn });
    }

    /**
     * Parse string value to boolean, number, or string
     */
    private parseValue(value: string): ParsedValue {
        if (!value) {
            return value;
        }

        // Boolean
        if (value === 'true') {
            return true;
        }
        if (value === 'false') {
            return false;
        }

        // Number
        const numValue = Number(value);
        if (!isNaN(numValue)) {
            return numValue;
        }

        // String (keep as string)
        return value;
    }

    /**
     * Compare values with loose equality for flexibility
     */
    private valuesEqual(a: unknown, b: unknown): boolean {
        return a == b;
    }

    /**
     * Check if switch is ON
     */
    private checkIsOn(value: unknown): boolean {
        const onValue = this.parseValue(this.config.onValue || 'true');
        return this.valuesEqual(value, onValue);
    }

    /**
     * Toggle switch
     */
    toggle(currentIsOn: boolean, editMode: boolean): void {
        const onValue = this.parseValue(this.config.onValue || 'true');
        const offValue = this.parseValue(this.config.offValue || 'false');
        const newValue = currentIsOn ? offValue : onValue;

        if (this.config.controlOid && !editMode) {
            this.setValue(this.config.controlOid, newValue);
        }
    }

    /**
     * Check if switch is active (ON)
     */
    isActive(isOn: boolean): boolean {
        return isOn;
    }
}
