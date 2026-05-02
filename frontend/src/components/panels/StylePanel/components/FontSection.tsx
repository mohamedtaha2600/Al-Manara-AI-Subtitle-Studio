'use client'

import React from 'react'
import { Type } from 'lucide-react'
import { FONTS } from '../constants'
import { SectionWrapper } from './Shared/SectionWrapper'
import styles from './FontSection.module.css'

interface FontSectionProps {
    isActive: boolean
    style: any
    systemFonts: any[]
    onToggle: (id: string) => void
    onSetStyle: (style: any) => void
    onLoadSystemFonts: () => void
    dir?: 'ltr' | 'rtl'
}

export const FontSection: React.FC<FontSectionProps> = ({
    isActive,
    style,
    systemFonts,
    onToggle,
    onSetStyle,
    onLoadSystemFonts,
    dir = 'ltr'
}) => {
    return (
        <SectionWrapper
            id="font"
            title="الخط"
            icon={<Type size={18} />}
            isActive={isActive}
            onToggle={onToggle}
            theme="purple"
            dir={dir}
        >
            <div className={styles.sectionContent}>
                {/* 1. Font Family Selection */}
                <div className={styles.col}>
                    <label>نوع الخط</label>
                    <div className={styles.fontControls}>
                        <select
                            value={style.fontFamily}
                            onChange={(e) => onSetStyle({ fontFamily: e.target.value })}
                            className={styles.select}
                        >
                            <optgroup label="خطوط النظام المكتشفة">
                                {systemFonts.length > 0 ? (
                                    systemFonts.map((f: any) => (
                                        <option key={f.fullName} value={f.family} style={{ fontFamily: f.family }}>{f.fullName}</option>
                                    ))
                                ) : (
                                    <option disabled>اضغط "تحميل الخطوط" للكشف</option>
                                )}
                            </optgroup>
                            <optgroup label="خطوط أساسية">
                                {FONTS.map((font) => (
                                    <option key={font.name} value={font.name} style={{ fontFamily: font.name }}>{font.name}</option>
                                ))}
                            </optgroup>
                        </select>
                        <button
                            className={styles.iconBtn}
                            onClick={onLoadSystemFonts}
                            title="تحميل خطوط الجهاز"
                        >
                            🔄
                        </button>
                    </div>
                </div>

                {/* 2. Size Control */}
                <div className={styles.col}>
                    <label>الحجم</label>
                    <div className={styles.sliderRow}>
                        <span className={styles.sliderValue}>{style.fontSize}</span>
                        <input
                            type="range"
                            min={18}
                            max={72}
                            value={style.fontSize}
                            onChange={(e) => onSetStyle({ fontSize: parseInt(e.target.value) })}
                            className={styles.rangeInput}
                        />
                    </div>
                </div>

                {/* 3. Text Formatting Toggles (Compacted) */}
                <div className={styles.toggleRow}>
                    <button className={`${styles.toggleBtn} ${style.bold ? styles.active : ''}`} onClick={() => onSetStyle({ bold: !style.bold })}>B</button>
                    <button className={`${styles.toggleBtn} ${style.italic ? styles.active : ''}`} onClick={() => onSetStyle({ italic: !style.italic })}>I</button>
                    <button className={`${styles.toggleBtn} ${style.underline ? styles.active : ''}`} onClick={() => onSetStyle({ underline: !style.underline })}>U</button>
                </div>

                {/* 4. Spacing Control (Horizontal) */}
                <div className={styles.col}>
                    <label>التباعد</label>
                    <div className={styles.sliderRow}>
                        <span className={styles.sliderValue}>{style.letterSpacing}</span>
                        <input
                            type="range"
                            min={-2}
                            max={10}
                            value={style.letterSpacing}
                            onChange={(e) => onSetStyle({ letterSpacing: parseInt(e.target.value) })}
                            className={styles.rangeInput}
                        />
                    </div>
                </div>
            </div>
        </SectionWrapper>
    )
}
