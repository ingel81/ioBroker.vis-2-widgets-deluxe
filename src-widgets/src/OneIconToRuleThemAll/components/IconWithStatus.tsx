import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { Icon } from '../../components';

export interface IconWithStatusProps {
    icon: string;
    iconInactive?: string;
    useDifferentInactiveIcon?: boolean;
    iconSize: number;
    activeColor: string;
    inactiveColor: string;
    isActive: boolean;
    onClick: () => void;
    editMode: boolean;

    // Status overlays
    topText?: string;
    bottomText?: string;
    statusFontSize?: number;
}

export const IconWithStatus: React.FC<IconWithStatusProps> = React.memo(
    ({
        icon,
        iconInactive,
        useDifferentInactiveIcon,
        iconSize,
        activeColor,
        inactiveColor,
        isActive,
        onClick,
        editMode,
        topText,
        bottomText,
        statusFontSize = 12,
    }) => {
        // Choose icon based on state
        const displayIcon = !isActive && useDifferentInactiveIcon && iconInactive ? iconInactive : icon;

        // Determine icon color
        const iconColor = isActive ? activeColor : inactiveColor;

        // Check if icon is valid
        const hasIcon = displayIcon && displayIcon.trim() !== '';
        const isDataUrl = hasIcon && (displayIcon.startsWith('data:') || displayIcon.startsWith('http'));

        return (
            <Box
                sx={{
                    position: 'relative',
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
                        alignItems: 'center',
                        justifyContent: 'center',
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                    }}
                >
                    {hasIcon && isDataUrl && (
                        <Icon
                            src={displayIcon}
                            color={iconColor}
                            style={{
                                width: iconSize,
                                height: iconSize,
                                maxWidth: '100%',
                                maxHeight: '100%',
                            }}
                        />
                    )}
                </IconButton>

                {/* Top Status Text (e.g., Heating Setpoint) */}
                {topText && (
                    <Typography
                        variant="caption"
                        sx={{
                            position: 'absolute',
                            top: 2,
                            left: 0,
                            right: 0,
                            textAlign: 'center',
                            color: iconColor,
                            pointerEvents: 'none',
                            fontSize: `${statusFontSize}px`,
                            fontWeight: 'bold',
                        }}
                    >
                        {topText}
                    </Typography>
                )}

                {/* Bottom Status Text (e.g., Percentage, Valve Position, ON/OFF) */}
                {bottomText && (
                    <Typography
                        variant="caption"
                        sx={{
                            position: 'absolute',
                            bottom: 2,
                            left: 0,
                            right: 0,
                            textAlign: 'center',
                            color: iconColor,
                            pointerEvents: 'none',
                            fontSize: `${statusFontSize}px`,
                        }}
                    >
                        {bottomText}
                    </Typography>
                )}
            </Box>
        );
    },
);

IconWithStatus.displayName = 'IconWithStatus';
