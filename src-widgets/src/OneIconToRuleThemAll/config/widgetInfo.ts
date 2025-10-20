import type { RxWidgetInfo } from '@iobroker/types-vis-2';
import { modeHasDialog, modeHasPercentage, MODE_DEFINITIONS } from '../types/constants';
import { FlexMode, type OneIconToRuleThemAllRxData } from '../types';

export function getWidgetInfo(): RxWidgetInfo {
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
                            { value: 'heating_knx', label: 'one_icon_mode_heating_knx' },
                        ],
                        default: 'switch',
                        tooltip: 'one_icon_mode_tooltip',
                    },
                    {
                        name: 'controlOid',
                        label: 'control_state',
                        type: 'id',
                        tooltip: 'control_state_tooltip',
                        hidden: 'data.mode === "heating_knx"',
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

            // --- HEATING KNX MODE ---
            {
                name: 'mode_heating_knx',
                label: 'deluxe_heating_settings',
                hidden: 'data.mode !== "heating_knx"',
                fields: [
                    {
                        name: 'heatingSetpointIncreaseOid',
                        label: 'heating_setpoint_increase_oid',
                        type: 'id',
                        tooltip: 'heating_setpoint_increase_oid_tooltip',
                    },
                    {
                        name: 'heatingSetpointDecreaseOid',
                        label: 'heating_setpoint_decrease_oid',
                        type: 'id',
                        tooltip: 'heating_setpoint_decrease_oid_tooltip',
                    },
                    {
                        name: 'heatingValvePositionOid',
                        label: 'heating_valve_position_oid',
                        type: 'id',
                        tooltip: 'heating_valve_position_oid_tooltip',
                    },
                    {
                        name: 'heatingSetpointOid',
                        label: 'heating_setpoint_oid',
                        type: 'id',
                        tooltip: 'heating_setpoint_oid_tooltip',
                    },
                    {
                        name: 'heatingModeStatusOid',
                        label: 'heating_mode_status_oid',
                        type: 'id',
                        tooltip: 'heating_mode_status_oid_tooltip',
                    },
                    {
                        name: 'heatingModeControlOid',
                        label: 'heating_mode_control_oid',
                        type: 'id',
                        tooltip: 'heating_mode_control_oid_tooltip',
                    },
                    {
                        name: 'heatingShowUnits',
                        label: 'heating_show_units',
                        type: 'checkbox',
                        default: true,
                        tooltip: 'heating_show_units_tooltip',
                    },
                    {
                        name: 'heatingModeControlType',
                        label: 'heating_mode_control_type',
                        type: 'select',
                        options: [
                            { value: 'button', label: 'heating_mode_control_button' },
                            { value: 'dropdown', label: 'heating_mode_control_dropdown' },
                        ],
                        default: 'button',
                        tooltip: 'heating_mode_control_type_tooltip',
                    },
                    {
                        name: 'heatingModesConfig',
                        label: 'heating_modes_config',
                        type: 'text',
                        default:
                            '[{"label":"Auto","value":0},{"label":"Comfort","value":1},{"label":"Standby","value":2},{"label":"Night","value":3},{"label":"Frost","value":4}]',
                        tooltip: 'heating_modes_config_tooltip',
                    },
                ],
            },

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
