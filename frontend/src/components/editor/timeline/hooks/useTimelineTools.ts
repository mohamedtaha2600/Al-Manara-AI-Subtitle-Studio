/**
 * useTimelineTools Hook
 * Manages timeline editing tools (Select, Razor, Hand)
 * أدوات تحرير التايم لاين
 */

import { useState, useCallback } from 'react'
import { useProjectStore } from '@/store/useProjectStore'

export type TimelineTool = 'select' | 'razor' | 'hand' | 'split' | 'delete' | 'text' | 'ripple' | 'slip'

interface UseTimelineToolsReturn {
    activeTool: TimelineTool
    setActiveTool: (tool: TimelineTool) => void
    getCursor: () => string
    handleToolClick: (time: number) => void
}

export function useTimelineTools(): UseTimelineToolsReturn {
    const [activeTool, setActiveTool] = useState<TimelineTool>('select')

    const {
        segments,
        setSegments,
        currentTime,
        addLog,
        // Silence state for linked cutting
        detectedSilence,
        setDetectedSilence,
        // Video trim state - for cutting video/audio
        videoTrimStart,
        videoTrimEnd,
        setVideoTrimEnd,
        videoFile
    } = useProjectStore()

    // Get CSS cursor based on active tool
    const getCursor = useCallback((): string => {
        switch (activeTool) {
            case 'razor':
                return 'url("/cursors/razor-cursor.svg") 8 0, crosshair'
            case 'text':
                return 'text'
            case 'hand':
                return 'grab'
            case 'select':
            default:
                return 'default'
        }
    }, [activeTool])

    // Handle click on timeline based on active tool
    const handleToolClick = useCallback((time: number) => {
        if (activeTool !== 'razor') return

        const totalDuration = videoFile?.duration || 60
        const currentTrimEnd = videoTrimEnd ?? totalDuration

        // Check if clicking within the current video clip range
        if (time >= videoTrimStart && time <= currentTrimEnd) {
            // CUT: Set the trim end to the cut point (removes everything after)
            setVideoTrimEnd(time)
            addLog?.('success', `✂️ قص الفيديو والصوت عند ${formatTimeSimple(time)}`)
        }

        // Also split subtitle segments at this time
        const segmentToSplit = segments.find(s => s.start <= time && s.end >= time)

        if (segmentToSplit) {
            // Split subtitle segment
            const splitTime = time
            const firstHalf = { ...segmentToSplit, end: splitTime }
            const newId = Math.max(0, ...segments.map(s => s.id)) + 1
            const secondHalf = {
                ...segmentToSplit,
                id: newId,
                start: splitTime,
                text: segmentToSplit.text
            }

            const newSegments = segments.map(s => s.id === segmentToSplit.id ? firstHalf : s)
            newSegments.push(secondHalf)
            newSegments.sort((a, b) => a.start - b.start)

            setSegments(newSegments)
        }

        // Also split silence segments if any exist at this point
        const silenceToSplit = detectedSilence.find(s => s.start <= time && s.end >= time)
        if (silenceToSplit) {
            const firstHalf = { ...silenceToSplit, end: time, duration: time - silenceToSplit.start }
            const newId = Math.max(0, ...detectedSilence.map(s => s.id)) + 1
            const secondHalf = {
                ...silenceToSplit,
                id: newId,
                start: time,
                duration: silenceToSplit.end - time
            }

            const newSilence = detectedSilence.map(s => s.id === silenceToSplit.id ? firstHalf : s)
            newSilence.push(secondHalf)
            newSilence.sort((a, b) => a.start - b.start)

            setDetectedSilence(newSilence)
        }
    }, [activeTool, segments, setSegments, addLog, detectedSilence, setDetectedSilence, videoFile, videoTrimStart, videoTrimEnd, setVideoTrimEnd])

    return {
        activeTool,
        setActiveTool,
        getCursor,
        handleToolClick
    }
}

// Simple time formatter
function formatTimeSimple(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}
