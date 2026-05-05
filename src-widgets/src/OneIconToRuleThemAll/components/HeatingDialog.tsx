import React from 'react';
import { Box, Typography, Button, FormControl, Select, MenuItem } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import type { HeatingMode } from '../types';
import { getFilledButtonStyle, getFilledTonalButtonStyle } from './shared/buttonStyles';

export interface HeatingDialogProps {
    setpointValue: number | null;
    valveValue: number | null;
    currentMode: number | null;
    modes: HeatingMode[];
    controlType: 'button' | 'dropdown' | 'buttons';
    primaryColor: string;
    valveLabel: string;
    operatingModeLabel: string;
    formatTemperature: (value: number | null) => string;
    formatValvePosition: (value: number | null) => string;
    getCurrentModeName: (mode: number | null) => string;
    onIncrease: () => void;
    onDecrease: () => void;
    onModeSwitch: () => void;
    onModeSelect: (value: number) => void;
}

export const HeatingDialog: React.FC<HeatingDialogProps> = React.memo(
    ({
        setpointValue,
        valveValue,
        currentMode,
        modes,
        controlType,
        primaryColor,
        valveLabel,
        operatingModeLabel,
        formatTemperature,
        formatValvePosition,
        getCurrentModeName,
        onIncrease,
        onDecrease,
        onModeSwitch,
        onModeSelect,
    }) => {
        return (
            <Box sx={{ pt: 2, pb: 2 }}>
                {/* Setpoint Temperature */}
                <Typography
                    variant="h3"
                    align="center"
                    sx={{ mb: 1, fontWeight: 'bold' }}
                >
                    {formatTemperature(setpointValue)}
                </Typography>

                {/* Valve Position */}
                <Typography
                    variant="body2"
                    align="center"
                    sx={{ mb: 3, color: 'text.secondary' }}
                >
                    {valveLabel}: {formatValvePosition(valveValue)}
                </Typography>

                {/* Setpoint Control Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                    <Button
                        onClick={onDecrease}
                        sx={{
                            ...getFilledTonalButtonStyle(primaryColor),
                            minWidth: 80,
                        }}
                    >
                        <Remove sx={{ fontSize: 24 }} />
                    </Button>
                    <Button
                        onClick={onIncrease}
                        sx={{
                            ...getFilledTonalButtonStyle(primaryColor),
                            minWidth: 80,
                        }}
                    >
                        <Add sx={{ fontSize: 24 }} />
                    </Button>
                </Box>

                {/* Operating Mode */}
                <Box sx={{ mb: 2 }}>
                    <Typography
                        variant="body2"
                        sx={{ mb: 1, fontWeight: 'bold' }}
                    >
                        {operatingModeLabel}:
                    </Typography>

                    {controlType === 'button' ? (
                        <Button
                            fullWidth
                            onClick={onModeSwitch}
                            sx={getFilledTonalButtonStyle(primaryColor)}
                        >
                            {getCurrentModeName(currentMode)}
                        </Button>
                    ) : controlType === 'dropdown' ? (
                        <FormControl fullWidth>
                            <Select
                                value={
                                    currentMode !== null && modes.some(m => m.statusValue === currentMode)
                                        ? (modes.find(m => m.statusValue === currentMode)?.controlValue ??
                                          modes[0]?.controlValue ??
                                          0)
                                        : (modes[0]?.controlValue ?? 0)
                                }
                                onChange={e => onModeSelect(Number(e.target.value))}
                                sx={{
                                    color: primaryColor,
                                    borderRadius: '12px',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: primaryColor,
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: primaryColor,
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: primaryColor,
                                    },
                                }}
                            >
                                {modes.map(mode => (
                                    <MenuItem
                                        key={mode.statusValue}
                                        value={mode.controlValue}
                                    >
                                        {mode.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    ) : (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {modes.map(mode => {
                                const isActive = currentMode === mode.statusValue;
                                return (
                                    <Button
                                        key={mode.statusValue}
                                        onClick={() => onModeSelect(mode.controlValue)}
                                        sx={{
                                            ...(isActive
                                                ? getFilledButtonStyle(primaryColor)
                                                : getFilledTonalButtonStyle(primaryColor)),
                                            flex: '1 1 calc(50% - 4px)',
                                            minWidth: '80px',
                                        }}
                                    >
                                        {mode.label}
                                    </Button>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            </Box>
        );
    },
);

HeatingDialog.displayName = 'HeatingDialog';
