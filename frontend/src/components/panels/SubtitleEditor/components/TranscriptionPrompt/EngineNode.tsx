'use client'

import React from 'react'
import styles from './TranscriptionPrompt.module.css'
import { Zap, Cpu, WifiOff, Type, SpellCheck, AlertCircle, Info } from 'lucide-react'

interface EngineNodeProps {
    includeDiacritics: boolean
    includePunctuation: boolean
    gpuEnabled: boolean
    offlineMode: boolean
    performanceMode: 'speed' | 'accuracy'
    onUpdateSettings: (settings: any) => void
    onUpdateSystemSetting: (key: any, value: any) => void
}

export const EngineNode: React.FC<EngineNodeProps> = ({
    includeDiacritics,
    includePunctuation,
    gpuEnabled,
    offlineMode,
    performanceMode,
    onUpdateSettings,
    onUpdateSystemSetting
}) => {
    const isTurbo = performanceMode === 'speed'

    return (
        <div className={styles.nodeContent}>
            {/* 1. LINGUISTIC ENGINE */}
            <div className={styles.controlGroup}>
                <div className={styles.groupHeader}>
                    <SpellCheck size={14} className={styles.groupIcon} />
                    <span>المعالجة اللغوية</span>
                </div>
                
                <div className={styles.optionsGrid}>
                    <label className={`${styles.smartToggle} ${includeDiacritics ? styles.active : ''}`}>
                        <input
                            type="checkbox"
                            hidden
                            checked={includeDiacritics}
                            onChange={(e) => onUpdateSettings({ includeDiacritics: e.target.checked })}
                        />
                        <Type size={16} />
                        <div className={styles.toggleText}>
                            <span className={styles.mainLabel}>إضافة التشكيل</span>
                            <span className={styles.subLabel}>Diacritics</span>
                        </div>
                    </label>

                    <label className={`${styles.smartToggle} ${includePunctuation ? styles.active : ''}`}>
                        <input
                            type="checkbox"
                            hidden
                            checked={includePunctuation}
                            onChange={(e) => onUpdateSettings({ includePunctuation: e.target.checked })}
                        />
                        <SpellCheck size={16} />
                        <div className={styles.toggleText}>
                            <span className={styles.mainLabel}>ترقيم تلقائي</span>
                            <span className={styles.subLabel}>Punctuation</span>
                        </div>
                    </label>
                </div>
            </div>

            {/* 2. PERFORMANCE & HARDWARE */}
            <div className={styles.controlGroup}>
                <div className={styles.groupHeader}>
                    <Cpu size={14} className={styles.groupIcon} />
                    <span>تحسينات الأداء والعتاد</span>
                </div>

                <div className={styles.systemStack}>
                    {/* Turbo Mode */}
                    <label className={`${styles.systemRow} ${isTurbo ? styles.turboRow : ''}`}>
                        <input
                            type="checkbox"
                            hidden
                            checked={isTurbo}
                            onChange={() => onUpdateSystemSetting('performanceMode', isTurbo ? 'accuracy' : 'speed')}
                        />
                        <div className={styles.systemInfo}>
                            <div className={styles.systemLabel}>
                                <Zap size={14} className={isTurbo ? styles.pulseIcon : ''} />
                                <span>وضع السرعة القصوى (Turbo)</span>
                            </div>
                            {isTurbo && (includePunctuation || includeDiacritics) && (
                                <p className={styles.inlineWarning}>
                                    <AlertCircle size={10} /> قد تقل الدقة قليلاً
                                </p>
                            )}
                        </div>
                        <div className={styles.stateBtnContainer}>
                            <span className={`${styles.stateBtn} ${isTurbo ? styles.btnTurbo : ''}`}>
                                {isTurbo ? 'مفعل' : 'معطل'}
                            </span>
                        </div>
                    </label>

                    {/* GPU Processing */}
                    <label className={`${styles.systemRow} ${gpuEnabled ? styles.gpuRow : ''}`}>
                        <input
                            type="checkbox"
                            hidden
                            checked={gpuEnabled}
                            onChange={() => onUpdateSystemSetting('gpuEnabled', !gpuEnabled)}
                        />
                        <div className={styles.systemInfo}>
                            <div className={styles.systemLabel}>
                                <Cpu size={14} />
                                <span>معالجة بواسطة الجرافيك (GPU)</span>
                            </div>
                        </div>
                        <div className={styles.stateBtnContainer}>
                            <span className={`${styles.stateBtn} ${gpuEnabled ? styles.btnGpu : ''}`}>
                                {gpuEnabled ? 'NVIDIA ON' : 'CPU Only'}
                            </span>
                        </div>
                    </label>

                </div>
            </div>
        </div>
    )
}
