'use client'

/**
 * Status Bar Component
 * شريط الحالة الاحترافي
 */

import { useEffect, useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { getApiUrl } from '@/utils/config'
import { Captions, Scissors, Sparkles } from 'lucide-react'
import styles from './StatusBar.module.css'


interface StatusBarProps {
    onModelStatusChange?: (status: 'connected' | 'loading' | 'error') => void
}

export default function StatusBar({ onModelStatusChange }: StatusBarProps) {
    const {
        activePanel,
        setActivePanel,
        isTranscribing,
        progress,
        statusMessage,
        segments,
        videoFile,
        setSettingsModalOpen,
        setExportModalOpen,
        gpuEnabled,
        performanceMode,
        isVideoUploading,
        videoUploadProgress,
        engineSource
    } = useProjectStore()

    const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
    const [modelStatus, setModelStatus] = useState<'ready' | 'loading' | 'unknown'>('unknown')

    // Check backend connection
    useEffect(() => {
        const checkBackend = async () => {
            try {
                const response = await fetch(getApiUrl('health', engineSource), { method: 'GET' })
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
    }, [engineSource])

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
            {/* Turbo Progress Line (Premium Overlay) */}
            {isTranscribing && (
                <div 
                    className={styles.turboProgressLine} 
                    style={{ 
                        width: `${progress}%`,
                        background: getProgressColor(),
                        boxShadow: `0 0 10px ${getProgressColor()}`
                    }} 
                />
            )}

            <div className={styles.leftSection}>
                {/* Backend Status */}
                <div
                    className={`${styles.statusDot} ${backendStatus === 'connected' ? styles.connected : styles.error}`}
                    title={backendStatus === 'connected' ? 'Server Online' : 'Server Offline'}
                />
                <span className={styles.statusText}>
                    {engineSource === 'local' ? 'الاستوديو المحلي' : 'الخادم السحابي'}: {backendStatus === 'connected' ? 'متصل' : 'مفصول'}
                </span>

                {/* GPU Status - Only relevant in Local Mode */}
                {engineSource === 'local' && (
                    <>
                        <div className={styles.divider} />
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
                    </>
                )}

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

                {/* Background Upload Progress & Completion Status */}
                {isVideoUploading ? (
                    <>
                        <div className={styles.divider} />
                        <div className={`${styles.statusDot} ${styles.loading}`} style={{ background: 'var(--accent-secondary)' }} />
                        <span className={styles.statusText} style={{ color: 'var(--accent-secondary)' }}>
                            جاري رفع {videoFile?.type === 'audio' ? 'الصوت' : 'الفيديو'}: {videoUploadProgress}%
                        </span>
                    </>
                ) : videoFile ? (
                    <>
                        <div className={styles.divider} />
                        <div className={styles.statusDot} style={{ background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
                        <span className={styles.statusText} style={{ color: 'var(--success)', fontWeight: 500 }}>
                            تم التحميل ✅
                        </span>
                    </>
                ) : null}
            </div>

            {/* Center: Progress / Mobile Nav */}
            <div className={styles.centerSection}>
                {isTranscribing ? (
                    <>
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
                    </>
                ) : (
                    /* Mobile Navigation Items - Visible only on mobile via CSS */
                    <div className={styles.mobileNav}>
                        <button 
                            className={`${styles.mobileNavItem} ${activePanel === 'subtitles' ? styles.active : ''}`}
                            onClick={() => setActivePanel('subtitles')}
                        >
                            <Captions size={20} />
                            <span>ترجمة</span>
                        </button>
                        <button 
                            className={`${styles.mobileNavItem} ${activePanel === 'silence' ? styles.active : ''}`}
                            onClick={() => setActivePanel('silence')}
                        >
                            <Scissors size={20} />
                            <span>قص</span>
                        </button>
                        <button 
                            className={`${styles.mobileNavItem} ${activePanel === 'enhance' ? styles.active : ''} ${styles.comingSoon}`}
                            disabled
                        >
                            <Sparkles size={20} />
                            <span>تحسين</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Right: Stats */}
            <div className={styles.rightSection}>
                <div className={styles.desktopStats}>
                    {videoFile && (
                        <span className={styles.stat}>
                            🎬 {videoFile.name.slice(0, 15)}...
                        </span>
                    )}
                </div>

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
