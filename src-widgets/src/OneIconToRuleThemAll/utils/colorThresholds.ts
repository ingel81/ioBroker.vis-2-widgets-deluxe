export interface ColorThresholdConfig {
    enabled: boolean;
    thresholdLow: number;
    thresholdHigh: number;
    colorLow: string;
    colorMedium: string;
    colorHigh: string;
}

/**
 * Calculates color based on 3-zone thresholds
 *
 * Logic:
 *   value <= thresholdLow  -> colorLow
 *   value <= thresholdHigh -> colorMedium
 *   value >  thresholdHigh -> colorHigh
 */
export function getColorByThreshold(value: number | null, config: ColorThresholdConfig): string | null {
    // Disabled or no value
    if (!config.enabled || value === null) {
        return null;
    }

    // 3-zone logic
    if (value <= config.thresholdLow) {
        return config.colorLow;
    } else if (value <= config.thresholdHigh) {
        return config.colorMedium;
    }
    return config.colorHigh;
}

/**
 * Validates threshold configuration
 */
export function validateThresholdConfig(config: ColorThresholdConfig): {
    valid: boolean;
    error?: string;
} {
    if (config.thresholdLow >= config.thresholdHigh) {
        return {
            valid: false,
            error: 'Threshold Low must be less than Threshold High',
        };
    }

    // Color validation (HEX format or rgba)
    const colorRegex = /^(#[0-9A-Fa-f]{6}|rgba?\([^)]+\))$/;
    if (
        !colorRegex.test(config.colorLow) ||
        !colorRegex.test(config.colorMedium) ||
        !colorRegex.test(config.colorHigh)
    ) {
        return {
            valid: false,
            error: 'Colors must be in HEX format (#RRGGBB) or rgba()',
        };
    }

    return { valid: true };
}
