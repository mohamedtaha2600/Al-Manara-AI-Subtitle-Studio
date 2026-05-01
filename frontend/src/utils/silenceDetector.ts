/**
 * Browser-based Silence Detection using Web Audio API
 * كشف الصمت في المتصفح باستخدام Web Audio API
 * 
 * This is much faster than server-based FFmpeg detection for preview purposes.
 * For final export, we still use FFmpeg backend.
 */

export interface SilenceSegment {
    id: number
    start: number
    end: number
    duration: number
    type: 'silence' | 'audible'
}

export interface SilenceDetectionOptions {
    /** Silence threshold in dB (e.g., -30) */
    thresholdDb: number
    /** Minimum silence duration in seconds (e.g., 0.5) */
    minDuration: number
    /** Padding around speech in seconds (e.g., 0.1) */
    padding: number
    /** Progress callback */
    onProgress?: (progress: number) => void
}

/**
 * Convert dB to linear amplitude
 */
function dbToLinear(db: number): number {
    return Math.pow(10, db / 20)
}

/**
 * Detect silence in audio/video using Web Audio API
 * Works with both video and audio-only files
 */
export async function detectSilenceBrowser(
    mediaUrl: string,
    options: SilenceDetectionOptions
): Promise<SilenceSegment[]> {
    const { thresholdDb, minDuration, padding, onProgress } = options
    const threshold = dbToLinear(thresholdDb)

    onProgress?.(5)

    // Fetch the media file
    const response = await fetch(mediaUrl)
    const arrayBuffer = await response.arrayBuffer()

    onProgress?.(15)

    // Create audio context and decode
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    let audioBuffer: AudioBuffer
    try {
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    } catch (error) {
        console.error('[SilenceDetector] Failed to decode audio:', error)
        throw new Error('فشل في تحليل الصوت. تأكد من صيغة الملف.')
    }

    onProgress?.(30)

    const sampleRate = audioBuffer.sampleRate
    const duration = audioBuffer.duration
    const channelData = audioBuffer.getChannelData(0) // Use first channel

    // Analysis parameters
    const windowSize = Math.floor(sampleRate * 0.05) // 50ms windows
    const hopSize = Math.floor(windowSize / 2) // 50% overlap

    const silenceRegions: Array<{ start: number; end: number }> = []
    let inSilence = false
    let silenceStart = 0

    const totalWindows = Math.floor(channelData.length / hopSize)
    let processedWindows = 0

    // Analyze in chunks for progress updates
    for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
        // Calculate RMS for this window
        let sumSquares = 0
        for (let j = 0; j < windowSize; j++) {
            sumSquares += channelData[i + j] * channelData[i + j]
        }
        const rms = Math.sqrt(sumSquares / windowSize)

        const currentTime = i / sampleRate
        const isSilent = rms < threshold

        if (isSilent && !inSilence) {
            // Silence started
            inSilence = true
            silenceStart = currentTime
        } else if (!isSilent && inSilence) {
            // Silence ended
            inSilence = false
            const silenceDuration = currentTime - silenceStart

            if (silenceDuration >= minDuration) {
                // Apply padding (shrink silence region to protect speech edges)
                const paddedStart = silenceStart + padding
                const paddedEnd = currentTime - padding

                if (paddedEnd > paddedStart) {
                    silenceRegions.push({
                        start: paddedStart,
                        end: paddedEnd
                    })
                }
            }
        }

        // Update progress periodically
        processedWindows++
        if (processedWindows % 1000 === 0) {
            const progress = 30 + Math.floor((processedWindows / totalWindows) * 60)
            onProgress?.(Math.min(progress, 90))
        }
    }

    // Handle silence at the end of the file
    if (inSilence) {
        const silenceDuration = duration - silenceStart
        if (silenceDuration >= minDuration) {
            const paddedStart = silenceStart + padding
            const paddedEnd = duration - padding
            if (paddedEnd > paddedStart) {
                silenceRegions.push({
                    start: paddedStart,
                    end: paddedEnd
                })
            }
        }
    }

    onProgress?.(95)

    // Convert to SilenceSegment format
    const segments: SilenceSegment[] = silenceRegions.map((region, index) => ({
        id: index,
        start: region.start,
        end: region.end,
        duration: region.end - region.start,
        type: 'silence' as const
    }))

    // Cleanup
    await audioContext.close()

    onProgress?.(100)

    console.log(`[SilenceDetector] Found ${segments.length} silence segments in ${duration.toFixed(1)}s file`)

    return segments
}

/**
 * Analyze audio file and return both silence and audible segments
 * Useful for timeline visualization
 */
export async function analyzeAudioSegments(
    mediaUrl: string,
    options: SilenceDetectionOptions
): Promise<{ silence: SilenceSegment[]; audible: SilenceSegment[] }> {
    const silenceSegments = await detectSilenceBrowser(mediaUrl, options)

    // Calculate audible segments (inverse of silence)
    const audibleSegments: SilenceSegment[] = []
    let currentPos = 0
    let audibleId = 0

    // Get total duration from the silence analysis
    // We need to fetch the audio again for duration, or accept it as parameter
    // For now, estimate from last silence segment
    const lastSilence = silenceSegments[silenceSegments.length - 1]
    const estimatedDuration = lastSilence ? lastSilence.end + 10 : 0 // Add buffer

    for (const silence of silenceSegments) {
        if (silence.start > currentPos) {
            audibleSegments.push({
                id: audibleId++,
                start: currentPos,
                end: silence.start,
                duration: silence.start - currentPos,
                type: 'audible'
            })
        }
        currentPos = silence.end
    }

    return {
        silence: silenceSegments,
        audible: audibleSegments
    }
}
