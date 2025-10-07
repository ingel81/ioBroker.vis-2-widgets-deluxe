import React from 'react';
import type { RxRenderWidgetProps, RxWidgetInfo, VisRxWidgetState, VisRxWidgetProps } from '@iobroker/types-vis-2';
import {
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Slider,
    Box,
    Typography,
    Tooltip,
    ButtonGroup,
} from '@mui/material';
import {
    Lightbulb,
    LightbulbOutlined,
    Close,
    PowerSettingsNew,
} from '@mui/icons-material';

import Generic from './Generic';

interface DimmerWidgetRxData {
    dimmerOid: string;
    widgetTitle: string;
    icon: string;
    iconColor: string;
    activeColor: string;
    inactiveColor: string;
    noCard: boolean;
    iconSize: number;
    sliderColor: string;
    buttonsColor: string;
    showPercentage: boolean;
}

interface DimmerWidgetState extends VisRxWidgetState {
    dialog: boolean;
    localValue: number;
    isChanging: boolean;
}

class DimmerWidget extends Generic<DimmerWidgetRxData, DimmerWidgetState> {
    private changeTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor(props: VisRxWidgetProps) {
        super(props);
        this.state = {
            ...this.state,
            dialog: false,
            localValue: 0,
            isChanging: false,
        };
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplDeluxeDimmerWidget',
            visSet: 'Deluxe widgets',
            visWidgetLabel: 'dimmer_widget',
            visName: 'Dimmer Widget',
            visAttrs: [
                {
                    name: 'common',
                    fields: [
                        {
                            name: 'dimmerOid',
                            label: 'dimmer_state',
                            type: 'id',
                            tooltip: 'dimmer_state_tooltip',
                        },
                        {
                            name: 'widgetTitle',
                            label: 'widget_title',
                            type: 'text',
                            default: 'Dimmer Control',
                        },
                        {
                            name: 'noCard',
                            label: 'without_card',
                            type: 'checkbox',
                            default: false,
                        },
                        {
                            name: 'showPercentage',
                            label: 'show_percentage',
                            type: 'checkbox',
                            default: true,
                        },
                    ],
                },
                {
                    name: 'icon',
                    label: 'icon_settings',
                    fields: [
                        {
                            name: 'icon',
                            label: 'icon',
                            type: 'icon64',
                            default: 'lightbulb',
                        },
                        {
                            name: 'iconSize',
                            label: 'icon_size',
                            type: 'number',
                            default: 48,
                        },
                        {
                            name: 'iconColor',
                            label: 'icon_color',
                            type: 'color',
                            default: '#666666',
                        },
                        {
                            name: 'activeColor',
                            label: 'active_color',
                            type: 'color',
                            default: '#FFC107',
                        },
                        {
                            name: 'inactiveColor',
                            label: 'inactive_color',
                            type: 'color',
                            default: '#CCCCCC',
                        },
                    ],
                },
                {
                    name: 'dialog',
                    label: 'dialog_settings',
                    fields: [
                        {
                            name: 'sliderColor',
                            label: 'slider_color',
                            type: 'color',
                            default: '#2196F3',
                        },
                        {
                            name: 'buttonsColor',
                            label: 'buttons_color',
                            type: 'color',
                            default: '#2196F3',
                        },
                    ],
                },
            ],
            visDefaultStyle: {
                width: 100,
                height: 100,
                position: 'relative',
            },
            visPrev: 'widgets/vis-2-widgets-deluxe/img/prev_dimmer_widget.png',
        };
    }

    getWidgetInfo(): RxWidgetInfo {
        return DimmerWidget.getWidgetInfo();
    }

    componentDidMount(): void {
        super.componentDidMount();
        if (this.state.rxData.dimmerOid) {
            const value = this.getPropertyValue('dimmerOid');
            if (value !== null && value !== undefined) {
                this.setState({ localValue: Number(value) || 0 });
            }
        }
    }

    componentDidUpdate(prevProps: VisRxWidgetProps): void {
        // @ts-ignore - Type mismatch with base class
        super.componentDidUpdate(prevProps);

        if (this.state.rxData.dimmerOid && !this.state.isChanging) {
            const value = this.getPropertyValue('dimmerOid');
            if (value !== null && value !== undefined) {
                const numValue = Number(value) || 0;
                if (numValue !== this.state.localValue) {
                    this.setState({ localValue: numValue });
                }
            }
        }
    }

    onDimmerChange = (value: number): void => {
        this.setState({ localValue: value, isChanging: true });

        if (this.changeTimeout) {
            clearTimeout(this.changeTimeout);
        }

        this.changeTimeout = setTimeout(() => {
            this.finishChanging(value);
        }, 300);
    };

    finishChanging = (value: number): void => {
        if (this.state.rxData.dimmerOid && !this.state.editMode) {
            this.props.context.setValue(this.state.rxData.dimmerOid, value);
        }
        this.setState({ isChanging: false });
        this.changeTimeout = null;
    };

    onQuickSet = (value: number): void => {
        this.setState({ localValue: value });
        if (this.state.rxData.dimmerOid && !this.state.editMode) {
            this.props.context.setValue(this.state.rxData.dimmerOid, value);
        }
    };

    renderIcon(): React.JSX.Element {
        const value = this.state.localValue;
        const isOn = value > 0;
        const iconColor = isOn
            ? this.state.rxData.activeColor || '#FFC107'
            : this.state.rxData.inactiveColor || '#CCCCCC';

        const iconSize = this.state.rxData.iconSize || 48;

        let IconComponent = Lightbulb;

        if (this.state.rxData.icon) {
            if (this.state.rxData.icon === 'lightbulb_outlined') {
                IconComponent = LightbulbOutlined;
            } else if (this.state.rxData.icon === 'power') {
                IconComponent = PowerSettingsNew;
            }
        }

        if (!isOn) {
            IconComponent = LightbulbOutlined;
        }

        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    width: '100%',
                }}
            >
                <IconButton
                    onClick={() => !this.state.editMode && this.setState({ dialog: true })}
                    disabled={this.state.editMode}
                    sx={{
                        padding: 1,
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                    }}
                >
                    <IconComponent
                        sx={{
                            fontSize: iconSize,
                            color: iconColor,
                            filter: isOn ? `brightness(${0.5 + value / 200})` : 'none',
                            transition: 'all 0.3s ease',
                        }}
                    />
                </IconButton>
                {this.state.rxData.showPercentage && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: isOn ? this.state.rxData.activeColor : this.state.rxData.iconColor,
                            fontWeight: isOn ? 'bold' : 'normal',
                        }}
                    >
                        {Math.round(value)}%
                    </Typography>
                )}
            </Box>
        );
    }

    renderDialog(): React.JSX.Element | null {
        if (!this.state.dialog) {
            return null;
        }

        const quickButtons = [
            { label: 'off', value: 0, icon: <PowerSettingsNew /> },
            { label: '20%', value: 20 },
            { label: '40%', value: 40 },
            { label: '60%', value: 60 },
            { label: '80%', value: 80 },
            { label: '100%', value: 100 },
        ];

        return (
            <Dialog
                fullWidth
                maxWidth="xs"
                open={true}
                onClose={() => this.setState({ dialog: false })}
                sx={{
                    '& .MuiDialog-paper': {
                        minWidth: 320,
                        maxWidth: 400,
                    },
                }}
            >
                <DialogTitle>
                    {this.state.rxData.widgetTitle || 'Dimmer Control'}
                    <IconButton
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                        }}
                        onClick={() => this.setState({ dialog: false })}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, pb: 2 }}>
                        <Typography variant="h4" align="center" sx={{ mb: 3 }}>
                            {Math.round(this.state.localValue)}%
                        </Typography>

                        <Box sx={{ px: 2, mb: 3 }}>
                            <Slider
                                value={this.state.localValue}
                                onChange={(e, value) => this.onDimmerChange(value as number)}
                                onChangeCommitted={(e, value) => this.finishChanging(value as number)}
                                min={0}
                                max={100}
                                valueLabelDisplay="auto"
                                sx={{
                                    color: this.state.rxData.sliderColor || '#2196F3',
                                    '& .MuiSlider-thumb': {
                                        width: 24,
                                        height: 24,
                                    },
                                }}
                            />
                        </Box>

                        <ButtonGroup
                            fullWidth
                            variant="outlined"
                            sx={{ mb: 2 }}
                        >
                            {quickButtons.slice(0, 3).map(btn => (
                                <Tooltip key={btn.value} title={Generic.t(btn.label)}>
                                    <Button
                                        onClick={() => this.onQuickSet(btn.value)}
                                        sx={{
                                            color: this.state.rxData.buttonsColor || '#2196F3',
                                            borderColor: this.state.rxData.buttonsColor || '#2196F3',
                                            '&:hover': {
                                                borderColor: this.state.rxData.buttonsColor || '#2196F3',
                                                backgroundColor: `${this.state.rxData.buttonsColor || '#2196F3'}10`,
                                            },
                                        }}
                                    >
                                        {btn.icon || btn.label}
                                    </Button>
                                </Tooltip>
                            ))}
                        </ButtonGroup>

                        <ButtonGroup
                            fullWidth
                            variant="outlined"
                        >
                            {quickButtons.slice(3).map(btn => (
                                <Tooltip key={btn.value} title={Generic.t(btn.label)}>
                                    <Button
                                        onClick={() => this.onQuickSet(btn.value)}
                                        sx={{
                                            color: this.state.rxData.buttonsColor || '#2196F3',
                                            borderColor: this.state.rxData.buttonsColor || '#2196F3',
                                            '&:hover': {
                                                borderColor: this.state.rxData.buttonsColor || '#2196F3',
                                                backgroundColor: `${this.state.rxData.buttonsColor || '#2196F3'}10`,
                                            },
                                        }}
                                    >
                                        {btn.label}
                                    </Button>
                                </Tooltip>
                            ))}
                        </ButtonGroup>
                    </Box>
                </DialogContent>
            </Dialog>
        );
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);

        const content = (
            <>
                {this.renderIcon()}
                {this.renderDialog()}
            </>
        );

        if (this.state.rxData.noCard || props.widget.usedInWidget) {
            return content;
        }

        return (
            <Box
                sx={{
                    backgroundColor: '#ffffff',
                    borderRadius: 1,
                    boxShadow: 1,
                    height: '100%',
                    width: '100%',
                    padding: 1,
                }}
            >
                {content}
            </Box>
        );
    }
}

export default DimmerWidget;