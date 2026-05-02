import { StateCreator } from 'zustand'
import { SilenceSegment, SilenceSettings } from './types'
import { detectSilenceBrowser } from '@/utils/silenceDetector'
import { getApiUrl } from '@/utils/config'

export interface SilenceSlice {
    // State
    silenceSettings: SilenceSettings
    detectedSilence: SilenceSegment[]
    isDetectingSilence: boolean
    silenceProgress: number
    silenceDetectionMode: 'browser' | 'server'

    // Actions
    setSilenceSettings: (settings: Partial<SilenceSettings>) => void
    setDetectedSilence: (segments: SilenceSegment[]) => void
    setIsDetectingSilence: (isDetecting: boolean) => void
    setSilenceProgress: (progress: number) => void
    setSilenceDetectionMode: (mode: 'browser' | 'server') => void

    detectSilence: () => Promise<void>
    detectSilenceBrowserMode: () => Promise<void>
    detectSilenceServerMode: () => Promise<void>
    exportWithoutSilence: () => Promise<void>

    resetSilence: () => void
}

export const createSilenceSlice: StateCreator<SilenceSlice> = (set, get) => {
    return {
        silenceSettings: {
            threshold: -30,
            minDuration: 0.5,
            padding: 0.1
        },
        detectedSilence: [],
        isDetectingSilence: false,
        silenceProgress: 0,
        silenceDetectionMode: 'browser',

        setSilenceSettings: (newSettings) => set((state) => ({
            silenceSettings: { ...state.silenceSettings, ...newSettings }
        })),
        setDetectedSilence: (segments) => set({ detectedSilence: segments }),
        setIsDetectingSilence: (isDetecting) => set({ isDetectingSilence: isDetecting }),
        setSilenceProgress: (progress) => set({ silenceProgress: progress }),
        setSilenceDetectionMode: (mode) => set({ silenceDetectionMode: mode }),

        detectSilence: async () => {
            const { silenceDetectionMode, detectSilenceBrowserMode, detectSilenceServerMode } = get()
            if (silenceDetectionMode === 'browser') {
                await detectSilenceBrowserMode()
            } else {
                await detectSilenceServerMode()
            }
        },

        detectSilenceBrowserMode: async () => {
            const state = get()
            const { silenceSettings } = state
            const videoFile = (state as any).videoFile

            if (!videoFile?.url) {
                console.error('[SilenceBrowser] No video file loaded')
                    ; (state as any).addLog?.('error', 'يجب رفع ملف فيديو أولاً')
                return
            }

            set({ isDetectingSilence: true, silenceProgress: 0 })
                ; (state as any).addLog?.('info', '🔍 جاري تحليل الصمت في المتصفح...')

            try {
                const segments = await detectSilenceBrowser(videoFile.url, {
                    thresholdDb: silenceSettings.threshold,
                    minDuration: silenceSettings.minDuration,
                    padding: silenceSettings.padding,
                    onProgress: (progress) => {
                        set({ silenceProgress: progress })
                    }
                })

                set({ detectedSilence: segments })
                    ; (state as any).addLog?.('success', `✅ تم العثور على ${segments.length} منطقة صامتة`)

            } catch (error) {
                console.error('[SilenceBrowser] Detection failed:', error)
                const msg = error instanceof Error ? error.message : 'Unknown error'
                    ; (state as any).addLog?.('error', `❌ فشل كشف الصمت: ${msg}`)
            } finally {
                set({ isDetectingSilence: false, silenceProgress: 100 })
            }
        },

        detectSilenceServerMode: async () => {
            set({ isDetectingSilence: true, silenceProgress: 0 })
            const { silenceSettings } = get()
            const state = get()

            const fileId = (state as any).videoFile?.id || (state as any).videoFile?.name

            if (!fileId) {
                console.error('[SilenceServer] No video file loaded')
                    ; (state as any).addLog?.('error', 'يجب رفع ملف فيديو أولاً')
                set({ isDetectingSilence: false })
                return
            }

            try {
                ; (state as any).addLog?.('info', '🔍 جاري تحليل الصمت على السيرفر...')
                set({ silenceProgress: 20 })

                const response = await fetch(getApiUrl('silence/detect', (state as any).engineSource), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        file_path: fileId,
                        threshold: silenceSettings.threshold,
                        min_duration: silenceSettings.minDuration,
                        padding: silenceSettings.padding
                    })
                })

                set({ silenceProgress: 80 })

                if (!response.ok) {
                    const err = await response.json()
                    throw new Error(err.detail || 'Failed to detect silence')
                }

                const data = await response.json()
                const segments: SilenceSegment[] = data.segments.map((s: any, i: number) => ({
                    id: i,
                    start: s.start,
                    end: s.end,
                    duration: s.duration,
                    type: 'silence'
                }))

                set({ detectedSilence: segments, silenceProgress: 100 })
                    ; (state as any).addLog?.('success', `✅ تم العثور على ${segments.length} منطقة صامتة`)

            } catch (error) {
                console.error('[SilenceServer] Detection failed:', error)
                const msg = error instanceof Error ? error.message : 'Unknown error'
                    ; (state as any).addLog?.('error', `❌ فشل كشف الصمت: ${msg}`)
            } finally {
                set({ isDetectingSilence: false })
            }
        },

        exportWithoutSilence: async () => {
            const state = get()
            const { detectedSilence } = state
            const fileId = (state as any).videoFile?.id

            if (!fileId) {
                ; (state as any).addLog?.('error', 'يجب رفع ملف فيديو أولاً')
                return
            }

            if (detectedSilence.length === 0) {
                ; (state as any).addLog?.('error', 'يجب كشف الصمت أولاً')
                return
            }

            try {
                ; (state as any).addLog?.('info', '📦 جاري تصدير الفيديو بدون صمت...')

                const response = await fetch(getApiUrl('silence/export', (state as any).engineSource), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        file_id: fileId,
                        silence_segments: detectedSilence.map(s => ({
                            start: s.start,
                            end: s.end
                        })),
                        output_name: 'video_no_silence'
                    })
                })

                const data = await response.json()
                if (data.job_id) {
                    // Start unified progress tracking
                    ;(state as any).setExportProgressModalOpen(true, data.job_id, 'silence')
                } else {
                    ;(state as any).addLog?.('success', `✅ تم التصدير بنجاح: ${data.output_file}`)
                }

            } catch (error) {
                console.error('[SilenceExport] Export failed:', error)
                const msg = error instanceof Error ? error.message : 'Unknown error'
                    ; (state as any).addLog?.('error', `❌ فشل التصدير: ${msg}`)
            }
        },

        resetSilence: () => set({
            detectedSilence: [],
            isDetectingSilence: false,
            silenceProgress: 0
        })
    }
};

