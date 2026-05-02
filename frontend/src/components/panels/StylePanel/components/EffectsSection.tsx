'use client'

import React from 'react'
import { Image as ImageIcon, Droplet, Layers } from 'lucide-react'
import { SectionWrapper } from './Shared/SectionWrapper'
import styles from './EffectsSection.module.css'

interface EffectsSectionProps {
    isActive: boolean
    style: any
    onToggle: (id: string) => void
    onSetStyle: (style: any) => void
    dir?: 'ltr' | 'rtl'
}

export const EffectsSection: React.FC<EffectsSectionProps> = ({
    isActive,
    style,
    onToggle,
    onSetStyle,
    dir = 'ltr'
}) => {
    return (
        <SectionWrapper
            id="background"
            title="الخلفية والمؤثرات"
            icon={<ImageIcon size={18} />}
            isActive={isActive}
            onToggle={onToggle}
            dir={dir}
        >
            <div className={styles.sectionContent}>
                {/* Background Color */}
                <div className={styles.colorRow}>
                    <label>لون الخلفية</label>
                    <div className={styles.colorPicker}>
                        <input
                            type="color"
                            value={style.backgroundColor === 'transparent' ? '#000000' : style.backgroundColor}
                            onChange={(e) => onSetStyle({ backgroundColor: e.target.value })}
                        />
                        <div className={styles.presetColors}>
                            <button
                                className={styles.colorBtn}
                                style={{ background: 'transparent', position: 'relative', overflow: 'hidden' }}
                                onClick={() => onSetStyle({ backgroundColor: 'transparent' })}
                                title="شفاف"
                            >
                                <span style={{ position: 'absolute', inset: 0, background: 'repeating-conic-gradient(#333 0% 25%, #555 0% 50%) 50% / 4px 4px' }} />
                            </button>
                            <button className={styles.colorBtn} style={{ background: '#000000' }} onClick={() => onSetStyle({ backgroundColor: '#000000' })} />
                            <button className={styles.colorBtn} style={{ background: '#ffffff' }} onClick={() => onSetStyle({ backgroundColor: '#ffffff' })} />
                            <button className={styles.colorBtn} style={{ background: '#ff0000' }} onClick={() => onSetStyle({ backgroundColor: '#ff0000' })} />
                            <button className={styles.colorBtn} style={{ background: '#0000ff' }} onClick={() => onSetStyle({ backgroundColor: '#0000ff' })} />
                        </div>
                    </div>
                </div>

                {style.backgroundColor !== 'transparent' && (
                    <>
                        <div className={styles.row}>
                            <label>الشفافية</label>
                            <div className={styles.sliderRow}>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={style.backgroundOpacity}
                                    onChange={(e) => onSetStyle({ backgroundOpacity: parseInt(e.target.value) })}
                                    className={styles.rangeInput}
                                />
                                <span className={styles.sliderValue}>{style.backgroundOpacity}%</span>
                            </div>
                        </div>

                        <div className={styles.row}>
                            <label>هوامش داخلية</label>
                            <div className={styles.sliderRow}>
                                <input
                                    type="range"
                                    min={0}
                                    max={40}
                                    value={style.backgroundPadding}
                                    onChange={(e) => onSetStyle({ backgroundPadding: parseInt(e.target.value) })}
                                    className={styles.rangeInput}
                                />
                                <span className={styles.sliderValue}>{style.backgroundPadding}px</span>
                            </div>
                        </div>

                        <div className={styles.row}>
                            <label>زوايا مستديرة</label>
                            <div className={styles.sliderRow}>
                                <input
                                    type="range"
                                    min={0}
                                    max={50}
                                    value={style.borderRadius}
                                    onChange={(e) => onSetStyle({ borderRadius: parseInt(e.target.value) })}
                                    className={styles.rangeInput}
                                />
                                <span className={styles.sliderValue}>{style.borderRadius}px</span>
                            </div>
                        </div>
                    </>
                )}

                <div className={styles.separator} />

                <div className={styles.row}>
                    <label>
                        <Droplet size={14} /> <span>ضبابية (Blur)</span>
                    </label>
                    <div className={styles.sliderRow}>
                        <input
                            type="range"
                            min={0}
                            max={20}
                            value={style.backgroundBlur || 0}
                            onChange={(e) => onSetStyle({ backgroundBlur: parseInt(e.target.value) })}
                            className={styles.rangeInput}
                        />
                        <span className={styles.sliderValue}>{style.backgroundBlur || 0}px</span>
                    </div>
                </div>

                <div className={styles.toggleRow}>
                    <div className={styles.toggleLabel}>
                        <Layers size={14} /> <span>ظل النص (Shadow)</span>
                    </div>
                    <button
                        className={`${styles.toggleBtn} ${style.boxShadow ? styles.active : ''}`}
                        onClick={() => onSetStyle({ boxShadow: !style.boxShadow })}
                    >
                        {style.boxShadow ? 'نشط' : 'تفعيل'}
                    </button>
                </div>

                {style.boxShadow && (
                    <div className={styles.subSection}>
                        <div className={styles.colorRow}>
                            <label>لون الظل</label>
                            <div className={styles.colorPicker}>
                                <input
                                    type="color"
                                    value={style.boxShadowColor}
                                    onChange={(e) => onSetStyle({ boxShadowColor: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className={styles.row}>
                            <label>الشفافية</label>
                            <div className={styles.sliderRow}>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={style.boxShadowOpacity}
                                    onChange={(e) => onSetStyle({ boxShadowOpacity: parseInt(e.target.value) })}
                                    className={styles.rangeInput}
                                />
                                <span className={styles.sliderValue}>{style.boxShadowOpacity}%</span>
                            </div>
                        </div>
                        <div className={styles.row}>
                            <label>الانتشار (Blur)</label>
                            <div className={styles.sliderRow}>
                                <input
                                    type="range"
                                    min={0}
                                    max={50}
                                    value={style.boxShadowBlur}
                                    onChange={(e) => onSetStyle({ boxShadowBlur: parseInt(e.target.value) })}
                                    className={styles.rangeInput}
                                />
                                <span className={styles.sliderValue}>{style.boxShadowBlur}px</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SectionWrapper>
    )
}
