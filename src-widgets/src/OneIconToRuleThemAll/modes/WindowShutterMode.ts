import type { WindowShutterModeState } from '../types';
import type { SocketLike } from '../types/socket';

export interface WindowShutterModeConfig {
    // Rolladen
    shutterPositionOid?: string;
    shutterUpOid?: string;
    shutterDownOid?: string;
    shutterStopOid?: string;
    shutterInvert?: boolean;
    shutterMin?: number;
    shutterMax?: number;

    // Fenster-Flügel
    windowPaneCount?: number;
    paneConfigs: Array<{
        openOid?: string;
        tiltOid?: string;
        sensorMode: 'twoOids' | 'oneOid' | 'oneOidWithTilt';
        hingeType: 'left' | 'right' | 'top';
        ratio: number;
    }>;
}

export class WindowShutterModeLogic {
    private config: WindowShutterModeConfig;
    private socket: SocketLike;
    private setState: (state: Partial<WindowShutterModeState>) => void;
    private setValue: (oid: string, value: unknown) => void;

    // Cache für OID-Values (Performance-Optimierung)
    private valueCache: Map<string, unknown> = new Map();

    constructor(
        config: WindowShutterModeConfig,
        socket: SocketLike,
        setState: (state: Partial<WindowShutterModeState>) => void,
        setValue: (oid: string, value: unknown) => void,
    ) {
        this.config = config;
        this.socket = socket;
        this.setState = setState;
        this.setValue = setValue;
    }

    /**
     * Initialize: Load initial values from ioBroker
     */
    async initialize(): Promise<void> {
        const updates: Partial<WindowShutterModeState> = {};

        // Rolladen-Position laden
        if (this.config.shutterPositionOid) {
            const state = await this.socket.getState(this.config.shutterPositionOid);
            if (state?.val !== undefined) {
                updates.shutterPosition = this.normalizeShutterPosition(Number(state.val));
                this.valueCache.set(this.config.shutterPositionOid, state.val);
            }
        }

        // Alle Flügel-Stati laden
        for (const paneConfig of this.config.paneConfigs) {
            if (paneConfig.openOid) {
                const state = await this.socket.getState(paneConfig.openOid);
                if (state?.val !== undefined) {
                    this.valueCache.set(paneConfig.openOid, state.val);
                }
            }
            if (paneConfig.tiltOid) {
                const state = await this.socket.getState(paneConfig.tiltOid);
                if (state?.val !== undefined) {
                    this.valueCache.set(paneConfig.tiltOid, state.val);
                }
            }
        }

        // Pane-States IMMER berechnen (auch ohne OIDs im Edit-Modus)
        updates.paneStates = this.getPaneStates();
        updates.hasOpenPanes = updates.paneStates.some(p => p.state === 'open');
        updates.hasTiltedPanes = updates.paneStates.some(p => p.state === 'tilt');

        // Always update state (paneStates should always be set)
        this.setState(updates);
    }

    /**
     * Get OIDs to subscribe to
     */
    getSubscriptionOids(): string[] {
        const oids: string[] = [];

        if (this.config.shutterPositionOid) {
            oids.push(this.config.shutterPositionOid);
        }

        for (const paneConfig of this.config.paneConfigs) {
            if (paneConfig.openOid) {
                oids.push(paneConfig.openOid);
            }
            if (paneConfig.tiltOid) {
                oids.push(paneConfig.tiltOid);
            }
        }

        return oids;
    }

    /**
     * Handle state changes from ioBroker
     */
    handleStateChange(id: string, value: unknown): void {
        // Cache updaten
        this.valueCache.set(id, value);

        if (id === this.config.shutterPositionOid) {
            const position = this.normalizeShutterPosition(Number(value));
            this.setState({ shutterPosition: position });
        } else {
            // Ein Fenster-Sensor hat sich geändert
            // → Alle Pane-States neu berechnen
            const paneStates = this.getPaneStates();
            const hasOpenPanes = paneStates.some(p => p.state === 'open');
            const hasTiltedPanes = paneStates.some(p => p.state === 'tilt');

            this.setState({ paneStates, hasOpenPanes, hasTiltedPanes });
        }
    }

    /**
     * Normalize shutter position to 0-100 range
     */
    private normalizeShutterPosition(value: number): number {
        const min = this.config.shutterMin ?? 0;
        const max = this.config.shutterMax ?? 100;

        // Auf 0-100 normalisieren
        let normalized = ((value - min) / (max - min)) * 100;

        // DEFAULT: 0 = Rolladen OBEN (nicht sichtbar), 100 = Rolladen UNTEN (voll sichtbar)
        // Unsere Visualisierung: 0 = nicht sichtbar (oben), 100 = voll sichtbar (unten)
        // → Passt 1:1, keine Invertierung nötig

        // Invertieren nur wenn shutterInvert aktiviert ist (für Hardware die 0=unten, 100=oben liefert)
        if (this.config.shutterInvert) {
            normalized = 100 - normalized;
        }

        return Math.max(0, Math.min(100, normalized));
    }

    /**
     * Get current state of all panes
     */
    private getPaneStates(): WindowShutterModeState['paneStates'] {
        const result = this.config.paneConfigs.map(paneConfig => {
            const state = this.getPaneState(paneConfig);
            console.log('[WindowShutterMode.getPaneStates] paneConfig:', paneConfig, '→ ratio:', paneConfig.ratio);
            return {
                state,
                ratio: paneConfig.ratio,
                hinge: paneConfig.hingeType,
            };
        });
        console.log('[WindowShutterMode.getPaneStates] Final paneStates:', result);
        return result;
    }

    /**
     * Determine state of a single pane
     */
    private getPaneState(paneConfig: WindowShutterModeConfig['paneConfigs'][0]): 'closed' | 'open' | 'tilt' {
        if (paneConfig.sensorMode === 'twoOids') {
            // 2 separate OIDs (open + tilt)
            const openValue = paneConfig.openOid ? this.valueCache.get(paneConfig.openOid) : false;
            const tiltValue = paneConfig.tiltOid ? this.valueCache.get(paneConfig.tiltOid) : false;

            // Priorität: open > tilt > closed
            if (this.toBool(openValue)) {
                return 'open';
            }
            if (this.toBool(tiltValue)) {
                return 'tilt';
            }
            return 'closed';
        } else if (paneConfig.sensorMode === 'oneOidWithTilt') {
            // 1 OID numerisch: 0=closed, 1=tilted, 2=open
            const value = paneConfig.openOid ? this.valueCache.get(paneConfig.openOid) : 0;
            const numValue = Number(value);

            if (numValue >= 2) {
                return 'open';
            }
            if (numValue >= 1) {
                return 'tilt';
            }
            return 'closed';
        }
        // 1 OID binär: 0=closed, 1=open
        const value = paneConfig.openOid ? this.valueCache.get(paneConfig.openOid) : false;
        return this.toBool(value) ? 'open' : 'closed';
    }

    /**
     * Convert any value to boolean
     */
    private toBool(value: unknown): boolean {
        if (typeof value === 'boolean') {
            return value;
        }
        if (typeof value === 'number') {
            return value > 0;
        }
        if (typeof value === 'string') {
            return value === 'true' || value === '1';
        }
        return false;
    }

    // === PUBLIC API ===

    /**
     * Check if widget is active (any pane open/tilted)
     */
    isActive(state: WindowShutterModeState): boolean {
        return state.hasOpenPanes || state.hasTiltedPanes;
    }

    /**
     * Set shutter position (0-100)
     */
    setShutterPosition(position: number): void {
        if (!this.config.shutterPositionOid) {
            console.warn('[WindowShutterMode] No shutterPositionOid configured');
            return;
        }

        let value = Math.max(0, Math.min(100, position));

        // Invertieren falls nötig
        if (this.config.shutterInvert) {
            value = 100 - value;
        }

        // Auf min/max skalieren
        const min = this.config.shutterMin ?? 0;
        const max = this.config.shutterMax ?? 100;
        value = (value / 100) * (max - min) + min;

        this.setValue(this.config.shutterPositionOid, value);
    }

    /**
     * Shutter up (open)
     */
    shutterUp(): void {
        if (this.config.shutterUpOid) {
            this.setValue(this.config.shutterUpOid, true);
        } else if (this.config.shutterPositionOid) {
            // Fallback: Position auf 100% setzen
            this.setShutterPosition(100);
        }
    }

    /**
     * Shutter down (close)
     */
    shutterDown(): void {
        if (this.config.shutterDownOid) {
            this.setValue(this.config.shutterDownOid, true);
        } else if (this.config.shutterPositionOid) {
            // Fallback: Position auf 0% setzen
            this.setShutterPosition(0);
        }
    }

    /**
     * Stop shutter movement
     */
    shutterStop(): void {
        if (this.config.shutterStopOid) {
            this.setValue(this.config.shutterStopOid, true);
        }
    }

    /**
     * Format shutter position for display
     */
    formatShutterPosition(position: number | null): string {
        if (position === null || position === undefined) {
            return '--';
        }
        return `${Math.round(position)}%`;
    }

    /**
     * Cleanup (called on widget unmount)
     */
    destroy(): void {
        this.valueCache.clear();
        // Note: Unsubscribe wird vom Parent-Widget gehandhabt
    }
}
