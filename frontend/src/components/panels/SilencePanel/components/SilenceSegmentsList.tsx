'use client'

/**
 * SilenceSegmentsList Component
 * قائمة أماكن الصمت - تُعرض في تبويب "أماكن الصمت"
 */

import React, { useRef, useEffect, useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { formatTime } from '@/utils/timeUtils'
import {
    Trash2,
    Play,
    Pause,
    Navigation,
    VolumeX
} from 'lucide-react'
import styles from './SilenceSegmentsList.module.css'

export default function SilenceSegmentsList() {
    const {
        detectedSilence,
        setDetectedSilence,
        currentSegment,
        setCurrentSegment,
        setCurrentTime,
        videoFile
    } = useProjectStore()

    const [playingSegmentId, setPlayingSegmentId] = useState<number | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Jump to silence segment in timeline
    const handleJumpToSegment = (seg: any) => {
        setCurrentSegment(seg.id)
        setCurrentTime(seg.start)
    }

    // Delete/restore silence segment
    const handleDeleteSegment = (id: number, e: React.MouseEvent) => {
        e.stopPropagation()
        const newSegments = detectedSilence.filter(s => s.id !== id)
        setDetectedSilence(newSegments)
    }

    // Play silence segment preview
    const handlePlaySegment = async (seg: any, e: React.MouseEvent) => {
        e.stopPropagation()

        if (!videoFile?.url) return

        if (playingSegmentId === seg.id) {
            setPlayingSegmentId(null)
            if (audioRef.current) {
                audioRef.current.pause()
            }
            return
        }

        setPlayingSegmentId(seg.id)

        if (!audioRef.current) {
            audioRef.current = new Audio(videoFile.url)
        }

        const audio = audioRef.current
        audio.currentTime = seg.start

        const handleTimeUpdate = () => {
            if (audio.currentTime >= seg.end) {
                audio.pause()
                setPlayingSegmentId(null)
            }
        }

        audio.addEventListener('timeupdate', handleTimeUpdate)
        audio.play()

        setTimeout(() => {
            audio.removeEventListener('timeupdate', handleTimeUpdate)
        }, (seg.end - seg.start) * 1000 + 100)
    }

    // Clean up audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
            }
        }
    }, [])

    const totalSilenceDuration = detectedSilence.reduce((acc, s) => acc + s.duration, 0)

    return (
        <div className={styles.container}>
            {/* Header with stats */}
            <div className={styles.header}>
                <span className={styles.count}>
                    {detectedSilence.length} منطقة صامتة
                </span>
                <span className={styles.totalDuration}>
                    إجمالي: {totalSilenceDuration.toFixed(1)} ث
                </span>
            </div>

            {/* Segments List */}
            <div className={styles.list}>
                {detectedSilence.length === 0 ? (
                    <div className={styles.emptyState}>
                        <VolumeX size={32} opacity={0.3} />
                        <p>لم يتم كشف أي صمت بعد</p>
                        <p className={styles.hint}>
                            اذهب لتبويب "إعدادات الصمت" واضغط "كشف الصمت"
                        </p>
                    </div>
                ) : (
                    detectedSilence.map((seg, index) => (
                        <div
                            key={seg.id}
                            className={`${styles.item} ${currentSegment === seg.id ? styles.active : ''}`}
                            onClick={() => handleJumpToSegment(seg)}
                        >
                            <div className={styles.itemInfo}>
                                <span className={styles.index}>#{index + 1}</span>
                                <div className={styles.timeRange}>
                                    <span>{formatTime(seg.start)}</span>
                                    <span className={styles.arrow}>→</span>
                                    <span>{formatTime(seg.end)}</span>
                                </div>
                                <span className={styles.duration}>
                                    {seg.duration.toFixed(1)}s
                                </span>
                            </div>

                            <div className={styles.actions}>
                                {/* Play button */}
                                <button
                                    className={styles.actionBtn}
                                    onClick={(e) => handlePlaySegment(seg, e)}
                                    title="سماع"
                                >
                                    {playingSegmentId === seg.id ? (
                                        <Pause size={14} />
                                    ) : (
                                        <Play size={14} />
                                    )}
                                </button>

                                {/* Jump button */}
                                <button
                                    className={styles.actionBtn}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleJumpToSegment(seg)
                                    }}
                                    title="انتقال"
                                >
                                    <Navigation size={14} />
                                </button>

                                {/* Delete button */}
                                <button
                                    className={styles.deleteBtn}
                                    onClick={(e) => handleDeleteSegment(seg.id, e)}
                                    title="حذف"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
