'use client'

/**
 * SilencePanel Component - V2
 * لوحة إزالة الصمت المحسّنة مع تبويبات
 * 
 * Tabs:
 * - إعدادات الصمت (Settings)
 * - أماكن الصمت (Segments)
 * - السجل (Log)
 */

import React, { useState, useRef, useEffect } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { formatTime } from '@/utils/timeUtils'
import {
    Settings,
    Scissors,
    History,
    Trash2,
    Play,
    Pause,
    Navigation,
    Volume2,
    VolumeX
} from 'lucide-react'
import styles from './SilencePanel.module.css'
import SilenceControls from './components/SilenceControls'

type SilenceTab = 'settings' | 'segments' | 'log'

export default function SilencePanel() {
    const {
        detectedSilence,
        setDetectedSilence,
        currentSegment,
        setCurrentSegment,
        setCurrentTime,
        videoFile,
        logs,
        isPlaying,
        setIsPlaying
    } = useProjectStore()

    const [activeTab, setActiveTab] = useState<SilenceTab>('settings')
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
            // Stop playing
            setPlayingSegmentId(null)
            if (audioRef.current) {
                audioRef.current.pause()
            }
            return
        }

        setPlayingSegmentId(seg.id)

        // Create audio element to play the silence segment
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

        // Clean up after segment ends
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

    // Filter logs for silence-related entries
    const silenceLogs = logs?.filter(log =>
        log.message.includes('صمت') ||
        log.message.includes('silence') ||
        log.message.includes('Silence')
    ) || []

    const totalSilenceDuration = detectedSilence.reduce((acc, s) => acc + s.duration, 0)

    return (
        <div className={styles.container}>
            {/* Tab Navigation */}
            <div className={styles.tabNav}>
                <button
                    className={`${styles.tab} ${activeTab === 'settings' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    <Settings size={16} />
                    <span>إعدادات الصمت</span>
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'segments' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('segments')}
                >
                    <Scissors size={16} />
                    <span>أماكن الصمت</span>
                    {detectedSilence.length > 0 && (
                        <span className={styles.badge}>{detectedSilence.length}</span>
                    )}
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'log' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('log')}
                >
                    <History size={16} />
                    <span>السجل</span>
                </button>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
                {/* === SETTINGS TAB === */}
                {activeTab === 'settings' && (
                    <div className={styles.settingsTab}>
                        <SilenceControls />
                    </div>
                )}

                {/* === SEGMENTS TAB === */}
                {activeTab === 'segments' && (
                    <div className={styles.segmentsTab}>
                        {/* Header with stats */}
                        <div className={styles.listHeader}>
                            <h3>أماكن الصمت ({detectedSilence.length})</h3>
                            <span className={styles.stats}>
                                إجمالي: {totalSilenceDuration.toFixed(1)} ثانية
                            </span>
                        </div>

                        {/* Segments List */}
                        <div className={styles.segmentsList}>
                            {detectedSilence.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <VolumeX size={32} opacity={0.3} />
                                    <p>لم يتم كشف أي صمت بعد</p>
                                    <p className={styles.hint}>
                                        اضبط الإعدادات واضغط "كشف الصمت"
                                    </p>
                                </div>
                            ) : (
                                detectedSilence.map((seg, index) => (
                                    <div
                                        key={seg.id}
                                        className={`${styles.segmentItem} ${currentSegment === seg.id ? styles.active : ''}`}
                                        onClick={() => handleJumpToSegment(seg)}
                                    >
                                        <div className={styles.segmentInfo}>
                                            <span className={styles.segmentIndex}>#{index + 1}</span>
                                            <div className={styles.timeRange}>
                                                <span>{formatTime(seg.start)}</span>
                                                <span className={styles.arrow}>→</span>
                                                <span>{formatTime(seg.end)}</span>
                                            </div>
                                            <span className={styles.duration}>
                                                {seg.duration.toFixed(1)}s
                                            </span>
                                        </div>

                                        <div className={styles.segmentActions}>
                                            {/* Play/Preview button */}
                                            <button
                                                className={styles.actionBtn}
                                                onClick={(e) => handlePlaySegment(seg, e)}
                                                title="سماع هذا المقطع"
                                            >
                                                {playingSegmentId === seg.id ? (
                                                    <Pause size={14} />
                                                ) : (
                                                    <Play size={14} />
                                                )}
                                            </button>

                                            {/* Jump to timeline button */}
                                            <button
                                                className={styles.actionBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleJumpToSegment(seg)
                                                }}
                                                title="الانتقال للموقع"
                                            >
                                                <Navigation size={14} />
                                            </button>

                                            {/* Delete button */}
                                            <button
                                                className={styles.deleteBtn}
                                                onClick={(e) => handleDeleteSegment(seg.id, e)}
                                                title="استعادة الصوت (حذف الصمت)"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* === LOG TAB === */}
                {activeTab === 'log' && (
                    <div className={styles.logTab}>
                        <div className={styles.listHeader}>
                            <h3>سجل العمليات</h3>
                        </div>
                        <div className={styles.logList}>
                            {silenceLogs.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <History size={32} opacity={0.3} />
                                    <p>لا توجد عمليات بعد</p>
                                </div>
                            ) : (
                                silenceLogs.slice().reverse().map((log, index) => (
                                    <div
                                        key={index}
                                        className={`${styles.logItem} ${styles[log.level]}`}
                                    >
                                        <span className={styles.logTime}>
                                            {new Date(log.timestamp).toLocaleTimeString('ar-EG')}
                                        </span>
                                        <span className={styles.logMessage}>{log.message}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
