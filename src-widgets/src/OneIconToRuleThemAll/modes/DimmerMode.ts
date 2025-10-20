import type { DimmerModeState } from '../types';
import type { SocketLike } from '../types/socket';

export interface DimmerModeConfig {
    controlOid: string;
    minValue?: number;
    maxValue?: number;
    step?: number;
}

export class DimmerModeLogic {
    private config: DimmerModeConfig;
    private socket: SocketLike;
    private setState: (state: Partial<DimmerModeState>) => void;
    private setValue: (oid: string, value: unknown) => void;
    private changeTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor(
        config: DimmerModeConfig,
        socket: SocketLike,
        setState: (state: Partial<DimmerModeState>) => void,
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
                this.setState({ localValue: Number(state.val) || 0 });
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
    handleStateChange(value: unknown, isChanging: boolean): void {
        if (!isChanging) {
            const numValue = Number(value) || 0;
            this.setState({ localValue: numValue });
        }
    }

    /**
     * Handle dimmer slider change (debounced)
     */
    handleDimmerChange(value: number | number[], editMode: boolean): void {
        const numValue = Array.isArray(value) ? value[0] : value;

        this.setState({ localValue: numValue, isChanging: true });

        if (this.changeTimeout) {
            clearTimeout(this.changeTimeout);
        }

        this.changeTimeout = setTimeout(() => {
            this.finishChanging(numValue, editMode);
        }, 300); // Debounce 300ms
    }

    /**
     * Handle dimmer slider change committed
     */
    handleDimmerChangeCommitted(value: number | number[], editMode: boolean): void {
        const numValue = Array.isArray(value) ? value[0] : value;
        this.finishChanging(numValue, editMode);
    }

    /**
     * Finish changing value (after debounce)
     */
    private finishChanging(value: number, editMode: boolean): void {
        if (this.config.controlOid && !editMode) {
            this.setValue(this.config.controlOid, value);
        }
        this.setState({ isChanging: false });
        this.changeTimeout = null;
    }

    /**
     * Handle quick button click
     */
    handleQuickSet(value: number, editMode: boolean): void {
        this.setState({ localValue: value });
        if (this.config.controlOid && !editMode) {
            this.setValue(this.config.controlOid, value);
        }
    }

    /**
     * Check if dimmer is active (value > 0)
     */
    isActive(localValue: number): boolean {
        return localValue > 0;
    }

    /**
     * Cleanup
     */
    destroy(): void {
        if (this.changeTimeout) {
            clearTimeout(this.changeTimeout);
        }
    }
}
