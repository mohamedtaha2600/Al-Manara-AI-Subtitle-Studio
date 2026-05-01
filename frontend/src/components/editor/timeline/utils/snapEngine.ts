import { TimelineAction } from '../../../../lib/timeline-engine/src/index';

/**
 * Calculates the snap threshold in seconds based on a physical pixel distance.
 * @param zoom The current timeline zoom level.
 * @param physicalPixels The distance in pixels to trigger a snap.
 */
export const calcSnapThreshold = (zoom: number, physicalPixels: number = 8): number => {
    const pixelsPerSecond = 160 * zoom;
    return physicalPixels / pixelsPerSecond;
};

/**
 * Snapping Result interface
 */
export interface SnapResult {
    snappedStart: number;
    snappedEnd: number;
    snappedTime: number | null;
}

/**
 * Calculates snapped positions for a block being moved or resized.
 */
export const calculateSnappedPosition = (
    tentativeStart: number,
    tentativeEnd: number,
    targets: { start: number, end: number }[],
    threshold: number,
    playheadTime: number | null
): SnapResult => {
    const duration = tentativeEnd - tentativeStart;
    let snappedStart = tentativeStart;
    let snappedEnd = tentativeEnd;
    let snappedTime: number | null = null;

    // 1. Snap to Targets (Cross-track)
    for (const target of targets) {
        // Snap Start to Target End
        if (Math.abs(tentativeStart - target.end) < threshold) {
            snappedStart = target.end;
            snappedEnd = snappedStart + duration;
            snappedTime = target.end;
            return { snappedStart, snappedEnd, snappedTime };
        }
        // Snap End to Target Start
        if (Math.abs(tentativeEnd - target.start) < threshold) {
            snappedEnd = target.start;
            snappedStart = snappedEnd - duration;
            snappedTime = target.start;
            return { snappedStart, snappedEnd, snappedTime };
        }
    }

    // 2. Snap to Playhead
    if (playheadTime !== null) {
        if (Math.abs(tentativeStart - playheadTime) < threshold) {
            snappedStart = playheadTime;
            snappedEnd = snappedStart + duration;
            snappedTime = playheadTime;
            return { snappedStart, snappedEnd, snappedTime };
        }
        if (Math.abs(tentativeEnd - playheadTime) < threshold) {
            snappedEnd = playheadTime;
            snappedStart = snappedEnd - duration;
            snappedTime = playheadTime;
            return { snappedStart, snappedEnd, snappedTime };
        }
    }

    // 3. Snap to Zero
    if (Math.abs(tentativeStart) < threshold) {
        snappedStart = 0;
        snappedEnd = duration;
        snappedTime = 0;
        return { snappedStart, snappedEnd, snappedTime };
    }

    return { snappedStart, snappedEnd, snappedTime };
};

/**
 * Checks if a proposed block position collides with existing blocks on the same track.
 */
export const checkCollision = (
    start: number,
    end: number,
    others: { start: number, end: number }[],
    buffer: number = 0.01
): boolean => {
    return others.some(other => (start < other.end - buffer && end > other.start + buffer));
};
