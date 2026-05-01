import { useEffect, useRef } from 'react'
import { useProjectStore } from '@/store/useProjectStore'

export function useVADPreview() {
    const { videoFile, vadPreviewSettings, setVADSegments } = useProjectStore()
    const audioContentRef = useRef<AudioBuffer | null>(null)
    const isAnalyzingRef = useRef(false)

    // Load and decode audio when file changes
    useEffect(() => {
        if (!videoFile || !videoFile.url) {
            audioContentRef.current = null
            setVADSegments([])
            return
        }

        const loadAudio = async () => {
            try {
                const response = await fetch(videoFile.url)
                const arrayBuffer = await response.arrayBuffer()
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
                const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer)
                audioContentRef.current = decodedBuffer
                performAnalysis()
            } catch (err) {
                console.error('Failed to load/decode audio for VAD preview:', err)
            }
        }

        loadAudio()
    }, [videoFile?.url])

    // Re-analyze when settings change
    useEffect(() => {
        if (vadPreviewSettings.enabled) {
            performAnalysis()
        } else {
            setVADSegments([])
        }
    }, [vadPreviewSettings.enabled, vadPreviewSettings.threshold, vadPreviewSettings.minSilenceMs])

    const performAnalysis = () => {
        if (!audioContentRef.current || !vadPreviewSettings.enabled || isAnalyzingRef.current) return

        isAnalyzingRef.current = true

        // Use a slight timeout to avoid blocking the main thread too heavily
        setTimeout(() => {
            try {
                const buffer = audioContentRef.current!
                const data = buffer.getChannelData(0) // Use first channel
                const sampleRate = buffer.sampleRate
                const threshold = vadPreviewSettings.threshold
                const minSilenceSamples = (vadPreviewSettings.minSilenceMs / 1000) * sampleRate

                const segments: Array<{ start: number, end: number }> = []
                let inSpeech = false
                let speechStart = 0

                // Optimized windowed analysis
                const windowSize = Math.floor(sampleRate * 0.02) // 20ms windows

                for (let i = 0; i < data.length; i += windowSize) {
                    let sum = 0
                    const end = Math.min(i + windowSize, data.length)
                    for (let j = i; j < end; j++) {
                        sum += data[j] * data[j]
                    }
                    const rms = Math.sqrt(sum / (end - i))
                    const currentTime = i / sampleRate

                    if (rms > threshold) {
                        if (!inSpeech) {
                            inSpeech = true
                            speechStart = currentTime
                        }
                    } else {
                        if (inSpeech) {
                            // Check if this silence is long enough to break
                            const silenceDurationSamples = windowSize // simplified for windowed
                            if (currentTime - speechStart > 0.1) { // Min speech 100ms
                                segments.push({ start: speechStart, end: currentTime })
                            }
                            inSpeech = false
                        }
                    }
                }

                // Close last segment if needed
                if (inSpeech) {
                    segments.push({ start: speechStart, end: buffer.duration })
                }

                // Post-process: 
                // 1. Merge segments with very short silences
                let finalSegments: Array<{ start: number, end: number }> = []
                if (segments.length > 0) {
                    let current = segments[0]
                    for (let i = 1; i < segments.length; i++) {
                        const gap = segments[i].start - current.end
                        if (gap < (vadPreviewSettings.minSilenceMs / 1000)) {
                            current.end = segments[i].end
                        } else {
                            finalSegments.push(current)
                            current = segments[i]
                        }
                    }
                    finalSegments.push(current)
                }

                // 2. Minimum Duration Filter: Remove any segments shorter than 100ms (noise/breaths)
                finalSegments = finalSegments.filter(seg => (seg.end - seg.start) >= 0.1)

                setVADSegments(finalSegments)
            } finally {
                isAnalyzingRef.current = false
            }
        }, 10)
    }

    // Auto-calculate threshold based on noise floor
    // Auto-calculate threshold based on percentile distribution (Smart VAD)
    const calculateAutoThreshold = () => {
        if (!audioContentRef.current) return 0.05

        const buffer = audioContentRef.current
        const data = buffer.getChannelData(0)
        const sampleRate = buffer.sampleRate

        // Analyze in 20ms chunks to match the VAD window
        const windowSize = Math.floor(sampleRate * 0.02)
        const rmsValues: number[] = []

        // Step 1: Collect RMS energy map
        for (let i = 0; i < data.length; i += windowSize) {
            let sum = 0
            const end = Math.min(i + windowSize, data.length)
            for (let j = i; j < end; j++) {
                sum += data[j] * data[j] // Square
            }
            if (end > i) {
                rmsValues.push(Math.sqrt(sum / (end - i)))
            }
        }

        // Step 2: Sort to find percentiles
        rmsValues.sort((a, b) => a - b)

        if (rmsValues.length === 0) return 0.05

        // Heuristic:
        // - Noise Floor is usually around the 10th percentile (P10)
        // - Active Speech is usually around the 80th-90th percentile (P90)
        const p10Index = Math.floor(rmsValues.length * 0.1)
        const p90Index = Math.floor(rmsValues.length * 0.9)

        const noiseFloor = rmsValues[p10Index]
        const speechLevel = rmsValues[p90Index]

        // Step 3: Calculate optimal threshold
        // We want to be definitely above the noise floor, but sensitive enough for soft speech.
        // Formula: Lift significantly above noise floor, but cap based on speech range.

        // If the audio is very clean (high dynamic range), we can be aggressive.
        // If noisy (low dynamic range), we need to be careful.
        const dynamicRange = speechLevel - noiseFloor

        let optimalThreshold: number

        if (dynamicRange > 0.1) {
            // Clean audio: safe to put threshold at ~15-20% of dynamic range
            optimalThreshold = noiseFloor + (dynamicRange * 0.15)
        } else {
            // Noisy audio or constant volume: set just above noise
            optimalThreshold = noiseFloor * 1.5 // Multiplier approach for low amplitude
            // Ensure reasonable minimum separation
            optimalThreshold = Math.max(optimalThreshold, noiseFloor + 0.01)
        }

        // Safety clamps
        return Math.max(0.01, Math.min(optimalThreshold, 0.4))
    }

    return { calculateAutoThreshold, isAnalyzing: isAnalyzingRef.current }
}
