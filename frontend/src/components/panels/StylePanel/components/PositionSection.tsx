'use client'

import React from 'react'
import { Layout, ArrowUp, Square, ArrowDown, AlignRight, AlignCenter, AlignLeft } from 'lucide-react'
import { SectionWrapper } from './Shared/SectionWrapper'
import styles from './PositionSection.module.css'

interface PositionSectionProps {
    isActive: boolean
    style: any
    onToggle: (id: string) => void
    onSetStyle: (style: any) => void
    dir?: 'ltr' | 'rtl'
}

export const PositionSection: React.FC<PositionSectionProps> = ({
    isActive,
    style,
    onToggle,
    onSetStyle,
    dir = 'ltr'
}) => {
    return (
        <SectionWrapper
            id="position"
            title="الموضع"
            icon={<Layout size={18} />}
            isActive={isActive}
            onToggle={onToggle}
            dir={dir}
        >
            <div className={styles.sectionContent}>
                <div className={styles.positionGrid}>
                    <button className={`${styles.posBtn} ${style.position === 'top' ? styles.active : ''}`} onClick={() => onSetStyle({ position: 'top', y: style.y || 0 })}>
                        <ArrowUp size={18} /> أعلى
                    </button>
                    <button className={`${styles.posBtn} ${style.position === 'center' ? styles.active : ''}`} onClick={() => onSetStyle({ position: 'center', x: 0, y: 0 })}>
                        <Square size={18} /> وسط
                    </button>
                    <button className={`${styles.posBtn} ${style.position === 'bottom' ? styles.active : ''}`} onClick={() => onSetStyle({ position: 'bottom', y: style.y || 0 })}>
                        <ArrowDown size={18} /> أسفل
                    </button>
                </div>

                {/* Advanced Position Sliders */}
                <div className={styles.row}>
                    <label>أفقي (X)</label>
                    <div className={styles.sliderRow}>
                        <input
                            type="range"
                            min={-50}
                            max={50}
                            value={style.marginH || 0}
                            onChange={(e) => onSetStyle({ marginH: parseInt(e.target.value) })}
                            className={styles.rangeInput}
                        />
                        <span className={styles.sliderValue}>{style.marginH}</span>
                    </div>
                </div>

                <div className={styles.row}>
                    <label>رأسي (Y)</label>
                    <div className={styles.sliderRow}>
                        <input
                            type="range"
                            min={-50}
                            max={50}
                            value={style.marginV || 0}
                            onChange={(e) => onSetStyle({ marginV: parseInt(e.target.value) })}
                            className={styles.rangeInput}
                        />
                        <span className={styles.sliderValue}>{style.marginV}</span>
                    </div>
                </div>

                <div className={styles.alignRow}>
                    <span>محاذاة النص:</span>
                    <div className={styles.alignBtns}>
                        <button className={`${styles.alignBtn} ${style.textAlign === 'right' ? styles.active : ''}`} onClick={() => onSetStyle({ textAlign: 'right' })}><AlignRight size={16} /></button>
                        <button className={`${styles.alignBtn} ${style.textAlign === 'center' ? styles.active : ''}`} onClick={() => onSetStyle({ textAlign: 'center' })}><AlignCenter size={16} /></button>
                        <button className={`${styles.alignBtn} ${style.textAlign === 'left' ? styles.active : ''}`} onClick={() => onSetStyle({ textAlign: 'left' })}><AlignLeft size={16} /></button>
                    </div>
                </div>
            </div>
        </SectionWrapper>
    )
}
