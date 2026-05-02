/**
 * Audio Utilities for Client-Side Processing
 * أدوات معالجة الصوت محلياً
 */

/**
 * Extracts audio from a video file and returns a Blob (WAV format)
 * استخراج الصوت من ملف الفيديو بصيغة WAV
 */
export async function extractAudioFromVideo(videoFile: File): Promise<Blob> {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const arrayBuffer = await videoFile.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    
    // Convert AudioBuffer to WAV Blob
    return audioBufferToWav(audioBuffer)
}

/**
 * Converts AudioBuffer to WAV format
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels
    const length = buffer.length * numOfChan * 2 + 44
    const bufferData = new ArrayBuffer(length)
    const view = new DataView(bufferData)
    const channels = []
    let i, sample, offset = 0, pos = 0

    // Write WAV header
    setUint32(0x46464952) // "RIFF"
    setUint32(length - 8) // file length - 8
    setUint32(0x45564157) // "WAVE"

    setUint32(0x20746d66) // "fmt " chunk
    setUint32(16) // length = 16
    setUint16(1) // PCM (uncompressed)
    setUint16(numOfChan)
    setUint32(buffer.sampleRate)
    setUint32(buffer.sampleRate * 2 * numOfChan) // avg. bytes/sec
    setUint16(numOfChan * 2) // block-align
    setUint16(16) // 16-bit (hardcoded)

    setUint32(0x61746164) // "data" - chunk
    setUint32(length - pos - 4) // chunk length

    // Write interleaved samples
    for (i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i))
    }

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            // Interleave channels
            sample = Math.max(-1, Math.min(1, channels[i][offset])) // clamp
            sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF) | 0 // scale to 16-bit signed int
            view.setInt16(pos, sample, true) // write 16-bit sample
            pos += 2
        }
        offset++
    }

    return new Blob([bufferData], { type: 'audio/wav' })

    function setUint16(data: number) {
        view.setUint16(pos, data, true)
        pos += 2
    }

    function setUint32(data: number) {
        view.setUint32(pos, data, true)
        pos += 4
    }
}
