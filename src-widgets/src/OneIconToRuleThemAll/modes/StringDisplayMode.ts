import type { SocketLike } from '../types/socket';
import type { StringDisplayModeConfig, StringDisplayModeState } from '../types';
import { mapValue, parseValueMapping } from '../utils/valueMapper';

/**
 * StringDisplayMode - Read-only string display
 *
 * Features:
 * - Max length + Ellipsis
 * - Text transform (uppercase, lowercase, capitalize)
 * - Value mapping
 * - Prefix/Suffix
 */
export class StringDisplayModeLogic {
    private config: StringDisplayModeConfig;
    private socket: SocketLike;
    private setState: (state: Partial<StringDisplayModeState>) => void;

    constructor(
        config: StringDisplayModeConfig,
        socket: SocketLike,
        setState: (state: Partial<StringDisplayModeState>) => void,
        _setValue: (oid: string, value: unknown) => void, // Unused
    ) {
        this.config = config;
        this.socket = socket;
        this.setState = setState;
    }

    /**
     * Initialize: Load OID value
     */
    async initialize(): Promise<void> {
        if (!this.config.valueOid) {
            this.setState({
                value: null,
                formattedValue: '--',
            });
            return;
        }

        try {
            const state = await this.socket.getState(this.config.valueOid);
            if (state?.val !== undefined) {
                this.updateValue(state.val);
            } else {
                this.setState({
                    value: null,
                    formattedValue: '--',
                });
            }
        } catch (error) {
            console.error('Failed to initialize StringDisplayMode:', error);
            this.setState({
                value: null,
                formattedValue: '--',
            });
        }
    }

    /**
     * OIDs for subscriptions
     */
    getSubscriptionOids(): string[] {
        return this.config.valueOid ? [this.config.valueOid] : [];
    }

    /**
     * State change handler
     */
    handleStateChange(_id: string, value: unknown): void {
        this.updateValue(value);
    }

    /**
     * Updates value + formatted string
     */
    private updateValue(rawValue: unknown): void {
        const strValue = this.toString(rawValue);

        if (strValue === null) {
            this.setState({
                value: null,
                formattedValue: '--',
            });
            return;
        }

        // Value mapping has priority!
        const valueMapping = parseValueMapping(this.config.valueMapping);
        if (valueMapping) {
            const mapped = mapValue(strValue, valueMapping, this.formatStringValue(strValue));

            this.setState({
                value: strValue,
                formattedValue: this.applyPrefixSuffix(mapped),
            });
            return;
        }

        // Standard formatting
        const formatted = this.formatStringValue(strValue);

        this.setState({
            value: strValue,
            formattedValue: this.applyPrefixSuffix(formatted),
        });
    }

    /**
     * Converts unknown to string
     */
    private toString(value: unknown): string | null {
        if (value === null || value === undefined) {
            return null;
        }

        // Handle objects specially to avoid [object Object]
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }

        // At this point, value is a primitive (string, number, boolean, etc.)
        return String(value as string | number | boolean | symbol | bigint);
    }

    /**
     * Formats string value
     */
    private formatStringValue(value: string): string {
        let result = value;

        // 1. Text transform
        result = this.applyTextTransform(result);

        // 2. Max length + Ellipsis
        result = this.applyMaxLength(result);

        return result;
    }

    /**
     * Applies text transformation
     */
    private applyTextTransform(value: string): string {
        const transform = this.config.textTransform ?? 'none';

        switch (transform) {
            case 'uppercase':
                return value.toUpperCase();
            case 'lowercase':
                return value.toLowerCase();
            case 'capitalize':
                return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            case 'none':
            default:
                return value;
        }
    }

    /**
     * Applies max length (with ellipsis)
     */
    private applyMaxLength(value: string): string {
        const maxLength = this.config.maxLength ?? 50;
        const ellipsis = this.config.ellipsis ?? true;

        if (value.length <= maxLength) {
            return value;
        }

        if (ellipsis) {
            return `${value.substring(0, maxLength - 3)}...`;
        }
        return value.substring(0, maxLength);
    }

    /**
     * Adds prefix/suffix
     */
    private applyPrefixSuffix(value: string): string {
        const prefix = this.config.prefix ?? '';
        const suffix = this.config.suffix ?? '';
        return `${prefix}${value}${suffix}`;
    }

    /**
     * Display modes are never "active"
     */
    isActive(_state: StringDisplayModeState): boolean {
        return false;
    }

    /**
     * Cleanup (noop for display modes)
     */
    destroy(): void {
        // Noop
    }
}
