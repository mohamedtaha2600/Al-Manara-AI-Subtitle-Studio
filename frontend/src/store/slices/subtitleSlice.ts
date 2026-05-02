import { StateCreator } from 'zustand'
import { SubtitleSegment, SegmentationSettings, Word, SubtitleStyle } from './types'

export interface SubtitleSlice {
    segments: SubtitleSegment[]
    originalSegments: SubtitleSegment[]
    currentSegment: number | null
    selectedSegments: number[]

    editingSegment: number | null
    editText: string

    speakerStyles: Record<string, { name: string; color: string }>
    segmentationSettings: SegmentationSettings

    // Actions
    setSegments: (segments: SubtitleSegment[]) => void
    updateSegment: (id: number, updates: Partial<SubtitleSegment>) => void
    updateSegments: (updates: { id: number; updates: Partial<SubtitleSegment> }[]) => void
    deleteSegment: (id: number) => void
    setCurrentSegment: (id: number | null) => void

    setEditingSegment: (id: number | null, text?: string) => void
    setEditText: (text: string) => void

    setSpeaker: (segmentId: number, speakerName: string) => void
    applyStyleToSpeaker: (speakerName: string, style: Partial<SubtitleStyle>) => void
    regenerateSegments: (mode: 'auto' | 'word' | 'sentence' | 'paragraph') => void
    setSegmentationSettings: (settings: Partial<SegmentationSettings>) => void
    addSegmentAt: (time: number, trackId?: string) => void

    resetSubtitleEditor: () => void
}

export const createSubtitleSlice: StateCreator<SubtitleSlice> = (set, get) => ({
    segments: [],
    originalSegments: [],
    currentSegment: null,
    selectedSegments: [],

    editingSegment: null,
    editText: '',

    speakerStyles: {},
    segmentationSettings: { maxWords: 7, silenceThreshold: 0.5 },

    setSegments: (segments) => set((state: any) => {
        // Sync with active track if it exists in the combined state
        let newTracks = state.tracks || []
        if (state.activeTrackId) {
            newTracks = newTracks.map((t: any) =>
                t.id === state.activeTrackId ? { ...t, segments } : t
            )
        }
        return { segments, tracks: newTracks }
    }),

    setEditingSegment: (id, text = '') => set({ editingSegment: id, editText: text }),
    setEditText: (text) => set({ editText: text }),

    updateSegment: (id, updates) => set((state: any) => {
        const newSegments = state.segments.map((seg: SubtitleSegment) =>
            seg.id === id ? { ...seg, ...updates } : seg
        )
        let newTracks = state.tracks || []
        if (state.activeTrackId) {
            newTracks = newTracks.map((t: any) =>
                t.id === state.activeTrackId ? { ...t, segments: newSegments } : t
            )
        }
        return { segments: newSegments, tracks: newTracks }
    }),

    updateSegments: (batchUpdates) => set((state: any) => {
        const updatesMap = new Map(batchUpdates.map(u => [u.id, u.updates]));
        const newSegments = state.segments.map((seg: SubtitleSegment) => {
            const updates = updatesMap.get(seg.id);
            return updates ? { ...seg, ...updates } : seg;
        });

        let newTracks = state.tracks || []
        if (state.activeTrackId) {
            newTracks = newTracks.map((t: any) =>
                t.id === state.activeTrackId ? { ...t, segments: newSegments } : t
            )
        }
        return { segments: newSegments, tracks: newTracks }
    }),

    deleteSegment: (id) => set((state: any) => {
        const newSegments = state.segments.filter((seg: SubtitleSegment) => seg.id !== id)
        let newTracks = state.tracks || []
        if (state.activeTrackId) {
            newTracks = newTracks.map((t: any) =>
                t.id === state.activeTrackId ? { ...t, segments: newSegments } : t
            )
        }
        return { segments: newSegments, tracks: newTracks }
    }),

    setCurrentSegment: (id) => set({ currentSegment: id }),

    setSpeaker: (segmentId, speakerName) => set((state: any) => {
        const newSegments = state.segments.map((seg: SubtitleSegment) =>
            seg.id === segmentId ? { ...seg, speaker: speakerName } : seg
        )

        let newTracks = state.tracks || []
        if (state.activeTrackId) {
            newTracks = newTracks.map((t: any) =>
                t.id === state.activeTrackId ? { ...t, segments: newSegments } : t
            )
        }

        const newSpeakerStyles = { ...state.speakerStyles }
        if (speakerName && !newSpeakerStyles[speakerName]) {
            const colors = [
                '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
                '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
                '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e'
            ]
            const usedColors = Object.values(newSpeakerStyles).length
            newSpeakerStyles[speakerName] = {
                name: speakerName,
                color: colors[usedColors % colors.length]
            }
        }

        return { segments: newSegments, speakerStyles: newSpeakerStyles, tracks: newTracks }
    }),

    applyStyleToSpeaker: (speakerName, styleUpdates) => set((state: any) => {
        const newSegments = state.segments.map((seg: SubtitleSegment) =>
            seg.speaker === speakerName ? { ...seg, style: { ...seg.style, ...styleUpdates } } : seg
        )

        let newTracks = state.tracks || []
        if (state.activeTrackId) {
            newTracks = newTracks.map((t: any) =>
                t.id === state.activeTrackId ? { ...t, segments: newSegments } : t
            )
        }

        return { segments: newSegments, tracks: newTracks }
    }),

    regenerateSegments: (mode) => set((state: any) => {
        const original = state.originalSegments
        if (!original || original.length === 0) return {}

        let newSegments: SubtitleSegment[] = []
        const { maxWords, silenceThreshold } = state.segmentationSettings

        if (mode === 'word') {
            let idCounter = 0
            original.forEach((seg: SubtitleSegment) => {
                if (seg.words && seg.words.length > 0) {
                    seg.words.forEach((word: Word) => {
                        newSegments.push({
                            id: idCounter++,
                            start: word.start,
                            end: word.end,
                            text: word.text,
                            speaker: seg.speaker,
                            confidence: word.probability,
                            words: [word]
                        })
                    })
                } else {
                    newSegments.push({ ...seg, id: idCounter++ })
                }
            })
        } else if (mode === 'sentence' || mode === 'paragraph') {
            // Mode 'paragraph' is essentially 'sentence' with much larger maxWords
            const targetMaxWords = mode === 'paragraph' ? Math.max(maxWords * 3, 25) : maxWords

            let allWords: Word[] = []
            original.forEach((seg: SubtitleSegment) => {
                if (seg.words) allWords.push(...seg.words)
            })

            if (allWords.length === 0) return { segments: [...original], currentSegment: null }

            let currentWords: Word[] = []
            let idCounter = 0

            for (let i = 0; i < allWords.length; i++) {
                const word = allWords[i]
                const prevWord = i > 0 ? allWords[i - 1] : null
                const silence = prevWord ? (word.start - prevWord.end) : 0

                const isMaxLength = currentWords.length >= targetMaxWords
                const isSilence = silence >= silenceThreshold
                const isPunctuation = prevWord && /[\.\!\?،؟]/.test(prevWord.text)

                // If paragraph mode, we might wait longer for punctuation or silence
                const shouldBreak = currentWords.length > 0 && (
                    isMaxLength ||
                    isSilence ||
                    (mode === 'sentence' && isPunctuation)
                )

                if (shouldBreak) {
                    newSegments.push({
                        id: idCounter++,
                        start: currentWords[0].start,
                        end: currentWords[currentWords.length - 1].end,
                        text: currentWords.map(w => w.text).join(' '),
                        words: [...currentWords]
                    })
                    currentWords = []
                }
                currentWords.push(word)
            }

            if (currentWords.length > 0) {
                newSegments.push({
                    id: idCounter++,
                    start: currentWords[0].start,
                    end: currentWords[currentWords.length - 1].end,
                    text: currentWords.map(w => w.text).join(' '),
                    words: [...currentWords]
                })
            }
        } else {
            // mode === 'auto' or 'original'
            newSegments = [...original]
        }

        let newTracks = state.tracks || []
        if (state.activeTrackId) {
            newTracks = newTracks.map((t: any) =>
                t.id === state.activeTrackId ? { ...t, segments: newSegments } : t
            )
        }

        return { segments: newSegments, currentSegment: null, tracks: newTracks }
    }),

    setSegmentationSettings: (settings) => set((state) => ({
        segmentationSettings: { ...state.segmentationSettings, ...settings }
    })),

    addSegmentAt: (time, trackId) => set((state: any) => {
        const newId = Math.max(0, ...state.segments.map((s: any) => s.id)) + 1
        
        // FIND NEXT SEGMENT TO PREVENT OVERLAP
        const nextSegment = state.segments
            .filter((s: any) => s.start > time)
            .sort((a: any, b: any) => a.start - b.start)[0];
            
        const defaultDuration = 2.0;
        let endTime = time + defaultDuration;
        
        if (nextSegment) {
            // Clamp to not overlap next segment (leave a tiny gap of 0.05s)
            endTime = Math.min(endTime, nextSegment.start - 0.05);
            // If the gap is too small, just make it very short
            if (endTime <= time) endTime = time + 0.1;
        }

        const newSegment: SubtitleSegment = {
            id: newId,
            start: time,
            end: endTime,
            text: '', // Empty text for immediate typing
            words: []
        }

        const newSegments = [...state.segments, newSegment].sort((a, b) => a.start - b.start)

        // Also update track segments if applicable
        let newTracks = state.tracks || []
        if (state.activeTrackId) {
            newTracks = newTracks.map((t: any) =>
                t.id === state.activeTrackId ? { ...t, segments: newSegments } : t
            )
        }

        // Set editing AND current segment to trigger auto-scroll and focus
        return {
            segments: newSegments,
            tracks: newTracks,
            editingSegment: newId,
            currentSegment: newId,
            editText: ''
        }
    }),

    resetSubtitleEditor: () => set({
        segments: [],
        currentSegment: null,
        selectedSegments: [],
        speakerStyles: {},
        originalSegments: []
    })
})
