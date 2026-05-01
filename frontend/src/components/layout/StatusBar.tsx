'use client'

/**
 * Status Bar Component
 * شريط الحالة الاحترافي
 */

import { useEffect, useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import styles from './StatusBar.module.css'


interface StatusBarProps {
    onModelStatusChange?: (status: 'connected' | 'loading' | 'error') => void
}

export default function StatusBar({ onModelStatusChange }: StatusBarProps) {
    const {
        isTranscribing,
        progress,
        statusMessage,
        segments,
        videoFile,
        setSettingsModalOpen,
        setExportModalOpen,
        gpuEnabled,
        performanceMode
    } = useProjectStore()

    const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
    const [modelStatus, setModelStatus] = useState<'ready' | 'loading' | 'unknown'>('unknown')

    // Check backend connection
    useEffect(() => {
        const checkBackend = async () => {
            try {
                const response = await fetch('/api/health', { method: 'GET' })
                if (response.ok || response.status === 404) {
                    // 404 is fine - means backend is running but no /health endpoint
                    setBackendStatus('connected')
                } else {
                    setBackendStatus('disconnected')
                }
            } catch {
                setBackendStatus('disconnected')
            }
        }

        checkBackend()
        const interval = setInterval(checkBackend, 30000) // Check every 30s
        return () => clearInterval(interval)
    }, [])

    // Update model status based on transcription
    useEffect(() => {
        if (isTranscribing) {
            if (statusMessage.includes('Loading') || statusMessage.includes('تحميل')) {
                setModelStatus('loading')
            } else {
                setModelStatus('ready')
            }
        }
    }, [isTranscribing, statusMessage])

    const getProgressColor = () => {
        if (progress >= 100) return 'var(--success)'
        if (progress >= 80) return 'var(--accent-secondary)'
        if (progress >= 50) return 'var(--accent-primary)'
        return 'var(--info)'
    }

    const getProgressLabel = () => {
        if (progress >= 100) return '✅ مكتمل'
        if (progress >= 80) return '🔍 جاري التحقق...'
        if (progress >= 50) return '⚙️ جاري المعالجة...'
        if (progress > 0) return '🚀 جاري البدء...'
        return ''
    }

    return (
        <div className={styles.statusBar}>
            {/* Left: Connection Status */}
            <div className={styles.leftSection}>
                {/* Backend Status */}
                <div
                    className={`${styles.statusDot} ${backendStatus === 'connected' ? styles.connected : styles.error}`}
                    title={backendStatus === 'connected' ? 'Server Online' : 'Server Offline'}
                />
                <span className={styles.statusText}>
                    {backendStatus === 'connected' ? 'خادم متصل' : 'مفصول'}
                </span>

                <div className={styles.divider} />

                {/* GPU Status */}
                <div
                    className={styles.statusDot}
                    style={{
                        background: gpuEnabled ? 'var(--accent-secondary)' : 'var(--warning)',
                        boxShadow: gpuEnabled ? '0 0 8px var(--accent-secondary)' : 'none'
                    }}
                />
                <span className={styles.statusText}>
                    {gpuEnabled ? 'GPU Ready 🚀' : 'CPU Mode 💻'}
                </span>

                {/* Turbo Mode Indicator */}
                {performanceMode === 'speed' && (
                    <>
                        <div className={styles.divider} />
                        <span className={styles.statusText} style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                            TURBO 🚀
                        </span>
                    </>
                )}

                {/* Working indicator */}
                {isTranscribing && (
                    <>
                        <div className={styles.divider} />
                        <div className={`${styles.statusDot} ${styles.loading}`} />
                        <span className={styles.statusText}>
                            {modelStatus === 'loading' ? 'تحميل...' : 'معالجة...'}
                        </span>
                    </>
                )}
            </div>

            {/* Center: Progress */}
            {isTranscribing && (
                <div className={styles.centerSection}>
                    <div className={styles.progressContainer}>
                        <div
                            className={styles.progressFill}
                            style={{
                                width: `${progress}%`,
                                background: getProgressColor()
                            }}
                        />
                    </div>
                    <span className={styles.progressLabel}>
                        {getProgressLabel()} {progress.toFixed(0)}%
                    </span>
                </div>
            )}

            {/* Right: Stats */}
            <div className={styles.rightSection}>
                {segments.length > 0 && (
                    <span className={styles.stat}>
                        📝 {segments.length} مقطع
                    </span>
                )}
                {videoFile && (
                    <span className={styles.stat}>
                        🎬 {videoFile.name.slice(0, 20)}...
                    </span>
                )}

                <div className={styles.divider} />

                {segments.length > 0 && (
                    <button
                        className={styles.settingsBtn}
                        onClick={() => setExportModalOpen(true)}
                        title="تصدير Export"
                        style={{ marginRight: 8 }}
                    >
                        📤
                    </button>
                )}

                <button
                    className={styles.settingsBtn}
                    onClick={() => setSettingsModalOpen(true)}
                    title="الإعدادات Settings"
                >
                    ⚙️
                </button>
            </div>
        </div>
    )
}
