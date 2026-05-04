import React from 'react';
import { Box, Switch, Typography } from '@mui/material';
import { IconPosition } from '../types';

export interface ToggleSwitchDisplayProps {
    isOn: boolean;
    onClick: () => void;
    editMode: boolean;
    size?: 'small' | 'medium';
    trackOnColor: string;
    trackOffColor: string;
    knobOnColor: string;
    knobOffColor: string;
    label?: string;
    labelPosition: IconPosition;
    labelOnColor?: string;
    labelOffColor?: string;
    labelFontSize?: number;
}

/**
 * Toggle switch with label positioned around it.
 *
 * Layout: flex-row or flex-column, switch has flex:0 (fixed size, anchored to
 * a card edge), label has flex:1 + minWidth:0 + ellipsis (fills remaining
 * space, shrinks gracefully). The label's text-align mirrors its position so
 * short labels sit next to the switch rather than at the outer card edge.
 */
export const ToggleSwitchDisplay: React.FC<ToggleSwitchDisplayProps> = React.memo(
    ({
        isOn,
        onClick,
        editMode,
        size = 'medium',
        trackOnColor,
        trackOffColor,
        knobOnColor,
        knobOffColor,
        label,
        labelPosition,
        labelOnColor,
        labelOffColor,
        labelFontSize = 14,
    }) => {
        const labelColor = isOn ? labelOnColor : labelOffColor;

        // Material default proportions: knob protrudes above/below track.
        // We only override colors and add a slightly more prominent shadow.
        const switchElement = (
            <Switch
                checked={isOn}
                disabled={editMode}
                size={size}
                onChange={onClick}
                disableRipple
                sx={{
                    '& .MuiSwitch-track': {
                        backgroundColor: `${trackOffColor} !important`,
                        opacity: '1 !important',
                    },
                    '& .Mui-checked + .MuiSwitch-track': {
                        backgroundColor: `${trackOnColor} !important`,
                        opacity: '1 !important',
                    },
                    '& .MuiSwitch-thumb': {
                        color: knobOffColor,
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                    },
                    '& .Mui-checked .MuiSwitch-thumb': {
                        color: knobOnColor,
                    },
                }}
            />
        );

        const hasLabel = !!label;
        const isHorizontal = labelPosition === IconPosition.LEFT || labelPosition === IconPosition.RIGHT;

        // Label aligns toward the switch — text-align mirrors label position
        // so kurze Texte direkt am Switch kleben statt an der Card-Außenkante.
        const labelTextAlign: React.CSSProperties['textAlign'] =
            labelPosition === IconPosition.LEFT ? 'right' : labelPosition === IconPosition.RIGHT ? 'left' : 'center';

        const labelElement = hasLabel ? (
            <Typography
                sx={{
                    color: labelColor,
                    fontSize: `${labelFontSize}px`,
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    userSelect: 'none',
                    // In horizontal layout the label fills remaining space
                    // and may shrink (minWidth: 0 lets ellipsis kick in).
                    ...(isHorizontal
                        ? { flex: 1, minWidth: 0, textAlign: labelTextAlign }
                        : { maxWidth: '100%', textAlign: 'center' }),
                }}
            >
                {label}
            </Typography>
        ) : null;

        const switchSlot = (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                {switchElement}
            </Box>
        );

        // Element order determines which side gets the switch:
        // - label LEFT  → label first (fills left), switch second (anchored right)
        // - label RIGHT → switch first (anchored left), label second (fills right)
        // - label TOP   → label above, switch below
        // - label BOTTOM→ switch above, label below
        let first: React.ReactNode;
        let second: React.ReactNode;
        switch (labelPosition) {
            case IconPosition.LEFT:
                first = labelElement;
                second = switchSlot;
                break;
            case IconPosition.TOP:
                first = labelElement;
                second = switchSlot;
                break;
            case IconPosition.BOTTOM:
                first = switchSlot;
                second = labelElement;
                break;
            case IconPosition.RIGHT:
            default:
                first = switchSlot;
                second = labelElement;
                break;
        }

        return (
            <Box
                sx={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: isHorizontal ? 'row' : 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: isHorizontal ? '8px' : '4px',
                    padding: '4px 8px',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                }}
            >
                {first}
                {second}
            </Box>
        );
    },
);

ToggleSwitchDisplay.displayName = 'ToggleSwitchDisplay';
