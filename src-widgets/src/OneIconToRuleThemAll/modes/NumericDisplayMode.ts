import type { SocketLike } from '../types/socket';
import type { NumericDisplayModeConfig, NumericDisplayModeState } from '../types';
import { formatNumber, toNumber } from '../utils/numberFormatter';
import { getColorByThreshold } from '../utils/colorThresholds';
import { mapValue, parseValueMapping } from '../utils/valueMapper';

/**
 * NumericDisplayMode - Read-only numeric value display
 *
 * Features:
 * - Number formatting (Decimals, Separators, Unit)
 * - 3-zone color thresholds
 * - Value mapping (for numeric enums)
 * - Prefix/Suffix
 */
export class NumericDisplayModeLogic {
    private config: NumericDisplayModeConfig;
    private socket: SocketLike;
    private setState: (state: Partial<NumericDisplayModeState>) => void;

    // setValue is NOT needed for display modes!

    constructor(
        config: NumericDisplayModeConfig,
        socket: SocketLike,
        setState: (state: Partial<NumericDisplayModeState>) => void,
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
                currentColor: this.getDefaultColor(),
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
                    currentColor: this.getDefaultColor(),
                });
            }
        } catch (error) {
            console.error('Failed to initialize NumericDisplayMode:', error);
            this.setState({
                value: null,
                formattedValue: '--',
                currentColor: this.getDefaultColor(),
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
     * Updates value + formatted string + color
     */
    private updateValue(rawValue: unknown): void {
        const numValue = toNumber(rawValue);

        if (numValue === null) {
            this.setState({
                value: null,
                formattedValue: '--',
                currentColor: this.getDefaultColor(),
            });
            return;
        }

        // Value mapping has priority!
        const valueMapping = parseValueMapping(this.config.valueMapping);
        if (valueMapping) {
            const mapped = mapValue(numValue, valueMapping, this.formatNumberValue(numValue));

            // With mapping: color based on thresholds
            const color = this.getColorForValue(numValue);

            this.setState({
                value: numValue,
                formattedValue: this.applyPrefixSuffix(mapped),
                currentColor: color,
            });
            return;
        }

        // Standard formatting
        const formatted = this.formatNumberValue(numValue);
        const color = this.getColorForValue(numValue);

        this.setState({
            value: numValue,
            formattedValue: this.applyPrefixSuffix(formatted),
            currentColor: color,
        });
    }

    /**
     * Formats numeric value (without unit)
     */
    private formatNumberValue(value: number): string {
        return formatNumber(value, {
            decimals: this.config.decimals,
            decimalMode: this.config.decimalMode,
            decimalSeparator: this.config.decimalSeparator,
            thousandSeparator: this.config.thousandSeparator,
            // Unit is added separately after suffix
        });
    }

    /**
     * Adds prefix/suffix and unit
     * Order: Prefix + Value + Suffix + Unit
     */
    private applyPrefixSuffix(value: string): string {
        const prefix = this.config.prefix ?? '';
        const suffix = this.config.suffix ?? '';
        const unit = this.config.unit ?? '';

        let result = `${prefix}${value}${suffix}`;
        if (unit) {
            result += ' ' + unit;
        }
        return result;
    }

    /**
     * Calculates color based on thresholds
     */
    private getColorForValue(value: number | null): string {
        if (!this.config.useColorThresholds || value === null) {
            return this.getDefaultColor();
        }

        const color = getColorByThreshold(value, {
            enabled: true,
            thresholdLow: this.config.thresholdLow ?? 0,
            thresholdHigh: this.config.thresholdHigh ?? 100,
            colorLow: this.config.colorLow ?? '#2196f3',
            colorMedium: this.config.colorMedium ?? '#4caf50',
            colorHigh: this.config.colorHigh ?? '#f44336',
        });

        return color ?? this.getDefaultColor();
    }

    /**
     * Default color (no thresholds)
     */
    private getDefaultColor(): string {
        // Empty string = use widget's default text color
        return '';
    }

    /**
     * Display modes are never "active"
     */
    isActive(_state: NumericDisplayModeState): boolean {
        return false;
    }

    /**
     * Cleanup (noop for display modes)
     */
    destroy(): void {
        // Noop
    }
}
