'use client'

import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import styles from './TimelineWaveform.module.css'
import { useProjectStore } from '@/store/useProjectStore'

// Segment type from parent
interface SubtitleSegment {
    id: number
    start: number
    end: number
    text: string
}

interface SilenceSegment {
    id: number
    start: number
    end: number
    duration: number
    type: 'silence' | 'audible'
}

interface TimelineWaveformProps {
    videoUrl: string | null
    pixelsPerSecond: number
    height: number
    scrollLeft: number
    isSelected?: boolean
    segments?: SubtitleSegment[] // Whisper segments for accurate coloring
    silenceSegments?: SilenceSegment[] // Silence segments for yellow highlighting
    vadSegments?: Array<{ start: number, end: number }> // Browser-side speech detection
    sourceStart?: number
    sourceEnd?: number
}

const TimelineWaveform = ({
    videoUrl,
    pixelsPerSecond,
    height,
    scrollLeft,
    isSelected = false,
    segments = [],
    silenceSegments = [],
    vadSegments = [],
    sourceStart = 0,
    sourceEnd
}: TimelineWaveformProps) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const wavesurferRef = useRef<WaveSurfer | null>(null)
    const [fullDuration, setFullDuration] = useState(0)
    const [isReady, setIsReady] = useState(false)

    // Calculate clip duration
    const displayDuration = (sourceEnd || fullDuration) - sourceStart;

    // Initialize WaveSurfer
    useEffect(() => {
        if (!containerRef.current || !videoUrl) return

        let active = true

        const createWaveSurfer = async () => {
            // Cleanup prev instance
            if (wavesurferRef.current) {
                try {
                    wavesurferRef.current.destroy()
                } catch (e) { console.warn(e) }
                wavesurferRef.current = null
                if (active) setIsReady(false)
            }

            const ws = WaveSurfer.create({
                container: containerRef.current!,
                waveColor: 'rgba(59, 130, 246, 0.5)', // Premium blue
                progressColor: 'rgba(59, 130, 246, 0.7)',
                cursorWidth: 0,
                height: height,
                normalize: true,
                minPxPerSec: pixelsPerSecond,
                fillParent: false,
                interact: false,
                autoplay: false,
                barWidth: 2,
                barGap: 1,
                barRadius: 2,
            })

            console.log('Waveform initializing with URL:', videoUrl)
            wavesurferRef.current = ws

            // CRITICAL FIX: Ghost Audio
            // WaveSurfer is only for visualization here. We must MUTE it.
            ws.setVolume(0)

            try {
                await ws.load(videoUrl)

                if (active) {
                    const dur = ws.getDuration()
                    setFullDuration(dur)
                    setIsReady(true)
                    console.log('Waveform ready, duration:', dur)
                }
            } catch (err) {
                if (active) console.error('Error loading waveform:', err)
            }
        }

        createWaveSurfer()

        return () => {
            active = false
            try {
                if (wavesurferRef.current) {
                    wavesurferRef.current.destroy()
                    wavesurferRef.current = null
                }
            } catch (e) { }
            setIsReady(false)
        }
    }, [videoUrl, height])

    // Update Zoom
    useEffect(() => {
        if (wavesurferRef.current && isReady) {
            wavesurferRef.current.zoom(pixelsPerSecond)
        }
    }, [pixelsPerSecond, isReady])

    const { videoUploadProgress, isVideoUploading } = useProjectStore()

    return (
        <div
            className={`${styles.waveformContainer} ${isSelected ? styles.selectedWaveform : ''}`}
            style={{
                height: `${height}px`,
                width: isReady ? `${displayDuration * pixelsPerSecond}px` : '100%',
                position: 'relative',
                overflow: 'hidden',
                // Inline override for immediate feedback if needed, 
                // but class-based is better for transitions
                filter: isSelected ? 'brightness(1.5) contrast(1.1)' : 'none'
            }}
        >
            {/* Upload Progress "Water Fill" Layer */}
            {isVideoUploading && (
                <div 
                    className={styles.uploadWaterFill}
                    style={{
                        height: `${videoUploadProgress}%`,
                    }}
                >
                    <div className={styles.uploadText}>
                        جاري الرفع... {Math.round(videoUploadProgress)}%
                    </div>
                </div>
            )}

            {/* WaveSurfer Container (Base layer - red waveform) */}
            <div
                ref={containerRef}
                style={{
                    position: 'absolute',
                    left: `-${sourceStart * pixelsPerSecond}px`,
                    width: isReady ? `${fullDuration * pixelsPerSecond}px` : '100%',
                    zIndex: 1
                }}
            />

            {/* Silence Zones Layer (Yellow highlight for silence regions) */}
            {silenceSegments.length > 0 && (
                <div className={styles.silenceZonesLayer} style={{ zIndex: 3 }}>
                    {silenceSegments.map((seg) => (
                        <div
                            key={`silence-${seg.id}`}
                            className={styles.silenceZone}
                            style={{
                                left: `${(seg.start - sourceStart) * pixelsPerSecond}px`,
                                width: `${Math.max((seg.end - seg.start) * pixelsPerSecond, 2)}px`
                            }}
                            title={`صمت: ${seg.duration.toFixed(2)}s`}
                        />
                    ))}
                </div>
            )}

            {/* Speech Zones Layer (Removed per user request) */}

            {/* VAD Preview Zones Layer (Browser-side speech detection - Blue overlay) */}
            {vadSegments.length > 0 && (
                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', pointerEvents: 'none', zIndex: 4 }}>
                    {vadSegments.map((seg, i) => (
                        <div
                            key={`vad-${i}`}
                            style={{
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                left: `${(seg.start - sourceStart) * pixelsPerSecond}px`,
                                width: `${(seg.end - seg.start) * pixelsPerSecond}px`,
                                background: 'rgba(34, 197, 94, 0.6)', // Green
                                mixBlendMode: 'hue', // Tints the blue wave to green
                                pointerEvents: 'none'
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default TimelineWaveform

