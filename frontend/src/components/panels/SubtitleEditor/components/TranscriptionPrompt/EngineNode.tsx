'use client'

import React from 'react'
import styles from './TranscriptionPrompt.module.css'

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
    return (
        <div className={styles.nodeContent}>
            {/* Visual Settings */}
            <div className={styles.controlGroup}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input
                            type="checkbox"
                            checked={includeDiacritics}
                            onChange={(e) => onUpdateSettings({ includeDiacritics: e.target.checked })}
                        />
                        <span dir="rtl">
                            إضافة التشكيل تلقائياً
                            <span dir="ltr" style={{ display: 'inline-block', marginRight: '6px', opacity: 0.8 }}>(Diacritics)</span>
                        </span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input
                            type="checkbox"
                            checked={includePunctuation}
                            onChange={(e) => onUpdateSettings({ includePunctuation: e.target.checked })}
                        />
                        <span dir="rtl">
                            ترقيم تلقائي
                            <span dir="ltr" style={{ display: 'inline-block', marginRight: '6px', opacity: 0.8 }}>(Punctuation)</span>
                        </span>
                    </label>
                </div>
            </div>

            {/* System Settings */}
            <div style={{ padding: '5px' }}>
                <p style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: 10, fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 5, textAlign: 'right' }}>
                    تحسينات الأداء (Optimization)
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Turbo Mode Toggle */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row-reverse' }}>
                        <span style={{ fontSize: '0.75rem' }} dir="rtl">
                            ⚡ وضع السرعة القصوى
                            <span dir="ltr" style={{ display: 'inline-block', marginRight: '4px', opacity: 0.8 }}>(Turbo)</span>
                        </span>
                        <button
                            onClick={() => onUpdateSystemSetting('performanceMode', performanceMode === 'speed' ? 'accuracy' : 'speed')}
                            style={{
                                padding: '4px 10px',
                                borderRadius: 4,
                                fontSize: '0.65rem',
                                background: performanceMode === 'speed' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                                color: performanceMode === 'speed' ? 'white' : 'inherit',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            {performanceMode === 'speed' ? 'مفعل 🔥' : 'معطل'}
                        </button>
                    </div>

                    {/* Turbo Warning */}
                    {(performanceMode === 'speed' && (includePunctuation || includeDiacritics)) && (
                        <p style={{ fontSize: '0.65rem', color: '#f59e0b', margin: '-4px 0 4px', textAlign: 'right', padding: '0 4px', opacity: 0.9 }} dir="rtl">
                            ⚠️ وضع السرعة "Turbo" قد يقلل من دقة الترقيم
                        </p>
                    )}

                    {/* GPU Toggle */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row-reverse' }}>
                        <span style={{ fontSize: '0.75rem' }} dir="rtl">
                            🎮 معالجة بواسطة
                            <span dir="ltr" style={{ display: 'inline-block', marginRight: '4px', opacity: 0.8 }}>(GPU)</span>
                        </span>
                        <button
                            onClick={() => onUpdateSystemSetting('gpuEnabled', !gpuEnabled)}
                            style={{
                                padding: '4px 10px',
                                borderRadius: 4,
                                fontSize: '0.65rem',
                                background: gpuEnabled ? '#22c55e' : 'rgba(255,255,255,0.1)',
                                color: gpuEnabled ? 'white' : 'inherit',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            {gpuEnabled ? 'NVIDIA ON' : 'CPU Only'}
                        </button>
                    </div>

                    {/* Offline Toggle */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row-reverse' }}>
                        <span style={{ fontSize: '0.75rem' }} dir="rtl">
                            📴 العمل بدون إنترنت
                            <span dir="ltr" style={{ display: 'inline-block', marginRight: '4px', opacity: 0.8 }}>(Offline)</span>
                        </span>
                        <button
                            onClick={() => onUpdateSystemSetting('offlineMode', !offlineMode)}
                            style={{
                                padding: '4px 10px',
                                borderRadius: 4,
                                fontSize: '0.65rem',
                                background: offlineMode ? '#6366f1' : 'rgba(255,255,255,0.1)',
                                color: offlineMode ? 'white' : 'inherit',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            {offlineMode ? 'Local Only' : 'Cloud Hybrid'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
