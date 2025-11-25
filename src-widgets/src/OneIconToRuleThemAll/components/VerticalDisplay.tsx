import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { Icon } from '../../components';
import { IconPosition, type TextAlign } from '../types';

export interface VerticalDisplayProps {
    icon: string;
    iconSize: number;
    iconRotation?: number;
    iconColor: string;
    value: string;
    valueColor?: string;
    valueFontSize?: number;
    iconTextGap?: number;
    iconPosition: IconPosition.TOP | IconPosition.BOTTOM;
    onClick: () => void;
    editMode: boolean;
    textAlign?: TextAlign;
}

export const VerticalDisplay: React.FC<VerticalDisplayProps> = React.memo(
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
                    maxWidth: '100%',
                    maxHeight: '100%',
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
                    textAlign: textAlign || 'center',
                    width: '100%',
                }}
            >
                {value}
            </Typography>
        );

        // Icon area and text area each take 50%
        const iconArea = (
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                }}
            >
                {iconElement}
            </Box>
        );

        const textArea = (
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: '0 4px',
                }}
            >
                {textElement}
            </Box>
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
                        padding: 0,
                        margin: 0,
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        justifyContent: 'center',
                        gap: `${iconTextGap}px`,
                        borderRadius: 0,
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                    }}
                >
                    {iconPosition === IconPosition.TOP ? (
                        <>
                            {iconArea}
                            {textArea}
                        </>
                    ) : (
                        <>
                            {textArea}
                            {iconArea}
                        </>
                    )}
                </IconButton>
            </Box>
        );
    },
);

VerticalDisplay.displayName = 'VerticalDisplay';
