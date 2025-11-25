import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { Icon } from '../../components';
import { IconPosition, type TextAlign } from '../types';

export interface HorizontalDisplayProps {
    icon: string;
    iconSize: number;
    iconRotation?: number;
    iconColor: string;
    value: string;
    valueColor?: string;
    valueFontSize?: number;
    iconTextGap?: number;
    iconPosition: IconPosition.LEFT | IconPosition.RIGHT;
    onClick: () => void;
    editMode: boolean;
    textAlign?: TextAlign;
}

export const HorizontalDisplay: React.FC<HorizontalDisplayProps> = React.memo(
    ({
        icon,
        iconSize,
        iconRotation = 0,
        iconColor,
        value,
        valueColor,
        valueFontSize = 14,
        iconTextGap = 8,
        iconPosition,
        onClick,
        editMode,
        textAlign,
    }) => {
        const hasIcon = icon && icon.trim() !== '';
        const isDataUrl = hasIcon && (icon.startsWith('data:') || icon.startsWith('http'));

        const iconElement = hasIcon && isDataUrl && (
            <Icon
                src={icon}
                color={iconColor}
                style={{
                    width: iconSize,
                    height: iconSize,
                    flexShrink: 0,
                    transform: `rotate(${iconRotation}deg)`,
                }}
            />
        );

        const textElement = (
            <Typography
                sx={{
                    color: valueColor,
                    fontSize: `${valueFontSize}px`,
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1,
                    width: '100%',
                    textAlign: textAlign || (iconPosition === IconPosition.LEFT ? 'left' : 'right'),
                }}
            >
                {value}
            </Typography>
        );

        return (
            <Box
                sx={{
                    height: '100%',
                    width: '100%',
                    overflow: 'hidden',
                    padding: 0,
                    margin: 0,
                }}
            >
                <IconButton
                    onClick={onClick}
                    disabled={editMode}
                    sx={{
                        padding: '4px 8px',
                        margin: 0,
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: `${iconTextGap}px`,
                        borderRadius: 0,
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                    }}
                >
                    {iconPosition === IconPosition.LEFT ? (
                        <>
                            {iconElement}
                            {textElement}
                        </>
                    ) : (
                        <>
                            {textElement}
                            {iconElement}
                        </>
                    )}
                </IconButton>
            </Box>
        );
    },
);

HorizontalDisplay.displayName = 'HorizontalDisplay';
