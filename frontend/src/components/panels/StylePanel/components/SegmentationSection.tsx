'use client'

import React from 'react'
import { Scissors, Zap, Clock, Type } from 'lucide-react'
import { SectionWrapper } from './Shared/SectionWrapper'
import sharedStyles from './Shared/Shared.module.css'
import { useProjectStore } from '@/store/useProjectStore'

interface SegmentationSectionProps {
    isActive: boolean
    onToggle: (id: string) => void
}

export const SegmentationSection: React.FC<SegmentationSectionProps> = ({
    isActive,
    onToggle
}) => {
    const {
        segmentationSettings,
        setSegmentationSettings,
        regenerateSegments,
        segments
    } = useProjectStore()

    const handleApply = () => {
        if (confirm('هل أنت متأكد؟ سيتم إعادة تقسيم الترجمة بناءً على الإعدادات الجديدة.')) {
            regenerateSegments('sentence')
        }
    }

    return (
        <SectionWrapper
            id="segmentation"
            title="تقطيع الترجمة - Segmentation"
            icon={<Scissors size={16} />}
            isActive={isActive}
            onToggle={onToggle}
        >
            <div className={sharedStyles.content}>
                <div className={sharedStyles.row}>
                    <div className={sharedStyles.label}>
                        <Clock size={14} /> حد الصمت / Silence (s)
                    </div>
                    <div className={sharedStyles.control}>
                        <input
                            type="number"
                            min="0.1"
                            max="2"
                            step="0.1"
                            value={segmentationSettings.silenceThreshold}
                            onChange={(e) => setSegmentationSettings({ silenceThreshold: parseFloat(e.target.value) })}
                            className={sharedStyles.numberInput}
                        />
                    </div>
                </div>

                <div className={sharedStyles.row}>
                    <div className={sharedStyles.label}>
                        <Type size={14} /> الكلمات في المقطع / Max Words
                    </div>
                    <div className={sharedStyles.control}>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={segmentationSettings.maxWords}
                            onChange={(e) => setSegmentationSettings({ maxWords: parseInt(e.target.value) })}
                            className={sharedStyles.numberInput}
                        />
                    </div>
                </div>

                <button
                    className={sharedStyles.actionBtn}
                    onClick={handleApply}
                    disabled={segments.length === 0}
                    style={{ width: '100%', marginTop: '10px', height: '36px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                >
                    إعادة التقسيم - Regenerate
                </button>
            </div>
        </SectionWrapper>
    )
}
