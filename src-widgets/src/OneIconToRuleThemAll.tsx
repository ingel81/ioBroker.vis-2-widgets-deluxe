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
    ButtonGroup,
} from '@mui/material';
import { Close, PowerSettingsNew } from '@mui/icons-material';

import Generic from './Generic';
import { Icon } from './components';

// ========================================
// MODE DEFINITIONS
// ========================================

/**
 * Available control modes for OneIconToRuleThemAll
 */
enum FlexMode {
    DIMMER_DIALOG = 'dimmer_dialog',
    SWITCH = 'switch',
    // Future modes (Phase 2+)
    // RGB_DIALOG = 'rgb_dialog',
    // THERMOSTAT_DIALOG = 'thermostat_dialog',
    // SCENE_DIALOG = 'scene_dialog',
    // DIMMER_INLINE = 'dimmer_inline',
}

/**
 * Mode metadata and capabilities
 */
interface ModeDefinition {
    id: FlexMode;
    label: string;
    hasDialog: boolean;
    hasPercentage: boolean;
    description?: string;
}

/**
 * Mode definitions registry
 */
const MODE_DEFINITIONS: Record<FlexMode, ModeDefinition> = {
    [FlexMode.DIMMER_DIALOG]: {
        id: FlexMode.DIMMER_DIALOG,
        label: 'Dimmer (Dialog)',
        hasDialog: true,
        hasPercentage: true,
        description: 'Dimmer control with dialog (0-100)',
    },
    [FlexMode.SWITCH]: {
        id: FlexMode.SWITCH,
        label: 'Switch (Toggle)',
        hasDialog: false,
        hasPercentage: false,
        description: 'Simple on/off toggle',
    },
    // Future modes commented out for MVP
    // [FlexMode.RGB_DIALOG]: { ... },
    // [FlexMode.THERMOSTAT_DIALOG]: { ... },
    // [FlexMode.SCENE_DIALOG]: { ... },
    // [FlexMode.DIMMER_INLINE]: { ... },
};

// ========================================
// WIDGET DATA INTERFACE
// ========================================

/**
 * Widget configuration data (from visAttrs)
 */
interface OneIconToRuleThemAllRxData {
    // === COMMON SETTINGS (ALL MODES) ===
    mode: FlexMode;
    controlOid: string;
    showCard: boolean;

    // === ICON SETTINGS ===
    icon: string;
    iconSize: number;
    useDifferentInactiveIcon?: boolean;
    iconInactive?: string;
    activeColor: string;
    inactiveColor: string;

    // === CARD SETTINGS ===
    cardBackgroundColor?: string;
    cardBorderRadiusTL?: number;
    cardBorderRadiusTR?: number;
    cardBorderRadiusBL?: number;
    cardBorderRadiusBR?: number;

    // === DIALOG SETTINGS (ALL DIALOG MODES) ===
    dialogTitle?: string;
    dialogBackgroundColor?: string;
    dialogPrimaryColor?: string;
    dialogTitleColor?: string;
    dialogWidth?: 'xs' | 'sm' | 'md';

    // === STATUS OVERLAY SETTINGS ===
    showPercentage?: boolean;
    showStatusText?: boolean;
    statusOnText?: string;
    statusOffText?: string;
    statusFontSize?: number;

    // === MODE: DIMMER_DIALOG ===
    dimmerMinValue?: number;
    dimmerMaxValue?: number;
    dimmerStep?: number;
    dimmerShowQuickButtons?: boolean;

    // === MODE: SWITCH ===
    switchOnValue?: string;
    switchOffValue?: string;

    // Future mode settings commented out
    // === MODE: RGB_DIALOG ===
    // rgbFormat?: 'hex' | 'rgb' | 'hsv';
    // rgbPickerType?: 'wheel' | 'sketch' | 'chrome';

    [key: string]: unknown;
}

// ========================================
// WIDGET STATE INTERFACE
// ========================================

/**
 * Component state
 */
interface OneIconToRuleThemAllState extends VisRxWidgetState {
    dialog: boolean;
    localValue: number;
    isChanging: boolean;
    oidName: string | null;
}

// ========================================
// HELPER TYPES
// ========================================

/**
 * Parsed value type (for switch mode)
 */
type ParsedValue = boolean | number | string;

// ========================================
// TYPE GUARDS
// ========================================

/**
 * Check if mode has dialog
 */
function modeHasDialog(mode: FlexMode): boolean {
    return MODE_DEFINITIONS[mode]?.hasDialog ?? false;
}

/**
 * Check if mode has percentage
 */
function modeHasPercentage(mode: FlexMode): boolean {
    return MODE_DEFINITIONS[mode]?.hasPercentage ?? false;
}

/**
 * Get mode definition safely
 */
function getModeDefinition(mode: FlexMode): ModeDefinition | null {
    return MODE_DEFINITIONS[mode] || null;
}

// ========================================
// ONE ICON TO RULE THEM ALL CLASS
// ========================================

class OneIconToRuleThemAll extends Generic<OneIconToRuleThemAllRxData, OneIconToRuleThemAllState> {
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

    // ========================================
    // WIDGET INFO (SETTINGS STRUCTURE)
    // ========================================

    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplDeluxeOneIconToRuleThemAll',
            visSet: 'vis-2-widgets-deluxe',
            visSetLabel: 'set_label',
            visSetColor: 'rgba(18, 179, 160, 1)',
            visWidgetLabel: 'one_icon_widget',
            visName: 'Flex Widget',
            visAttrs: [
                // ================================================
                // GROUP 1: COMMON SETTINGS (Always visible)
                // ================================================
                {
                    name: 'common',
                    label: 'deluxe_common',
                    fields: [
                        {
                            name: 'mode',
                            label: 'one_icon_mode',
                            type: 'select',
                            options: [
                                { value: 'dimmer_dialog', label: 'one_icon_mode_dimmer_dialog' },
                                { value: 'switch', label: 'one_icon_mode_switch' },
                                // Future modes commented out
                                // { value: 'rgb_dialog', label: 'one_icon_mode_rgb_dialog' },
                                // { value: 'thermostat_dialog', label: 'one_icon_mode_thermostat_dialog' },
                            ],
                            default: 'switch',
                            tooltip: 'one_icon_mode_tooltip',
                        },
                        {
                            name: 'controlOid',
                            label: 'control_state',
                            type: 'id',
                            tooltip: 'control_state_tooltip',
                        },
                        {
                            name: 'showCard',
                            label: 'show_card',
                            type: 'checkbox',
                            default: true,
                        },
                    ],
                },

                // ================================================
                // GROUP 2: MODE-SPECIFIC SETTINGS
                // ================================================

                // --- DIMMER DIALOG MODE ---
                {
                    name: 'mode_dimmer',
                    label: 'deluxe_dimmer_settings',
                    hidden: 'data.mode !== "dimmer_dialog"',
                    fields: [
                        {
                            name: 'dimmerMinValue',
                            label: 'dimmer_min_value',
                            type: 'number',
                            default: 0,
                            tooltip: 'dimmer_min_value_tooltip',
                        },
                        {
                            name: 'dimmerMaxValue',
                            label: 'dimmer_max_value',
                            type: 'number',
                            default: 100,
                            tooltip: 'dimmer_max_value_tooltip',
                        },
                        {
                            name: 'dimmerStep',
                            label: 'dimmer_step',
                            type: 'number',
                            default: 1,
                            tooltip: 'dimmer_step_tooltip',
                        },
                        {
                            name: 'dimmerShowQuickButtons',
                            label: 'dimmer_show_quick_buttons',
                            type: 'checkbox',
                            default: true,
                        },
                    ],
                },

                // --- SWITCH MODE ---
                {
                    name: 'mode_switch',
                    label: 'deluxe_switch_settings',
                    hidden: 'data.mode !== "switch"',
                    fields: [
                        {
                            name: 'switchOnValue',
                            label: 'switch_on_value',
                            type: 'text',
                            default: 'true',
                            tooltip: 'switch_on_value_tooltip',
                        },
                        {
                            name: 'switchOffValue',
                            label: 'switch_off_value',
                            type: 'text',
                            default: 'false',
                            tooltip: 'switch_off_value_tooltip',
                        },
                    ],
                },

                // Future modes: rgb_dialog, thermostat_dialog, scene_dialog, dimmer_inline
                // (commented out for MVP)

                // ================================================
                // GROUP 3: ICON SETTINGS (Always visible)
                // ================================================
                {
                    name: 'icon',
                    label: 'deluxe_icon_settings',
                    fields: [
                        {
                            name: 'icon',
                            label: 'icon',
                            type: 'icon64',
                            default:
                                'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik05IDIxYzAgLjUuNCAxIDEgMWg0Yy42IDAgMS0uNSAxLTF2LTFIOXYxem0zLTE5QzguMSAyIDUgNS4xIDUgOWMwIDIuNCAxLjIgNC41IDMgNS43VjE3YzAgLjUuNCAxIDEgMWg2Yy42IDAgMS0uNSAxLTF2LTIuM2MxLjgtMS4zIDMtMy40IDMtNS43YzAtMy45LTMuMS03LTctN3oiLz48L3N2Zz4=',
                        },
                        {
                            name: 'useDifferentInactiveIcon',
                            label: 'use_different_inactive_icon',
                            type: 'checkbox',
                            default: false,
                        },
                        {
                            name: 'iconInactive',
                            label: 'icon_inactive',
                            type: 'icon64',
                            hidden: (data: unknown) => !(data as OneIconToRuleThemAllRxData).useDifferentInactiveIcon,
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
                            default: '#555555',
                        },
                    ],
                },

                // ================================================
                // GROUP 4: CARD SETTINGS (When showCard=true)
                // ================================================
                {
                    name: 'card',
                    label: 'deluxe_card_settings',
                    hidden: 'data.showCard !== true',
                    fields: [
                        {
                            name: 'cardBackgroundColor',
                            label: 'card_background_color',
                            type: 'color',
                            default: '#ffffff',
                        },
                        {
                            name: 'cardBorderRadiusTL',
                            label: 'card_border_radius_tl',
                            type: 'number',
                            default: 8,
                        },
                        {
                            name: 'cardBorderRadiusTR',
                            label: 'card_border_radius_tr',
                            type: 'number',
                            default: 8,
                        },
                        {
                            name: 'cardBorderRadiusBL',
                            label: 'card_border_radius_bl',
                            type: 'number',
                            default: 8,
                        },
                        {
                            name: 'cardBorderRadiusBR',
                            label: 'card_border_radius_br',
                            type: 'number',
                            default: 8,
                        },
                    ],
                },

                // ================================================
                // GROUP 5: DIALOG SETTINGS (Modes with dialog)
                // ================================================
                {
                    name: 'dialog',
                    label: 'deluxe_dialog_settings',
                    hidden: (data: unknown) => !modeHasDialog((data as OneIconToRuleThemAllRxData).mode),
                    fields: [
                        {
                            name: 'dialogTitle',
                            label: 'dialog_title',
                            type: 'text',
                            default: '',
                            tooltip: 'dialog_title_tooltip',
                        },
                        {
                            name: 'dialogBackgroundColor',
                            label: 'dialog_background_color',
                            type: 'color',
                            tooltip: 'dialog_background_color_tooltip',
                        },
                        {
                            name: 'dialogPrimaryColor',
                            label: 'dialog_primary_color',
                            type: 'color',
                            default: '#2196F3',
                            tooltip: 'dialog_primary_color_tooltip',
                        },
                        {
                            name: 'dialogTitleColor',
                            label: 'dialog_title_color',
                            type: 'color',
                            tooltip: 'dialog_title_color_tooltip',
                        },
                        {
                            name: 'dialogWidth',
                            label: 'dialog_width',
                            type: 'select',
                            options: [
                                { value: 'xs', label: 'Extra Small (320px)' },
                                { value: 'sm', label: 'Small (400px)' },
                                { value: 'md', label: 'Medium (600px)' },
                            ],
                            default: 'xs',
                        },
                    ],
                },

                // ================================================
                // GROUP 6: STATUS OVERLAY (Percentage/Status Text)
                // ================================================
                {
                    name: 'status',
                    label: 'deluxe_status_settings',
                    hidden: (data: unknown) => {
                        const typedData = data as OneIconToRuleThemAllRxData;
                        const mode = MODE_DEFINITIONS[typedData.mode];
                        return !mode?.hasPercentage && typedData.mode !== FlexMode.SWITCH;
                    },
                    fields: [
                        // For Dimmer modes
                        {
                            name: 'showPercentage',
                            label: 'show_percentage',
                            type: 'checkbox',
                            default: true,
                            hidden: (data: unknown) => !modeHasPercentage((data as OneIconToRuleThemAllRxData).mode),
                        },
                        // For Switch mode
                        {
                            name: 'showStatusText',
                            label: 'show_status_text',
                            type: 'checkbox',
                            default: false,
                            hidden: (data: unknown) => (data as OneIconToRuleThemAllRxData).mode !== FlexMode.SWITCH,
                        },
                        {
                            name: 'statusOnText',
                            label: 'status_on_text',
                            type: 'text',
                            default: 'ON',
                            hidden: (data: unknown) => {
                                const typedData = data as OneIconToRuleThemAllRxData;
                                return typedData.mode !== FlexMode.SWITCH || !typedData.showStatusText;
                            },
                        },
                        {
                            name: 'statusOffText',
                            label: 'status_off_text',
                            type: 'text',
                            default: 'OFF',
                            hidden: (data: unknown) => {
                                const typedData = data as OneIconToRuleThemAllRxData;
                                return typedData.mode !== FlexMode.SWITCH || !typedData.showStatusText;
                            },
                        },
                        {
                            name: 'statusFontSize',
                            label: 'status_font_size',
                            type: 'number',
                            default: 12,
                            tooltip: 'status_font_size_tooltip',
                        },
                    ],
                },
            ],
            visDefaultStyle: {
                width: 100,
                height: 100,
                position: 'absolute',
                'overflow-x': 'visible',
                'overflow-y': 'visible',
            },
            visResizable: true,
            visPrev: 'widgets/vis-2-widgets-deluxe/img/prev_one_icon_to_rule_them_all.png',
        };
    }

    getWidgetInfo(): RxWidgetInfo {
        return OneIconToRuleThemAll.getWidgetInfo();
    }

    // ========================================
    // LIFECYCLE METHODS
    // ========================================

    componentDidMount(): void {
        super.componentDidMount();

        // Initial value (Dimmer modes)
        if (this.state.rxData.controlOid && this.isDimmerMode()) {
            const value = this.getPropertyValue('controlOid');
            if (value !== null && value !== undefined) {
                this.setState({ localValue: Number(value) || 0 });
            }
        }

        // Fetch OID name for dialog title
        if (this.state.rxData.controlOid) {
            void this.fetchOidName();
        }
    }

    componentDidUpdate(prevProps: VisRxWidgetProps): void {
        // @ts-ignore - Type mismatch with base class
        super.componentDidUpdate(prevProps);

        // Update local value when OID value changes (if not currently changing)
        if (this.state.rxData.controlOid && !this.state.isChanging && this.isDimmerMode()) {
            const value = this.getPropertyValue('controlOid');
            if (value !== null && value !== undefined) {
                const numValue = Number(value) || 0;
                if (numValue !== this.state.localValue) {
                    this.setState({ localValue: numValue });
                }
            }
        }
    }

    componentWillUnmount(): void {
        if (this.changeTimeout) {
            clearTimeout(this.changeTimeout);
        }
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    /**
     * Fetch OID name from ioBroker for dialog title
     */
    async fetchOidName(): Promise<void> {
        if (!this.state.rxData.controlOid) {
            return;
        }

        try {
            const obj = await this.props.context.socket.getObject(this.state.rxData.controlOid);
            if (obj?.common?.name) {
                const name =
                    typeof obj.common.name === 'object'
                        ? obj.common.name[this.props.context.lang] ||
                          obj.common.name.en ||
                          Object.values(obj.common.name)[0]
                        : obj.common.name;
                this.setState({ oidName: String(name) });
            }
        } catch (error) {
            console.error('[OneIconToRuleThemAll] Error fetching OID name:', error);
        }
    }

    /**
     * Check if current mode is a dimmer mode
     */
    isDimmerMode(): boolean {
        return (
            this.state.rxData.mode === FlexMode.DIMMER_DIALOG
            // || this.state.rxData.mode === FlexMode.DIMMER_INLINE  // Future
        );
    }

    /**
     * Get current active state (mode-dependent)
     */
    getIsActive(): boolean {
        switch (this.state.rxData.mode) {
            case FlexMode.DIMMER_DIALOG:
                return this.state.localValue > 0;

            case FlexMode.SWITCH:
                return this.getCurrentSwitchState();

            default:
                return false;
        }
    }

    /**
     * Get dialog title (auto-generated or custom)
     */
    getDialogTitle(): string {
        // Custom title
        if (this.state.rxData.dialogTitle) {
            return this.state.rxData.dialogTitle;
        }

        // OID name + mode label
        if (this.state.oidName) {
            const mode = getModeDefinition(this.state.rxData.mode);
            return `${mode?.label || 'Control'} - ${this.state.oidName}`;
        }

        // Fallback to mode label
        const mode = getModeDefinition(this.state.rxData.mode);
        return mode?.label || 'Control';
    }

    // ========================================
    // SWITCH MODE LOGIC
    // ========================================

    /**
     * Parse string value to boolean, number, or string
     */
    parseValue(value: string): ParsedValue {
        if (!value) {
            return value;
        }

        // Boolean
        if (value === 'true') {
            return true;
        }
        if (value === 'false') {
            return false;
        }

        // Number
        const numValue = Number(value);
        if (!isNaN(numValue)) {
            return numValue;
        }

        // String (keep as string)
        return value;
    }

    /**
     * Compare values with loose equality for flexibility
     */
    valuesEqual(a: unknown, b: unknown): boolean {
        // Loose comparison for flexibility
        return a == b;
    }

    /**
     * Get current switch state (ON or OFF)
     */
    getCurrentSwitchState(): boolean {
        const value = this.getPropertyValue('controlOid');
        const onValue = this.parseValue(this.state.rxData.switchOnValue || 'true');

        return this.valuesEqual(value, onValue);
    }

    /**
     * Toggle switch (switch mode)
     */
    toggleSwitch = (): void => {
        const isOn = this.getCurrentSwitchState();

        const onValue = this.parseValue(this.state.rxData.switchOnValue || 'true');
        const offValue = this.parseValue(this.state.rxData.switchOffValue || 'false');

        const newValue = isOn ? offValue : onValue;

        if (this.state.rxData.controlOid && !this.state.editMode) {
            this.props.context.setValue(this.state.rxData.controlOid, newValue);
        }
    };

    // ========================================
    // DIMMER MODE LOGIC
    // ========================================

    /**
     * Handle dimmer slider change (debounced)
     */
    handleDimmerChange = (_e: unknown, value: number | number[]): void => {
        const numValue = Array.isArray(value) ? value[0] : value;

        this.setState({ localValue: numValue, isChanging: true });

        if (this.changeTimeout) {
            clearTimeout(this.changeTimeout);
        }

        this.changeTimeout = setTimeout(() => {
            this.finishChanging(numValue);
        }, 300); // Debounce 300ms
    };

    /**
     * Handle dimmer slider change committed
     */
    handleDimmerChangeCommitted = (_e: unknown, value: number | number[]): void => {
        const numValue = Array.isArray(value) ? value[0] : value;
        this.finishChanging(numValue);
    };

    /**
     * Finish changing value (after debounce)
     */
    finishChanging = (value: number): void => {
        if (this.state.rxData.controlOid && !this.state.editMode) {
            this.props.context.setValue(this.state.rxData.controlOid, value);
        }
        this.setState({ isChanging: false });
        this.changeTimeout = null;
    };

    /**
     * Handle quick button click
     */
    handleQuickSet = (value: number): void => {
        this.setState({ localValue: value });
        if (this.state.rxData.controlOid && !this.state.editMode) {
            this.props.context.setValue(this.state.rxData.controlOid, value);
        }
    };

    // ========================================
    // EVENT HANDLERS
    // ========================================

    /**
     * Main click handler (mode-dependent behavior)
     */
    handleClick = (): void => {
        if (this.state.editMode) {
            return;
        }

        switch (this.state.rxData.mode) {
            case FlexMode.DIMMER_DIALOG:
                // case FlexMode.RGB_DIALOG:           // Future
                // case FlexMode.THERMOSTAT_DIALOG:    // Future
                // case FlexMode.SCENE_DIALOG:         // Future
                this.setState({ dialog: true });
                break;

            case FlexMode.SWITCH:
                this.toggleSwitch();
                break;

            // case FlexMode.DIMMER_INLINE:         // Future
            //     // No action (slider always visible)
            //     break;

            default:
                console.warn(`[OneIconToRuleThemAll] Unknown mode: ${String(this.state.rxData.mode)}`);
        }
    };

    /**
     * Close dialog
     */
    handleDialogClose = (): void => {
        this.setState({ dialog: false });
    };

    // ========================================
    // RENDER METHODS
    // ========================================

    /**
     * Render icon with status overlay
     */
    renderIcon(): React.JSX.Element {
        const isActive = this.getIsActive();
        const iconSize = this.state.rxData.iconSize || 48;

        // Choose icon based on state and settings
        const icon =
            !isActive && this.state.rxData.useDifferentInactiveIcon && this.state.rxData.iconInactive
                ? this.state.rxData.iconInactive
                : this.state.rxData.icon;

        // Determine icon color based on state
        const iconColor = isActive
            ? this.state.rxData.activeColor || '#FFC107'
            : this.state.rxData.inactiveColor || '#555555';

        // Check if icon exists and is not empty
        const hasIcon = icon && icon.trim() !== '';

        // Check if icon is a data URL (SVG/Base64) or icon name
        const isDataUrl = hasIcon && (icon.startsWith('data:') || icon.startsWith('http'));

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
                    onClick={this.handleClick}
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
                    {hasIcon && isDataUrl && (
                        <Icon
                            src={icon}
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
                {this.renderStatusOverlay()}
            </Box>
        );
    }

    /**
     * Render status overlay (percentage or ON/OFF text)
     */
    renderStatusOverlay(): React.JSX.Element | null {
        const mode = this.state.rxData.mode;
        const isActive = this.getIsActive();
        const iconColor = isActive
            ? this.state.rxData.activeColor || '#FFC107'
            : this.state.rxData.inactiveColor || '#555555';

        const fontSize = this.state.rxData.statusFontSize || 12;

        switch (mode) {
            case FlexMode.DIMMER_DIALOG:
                if (!this.state.rxData.showPercentage) {
                    return null;
                }
                return (
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
                            fontSize: `${fontSize}px`,
                        }}
                    >
                        {Math.round(this.state.localValue)}%
                    </Typography>
                );

            case FlexMode.SWITCH: {
                if (!this.state.rxData.showStatusText) {
                    return null;
                }
                const text = isActive
                    ? this.state.rxData.statusOnText || 'ON'
                    : this.state.rxData.statusOffText || 'OFF';
                return (
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
                            fontSize: `${fontSize}px`,
                        }}
                    >
                        {text}
                    </Typography>
                );
            }

            default:
                return null;
        }
    }

    /**
     * Render quick buttons for dimmer dialog
     */
    renderQuickButtons(primaryColor: string): React.JSX.Element {
        const min = this.state.rxData.dimmerMinValue ?? 0;
        const max = this.state.rxData.dimmerMaxValue ?? 100;
        const range = max - min;

        const quickButtons = [
            { label: 'Off', value: min, icon: <PowerSettingsNew /> },
            { label: '20%', value: min + range * 0.2 },
            { label: '40%', value: min + range * 0.4 },
            { label: '60%', value: min + range * 0.6 },
            { label: '80%', value: min + range * 0.8 },
            { label: '100%', value: max },
        ];

        return (
            <>
                <ButtonGroup
                    fullWidth
                    variant="outlined"
                    sx={{ mb: 2 }}
                >
                    {quickButtons.slice(0, 3).map(btn => (
                        <Button
                            key={btn.value}
                            onClick={() => this.handleQuickSet(btn.value)}
                            sx={{
                                color: primaryColor,
                                borderColor: primaryColor,
                                '&:hover': {
                                    borderColor: primaryColor,
                                    backgroundColor: `${primaryColor}10`,
                                },
                            }}
                        >
                            {btn.icon || btn.label}
                        </Button>
                    ))}
                </ButtonGroup>

                <ButtonGroup
                    fullWidth
                    variant="outlined"
                >
                    {quickButtons.slice(3).map(btn => (
                        <Button
                            key={btn.value}
                            onClick={() => this.handleQuickSet(btn.value)}
                            sx={{
                                color: primaryColor,
                                borderColor: primaryColor,
                                '&:hover': {
                                    borderColor: primaryColor,
                                    backgroundColor: `${primaryColor}10`,
                                },
                            }}
                        >
                            {btn.label}
                        </Button>
                    ))}
                </ButtonGroup>
            </>
        );
    }

    /**
     * Render dimmer dialog content
     */
    renderDimmerDialogContent(primaryColor: string): React.JSX.Element {
        const min = this.state.rxData.dimmerMinValue ?? 0;
        const max = this.state.rxData.dimmerMaxValue ?? 100;
        const step = this.state.rxData.dimmerStep ?? 1;

        return (
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
                        onChange={this.handleDimmerChange}
                        onChangeCommitted={this.handleDimmerChangeCommitted}
                        min={min}
                        max={max}
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

                {this.state.rxData.dimmerShowQuickButtons && this.renderQuickButtons(primaryColor)}
            </Box>
        );
    }

    /**
     * Render mode-specific dialog content
     */
    renderModeDialogContent(): React.JSX.Element {
        const primaryColor = this.state.rxData.dialogPrimaryColor || '#2196F3';

        switch (this.state.rxData.mode) {
            case FlexMode.DIMMER_DIALOG:
                return this.renderDimmerDialogContent(primaryColor);

            // case FlexMode.RGB_DIALOG:           // Future
            //     return this.renderRgbDialogContent(primaryColor);

            // case FlexMode.THERMOSTAT_DIALOG:    // Future
            //     return this.renderThermostatDialogContent(primaryColor);

            // case FlexMode.SCENE_DIALOG:         // Future
            //     return this.renderSceneDialogContent(primaryColor);

            default:
                return <></>;
        }
    }

    /**
     * Render dialog shell (common for all dialog modes)
     */
    renderDialog(): React.JSX.Element | null {
        if (!this.state.dialog) {
            return null;
        }

        const dialogWidth = this.state.rxData.dialogWidth || 'xs';
        const titleColor = this.state.rxData.dialogTitleColor;
        const backgroundColor = this.state.rxData.dialogBackgroundColor;

        // Dialog width constraints based on selected size
        const widthConstraints = {
            xs: { minWidth: 320, maxWidth: 400 },
            sm: { minWidth: 400, maxWidth: 500 },
            md: { minWidth: 500, maxWidth: 650 },
        };

        return (
            <Dialog
                fullWidth
                maxWidth={dialogWidth}
                open={true}
                onClose={this.handleDialogClose}
                sx={{
                    '& .MuiDialog-paper': {
                        ...widthConstraints[dialogWidth],
                        // Only set backgroundColor if configured
                        ...(backgroundColor ? { backgroundColor } : {}),
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        // Only set color if configured
                        ...(titleColor ? { color: titleColor } : {}),
                    }}
                >
                    {this.getDialogTitle()}
                    <IconButton
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            // Only set color if configured
                            ...(titleColor ? { color: titleColor } : {}),
                        }}
                        onClick={this.handleDialogClose}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent>{this.renderModeDialogContent()}</DialogContent>
            </Dialog>
        );
    }

    /**
     * Render mode-specific UI (dialog or inline)
     */
    renderModeSpecificUI(): React.JSX.Element | null {
        const mode = getModeDefinition(this.state.rxData.mode);

        if (mode?.hasDialog && this.state.dialog) {
            return this.renderDialog();
        }

        // Future: Inline UI modes (e.g., dimmer_inline)
        // if (this.state.rxData.mode === FlexMode.DIMMER_INLINE) {
        //     return this.renderInlineSlider();
        // }

        return null;
    }

    /**
     * Wrap content with card (if enabled)
     */
    wrapWithCard(content: React.JSX.Element, props: RxRenderWidgetProps): React.JSX.Element {
        if (this.state.rxData.showCard === false || props.widget.usedInWidget) {
            return content;
        }

        return (
            <Box
                sx={{
                    backgroundColor: this.state.rxData.cardBackgroundColor || '#ffffff',
                    borderTopLeftRadius: `${this.state.rxData.cardBorderRadiusTL ?? 8}px`,
                    borderTopRightRadius: `${this.state.rxData.cardBorderRadiusTR ?? 8}px`,
                    borderBottomLeftRadius: `${this.state.rxData.cardBorderRadiusBL ?? 8}px`,
                    borderBottomRightRadius: `${this.state.rxData.cardBorderRadiusBR ?? 8}px`,
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

    /**
     * Main render method
     */
    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);

        const content = (
            <>
                {this.renderIcon()}
                {this.renderModeSpecificUI()}
            </>
        );

        return this.wrapWithCard(content, props);
    }
}

export default OneIconToRuleThemAll;
