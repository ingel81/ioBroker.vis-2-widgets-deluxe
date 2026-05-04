import type { NavigationModeState } from '../types';
import type { SocketLike } from '../types/socket';

export interface NavigationModeConfig {
    targetView?: string;
}

export class NavigationModeLogic {
    private config: NavigationModeConfig;
    private setState: (state: Partial<NavigationModeState>) => void;

    constructor(
        config: NavigationModeConfig,
        _socket: SocketLike,
        setState: (state: Partial<NavigationModeState>) => void,
        _setValue: (oid: string, value: unknown) => void,
    ) {
        this.config = config;
        this.setState = setState;
    }

    async initialize(): Promise<void> {
        // No OID subscriptions needed for navigation
    }

    getSubscriptionOids(): string[] {
        return [];
    }

    handleStateChange(): void {
        // No-op
    }

    isActive(state: NavigationModeState): boolean {
        return state.isOnTargetView;
    }

    /**
     * Recalculate isOnTargetView. Called when context.activeView or
     * the configured target view changes.
     */
    updateActiveView(activeView: string | undefined): void {
        const isOnTarget = Boolean(this.config.targetView && activeView === this.config.targetView);
        this.setState({ isOnTargetView: isOnTarget });
    }

    destroy(): void {
        // No-op
    }
}
