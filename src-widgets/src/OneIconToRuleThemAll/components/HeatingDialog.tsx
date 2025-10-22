import React from 'react';
import { Box, Typography, Button, FormControl, Select, MenuItem } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import type { HeatingMode } from '../types';

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
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                    <Button
                        variant="outlined"
                        onClick={onDecrease}
                        sx={{
                            minWidth: 60,
                            height: 60,
                            color: primaryColor,
                            borderColor: primaryColor,
                            '&:hover': {
                                borderColor: primaryColor,
                                backgroundColor: `${primaryColor}10`,
                            },
                        }}
                    >
                        <Remove sx={{ fontSize: 32 }} />
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={onIncrease}
                        sx={{
                            minWidth: 60,
                            height: 60,
                            color: primaryColor,
                            borderColor: primaryColor,
                            '&:hover': {
                                borderColor: primaryColor,
                                backgroundColor: `${primaryColor}10`,
                            },
                        }}
                    >
                        <Add sx={{ fontSize: 32 }} />
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
                            variant="outlined"
                            onClick={onModeSwitch}
                            sx={{
                                color: primaryColor,
                                borderColor: primaryColor,
                                '&:hover': {
                                    borderColor: primaryColor,
                                    backgroundColor: `${primaryColor}10`,
                                },
                            }}
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
                                        variant={isActive ? 'contained' : 'outlined'}
                                        onClick={() => onModeSelect(mode.controlValue)}
                                        sx={{
                                            flex: '1 1 calc(50% - 4px)',
                                            minWidth: '80px',
                                            color: isActive ? '#fff !important' : primaryColor,
                                            backgroundColor: isActive ? `${primaryColor} !important` : 'transparent',
                                            borderColor: `${primaryColor} !important`,
                                            borderWidth: isActive ? '2px' : '1px',
                                            fontWeight: isActive ? 'bold' : 'normal',
                                            '&:hover': {
                                                borderColor: `${primaryColor} !important`,
                                                backgroundColor: isActive ? primaryColor : `${primaryColor}10`,
                                            },
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
