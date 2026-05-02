'use client'

import { useEffect } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import styles from './SilenceControls.module.css'
import {
    Sliders,
    Zap,
    Play,
    Scissors,
    Save,
    Monitor,
    Server,
    Share2
} from 'lucide-react'

export default function SilenceControls() {
    const {
        silenceSettings,
        setSilenceSettings,
        detectSilence,
        detectedSilence,
        isDetectingSilence,
        silenceProgress,
        silenceDetectionMode,
        setSilenceDetectionMode,
        exportWithoutSilence,
        videoFile,
        setExportModalOpen
    } = useProjectStore()

    // Auto-detect when settings change (Debounced)
    useEffect(() => {
        if (!videoFile) return

        const timer = setTimeout(() => {
            detectSilence()
        }, 600) // 600ms delay to allow user to finish sliding

        return () => clearTimeout(timer)
    }, [silenceSettings, silenceDetectionMode, detectSilence, videoFile])

    const handleChange = (key: keyof typeof silenceSettings, value: number) => {
        setSilenceSettings({ [key]: value })
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <h3><Scissors size={18} /> إزالة الصمت</h3>
                    <span className={styles.liveBadge} title="يتم التحديث تلقائياً عند تغيير الإعدادات">
                        <span className={styles.pulse} /> مباشر
                    </span>
                </div>
                <p>إعدادات الكشف التلقائي الذكي</p>
            </div>

            {/* Detection Mode Toggle */}
            <div className={styles.modeToggle}>
                <button
                    className={`${styles.modeBtn} ${silenceDetectionMode === 'browser' ? styles.active : ''}`}
                    onClick={() => setSilenceDetectionMode('browser')}
                    title="تحليل سريع في المتصفح"
                >
                    <Monitor size={14} /> متصفح (سريع)
                </button>
                <button
                    className={`${styles.modeBtn} ${silenceDetectionMode === 'server' ? styles.active : ''}`}
                    onClick={() => setSilenceDetectionMode('server')}
                    title="تحليل دقيق على السيرفر"
                >
                    <Server size={14} /> سيرفر (دقيق)
                </button>
            </div>

            <div className={styles.controls}>
                {/* Threshold */}
                <div className={styles.controlGroup}>
                    <label>
                        <span>مستوى الصمت (dB)</span>
                        <span className={styles.value}>{silenceSettings.threshold} dB</span>
                    </label>
                    <input
                        type="range"
                        className={styles.rangeInput}
                        min="-60"
                        max="0"
                        step="1"
                        value={silenceSettings.threshold}
                        onChange={(e) => handleChange('threshold', parseInt(e.target.value))}
                    />
                    <p className={styles.hint}>أي صوت تحت هذا المستوى يعتبر صمتاً</p>
                </div>

                {/* Min Duration */}
                <div className={styles.controlGroup}>
                    <label>
                        <span>أقل مدة (ثانية)</span>
                        <span className={styles.value}>{silenceSettings.minDuration} s</span>
                    </label>
                    <input
                        type="range"
                        className={styles.rangeInput}
                        min="0.1"
                        max="2.0"
                        step="0.1"
                        value={silenceSettings.minDuration}
                        onChange={(e) => handleChange('minDuration', parseFloat(e.target.value))}
                    />
                    <p className={styles.hint}>أقصر مدة صمت سيتم كشفها</p>
                </div>

                {/* Padding */}
                <div className={styles.controlGroup}>
                    <label>
                        <span>هامش الأمان (Buffer)</span>
                        <span className={styles.value}>{silenceSettings.padding} s</span>
                    </label>
                    <input
                        type="range"
                        className={styles.rangeInput}
                        min="0.0"
                        max="0.5"
                        step="0.05"
                        value={silenceSettings.padding}
                        onChange={(e) => handleChange('padding', parseFloat(e.target.value))}
                    />
                    <p className={styles.hint}>ترك مسافة آمنة قبل وبعد الكلام</p>
                </div>
            </div>

            <div className={styles.actions}>
                {/* Manual trigger for safety, but less prominent */}
                <button
                    className={styles.detectBtnSecondary}
                    onClick={() => detectSilence()}
                    disabled={isDetectingSilence}
                >
                    {isDetectingSilence ? (
                        <>
                            <span className="spinner-small" /> جاري الكشف... {silenceProgress}%
                        </>
                    ) : (
                        <>
                            <Zap size={14} /> إعادة الكشف يدوياً
                        </>
                    )}
                </button>

                {/* Progress Bar (Always visible placeholder to prevent jumping) */}
                <div className={styles.progressContainer}>
                    {isDetectingSilence ? (
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${silenceProgress}%` }}
                            />
                        </div>
                    ) : (
                        <div className={styles.statusOk}>
                             <Zap size={10} /> تم التحديث
                        </div>
                    )}
                </div>

                {detectedSilence.length > 0 && (
                    <div className={styles.stats}>
                        <p>تم العثور على <strong>{detectedSilence.length}</strong> منطقة صامتة</p>
                        <p>إجمالي المدة: {detectedSilence.reduce((acc, s) => acc + s.duration, 0).toFixed(2)} ثانية</p>
                    </div>
                )}
            </div>

        </div>
    )
}

