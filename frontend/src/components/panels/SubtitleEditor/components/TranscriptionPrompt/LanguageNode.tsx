'use client'

import React from 'react'
import styles from './TranscriptionPrompt.module.css'

interface LanguageNodeProps {
    includeSource: boolean
    targetLanguages: string[]
    onUpdate: (settings: any) => void
}

export const LanguageNode: React.FC<LanguageNodeProps> = ({
    includeSource,
    targetLanguages,
    onUpdate
}) => {
    const toggleLanguage = (lang: string) => {
        if (targetLanguages.includes(lang)) {
            onUpdate({ targetLanguages: targetLanguages.filter(l => l !== lang) })
        } else if (targetLanguages.length < 5) {
            onUpdate({ targetLanguages: [...targetLanguages, lang] })
        }
    }

    return (
        <div className={styles.nodeContent}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, cursor: 'pointer', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                    <input
                        type="checkbox"
                        checked={includeSource}
                        onChange={(e) => onUpdate({ includeSource: e.target.checked })}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }} dir="rtl">
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>اللغة الأصلية للمقطع (Auto)</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>نسخ الكلام كما هو بدون ترجمة</span>
                    </div>
                </label>

                <div style={{ padding: '5px' }}>
                    <p style={{ fontSize: '0.75rem', marginBottom: 10, opacity: 0.8, textAlign: 'right' }} dir="rtl">ترجمة فورية إلى (Select up to 5):</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
                        {['ar', 'en', 'fr', 'es', 'de', 'tr', 'it', 'ru'].map(lang => (
                            <button
                                key={lang}
                                onClick={() => toggleLanguage(lang)}
                                style={{
                                    padding: '5px 12px',
                                    borderRadius: 20,
                                    fontSize: '0.75rem',
                                    border: '1px solid currentColor',
                                    background: targetLanguages.includes(lang) ? 'var(--accent-primary)' : 'transparent',
                                    color: targetLanguages.includes(lang) ? 'white' : 'var(--text-secondary)',
                                    opacity: targetLanguages.includes(lang) ? 1 : 0.6,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {lang.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
