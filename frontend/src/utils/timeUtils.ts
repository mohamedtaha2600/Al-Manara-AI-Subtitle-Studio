/**
 * Formats seconds into HH:MM:SS.ms or MM:SS.ms
 */
export const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    
    const hStr = h > 0 ? `${h}:` : ''
    const mStr = m.toString().padStart(2, '0')
    const sStr = s.toString().padStart(2, '0')
    const msStr = ms.toString().padStart(2, '0')
    
    return `${hStr}${mStr}:${sStr}.${msStr}`
}

/**
 * High-Precision SMPTE Timecode
 * Format: HH:MM:SS:FF (Frames assumed 30fps)
 */
export const formatSMPTE = (seconds: number, fps: number = 30) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    const f = Math.floor((seconds % 1) * fps)
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`
}

