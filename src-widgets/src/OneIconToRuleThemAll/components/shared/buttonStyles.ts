import type { SxProps, Theme } from '@mui/material';

/**
 * Shared button styles for dialog components
 */

/**
 * Get outlined button style
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
 * Get button group container style
 */
export const getButtonGroupStyle = (minHeight = 48): SxProps<Theme> => ({
    '& .MuiButton-root': {
        minHeight,
    },
});
