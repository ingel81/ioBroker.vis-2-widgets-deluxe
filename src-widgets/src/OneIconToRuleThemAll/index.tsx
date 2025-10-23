import React from 'react';
import type { RxRenderWidgetProps, RxWidgetInfo, VisRxWidgetProps } from '@iobroker/types-vis-2';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

import Generic from '../Generic';
import { FlexMode, type OneIconToRuleThemAllRxData, type OneIconToRuleThemAllState } from './types';
import { HeatingModeLogic } from './modes/HeatingMode';
import { DimmerModeLogic } from './modes/DimmerMode';
import { SwitchModeLogic } from './modes/SwitchMode';
import { WindowShutterModeLogic } from './modes/WindowShutterMode';
import { HeatingDialog } from './components/HeatingDialog';
import { DimmerDialog } from './components/DimmerDialog';
import { WindowShutterDialog } from './components/WindowShutterDialog';
import { IconWithStatus } from './components/IconWithStatus';
import { WindowShutterIcon } from './components/WindowShutterIcon';
import { CardWrapper } from './components/CardWrapper';
import { getWidgetInfo } from './config/widgetInfo';
import translations from '../translations';

class OneIconToRuleThemAll extends Generic<OneIconToRuleThemAllRxData, OneIconToRuleThemAllState> {
    // Mode logic instances
    private heatingMode!: HeatingModeLogic;
    private dimmerMode!: DimmerModeLogic;
    private switchMode!: SwitchModeLogic;
    private windowShutterMode!: WindowShutterModeLogic;

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
            windowShutter: {
                shutterPosition: null,
                paneStates: [],
                hasOpenPanes: false,
                hasTiltedPanes: false,
            },
        };

        this.initializeModes();
    }

    // ========================================
    // INITIALIZATION
    // ========================================

    /**
     * Build pane configs from rxData
     */
    private buildPaneConfigs(): {
        paneCount: number;
        paneConfigs: Array<{
            openOid?: string;
            tiltOid?: string;
            sensorMode: 'twoOids' | 'oneOid' | 'oneOidWithTilt';
            hingeType: 'left' | 'right' | 'top';
            ratio: number;
        }>;
    } {
        const paneCount = this.state.rxData.windowPaneCount || 1;
        const paneConfigs = [];

        // Debug: Show all windowPane keys in rxData
        const windowPaneKeys = Object.keys(this.state.rxData).filter(key => key.startsWith('windowPane'));
        console.log('[buildPaneConfigs] All windowPane keys in rxData:', windowPaneKeys);

        for (let i = 1; i <= paneCount; i++) {
            // Important: Fields from indexFrom/indexTo groups are named: {fieldName}{index}
            // NOT {groupName}{index}_{fieldName}
            const ratio = (this.state.rxData[`ratio${i}`] as number) ?? 1;
            console.log(`[buildPaneConfigs] Pane ${i}: ratio${i} =`, this.state.rxData[`ratio${i}`], '→', ratio);
            paneConfigs.push({
                openOid: this.state.rxData[`openOid${i}`] as string | undefined,
                tiltOid: this.state.rxData[`tiltOid${i}`] as string | undefined,
                sensorMode:
                    (this.state.rxData[`sensorMode${i}`] as 'twoOids' | 'oneOid' | 'oneOidWithTilt') || 'oneOid',
                hingeType: (this.state.rxData[`hingeType${i}`] as 'left' | 'right' | 'top') || 'left',
                ratio,
            });
        }
        console.log('[buildPaneConfigs] Final paneConfigs:', paneConfigs);
        return { paneCount, paneConfigs };
    }

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

        const { paneCount, paneConfigs } = this.buildPaneConfigs();

        this.windowShutterMode = new WindowShutterModeLogic(
            {
                shutterPositionOid: this.state.rxData.shutterPositionOid,
                shutterUpOid: this.state.rxData.shutterUpOid,
                shutterDownOid: this.state.rxData.shutterDownOid,
                shutterStopOid: this.state.rxData.shutterStopOid,
                shutterInvert: this.state.rxData.shutterInvert,
                shutterMin: this.state.rxData.shutterMin,
                shutterMax: this.state.rxData.shutterMax,
                windowPaneCount: paneCount,
                paneConfigs,
            },
            this.props.context.socket,
            updates => this.setState({ windowShutter: { ...this.state.windowShutter, ...updates } }),
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

            case FlexMode.WINDOW_SHUTTER:
                await this.windowShutterMode.initialize();
                break;
        }

        // Fetch OID name for dialog title
        await this.fetchOidName();
    }

    componentDidUpdate(prevProps: VisRxWidgetProps, prevState: OneIconToRuleThemAllState): void {
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

            case FlexMode.WINDOW_SHUTTER: {
                // Check if window shutter configuration changed
                const prevRxData = prevState.rxData as unknown as OneIconToRuleThemAllRxData;
                const configChanged =
                    this.state.rxData.windowPaneCount !== prevRxData.windowPaneCount ||
                    this.state.rxData.shutterPositionOid !== prevRxData.shutterPositionOid ||
                    this.state.rxData.shutterInvert !== prevRxData.shutterInvert ||
                    this.state.rxData.shutterMin !== prevRxData.shutterMin ||
                    this.state.rxData.shutterMax !== prevRxData.shutterMax;

                console.log('[componentDidUpdate] WINDOW_SHUTTER configChanged:', configChanged);

                // Check if any pane config changed
                let paneConfigChanged = false;
                if (!configChanged) {
                    const paneCount = this.state.rxData.windowPaneCount || 1;
                    for (let i = 1; i <= paneCount; i++) {
                        const ratioChanged = this.state.rxData[`ratio${i}`] !== prevRxData[`ratio${i}`];
                        if (ratioChanged) {
                            console.log(
                                `[componentDidUpdate] ratio${i} changed:`,
                                prevRxData[`ratio${i}`],
                                '→',
                                this.state.rxData[`ratio${i}`],
                            );
                        }
                        if (
                            this.state.rxData[`openOid${i}`] !== prevRxData[`openOid${i}`] ||
                            this.state.rxData[`tiltOid${i}`] !== prevRxData[`tiltOid${i}`] ||
                            this.state.rxData[`sensorMode${i}`] !== prevRxData[`sensorMode${i}`] ||
                            this.state.rxData[`hingeType${i}`] !== prevRxData[`hingeType${i}`] ||
                            ratioChanged
                        ) {
                            paneConfigChanged = true;
                            break;
                        }
                    }
                }

                console.log('[componentDidUpdate] paneConfigChanged:', paneConfigChanged);

                // Reinitialize window shutter mode if config changed
                if (configChanged || paneConfigChanged) {
                    console.log('[componentDidUpdate] Reinitializing windowShutterMode...');
                    const { paneCount, paneConfigs } = this.buildPaneConfigs();
                    this.windowShutterMode = new WindowShutterModeLogic(
                        {
                            shutterPositionOid: this.state.rxData.shutterPositionOid,
                            shutterUpOid: this.state.rxData.shutterUpOid,
                            shutterDownOid: this.state.rxData.shutterDownOid,
                            shutterStopOid: this.state.rxData.shutterStopOid,
                            shutterInvert: this.state.rxData.shutterInvert,
                            shutterMin: this.state.rxData.shutterMin,
                            shutterMax: this.state.rxData.shutterMax,
                            windowPaneCount: paneCount,
                            paneConfigs,
                        },
                        this.props.context.socket,
                        updates => {
                            console.log('[windowShutterMode setState callback] updates:', updates);
                            this.setState({ windowShutter: { ...this.state.windowShutter, ...updates } });
                        },
                        (oid, value) => this.props.context.setValue(oid, value as string | number | boolean | null),
                    );
                    // Re-initialize to load new values from ioBroker
                    void this.windowShutterMode.initialize().then(() => {
                        // Force paneStates recalculation even in edit mode (no OIDs)
                        const paneStates = paneConfigs.map(config => ({
                            state: 'closed' as const,
                            ratio: config.ratio,
                            hinge: config.hingeType,
                        }));
                        console.log('[componentDidUpdate] Setting new paneStates:', paneStates);
                        this.setState({
                            windowShutter: {
                                ...this.state.windowShutter,
                                paneStates,
                            },
                        });
                    });
                } else {
                    // No config change - check for OID value changes
                    // 1. Check shutter position
                    if (this.state.rxData.shutterPositionOid) {
                        const positionValue = this.getPropertyValue('shutterPositionOid');
                        if (positionValue !== null && positionValue !== undefined) {
                            const numValue = Number(positionValue);
                            // Normalize using shutterMin/Max/Invert
                            const min = this.state.rxData.shutterMin ?? 0;
                            const max = this.state.rxData.shutterMax ?? 100;
                            let normalized = ((numValue - min) / (max - min)) * 100;
                            if (this.state.rxData.shutterInvert) {
                                normalized = 100 - normalized;
                            }
                            normalized = Math.max(0, Math.min(100, normalized));

                            if (normalized !== this.state.windowShutter.shutterPosition) {
                                console.log(
                                    '[componentDidUpdate] Shutter position changed:',
                                    numValue,
                                    '→ normalized:',
                                    normalized,
                                );
                                this.setState({
                                    windowShutter: { ...this.state.windowShutter, shutterPosition: normalized },
                                });
                            }
                        }
                    }

                    // 2. Check pane states (open/tilt sensors)
                    const paneCount = this.state.rxData.windowPaneCount || 1;
                    let anyPaneStateChanged = false;
                    const newPaneStates = [];

                    for (let i = 1; i <= paneCount; i++) {
                        const openOidKey = `openOid${i}`;
                        const tiltOidKey = `tiltOid${i}`;
                        const sensorMode =
                            (this.state.rxData[`sensorMode${i}`] as 'twoOids' | 'oneOid' | 'oneOidWithTilt') ||
                            'oneOid';
                        const hingeType = (this.state.rxData[`hingeType${i}`] as 'left' | 'right' | 'top') || 'left';
                        const ratio = (this.state.rxData[`ratio${i}`] as number) ?? 1;

                        let state: 'closed' | 'open' | 'tilt' = 'closed';

                        if (sensorMode === 'twoOids') {
                            // Two separate OIDs for open and tilt
                            const openValue = this.state.rxData[openOidKey] ? this.getPropertyValue(openOidKey) : false;
                            const tiltValue = this.state.rxData[tiltOidKey] ? this.getPropertyValue(tiltOidKey) : false;

                            if (this.toBool(openValue)) {
                                state = 'open';
                            } else if (this.toBool(tiltValue)) {
                                state = 'tilt';
                            }
                            console.log(
                                `[componentDidUpdate] Pane ${i} (twoOids): open=${String(openValue)}, tilt=${String(tiltValue)} → ${state}`,
                            );
                        } else if (sensorMode === 'oneOidWithTilt') {
                            // One OID with numeric values: 0=closed, 1=tilted, 2=open
                            const value = this.state.rxData[openOidKey] ? this.getPropertyValue(openOidKey) : 0;
                            const numValue = Number(value);

                            if (numValue >= 2) {
                                state = 'open';
                            } else if (numValue >= 1) {
                                state = 'tilt';
                            }
                            console.log(
                                `[componentDidUpdate] Pane ${i} (oneOidWithTilt): value=${numValue} → ${state}`,
                            );
                        } else {
                            // One OID binary: 0=closed, 1=open
                            const value = this.state.rxData[openOidKey] ? this.getPropertyValue(openOidKey) : false;
                            state = this.toBool(value) ? 'open' : 'closed';
                            console.log(`[componentDidUpdate] Pane ${i} (oneOid): value=${String(value)} → ${state}`);
                        }

                        newPaneStates.push({ state, ratio, hinge: hingeType });

                        // Check if this pane's state changed
                        const oldState = this.state.windowShutter.paneStates?.[i - 1];
                        if (!oldState || oldState.state !== state) {
                            anyPaneStateChanged = true;
                        }
                    }

                    if (anyPaneStateChanged) {
                        console.log('[componentDidUpdate] Pane states changed:', newPaneStates);
                        const hasOpenPanes = newPaneStates.some(p => p.state === 'open');
                        const hasTiltedPanes = newPaneStates.some(p => p.state === 'tilt');

                        this.setState({
                            windowShutter: {
                                ...this.state.windowShutter,
                                paneStates: newPaneStates,
                                hasOpenPanes,
                                hasTiltedPanes,
                            },
                        });
                    }
                }
                break;
            }
        }
    }

    componentWillUnmount(): void {
        // Cleanup dimmer timeout
        this.dimmerMode.destroy();
        // Cleanup window shutter mode
        this.windowShutterMode.destroy();
    }

    // ========================================
    // HELPERS
    // ========================================

    private translate(key: string): string {
        const lang = (this.props.context.lang || 'en') as 'en' | 'de';
        const prefix = translations.prefix || 'vis_2_widgets_deluxe_';
        const fullKey = `${prefix}${key}`;

        // Try to get translation for current language
        if (translations[lang] && typeof translations[lang] === 'object') {
            const value = (translations[lang] as Record<string, string>)[fullKey];
            if (value) {
                return value;
            }
        }

        // Fallback to English
        if (translations.en && typeof translations.en === 'object') {
            const value = (translations.en as Record<string, string>)[fullKey];
            if (value) {
                return value;
            }
        }

        // Return key if no translation found
        return key;
    }

    private toBool = (value: unknown): boolean => {
        if (typeof value === 'boolean') {
            return value;
        }
        if (typeof value === 'number') {
            return value > 0;
        }
        if (typeof value === 'string') {
            return value === 'true' || value === '1';
        }
        return false;
    };

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
            case FlexMode.WINDOW_SHUTTER:
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
            case FlexMode.WINDOW_SHUTTER:
                return this.windowShutterMode.isActive(this.state.windowShutter);
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
                        valveLabel={this.translate('heating_valve_label')}
                        operatingModeLabel={this.translate('heating_mode_label')}
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

            case FlexMode.WINDOW_SHUTTER:
                return (
                    <WindowShutterDialog
                        panes={this.state.windowShutter.paneStates}
                        shutterPosition={this.state.windowShutter.shutterPosition ?? 0}
                        shutterInvert={this.state.rxData.shutterInvert ?? false}
                        primaryColor={primaryColor}
                        paneClosedColor={this.state.rxData.windowPaneClosedColor || '#999999'}
                        paneOpenColor={this.state.rxData.windowPaneOpenColor || '#FFC107'}
                        paneTiltColor={this.state.rxData.windowPaneTiltColor || '#FF9800'}
                        onShutterChange={value => this.windowShutterMode.setShutterPosition(value)}
                        onShutterUp={
                            this.state.rxData.shutterUpOid || this.state.rxData.shutterPositionOid
                                ? () => this.windowShutterMode.shutterUp()
                                : undefined
                        }
                        onShutterDown={
                            this.state.rxData.shutterDownOid || this.state.rxData.shutterPositionOid
                                ? () => this.windowShutterMode.shutterDown()
                                : undefined
                        }
                        onShutterStop={
                            this.state.rxData.shutterStopOid ? () => this.windowShutterMode.shutterStop() : undefined
                        }
                        windowStatusLabel={this.translate('window_shutter_status')}
                        shutterLabel={this.translate('window_shutter_label')}
                        upLabel={this.translate('window_shutter_up')}
                        downLabel={this.translate('window_shutter_down')}
                        stopLabel={this.translate('window_shutter_stop')}
                        closedLabel={this.translate('window_pane_state_closed')}
                        tiltedLabel={this.translate('window_pane_state_tilted')}
                        openLabel={this.translate('window_pane_state_open')}
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
                {this.state.rxData.mode === FlexMode.WINDOW_SHUTTER ? (
                    <WindowShutterIcon
                        panes={this.state.windowShutter.paneStates}
                        shutterPosition={this.state.windowShutter.shutterPosition ?? 0}
                        iconRotation={this.state.rxData.iconRotation ?? 0}
                        frameColor={this.state.rxData.windowFrameColor || '#8B6F47'}
                        paneFrameColor={this.state.rxData.windowPaneFrameColor || '#999999'}
                        glassColor={this.state.rxData.windowGlassColor || '#87CEEB'}
                        handleColor={this.state.rxData.windowHandleColor || '#333333'}
                        paneOpenColor={this.state.rxData.windowPaneOpenColor || '#FFC107'}
                        paneTiltColor={this.state.rxData.windowPaneTiltColor || '#FF9800'}
                        shutterColor={this.state.rxData.windowShutterColor || '#666666'}
                        backgroundColor={this.state.rxData.windowBackgroundColorClosed || '#E0E0E0'}
                        onClick={this.handleClick}
                        editMode={this.state.editMode}
                    />
                ) : (
                    <IconWithStatus
                        icon={this.state.rxData.icon}
                        iconInactive={this.state.rxData.iconInactive}
                        useDifferentInactiveIcon={this.state.rxData.useDifferentInactiveIcon}
                        iconSize={this.state.rxData.iconSize}
                        iconRotation={this.state.rxData.iconRotation}
                        activeColor={this.state.rxData.activeColor}
                        inactiveColor={this.state.rxData.inactiveColor}
                        isActive={this.getIsActive()}
                        onClick={this.handleClick}
                        editMode={this.state.editMode}
                        topText={this.getTopText()}
                        bottomText={this.getBottomText()}
                        statusFontSize={this.state.rxData.statusFontSize}
                    />
                )}

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
