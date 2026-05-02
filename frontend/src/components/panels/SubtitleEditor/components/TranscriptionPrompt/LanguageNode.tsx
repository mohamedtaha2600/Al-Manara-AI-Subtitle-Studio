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
            <div className={styles.controlGroup}>
                <label className={styles.smartToggle} style={{ border: 'none', background: 'rgba(255,255,255,0.05)' }}>
                    <div className={styles.toggleText}>
                        <span className={styles.mainLabel}>اللغة الأصلية للمقطع (Auto)</span>
                        <span className={styles.subLabel}>نسخ الكلام كما هو بدون ترجمة</span>
                    </div>
                    <input
                        type="checkbox"
                        checked={includeSource}
                        onChange={(e) => onUpdate({ includeSource: e.target.checked })}
                    />
                </label>
            </div>

            <div className={styles.controlGroup}>
                <div className={styles.groupHeader}>
                    <span>ترجمة فورية إلى</span>
                    <span style={{ fontSize: '0.6rem', opacity: 0.5, marginRight: 5 }}>(Select up to 5)</span>
                </div>
                <div className={styles.langGrid}>
                    {['ar', 'en', 'fr', 'es', 'de', 'tr', 'it', 'ru'].map(lang => (
                        <button
                            key={lang}
                            onClick={() => toggleLanguage(lang)}
                            className={`${styles.langBadge} ${targetLanguages.includes(lang) ? styles.langBadgeActive : ''}`}
                        >
                            {lang.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
