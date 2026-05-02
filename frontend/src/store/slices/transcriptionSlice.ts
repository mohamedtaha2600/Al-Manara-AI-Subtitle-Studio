import { StateCreator } from 'zustand'
import { SubtitleSegment } from './types'

export interface TranscriptionSlice {
    jobId: string | null
    isTranscribing: boolean
    progress: number
    statusMessage: string
    transcriptionSettings: {
        minSilenceMs: number
        includeDiacritics: boolean
        includePunctuation: boolean
        maxWordsPerSegment: number
        targetLanguages: string[]
        includeSource: boolean
        useGPU: boolean
    }

    vadPreviewSettings: {
        enabled: boolean
        threshold: number
        minSilenceMs: number
    }
    vadSegments: Array<{ start: number, end: number }>

    setTranscriptionSettings: (settings: Partial<TranscriptionSlice['transcriptionSettings']>) => void
    setVADPreviewSettings: (settings: Partial<TranscriptionSlice['vadPreviewSettings']>) => void
    setVADSegments: (segments: Array<{ start: number, end: number }>) => void

    startTranscription: (jobId: string) => void
    updateProgress: (progress: number, message: string) => void
    finishTranscription: (result: any) => void

    resetTranscription: () => void
}

export const createTranscriptionSlice: StateCreator<TranscriptionSlice> = (set, get) => ({
    jobId: null,
    isTranscribing: false,
    progress: 0,
    statusMessage: '',

    transcriptionSettings: {
        minSilenceMs: 250,
        includeDiacritics: true,
        includePunctuation: true,
        maxWordsPerSegment: 6,
        targetLanguages: ['ar'],
        includeSource: true,
        useGPU: true
    },

    vadPreviewSettings: {
        enabled: true,
        threshold: 0.05,
        minSilenceMs: 250
    },
    vadSegments: [],

    setTranscriptionSettings: (settings) => set((state) => ({
        transcriptionSettings: { ...state.transcriptionSettings, ...settings }
    })),

    setVADPreviewSettings: (settings) => set((state) => ({
        vadPreviewSettings: { ...state.vadPreviewSettings, ...settings }
    })),

    setVADSegments: (segments) => set({ vadSegments: segments }),

    startTranscription: (jobId: string) => set({
        jobId,
        isTranscribing: true,
        progress: 0,
        statusMessage: 'بدء النسخ...',
    }),

    updateProgress: (progress: number, message: string) => {
        const state = get()
        if (state.progress !== progress || state.statusMessage !== message) {
            set({ progress, statusMessage: message })
        }
    },

    finishTranscription: (result: any) => {
        set({
            isTranscribing: false,
            progress: 100,
            statusMessage: 'تم النسخ بنجاح!',
            jobId: null
        })
    },

    resetTranscription: () => set({
        jobId: null,
        isTranscribing: false,
        progress: 0,
        statusMessage: '',
    }),
})
