import React from 'react';
import { Box, Typography, Slider, Button, ButtonGroup } from '@mui/material';
import { PowerSettingsNew } from '@mui/icons-material';
import { getOutlinedButtonStyle } from './shared/buttonStyles';

export interface DimmerDialogProps {
    localValue: number;
    minValue: number;
    maxValue: number;
    step: number;
    showQuickButtons: boolean;
    primaryColor: string;
    onChange: (_e: unknown, value: number | number[]) => void;
    onChangeCommitted: (_e: unknown, value: number | number[]) => void;
    onQuickSet: (value: number) => void;
}

export const DimmerDialog: React.FC<DimmerDialogProps> = React.memo(
    ({
        localValue,
        minValue,
        maxValue,
        step,
        showQuickButtons,
        primaryColor,
        onChange,
        onChangeCommitted,
        onQuickSet,
    }) => {
        const range = maxValue - minValue;

        const quickButtons = [
            { label: 'Off', value: minValue, icon: <PowerSettingsNew /> },
            { label: '20%', value: minValue + range * 0.2 },
            { label: '40%', value: minValue + range * 0.4 },
            { label: '60%', value: minValue + range * 0.6 },
            { label: '80%', value: minValue + range * 0.8 },
            { label: '100%', value: maxValue },
        ];

        return (
            <Box sx={{ pt: 2, pb: 2, width: '100%', boxSizing: 'border-box' }}>
                <Typography
                    variant="h4"
                    align="center"
                    sx={{ mb: 3 }}
                >
                    {Math.round(localValue)}%
                </Typography>

                <Box sx={{ px: 1, mb: 3 }}>
                    <Slider
                        value={localValue}
                        onChange={onChange}
                        onChangeCommitted={onChangeCommitted}
                        min={minValue}
                        max={maxValue}
                        step={step}
                        valueLabelDisplay="auto"
                        sx={{
                            color: primaryColor,
                            '& .MuiSlider-thumb': {
                                width: 24,
                                height: 24,
                            },
                        }}
                    />
                </Box>

                {showQuickButtons && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, width: '100%', boxSizing: 'border-box' }}>
                        {quickButtons.map(btn => (
                            <Button
                                key={btn.value}
                                variant="outlined"
                                onClick={() => onQuickSet(btn.value)}
                                size="small"
                                sx={{
                                    ...getOutlinedButtonStyle(primaryColor),
                                    flex: '1 1 calc(33.333% - 4px)',
                                    minWidth: '50px',
                                    px: 1,
                                }}
                            >
                                {btn.icon || btn.label}
                            </Button>
                        ))}
                    </Box>
                )}
            </Box>
        );
    },
);

DimmerDialog.displayName = 'DimmerDialog';
