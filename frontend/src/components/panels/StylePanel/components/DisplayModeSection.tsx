'use client'

import React from 'react'
import { Monitor, Scissors, Clock, Type, RefreshCw } from 'lucide-react'
import { DISPLAY_MODES } from '../constants'
import { SectionWrapper } from './Shared/SectionWrapper'
import styles from './DisplayModeSection.module.css'
import { useProjectStore } from '@/store/useProjectStore'

interface DisplayModeSectionProps {
    isActive: boolean
    style: any
    onToggle: (id: string) => void
    onSetStyle: (style: any) => void
    onRegenerate: (mode: any) => void
    dir?: 'ltr' | 'rtl'
}

export const DisplayModeSection: React.FC<DisplayModeSectionProps> = ({
    isActive,
    style,
    onToggle,
    onSetStyle,
    onRegenerate,
    dir = 'ltr'
}) => {
    // ... (logic remains same)
    const {
        segmentationSettings,
        setSegmentationSettings,
        regenerateSegments,
        segments
    } = useProjectStore()

    const handleModeChange = (modeId: string) => {
        onSetStyle({ displayMode: modeId })
        regenerateSegments(modeId as any)
    }

    const handleRegenerate = () => {
        regenerateSegments(style.displayMode || 'sentence')
    }

    return (
        <SectionWrapper
            id="display"
            title="وضع العرض والتقطيع"
            icon={<Monitor size={18} />}
            isActive={isActive}
            onToggle={onToggle}
            theme="blue"
            dir={dir}
        >
            <div className={styles.container}>
                {/* 1. Display Modes Grid */}
                <div className={styles.modeGrid}>
                    {DISPLAY_MODES.map((mode) => (
                        <button
                            key={mode.id}
                            className={`${styles.modeBtn} ${style.displayMode === mode.id ? styles.active : ''}`}
                            onClick={() => handleModeChange(mode.id)}
                        >
                            <span className={styles.modeName}>{mode.name}</span>
                        </button>
                    ))}
                </div>

                <div className={styles.divider} />

                {/* 2. Segmentation Algorithms (Integrated) */}
                <div className={styles.algorithms}>
                    <div className={styles.algoHeader}>
                        <Scissors size={14} />
                        <span>إعدادات التقطيع (Algorithms)</span>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.label}>
                            <Clock size={12} />
                            <span>حد الصمت / Silence (s)</span>
                        </div>
                        <input
                            type="number"
                            min="0.1"
                            max="2"
                            step="0.1"
                            value={segmentationSettings.silenceThreshold}
                            onChange={(e) => setSegmentationSettings({ silenceThreshold: parseFloat(e.target.value) })}
                            className={styles.numberInput}
                        />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.label}>
                            <Type size={12} />
                            <span>الكلمات في المقطع / Max Words</span>
                        </div>
                        <input
                            type="number"
                            min="1"
                            max="30"
                            value={segmentationSettings.maxWords}
                            onChange={(e) => setSegmentationSettings({ maxWords: parseInt(e.target.value) })}
                            className={styles.numberInput}
                        />
                    </div>

                    <button
                        className={styles.regenerateBtn}
                        onClick={handleRegenerate}
                        disabled={segments.length === 0}
                    >
                        <RefreshCw size={14} className={styles.spinIcon} />
                        <span>إعادة التقسيم - Regenerate</span>
                    </button>
                </div>

                <p className={styles.note}>
                    ⓘ يُطبق التقسيم بناءً على خوارزميات تحليل الصمت المحددة أعلاه.
                </p>
            </div>
        </SectionWrapper>
    )
}

