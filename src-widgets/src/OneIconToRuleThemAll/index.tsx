import React from 'react';
import type { RxRenderWidgetProps, RxWidgetInfo, VisRxWidgetProps } from '@iobroker/types-vis-2';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

import Generic from '../Generic';
import { FlexMode, type OneIconToRuleThemAllRxData, type OneIconToRuleThemAllState } from './types';
import { HeatingModeLogic } from './modes/HeatingMode';
import { DimmerModeLogic } from './modes/DimmerMode';
import { SwitchModeLogic } from './modes/SwitchMode';
import { HeatingDialog } from './components/HeatingDialog';
import { DimmerDialog } from './components/DimmerDialog';
import { IconWithStatus } from './components/IconWithStatus';
import { CardWrapper } from './components/CardWrapper';
import { getWidgetInfo } from './config/widgetInfo';

class OneIconToRuleThemAll extends Generic<OneIconToRuleThemAllRxData, OneIconToRuleThemAllState> {
    // Mode logic instances
    private heatingMode!: HeatingModeLogic;
    private dimmerMode!: DimmerModeLogic;
    private switchMode!: SwitchModeLogic;

    constructor(props: VisRxWidgetProps) {
        super(props);
        this.state = {
            ...this.state,
            dialog: false,
            oidName: null,
            heating: {
                setpointValue: null,
                valveValue: null,
                currentMode: null,
            },
            dimmer: {
                localValue: 0,
                isChanging: false,
            },
            switch: {
                isOn: false,
            },
        };

        this.initializeModes();
    }

    // ========================================
    // INITIALIZATION
    // ========================================

    private initializeModes(): void {
        this.heatingMode = new HeatingModeLogic(
            {
                setpointShiftOid: this.state.rxData.heatingSetpointShiftOid,
                setpointIncreaseValue: this.state.rxData.heatingSetpointIncreaseValue,
                setpointDecreaseValue: this.state.rxData.heatingSetpointDecreaseValue,
                valvePositionOid: this.state.rxData.heatingValvePositionOid,
                setpointOid: this.state.rxData.heatingSetpointOid,
                modeStatusOid: this.state.rxData.heatingModeStatusOid,
                modeControlOid: this.state.rxData.heatingModeControlOid,
                modesConfig: this.state.rxData.heatingModesConfig,
                showUnits: this.state.rxData.heatingShowUnits,
            },
            this.props.context.socket,
            updates => this.setState({ heating: { ...this.state.heating, ...updates } }),
            (oid, value) => this.props.context.setValue(oid, value as string | number | boolean | null),
        );

        this.dimmerMode = new DimmerModeLogic(
            {
                controlOid: this.state.rxData.controlOid,
                minValue: this.state.rxData.dimmerMinValue,
                maxValue: this.state.rxData.dimmerMaxValue,
                step: this.state.rxData.dimmerStep,
            },
            this.props.context.socket,
            updates => this.setState({ dimmer: { ...this.state.dimmer, ...updates } }),
            (oid, value) => this.props.context.setValue(oid, value as string | number | boolean | null),
        );

        this.switchMode = new SwitchModeLogic(
            {
                controlOid: this.state.rxData.controlOid,
                onValue: this.state.rxData.switchOnValue,
                offValue: this.state.rxData.switchOffValue,
            },
            this.props.context.socket,
            updates => this.setState({ switch: { ...this.state.switch, ...updates } }),
            (oid, value) => this.props.context.setValue(oid, value as string | number | boolean | null),
        );
    }

    // ========================================
    // WIDGET INFO
    // ========================================

    static getWidgetInfo(): RxWidgetInfo {
        return getWidgetInfo();
    }

    getWidgetInfo(): RxWidgetInfo {
        return OneIconToRuleThemAll.getWidgetInfo();
    }

    // ========================================
    // LIFECYCLE
    // ========================================

    async componentDidMount(): Promise<void> {
        super.componentDidMount();

        // Initialize mode-specific logic
        switch (this.state.rxData.mode) {
            case FlexMode.HEATING_KNX:
                await this.heatingMode.initialize();
                break;

            case FlexMode.DIMMER_DIALOG:
                await this.dimmerMode.initialize();
                break;

            case FlexMode.SWITCH:
                await this.switchMode.initialize();
                break;
        }

        // Fetch OID name for dialog title
        await this.fetchOidName();
    }

    componentDidUpdate(): void {
        // Handle mode-specific state updates
        switch (this.state.rxData.mode) {
            case FlexMode.HEATING_KNX:
                if (this.state.rxData.heatingSetpointOid) {
                    const setpointValue = this.getPropertyValue('heatingSetpointOid');
                    if (setpointValue !== null && setpointValue !== undefined) {
                        const numValue = Number(setpointValue);
                        if (numValue !== this.state.heating.setpointValue) {
                            this.setState({ heating: { ...this.state.heating, setpointValue: numValue } });
                        }
                    }
                }
                if (this.state.rxData.heatingValvePositionOid) {
                    const valveValue = this.getPropertyValue('heatingValvePositionOid');
                    if (valveValue !== null && valveValue !== undefined) {
                        const numValue = Number(valveValue);
                        if (numValue !== this.state.heating.valveValue) {
                            this.setState({ heating: { ...this.state.heating, valveValue: numValue } });
                        }
                    }
                }
                if (this.state.rxData.heatingModeStatusOid) {
                    const modeValue = this.getPropertyValue('heatingModeStatusOid');
                    if (modeValue !== null && modeValue !== undefined) {
                        const numValue = Number(modeValue);
                        if (numValue !== this.state.heating.currentMode) {
                            this.setState({ heating: { ...this.state.heating, currentMode: numValue } });
                        }
                    }
                }
                break;

            case FlexMode.DIMMER_DIALOG:
                if (this.state.rxData.controlOid && !this.state.dimmer.isChanging) {
                    const value = this.getPropertyValue('controlOid');
                    if (value !== null && value !== undefined) {
                        const numValue = Number(value) || 0;
                        if (numValue !== this.state.dimmer.localValue) {
                            this.setState({ dimmer: { ...this.state.dimmer, localValue: numValue } });
                        }
                    }
                }
                break;

            case FlexMode.SWITCH:
                if (this.state.rxData.controlOid) {
                    const value = this.getPropertyValue('controlOid');
                    const isOn = this.switchMode['checkIsOn'](value);
                    if (isOn !== this.state.switch.isOn) {
                        this.setState({ switch: { ...this.state.switch, isOn } });
                    }
                }
                break;
        }
    }

    componentWillUnmount(): void {
        // Cleanup dimmer timeout
        this.dimmerMode.destroy();
    }

    // ========================================
    // HELPERS
    // ========================================

    private async fetchOidName(): Promise<void> {
        const oid = this.state.rxData.controlOid || this.state.rxData.heatingSetpointOid;
        if (!oid) {
            return;
        }

        try {
            const obj = await this.props.context.socket.getObject(oid);
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

    // ========================================
    // EVENT HANDLERS
    // ========================================

    private handleClick = (): void => {
        if (this.state.editMode) {
            return;
        }

        switch (this.state.rxData.mode) {
            case FlexMode.DIMMER_DIALOG:
            case FlexMode.HEATING_KNX:
                this.setState({ dialog: true });
                break;

            case FlexMode.SWITCH:
                this.switchMode.toggle(this.state.switch.isOn, this.state.editMode);
                break;
        }
    };

    private handleDialogClose = (): void => {
        this.setState({ dialog: false });
    };

    // ========================================
    // RENDER HELPERS
    // ========================================

    private getIsActive(): boolean {
        switch (this.state.rxData.mode) {
            case FlexMode.HEATING_KNX:
                return this.heatingMode.isActive(this.state.heating.setpointValue, this.state.heating.valveValue);
            case FlexMode.DIMMER_DIALOG:
                return this.dimmerMode.isActive(this.state.dimmer.localValue);
            case FlexMode.SWITCH:
                return this.switchMode.isActive(this.state.switch.isOn);
            default:
                return false;
        }
    }

    private getTopText(): string | undefined {
        if (this.state.rxData.mode === FlexMode.HEATING_KNX) {
            return this.heatingMode.formatTemperature(this.state.heating.setpointValue);
        }
        return undefined;
    }

    private getBottomText(): string | undefined {
        switch (this.state.rxData.mode) {
            case FlexMode.HEATING_KNX:
                return this.heatingMode.formatValvePosition(this.state.heating.valveValue);
            case FlexMode.DIMMER_DIALOG:
                if (this.state.rxData.showPercentage) {
                    return `${Math.round(this.state.dimmer.localValue)}%`;
                }
                break;
            case FlexMode.SWITCH:
                if (this.state.rxData.showStatusText) {
                    return this.state.switch.isOn
                        ? this.state.rxData.statusOnText || 'ON'
                        : this.state.rxData.statusOffText || 'OFF';
                }
                break;
        }
        return undefined;
    }

    private renderDialogContent(): React.JSX.Element {
        const primaryColor = this.state.rxData.dialogPrimaryColor || '#2196F3';

        switch (this.state.rxData.mode) {
            case FlexMode.HEATING_KNX:
                return (
                    <HeatingDialog
                        setpointValue={this.state.heating.setpointValue}
                        valveValue={this.state.heating.valveValue}
                        currentMode={this.state.heating.currentMode}
                        modes={this.heatingMode.getModes()}
                        controlType={this.state.rxData.heatingModeControlType || 'button'}
                        primaryColor={primaryColor}
                        formatTemperature={v => this.heatingMode.formatTemperature(v)}
                        formatValvePosition={v => this.heatingMode.formatValvePosition(v)}
                        getCurrentModeName={m => this.heatingMode.getCurrentModeName(m)}
                        onIncrease={() => this.heatingMode.handleIncrease(this.state.editMode)}
                        onDecrease={() => this.heatingMode.handleDecrease(this.state.editMode)}
                        onModeSwitch={() =>
                            this.heatingMode.handleModeSwitch(this.state.heating.currentMode, this.state.editMode)
                        }
                        onModeSelect={v => this.heatingMode.handleModeSelect(v, this.state.editMode)}
                    />
                );

            case FlexMode.DIMMER_DIALOG:
                return (
                    <DimmerDialog
                        localValue={this.state.dimmer.localValue}
                        minValue={this.state.rxData.dimmerMinValue ?? 0}
                        maxValue={this.state.rxData.dimmerMaxValue ?? 100}
                        step={this.state.rxData.dimmerStep ?? 1}
                        showQuickButtons={this.state.rxData.dimmerShowQuickButtons ?? true}
                        primaryColor={primaryColor}
                        onChange={(_e, value) => this.dimmerMode.handleDimmerChange(value, this.state.editMode)}
                        onChangeCommitted={(_e, value) =>
                            this.dimmerMode.handleDimmerChangeCommitted(value, this.state.editMode)
                        }
                        onQuickSet={value => this.dimmerMode.handleQuickSet(value, this.state.editMode)}
                    />
                );

            default:
                return <></>;
        }
    }

    // ========================================
    // MAIN RENDER
    // ========================================

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);

        const titleColor = this.state.rxData.dialogTitleColor;
        const backgroundColor = this.state.rxData.dialogBackgroundColor;
        const dialogWidth = this.state.rxData.dialogWidth || 'xs';

        const widthConstraints = {
            xs: { minWidth: 320, maxWidth: 400 },
            sm: { minWidth: 400, maxWidth: 500 },
            md: { minWidth: 500, maxWidth: 650 },
        };

        return (
            <CardWrapper
                showCard={this.state.rxData.showCard}
                backgroundColor={this.state.rxData.cardBackgroundColor}
                borderRadiusTL={this.state.rxData.cardBorderRadiusTL}
                borderRadiusTR={this.state.rxData.cardBorderRadiusTR}
                borderRadiusBL={this.state.rxData.cardBorderRadiusBL}
                borderRadiusBR={this.state.rxData.cardBorderRadiusBR}
                usedInWidget={props.widget.usedInWidget}
            >
                <IconWithStatus
                    icon={this.state.rxData.icon}
                    iconInactive={this.state.rxData.iconInactive}
                    useDifferentInactiveIcon={this.state.rxData.useDifferentInactiveIcon}
                    iconSize={this.state.rxData.iconSize}
                    activeColor={this.state.rxData.activeColor}
                    inactiveColor={this.state.rxData.inactiveColor}
                    isActive={this.getIsActive()}
                    onClick={this.handleClick}
                    editMode={this.state.editMode}
                    topText={this.getTopText()}
                    bottomText={this.getBottomText()}
                    statusFontSize={this.state.rxData.statusFontSize}
                />

                {this.state.dialog && (
                    <Dialog
                        fullWidth
                        maxWidth={dialogWidth}
                        open={true}
                        onClose={this.handleDialogClose}
                        sx={{
                            '& .MuiDialog-paper': {
                                ...widthConstraints[dialogWidth],
                                ...(backgroundColor ? { backgroundColor } : {}),
                            },
                        }}
                    >
                        <DialogTitle
                            sx={{
                                ...(titleColor ? { color: titleColor } : {}),
                            }}
                        >
                            {this.state.rxData.dialogTitle || this.state.oidName || 'Control'}
                            <IconButton
                                sx={{
                                    position: 'absolute',
                                    right: 8,
                                    top: 8,
                                    ...(titleColor ? { color: titleColor } : {}),
                                }}
                                onClick={this.handleDialogClose}
                            >
                                <Close />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent>{this.renderDialogContent()}</DialogContent>
                    </Dialog>
                )}
            </CardWrapper>
        );
    }
}

export default OneIconToRuleThemAll;
