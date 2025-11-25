import React, { useRef, useState, useEffect } from 'react';
import { Box, IconButton } from '@mui/material';

export interface WindowShutterIconProps {
    panes: Array<{
        state: 'closed' | 'open' | 'tilt';
        ratio: number;
        hinge: 'left' | 'right' | 'top';
    }>;
    shutterPosition: number; // 0-100
    iconRotation: number;

    // Farben
    frameColor: string; // Gesamtrahmen (rosa im Mockup)
    paneFrameColor: string; // Flügel-Rahmen (grau im Mockup)
    glassColor: string; // Glasscheiben (cyan im Mockup)
    handleColor: string; // Griffe
    paneOpenColor: string; // Status: offen
    paneTiltColor: string; // Status: gekippt
    shutterColor: string; // Rolladen-Lamellen
    backgroundColor: string; // Hintergrund

    onClick?: () => void;
    editMode?: boolean;
}

export const WindowShutterIcon: React.FC<WindowShutterIconProps> = React.memo(
    ({
        panes,
        shutterPosition,
        iconRotation = 0,
        frameColor,
        paneFrameColor,
        glassColor,
        handleColor,
        paneOpenColor,
        paneTiltColor,
        shutterColor,
        backgroundColor,
        onClick,
        editMode,
    }) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const [containerSize, setContainerSize] = useState({ width: 100, height: 100 });

        // Eindeutige ID für clipPath (falls mehrere Widgets auf der Seite)
        const clipPathId = useRef(`glass-clip-${Math.random().toString(36).substr(2, 9)}`).current;

        // Observe container size changes
        useEffect(() => {
            const container = containerRef.current;
            if (!container) {
                return;
            }

            const resizeObserver = new ResizeObserver(entries => {
                for (const entry of entries) {
                    const { width, height } = entry.contentRect;
                    setContainerSize({ width, height });
                }
            });

            resizeObserver.observe(container);
            return () => resizeObserver.disconnect();
        }, []);

        // Calculate scale factor for rectangular container
        //
        // Problem: Container is W×H (rectangular), SVG should fill it at any rotation
        // At 0°: SVG should be W×H (fill completely)
        // At 45°: SVG needs to be scaled down so rotated bounding box fits
        //
        // For SVG with dimensions s*W × s*H rotated by θ:
        // Bounding Box Width:  s*W * |cos(θ)| + s*H * |sin(θ)| ≤ W
        // Bounding Box Height: s*W * |sin(θ)| + s*H * |cos(θ)| ≤ H
        //
        // Solving for s:
        //   s ≤ W / (W * |cos(θ)| + H * |sin(θ)|)
        //   s ≤ H / (W * |sin(θ)| + H * |cos(θ)|)
        const radians = (iconRotation * Math.PI) / 180;
        const { width, height } = containerSize;

        const cos = Math.abs(Math.cos(radians));
        const sin = Math.abs(Math.sin(radians));

        const scale1 = width / (width * cos + height * sin);
        const scale2 = height / (width * sin + height * cos);
        const scaleFactor = Math.min(scale1, scale2);

        // Calculate pane widths based on ratios
        const totalRatio = panes.reduce((sum, pane) => sum + pane.ratio, 0);
        const paneWidths = panes.map(pane => (pane.ratio / totalRatio) * 90); // 90 = inner width

        // Calculate cumulative positions
        let currentX = 5; // Start padding
        const panePositions = paneWidths.map(width => {
            const pos = currentX;
            currentX += width;
            return { x: pos, width };
        });

        // SVG style: fill container, scale down for rotation if needed
        const svgStyle: React.CSSProperties = {
            width: '100%',
            height: '100%',
            display: 'block',
            transform: `rotate(${iconRotation}deg) scale(${scaleFactor})`,
            transformOrigin: 'center',
        };

        // Konstanten für Dimensionen (müssen vor allen Funktionen definiert sein)
        const MAIN_FRAME_OFFSET = 5; // Gesamtrahmen: 5-95
        const MAIN_FRAME_SIZE = 90;
        const PANE_FRAME_WIDTH = 3; // Breite des Flügel-Rahmens
        const PANE_INNER_OFFSET = 2; // Abstand vom Gesamtrahmen zum Flügel-Rahmen

        // Helper: Prüft ob eine Farbe bereits Alpha enthält
        const hasAlpha = (color: string): boolean => {
            // rgba() oder hsla() Format
            if (color.startsWith('rgba(') || color.startsWith('hsla(')) {
                return true;
            }
            // Hex mit Alpha: #RRGGBBAA (9 Zeichen mit #)
            if (color.startsWith('#') && color.length === 9) {
                return true;
            }
            return false;
        };

        // Render shutter slats (lamellen) - pro Flügel, nur im Glasbereich
        const renderShutter = (): JSX.Element[] => {
            const slatHeight = 3; // Feste Lamellenhöhe
            const slatGap = 0.5; // Fester Abstand zwischen Lamellen
            const slatPitch = slatHeight + slatGap; // Gesamthöhe pro Lamelle

            const slats: JSX.Element[] = [];

            // Rendere Rolladen für jeden Flügel separat
            panePositions.forEach((pos, paneIdx) => {
                const glassX = pos.x + PANE_INNER_OFFSET + PANE_FRAME_WIDTH;
                const glassY = MAIN_FRAME_OFFSET + PANE_INNER_OFFSET + PANE_FRAME_WIDTH;
                const glassWidth = pos.width - 2 * PANE_INNER_OFFSET - 2 * PANE_FRAME_WIDTH;
                const glassHeight = MAIN_FRAME_SIZE - 2 * PANE_INNER_OFFSET - 2 * PANE_FRAME_WIDTH;
                const shutterHeight = (glassHeight * shutterPosition) / 100;

                // Berechne wie viele Lamellen in die aktuelle Rolladen-Höhe passen
                const visibleSlatCount = Math.floor(shutterHeight / slatPitch);

                // Prüfe, ob nach den vollen Lamellen noch Platz für eine weitere ist
                const remainingSpace = shutterHeight - visibleSlatCount * slatPitch;
                const hasPartialSlat = remainingSpace >= slatHeight; // Mindestens die Lamellenhöhe übrig

                // Rendere die vollen Lamellen mit festem Abstand
                for (let i = 0; i < visibleSlatCount; i++) {
                    const y = glassY + i * slatPitch;

                    slats.push(
                        <g key={`slat-${paneIdx}-${i}`}>
                            {/* Hauptlamelle */}
                            <rect
                                x={glassX}
                                y={y}
                                width={glassWidth}
                                height={slatHeight}
                                fill={shutterColor}
                            />
                            {/* Schatten für Tiefe */}
                            <rect
                                x={glassX}
                                y={y + slatHeight - slatGap}
                                width={glassWidth}
                                height={slatGap}
                                fill="#000000"
                                opacity={0.4}
                            />
                        </g>,
                    );
                }

                // Rendere eine letzte (teilweise sichtbare) Lamelle, falls Platz vorhanden
                if (hasPartialSlat) {
                    const y = glassY + visibleSlatCount * slatPitch;
                    slats.push(
                        <g key={`slat-${paneIdx}-${visibleSlatCount}`}>
                            {/* Hauptlamelle */}
                            <rect
                                x={glassX}
                                y={y}
                                width={glassWidth}
                                height={slatHeight}
                                fill={shutterColor}
                            />
                            {/* Schatten für Tiefe */}
                            <rect
                                x={glassX}
                                y={y + slatHeight - slatGap}
                                width={glassWidth}
                                height={slatGap}
                                fill="#000000"
                                opacity={0.4}
                            />
                        </g>,
                    );
                }
            });

            return slats;
        };

        // Render individual pane frame (for each window pane)
        const renderPaneFrame = (x: number, width: number, idx: number): JSX.Element => {
            const pane = panes[idx];
            const frameX = x + PANE_INNER_OFFSET;
            const frameY = MAIN_FRAME_OFFSET + PANE_INNER_OFFSET;
            const frameWidth = width - 2 * PANE_INNER_OFFSET;
            const frameHeight = MAIN_FRAME_SIZE - 2 * PANE_INNER_OFFSET;

            // Rahmen hat immer die gleiche Farbe (nur das Glas wird eingefärbt)
            const fillColor = paneFrameColor;

            // Wenn offen: Perspektivisch verzerren (nach innen öffnend)
            if (pane.state === 'open') {
                // Nach innen öffnend = Freie Seite kommt zu uns → wird GRÖSSER (länger vertikal)
                // Scharnier-Seite bleibt fest
                const growFactor = 0.2; // Wie stark die freie Seite wächst (vertikal)

                let points: string;

                if (pane.hinge === 'left') {
                    // Scharnier LINKS bleibt fest → Rechte Seite kommt zu uns
                    const grow = frameHeight * growFactor;
                    points = `
                        ${frameX},${frameY}
                        ${frameX + frameWidth},${frameY - grow}
                        ${frameX + frameWidth},${frameY + frameHeight + grow}
                        ${frameX},${frameY + frameHeight}
                    `;
                } else if (pane.hinge === 'right') {
                    // Scharnier RECHTS bleibt fest → Linke Seite kommt zu uns
                    const grow = frameHeight * growFactor;
                    points = `
                        ${frameX},${frameY - grow}
                        ${frameX + frameWidth},${frameY}
                        ${frameX + frameWidth},${frameY + frameHeight}
                        ${frameX},${frameY + frameHeight + grow}
                    `;
                } else {
                    // Scharnier OBEN bleibt fest → Untere Seite kommt zu uns
                    const grow = frameWidth * growFactor;
                    points = `
                        ${frameX},${frameY}
                        ${frameX + frameWidth},${frameY}
                        ${frameX + frameWidth + grow},${frameY + frameHeight}
                        ${frameX - grow},${frameY + frameHeight}
                    `;
                }

                return (
                    <polygon
                        key={`pane-frame-${idx}`}
                        points={points}
                        fill={fillColor}
                    />
                );
            }

            // Geschlossen oder gekippt: normales Rechteck
            return (
                <rect
                    key={`pane-frame-${idx}`}
                    x={frameX}
                    y={frameY}
                    width={frameWidth}
                    height={frameHeight}
                    fill={fillColor}
                />
            );
        };

        // Render glass pane (always visible) - transparent um Rolladen zu zeigen
        const renderGlassPane = (x: number, width: number, idx: number): JSX.Element => {
            const pane = panes[idx];
            const glassX = x + PANE_INNER_OFFSET + PANE_FRAME_WIDTH;
            const glassY = MAIN_FRAME_OFFSET + PANE_INNER_OFFSET + PANE_FRAME_WIDTH;
            const glassWidth = width - 2 * PANE_INNER_OFFSET - 2 * PANE_FRAME_WIDTH;
            const glassHeight = MAIN_FRAME_SIZE - 2 * PANE_INNER_OFFSET - 2 * PANE_FRAME_WIDTH;

            // Farbe basierend auf Status wählen
            let fillColor = glassColor;
            let opacity = 0.3;

            if (pane.state === 'open') {
                fillColor = paneOpenColor;
                // Wenn Farbe bereits Alpha enthält → opacity = 1.0, sonst erhöhte opacity
                opacity = hasAlpha(paneOpenColor) ? 1.0 : 0.4;
            } else if (pane.state === 'tilt') {
                fillColor = paneTiltColor;
                // Wenn Farbe bereits Alpha enthält → opacity = 1.0, sonst erhöhte opacity
                opacity = hasAlpha(paneTiltColor) ? 1.0 : 0.4;
            } else {
                // Geschlossen: Auch Glass-Color kann Alpha haben
                opacity = hasAlpha(glassColor) ? 1.0 : 0.3;
            }

            // Wenn offen: Glas perspektivisch verzerren (parallel zum Rahmen)
            if (pane.state === 'open') {
                const growFactor = 0.2; // Gleicher Faktor wie beim Rahmen

                let points: string;

                if (pane.hinge === 'left') {
                    // Scharnier LINKS bleibt fest → Rechte Seite kommt zu uns
                    const grow = glassHeight * growFactor;
                    points = `
                        ${glassX},${glassY}
                        ${glassX + glassWidth},${glassY - grow}
                        ${glassX + glassWidth},${glassY + glassHeight + grow}
                        ${glassX},${glassY + glassHeight}
                    `;
                } else if (pane.hinge === 'right') {
                    // Scharnier RECHTS bleibt fest → Linke Seite kommt zu uns
                    const grow = glassHeight * growFactor;
                    points = `
                        ${glassX},${glassY - grow}
                        ${glassX + glassWidth},${glassY}
                        ${glassX + glassWidth},${glassY + glassHeight}
                        ${glassX},${glassY + glassHeight + grow}
                    `;
                } else {
                    // Scharnier OBEN bleibt fest → Untere Seite kommt zu uns
                    const grow = glassWidth * growFactor;
                    points = `
                        ${glassX},${glassY}
                        ${glassX + glassWidth},${glassY}
                        ${glassX + glassWidth + grow},${glassY + glassHeight}
                        ${glassX - grow},${glassY + glassHeight}
                    `;
                }

                return (
                    <polygon
                        key={`glass-${idx}`}
                        points={points}
                        fill={fillColor}
                        opacity={opacity}
                    />
                );
            }

            // Geschlossen oder gekippt: normales Rechteck
            return (
                <rect
                    key={`glass-${idx}`}
                    x={glassX}
                    y={glassY}
                    width={glassWidth}
                    height={glassHeight}
                    fill={fillColor}
                    opacity={opacity}
                />
            );
        };

        // Render status indicator for a pane
        const renderPaneStatus = (pane: (typeof panes)[0], x: number, width: number): JSX.Element | null => {
            const glassX = x + PANE_INNER_OFFSET + PANE_FRAME_WIDTH;
            const glassY = MAIN_FRAME_OFFSET + PANE_INNER_OFFSET + PANE_FRAME_WIDTH;
            const glassWidth = width - 2 * PANE_INNER_OFFSET - 2 * PANE_FRAME_WIDTH;
            const glassHeight = MAIN_FRAME_SIZE - 2 * PANE_INNER_OFFSET - 2 * PANE_FRAME_WIDTH;

            if (pane.state === 'closed') {
                // Geschlossen: keine zusätzliche Anzeige nötig
                return null;
            } else if (pane.state === 'tilt') {
                // Gekippt: Spalt oben + diagonale Linie
                return (
                    <g key={`status-${x}`}>
                        {/* Spalt-Indikator oben */}
                        <line
                            x1={glassX + 2}
                            y1={glassY}
                            x2={glassX + glassWidth - 2}
                            y2={glassY}
                            stroke={paneTiltColor}
                            strokeWidth={2}
                            opacity={0.8}
                        />
                        {/* Diagonale Linie */}
                        <line
                            x1={glassX + 3}
                            y1={glassY + 5}
                            x2={glassX + glassWidth - 3}
                            y2={glassY + glassHeight - 5}
                            stroke={paneTiltColor}
                            strokeWidth={1.5}
                            opacity={0.6}
                        />
                    </g>
                );
            }
            // Offen: Keine Striche - die perspektivische Verzerrung zeigt die Öffnung
            // Optional: subtile Farbänderung der Glasscheibe (über paneOpenColor bereits gesteuert)
            return null;
        };

        // Render handles (Griffe) - rotieren je nach Status
        const renderHandles = (): JSX.Element[] => {
            const handleLength = 8;
            const handleThickness = 1.2;

            return panePositions.map((pos, idx) => {
                const pane = panes[idx];

                // Position des Griffs (Drehpunkt)
                let centerX: number;
                let centerY: number;

                if (pane.hinge === 'left') {
                    // Griff rechts - mittig auf rechtem Flügel-Rahmen
                    const frameRightEdge = pos.x + pos.width - PANE_INNER_OFFSET;
                    centerX = frameRightEdge - PANE_FRAME_WIDTH / 2;
                    centerY = 50;
                } else if (pane.hinge === 'right') {
                    // Griff links - mittig auf linkem Flügel-Rahmen
                    const frameLeftEdge = pos.x + PANE_INNER_OFFSET;
                    centerX = frameLeftEdge + PANE_FRAME_WIDTH / 2;
                    centerY = 50;
                } else {
                    // top hinge: Griff unten - mittig auf unterem Flügel-Rahmen
                    centerX = pos.x + pos.width / 2;
                    const frameBottomEdge = MAIN_FRAME_OFFSET + MAIN_FRAME_SIZE - PANE_INNER_OFFSET;
                    centerY = frameBottomEdge - PANE_FRAME_WIDTH / 2;
                }

                // Rotation und Position basierend auf Status
                let rotation = 0;
                let handleX: number;
                let handleY: number;

                if (pane.state === 'closed') {
                    // Geschlossen: Drehpunkt in Mitte, nach unten
                    rotation = 270;
                    handleX = centerX - handleLength / 2;
                    handleY = centerY - handleThickness / 2;
                } else if (pane.state === 'tilt') {
                    // Gekippt: Drehpunkt in Mitte, nach oben
                    rotation = 90;
                    handleX = centerX - handleLength / 2;
                    handleY = centerY - handleThickness / 2;
                } else {
                    // Offen: Drehpunkt immer oben am Griff
                    if (pane.hinge === 'left') {
                        // Scharnier links → Griff zeigt nach links (zum Scharnier)
                        rotation = 180;
                        handleX = centerX;
                        handleY = centerY; // Oberer Rand am Drehpunkt
                    } else if (pane.hinge === 'right') {
                        // Scharnier rechts → Griff zeigt nach rechts (zum Scharnier)
                        rotation = 0;
                        handleX = centerX;
                        handleY = centerY; // Oberer Rand am Drehpunkt
                    } else {
                        // Scharnier oben → Griff zeigt nach oben (zum Scharnier)
                        rotation = 90;
                        handleX = centerX;
                        handleY = centerY; // Oberer Rand am Drehpunkt
                    }
                }

                return (
                    <rect
                        key={`handle-${idx}`}
                        x={handleX}
                        y={handleY}
                        width={handleLength}
                        height={handleThickness}
                        fill={handleColor}
                        transform={`rotate(${rotation} ${centerX} ${centerY})`}
                    />
                );
            });
        };

        return (
            <Box
                ref={containerRef}
                sx={{
                    position: 'relative',
                    height: '100%',
                    width: '100%',
                    overflow: 'hidden',
                    padding: 0,
                    margin: 0,
                    boxSizing: 'border-box',
                }}
            >
                <IconButton
                    onClick={onClick}
                    disabled={editMode}
                    sx={{
                        padding: 0,
                        margin: 0,
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 0,
                        overflow: 'hidden',
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                    }}
                >
                    <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        style={svgStyle}
                    >
                        {/* Clip-Path: Nur Glasbereich */}
                        <defs>
                            <clipPath id={clipPathId}>
                                {panePositions.map((pos, idx) => {
                                    const glassX = pos.x + PANE_INNER_OFFSET + PANE_FRAME_WIDTH;
                                    const glassY = MAIN_FRAME_OFFSET + PANE_INNER_OFFSET + PANE_FRAME_WIDTH;
                                    const glassWidth = pos.width - 2 * PANE_INNER_OFFSET - 2 * PANE_FRAME_WIDTH;
                                    const glassHeight = MAIN_FRAME_SIZE - 2 * PANE_INNER_OFFSET - 2 * PANE_FRAME_WIDTH;
                                    return (
                                        <rect
                                            key={`clip-${idx}`}
                                            x={glassX}
                                            y={glassY}
                                            width={glassWidth}
                                            height={glassHeight}
                                        />
                                    );
                                })}
                            </clipPath>
                        </defs>

                        {/* 1. Hintergrund */}
                        <rect
                            x={0}
                            y={0}
                            width={100}
                            height={100}
                            fill={backgroundColor}
                        />

                        {/* 2. Gesamtrahmen (Rosa im Mockup) */}
                        <rect
                            x={MAIN_FRAME_OFFSET}
                            y={MAIN_FRAME_OFFSET}
                            width={MAIN_FRAME_SIZE}
                            height={MAIN_FRAME_SIZE}
                            fill={frameColor}
                        />

                        {/* 3. Flügel-Rahmen (Grau im Mockup) */}
                        {panePositions.map((pos, idx) => renderPaneFrame(pos.x, pos.width, idx))}

                        {/* 4. Rolladen - NUR im Glasbereich sichtbar (mit clipPath) */}
                        <g clipPath={`url(#${clipPathId})`}>{renderShutter()}</g>

                        {/* 5. Glasscheiben (Cyan im Mockup) - transparent über dem Rolladen */}
                        {panePositions.map((pos, idx) => renderGlassPane(pos.x, pos.width, idx))}

                        {/* 6. Status-Indikatoren */}
                        {panes.map((pane, idx) => {
                            const pos = panePositions[idx];
                            return renderPaneStatus(pane, pos.x, pos.width);
                        })}

                        {/* 7. Griffe */}
                        {renderHandles()}
                    </svg>
                </IconButton>
            </Box>
        );
    },
);

WindowShutterIcon.displayName = 'WindowShutterIcon';
