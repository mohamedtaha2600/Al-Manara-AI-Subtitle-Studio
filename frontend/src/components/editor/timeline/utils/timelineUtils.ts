/**
 * Timeline Utilities
 * Helper functions for timeline operations
 */

import { SubtitleSegment } from '@/store/useProjectStore'

/**
 * Get safe bounds for a segment (collision detection)
 * Returns the min/max time the segment can extend to without overlapping neighbors
 */
export function getSafeBounds(
    segmentId: number,
    currentStart: number,
    currentEnd: number,
    segments: SubtitleSegment[],
    totalDuration: number
): { min: number; max: number } {
    const currentSeg = segments.find(s => s.id === segmentId)
    if (!currentSeg) return { min: 0, max: totalDuration }

    // Filter segments excluding self
    const otherSegments = segments.filter(s => s.id !== segmentId)

    let minTime = 0
    let maxTime = totalDuration

    otherSegments.forEach(s => {
        // If segment is before current, it limits the start (minTime)
        if (s.end <= currentStart + 0.01) {
            if (s.end > minTime) minTime = s.end
        }
        // If segment is after current, it limits the end (maxTime)
        if (s.start >= currentEnd - 0.01) {
            if (s.start < maxTime) maxTime = s.start
        }
    })

    return { min: minTime, max: maxTime }
}

/**
 * Magnetic snapping - finds the nearest snap point
 */
export function getSnapTime(
    targetTime: number,
    ignoreSegmentId: number | null,
    segments: SubtitleSegment[],
    currentTime: number,
    threshold: number = 0.15 // 150ms
): number {
    let bestSnap = targetTime
    let minDiff = threshold

    // Snap to Segments
    segments.forEach(s => {
        if (s.id === ignoreSegmentId) return

        // Snap to Start
        if (Math.abs(s.start - targetTime) < minDiff) {
            minDiff = Math.abs(s.start - targetTime)
            bestSnap = s.start
        }
        // Snap to End
        if (Math.abs(s.end - targetTime) < minDiff) {
            minDiff = Math.abs(s.end - targetTime)
            bestSnap = s.end
        }
    })

    // Snap to Playhead
    if (Math.abs(currentTime - targetTime) < minDiff) {
        bestSnap = currentTime
    }

    return bestSnap
}

/**
 * Calculate time from mouse X position
 */
export function getTimeFromPosition(
    clientX: number,
    rect: DOMRect,
    scrollLeft: number,
    trackLabelWidth: number,
    pixelsPerSecond: number,
    totalDuration: number
): number {
    const x = clientX - rect.left + scrollLeft - trackLabelWidth
    return Math.max(0, Math.min(x / pixelsPerSecond, totalDuration))
}
