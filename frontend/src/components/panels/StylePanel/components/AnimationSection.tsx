'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'
import { ANIMATIONS } from '../constants'
import { SectionWrapper } from './Shared/SectionWrapper'
import styles from './AnimationSection.module.css'

interface AnimationSectionProps {
    isActive: boolean
    style: any
    onToggle: (id: string) => void
    onSetStyle: (style: any) => void
    dir?: 'ltr' | 'rtl'
}

export const AnimationSection: React.FC<AnimationSectionProps> = ({
    isActive,
    style,
    onToggle,
    onSetStyle,
    dir = 'ltr'
}) => {
    return (
        <SectionWrapper
            id="animation"
            title="الحركة"
            icon={<Sparkles size={18} />}
            isActive={isActive}
            onToggle={onToggle}
            dir={dir}
        >
            <div className={styles.sectionContent}>
                <div className={styles.animationGrid}>
                    {ANIMATIONS.map((anim) => (
                        <button
                            key={anim.id}
                            className={`${styles.animBtn} ${style.animation === anim.id ? styles.active : ''}`}
                            onClick={() => onSetStyle({ animation: anim.id })}
                        >
                            <span>{anim.icon}</span>
                            <span>{anim.name}</span>
                        </button>
                    ))}
                </div>

                {style.animation !== 'none' && (
                    <div className={styles.row}>
                        <label>مدة الحركة</label>
                        <div className={styles.sliderRow}>
                            <input type="range" min={100} max={1000} step={50} value={style.animationDuration} onChange={(e) => onSetStyle({ animationDuration: parseInt(e.target.value) })} className={styles.rangeInput} />
                            <span className={styles.sliderValue}>{style.animationDuration}ms</span>
                        </div>
                    </div>
                )}

                {/* Karaoke / Highlight Active Word */}
                <div className={styles.row}>
                    <label>تسليط الضوء</label>
                    <button
                        className={`${styles.toggleBtn} ${style.highlightCurrentWord ? styles.active : ''}`}
                        onClick={() => onSetStyle({ highlightCurrentWord: !style.highlightCurrentWord })}
                    >
                        {style.highlightCurrentWord ? 'التسليط مفعل' : 'تفعيل التسليط'}
                    </button>
                </div>

                {style.highlightCurrentWord && (
                    <div className={styles.colorRow}>
                        <label>لون الكلمة النشطة</label>
                        <div className={styles.colorPicker}>
                            <input
                                type="color"
                                value={style.highlightColor}
                                onChange={(e) => onSetStyle({ highlightColor: e.target.value })}
                            />
                            <input
                                type="text"
                                value={style.highlightColor}
                                onChange={(e) => onSetStyle({ highlightColor: e.target.value })}
                                className={styles.colorText}
                            />
                        </div>
                    </div>
                )}
            </div>
        </SectionWrapper>
    )
}
