'use client'

/**
 * Professional Subtitle Timeline Component - V3 (VisTimeline Integration)
 * شريط الزمن الاحترافي - الإصدار الثالث
 * 
 * Powered by vis-timeline
 */

import { useRef, useEffect, useCallback, useState } from 'react'
import { useProjectStore, SubtitleSegment } from '@/store/useProjectStore'
import styles from './Timeline.module.css'
import { formatTime } from '@/utils/timeUtils'
import { TimelineTool } from './hooks/useTimelineTools'

// New VisTimeline Adapter
import VisTimelineWrapper from './VisTimelineWrapper'
import TimelineToolbar from './components/TimelineToolbar' // Reusing toolbar for now, or might replace

export default function Timeline() {
    const {
        segments,
        currentSegment,
        setCurrentSegment,
        videoFile,
        currentTime,
        setCurrentTime,
        setIsPlaying,
        addLog,
        setSegments,
        editingSegment,
        setEditingSegment,
        updateSegment,
        activePanel,
        videoSegments,
        initVideoSegments,
        detectedSilence,
        deleteSegment,
        activeTool,
        setActiveTool,
        splitVideoSegment,
    } = useProjectStore()

    // Initialize video segments when video is loaded
    useEffect(() => {
        if (videoFile && videoFile.duration > 0 && videoSegments.length === 0) {
            initVideoSegments(videoFile.duration)
        }
    }, [videoFile, videoSegments.length, initVideoSegments])

    // Handlers
    const handleTimeChange = useCallback((time: number) => {
        setCurrentTime(time)
        // If playing, we might want to pause when scrubbing manually
        // setIsPlaying(false) 
    }, [setCurrentTime])

    const handleSegmentUpdate = useCallback((updatedSegment: SubtitleSegment) => {
        updateSegment(updatedSegment.id, {
            start: updatedSegment.start,
            end: updatedSegment.end,
            text: updatedSegment.text
        })
        // addLog?.('success', `Updated segment ${updatedSegment.id}`)
    }, [updateSegment, addLog])

    const handleSegmentClick = useCallback((segmentId: number) => {
        setCurrentSegment(segmentId)
        // Also seek to start of segment?
        const seg = segments.find(s => s.id === segmentId)
        if (seg) {
            setCurrentTime(seg.start)
        }
    }, [setCurrentSegment, segments, setCurrentTime])

    const isSilenceMode = activePanel === 'silence'

    // Calculate Video Segments based on silence/trims if needed
    // For now passing raw videoSegments from store
    const displayVideoSegments = videoSegments.length > 0 && videoFile
        ? videoSegments
        : (videoFile ? [{ id: 1, timelineStart: 0, timelineEnd: videoFile.duration }] : [])

    const handleSegmentDoubleClick = useCallback((segmentId: number) => {
        setEditingSegment(segmentId)
        // Optionally set edit text immediately if needed, usually store handles it or component reads it
    }, [setEditingSegment])

    const handleDeleteSegment = useCallback((segmentId: number) => {
        deleteSegment(segmentId)
    }, [deleteSegment])



    const handleSplitSegment = useCallback((targetTime?: number) => {
        const splitTime = targetTime ?? currentTime;

        // 1. SPLIT SUBTITLES
        const subToSplit = segments.find(s => splitTime > s.start + 0.1 && splitTime < s.end - 0.1)
        if (subToSplit) {
            const newId = Math.max(0, ...segments.map(s => s.id)) + 1
            const newSeg: SubtitleSegment = { ...subToSplit, id: newId, start: splitTime, end: subToSplit.end }
            const updatedOriginal = { ...subToSplit, end: splitTime }

            const newSegmentsList = segments
                .filter(s => s.id !== subToSplit.id)
                .concat([updatedOriginal, newSeg])
                .sort((a, b) => a.start - b.start)

            setSegments(newSegmentsList)
            addLog?.('info', `Split subtitle at ${formatTime(splitTime)}`)
        }

        // 2. SPLIT VIDEO
        // Ensure video is initialized
        if (videoSegments.length === 0 && videoFile && videoFile.duration > 0) {
            initVideoSegments(videoFile.duration);
        }

        const videoToSplit = videoSegments.find(s => splitTime > s.timelineStart + 0.1 && splitTime < s.timelineEnd - 0.1)
        if (videoToSplit) {
            splitVideoSegment(videoToSplit.id, splitTime);
            console.log('[Timeline] Toolbar Split: Video cut at', splitTime);
        }
    }, [segments, videoSegments, videoFile, currentTime, setSegments, splitVideoSegment, initVideoSegments, addLog])

    return (
        <div className={styles.container} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <TimelineToolbar
                onSplitSegment={() => handleSplitSegment()}
                isVideoAudioLinked={true} // Placeholder
            />

            <VisTimelineWrapper />
        </div>
    )
}
