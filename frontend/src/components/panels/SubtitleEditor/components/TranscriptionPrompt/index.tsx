'use client'

import React, { useState } from 'react'
import { MicIcon, PlayIcon } from '../SubtitleIcons'
import { LanguageNode } from './LanguageNode'
import { PrecisionNode } from './PrecisionNode'
import { EngineNode } from './EngineNode'
import styles from './TranscriptionPrompt.module.css'
import { SectionWrapper } from '../../../StylePanel/components/Shared/SectionWrapper'
import { Globe, Clock, Sliders } from 'lucide-react'

interface TranscriptionPromptProps {
    videoFileName: string
    settings: any
    vadPreviewSettings: any
    gpuEnabled: boolean
    offlineMode: boolean
    performanceMode: 'speed' | 'accuracy'
    isTranscribing: boolean
    onSetSettings: (settings: any) => void
    onSetVADSettings: (settings: any) => void
    onSetSystemSetting: (key: any, value: any) => void
    onStartTranscription: () => void
    onAutoThreshold?: () => number
    isAnalyzingVAD?: boolean
}

export const TranscriptionPrompt: React.FC<TranscriptionPromptProps> = ({
    videoFileName,
    settings,
    vadPreviewSettings,
    gpuEnabled,
    offlineMode,
    performanceMode,
    isTranscribing,
    onSetSettings,
    onSetVADSettings,
    onSetSystemSetting,
    onStartTranscription,
    onAutoThreshold,
    isAnalyzingVAD
}) => {
    const canTranscribe = settings.includeSource || settings.targetLanguages.length > 0
    const [activeSection, setActiveSection] = useState<string>('languages')

    const toggleSection = (id: string) => {
        setActiveSection(prev => prev === id ? '' : id)
    }

    return (
        <div className={styles.transcribePrompt}>
            {/* Header Area */}
            <div className={styles.headerArea}>
                <div className={styles.promptIcon}>
                    <MicIcon />
                </div>
                <h3>جاهز للتحليل والترجمة</h3>
                <p className={styles.fileName}>{videoFileName}</p>
            </div>

            {/* Main Sections */}
            <div className={styles.sectionsContainer}>

                {/* 1. Target Languages */}
                <SectionWrapper
                    id="languages"
                    title={<span dir="rtl">اختيار اللغات (Target Languages)</span>}
                    icon={<Globe size={18} />}
                    isActive={activeSection === 'languages'}
                    onToggle={toggleSection}
                    theme="blue"
                    dir="rtl"
                >
                    <LanguageNode
                        includeSource={settings.includeSource}
                        targetLanguages={settings.targetLanguages}
                        onUpdate={onSetSettings}
                    />
                </SectionWrapper>

                {/* 2. Timing & Precision */}
                <SectionWrapper
                    id="precision"
                    title={<span dir="rtl">توقيت وتقسيم الجمل & Precision</span>}
                    icon={<Clock size={18} />}
                    isActive={activeSection === 'precision'}
                    onToggle={toggleSection}
                    theme="purple"
                    dir="rtl"
                >
                    <PrecisionNode
                        minSilenceMs={settings.minSilenceMs}
                        maxWordsPerSegment={settings.maxWordsPerSegment}
                        vadSettings={vadPreviewSettings}
                        onUpdate={onSetSettings}
                        onUpdateVAD={onSetVADSettings}
                        onAutoThreshold={onAutoThreshold}
                        isAnalyzing={isAnalyzingVAD}
                    />
                </SectionWrapper>

                {/* 3. Engine Settings */}
                <SectionWrapper
                    id="engine"
                    title={<span dir="rtl">إعدادات المحرك المتقدمة (Native Engine)</span>}
                    icon={<Sliders size={18} />}
                    isActive={activeSection === 'engine'}
                    onToggle={toggleSection}
                    theme="slate"
                    dir="rtl"
                >
                    <EngineNode
                        includeDiacritics={settings.includeDiacritics}
                        includePunctuation={settings.includePunctuation}
                        gpuEnabled={gpuEnabled}
                        offlineMode={offlineMode}
                        performanceMode={performanceMode}
                        onUpdateSettings={onSetSettings}
                        onUpdateSystemSetting={onSetSystemSetting}
                    />
                </SectionWrapper>
            </div>

            {/* Footer / Action Area */}
            <div className={styles.footerArea}>
                <div className={styles.summaryStats}>
                    <span>🌐 {settings.targetLanguages.length > 0 ? `${settings.targetLanguages.length} لغات` : (settings.includeSource ? 'اللغة الأصلية' : 'لا يوجد')}</span>
                    <span>⏱️ {settings.minSilenceMs}ms</span>
                </div>

                <button
                    className={styles.transcribeBtn}
                    onClick={onStartTranscription}
                    disabled={!canTranscribe || isAnalyzingVAD || isTranscribing}
                >
                    <PlayIcon />
                    {!canTranscribe
                        ? 'اختر لغة واحدة على الأقل'
                        : isAnalyzingVAD
                            ? 'جاري تحليل موجة الصوت...'
                            : `تحليل وترجمة الآن (${settings.targetLanguages.length + (settings.includeSource ? 1 : 0)} مسارات)`
                    }
                </button>
            </div>
        </div>
    )
}
