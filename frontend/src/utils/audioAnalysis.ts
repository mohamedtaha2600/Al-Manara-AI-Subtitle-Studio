/**
 * Audio Analysis Utilities
 */

export interface TimeRange {
    start: number
    end: number
}

/**
 * Detects speech segments in an AudioBuffer based on RMS amplitude.
 * @param audioBuffer The Web Audio API AudioBuffer
 * @param thresholdDb Threshold in Decibels (e.g. -45)
 * @param minDurationSec Minimum duration of speech to include (e.g. 0.3s)
 * @param minSilenceSec Minimum silence to treat as a gap (e.g. 0.2s)
 */
export function detectSpeechSegments(
    audioBuffer: AudioBuffer,
    thresholdDb: number = -45,
    minDurationSec: number = 0.2,
    minSilenceSec: number = 0.2
): TimeRange[] {
    const channelData = audioBuffer.getChannelData(0) // Use first channel
    const sampleRate = audioBuffer.sampleRate

    // Window size for RMS calculation (e.g. 50ms)
    const windowSize = Math.floor(sampleRate * 0.05)

    const segments: TimeRange[] = []
    let isSpeech = false
    let startSample = 0
    let silenceStartSample = 0

    // Threshold to linear
    const thresholdLinear = Math.pow(10, thresholdDb / 20)

    for (let i = 0; i < channelData.length; i += windowSize) {
        // Calculate RMS of window
        let sumSq = 0
        const end = Math.min(i + windowSize, channelData.length)
        for (let j = i; j < end; j++) {
            sumSq += channelData[j] * channelData[j]
        }
        const rms = Math.sqrt(sumSq / (end - i))

        if (rms > thresholdLinear) {
            // Speech detected
            if (!isSpeech) {
                isSpeech = true
                startSample = i
            }
            // Reset silence counter
            silenceStartSample = 0
        } else {
            // Silence
            if (isSpeech) {
                if (silenceStartSample === 0) {
                    silenceStartSample = i
                } else if ((i - silenceStartSample) / sampleRate > minSilenceSec) {
                    // Confirmed silence gap -> Close segment
                    const endSample = silenceStartSample
                    const duration = (endSample - startSample) / sampleRate

                    if (duration >= minDurationSec) {
                        segments.push({
                            start: startSample / sampleRate,
                            end: endSample / sampleRate
                        })
                    }

                    isSpeech = false
                    silenceStartSample = 0
                }
            }
        }
    }

    // Handle end of buffer
    if (isSpeech) {
        const duration = (channelData.length - startSample) / sampleRate
        if (duration >= minDurationSec) {
            segments.push({
                start: startSample / sampleRate,
                end: channelData.length / sampleRate
            })
        }
    }

    return segments
}

/**
 * Automatically calculates the optimal speech detection threshold.
 * Analyzes RMS distribution and returns a dB value that separates speech from silence.
 * @param audioBuffer The Web Audio API AudioBuffer
 * @returns Optimal threshold in dB (typically -60 to -30)
 */
export function calculateAutoThreshold(audioBuffer: AudioBuffer): number {
    const channelData = audioBuffer.getChannelData(0)
    const sampleRate = audioBuffer.sampleRate
    const windowSize = Math.floor(sampleRate * 0.05) // 50ms windows

    const rmsValues: number[] = []

    // Calculate RMS for each window
    for (let i = 0; i < channelData.length; i += windowSize) {
        let sumSq = 0
        const end = Math.min(i + windowSize, channelData.length)
        for (let j = i; j < end; j++) {
            sumSq += channelData[j] * channelData[j]
        }
        const rms = Math.sqrt(sumSq / (end - i))
        if (rms > 0) {
            rmsValues.push(rms)
        }
    }

    if (rmsValues.length === 0) return -45 // Default fallback

    // Sort to find percentiles
    rmsValues.sort((a, b) => a - b)

    // Find the 25th percentile (likely silence floor)
    const silenceIdx = Math.floor(rmsValues.length * 0.25)
    const silenceRms = rmsValues[silenceIdx]

    // Find the 75th percentile (likely speech)
    const speechIdx = Math.floor(rmsValues.length * 0.75)
    const speechRms = rmsValues[speechIdx]

    // Threshold is the geometric mean between silence and speech
    const thresholdLinear = Math.sqrt(silenceRms * speechRms)

    // Convert to dB
    const thresholdDb = 20 * Math.log10(thresholdLinear)

    // Clamp to reasonable range
    return Math.max(-60, Math.min(-25, Math.round(thresholdDb)))
}
