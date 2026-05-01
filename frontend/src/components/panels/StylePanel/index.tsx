'use client'

/**
 * Advanced Style Panel (Modular Version)
 * لوحة التنسيق المتقدمة
 */

import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import styles from './StylePanel.module.css'

// Hooks
import { useFontManager } from './hooks/useFontManager'

// Components
import { LivePreview } from './components/LivePreview'
import { PresetsSection } from './components/PresetsSection'
import { DisplayModeSection } from './components/DisplayModeSection'
import { FontSection } from './components/FontSection'
import { ColorsSection } from './components/ColorsSection'
import { EffectsSection } from './components/EffectsSection'
import { AnimationSection } from './components/AnimationSection'
import { PositionSection } from './components/PositionSection'
import { VisibilitySection } from './components/VisibilitySection'
import { SegmentationSection } from './components/SegmentationSection'
import { ChevronUp, Check, Layers, UserCheck, User } from 'lucide-react'

export default function StylePanel() {
    const {
        style,
        setStyle,
        applyStyleToAll,
        segments,
        regenerateSegments,
        tracks,
        activeTrackId,
        selectedTrackIds,
        updateTrackStyle,
        applyStyleToSpeaker // Added
    } = useProjectStore()

    const [activeSection, setActiveSection] = useState<string | null>('display') // Default to Display
    const { systemFonts, loadSystemFonts } = useFontManager()

    // Dirty state management (Simple version: if style changes, we assume it's dirty relative to others)
    const [isDirty, setIsDirty] = useState(false)
    const [applyScope, setApplyScope] = useState<'all' | 'track' | 'selected' | 'speaker'>('track')
    const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null)
    const [showScopeMenu, setShowScopeMenu] = useState(false)

    // Calculate unique speakers
    const uniqueSpeakers = Array.from(new Set(segments.map(s => s.speaker).filter(Boolean))) as string[]

    const handleToggleSection = (section: string) => {
        const next = activeSection === section ? null : section
        setActiveSection(next)

        // Auto-scroll to show content (Smart Node behavior)
        if (next) {
            setTimeout(() => {
                const el = document.getElementById(`section-${next}`)
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
            }, 300) // Delay for animation
        }
    }

    const handleSelectPreset = (preset: any) => {
        setStyle(preset.style)
        setIsDirty(true)
    }

    const handleStyleChange = (newStyle: any) => {
        setStyle(newStyle)
        setIsDirty(true)
    }

    const handleApply = () => {
        if (applyScope === 'all') {
            applyStyleToAll()
        } else if (applyScope === 'track') {
            if (activeTrackId) updateTrackStyle(activeTrackId, style)
        } else if (applyScope === 'selected') {
            // Apply to active + selected
            const targets = new Set([...(selectedTrackIds || []), activeTrackId].filter(Boolean))
            targets.forEach(tid => updateTrackStyle(tid as string, style))
        } else if (applyScope === 'speaker' && selectedSpeaker) {
            applyStyleToSpeaker(selectedSpeaker, style)
        }
        setIsDirty(false)
        setShowScopeMenu(false)
    }

    // Resolve target label
    const getTargetLabel = () => {
        if (applyScope === 'all') return `الكل (${tracks.length})`
        if (applyScope === 'track') return 'المسار الحالي'
        if (applyScope === 'selected') return `المحددة (${(selectedTrackIds?.length || 0) + (activeTrackId ? 1 : 0)})`
        if (applyScope === 'speaker') return selectedSpeaker ? `المتحدث: ${selectedSpeaker}` : 'اختر متحدثاً'
        return 'تطبيق'
    }

    return (
        <div className={styles.container}>
            {/* Live Preview (Instant) */}
            <div className={styles.previewWrapper}>
                <LivePreview style={style} />
            </div>

            <div className={styles.scrollContent}>
                {/* 1. Presets (Quick Start) */}
                <PresetsSection
                    isActive={activeSection === 'presets'}
                    currentStyle={style}
                    onToggle={handleToggleSection}
                    onSelectPreset={handleSelectPreset}
                />

                {/* 2. Display Mode (Global/Structure) */}
                <DisplayModeSection
                    isActive={activeSection === 'display'}
                    style={style}
                    onToggle={handleToggleSection}
                    onSetStyle={handleStyleChange}
                    onRegenerate={regenerateSegments}
                />

                {/* 3. Core Typography */}
                <FontSection
                    isActive={activeSection === 'font'}
                    style={style}
                    systemFonts={systemFonts}
                    onToggle={handleToggleSection}
                    onSetStyle={handleStyleChange}
                    onLoadSystemFonts={loadSystemFonts}
                />

                {/* 4. Colors */}
                <ColorsSection
                    isActive={activeSection === 'colors'}
                    style={style}
                    onToggle={handleToggleSection}
                    onSetStyle={handleStyleChange}
                />

                {/* 5. Background & Effects */}
                <EffectsSection
                    isActive={activeSection === 'background'}
                    style={style}
                    onToggle={handleToggleSection}
                    onSetStyle={handleStyleChange}
                />

                {/* 6. Position */}
                <PositionSection
                    isActive={activeSection === 'position'}
                    style={style}
                    onToggle={handleToggleSection}
                    onSetStyle={handleStyleChange}
                />

                {/* 7. Animation */}
                <AnimationSection
                    isActive={activeSection === 'animation'}
                    style={style}
                    onToggle={handleToggleSection}
                    onSetStyle={handleStyleChange}
                />

                {/* 8. Visibility */}
                <VisibilitySection
                    isActive={activeSection === 'visibility'}
                    style={style}
                    onToggle={handleToggleSection}
                    onSetStyle={handleStyleChange}
                />
            </div>

            {/* Application Footer */}
            <div className={styles.applyFooter}>
                <div className={styles.scopeSelector}>
                    {applyScope === 'speaker' && uniqueSpeakers.length > 0 && (
                        <div className={styles.speakerQuickSelect}>
                            <select
                                value={selectedSpeaker || ''}
                                onChange={(e) => setSelectedSpeaker(e.target.value)}
                                className={styles.speakerSelect}
                            >
                                <option value="" disabled>اختر متحدثاً...</option>
                                {uniqueSpeakers.map(spk => (
                                    <option key={spk} value={spk}>{spk}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        className={styles.scopeTrigger}
                        onClick={() => setShowScopeMenu(!showScopeMenu)}
                    >
                        <span className={styles.scopeLabel}>تطبيق على: {getTargetLabel()}</span>
                        <ChevronUp size={14} />
                    </button>

                    {showScopeMenu && (
                        <div className={styles.scopeMenu}>
                            <div
                                className={`${styles.scopeItem} ${applyScope === 'track' ? styles.active : ''}`}
                                onClick={() => { setApplyScope('track'); setShowScopeMenu(false); }}
                            >
                                <UserCheck size={14} /> المسار الحالي
                            </div>
                            <div
                                className={`${styles.scopeItem} ${applyScope === 'speaker' ? styles.active : ''}`}
                                onClick={() => { setApplyScope('speaker'); setShowScopeMenu(false); if (!selectedSpeaker && uniqueSpeakers.length > 0) setSelectedSpeaker(uniqueSpeakers[0]) }}
                            >
                                <User size={14} /> متحدث معين
                            </div>
                            <div
                                className={`${styles.scopeItem} ${applyScope === 'selected' ? styles.active : ''}`}
                                onClick={() => { setApplyScope('selected'); setShowScopeMenu(false); }}
                            >
                                <Layers size={14} /> المسارات المحددة
                            </div>
                            <div
                                className={`${styles.scopeItem} ${applyScope === 'all' ? styles.active : ''}`}
                                onClick={() => { setApplyScope('all'); setShowScopeMenu(false); }}
                            >
                                <Check size={14} /> كل المسارات
                            </div>
                        </div>
                    )}
                </div>

                <button
                    className={`${styles.applyBtn} ${isDirty ? styles.dirty : ''}`}
                    onClick={handleApply}
                    disabled={(!isDirty && segments.length === 0) || (applyScope === 'speaker' && !selectedSpeaker)}
                    title="Apply changes to selected scope"
                >
                    <Check size={18} />
                    <span>تطبيق</span>
                </button>
            </div>
        </div>
    )
}
