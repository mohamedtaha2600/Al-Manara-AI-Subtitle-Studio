'use client'

import React from 'react'
import { Palette } from 'lucide-react'
import { SectionWrapper } from './Shared/SectionWrapper'
import styles from './ColorsSection.module.css'

interface ColorsSectionProps {
    isActive: boolean
    style: any
    onToggle: (id: string) => void
    onSetStyle: (style: any) => void
}

export const ColorsSection: React.FC<ColorsSectionProps> = ({
    isActive,
    style,
    onToggle,
    onSetStyle
}) => {
    return (
        <SectionWrapper
            id="colors"
            title="الألوان"
            icon={<Palette size={18} />}
            isActive={isActive}
            onToggle={onToggle}
            theme="pink"
        >
            <div className={styles.sectionContent}>
                <div className={styles.colorRow}>
                    <label>لون النص</label>
                    <div className={styles.colorPicker}>
                        <input type="color" value={style.primaryColor} onChange={(e) => onSetStyle({ primaryColor: e.target.value })} />
                        <input type="text" value={style.primaryColor} onChange={(e) => onSetStyle({ primaryColor: e.target.value })} className={styles.colorText} />
                    </div>
                </div>

                <div className={styles.colorRow}>
                    <label>لون الإطار</label>
                    <div className={styles.colorPicker}>
                        <input type="color" value={style.outlineColor} onChange={(e) => onSetStyle({ outlineColor: e.target.value })} />
                        <input type="text" value={style.outlineColor} onChange={(e) => onSetStyle({ outlineColor: e.target.value })} className={styles.colorText} />
                    </div>
                </div>

                <div className={styles.row}>
                    <label>سمك الإطار</label>
                    <div className={styles.sliderRow}>
                        <input type="range" min={0} max={8} value={style.outlineWidth} onChange={(e) => onSetStyle({ outlineWidth: parseInt(e.target.value) })} className={styles.rangeInput} />
                        <span className={styles.sliderValue}>{style.outlineWidth}</span>
                    </div>
                </div>

                <div className={styles.row}>
                    <label>قوة الظل</label>
                    <div className={styles.sliderRow}>
                        <input type="range" min={0} max={10} value={style.shadowBlur} onChange={(e) => onSetStyle({ shadowBlur: parseInt(e.target.value) })} className={styles.rangeInput} />
                        <span className={styles.sliderValue}>{style.shadowBlur}</span>
                    </div>
                </div>
            </div>
        </SectionWrapper>
    )
}
