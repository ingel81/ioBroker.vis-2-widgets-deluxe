import type { RxWidgetInfo } from '@iobroker/types-vis-2';
import { FlexMode, type OneIconToRuleThemAllRxData } from '../types';
import { MODE_DEFINITIONS, modeHasDialog, modeHasPercentage } from '../types/constants';

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
                            { value: 'window_shutter', label: 'one_icon_mode_window_shutter' },
                            { value: 'numeric_display', label: 'one_icon_mode_numeric_display' },
                            { value: 'string_display', label: 'one_icon_mode_string_display' },
                        ],
                        default: 'switch',
                        tooltip: 'one_icon_mode_tooltip',
                    },
                    {
                        name: 'controlOid',
                        label: 'control_state',
                        type: 'id',
                        tooltip: 'control_state_tooltip',
                        hidden: 'data.mode === "heating_knx" || data.mode === "window_shutter" || data.mode === "numeric_display" || data.mode === "string_display"',
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
                        name: 'heatingSetpointShiftOid',
                        label: 'heating_setpoint_shift_oid',
                        type: 'id',
                        tooltip: 'heating_setpoint_shift_oid_tooltip',
                    },
                    {
                        name: 'heatingSetpointIncreaseValue',
                        label: 'heating_setpoint_increase_value',
                        type: 'text',
                        default: 'true',
                        tooltip: 'heating_setpoint_increase_value_tooltip',
                    },
                    {
                        name: 'heatingSetpointDecreaseValue',
                        label: 'heating_setpoint_decrease_value',
                        type: 'text',
                        default: 'false',
                        tooltip: 'heating_setpoint_decrease_value_tooltip',
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
                            { value: 'buttons', label: 'heating_mode_control_buttons' },
                        ],
                        default: 'button',
                        tooltip: 'heating_mode_control_type_tooltip',
                    },
                    {
                        name: 'heatingModesConfig',
                        label: 'heating_modes_config',
                        type: 'text',
                        default:
                            '[{"label":"Komfort","statusValue":33,"controlValue":1},{"label":"Standby","statusValue":34,"controlValue":2},{"label":"Nacht","statusValue":36,"controlValue":3},{"label":"Frost","statusValue":40,"controlValue":4}]',
                        tooltip: 'heating_modes_config_tooltip',
                    },
                ],
            },

            // --- WINDOW SHUTTER MODE ---
            {
                name: 'mode_window_shutter',
                label: 'deluxe_window_shutter_settings',
                hidden: 'data.mode !== "window_shutter"',
                fields: [
                    // Rolladen-OIDs
                    {
                        name: 'shutterPositionOid',
                        label: 'shutter_position_oid',
                        type: 'id',
                        tooltip: 'shutter_position_oid_tooltip',
                    },
                    {
                        name: 'shutterUpOid',
                        label: 'shutter_up_oid',
                        type: 'id',
                        tooltip: 'shutter_up_oid_tooltip',
                    },
                    {
                        name: 'shutterDownOid',
                        label: 'shutter_down_oid',
                        type: 'id',
                        tooltip: 'shutter_down_oid_tooltip',
                    },
                    {
                        name: 'shutterStopOid',
                        label: 'shutter_stop_oid',
                        type: 'id',
                        tooltip: 'shutter_stop_oid_tooltip',
                    },

                    // Rolladen-Config
                    {
                        name: 'shutterInvert',
                        label: 'shutter_invert',
                        type: 'checkbox',
                        default: false,
                        tooltip: 'shutter_invert_tooltip',
                    },
                    {
                        name: 'shutterMin',
                        label: 'shutter_min',
                        type: 'number',
                        default: 0,
                        tooltip: 'shutter_min_tooltip',
                    },
                    {
                        name: 'shutterMax',
                        label: 'shutter_max',
                        type: 'number',
                        default: 100,
                        tooltip: 'shutter_max_tooltip',
                    },
                    {
                        name: 'shutterUpValue',
                        label: 'shutter_up_value',
                        type: 'number',
                        default: 0,
                        tooltip: 'shutter_up_value_tooltip',
                    },
                    {
                        name: 'shutterDownValue',
                        label: 'shutter_down_value',
                        type: 'number',
                        default: 1,
                        tooltip: 'shutter_down_value_tooltip',
                    },
                    {
                        name: 'shutterStopValue',
                        label: 'shutter_stop_value',
                        type: 'number',
                        default: 1,
                        tooltip: 'shutter_stop_value_tooltip',
                    },

                    // Fenster
                    {
                        name: 'windowPaneCount',
                        label: 'window_pane_count',
                        type: 'number',
                        default: 1,
                        min: 1,
                        max: 20,
                        tooltip: 'window_pane_count_tooltip',
                    },

                    // Display Settings
                    {
                        name: 'iconRotation',
                        label: 'window_orientation',
                        type: 'number',
                        default: 0,
                        tooltip: 'window_orientation_tooltip',
                    },
                ],
            },

            // --- WINDOW PANES (Dynamic) ---
            {
                name: 'windowPane',
                label: 'window_pane',
                hidden: 'data.mode !== "window_shutter"',
                indexFrom: 1,
                indexTo: 'windowPaneCount',
                fields: [
                    {
                        name: 'openOid',
                        label: 'window_pane_open_oid',
                        type: 'id',
                        tooltip: 'window_pane_open_oid_tooltip',
                        noInit: true,
                        default: '',
                    },
                    {
                        name: 'tiltOid',
                        label: 'window_pane_tilt_oid',
                        type: 'id',
                        tooltip: 'window_pane_tilt_oid_tooltip',
                        noInit: true,
                        default: '',
                    },
                    {
                        name: 'sensorMode',
                        label: 'window_pane_sensor_mode',
                        type: 'select',
                        options: [
                            { value: 'oneOid', label: 'window_pane_sensor_mode_one_oid' },
                            { value: 'oneOidWithTilt', label: 'window_pane_sensor_mode_one_oid_with_tilt' },
                            { value: 'twoOids', label: 'window_pane_sensor_mode_two_oids' },
                        ],
                        default: 'oneOid',
                        tooltip: 'window_pane_sensor_mode_tooltip',
                    },
                    {
                        name: 'hingeType',
                        label: 'window_pane_hinge_type',
                        type: 'select',
                        options: [
                            { value: 'left', label: 'window_pane_hinge_left' },
                            { value: 'right', label: 'window_pane_hinge_right' },
                            { value: 'top', label: 'window_pane_hinge_top' },
                        ],
                        default: 'left',
                        tooltip: 'window_pane_hinge_type_tooltip',
                    },
                    {
                        name: 'ratio',
                        label: 'window_pane_ratio',
                        type: 'slider',
                        min: 0.1,
                        max: 4,
                        step: 0.1,
                        default: 1,
                        tooltip: 'window_pane_ratio_tooltip',
                    },
                ],
            },

            // --- WINDOW SHUTTER COLORS ---
            {
                name: 'window_shutter_colors',
                label: 'deluxe_window_shutter_colors',
                hidden: 'data.mode !== "window_shutter"',
                fields: [
                    {
                        name: 'windowFrameColor',
                        label: 'window_frame_color',
                        type: 'color',
                        default: '#555555',
                    },
                    {
                        name: 'windowPaneClosedColor',
                        label: 'window_pane_closed_color',
                        type: 'color',
                        default: '#999999',
                    },
                    {
                        name: 'windowPaneOpenColor',
                        label: 'window_pane_open_color',
                        type: 'color',
                        default: '#FFC107',
                    },
                    {
                        name: 'windowPaneTiltColor',
                        label: 'window_pane_tilt_color',
                        type: 'color',
                        default: '#FF9800',
                    },
                    {
                        name: 'windowShutterColor',
                        label: 'window_shutter_color',
                        type: 'color',
                        default: '#666666',
                    },
                    {
                        name: 'windowBackgroundColorClosed',
                        label: 'window_background_closed',
                        type: 'color',
                        default: '#E0E0E0',
                    },
                    {
                        name: 'windowBackgroundColorActive',
                        label: 'window_background_active',
                        type: 'color',
                        default: '#FFEB3B',
                    },
                ],
            },

            // --- NUMERIC DISPLAY MODE ---
            {
                name: 'mode_numeric_display',
                label: 'deluxe_numeric_display_settings',
                hidden: 'data.mode !== "numeric_display"',
                fields: [
                    {
                        name: 'numericDisplayValueOid',
                        label: 'numeric_display_value_oid',
                        type: 'id',
                        tooltip: 'numeric_display_value_oid_tooltip',
                    },
                    {
                        name: 'numericDisplayDecimals',
                        label: 'numeric_display_decimals',
                        type: 'number',
                        default: 0,
                        min: 0,
                        max: 5,
                    },
                    {
                        name: 'numericDisplayDecimalMode',
                        label: 'numeric_display_decimal_mode',
                        type: 'select',
                        default: 'round',
                        options: [
                            { value: 'round', label: 'numeric_display_decimal_mode_round' },
                            { value: 'floor', label: 'numeric_display_decimal_mode_floor' },
                            { value: 'ceil', label: 'numeric_display_decimal_mode_ceil' },
                            { value: 'trunc', label: 'numeric_display_decimal_mode_trunc' },
                        ],
                    },
                    {
                        name: 'numericDisplayDecimalSeparator',
                        label: 'numeric_display_decimal_separator',
                        type: 'select',
                        default: '.',
                        options: [
                            { value: '.', label: 'numeric_display_separator_dot' },
                            { value: ',', label: 'numeric_display_separator_comma' },
                        ],
                    },
                    {
                        name: 'numericDisplayThousandSeparator',
                        label: 'numeric_display_thousand_separator',
                        type: 'select',
                        default: 'none',
                        options: [
                            { value: 'none', label: 'numeric_display_separator_none' },
                            { value: '.', label: 'numeric_display_separator_dot' },
                            { value: ',', label: 'numeric_display_separator_comma' },
                            { value: "'", label: 'numeric_display_separator_apostrophe' },
                            { value: ' ', label: 'numeric_display_separator_space' },
                        ],
                    },
                    {
                        name: 'numericDisplayUnit',
                        label: 'numeric_display_unit',
                        type: 'text',
                        default: '',
                        tooltip: 'numeric_display_unit_tooltip',
                    },
                    {
                        name: 'numericDisplayPrefix',
                        label: 'numeric_display_prefix',
                        type: 'text',
                        default: '',
                    },
                    {
                        name: 'numericDisplaySuffix',
                        label: 'numeric_display_suffix',
                        type: 'text',
                        default: '',
                    },
                    {
                        name: 'numericDisplayValueMapping',
                        label: 'numeric_display_value_mapping',
                        type: 'text',
                        default: '',
                        tooltip: 'numeric_display_value_mapping_tooltip',
                    },
                ],
            },

            // --- NUMERIC DISPLAY COLOR THRESHOLDS ---
            {
                name: 'mode_numeric_display_thresholds',
                label: 'deluxe_numeric_display_thresholds',
                hidden: 'data.mode !== "numeric_display"',
                fields: [
                    {
                        name: 'numericDisplayUseColorThresholds',
                        label: 'numeric_display_use_color_thresholds',
                        type: 'checkbox',
                        default: false,
                    },
                    {
                        name: 'numericDisplayThresholdLow',
                        label: 'numeric_display_threshold_low',
                        type: 'number',
                        default: 0,
                        hidden: (data: unknown) =>
                            !(data as OneIconToRuleThemAllRxData).numericDisplayUseColorThresholds,
                    },
                    {
                        name: 'numericDisplayThresholdHigh',
                        label: 'numeric_display_threshold_high',
                        type: 'number',
                        default: 100,
                        hidden: (data: unknown) =>
                            !(data as OneIconToRuleThemAllRxData).numericDisplayUseColorThresholds,
                    },
                    {
                        name: 'numericDisplayColorLow',
                        label: 'numeric_display_color_low',
                        type: 'color',
                        default: '#2196f3',
                        hidden: (data: unknown) =>
                            !(data as OneIconToRuleThemAllRxData).numericDisplayUseColorThresholds,
                    },
                    {
                        name: 'numericDisplayColorMedium',
                        label: 'numeric_display_color_medium',
                        type: 'color',
                        default: '#4caf50',
                        hidden: (data: unknown) =>
                            !(data as OneIconToRuleThemAllRxData).numericDisplayUseColorThresholds,
                    },
                    {
                        name: 'numericDisplayColorHigh',
                        label: 'numeric_display_color_high',
                        type: 'color',
                        default: '#f44336',
                        hidden: (data: unknown) =>
                            !(data as OneIconToRuleThemAllRxData).numericDisplayUseColorThresholds,
                    },
                ],
            },

            // --- STRING DISPLAY MODE ---
            {
                name: 'mode_string_display',
                label: 'deluxe_string_display_settings',
                hidden: 'data.mode !== "string_display"',
                fields: [
                    {
                        name: 'stringDisplayValueOid',
                        label: 'string_display_value_oid',
                        type: 'id',
                        tooltip: 'string_display_value_oid_tooltip',
                    },
                    {
                        name: 'stringDisplayMaxLength',
                        label: 'string_display_max_length',
                        type: 'number',
                        default: 50,
                        min: 1,
                        max: 200,
                    },
                    {
                        name: 'stringDisplayEllipsis',
                        label: 'string_display_ellipsis',
                        type: 'checkbox',
                        default: true,
                    },
                    {
                        name: 'stringDisplayTextTransform',
                        label: 'string_display_text_transform',
                        type: 'select',
                        default: 'none',
                        options: [
                            { value: 'none', label: 'string_display_transform_none' },
                            { value: 'uppercase', label: 'string_display_transform_uppercase' },
                            { value: 'lowercase', label: 'string_display_transform_lowercase' },
                            { value: 'capitalize', label: 'string_display_transform_capitalize' },
                        ],
                    },
                    {
                        name: 'stringDisplayPrefix',
                        label: 'string_display_prefix',
                        type: 'text',
                        default: '',
                    },
                    {
                        name: 'stringDisplaySuffix',
                        label: 'string_display_suffix',
                        type: 'text',
                        default: '',
                    },
                    {
                        name: 'stringDisplayValueMapping',
                        label: 'string_display_value_mapping',
                        type: 'text',
                        default: '',
                        tooltip: 'string_display_value_mapping_tooltip',
                    },
                ],
            },

            // --- DISPLAY MODE COMMON SETTINGS ---
            {
                name: 'display_common',
                label: 'deluxe_display_common_settings',
                hidden: 'data.mode !== "numeric_display" && data.mode !== "string_display"',
                fields: [
                    {
                        name: 'displayIconPosition',
                        label: 'display_icon_position',
                        type: 'select',
                        default: 'top',
                        options: [
                            { value: 'top', label: 'display_icon_position_top' },
                            { value: 'bottom', label: 'display_icon_position_bottom' },
                            { value: 'left', label: 'display_icon_position_left' },
                            { value: 'right', label: 'display_icon_position_right' },
                        ],
                    },
                    {
                        name: 'displayClickAction',
                        label: 'display_click_action',
                        type: 'select',
                        default: 'none',
                        options: [
                            { value: 'none', label: 'display_click_action_none' },
                            { value: 'navigate', label: 'display_click_action_navigate' },
                        ],
                    },
                    {
                        name: 'displayTargetView',
                        label: 'display_target_view',
                        type: 'views',
                        default: '',
                        hidden: (data: unknown) =>
                            (data as OneIconToRuleThemAllRxData).displayClickAction !== 'navigate',
                    },
                    {
                        name: 'displayValueFontSize',
                        label: 'display_value_font_size',
                        type: 'number',
                        default: 14,
                        min: 8,
                        max: 48,
                    },
                    {
                        name: 'displayIconTextGap',
                        label: 'display_icon_text_gap',
                        type: 'number',
                        default: 8,
                        min: 0,
                        max: 50,
                        tooltip: 'display_icon_text_gap_tooltip',
                    },
                ],
            },

            // ================================================
            // GROUP 3: ICON SETTINGS (Hidden for window_shutter)
            // ================================================
            {
                name: 'icon',
                label: 'deluxe_icon_settings',
                hidden: 'data.mode === "window_shutter"',
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
                        name: 'iconRotation',
                        label: 'icon_rotation',
                        type: 'number',
                        default: 0,
                        tooltip: 'icon_rotation_tooltip',
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
                        default: 'rgba(48,142,134,1)',
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
