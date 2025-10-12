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
import { Lightbulb, Close, PowerSettingsNew } from '@mui/icons-material';
import { Icon } from '@iobroker/adapter-react-v5';

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
    oidName: string | null;
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
            oidName: null,
        };
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplDeluxeDimmerWidget',
            visSet: 'vis-2-widgets-deluxe',
            visSetLabel: 'set_label',
            visWidgetLabel: 'dimmer_widget',
            visName: 'Dimmer Widget',
            visAttrs: [
                {
                    name: 'common',
                    label: 'deluxe_common',
                    fields: [
                        {
                            name: 'dimmerOid',
                            label: 'dimmer_state',
                            type: 'id',
                            tooltip: 'dimmer_state_tooltip',
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
                    label: 'deluxe_icon_settings',
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
                    label: 'deluxe_dialog_settings',
                    fields: [
                        {
                            name: 'widgetTitle',
                            label: 'widget_title',
                            type: 'text',
                            default: '',
                        },
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

    async fetchOidName(): Promise<void> {
        if (this.state.rxData.dimmerOid) {
            try {
                const obj = await this.props.context.socket.getObject(this.state.rxData.dimmerOid);
                if (obj?.common?.name) {
                    const name =
                        typeof obj.common.name === 'object'
                            ? obj.common.name[this.props.context.lang] ||
                              obj.common.name.en ||
                              Object.values(obj.common.name)[0]
                            : obj.common.name;
                    this.setState({ oidName: name });
                }
            } catch (error) {
                console.error('Error fetching OID name:', error);
            }
        }
    }

    componentDidMount(): void {
        super.componentDidMount();
        if (this.state.rxData.dimmerOid) {
            const value = this.getPropertyValue('dimmerOid');
            if (value !== null && value !== undefined) {
                this.setState({ localValue: Number(value) || 0 });
            }
            void this.fetchOidName();
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
        const iconSize = this.state.rxData.iconSize || 48;
        const icon = this.state.rxData.icon || 'lightbulb';

        // Determine icon color based on state
        const iconColor = isOn
            ? this.state.rxData.activeColor || '#FFA726'
            : this.state.rxData.inactiveColor || '#757575';

        // Check if icon is a data URL (SVG/Base64) or icon name
        const isDataUrl = icon.startsWith('data:') || icon.startsWith('http');

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
                    onClick={() => !this.state.editMode && this.setState({ dialog: true })}
                    disabled={this.state.editMode}
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
                    {isDataUrl ? (
                        <Icon
                            src={icon}
                            style={{
                                width: iconSize,
                                height: iconSize,
                                maxWidth: '100%',
                                maxHeight: '100%',
                                color: iconColor,
                            }}
                        />
                    ) : (
                        <Lightbulb
                            sx={{
                                fontSize: iconSize,
                                maxWidth: '100%',
                                maxHeight: '100%',
                                color: iconColor,
                            }}
                        />
                    )}
                </IconButton>
                {this.state.rxData.showPercentage && (
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
                    {this.state.rxData.widgetTitle ||
                        (this.state.oidName ? `Dimmer Control - ${this.state.oidName}` : 'Dimmer Control')}
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
                        <Typography
                            variant="h4"
                            align="center"
                            sx={{ mb: 3 }}
                        >
                            {Math.round(this.state.localValue)}%
                        </Typography>

                        <Box sx={{ px: 2, mb: 3 }}>
                            <Slider
                                value={this.state.localValue}
                                onChange={(_e, value) => this.onDimmerChange(value as number)}
                                onChangeCommitted={(_e, value) => this.finishChanging(value as number)}
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
                                <Tooltip
                                    key={btn.value}
                                    title={Generic.t(btn.label)}
                                >
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
                                <Tooltip
                                    key={btn.value}
                                    title={Generic.t(btn.label)}
                                >
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
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    padding: 0,
                    margin: 0,
                }}
            >
                {content}
            </Box>
        );
    }
}

export default DimmerWidget;
