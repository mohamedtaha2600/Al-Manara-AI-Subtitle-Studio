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
            {/* Max Words - Kept outside as it is not strictly VAD related (it's splitting logic) */}
            <div className={styles.controlGroup}>
                <label className={styles.controlLabel} style={{ alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{maxWordsPerSegment}</span>
                    <span dir="rtl">
                        أقصى عدد كلمات
                        <span dir="ltr" style={{ display: 'inline-block', marginRight: '4px', opacity: 0.8 }}>(Max Words)</span>
                    </span>
                </label>
                <input
                    type="range" min="1" max="15" step="1"
                    value={maxWordsPerSegment}
                    onChange={(e) => onUpdate({ maxWordsPerSegment: Number(e.target.value) })}
                    className={styles.rangeInput}
                    style={{ direction: 'rtl' }}
                />
                <div className={styles.rangeLegend} style={{ flexDirection: 'row-reverse' }}>
                    <span>كلمة واحدة ☝️</span>
                    <span>جملة كاملة 📖</span>
                </div>
            </div>

            {/* VAD Preview Section */}
            <div className={`${styles.vadSection} ${vadSettings.enabled ? styles.vadSectionEnabled : ''}`}>
                <div className={styles.vadHeader} style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: 'row-reverse' }}>
                        <span style={{ fontSize: '1.1rem' }}>🔍</span>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span className={styles.vadTitle} style={{ color: vadSettings.enabled ? '#3b82f6' : 'inherit', fontSize: '0.85rem' }}>
                                معاينة تحليل الكلام
                            </span>
                            <span style={{ fontSize: '0.65rem', opacity: 0.6, direction: 'ltr' }}>
                                Client-side VAD
                            </span>
                        </div>
                    </div>
                    <label className={styles.switch} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexDirection: 'row-reverse' }}>
                        <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{vadSettings.enabled ? 'مفعل' : 'معطل'}</span>
                        <input
                            type="checkbox"
                            checked={vadSettings.enabled}
                            onChange={(e) => onUpdateVAD({ enabled: e.target.checked })}
                        />
                    </label>
                </div>

                {vadSettings.enabled && isAnalyzing && (
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                        <div className={styles.pulseLoader}></div>
                        <p style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: 5 }}>جاري تحليل الصوت... يرجى الانتظار</p>
                    </div>
                )}

                {vadSettings.enabled && (
                    <div className={styles.vadContent} style={{ paddingTop: 10 }}>
                        {/* 1. Sensitivity Slider */}
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center', flexDirection: 'row-reverse' }}>
                                <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6, flexDirection: 'row-reverse' }}>
                                    <span>حساسية الصوت</span>
                                    <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>(Sensitivity)</span>
                                </label>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexDirection: 'row-reverse' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#3b82f6', fontFamily: 'monospace' }}>
                                        {Math.round((1 - vadSettings.threshold) * 100)}%
                                    </span>
                                    {onAutoThreshold && (
                                        <button
                                            onClick={() => {
                                                const autoVal = onAutoThreshold()
                                                onUpdateVAD({ threshold: autoVal })
                                            }}
                                            style={{
                                                fontSize: '0.6rem',
                                                padding: '2px 8px',
                                                borderRadius: 10,
                                                background: 'var(--accent-primary)',
                                                color: 'white',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                            }}
                                            title="Auto Detect Noise Floor"
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
                                style={{ width: '100%', accentColor: '#3b82f6', direction: 'rtl', height: 4 }}
                            />
                            <p style={{ fontSize: '0.6rem', color: '#9ca3af', marginTop: 4, textAlign: 'right', lineHeight: 1.4 }} dir="rtl">
                                * يحدد مستوى الضجيج الذي يعتبر "كلام". قلل القيمة لزيادة الحساسية للأصوات الخافتة.
                            </p>
                        </div>

                        {/* 2. Min Silence Slider */}
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, flexDirection: 'row-reverse', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6, flexDirection: 'row-reverse' }}>
                                    <span>أقل مدة صمت</span>
                                    <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>(Min Silence)</span>
                                </label>
                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#22c55e', fontFamily: 'monospace' }}>
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
                                style={{ width: '100%', accentColor: '#22c55e', direction: 'rtl', height: 4 }}
                            />
                            <p style={{ fontSize: '0.6rem', color: '#ffcc00', marginTop: 4, textAlign: 'right', lineHeight: 1.4 }} dir="rtl">
                                * هذا هو "المقص" الأساسي للجمل. البرنامج التزم بالتقطيع بناءً على السكتات اللي المتصفح بيحددها هنا.
                            </p>
                        </div>

                        <p className={styles.vadHint} style={{ textAlign: 'right', fontSize: '0.65rem', marginTop: 5, opacity: 0.5 }}>
                            💡 المناطق الخضراء = كلام سيتم ترجمته
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
