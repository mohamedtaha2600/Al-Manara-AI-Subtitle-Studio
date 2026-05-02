'use client'

import React from 'react'
import { LayoutTemplate } from 'lucide-react'
import { PRESETS } from '../constants'
import { SectionWrapper } from './Shared/SectionWrapper'
import styles from './PresetsSection.module.css'

interface PresetsSectionProps {
    isActive: boolean
    currentStyle: any
    onToggle: (id: string) => void
    onSelectPreset: (preset: any) => void
    dir?: 'ltr' | 'rtl'
}

export const PresetsSection: React.FC<PresetsSectionProps> = ({
    isActive,
    currentStyle,
    onToggle,
    onSelectPreset,
    dir = 'ltr'
}) => {
    // ...
    const isRTL = dir === 'rtl'

    // Simple heuristic to check if a preset is "active"
    // We compare fontFamily and primaryColor as they are most distinctive
    const isPresetActive = (presetStyle: any) => {
        return presetStyle.fontFamily === currentStyle.fontFamily &&
            presetStyle.primaryColor === currentStyle.primaryColor &&
            presetStyle.animation === currentStyle.animation;
    }

    return (
        <SectionWrapper
            id="presets"
            title="أنماط جاهزة"
            icon={<LayoutTemplate size={18} />}
            isActive={isActive}
            onToggle={onToggle}
            theme="purple"
            dir={dir}
        >
            <div className={styles.presets}>
                {PRESETS.map((preset) => (
                    <button
                        key={preset.id}
                        className={`${styles.presetCard} ${isPresetActive(preset.style) ? styles.active : ''}`}
                        onClick={() => onSelectPreset(preset)}
                    >
                        <span className={styles.presetIcon}>{preset.icon}</span>
                        <span className={styles.presetName}>{preset.name}</span>
                    </button>
                ))}
            </div>
        </SectionWrapper>
    )
}
