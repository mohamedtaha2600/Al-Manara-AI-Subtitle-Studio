import { useCallback } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { SubtitleSegment } from '@/store/slices/types';
import { formatTime } from '@/utils/timeUtils';

const roundTime = (t: number) => Math.round(t * 1000) / 1000;

export function useTimelineSplit() {
    const {
        segments,
        videoSegments,
        setSegments,
        splitVideoSegment,
        initVideoSegments,
        videoFile,
        addLog,
        selectedTrackIds
    } = useProjectStore();

    const handleSplit = useCallback((targetTime: number) => {
        const roundedTime = roundTime(targetTime);
        console.log('[TimelineSplit] handleSplit at:', roundedTime);

        // CHECK SELECTION STATE
        const hasSelection = selectedTrackIds && selectedTrackIds.length > 0;

        // Define which tracks to operate on
        const shouldSplitSubs = !hasSelection || selectedTrackIds?.some(id => id === 'subtitle-track' || id.startsWith('track-'));
        const shouldSplitVideo = !hasSelection || selectedTrackIds?.some(id => id === 'video-track' || id === 'waveform-track');

        // 1. SPLIT SUBTITLES
        if (shouldSplitSubs) {
            const subToSplit = segments.find(s => roundedTime > s.start + 0.1 && roundedTime < s.end - 0.1);
            if (subToSplit) {
                const newId = Math.max(0, ...segments.map(s => s.id)) + 1;
                const newSeg: SubtitleSegment = { ...subToSplit, id: newId, start: roundedTime, end: subToSplit.end };
                const updatedOriginal = { ...subToSplit, end: roundedTime };

                const newSegmentsList = segments
                    .filter(s => s.id !== subToSplit.id)
                    .concat([updatedOriginal, newSeg])
                    .map(s => ({ ...s, start: roundTime(s.start), end: roundTime(s.end) }))
                    .sort((a, b) => a.start - b.start);

                setSegments(newSegmentsList);
                addLog?.('info', `Split subtitle at ${formatTime(roundedTime)}`);
            }
        }

        // 2. SPLIT VIDEO
        if (shouldSplitVideo) {
            if (videoSegments.length === 0 && videoFile && videoFile.duration > 0) {
                initVideoSegments(videoFile.duration);
            }

            const videoToSplit = videoSegments.find(s => roundedTime > s.timelineStart + 0.1 && roundedTime < s.timelineEnd - 0.1);
            if (videoToSplit) {
                splitVideoSegment(videoToSplit.id, roundedTime);
            }
        }
    }, [segments, videoSegments, videoFile, selectedTrackIds, setSegments, splitVideoSegment, initVideoSegments, addLog]);

    return { handleSplit };
}
