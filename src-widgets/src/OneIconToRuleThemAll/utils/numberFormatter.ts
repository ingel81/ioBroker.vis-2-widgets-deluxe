import { DecimalMode, DecimalSeparator, ThousandSeparator } from '../types';

export interface NumberFormatOptions {
    decimals?: number;
    decimalMode?: DecimalMode;
    decimalSeparator?: DecimalSeparator;
    thousandSeparator?: ThousandSeparator;
    unit?: string;
}

/**
 * Formats a number with configurable options
 */
export function formatNumber(value: number | null | undefined, options: NumberFormatOptions = {}): string {
    const decimals = options.decimals ?? 0;
    const decimalMode = options.decimalMode ?? DecimalMode.ROUND;
    const decimalSeparator = options.decimalSeparator ?? DecimalSeparator.DOT;
    const thousandSeparator = options.thousandSeparator ?? ThousandSeparator.NONE;
    const unit = options.unit ?? '';

    // Null/Undefined/NaN handling
    if (value === null || value === undefined || isNaN(value)) {
        return '--';
    }

    // 1. Apply decimal mode
    let processedValue: number;
    const factor = Math.pow(10, decimals);

    switch (decimalMode) {
        case DecimalMode.ROUND:
            processedValue = Math.round(value * factor) / factor;
            break;
        case DecimalMode.FLOOR:
            processedValue = Math.floor(value * factor) / factor;
            break;
        case DecimalMode.CEIL:
            processedValue = Math.ceil(value * factor) / factor;
            break;
        case DecimalMode.TRUNC:
            processedValue = Math.trunc(value * factor) / factor;
            break;
        default:
            processedValue = Math.round(value * factor) / factor;
    }

    // 2. Convert to fixed string
    const fixedString = processedValue.toFixed(decimals);

    // 3. Split into integer and decimal parts
    const [integerPart, decimalPart] = fixedString.split('.');

    // 4. Insert thousand separators
    let formattedInteger = integerPart;
    if (thousandSeparator !== ThousandSeparator.NONE) {
        const separator = thousandSeparator === ThousandSeparator.SPACE ? ' ' : thousandSeparator;
        // Regex: Insert separator every 3 digits (from right)
        formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    }

    // 5. Apply decimal separator
    let result = formattedInteger;
    if (decimals > 0 && decimalPart) {
        result += decimalSeparator + decimalPart;
    }

    // 6. Append unit (with space)
    if (unit) {
        result += ` ${unit}`;
    }

    return result;
}

/**
 * Tests if a value is a valid number
 */
export function isValidNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Converts unknown to number (safely)
 */
export function toNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === 'number') {
        return isValidNumber(value) ? value : null;
    }

    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isValidNumber(parsed) ? parsed : null;
    }

    return null;
}
