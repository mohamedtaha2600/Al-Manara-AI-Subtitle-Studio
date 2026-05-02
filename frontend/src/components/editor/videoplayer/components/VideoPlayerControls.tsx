import React from 'react'
import styles from './VideoPlayerControls.module.css'
import { useProjectStore } from '@/store/useProjectStore'
import { formatTime } from '@/utils/timeUtils'
import {
    Play,
    Pause,
    RotateCcw,
    RotateCw,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    Maximize2
} from 'lucide-react'

export default function VideoPlayerControls() {
    const {
        videoFile,
        isPlaying,
        setIsPlaying,
        currentTime,
        setCurrentTime,
        segments,
        // UI / Player State
        playerVolume,
        setPlayerVolume,
        playerIsMuted,
        setPlayerMuted,
        playerRate,
        setPlayerRate,
        playerZoom,
        setPlayerZoom,
        setPlayerPan,
        playerShowControls
    } = useProjectStore()

    const duration = videoFile?.duration || 0
    const [isFullscreen, setIsFullscreen] = React.useState(false)

    React.useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsPlaying(!isPlaying)
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value)
        setCurrentTime(time)
    }

    const skipSeconds = (seconds: number) => {
        setCurrentTime(Math.max(0, Math.min(duration, currentTime + seconds)))
    }

    const handleFit = (e: React.MouseEvent) => {
        e.stopPropagation()
        setPlayerZoom(0.6)
        setPlayerPan({ x: 0, y: 0 })
    }

    const toggleFullscreen = (e: React.MouseEvent) => {
        e.stopPropagation()
        const container = document.getElementById('video-player-container')
        if (!container) return

        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => console.error(err))
        } else {
            document.exitFullscreen().catch(err => console.error(err))
        }
    }

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const vol = parseFloat(e.target.value)
        setPlayerVolume(vol)
        if (vol > 0 && playerIsMuted) setPlayerMuted(false)
    }

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation()
        setPlayerMuted(!playerIsMuted)
    }

    const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

    return (
        <div
            className={`${styles.controls} ${playerShowControls ? styles.visible : ''}`}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Progress Bar */}
            <div className={styles.progressContainer}>
                <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className={styles.progressBar}
                    style={{
                        '--progress': `${(currentTime / (duration || 1)) * 100}%`
                    } as React.CSSProperties}
                />
                {segments.map((seg) => (
                    <div
                        key={seg.id}
                        className={styles.segmentMarker}
                        style={{
                            left: `${(seg.start / (duration || 1)) * 100}%`,
                            width: `${((seg.end - seg.start) / (duration || 1)) * 100}%`,
                        }}
                    />
                ))}
            </div>

            {/* Control Buttons Grouped for professional workflow */}
            <div className={styles.controlsRow}>
                {/* Left: Time & Volume */}
                <div className={styles.leftControls}>
                    <span className={styles.time}>
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    <div className={styles.volumeControl}>
                        <button className={styles.controlBtn} onClick={toggleMute} title="كتم الصوت (M)">
                            {playerIsMuted || playerVolume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={playerIsMuted ? 0 : playerVolume}
                            onChange={handleVolumeChange}
                            className={styles.volumeSlider}
                        />
                    </div>
                </div>

                {/* Center: Main Playback Controls */}
                <div className={styles.centerControls}>
                    <button className={styles.controlBtn} onClick={() => skipSeconds(-5)} title="5 ثواني للخلف (J)">
                        <RotateCcw size={20} />
                    </button>
                    <button className={styles.playBtn} onClick={togglePlay} title="تشغيل/إيقاف (Space)">
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                    </button>
                    <button className={styles.controlBtn} onClick={() => skipSeconds(5)} title="5 ثواني للأمام (L)">
                        <RotateCw size={20} />
                    </button>
                </div>

                {/* Right: Tools & Settings */}
                <div className={styles.rightControls}>
                    <div className={styles.speedControl}>
                        <select
                            value={playerRate}
                            onChange={(e) => setPlayerRate(parseFloat(e.target.value))}
                            className={styles.speedSelect}
                        >
                            {speedOptions.map(speed => (
                                <option key={speed} value={speed}>{speed}x</option>
                            ))}
                        </select>
                    </div>

                    <button
                        className={`${styles.controlBtn} ${playerZoom !== 1 ? styles.active : ''}`}
                        onClick={handleFit}
                        title="ملائمة (0)"
                    >
                        <Maximize2 size={20} />
                    </button>

                    <button className={styles.controlBtn} onClick={toggleFullscreen} title="ملء الشاشة (F)">
                        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                    </button>
                </div>
            </div>
        </div>
    )
}
