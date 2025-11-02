import React from 'react';
import { Box, Typography, Slider, Button, ButtonGroup, Divider, Chip } from '@mui/material';
import { ArrowUpward, ArrowDownward, Stop } from '@mui/icons-material';
import { getOutlinedButtonStyle, getButtonGroupStyle } from './shared/buttonStyles';

export interface WindowShutterDialogProps {
    panes: Array<{
        state: 'closed' | 'open' | 'tilt';
        ratio: number;
        hinge: string;
    }>;
    shutterPosition: number;
    shutterInvert: boolean;

    // Farben
    primaryColor: string;
    paneClosedColor: string;
    paneOpenColor: string;
    paneTiltColor: string;

    // Callbacks
    onShutterChange: (value: number) => void;
    onShutterUp?: () => void;
    onShutterDown?: () => void;
    onShutterStop?: () => void;

    // Translations
    windowStatusLabel?: string;
    shutterLabel?: string;
    upLabel?: string;
    downLabel?: string;
    stopLabel?: string;
    closedLabel?: string;
    tiltedLabel?: string;
    openLabel?: string;
}

export const WindowShutterDialog: React.FC<WindowShutterDialogProps> = React.memo(
    ({
        panes,
        shutterPosition,
        shutterInvert,
        primaryColor,
        paneClosedColor,
        paneOpenColor,
        paneTiltColor,
        onShutterChange,
        onShutterUp,
        onShutterDown,
        onShutterStop,
        windowStatusLabel = 'Window Status',
        shutterLabel = 'Shutter',
        upLabel = 'Up',
        downLabel = 'Down',
        stopLabel = 'Stop',
        closedLabel = 'Closed',
        tiltedLabel = 'Tilted',
        openLabel = 'Open',
    }) => {
        const [sliderValue, setSliderValue] = React.useState(shutterPosition);

        React.useEffect(() => {
            setSliderValue(shutterPosition);
        }, [shutterPosition]);

        const handleSliderChange = (_e: Event, value: number | number[]): void => {
            setSliderValue(value as number);
        };

        const handleSliderChangeCommitted = (_e: Event | React.SyntheticEvent, value: number | number[]): void => {
            onShutterChange(value as number);
        };

        // Count pane states
        const closedCount = panes.filter(p => p.state === 'closed').length;
        const tiltedCount = panes.filter(p => p.state === 'tilt').length;
        const openCount = panes.filter(p => p.state === 'open').length;

        // Render mini status icons
        const renderStatusChips = (): JSX.Element[] => {
            const chips = [];

            if (closedCount > 0) {
                chips.push(
                    <Chip
                        key="closed"
                        label={`${closedCount}× ${closedLabel}`}
                        size="small"
                        sx={{
                            backgroundColor: `${paneClosedColor}30`,
                            color: paneClosedColor,
                            fontWeight: 'bold',
                        }}
                    />,
                );
            }

            if (tiltedCount > 0) {
                chips.push(
                    <Chip
                        key="tilted"
                        label={`${tiltedCount}× ${tiltedLabel}`}
                        size="small"
                        sx={{
                            backgroundColor: `${paneTiltColor}30`,
                            color: paneTiltColor,
                            fontWeight: 'bold',
                        }}
                    />,
                );
            }

            if (openCount > 0) {
                chips.push(
                    <Chip
                        key="open"
                        label={`${openCount}× ${openLabel}`}
                        size="small"
                        sx={{
                            backgroundColor: `${paneOpenColor}30`,
                            color: paneOpenColor,
                            fontWeight: 'bold',
                        }}
                    />,
                );
            }

            return chips;
        };

        // Display value (consider invert)
        const displayValue = shutterInvert ? 100 - shutterPosition : shutterPosition;

        return (
            <Box sx={{ pt: 2, pb: 2 }}>
                {/* Window Status Section */}
                <Box sx={{ mb: 3 }}>
                    <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, color: 'text.secondary' }}
                    >
                        {windowStatusLabel}:
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1,
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                        }}
                    >
                        {renderStatusChips()}
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Shutter Control Section */}
                <Box>
                    <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, color: 'text.secondary' }}
                    >
                        {shutterLabel}:
                    </Typography>

                    <Typography
                        variant="h4"
                        align="center"
                        sx={{ mb: 2 }}
                    >
                        {Math.round(displayValue)}%
                    </Typography>

                    {/* Vertical-style Slider (visually horizontal but represents vertical movement) */}
                    <Box sx={{ px: 3, mb: 3 }}>
                        <Slider
                            value={sliderValue}
                            onChange={handleSliderChange}
                            onChangeCommitted={handleSliderChangeCommitted}
                            min={0}
                            max={100}
                            step={1}
                            valueLabelDisplay="auto"
                            sx={{
                                color: primaryColor,
                                '& .MuiSlider-thumb': {
                                    width: 24,
                                    height: 24,
                                },
                                '& .MuiSlider-track': {
                                    height: 6,
                                },
                                '& .MuiSlider-rail': {
                                    height: 6,
                                },
                            }}
                        />
                    </Box>

                    {/* Control Buttons */}
                    <ButtonGroup
                        fullWidth
                        variant="outlined"
                        sx={getButtonGroupStyle(48)}
                    >
                        {onShutterUp && (
                            <Button
                                onClick={onShutterUp}
                                startIcon={<ArrowUpward />}
                                sx={getOutlinedButtonStyle(primaryColor)}
                            >
                                {upLabel}
                            </Button>
                        )}

                        {onShutterStop && (
                            <Button
                                onClick={onShutterStop}
                                startIcon={<Stop />}
                                sx={getOutlinedButtonStyle(primaryColor)}
                            >
                                {stopLabel}
                            </Button>
                        )}

                        {onShutterDown && (
                            <Button
                                onClick={onShutterDown}
                                startIcon={<ArrowDownward />}
                                sx={getOutlinedButtonStyle(primaryColor)}
                            >
                                {downLabel}
                            </Button>
                        )}
                    </ButtonGroup>
                </Box>
            </Box>
        );
    },
);

WindowShutterDialog.displayName = 'WindowShutterDialog';
