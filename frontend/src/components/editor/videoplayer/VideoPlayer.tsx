'use client'

/**
 * Professional Video Player Component
 * ENGINE REWRITE: Now uses a "Timeline Clock" to drive playback.
 * It maps "Timeline Time" -> "Source Time" dynamically.
 * Features:
 * - Gap Handling (Pauses video, keeps playhead moving)
 * - Seamless Cuts (Seeks source video instantly)
 * - Drift Correction (Syncs video to timeline)
 */

import { useRef, useEffect, useState, useCallback } from 'react'
import { useProjectStore, SubtitleSegment } from '@/store/useProjectStore'
import { VideoSegment } from '@/store/slices/types'
import styles from './VideoPlayer.module.css'
import VideoPlayerControls from './components/VideoPlayerControls'
import VideoPlayerOverlay from './components/VideoPlayerOverlay'
import { Play, Music, Video } from 'lucide-react'

export default function VideoPlayer() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const videoInnerRef = useRef<HTMLDivElement>(null)

    // Interaction states
    const [isPanning, setIsPanning] = useState(false)
    const [lastPan, setLastPan] = useState({ x: 0, y: 0 })
    const [isDraggingSubtitle, setIsDraggingSubtitle] = useState(false)
    const [showApplyPrompt, setShowApplyPrompt] = useState(false)
    const [duration, setDuration] = useState(0)

    // Store Connection
    const {
        videoFile,
        isPlaying,
        setIsPlaying,
        currentTime,
        setCurrentTime,
        currentSegment,
        setCurrentSegment,
        style: globalStyle,
        setStyle,
        tracks,
        applyStyleToAll,
        segments: globalSegments,
        videoSegments,
        setVideoFile,
        initVideoSegments, // Destructured action
        // Player State
        playerVolume,
        playerIsMuted, // Correct Name
        setPlayerMuted,
        playerRate,
        playerZoom: zoom,
        setPlayerZoom: setZoom,
        playerPan,
        setPlayerPan,
        setPlayerShowControls,
        trackConfigs,
        activeTool,
    } = useProjectStore()

    const panX = playerPan.x
    const panY = playerPan.y
    const src = videoFile?.url || ''
    const onSegmentChange = setCurrentSegment

    const updatePan = useCallback((x: number, y: number) => setPlayerPan({ x, y }), [setPlayerPan])

    // --- REFS FOR LOOP OPTIMIZATION ---
    // We use refs to access latest state inside the requestAnimationFrame loop without re-triggering the effect
    const currentTimeRef = useRef(currentTime)
    const isPlayingRef = useRef(isPlaying)
    const videoSegmentsRef = useRef(videoSegments)
    const rateRef = useRef(playerRate)

    useEffect(() => { currentTimeRef.current = currentTime }, [currentTime])
    useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])
    useEffect(() => { videoSegmentsRef.current = videoSegments }, [videoSegments])
    useEffect(() => { rateRef.current = playerRate }, [playerRate])

    // --- FORCE PAUSE ON STOP ---
    // The loop handles Play/Pause while running, but when isPlaying turns false,
    // the loop cleans up and logic stops. We must force the visual video to pause.
    useEffect(() => {
        if (!isPlaying) {
            videoRef.current?.pause()
        }
    }, [isPlaying])

    // --- TIMELINE PLAYBACK ENGINE ---
    useEffect(() => {
        if (!isPlaying) return

        // Ensure we define these variables inside scope or checking refs
        let animationFrameId: number
        let lastTime = performance.now()

        const loop = (timestamp: number) => {
            const dt = (timestamp - lastTime) / 1000 // delta in seconds
            lastTime = timestamp

            const video = videoRef.current
            const currentT = currentTimeRef.current
            const segments = videoSegmentsRef.current
            const rate = rateRef.current

            if (!video) return

            // 1. FIND ACTIVE SEGMENT
            // Find which clip exists at the current timeline time
            const activeSeg = segments.find(s => currentT >= s.timelineStart && currentT < s.timelineEnd)

            if (activeSeg) {
                // === INSIDE A CLIP ===

                // A. Ensure Video is Playing
                if (video.paused) {
                    video.play().catch(e => console.warn("Video play interrupted", e))
                }

                // B. Calculate Expected Source Time
                // sourceTime = segmentSourceStart + (timelineTime - segmentTimelineStart)
                const offset = currentT - activeSeg.timelineStart
                const expectedSourceTime = activeSeg.sourceStart + offset

                // C. Drift Correction (Seek if off by > 150ms)
                // We tolerate slight drift for smoothness, but force sync if cuts happen
                if (Math.abs(video.currentTime - expectedSourceTime) > 0.15) {
                    // console.log(`[Sync] Drift detected. Seek to ${expectedSourceTime.toFixed(3)}`)
                    video.currentTime = expectedSourceTime
                }

                // D. SYNC CLOCK TO VIDEO (Standard) or SYNTHETIC (If needed)
                // To keep perfect A/V sync, we usually let the Video element drive the clock
                // New Timeline Time = SegStart + (Video - SegSourceStart)
                // Correction: video.currentTime might jitter, so we clamp it to expected boundaries
                const videoDerivedTime = activeSeg.timelineStart + (video.currentTime - activeSeg.sourceStart)

                // Only update if it moves forward logicially
                setCurrentTime(videoDerivedTime)

                // E. Check Segment End Boundary
                if (videoDerivedTime >= activeSeg.timelineEnd - 0.02) {
                    // We are hitting the end. Check if next frame is GAP or CUT.
                    // Just pushing time slightly past end will force next loop to re-evaluate
                    setCurrentTime(activeSeg.timelineEnd + 0.001)
                }

            } else {
                // === GAP (NO CLIP) ===

                // A. Pause Video (Show last frame or black? Pause is safer)
                if (!video.paused) {
                    video.pause()
                }

                // B. Synthetically Drive Clock
                // Advance time purely by delta * rate
                const newTime = currentT + (dt * rate)
                setCurrentTime(newTime)
            }

            // Check for End of Timeline (Simple check, can be improved)
            if (segments.length > 0) {
                const lastSeg = segments[segments.length - 1]
                if (currentTimeRef.current > lastSeg.timelineEnd + 1.0) {
                    setIsPlaying(false) // Auto-stop 1s after last clip
                    return
                }
            }

            animationFrameId = requestAnimationFrame(loop)
        }

        animationFrameId = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(animationFrameId)
    }, [isPlaying, setCurrentTime, setIsPlaying]) // Dependencies are stable setters + isPlaying trigger


    // --- SEEK HANDLER (When Paused) ---
    // When user drags timeline, we must update the video frame immediately
    useEffect(() => {
        if (isPlaying) return // Loop handles this when playing

        const video = videoRef.current
        if (!video) return

        const currentT = currentTime
        const activeSeg = videoSegments.find(s => currentT >= s.timelineStart && currentT < s.timelineEnd)

        if (activeSeg) {
            const offset = currentT - activeSeg.timelineStart
            const expectedSource = activeSeg.sourceStart + offset

            // Allow small rounding errors, but update on scrubs
            if (Math.abs(video.currentTime - expectedSource) > 0.05) {
                video.currentTime = expectedSource
            }
        }
        // If Gap, we purposefully DON'T seek (keeps last frame) or could obscure with black overlay

    }, [currentTime, isPlaying, videoSegments])


    // --- STORE SYNC (Rate, Vol, Mute) ---
    useEffect(() => {
        const video = videoRef.current
        if (!video) return
        video.volume = playerVolume
        video.muted = playerIsMuted
        video.playbackRate = playerRate
    }, [playerVolume, playerIsMuted, playerRate])


    // --- METADATA HANDLER ---
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handleLoaded = () => {
            setDuration(video.duration)
            if (videoFile && videoFile.duration !== video.duration) {
                setVideoFile({ ...videoFile, duration: video.duration })
            }

            // Check if we need to initialize segments (First Load)
            if (videoSegmentsRef.current.length === 0 && video.duration > 0) {
                initVideoSegments(video.duration)
            }
        }
        video.addEventListener('loadedmetadata', handleLoaded)
        return () => video.removeEventListener('loadedmetadata', handleLoaded)
    }, [videoFile, setVideoFile, initVideoSegments])

    // --- UI/UX HANDLERS ---

    // Subtitle Drag
    const handleSubtitleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return
        e.preventDefault(); e.stopPropagation()
        setIsDraggingSubtitle(true)
    }

    useEffect(() => {
        if (!isDraggingSubtitle) return
        const handleDragMove = (e: MouseEvent) => {
            if (!videoInnerRef.current) return
            const rect = videoInnerRef.current.getBoundingClientRect()
            const x = Math.min(Math.max((e.clientX - rect.left) / rect.width * 100, 0), 100)
            const y = Math.min(Math.max((e.clientY - rect.top) / rect.height * 100, 0), 100)
            setStyle({ position: 'custom', x, y })
        }
        const handleDragUp = () => {
            setIsDraggingSubtitle(false)
            if (tracks && tracks.length > 1) {
                setShowApplyPrompt(true)
                setTimeout(() => setShowApplyPrompt(false), 5000)
            }
        }
        window.addEventListener('mousemove', handleDragMove)
        window.addEventListener('mouseup', handleDragUp)
        return () => {
            window.removeEventListener('mousemove', handleDragMove)
            window.removeEventListener('mouseup', handleDragUp)
        }
    }, [isDraggingSubtitle, setStyle, tracks])

    // Mouse Wheel Zoom - Center Focused
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        const newZoom = Math.min(Math.max(zoom + delta, 0.5), 4)

        if (newZoom !== zoom) {
            // Standard zoom to center logic (No pan shift for maximum stability)
            setZoom(newZoom)
        }
    }, [zoom, setZoom])

    // Pan Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0 && activeTool === 'hand') {
            e.preventDefault()
            setIsPanning(true)
            setLastPan({ x: e.clientX - panX, y: e.clientY - panY })
        }
    }
    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning && activeTool === 'hand') updatePan(e.clientX - lastPan.x, e.clientY - lastPan.y)
    }
    const handleMouseUp = () => { if (isPanning) setIsPanning(false) }
    const togglePlay = useCallback(() => {
        if (activeTool === 'hand') return;
        setIsPlaying(!isPlaying);
    }, [isPlaying, setIsPlaying, activeTool])
    const handleFit = useCallback(() => { setZoom(0.6); updatePan(0, 0) }, [setZoom, updatePan])

    // Controls Auto-Hide
    useEffect(() => {
        let timeout: NodeJS.Timeout
        const handleMove = () => {
            setPlayerShowControls(true)
            clearTimeout(timeout)
            timeout = setTimeout(() => { if (isPlaying) setPlayerShowControls(false) }, 3000)
        }
        const container = containerRef.current
        container?.addEventListener('mousemove', handleMove)
        return () => { container?.removeEventListener('mousemove', handleMove); clearTimeout(timeout) }
    }, [isPlaying, setPlayerShowControls])

    // Active Subtitle Detection (Visual)
    const [activeSubtitles, setActiveSubtitles] = useState<{ trackId: string, segment: SubtitleSegment, style: any }[]>([])

    useEffect(() => {
        // This effect runs on current time update (from store)
        // It updates the overlay, not the engine
        const currentTracks = (tracks && tracks.length > 0) ? tracks : [{
            id: 'subtitle-track',
            name: 'Default',
            language: 'en',
            segments: globalSegments,
            style: globalStyle,
            isVisible: !trackConfigs['subtitle-track']?.isHidden,
            isLocked: trackConfigs['subtitle-track']?.isLocked
        }]

        const newActive: typeof activeSubtitles = []
        currentTracks.forEach(track => {
            if (track.isVisible === false) return
            // CORRECT FIX: Subtitles exist on the TIMELINE, so check against Timeline Time (currentTime)
            const activeSeg = track.segments.find(seg => currentTime >= seg.start && currentTime <= seg.end)
            if (activeSeg) {
                newActive.push({ trackId: track.id, segment: activeSeg, style: track.style || globalStyle })
            }
        })
        setActiveSubtitles(newActive)

        // Sync Legacy segment selection
        if (newActive.length > 0 && newActive[0].segment.id !== currentSegment) {
            onSegmentChange(newActive[0].segment.id)
        }
    }, [currentTime, tracks, globalSegments, globalStyle, currentSegment, onSegmentChange])

    const getCursor = () => {
        if (activeTool === 'hand') {
            return isPanning ? 'grabbing' : 'grab';
        }
        if (activeTool === 'text') {
            return 'text';
        }
        return 'default';
    }

    return (
        <div id="video-player-container" ref={containerRef} className={`${styles.container}`}>
            <div
                className={styles.videoWrapper}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: getCursor() }}
            >
                <div
                    ref={videoInnerRef}
                    className={styles.videoInner}
                    style={{
                        transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
                        transition: isPanning ? 'none' : 'transform 0.1s ease-out'
                    }}
                >
                    {!videoFile ? (
                        /* Professional Black Monitor Placeholder */
                        <div className={styles.blackMonitor}>
                             <div className={styles.monitorContent}>
                                <Video size={48} className={styles.monitorIcon} />
                             </div>
                             <video ref={videoRef} src="" className={styles.video} style={{ display: 'none' }} />
                        </div>
                    ) : videoFile.type === 'audio' ? (
                        <div className={styles.audioPlaceholder}>
                            <Music size={80} className={styles.audioIcon} />
                            <div className={styles.audioTitle}>{videoFile.name}</div>
                            <div className={styles.waves}>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                    <div
                                        key={i}
                                        className={styles.wave}
                                        style={{ animationDelay: `${i * 0.1}s` }}
                                    />
                                ))}
                            </div>
                            <video ref={videoRef} src={src} className={styles.video} style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }} />
                        </div>
                    ) : (
                        <video ref={videoRef} src={src} className={styles.video} />
                    )}
                    <VideoPlayerOverlay
                        activeSubtitles={activeSubtitles}
                        currentTime={currentTime}
                        onSubtitleMouseDown={handleSubtitleMouseDown}
                    />
                </div>

                {zoom !== 1 && <div className={styles.zoomIndicator}>{(zoom * 100).toFixed(0)}%</div>}

                {/* Apply All Prompt */}
                {showApplyPrompt && (
                    <div
                        className={styles.pastedPrompt}
                        style={{
                            position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
                            backgroundColor: 'var(--accent-primary)', color: 'white', padding: '8px 16px', borderRadius: '20px',
                            cursor: 'pointer', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeIn 0.3s ease'
                        }}
                        onClick={(e) => { e.stopPropagation(); applyStyleToAll(); setShowApplyPrompt(false) }}
                    >
                        <span>✨ Apply to All Tracks?</span>
                    </div>
                )}
            </div>

            <VideoPlayerControls />
        </div>
    )
}


