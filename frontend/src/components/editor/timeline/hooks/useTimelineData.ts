import { useMemo } from 'react';
import { TimelineRow } from '../../../../lib/timeline-engine/src/index';
import { useProjectStore } from '@/store/useProjectStore';

export function useTimelineData() {
    const segments = useProjectStore(state => state.segments);
    const videoSegments = useProjectStore(state => state.videoSegments);
    const videoFile = useProjectStore(state => state.videoFile);
    const selectedActionId = useProjectStore(state => state.selectedActionId);
    const tracks = useProjectStore(state => state.tracks);
    const vadSegments = useProjectStore(state => state.vadSegments);
    const showVADOverlay = useProjectStore(state => state.showVADOverlay);
    const activePanel = useProjectStore(state => state.activePanel);

    const editorData = useMemo(() => {
        const isSilenceMode = activePanel === 'silence';

        // ... (previous logic)
        // Group 0: Subtitle Tracks (Dynamic)
        const activeTracks = (tracks || []);

        // If no tracks yet (legacy or empty), show at least one empty or based on segments
        const subtitleRows: TimelineRow[] = activeTracks.length > 0
            ? activeTracks.map((track) => ({
                id: track.id,
                rowHeight: 32,
                actions: track.segments.map((seg: any) => {
                    const actionId = `${track.id}-${seg.id}`;
                    return {
                        id: actionId,
                        start: seg.start,
                        end: seg.end,
                        effectId: 'subtitleEffect',
                        data: {
                            ...seg,
                            isSelected: selectedActionId === actionId,
                            trackId: track.id
                        }
                    };
                })
            }))
            : [{
                id: 'subtitle-track', // Legacy fallback ID
                rowHeight: 32,
                actions: segments.map(seg => {
                    const actionId = `sub-${seg.id}`;
                    return {
                        id: actionId,
                        start: seg.start,
                        end: seg.end,
                        effectId: 'subtitleEffect',
                        data: {
                            ...seg,
                            isSelected: selectedActionId === actionId
                        }
                    };
                })
            }];

        // Group 1: Video Track (Middle)
        const displayVideoSegments = videoSegments.length > 0
            ? videoSegments
            : (videoFile ? [{ id: 1, timelineStart: 0, timelineEnd: videoFile.duration || 100 }] : []);

        const videoTrack: TimelineRow = {
            id: 'video-track',
            rowHeight: 50,
            actions: displayVideoSegments.map((seg: any) => {
                const actionId = `video-${seg.id}`;
                return {
                    id: actionId,
                    start: seg.timelineStart,
                    end: seg.timelineEnd,
                    effectId: 'videoEffect',
                    data: {
                        ...seg,
                        label: `Clip ${seg.id}`,
                        isSelected: selectedActionId === actionId
                    }
                };
            })
        };

        const waveformTrack: TimelineRow = {
            id: 'waveform-track',
            rowHeight: 60,
            actions: (videoFile && displayVideoSegments.length > 0)
                ? displayVideoSegments.map((seg: any) => ({
                    id: `waveform-${seg.id}`,
                    start: seg.timelineStart,
                    end: seg.timelineEnd,
                    effectId: 'audioEffect',
                    data: {
                        type: 'waveform',
                        videoUrl: videoFile.url,
                        sourceStart: seg.sourceStart,
                        sourceEnd: seg.sourceEnd,
                        vadSegments: showVADOverlay ? vadSegments : []
                    }
                })) : [],
        };

        const finalEditorData: TimelineRow[] = [];

        // HIDE SUBTITLE TRACKS IN SILENCE MODE
        if (!isSilenceMode) {
            finalEditorData.push(...subtitleRows);
        }

        if (videoFile?.type === 'video') {
            finalEditorData.push(videoTrack);
        }
        finalEditorData.push(waveformTrack);

        return finalEditorData;
    }, [segments, videoSegments, videoFile, selectedActionId, tracks, vadSegments, showVADOverlay, activePanel]);

    return editorData;
}
