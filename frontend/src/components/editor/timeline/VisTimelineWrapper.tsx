import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Timeline, TimelineState } from '../../../lib/timeline-editor/src/index';
import { TimelineEffect } from '../../../lib/timeline-engine/src/index';
import styles from './VisTimeline.module.css';
import { useProjectStore } from '@/store/useProjectStore';
import TimelineWaveform from './components/TimelineWaveform';
import TimelineTrackHeader from './components/TimelineTrackHeader';
import TimelineAction from './components/TimelineAction';
import { useTimelineData } from './hooks/useTimelineData';
import { useTimelineHandlers } from './hooks/useTimelineHandlers';

const SIDEBAR_WIDTH = 160;

export default function VisTimelineWrapper() {
    const activeTool = useProjectStore(state => state.activeTool);
    const timelineZoom = useProjectStore(state => state.timelineZoom);
    const trackConfigs = useProjectStore(state => state.trackConfigs);
    const videoFile = useProjectStore(state => state.videoFile);
    const currentTime = useProjectStore(state => state.currentTime);
    const isPlaying = useProjectStore(state => state.isPlaying);
    const dragGhostPositions = useProjectStore(state => state.dragGhostPositions);

    const [scrollLeft, setScrollLeft] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);
    const [snapLineTime, setSnapLineTime] = useState<number | null>(null);

    // Timeline ref for accessing setTime API
    const timelineRef = useRef<TimelineState>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Non-Passive Wheel Listener for robust scroll override
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            // If Ctrl is pressed, allow Zoom (handled by Timeline component usually, or we can handle it)
            // For now, let's focus on Scroll.

            if (e.ctrlKey || e.metaKey) return; // Let default zoom behavior happen if implemented

            if (!timelineRef.current) return;

            e.preventDefault(); // STOP native scroll (fixes vertical jitter and ruler movement)

            const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            const speed = 1.5;

            // Access current scrollLeft using state or ref if closure is stale?
            // Since this is an event listener, 'scrollLeft' state might be stale if strict mode.
            // But 'setScrollLeft' functional update? No, we need current value to add delta.
            // We can get current scrollLeft from timelineRef!

            // timelineRef.current doesn't expose 'getScrollLeft' in interface explicitly from what I saw?
            // Wrapper state syncs it.
            // Let's rely on functional update of state? No, we call timelineRef.setScrollLeft.
            // Actually, timelineRef likely tracks its own scroll.
            // BUT simpler: ScrollSync manages it.

            // Workaround: We use a ref to track scrollLeft locally for the listener to avoid re-binding
            // Or just use the prop if we re-bind on [scrollLeft].
            // Re-binding on scroll is expensive (scroll is frequent).

            // Better: Read from scrollSync inside Timeline?
            // No, let's use a Mutable Ref for scrollLeft
        };

        // We need 'handleWheel' to access latest 'scrollLeft'.
        // To avoid re-binding, we can use a ref:
        // see 'scrollRef' pattern below.

    }, []);

    // We need a ref to track scrollLeft without triggering re-effects
    const scrollLeftRef = useRef(0);
    useEffect(() => { scrollLeftRef.current = scrollLeft }, [scrollLeft]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) return;
            if (!timelineRef.current) return;

            // Strictly prevent default to solve the Jitter/Ruler issues
            e.preventDefault();

            const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            const speed = 1.5;
            const newLeft = scrollLeftRef.current - delta * speed; // Reversed: Scroll forward goes forward

            timelineRef.current.setScrollLeft(newLeft);
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, []);

    // Modularized Data and Handlers
    const editorData = useTimelineData();
    const {
        handleActionClick,
        handleRowClick,
        handleEditorChange,
        onActionMoveStart,
        onActionMoveEnd,
        onActionMoving,
        onActionResizing,
        onClickTimeArea,
        onCursorDrag,
        setMultiSelectActionIds,
        setSelectedActionId,
        setSelectedTrackId
    } = useTimelineHandlers(timelineRef, setSnapLineTime);



    // Effect definitions
    const effects: Record<string, TimelineEffect> = {
        audioEffect: { id: 'audioEffect', name: 'Audio' }
    };

    const getActionRender = useCallback((action: any, row: any) => (
        <TimelineAction
            action={action}
            row={row}
            isHidden={trackConfigs[row.id]?.isHidden}
            isLocked={trackConfigs[row.id]?.isLocked}
        />
    ), [trackConfigs]);

    // Panning Logic for Hand Tool
    const [isPanning, setIsPanning] = useState(false);
    const panState = useRef({
        startX: 0,
        startY: 0,
        startScrollLeft: 0,
        startScrollTop: 0,
        dir: 'none' as 'none' | 'h' | 'v' | 'both'
    });

    const getToolCursor = (): string => {
        if (isPanning) return 'grabbing';
        switch (activeTool) {
            case 'razor': return 'crosshair';
            case 'hand': return 'grab';
            case 'split': return 'col-resize';
            case 'delete': return 'not-allowed';
            default: return 'default';
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (activeTool === 'hand') {
            setIsPanning(true);
            panState.current = {
                startX: e.clientX,
                startY: e.clientY,
                startScrollLeft: scrollLeft,
                startScrollTop: scrollTop,
                dir: 'none'
            };
            e.preventDefault();
        }
    };

    useEffect(() => {
        if (!isPanning) return;

        const handleMouseMove = (e: MouseEvent) => {
            const dx = e.clientX - panState.current.startX;
            const dy = e.clientY - panState.current.startY;

            if (panState.current.dir === 'none') {
                if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                    if (Math.abs(dx) > Math.abs(dy) * 1.5) panState.current.dir = 'h';
                    else if (Math.abs(dy) > Math.abs(dx) * 1.5) panState.current.dir = 'v';
                    else panState.current.dir = 'both';
                }
            }

            if (timelineRef.current) {
                if (panState.current.dir === 'h' || panState.current.dir === 'both') {
                    timelineRef.current.setScrollLeft(panState.current.startScrollLeft - dx);
                }
                if (panState.current.dir === 'v' || panState.current.dir === 'both') {
                    timelineRef.current.setScrollTop(panState.current.startScrollTop - dy);
                }
            }
        };

        const handleMouseUp = () => {
            setIsPanning(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isPanning]);

    // MARQUEE SELECTION LOGIC
    const [marquee, setMarquee] = useState<{ startX: number, startY: number, endX: number, endY: number } | null>(null);
    const selectionRef = useRef<HTMLDivElement>(null);

    const handleContainerMouseDown = (e: React.MouseEvent) => {
        // Allow clicking anywhere in the container to set time (Indicator Jump)
        const target = e.target as HTMLElement;
        const isEditorArea = target.closest(`.${styles.timelineEditorContainer}`);
        const isAction = target.closest('[class*="action"]');
        const isRuler = target.closest('[class*="time-area"]') || target.closest('[class*="cursor"]') || target.closest('[class*="interact"]');

        const ZOOM = 0.9;

        if (isEditorArea && !isAction && !isRuler && e.button === 0) {
            // Calculate time from click X
            const rect = target.closest(`.${styles.timelineEditorContainer}`)!.getBoundingClientRect();
            // Zoom Compensation: convert physical pixels to CSS pixels
            const clickX = (e.clientX - rect.left) / ZOOM;

            // Re-use calculation logic
            // startLeft=160 (sidebar), scaleWidth is currentScale pixels per currentScale seconds
            const pxToTime = (px: number) => {
                const relativeX = px + scrollLeft;
                return (relativeX / currentScaleWidth) * currentScale;
            };

            const newTime = Math.max(0, pxToTime(clickX));

            // Set Time Immediately on Click (User Request: "Indicator comes to me")
            // BUT EXCLUDE TEXT TOOL: User wants to click to add text without the indicator jumping/obstructing
            if (activeTool !== 'hand' && activeTool !== 'text') {
                useProjectStore.getState().setCurrentTime(newTime);
            }

            // Marquee Logic (Only if Select Tool)
            if (activeTool === 'select') {
                setMarquee({
                    startX: (e.clientX - rect.left) / ZOOM,
                    startY: (e.clientY - rect.top) / ZOOM,
                    endX: (e.clientX - rect.left) / ZOOM,
                    endY: (e.clientY - rect.top) / ZOOM
                });

                // Clear existing selection on new marquee start/click in empty space
                setSelectedActionId(null);
                setMultiSelectActionIds([]);
            }
        }
        handleMouseDown(e); // Keep hand tool support
    };

    const handleContainerMouseMove = (e: React.MouseEvent) => {
        if (marquee) {
            const ZOOM = 0.9;
            const rect = (e.currentTarget as HTMLElement).querySelector(`.${styles.timelineEditorContainer}`)!.getBoundingClientRect();
            setMarquee(prev => prev ? ({
                ...prev,
                endX: (e.clientX - rect.left) / ZOOM,
                endY: (e.clientY - rect.top) / ZOOM
            }) : null);
        }
    };

    const handleContainerMouseUp = () => {
        if (marquee && timelineRef.current) {
            // CALCULATE SELECTION
            const x1 = Math.min(marquee.startX, marquee.endX);
            const x2 = Math.max(marquee.startX, marquee.endX);
            const y1 = Math.min(marquee.startY, marquee.endY);
            const y2 = Math.max(marquee.startY, marquee.endY);

            // Convert Pixels to Time
            // startLeft=160 (sidebar), scaleWidth is currentScale pixels per currentScale seconds
            const pxToTime = (px: number) => {
                const relativeX = px + scrollLeft; // Offset only by scroll now
                return (relativeX / currentScaleWidth) * currentScale;
            };

            const startTime = pxToTime(x1);
            const endTime = pxToTime(x2);

            // Row mapping (from useTimelineData)
            // Subtitle Row: Top=0, Height=32
            // Video Row: Top=32, Height=50
            // Audio Row: Top=82, Height=60
            const selectedIds: string[] = [];

            let currentAccumulatedTop = 0;
            editorData.forEach((row, index) => {
                const rowTop = currentAccumulatedTop;
                const currentRowHeight = row.rowHeight || 50;
                const rowBottom = rowTop + currentRowHeight;

                // Check vertical overlap
                if (y2 >= rowTop && y1 <= rowBottom) {
                    // Check horizontal overlap for actions in this row
                    row.actions.forEach(action => {
                        if (action.start < endTime && action.end > startTime) {
                            selectedIds.push(action.id);
                        }
                    });
                }
                currentAccumulatedTop += currentRowHeight;
            });

            if (selectedIds.length > 0) {
                setMultiSelectActionIds(selectedIds);
            }
        }
        setMarquee(null);
    };

    // Calculate adaptive scale based on zoom
    // We want the distance between major ticks to be at least 100px
    const getAdaptiveScale = (zoom: number) => {
        const minDistance = 100;
        const pixelsPerSecond = 160 * zoom;
        const minScale = minDistance / pixelsPerSecond;

        // NICE INTERVALS (in seconds): 1s, 2s, 5s, 10s, 15s, 30s, 1m, 2m, 5m, 10m, 15m, 30m, 1h, 2h
        const niceIntervals = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200];
        let bestScale = niceIntervals[niceIntervals.length - 1];

        for (const interval of niceIntervals) {
            if (interval >= minScale) {
                bestScale = interval;
                break;
            }
        }
        return bestScale;
    };

    const currentScale = getAdaptiveScale(timelineZoom);
    // scaleWidth is the pixel width of one 'scale' unit
    const currentScaleWidth = 160 * timelineZoom * currentScale;
    // Split count: 10 small units if scale is 1, otherwise maybe fewer
    const currentSplitCount = currentScale === 1 ? 10 : (currentScale <= 5 ? 5 : 0);

    // Sync Playhead & Auto Scroll
    useEffect(() => {
        if (timelineRef.current) {
            const timelineTime = timelineRef.current.getTime();
            if (Math.abs(timelineTime - currentTime) > 0.01) {
                timelineRef.current.setTime(currentTime);
            }

            // Auto Scroll Logic
            if (isPlaying && !isPanning) {
                // Calculate cursor position relative to view
                const relativePos = (currentTime * currentScaleWidth / currentScale) - scrollLeft;
                const viewWidth = timelineRef.current.target?.clientWidth || 1000;

                // If cursor is past 90% of screen, scroll forward
                if (relativePos > viewWidth * 0.9) {
                    timelineRef.current.setScrollLeft(scrollLeft + viewWidth * 0.5);
                }
            }
        }
    }, [currentTime, isPlaying, isPanning, scrollLeft, currentScaleWidth, currentScale]);

    return (
        <div
            className={styles.timelineContainer}
            style={{ cursor: getToolCursor() }}
            onMouseDown={handleContainerMouseDown}
            onMouseMove={handleContainerMouseMove}
            onMouseUp={handleContainerMouseUp}
        // Inline onWheel removed in favor of non-passive listener below
        >
            <div className={styles.timelineBody} ref={containerRef}>
                {/* 1. Sidebar (Absolute Overlay) */}
                <div className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>Tracks</div>
                    <div className={styles.sidebarContent}>
                        <div style={{ transform: `translateY(-${scrollTop}px)` }}>
                            {editorData.map(row => (
                                <div key={row.id} style={{ height: row.rowHeight }}>
                                    <TimelineTrackHeader trackId={row.id} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. Main Editor */}
                <div className={styles.timelineEditorContainer}>
                    {marquee && (
                        <div
                            className={styles.marqueeBox}
                            style={{
                                left: Math.min(marquee.startX, marquee.endX),
                                top: Math.min(marquee.startY, marquee.endY),
                                width: Math.abs(marquee.endX - marquee.startX),
                                height: Math.abs(marquee.endY - marquee.startY)
                            }}
                        />
                    )}

                    {/* SYNC SNAPPING GUIDELINES */}
                    {snapLineTime !== null && (
                        <div
                            className={styles.snapGuideLine}
                            style={{
                                left: (snapLineTime / currentScale) * currentScaleWidth - scrollLeft,
                                top: 0,
                                height: '100%',
                            }}
                        />
                    )}

                    <Timeline
                        ref={timelineRef}
                        editorData={editorData}
                        effects={effects}
                        scale={currentScale}
                        scaleWidth={currentScaleWidth}
                        scaleSplitCount={currentSplitCount}
                        startLeft={0}
                        getScaleRender={(time) => {
                            if (time >= 3600) {
                                const hrs = Math.floor(time / 3600);
                                const mins = Math.floor((time % 3600) / 60);
                                const secs = Math.floor(time % 60);
                                return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                            }
                            const mins = Math.floor(time / 60);
                            const secs = Math.floor(time % 60);
                            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                        }}
                        autoScroll={isPlaying}
                        autoReRender={true}
                        // FORCE STYLES: Prevent container scroll, enforce flex layout
                        style={{
                            background: '#1e1e1e',
                            height: '100%',
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}
                        onScroll={({ scrollLeft, scrollTop }) => {
                            setScrollLeft(scrollLeft);
                            setScrollTop(scrollTop);
                        }}

                        getActionRender={getActionRender}

                        onChange={handleEditorChange}
                        onClickAction={handleActionClick}
                        onClickRow={handleRowClick}
                        onClickTimeArea={onClickTimeArea}
                        onCursorDrag={onCursorDrag}
                        onActionMoving={onActionMoving}
                        onActionMoveStart={onActionMoveStart}
                        onActionMoveEnd={onActionMoveEnd}
                        onActionResizing={onActionResizing}

                        disableDrag={
                            activeTool === 'hand' ||
                            trackConfigs['subtitle-track']?.isLocked ||
                            trackConfigs['video-track']?.isLocked
                        }
                    />
                </div>

                {/* No external waveform layer needed anymore */}
            </div>
        </div>
    );
}
