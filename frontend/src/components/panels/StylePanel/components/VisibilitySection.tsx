'use client'

import React from 'react'
import { Eye, Type, Hash } from 'lucide-react'
import { SectionWrapper } from './Shared/SectionWrapper'
import styles from './VisibilitySection.module.css'
import { SubtitleStyle } from '@/store/slices/types'

interface VisibilitySectionProps {
    isActive: boolean
    style: SubtitleStyle
    onToggle: (id: string) => void
    onSetStyle: (style: Partial<SubtitleStyle>) => void
}

export const VisibilitySection: React.FC<VisibilitySectionProps> = ({
    isActive,
    style,
    onToggle,
    onSetStyle
}) => {
    return (
        <SectionWrapper
            id="visibility"
            title="إعدادات الظهور - Text Visibility"
            icon={<Eye size={18} />}
            isActive={isActive}
            onToggle={onToggle}
            theme="orange"
        >
            <div className={styles.sectionContent}>
                <div className={styles.row}>
                    <div className={styles.label}>
                        <Type size={14} /> علامات الترقيم (Punctuation)
                    </div>
                    <label className={styles.switch}>
                        <input
                            type="checkbox"
                            checked={style.showPunctuation}
                            onChange={(e) => onSetStyle({ showPunctuation: e.target.checked })}
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>

                <div className={styles.row}>
                    <div className={styles.label}>
                        <Hash size={14} /> التشكيل (Diacritics)
                    </div>
                    <label className={styles.switch}>
                        <input
                            type="checkbox"
                            checked={style.showDiacritics}
                            onChange={(e) => onSetStyle({ showDiacritics: e.target.checked })}
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>

                <div className={styles.tip}>
                    <small>يتم تعديل الظهور فوراً دون إعادة التحليل</small>
                </div>
            </div>
        </SectionWrapper>
    )
}
