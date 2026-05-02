import { useRef, useCallback } from 'react';
import { TimelineAction, TimelineRow } from '../../../../lib/timeline-engine/src/index';
import { useProjectStore } from '@/store/useProjectStore';
import { SubtitleSegment, VideoSegment } from '@/store/slices/types';
import { calcSnapThreshold, calculateSnappedPosition, checkCollision } from '../utils/snapEngine';
import { useTimelineSplit } from './useTimelineSplit';
import { useTimelineShortcuts } from './useTimelineShortcuts';

const roundTime = (t: number) => Math.round(t * 1000) / 1000;

export function useTimelineHandlers(
    timelineRef: React.RefObject<any>,
    setSnapLineTime: (time: number | null) => void
) {
    const {
        segments,
        videoSegments,
        currentTime,
        setCurrentTime,
        updateSegment,
        deleteSegment,
        videoFile,
        setCurrentSegment,
        setEditingSegment,
        activeTool,
        deleteVideoSegment,
        updateVideoSegment,
        updateSegments,
        initVideoSegments,
        isPlaying,
        setIsPlaying,
        selectedActionId,
        setSelectedActionId,
        multiSelectActionIds,
        setMultiSelectActionIds,
        setSelectedTrackId,
        trackConfigs,
        addSegmentAt,
    } = useProjectStore();

    const lastClickRef = useRef<{ id: string, time: number }>({ id: '', time: 0 });

    // HIGH PERFORMANCE DRAG STATE
    const dragSessionRef = useRef<{
        isDragging: boolean;
        masterId: string | null;
        originalVideoPositions: Map<number, { start: number, end: number, sStart: number, sEnd: number }>;
        originalSubPositions: Map<number, { start: number, end: number }>;
        lastDelta: number;
        rafId: number | null;
    }>({
        isDragging: false,
        masterId: null,
        originalVideoPositions: new Map(),
        originalSubPositions: new Map(),
        lastDelta: 0,
        rafId: null
    });

    // 1. EXTRACTED LOGIC: SPLITTING
    const { handleSplit } = useTimelineSplit();

    // 2. EXTRACTED LOGIC: SHORTCUTS
    useTimelineShortcuts(currentTime, handleSplit);

    const onClickTimeArea = useCallback((time: number) => {
        if (activeTool === 'hand') return false;
        setCurrentTime(time);
        return true;
    }, [activeTool, setCurrentTime]);

    const handleActionClick = useCallback((e: React.MouseEvent, param: { action: TimelineAction; row: TimelineRow; time: number }) => {
        e.stopPropagation();
        // 1. Instant Seek
        setCurrentTime(param.time);

        // 2. Pause Playback on subtitle/video interaction
        if (param.row.id === 'video-track' || param.row.id === 'subtitle-track' || param.row.id.startsWith('subtitle-track')) {
            setIsPlaying(false);
        }

        // 3. Selection
        if (param.action.id !== selectedActionId) {
            const rowId = param.row.id;
            const isVideo = rowId === 'video-track';
            const isWaveform = rowId === 'waveform-track';
            const isSubtitle = !isVideo && !isWaveform;

            let segId = -1;
            if (param.action.data && typeof param.action.data.id === 'number') {
                segId = param.action.data.id;
            } else {
                const match = param.action.id.match(/(\d+)$/);
                segId = match ? parseInt(match[1]) : -1;
            }

            if (activeTool === 'hand') return;

            if (!isWaveform) {
                let newSelection: string[] = [];
                if (e.shiftKey) {
                    // Additive Selection
                    newSelection = [...multiSelectActionIds];
                    if (!newSelection.includes(param.action.id)) {
                        newSelection.push(param.action.id);
                        if (isVideo) {
                            const linkedWaveformId = param.action.id.replace('video-', 'waveform-');
                            if (!newSelection.includes(linkedWaveformId)) newSelection.push(linkedWaveformId);
                        }
                    } else {
                        // Toggle Off if already selected with shift
                        newSelection = newSelection.filter(id => id !== param.action.id);
                        if (isVideo) {
                            const linkedWaveformId = param.action.id.replace('video-', 'waveform-');
                            newSelection = newSelection.filter(id => id !== linkedWaveformId);
                        }
                    }
                } else {
                    // Single Selection
                    newSelection = [param.action.id];
                    if (isVideo) {
                        const linkedWaveformId = param.action.id.replace('video-', 'waveform-');
                        newSelection.push(linkedWaveformId);
                    }
                }

                setSelectedActionId(param.action.id);
                setMultiSelectActionIds(newSelection);
            } else {
                // Waveform Interaction
                const linkedVideoId = param.action.id.replace('waveform-', 'video-');
                let newSelection = [param.action.id, linkedVideoId];
                if (e.shiftKey) {
                    newSelection = Array.from(new Set([...multiSelectActionIds, ...newSelection]));
                }
                setSelectedActionId(param.action.id);
                setMultiSelectActionIds(newSelection);
            }

            // TOOL DISPATCHING
            if (activeTool === 'razor') {
                const state = useProjectStore.getState();
                if (isVideo && state.videoSegments.length === 0 && state.videoFile && state.videoFile.duration > 0) {
                    initVideoSegments(state.videoFile.duration);
                }
                handleSplit(param.time);
                return;
            }

            if (activeTool === 'select') {
                if (isSubtitle && !isNaN(segId)) {
                    setCurrentSegment(segId);
                    const now = Date.now();
                    if (lastClickRef.current.id === param.action.id && (now - lastClickRef.current.time) < 300) {
                        setEditingSegment?.(segId);
                    }
                    lastClickRef.current = { id: param.action.id, time: now };
                }
            }

            if (activeTool === 'split') {
                handleSplit(param.time);
            }

            if (activeTool === 'delete' || activeTool === 'ripple') {
                if (isSubtitle) {
                    // RIPPLE DELETE LOGIC
                    if (activeTool === 'ripple') {
                        const deletedSeg = segments.find(s => s.id === segId);
                        if (deletedSeg) {
                            const duration = deletedSeg.end - deletedSeg.start;
                            // 1. Delete the target
                            deleteSegment(segId);

                            // 2. Shift all subsequent segments left
                            const subsequentSegments = segments
                                .filter(s => s.start > deletedSeg.start && s.id !== segId)
                                .map(s => ({
                                    id: s.id,
                                    updates: {
                                        start: roundTime(s.start - duration),
                                        end: roundTime(s.end - duration)
                                    }
                                }));

                            if (subsequentSegments.length > 0) {
                                updateSegments(subsequentSegments);
                            }
                        }
                    } else {
                        deleteSegment(segId);
                    }
                }
                else if (isVideo || isWaveform) {
                    if (activeTool === 'ripple') {
                        const deletedSeg = videoSegments.find(s => s.id === segId);
                        if (deletedSeg) {
                            const duration = deletedSeg.timelineEnd - deletedSeg.timelineStart;
                            deleteVideoSegment(segId);

                            // Shift subsequent video segments
                            // (This logic needs a batch update function for video segments similar to updateSegments, 
                            // but for now we might have to loop or add a store action. 
                            // Let's assume standard delete for video for this iteration or implement loop)
                            // Ideally we need `updateVideoSegments` batch action.
                            // For now, let's just delete to avoid breaking video track if batch update missing.
                            deleteVideoSegment(segId);
                        }
                    } else {
                        deleteVideoSegment(segId);
                    }
                }
                setSelectedActionId(null);
                setMultiSelectActionIds([]);
            }
        }
    }, [activeTool, handleSplit, initVideoSegments, setCurrentSegment, setEditingSegment, setCurrentTime, deleteSegment, deleteVideoSegment, setSelectedActionId, setMultiSelectActionIds, setIsPlaying, selectedActionId, segments, videoSegments, updateSegments]);

    // ---------------------------------------------------------
    // MASTER-SLAVE MOVEMENT LOGIC (HIGH PERFORMANCE)
    // ---------------------------------------------------------

    const onActionMoveStart = useCallback((param: { action: TimelineAction, row: TimelineRow }) => {
        const state = useProjectStore.getState();
        const session = dragSessionRef.current;
        session.isDragging = true;
        session.masterId = param.action.id;
        session.originalVideoPositions.clear();
        session.originalSubPositions.clear();
        session.lastDelta = 0;

        // 1. Identify all items to move together (Current Selection)
        const selectedIds = new Set(state.multiSelectActionIds);
        if (!selectedIds.has(param.action.id)) selectedIds.add(param.action.id);

        // 2. Capture Original Positions of all Video Segments in selection
        state.videoSegments.forEach(seg => {
            const vidId = `video-${seg.id}`;
            const waveId = `waveform-${seg.id}`;
            if (selectedIds.has(vidId) || selectedIds.has(waveId)) {
                session.originalVideoPositions.set(seg.id, {
                    start: seg.timelineStart,
                    end: seg.timelineEnd,
                    sStart: seg.sourceStart,
                    sEnd: seg.sourceEnd
                });

                // linked subtitles for each video segment in the move
                state.segments.forEach(sub => {
                    if (sub.start >= seg.timelineStart - 0.05 && sub.end <= seg.timelineEnd + 0.05) {
                        session.originalSubPositions.set(sub.id, { start: sub.start, end: sub.end });
                    }
                });
            }
        });

        // 3. Capture any other selected subtitles not implicitly linked to video
        state.segments.forEach(sub => {
            const subActionId = `sub-${sub.id}`;
            // Check dynamic track IDs too if needed
            const isTrackSub = state.multiSelectActionIds.some(id => id.endsWith(`-${sub.id}`));
            if (selectedIds.has(subActionId) || isTrackSub) {
                if (!session.originalSubPositions.has(sub.id)) {
                    session.originalSubPositions.set(sub.id, { start: sub.start, end: sub.end });
                }
            }
        });
    }, []);

    const onActionMoveEnd = useCallback((param: { action: TimelineAction, row: TimelineRow, start: number, end: number }) => {
        const session = dragSessionRef.current;
        session.isDragging = false;

        const masterIdRaw = parseInt(param.action.id.match(/(\d+)$/)?.[1] || "-1");
        const isMasterVideo = param.action.id.includes('video') || param.action.id.includes('waveform');

        const originalStart = isMasterVideo
            ? session.originalVideoPositions.get(masterIdRaw)?.start
            : session.originalSubPositions.get(masterIdRaw)?.start;

        const delta = param.start - (originalStart || 0);
        const state = useProjectStore.getState();

        let finalVideoSegments = undefined;
        let finalSubUpdates = undefined;

        if (session.originalVideoPositions.size > 0) {
            finalVideoSegments = state.videoSegments.map(seg => {
                const orig = session.originalVideoPositions.get(seg.id);
                if (!orig) return seg;
                return { ...seg, timelineStart: roundTime(orig.start + delta), timelineEnd: roundTime(orig.end + delta) };
            });
        }

        if (session.originalSubPositions.size > 0) {
            finalSubUpdates = Array.from(session.originalSubPositions.entries()).map(([id, orig]) => ({
                id,
                updates: { start: roundTime(orig.start + delta), end: roundTime(orig.end + delta) }
            }));
        }

        state.batchMoveItems(finalVideoSegments, finalSubUpdates, null);

        session.masterId = null;
        if (session.rafId) cancelAnimationFrame(session.rafId);
        session.rafId = null;
    }, []);

    const onActionMoving = useCallback((param: { action: TimelineAction, row: TimelineRow, start: number, end: number }) => {
        const session = dragSessionRef.current;
        if (!session.isDragging) return true;

        const state = useProjectStore.getState();

        let originalMasterStart = 0;
        const masterIdRaw = parseInt(session.masterId?.match(/(\d+)$/)?.[1] || "-1");
        const isMasterVideo = session.masterId?.includes('video') || session.masterId?.includes('waveform');

        if (isMasterVideo) {
            originalMasterStart = session.originalVideoPositions.get(masterIdRaw)?.start || 0;
        } else {
            originalMasterStart = session.originalSubPositions.get(masterIdRaw)?.start || 0;
        }

        // SLIP TOOL LOGIC
        if (state.activeTool === 'slip' && isMasterVideo) {
            const orig = session.originalVideoPositions.get(masterIdRaw);
            if (orig) {
                const delta = param.start - orig.start; // How much we moved mouse
                // For SLIP: We want to move content LEFT if we drag LEFT (or right/right)
                // Actually Slip is: "Drag Clip Content".
                // Visual: If I drag the clip block on timeline to right -> I expect timeline pos to change.
                // BUT Slip Tool convention: Dragging inside the clip usually changes in/out points.
                // Standard UX: You click and drag "the content" relative to the "frame".
                // If I drag mouse LEFT, I want to see LATER content (source shift RIGHT).
                // sourceStart += delta?
                // Let's implement: delta applied to sourceStart/End, inverted?

                // If mouse moves +10px (Right):
                // We want to "slip" the content.
                // Usually means: sourceStart -= delta. (Show earlier content).

                const newSourceStart = Math.max(0, orig.sStart - delta);
                // We must check max duration?
                // Let's just clamp to 0.

                const duration = orig.end - orig.start;

                if (state.videoFile && newSourceStart + duration > state.videoFile.duration) {
                    // Clamp end
                    return true;
                }

                // Directly update video segment without moving timeline block.
                // This is a slip edit, so the timeline position of the segment doesn't change.
                state.updateVideoSegment(masterIdRaw, {
                    sourceStart: roundTime(newSourceStart),
                    sourceEnd: roundTime(newSourceStart + duration)
                });
                // We do NOT call batchMoveItems because we aren't moving the timeline block.
                return true;
            }
        }

        session.lastDelta = param.start - originalMasterStart;

        if (!session.rafId) {
            session.rafId = requestAnimationFrame(() => {
                const delta = session.lastDelta;
                const state = useProjectStore.getState();

                // REAL-TIME SYNC: Update both Master and Slaves in the store
                let newVideoSegments = undefined;
                let subUpdates = undefined;

                if (session.originalVideoPositions.size > 0) {
                    newVideoSegments = state.videoSegments.map(seg => {
                        const orig = session.originalVideoPositions.get(seg.id);
                        if (!orig) return seg;
                        return { ...seg, timelineStart: roundTime(orig.start + delta), timelineEnd: roundTime(orig.end + delta) };
                    });
                }

                if (session.originalSubPositions.size > 0) {
                    const updates: { id: number, updates: any }[] = [];
                    session.originalSubPositions.forEach((orig, subId) => {
                        updates.push({ id: subId, updates: { start: roundTime(orig.start + delta), end: roundTime(orig.end + delta) } });
                    });
                    if (updates.length > 0) subUpdates = updates;
                }

                // Batch update ensures they all move in the SAME React render cycle
                state.batchMoveItems(newVideoSegments, subUpdates, null);
                session.rafId = null;
            });
        }

        return true;
    }, []);

    const onActionResizing = useCallback((param: { action: TimelineAction, row: TimelineRow, start: number, end: number, dir: 'left' | 'right' }) => {
        const isVideoTrack = param.row.id === 'video-track';
        const isSubTrack = param.row.id === 'subtitle-track' || param.row.id.startsWith('subtitle-track');

        if (!isVideoTrack && !isSubTrack) return true;

        const state = useProjectStore.getState();
        const videoFile = state.videoFile;
        if (!videoFile) return true;

        const segId = parseInt(param.action.id.replace('video-', ''));
        const seg = state.videoSegments.find(s => s.id === segId);
        if (!seg) return true;

        const roundedStart = roundTime(param.start);
        const roundedEnd = roundTime(param.end);

        if (isVideoTrack) {
            const videoFile = state.videoFile;
            if (!videoFile) return true;

            const segId = parseInt(param.action.id.replace('video-', ''));
            const seg = state.videoSegments.find(s => s.id === segId);
            if (!seg) return true;

            const startDelta = roundTime(roundedStart - seg.timelineStart);
            const endDelta = roundTime(roundedEnd - seg.timelineEnd);

            if (param.dir === 'left') {
                const prospectiveSourceStart = roundTime(seg.sourceStart + startDelta);
                if (prospectiveSourceStart < -0.001) return false;
                if (roundedStart >= roundedEnd - 0.1) return false;
            } else {
                const prospectiveSourceEnd = roundTime(seg.sourceEnd + endDelta);
                if (prospectiveSourceEnd > videoFile.duration + 0.01) return false;
                if (roundedEnd <= roundedStart + 0.1) return false;
            }

            const linkedSubs = state.segments.filter(s => s.start >= seg.timelineStart - 0.05 && s.end <= seg.timelineEnd + 0.05);
            if (linkedSubs.length > 0) {
                const batchUpdates = linkedSubs.map(sub => {
                    let newS = sub.start;
                    let newE = sub.end;
                    if (Math.abs(sub.start - seg.timelineStart) < 0.1) newS = roundedStart;
                    if (Math.abs(sub.end - seg.timelineEnd) < 0.1) newE = roundedEnd;
                    newS = Math.round(Math.max(roundedStart, newS) * 1000) / 1000;
                    newE = Math.round(Math.min(roundedEnd, newE) * 1000) / 1000;
                    return newE > newS + 0.05 ? { id: sub.id, updates: { start: newS, end: newE } } : null;
                }).filter(Boolean) as { id: number; updates: any }[];

                if (batchUpdates.length > 0) updateSegments(batchUpdates);
            }

            // DIRECT STORE UPDATES (FOR PERFORMANCE)
            updateVideoSegment(segId, {
                timelineStart: roundedStart,
                timelineEnd: roundedEnd,
                sourceStart: roundTime(seg.sourceStart + startDelta),
                sourceEnd: roundTime(seg.sourceEnd + endDelta)
            });

            // RIPPLE RESIZE: Shift all subsequent video segments
            if (state.activeTool === 'ripple') {
                const delta = param.dir === 'left' ? -startDelta : endDelta;
                const subsequentVideo = state.videoSegments
                    .filter(s => s.timelineStart >= seg.timelineEnd - 0.05 && s.id !== segId)
                    .map(s => ({
                        id: s.id,
                        updates: {
                            timelineStart: roundTime(s.timelineStart + delta),
                            timelineEnd: roundTime(s.timelineEnd + delta)
                        }
                    }));

                if (subsequentVideo.length > 0) {
                    subsequentVideo.forEach(update => state.updateVideoSegment(update.id, update.updates));
                }

                // Also shift subsequent subtitles
                const subsequentSubs = state.segments
                    .filter(s => s.start >= seg.timelineEnd - 0.05)
                    .map(s => ({
                        id: s.id,
                        updates: {
                            start: roundTime(s.start + delta),
                            end: roundTime(s.end + delta)
                        }
                    }));
                if (subsequentSubs.length > 0) state.updateSegments(subsequentSubs);
            }
        } else if (isSubTrack) {
            const match = param.action.id.match(/(\d+)$/);
            const segId = match ? parseInt(match[1]) : -1;
            const seg = state.segments.find(s => s.id === segId);
            if (!seg) return true;

            const startDelta = roundTime(roundedStart - seg.start);
            const endDelta = roundTime(roundedEnd - seg.end);

            // Minimum duration check (Respect handles)
            if (roundedEnd <= roundedStart + 0.05) return false;

            updateSegment(segId, { start: roundedStart, end: roundedEnd });

            if (state.activeTool === 'ripple') {
                const delta = param.dir === 'left' ? -startDelta : endDelta;
                const subsequentSubs = state.segments
                    .filter(s => s.start >= seg.end - 0.05 && s.id !== segId)
                    .map(s => ({
                        id: s.id,
                        updates: {
                            start: roundTime(s.start + delta),
                            end: roundTime(s.end + delta)
                        }
                    }));
                if (subsequentSubs.length > 0) updateSegments(subsequentSubs);
            }
        }

        return true;
    }, [updateVideoSegment, updateSegments, updateSegment]);

    const handleRowClick = useCallback((e: React.MouseEvent, param: { row: TimelineRow; time: number }) => {
        e.stopPropagation();
        // 1. Instant Seek
        setCurrentTime(param.time);

        // 2. Pause Playback
        setIsPlaying(false);

        // 3. Deselect Actions (Clicking empty space)
        setSelectedActionId(null);

        if (activeTool === 'hand') return;

        if (activeTool === 'text') {
            if (param.row.id === 'subtitle-track' || param.row.id.startsWith('track-')) {
                addSegmentAt(param.time, param.row.id);
                return;
            }
        }

        setSelectedActionId(null);
        setMultiSelectActionIds([]);
        setCurrentTime(param.time);
        useProjectStore.getState().setIsPlaying(false);
    }, [activeTool, setSelectedActionId, setMultiSelectActionIds, setCurrentTime, addSegmentAt]);

    const handleEditorChange = useCallback((data: TimelineRow[]) => {
        if (activeTool !== 'select') return;

        const state = useProjectStore.getState();
        const { snapEnabled, timelineZoom } = state;
        const SNAP_THRESHOLD = calcSnapThreshold(timelineZoom, 8);
        let activeSnapTime: number | null = null;

        // Collect snap targets
        const snapTargets: { start: number, end: number }[] = [];
        data.forEach(r => r.actions.forEach(a => snapTargets.push({ start: a.start, end: a.end })));

        data.forEach(row => {
            const isSubTrack = row.id === 'subtitle-track';
            const isVideoTrack = row.id === 'video-track';
            if (!isSubTrack && !isVideoTrack || trackConfigs[row.id]?.isLocked) return;

            const currentSegments = isSubTrack ? segments : videoSegments;

            row.actions.forEach(action => {
                const match = action.id.match(/(\d+)$/);
                const movedIdRaw = match ? parseInt(match[1]) : -1;
                if (movedIdRaw === -1) return;

                const originalSeg = currentSegments.find(s => s.id === movedIdRaw);
                if (!originalSeg) return;

                const oStart = isSubTrack ? (originalSeg as SubtitleSegment).start : (originalSeg as VideoSegment).timelineStart;
                const oEnd = isSubTrack ? (originalSeg as SubtitleSegment).end : (originalSeg as VideoSegment).timelineEnd;

                if (Math.abs(action.start - oStart) < 0.001 && Math.abs(action.end - oEnd) < 0.001) return;

                const otherActionsOnRow = row.actions.filter(a => a.id !== action.id);
                const targets = snapEnabled ? snapTargets.filter(t => t.start !== action.start || t.end !== action.end) : [];

                const { snappedStart, snappedEnd, snappedTime } = calculateSnappedPosition(
                    action.start,
                    action.end,
                    targets,
                    SNAP_THRESHOLD,
                    currentTime
                );

                let finalStart = snappedStart;
                let finalEnd = snappedEnd;

                if (checkCollision(finalStart, finalEnd, otherActionsOnRow)) {
                    finalStart = oStart;
                    finalEnd = oEnd;
                    activeSnapTime = null;
                } else {
                    activeSnapTime = snappedTime;
                }

                if (finalStart < 0) {
                    finalStart = 0;
                    finalEnd = finalEnd - snappedStart;
                    activeSnapTime = 0;
                }

                if (isSubTrack) {
                    updateSegment(movedIdRaw, { start: roundTime(finalStart), end: roundTime(finalEnd) });
                } else if (isVideoTrack) {
                    const videoSeg = originalSeg as VideoSegment;
                    const startDelta = roundTime(finalStart - oStart);
                    const endDelta = roundTime(finalEnd - oEnd);

                    const linkedSubs = segments.filter(s => s.start >= oStart - 0.05 && s.end <= oEnd + 0.05);

                    if (Math.abs(startDelta - endDelta) < 0.002) {
                        linkedSubs.forEach(sub => updateSegment(sub.id, { start: roundTime(sub.start + startDelta), end: roundTime(sub.end + startDelta) }));
                        updateVideoSegment(movedIdRaw, { timelineStart: roundTime(finalStart), timelineEnd: roundTime(finalEnd) });
                    } else {
                        linkedSubs.forEach(sub => {
                            let newS = Math.max(finalStart, Math.abs(sub.start - oStart) < 0.1 ? finalStart : sub.start);
                            let newE = Math.min(finalEnd, Math.abs(sub.end - oEnd) < 0.1 ? finalEnd : sub.end);
                            if (newE > newS + 0.05) updateSegment(sub.id, { start: roundTime(newS), end: roundTime(newE) });
                        });

                        updateVideoSegment(movedIdRaw, {
                            timelineStart: roundTime(finalStart),
                            timelineEnd: roundTime(finalEnd),
                            sourceStart: roundTime(videoSeg.sourceStart + startDelta),
                            sourceEnd: roundTime(videoSeg.sourceEnd + endDelta)
                        });
                    }
                }
            });
        });

        setSnapLineTime(activeSnapTime);
        if (activeSnapTime !== null) setTimeout(() => setSnapLineTime(null), 1500);
    }, [activeTool, trackConfigs, segments, videoSegments, currentTime, updateSegment, updateVideoSegment, setSnapLineTime]);

    const onCursorDrag = useCallback((time: number) => {
        if (activeTool === 'hand') return;
        setCurrentTime(time);
    }, [activeTool, setCurrentTime]);

    return {
        handleActionClick,
        handleRowClick,
        handleSplit,
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
    };
}

