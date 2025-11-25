import React from 'react';
import type { RxRenderWidgetProps, RxWidgetInfo, VisRxWidgetProps } from '@iobroker/types-vis-2';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

import Generic from '../Generic';
import {
    FlexMode,
    IconPosition,
    ClickAction,
    type OneIconToRuleThemAllRxData,
    type OneIconToRuleThemAllState,
} from './types';
import { HeatingModeLogic } from './modes/HeatingMode';
import { DimmerModeLogic } from './modes/DimmerMode';
import { SwitchModeLogic } from './modes/SwitchMode';
import { WindowShutterModeLogic } from './modes/WindowShutterMode';
import { NumericDisplayModeLogic } from './modes/NumericDisplayMode';
import { StringDisplayModeLogic } from './modes/StringDisplayMode';
import { HeatingDialog } from './components/HeatingDialog';
import { DimmerDialog } from './components/DimmerDialog';
import { WindowShutterDialog } from './components/WindowShutterDialog';
import { IconWithStatus } from './components/IconWithStatus';
import { HorizontalDisplay } from './components/HorizontalDisplay';
import { VerticalDisplay } from './components/VerticalDisplay';
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
    private numericDisplayMode!: NumericDisplayModeLogic;
    private stringDisplayMode!: StringDisplayModeLogic;

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
            numericDisplay: {
                value: null,
                formattedValue: '--',
                currentColor: '',
            },
            stringDisplay: {
                value: null,
                formattedValue: '--',
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
                shutterUpValue: this.state.rxData.shutterUpValue,
                shutterDownValue: this.state.rxData.shutterDownValue,
                shutterStopValue: this.state.rxData.shutterStopValue,
                windowPaneCount: paneCount,
                paneConfigs,
            },
            this.props.context.socket,
            updates => this.setState({ windowShutter: { ...this.state.windowShutter, ...updates } }),
            (oid, value) => this.props.context.setValue(oid, value as string | number | boolean | null),
        );

        // NumericDisplayMode
        this.numericDisplayMode = new NumericDisplayModeLogic(
            {
                valueOid: this.state.rxData.numericDisplayValueOid,
                decimals: this.state.rxData.numericDisplayDecimals ?? 0,
                decimalMode: this.state.rxData.numericDisplayDecimalMode,
                decimalSeparator: this.state.rxData.numericDisplayDecimalSeparator,
                thousandSeparator: this.state.rxData.numericDisplayThousandSeparator,
                unit: this.state.rxData.numericDisplayUnit,
                prefix: this.state.rxData.numericDisplayPrefix,
                suffix: this.state.rxData.numericDisplaySuffix,
                useColorThresholds: this.state.rxData.numericDisplayUseColorThresholds ?? false,
                thresholdLow: this.state.rxData.numericDisplayThresholdLow,
                thresholdHigh: this.state.rxData.numericDisplayThresholdHigh,
                colorLow: this.state.rxData.numericDisplayColorLow,
                colorMedium: this.state.rxData.numericDisplayColorMedium,
                colorHigh: this.state.rxData.numericDisplayColorHigh,
                valueMapping: this.state.rxData.numericDisplayValueMapping,
            },
            this.props.context.socket,
            updates => this.setState({ numericDisplay: { ...this.state.numericDisplay, ...updates } }),
            (oid, value) => this.props.context.setValue(oid, value as string | number | boolean | null),
        );

        // StringDisplayMode
        this.stringDisplayMode = new StringDisplayModeLogic(
            {
                valueOid: this.state.rxData.stringDisplayValueOid,
                maxLength: this.state.rxData.stringDisplayMaxLength ?? 50,
                ellipsis: this.state.rxData.stringDisplayEllipsis ?? true,
                textTransform: this.state.rxData.stringDisplayTextTransform,
                prefix: this.state.rxData.stringDisplayPrefix,
                suffix: this.state.rxData.stringDisplaySuffix,
                valueMapping: this.state.rxData.stringDisplayValueMapping,
            },
            this.props.context.socket,
            updates => this.setState({ stringDisplay: { ...this.state.stringDisplay, ...updates } }),
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

            case FlexMode.NUMERIC_DISPLAY:
                await this.numericDisplayMode.initialize();
                break;

            case FlexMode.STRING_DISPLAY:
                await this.stringDisplayMode.initialize();
                break;
        }

        // Fetch OID name for dialog title
        await this.fetchOidName();
    }

    /**
     * Move dialog paper into visible viewport
     * Mobile: left-aligned with 10px padding
     * Desktop: centered with 40px padding
     */
    private moveDialogIntoView(): void {
        // Try multiple times with increasing delays
        const tryPositioning = (attempt: number): void => {
            const dialogPaper = document.querySelector('.MuiDialog-paper') as HTMLElement;
            if (!dialogPaper) {
                if (attempt < 5) {
                    setTimeout(() => tryPositioning(attempt + 1), 100 * attempt);
                } else {
                    console.warn('[moveDialogIntoView] ERROR: Dialog paper not found after 5 attempts');
                }
                return;
            }

            // Get viewport dimensions (visible area)
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Get body/document dimensions (total scrollable area)
            const bodyWidth = document.body.scrollWidth;
            const bodyHeight = document.body.scrollHeight;

            // Find the actual scroll container (vis-2 uses an inner container!)
            let scrollX = 0;
            let scrollY = 0;
            let scrollContainer: Element | null = null;

            // Find ALL scrollable elements, even if scrollTop is 0
            const allElements = Array.from(document.querySelectorAll('*'));
            for (const el of allElements) {
                const computedStyle = window.getComputedStyle(el);
                const isScrollable =
                    (computedStyle.overflowY === 'auto' ||
                        computedStyle.overflowY === 'scroll' ||
                        computedStyle.overflow === 'auto' ||
                        computedStyle.overflow === 'scroll') &&
                    el.scrollHeight > el.clientHeight;

                if (isScrollable) {
                    scrollContainer = el;
                    scrollX = el.scrollLeft;
                    scrollY = el.scrollTop;
                    console.log(
                        '[moveDialogIntoView] Found scrollable container: ' +
                            JSON.stringify({
                                element: el.tagName,
                                className: el.className,
                                scrollTop: el.scrollTop,
                                scrollHeight: el.scrollHeight,
                                clientHeight: el.clientHeight,
                            }),
                    );
                    break;
                }
            }

            // Fallback to window scroll
            if (!scrollContainer) {
                scrollX = window.scrollX || window.pageXOffset || document.documentElement.scrollLeft;
                scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
                console.log(
                    '[moveDialogIntoView] Using window scroll (no container found): ' +
                        JSON.stringify({ scrollX, scrollY }),
                );
            }

            // Get dialog dimensions
            const dialogWidth = dialogPaper.offsetWidth;
            const dialogHeight = dialogPaper.offsetHeight;

            // Calculate effective dimensions
            // HEIGHT: Use body height (viewport can be artificially tall in vis-2)
            // WIDTH: Use viewport width (the actual visible area, body can be wider due to scrollbars)
            const effectiveHeight = Math.min(bodyHeight, viewportHeight);
            const effectiveWidth = viewportWidth; // Always use viewport width for horizontal!

            // Calculate dialog dimensions with constraints
            const isMobile = effectiveWidth < 700;

            let finalWidth: number;
            let finalHeight: number;
            let finalLeft: number;
            let finalTop: number;

            if (isMobile) {
                // MOBILE: Full width with small padding, aligned left
                const mobilePadding = 10;
                finalWidth = Math.min(dialogWidth, effectiveWidth - mobilePadding * 2);
                finalHeight = Math.min(dialogHeight, effectiveHeight - 40);
                finalLeft = scrollX + mobilePadding;
                finalTop = Math.max(scrollY + 20, scrollY + (effectiveHeight - finalHeight) / 2);
            } else {
                // DESKTOP: Centered with more padding
                const desktopPadding = 40;
                finalWidth = Math.min(dialogWidth, effectiveWidth - desktopPadding * 2);
                finalHeight = Math.min(dialogHeight, effectiveHeight - desktopPadding * 2);

                const centerX = scrollX + (effectiveWidth - finalWidth) / 2;
                const centerY = scrollY + (effectiveHeight - finalHeight) / 2;

                finalLeft = Math.max(scrollX + desktopPadding, centerX);
                finalTop = Math.max(scrollY + desktopPadding, centerY);

                // Ensure right edge is within bounds
                const rightEdge = finalLeft + finalWidth;
                const maxRight = scrollX + effectiveWidth - desktopPadding;
                if (rightEdge > maxRight) {
                    finalLeft = maxRight - finalWidth;
                }
            }

            console.log(
                '[moveDialogIntoView] Attempt ' +
                    attempt +
                    ': ' +
                    JSON.stringify({
                        viewport: { w: viewportWidth, h: viewportHeight },
                        body: { w: bodyWidth, h: bodyHeight },
                        effective: { w: effectiveWidth, h: effectiveHeight },
                        isMobile: isMobile,
                        scroll: { x: scrollX, y: scrollY },
                        dialogOriginal: { w: dialogWidth, h: dialogHeight },
                        dialogFinal: { w: finalWidth, h: finalHeight },
                        position: {
                            left: finalLeft,
                            top: finalTop,
                            rightEdge: finalLeft + finalWidth,
                            maxRight: scrollX + effectiveWidth,
                        },
                    }),
            );

            // Apply positioning with fixed width/height to prevent overflow
            dialogPaper.style.setProperty('position', 'absolute', 'important');
            dialogPaper.style.setProperty('top', `${finalTop}px`, 'important');
            dialogPaper.style.setProperty('left', `${finalLeft}px`, 'important');
            dialogPaper.style.setProperty('width', `${finalWidth}px`, 'important');
            dialogPaper.style.setProperty('max-width', `${finalWidth}px`, 'important');
            dialogPaper.style.setProperty('height', 'auto', 'important');
            dialogPaper.style.setProperty('max-height', `${finalHeight}px`, 'important');
            dialogPaper.style.setProperty('transform', 'none', 'important');
            dialogPaper.style.setProperty('margin', '0', 'important');
            dialogPaper.style.setProperty('overflow', 'auto', 'important');

            console.log(
                '[moveDialogIntoView] Positioned: ' +
                    JSON.stringify({
                        isMobile: isMobile,
                        top: finalTop,
                        left: finalLeft,
                        width: finalWidth,
                        maxHeight: finalHeight,
                    }),
            );
        };

        tryPositioning(1);
    }

    componentDidUpdate(prevProps: VisRxWidgetProps, prevState: OneIconToRuleThemAllState): void {
        // Move dialog into view when it opens
        if (!prevState.dialog && this.state.dialog) {
            this.moveDialogIntoView();
        }

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

                // Config change -> Reinitialize
                {
                    const prevRxDataHeating = prevState.rxData as unknown as OneIconToRuleThemAllRxData;
                    const heatingConfigChanged =
                        this.state.rxData.heatingSetpointShiftOid !== prevRxDataHeating.heatingSetpointShiftOid ||
                        this.state.rxData.heatingSetpointIncreaseValue !==
                            prevRxDataHeating.heatingSetpointIncreaseValue ||
                        this.state.rxData.heatingSetpointDecreaseValue !==
                            prevRxDataHeating.heatingSetpointDecreaseValue ||
                        this.state.rxData.heatingValvePositionOid !== prevRxDataHeating.heatingValvePositionOid ||
                        this.state.rxData.heatingSetpointOid !== prevRxDataHeating.heatingSetpointOid ||
                        this.state.rxData.heatingModeStatusOid !== prevRxDataHeating.heatingModeStatusOid ||
                        this.state.rxData.heatingModeControlOid !== prevRxDataHeating.heatingModeControlOid ||
                        this.state.rxData.heatingShowUnits !== prevRxDataHeating.heatingShowUnits ||
                        this.state.rxData.heatingModeControlType !== prevRxDataHeating.heatingModeControlType ||
                        this.state.rxData.heatingModesConfig !== prevRxDataHeating.heatingModesConfig;

                    if (heatingConfigChanged) {
                        this.initializeModes();
                        void this.heatingMode.initialize();
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

                // Config change -> Reinitialize
                {
                    const prevRxDataDimmer = prevState.rxData as unknown as OneIconToRuleThemAllRxData;
                    const dimmerConfigChanged =
                        this.state.rxData.controlOid !== prevRxDataDimmer.controlOid ||
                        this.state.rxData.dimmerMinValue !== prevRxDataDimmer.dimmerMinValue ||
                        this.state.rxData.dimmerMaxValue !== prevRxDataDimmer.dimmerMaxValue ||
                        this.state.rxData.dimmerStep !== prevRxDataDimmer.dimmerStep ||
                        this.state.rxData.dimmerShowQuickButtons !== prevRxDataDimmer.dimmerShowQuickButtons ||
                        this.state.rxData.showPercentage !== prevRxDataDimmer.showPercentage;

                    if (dimmerConfigChanged) {
                        this.initializeModes();
                        void this.dimmerMode.initialize();
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

                // Config change -> Reinitialize
                {
                    const prevRxDataSwitch = prevState.rxData as unknown as OneIconToRuleThemAllRxData;
                    const switchConfigChanged =
                        this.state.rxData.controlOid !== prevRxDataSwitch.controlOid ||
                        this.state.rxData.switchOnValue !== prevRxDataSwitch.switchOnValue ||
                        this.state.rxData.switchOffValue !== prevRxDataSwitch.switchOffValue ||
                        this.state.rxData.showStatusText !== prevRxDataSwitch.showStatusText ||
                        this.state.rxData.statusOnText !== prevRxDataSwitch.statusOnText ||
                        this.state.rxData.statusOffText !== prevRxDataSwitch.statusOffText ||
                        this.state.rxData.statusFontSize !== prevRxDataSwitch.statusFontSize;

                    if (switchConfigChanged) {
                        this.initializeModes();
                        void this.switchMode.initialize();
                    }
                }
                break;

            case FlexMode.WINDOW_SHUTTER: {
                // Check if window shutter configuration changed
                const prevRxData = prevState.rxData as unknown as OneIconToRuleThemAllRxData;
                const configChanged =
                    this.state.rxData.windowPaneCount !== prevRxData.windowPaneCount ||
                    this.state.rxData.shutterPositionOid !== prevRxData.shutterPositionOid ||
                    this.state.rxData.shutterUpOid !== prevRxData.shutterUpOid ||
                    this.state.rxData.shutterDownOid !== prevRxData.shutterDownOid ||
                    this.state.rxData.shutterStopOid !== prevRxData.shutterStopOid ||
                    this.state.rxData.shutterInvert !== prevRxData.shutterInvert ||
                    this.state.rxData.shutterMin !== prevRxData.shutterMin ||
                    this.state.rxData.shutterMax !== prevRxData.shutterMax ||
                    this.state.rxData.shutterUpValue !== prevRxData.shutterUpValue ||
                    this.state.rxData.shutterDownValue !== prevRxData.shutterDownValue ||
                    this.state.rxData.shutterStopValue !== prevRxData.shutterStopValue ||
                    // Colors
                    this.state.rxData.windowFrameColor !== prevRxData.windowFrameColor ||
                    this.state.rxData.windowPaneFrameColor !== prevRxData.windowPaneFrameColor ||
                    this.state.rxData.windowGlassColor !== prevRxData.windowGlassColor ||
                    this.state.rxData.windowHandleColor !== prevRxData.windowHandleColor ||
                    this.state.rxData.windowPaneClosedColor !== prevRxData.windowPaneClosedColor ||
                    this.state.rxData.windowPaneOpenColor !== prevRxData.windowPaneOpenColor ||
                    this.state.rxData.windowPaneTiltColor !== prevRxData.windowPaneTiltColor ||
                    this.state.rxData.windowShutterColor !== prevRxData.windowShutterColor ||
                    this.state.rxData.windowBackgroundColorClosed !== prevRxData.windowBackgroundColorClosed ||
                    this.state.rxData.windowBackgroundColorActive !== prevRxData.windowBackgroundColorActive;

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
                            shutterUpValue: this.state.rxData.shutterUpValue,
                            shutterDownValue: this.state.rxData.shutterDownValue,
                            shutterStopValue: this.state.rxData.shutterStopValue,
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

            case FlexMode.NUMERIC_DISPLAY: {
                // OID Value Change
                if (this.state.rxData.numericDisplayValueOid) {
                    const value = this.getPropertyValue('numericDisplayValueOid');
                    if (value !== null && value !== undefined) {
                        const numValue = Number(value);
                        if (numValue !== this.state.numericDisplay.value) {
                            this.numericDisplayMode.handleStateChange(this.state.rxData.numericDisplayValueOid, value);
                        }
                    }
                }

                // Config change -> Reinitialize
                const prevRxDataNumeric = prevState.rxData as unknown as OneIconToRuleThemAllRxData;
                const numericConfigChanged =
                    this.state.rxData.numericDisplayValueOid !== prevRxDataNumeric.numericDisplayValueOid ||
                    this.state.rxData.numericDisplayDecimals !== prevRxDataNumeric.numericDisplayDecimals ||
                    this.state.rxData.numericDisplayDecimalMode !== prevRxDataNumeric.numericDisplayDecimalMode ||
                    this.state.rxData.numericDisplayDecimalSeparator !==
                        prevRxDataNumeric.numericDisplayDecimalSeparator ||
                    this.state.rxData.numericDisplayThousandSeparator !==
                        prevRxDataNumeric.numericDisplayThousandSeparator ||
                    this.state.rxData.numericDisplayUnit !== prevRxDataNumeric.numericDisplayUnit ||
                    this.state.rxData.numericDisplayPrefix !== prevRxDataNumeric.numericDisplayPrefix ||
                    this.state.rxData.numericDisplaySuffix !== prevRxDataNumeric.numericDisplaySuffix ||
                    this.state.rxData.numericDisplayUseColorThresholds !==
                        prevRxDataNumeric.numericDisplayUseColorThresholds ||
                    this.state.rxData.numericDisplayThresholdLow !== prevRxDataNumeric.numericDisplayThresholdLow ||
                    this.state.rxData.numericDisplayThresholdHigh !== prevRxDataNumeric.numericDisplayThresholdHigh ||
                    this.state.rxData.numericDisplayColorLow !== prevRxDataNumeric.numericDisplayColorLow ||
                    this.state.rxData.numericDisplayColorMedium !== prevRxDataNumeric.numericDisplayColorMedium ||
                    this.state.rxData.numericDisplayColorHigh !== prevRxDataNumeric.numericDisplayColorHigh ||
                    this.state.rxData.numericDisplayValueMapping !== prevRxDataNumeric.numericDisplayValueMapping;

                if (numericConfigChanged) {
                    this.initializeModes();
                    void this.numericDisplayMode.initialize();
                }
                break;
            }

            case FlexMode.STRING_DISPLAY: {
                // OID Value Change
                if (this.state.rxData.stringDisplayValueOid) {
                    const value = this.getPropertyValue('stringDisplayValueOid');
                    if (value !== null && value !== undefined) {
                        if (value !== this.state.stringDisplay.value) {
                            this.stringDisplayMode.handleStateChange(this.state.rxData.stringDisplayValueOid, value);
                        }
                    }
                }

                // Config change -> Reinitialize
                const prevRxDataString = prevState.rxData as unknown as OneIconToRuleThemAllRxData;
                const stringConfigChanged =
                    this.state.rxData.stringDisplayValueOid !== prevRxDataString.stringDisplayValueOid ||
                    this.state.rxData.stringDisplayMaxLength !== prevRxDataString.stringDisplayMaxLength ||
                    this.state.rxData.stringDisplayEllipsis !== prevRxDataString.stringDisplayEllipsis ||
                    this.state.rxData.stringDisplayTextTransform !== prevRxDataString.stringDisplayTextTransform ||
                    this.state.rxData.stringDisplayPrefix !== prevRxDataString.stringDisplayPrefix ||
                    this.state.rxData.stringDisplaySuffix !== prevRxDataString.stringDisplaySuffix ||
                    this.state.rxData.stringDisplayValueMapping !== prevRxDataString.stringDisplayValueMapping;

                if (stringConfigChanged) {
                    this.initializeModes();
                    void this.stringDisplayMode.initialize();
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

            case FlexMode.NUMERIC_DISPLAY:
            case FlexMode.STRING_DISPLAY: {
                const clickAction = this.state.rxData.displayClickAction ?? ClickAction.NONE;

                if (clickAction === ClickAction.NAVIGATE) {
                    const targetView = this.state.rxData.displayTargetView;
                    if (targetView) {
                        // Navigation to another view
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (window as any).vis?.changeView?.(targetView);
                    }
                }
                // ClickAction.NONE -> Noop
                break;
            }
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
            case FlexMode.NUMERIC_DISPLAY:
                return this.numericDisplayMode.isActive(this.state.numericDisplay);
            case FlexMode.STRING_DISPLAY:
                return this.stringDisplayMode.isActive(this.state.stringDisplay);
            default:
                return false;
        }
    }

    private getTopText(): string | undefined {
        const mode = this.state.rxData.mode;
        const iconPos = this.state.rxData.displayIconPosition ?? IconPosition.TOP;

        if (mode === FlexMode.HEATING_KNX) {
            return this.heatingMode.formatTemperature(this.state.heating.setpointValue);
        }

        // Display modes: Show value as topText when icon is at bottom (vertical layout only)
        if (mode === FlexMode.NUMERIC_DISPLAY || mode === FlexMode.STRING_DISPLAY) {
            // Only use top/bottom text for vertical layouts
            if (iconPos === IconPosition.BOTTOM) {
                return mode === FlexMode.NUMERIC_DISPLAY
                    ? this.state.numericDisplay.formattedValue
                    : this.state.stringDisplay.formattedValue;
            }
        }

        return undefined;
    }

    private getBottomText(): string | undefined {
        const mode = this.state.rxData.mode;
        const iconPos = this.state.rxData.displayIconPosition ?? IconPosition.TOP;

        switch (mode) {
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
            case FlexMode.NUMERIC_DISPLAY:
            case FlexMode.STRING_DISPLAY:
                // Show value as bottomText only for vertical layout with icon on top
                if (iconPos === IconPosition.TOP) {
                    return mode === FlexMode.NUMERIC_DISPLAY
                        ? this.state.numericDisplay.formattedValue
                        : this.state.stringDisplay.formattedValue;
                }
                break;
        }
        return undefined;
    }

    /**
     * Check if display mode uses horizontal layout
     */
    private isHorizontalDisplayLayout(): boolean {
        const mode = this.state.rxData.mode;
        const iconPos = this.state.rxData.displayIconPosition ?? IconPosition.TOP;

        if (mode !== FlexMode.NUMERIC_DISPLAY && mode !== FlexMode.STRING_DISPLAY) {
            return false;
        }

        return iconPos === IconPosition.LEFT || iconPos === IconPosition.RIGHT;
    }

    /**
     * Check if display mode uses vertical layout (top/bottom)
     */
    private isVerticalDisplayLayout(): boolean {
        const mode = this.state.rxData.mode;
        const iconPos = this.state.rxData.displayIconPosition ?? IconPosition.TOP;

        if (mode !== FlexMode.NUMERIC_DISPLAY && mode !== FlexMode.STRING_DISPLAY) {
            return false;
        }

        return iconPos === IconPosition.TOP || iconPos === IconPosition.BOTTOM;
    }

    /**
     * Get the display value for horizontal layouts
     */
    private getDisplayValue(): string {
        const mode = this.state.rxData.mode;

        if (mode === FlexMode.NUMERIC_DISPLAY) {
            return this.state.numericDisplay.formattedValue;
        } else if (mode === FlexMode.STRING_DISPLAY) {
            return this.state.stringDisplay.formattedValue;
        }

        return '--';
    }

    /**
     * Get text color for display modes (based on thresholds)
     */
    private getDisplayTextColor(): string | undefined {
        // Priority: 1. Threshold color (if active), 2. Configured text color, 3. undefined (fallback to inherit)
        if (this.state.rxData.mode === FlexMode.NUMERIC_DISPLAY) {
            if (this.state.numericDisplay.currentColor) {
                return this.state.numericDisplay.currentColor;
            }
        }
        // Use configured text color (default: #555555)
        return this.state.rxData.displayTextColor || '#555555';
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
                ) : this.isHorizontalDisplayLayout() ? (
                    <HorizontalDisplay
                        icon={this.state.rxData.icon}
                        iconSize={this.state.rxData.iconSize}
                        iconRotation={this.state.rxData.iconRotation}
                        iconColor={this.getIsActive() ? this.state.rxData.activeColor : this.state.rxData.inactiveColor}
                        value={this.getDisplayValue()}
                        valueColor={this.getDisplayTextColor()}
                        valueFontSize={this.state.rxData.displayValueFontSize ?? this.state.rxData.statusFontSize ?? 14}
                        iconTextGap={this.state.rxData.displayIconTextGap ?? 8}
                        iconPosition={
                            (this.state.rxData.displayIconPosition as IconPosition.LEFT | IconPosition.RIGHT) ??
                            IconPosition.LEFT
                        }
                        onClick={this.handleClick}
                        editMode={this.state.editMode}
                    />
                ) : this.isVerticalDisplayLayout() ? (
                    <VerticalDisplay
                        icon={this.state.rxData.icon}
                        iconSize={this.state.rxData.iconSize}
                        iconRotation={this.state.rxData.iconRotation}
                        iconColor={this.getIsActive() ? this.state.rxData.activeColor : this.state.rxData.inactiveColor}
                        value={this.getDisplayValue()}
                        valueColor={this.getDisplayTextColor()}
                        valueFontSize={this.state.rxData.displayValueFontSize ?? this.state.rxData.statusFontSize ?? 14}
                        iconTextGap={this.state.rxData.displayIconTextGap ?? 8}
                        iconPosition={
                            (this.state.rxData.displayIconPosition as IconPosition.TOP | IconPosition.BOTTOM) ??
                            IconPosition.TOP
                        }
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
                        statusFontSize={this.state.rxData.displayValueFontSize ?? this.state.rxData.statusFontSize}
                        topTextColor={this.getDisplayTextColor()}
                        bottomTextColor={this.getDisplayTextColor()}
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
