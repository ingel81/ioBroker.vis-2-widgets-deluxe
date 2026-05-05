import type { SxProps, Theme } from '@mui/material';

/**
 * Shared button styles for dialog components.
 *
 * Visual language: Material 3 Filled / Filled-Tonal — no borders, only color
 * containers. Layout tokens (height, radius, padding) are shared so all dialog
 * buttons look identical regardless of role.
 */

const RADIUS = 12;
const MIN_HEIGHT = 48;
const PADDING = '8px 16px';
const FONT_WEIGHT = 500;

/**
 * Apply an alpha channel to a color string. Supports:
 * - 6-digit hex ('#FFC107')      -> '#FFC1071F'
 * - 3-digit hex ('#F7A')          -> '#FF77AA1F'
 * - rgb() / rgba()                -> rgba(r, g, b, alpha)  (replaces existing alpha)
 * - everything else               -> color-mix() fallback in transparent so the
 *                                    requested alpha still applies even for hsl/named colors
 */
export const withAlpha = (color: string, alpha: number): string => {
    const a = Math.max(0, Math.min(1, alpha));

    if (/^#[0-9a-fA-F]{6}$/.test(color)) {
        const hex = Math.round(a * 255)
            .toString(16)
            .padStart(2, '0');
        return `${color}${hex}`;
    }
    if (/^#[0-9a-fA-F]{3}$/.test(color)) {
        const r = color[1];
        const g = color[2];
        const b = color[3];
        const hex = Math.round(a * 255)
            .toString(16)
            .padStart(2, '0');
        return `#${r}${r}${g}${g}${b}${b}${hex}`;
    }
    const rgbMatch = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (rgbMatch) {
        return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${a})`;
    }
    // Fallback for hsl(), named colors, etc.: use color-mix to apply the alpha
    return `color-mix(in srgb, ${color} ${Math.round(a * 100)}%, transparent)`;
};

/**
 * Compute readable text color (black/white) for a given background using the
 * W3C relative luminance formula. Supports hex (3/6 digit) and rgb()/rgba();
 * for hsl() and named colors we default to white (safe on most accent colors).
 */
export const getContrastText = (bgColor: string): string => {
    let r = 0;
    let g = 0;
    let b = 0;
    if (/^#[0-9a-fA-F]{6}$/.test(bgColor)) {
        r = parseInt(bgColor.slice(1, 3), 16);
        g = parseInt(bgColor.slice(3, 5), 16);
        b = parseInt(bgColor.slice(5, 7), 16);
    } else if (/^#[0-9a-fA-F]{3}$/.test(bgColor)) {
        r = parseInt(bgColor[1] + bgColor[1], 16);
        g = parseInt(bgColor[2] + bgColor[2], 16);
        b = parseInt(bgColor[3] + bgColor[3], 16);
    } else {
        const rgbMatch = bgColor.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
        if (rgbMatch) {
            r = parseInt(rgbMatch[1], 10);
            g = parseInt(rgbMatch[2], 10);
            b = parseInt(rgbMatch[3], 10);
        } else {
            return '#ffffff';
        }
    }
    const linear = (c: number): number => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    const luminance = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
    return luminance > 0.5 ? '#000000' : '#ffffff';
};

/**
 * Get outlined button style (legacy — kept for backwards compatibility, not
 * used by the modern dialogs anymore).
 */
export const getOutlinedButtonStyle = (color: string): SxProps<Theme> => ({
    color,
    borderColor: color,
    '&:hover': {
        borderColor: color,
        backgroundColor: `${color}10`,
    },
});

/**
 * Get button group container style (legacy — kept for backwards compatibility).
 */
export const getButtonGroupStyle = (minHeight = 48): SxProps<Theme> => ({
    '& .MuiButton-root': {
        minHeight,
    },
});

/**
 * Material 3 Filled-Tonal button — used as the default for inactive actions
 * (quick buttons, ±, AUF/STOP/ZU, inactive modes). No border, soft tinted
 * background derived from the primary color.
 */
export const getFilledTonalButtonStyle = (primaryColor: string): SxProps<Theme> => ({
    backgroundColor: withAlpha(primaryColor, 0.12),
    color: primaryColor,
    border: 'none',
    borderRadius: `${RADIUS}px`,
    minHeight: MIN_HEIGHT,
    padding: PADDING,
    textTransform: 'none',
    fontWeight: FONT_WEIGHT,
    boxShadow: 'none',
    '&:hover': {
        backgroundColor: withAlpha(primaryColor, 0.16),
        border: 'none',
        boxShadow: 'none',
    },
    '&:active': {
        backgroundColor: withAlpha(primaryColor, 0.2),
    },
    '&.Mui-disabled': {
        backgroundColor: withAlpha(primaryColor, 0.08),
        color: withAlpha(primaryColor, 0.38),
    },
});

/**
 * Material 3 Filled button — used for active states / primary CTAs (e.g. the
 * currently active heating mode). Solid primary background, contrast-computed
 * text color for readability.
 */
export const getFilledButtonStyle = (primaryColor: string): SxProps<Theme> => {
    const textColor = getContrastText(primaryColor);
    return {
        backgroundColor: primaryColor,
        color: textColor,
        border: 'none',
        borderRadius: `${RADIUS}px`,
        minHeight: MIN_HEIGHT,
        padding: PADDING,
        textTransform: 'none',
        fontWeight: FONT_WEIGHT,
        boxShadow: 'none',
        '&:hover': {
            // Slight darken via overlay — keeps the configured primary color
            backgroundColor: primaryColor,
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.08), rgba(0,0,0,0.08))',
            border: 'none',
            boxShadow: 'none',
        },
        '&:active': {
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.16), rgba(0,0,0,0.16))',
        },
    };
};
