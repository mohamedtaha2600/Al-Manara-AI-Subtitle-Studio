'use client'

import React from 'react'
import styles from './TranscriptionPrompt.module.css'

interface PrecisionNodeProps {
    minSilenceMs: number
    maxWordsPerSegment: number
    vadSettings: {
        enabled: boolean
        threshold: number
    }
    onUpdate: (settings: any) => void
    onUpdateVAD: (settings: any) => void
    onAutoThreshold?: () => number
    isAnalyzing?: boolean
}

export const PrecisionNode: React.FC<PrecisionNodeProps> = ({
    minSilenceMs,
    maxWordsPerSegment,
    vadSettings,
    onUpdate,
    onUpdateVAD,
    onAutoThreshold,
    isAnalyzing
}) => {
    return (
        <div className={styles.nodeContent}>
            {/* Max Words */}
            <div className={styles.controlGroup}>
                <label className={styles.controlLabel}>
                    <span>
                        أقصى عدد كلمات
                        <span dir="ltr" style={{ display: 'inline-block', marginRight: '4px', opacity: 0.8 }}>(Max Words)</span>
                    </span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{maxWordsPerSegment}</span>
                </label>
                <input
                    type="range" min="1" max="15" step="1"
                    value={maxWordsPerSegment}
                    onChange={(e) => onUpdate({ maxWordsPerSegment: Number(e.target.value) })}
                    className={styles.rangeInput}
                />
                <div className={styles.rangeLegend}>
                    <span>كلمة واحدة ☝️</span>
                    <span>جملة كاملة 📖</span>
                </div>
            </div>

            {/* VAD Preview Section */}
            <div className={`${styles.vadSection} ${vadSettings.enabled ? styles.vadSectionEnabled : ''}`}>
                <div className={styles.vadHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', direction: 'rtl' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '1rem' }}>🔍</span>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span className={styles.vadTitle}>معاينة تحليل الكلام</span>
                            <span style={{ fontSize: '0.6rem', opacity: 0.5, direction: 'ltr' }}>Client-side VAD</span>
                        </div>
                    </div>
                    <label className={styles.smartToggle} style={{ border: 'none', background: 'transparent', padding: 0, gap: 8 }}>
                        <input
                            type="checkbox"
                            checked={vadSettings.enabled}
                            onChange={(e) => onUpdateVAD({ enabled: e.target.checked })}
                        />
                        <span style={{ fontSize: '0.7rem' }}>{vadSettings.enabled ? 'مفعل' : 'معطل'}</span>
                    </label>
                </div>

                {vadSettings.enabled && isAnalyzing && (
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                        <div className={styles.pulseLoader}></div>
                        <p style={{ fontSize: '0.65rem', opacity: 0.6 }}>جاري تحليل الصوت...</p>
                    </div>
                )}

                {vadSettings.enabled && (
                    <div className={styles.vadContent} style={{ paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {/* 1. Sensitivity Slider */}
                        <div className={styles.controlGroup} style={{ background: 'rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                                <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span>حساسية الصوت</span>
                                    <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>(Sensitivity)</span>
                                </label>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-primary)', fontFamily: 'monospace' }}>
                                        {Math.round((1 - vadSettings.threshold) * 100)}%
                                    </span>
                                    {onAutoThreshold && (
                                        <button
                                            onClick={() => onUpdateVAD({ threshold: onAutoThreshold() })}
                                            className={styles.stateBtn}
                                            style={{ minWidth: 'auto', padding: '2px 6px', background: 'var(--accent-primary)', color: '#000' }}
                                        >
                                            AUTO
                                        </button>
                                    )}
                                </div>
                            </div>
                            <input
                                type="range" min="0.001" max="0.3" step="0.005"
                                value={vadSettings.threshold}
                                onChange={(e) => onUpdateVAD({ threshold: Number(e.target.value) })}
                                className={styles.rangeInput}
                                style={{ accentColor: 'var(--accent-primary)' }}
                            />
                        </div>

                        {/* 2. Min Silence Slider */}
                        <div className={styles.controlGroup} style={{ background: 'rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                                <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span>أقل مدة صمت</span>
                                    <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>(Min Silence)</span>
                                </label>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#22c55e', fontFamily: 'monospace' }}>
                                    {minSilenceMs}ms
                                </span>
                            </div>
                            <input
                                type="range" min="50" max="1000" step="50"
                                value={minSilenceMs}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    onUpdate({ minSilenceMs: val });
                                    onUpdateVAD({ minSilenceMs: val });
                                }}
                                className={styles.rangeInput}
                                style={{ accentColor: '#22c55e' }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
