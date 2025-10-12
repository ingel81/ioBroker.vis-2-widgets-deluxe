import React from 'react';
import type { RxRenderWidgetProps, RxWidgetInfo, VisRxWidgetState, VisRxWidgetProps } from '@iobroker/types-vis-2';
import { Button, Card, CardContent, Typography, Box, TextField, IconButton, Divider, Paper, Chip } from '@mui/material';
import {
    Add as AddIcon,
    Remove as RemoveIcon,
    Refresh as RefreshIcon,
    BugReport as BugReportIcon,
} from '@mui/icons-material';

import Generic from './Generic';

// Define the data structure for widget configuration
interface HelloWorldRxData {
    // Basic configuration
    message: string;
    counterOid: string;
    textColor: string;
    backgroundColor: string;
    fontSize: number;

    // Features
    showCounter: boolean;
    showStateBinding: boolean;
    debugMode: boolean;
    noCard: boolean;

    // Advanced
    stepSize: number;
    maxValue: number;
    minValue: number;

    // Index signature for Generic compatibility
    [key: string]: unknown;
}

// Define the widget state
interface HelloWorldState extends VisRxWidgetState {
    localCounter: number;
    userInput: string;
    lastUpdate: string;
}

class HelloWorld extends Generic<HelloWorldRxData, HelloWorldState> {
    constructor(props: VisRxWidgetProps) {
        super(props);
        this.state = {
            ...this.state,
            localCounter: 0,
            userInput: '',
            lastUpdate: new Date().toLocaleTimeString(),
        };
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplDeluxeHelloWorld',
            visSet: 'vis-2-widgets-deluxe',
            visSetLabel: 'set_label',
            visWidgetLabel: 'hello_world',
            visName: 'Hello World',
            visAttrs: [
                {
                    name: 'common',
                    fields: [
                        {
                            name: 'message',
                            label: 'message',
                            type: 'text',
                            default: 'Hello Deluxe 123456 World! 🚀',
                        },
                        {
                            name: 'textColor',
                            label: 'text_color',
                            type: 'color',
                            default: '#333333',
                        },
                        {
                            name: 'backgroundColor',
                            label: 'background_color',
                            type: 'color',
                            default: '#ffffff',
                        },
                        {
                            name: 'fontSize',
                            label: 'font_size',
                            type: 'number',
                            default: 20,
                        },
                        {
                            name: 'noCard',
                            label: 'without_card',
                            type: 'checkbox',
                            default: false,
                        },
                    ],
                },
                {
                    name: 'counter',
                    label: 'counter_group',
                    fields: [
                        {
                            name: 'showCounter',
                            label: 'show_counter',
                            type: 'checkbox',
                            default: true,
                        },
                        {
                            name: 'counterOid',
                            label: 'counter_state',
                            type: 'id',
                            hidden: '!data.showCounter',
                        },
                        {
                            name: 'stepSize',
                            label: 'step_size',
                            type: 'number',
                            default: 1,
                            hidden: '!data.showCounter',
                        },
                        {
                            name: 'minValue',
                            label: 'min_value',
                            type: 'number',
                            default: -100,
                            hidden: '!data.showCounter',
                        },
                        {
                            name: 'maxValue',
                            label: 'max_value',
                            type: 'number',
                            default: 100,
                            hidden: '!data.showCounter',
                        },
                    ],
                },
                {
                    name: 'advanced',
                    label: 'advanced',
                    fields: [
                        {
                            name: 'showStateBinding',
                            label: 'show_state_binding',
                            type: 'checkbox',
                            default: false,
                        },
                        {
                            name: 'debugMode',
                            label: 'debug_mode',
                            type: 'checkbox',
                            default: false,
                            tooltip: 'debug_mode_tooltip',
                        },
                    ],
                },
            ],
            visDefaultStyle: {
                width: 400,
                height: 300,
                position: 'absolute',
            },
            visPrev: 'widgets/vis-2-widgets-deluxe/img/prev_hello_world.png',
        };
    }

    getWidgetInfo(): RxWidgetInfo {
        return HelloWorld.getWidgetInfo();
    }

    componentDidMount(): void {
        super.componentDidMount();
        // Initialize counter from state if available
        if (this.state.rxData.counterOid && this.state.rxData.showCounter) {
            const value = this.getPropertyValue('counterOid');
            if (value !== null && value !== undefined) {
                this.setState({ localCounter: Number(value) || 0 });
            }
        }
    }

    componentDidUpdate(prevProps: VisRxWidgetProps): void {
        // @ts-ignore - Type mismatch with base class
        super.componentDidUpdate(prevProps);

        // Update local counter when state changes
        if (this.state.rxData.counterOid && this.state.rxData.showCounter) {
            const value = this.getPropertyValue('counterOid');

            if (value !== null && value !== undefined) {
                const numValue = Number(value) || 0;
                if (numValue !== this.state.localCounter) {
                    this.setState({
                        localCounter: numValue,
                        lastUpdate: new Date().toLocaleTimeString(),
                    });
                }
            }
        }
    }

    onCounterChange = (delta: number): void => {
        const { minValue = -100, maxValue = 100, counterOid, stepSize = 1 } = this.state.rxData;
        const actualDelta = delta * stepSize;
        const newValue = Math.max(minValue, Math.min(maxValue, this.state.localCounter + actualDelta));

        this.setState({
            localCounter: newValue,
            lastUpdate: new Date().toLocaleTimeString(),
        });

        // Update ioBroker state if bound
        if (counterOid && !this.state.editMode) {
            this.props.context.setValue(counterOid, newValue);
        }
    };

    onReset = (): void => {
        const resetValue = 0;
        this.setState({
            localCounter: resetValue,
            lastUpdate: new Date().toLocaleTimeString(),
        });

        if (this.state.rxData.counterOid && !this.state.editMode) {
            this.props.context.setValue(this.state.rxData.counterOid, resetValue);
        }
    };

    renderCounter(): React.JSX.Element | null {
        if (!this.state.rxData.showCounter) {
            return null;
        }

        const { minValue = -100, maxValue = 100 } = this.state.rxData;
        const isAtMin = this.state.localCounter <= minValue;
        const isAtMax = this.state.localCounter >= maxValue;

        return (
            <Paper
                elevation={2}
                sx={{ p: 2, mt: 2 }}
            >
                <Typography
                    variant="subtitle2"
                    gutterBottom
                >
                    Counter Demo
                </Typography>
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <IconButton
                        onClick={() => this.onCounterChange(-1)}
                        disabled={isAtMin || this.state.editMode}
                        color="primary"
                    >
                        <RemoveIcon />
                    </IconButton>

                    <Box
                        textAlign="center"
                        flex={1}
                    >
                        <Typography
                            variant="h4"
                            component="div"
                        >
                            {this.state.localCounter}
                        </Typography>
                        {this.state.rxData.counterOid && (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Bound to: {this.state.rxData.counterOid.split('.').pop()}
                            </Typography>
                        )}
                    </Box>

                    <IconButton
                        onClick={() => this.onCounterChange(1)}
                        disabled={isAtMax || this.state.editMode}
                        color="primary"
                    >
                        <AddIcon />
                    </IconButton>
                </Box>

                <Box
                    display="flex"
                    justifyContent="center"
                    mt={1}
                >
                    <Button
                        size="small"
                        startIcon={<RefreshIcon />}
                        onClick={this.onReset}
                        disabled={this.state.editMode}
                    >
                        Reset
                    </Button>
                </Box>
            </Paper>
        );
    }

    renderStateBinding(): React.JSX.Element | null {
        if (!this.state.rxData.showStateBinding) {
            return null;
        }

        return (
            <Paper
                elevation={2}
                sx={{ p: 2, mt: 2 }}
            >
                <Typography
                    variant="subtitle2"
                    gutterBottom
                >
                    State Binding Info
                </Typography>
                <Box>
                    <TextField
                        fullWidth
                        label="User Input"
                        value={this.state.userInput}
                        onChange={e => this.setState({ userInput: e.target.value })}
                        size="small"
                        margin="dense"
                        disabled={this.state.editMode}
                    />
                    {this.state.rxData.counterOid && (
                        <Box mt={1}>
                            <Chip
                                label={`State: ${this.state.rxData.counterOid}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                            <Typography
                                variant="caption"
                                display="block"
                                mt={1}
                            >
                                Last Update: {this.state.lastUpdate}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Paper>
        );
    }

    renderDebugInfo(): React.JSX.Element | null {
        if (!this.state.rxData.debugMode) {
            return null;
        }

        const debugInfo = {
            widgetId: this.props.id,
            editMode: this.state.editMode,
            localCounter: this.state.localCounter,
            boundState: this.state.rxData.counterOid || 'none',
            fontSize: this.state.rxData.fontSize || 20,
            colors: {
                text: this.state.rxData.textColor,
                background: this.state.rxData.backgroundColor,
            },
        };

        return (
            <Paper
                elevation={3}
                sx={{
                    p: 2,
                    mt: 2,
                    backgroundColor: '#f5f5f5',
                    border: '2px dashed #ff9800',
                }}
            >
                <Box
                    display="flex"
                    alignItems="center"
                    mb={1}
                >
                    <BugReportIcon sx={{ mr: 1, color: '#ff9800' }} />
                    <Typography
                        variant="subtitle2"
                        color="warning.main"
                    >
                        Debug Mode
                    </Typography>
                </Box>
                <pre
                    style={{
                        margin: 0,
                        fontSize: '12px',
                        overflow: 'auto',
                        maxHeight: '150px',
                    }}
                >
                    {JSON.stringify(debugInfo, null, 2)}
                </pre>
            </Paper>
        );
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element | null {
        super.renderWidgetBody(props);

        const content = (
            <Box
                sx={{
                    height: '100%',
                    backgroundColor: this.state.rxData.backgroundColor || '#ffffff',
                    p: this.state.rxData.noCard ? 0 : 2,
                    overflow: 'auto',
                }}
            >
                {/* Main Message */}
                <Typography
                    variant="h5"
                    component="div"
                    align="center"
                    sx={{
                        color: this.state.rxData.textColor || '#333333',
                        fontSize: `${this.state.rxData.fontSize || 20}px`,
                        fontWeight: 'bold',
                        mb: 2,
                    }}
                >
                    {this.state.rxData.message || 'Hello Deluxe11 World! 🚀'}
                </Typography>

                {/* Edit Mode Indicator */}
                {this.state.editMode && (
                    <Chip
                        label="EDIT MODE"
                        color="secondary"
                        size="small"
                        sx={{ mb: 2, display: 'block', width: 'fit-content', mx: 'auto' }}
                    />
                )}

                <Divider sx={{ my: 2 }} />

                {/* Interactive Elements */}
                {this.renderCounter()}
                {this.renderStateBinding()}
                {this.renderDebugInfo()}
            </Box>
        );

        if (this.state.rxData.noCard || props.widget.usedInWidget) {
            return content;
        }

        return (
            <Card sx={{ height: '100%' }}>
                <CardContent sx={{ height: '100%', p: 0 }}>{content}</CardContent>
            </Card>
        );
    }
}

export default HelloWorld;
