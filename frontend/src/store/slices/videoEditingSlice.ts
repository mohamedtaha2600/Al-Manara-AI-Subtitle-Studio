import { StateCreator } from 'zustand'
import { VideoSegment } from './types'

export interface VideoEditingSlice {
    videoSegments: VideoSegment[]
    videoTrimStart: number
    videoTrimEnd: number | null

    // Actions
    setVideoSegments: (segments: VideoSegment[]) => void
    initVideoSegments: (duration: number) => void
    splitVideoSegment: (segmentId: number, splitTime: number) => void
    deleteVideoSegment: (segmentId: number) => void
    updateVideoSegment: (segmentId: number, updates: Partial<VideoSegment>) => void
    setVideoTrimStart: (time: number) => void
    setVideoTrimEnd: (time: number | null) => void

    resetVideoEditing: () => void
}

export const createVideoEditingSlice: StateCreator<VideoEditingSlice> = (set, get) => {
    const roundTime = (t: number) => Math.round(t * 1000) / 1000;

    return {
        videoSegments: [],
        videoTrimStart: 0,
        videoTrimEnd: null,

        setVideoSegments: (segments) => set({ videoSegments: segments }),

        initVideoSegments: (duration: number) => {
            const roundedDur = roundTime(duration);
            set({
                videoSegments: [{
                    id: 1,
                    timelineStart: 0,
                    timelineEnd: roundedDur,
                    sourceStart: 0,
                    sourceEnd: roundedDur,
                    isMuted: false,
                    isLocked: false
                }]
            });
        },

        splitVideoSegment: (segmentId: number, splitTime: number) => set((state) => {
            const roundedSplit = roundTime(splitTime);
            const segment = state.videoSegments.find(s => s.id === segmentId)

            if (!segment) return state;

            if (roundedSplit <= segment.timelineStart + 0.001 || roundedSplit >= segment.timelineEnd - 0.001) {
                return state;
            }

            const ratio = (roundedSplit - segment.timelineStart) / (segment.timelineEnd - segment.timelineStart)
            const sourceSplit = roundTime(segment.sourceStart + ratio * (segment.sourceEnd - segment.sourceStart))

            const newId = Math.max(0, ...state.videoSegments.map(s => s.id)) + 1

            const firstHalf: VideoSegment = {
                ...segment,
                timelineEnd: roundedSplit,
                sourceEnd: sourceSplit
            }

            const secondHalf: VideoSegment = {
                id: newId,
                timelineStart: roundedSplit,
                timelineEnd: segment.timelineEnd,
                sourceStart: sourceSplit,
                sourceEnd: segment.sourceEnd,
                isMuted: segment.isMuted,
                isLocked: segment.isLocked
            }

            const newSegments = state.videoSegments
                .filter(s => s.id !== segmentId)
                .concat([firstHalf, secondHalf])
                .sort((a, b) => a.timelineStart - b.timelineStart)

            return { videoSegments: newSegments }
        }),

        deleteVideoSegment: (segmentId: number) => set((state) => ({
            videoSegments: state.videoSegments.filter(s => s.id !== segmentId)
        })),

        updateVideoSegment: (segmentId: number, updates: Partial<VideoSegment>) => set((state) => ({
            videoSegments: state.videoSegments.map(s => {
                if (s.id !== segmentId) return s;
                const updated = { ...s, ...updates };
                if (updates.timelineStart !== undefined) updated.timelineStart = roundTime(updated.timelineStart);
                if (updates.timelineEnd !== undefined) updated.timelineEnd = roundTime(updated.timelineEnd);
                if (updates.sourceStart !== undefined) updated.sourceStart = roundTime(updated.sourceStart);
                if (updates.sourceEnd !== undefined) updated.sourceEnd = roundTime(updated.sourceEnd);
                return updated;
            })
        })),

        setVideoTrimStart: (time) => set({ videoTrimStart: time }),
        setVideoTrimEnd: (time) => set({ videoTrimEnd: time }),

        resetVideoEditing: () => set({
            videoSegments: [],
            videoTrimStart: 0,
            videoTrimEnd: null
        })
    }
}
