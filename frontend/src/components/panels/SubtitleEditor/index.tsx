'use client'

/**
 * Subtitle Editor Panel (Modular Version)
 * محرر الترجمات
 */

import { useState, useRef, useEffect } from 'react'
import { useProjectStore, SubtitleSegment } from '@/store/useProjectStore'
import { getApiUrl } from '@/utils/config'
import { useVADPreview } from '@/hooks/useVADPreview'
import { useTranscriptionPolling } from './hooks/useTranscriptionPolling'
import { filterSubtitleText } from '@/utils/textUtils'

// Components
import { EmptyState } from './components/EmptyState'
import { TranscriptionPrompt } from './components/TranscriptionPrompt'
import { TranscribingView } from './components/TranscribingView'
import { EditorContent } from './components/EditorContent'

export default function SubtitleEditor() {
    const {
        segments,
        currentSegment,
        setCurrentSegment,
        updateSegment,
        deleteSegment,
        style,
        addLog,
        videoFile,
        isTranscribing,
        progress,
        statusMessage,
        startTranscription,
        preferredModel,
        setSpeaker,
        applyStyleToSpeaker, // Added
        speakerStyles,
        tracks,
        activeTrackId,
        setActiveTrack,
        performanceMode,
        setSystemSetting,
        setCurrentTime,
        gpuEnabled,
        offlineMode,
        vadPreviewSettings,
        setVADPreviewSettings,
        vadSegments
    } = useProjectStore()

    // Hooks (Updated to include auto-detect)
    const { calculateAutoThreshold, isAnalyzing: isAnalyzingVAD } = useVADPreview()
    const { pollTranscriptionStatus } = useTranscriptionPolling()

    // Local States
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editText, setEditText] = useState('')
    const [editSpeaker, setEditSpeaker] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [replaceText, setReplaceText] = useState('')

    const settings = useProjectStore(state => state.transcriptionSettings)
    const setSettings = useProjectStore(state => state.setTranscriptionSettings)
    const editInputRef = useRef<HTMLTextAreaElement>(null)

    // Focus input when editing
    useEffect(() => {
        if (editingId !== null && editInputRef.current) {
            editInputRef.current.focus()
            editInputRef.current.select()
        }
    }, [editingId])

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = Math.floor(seconds % 60)
        const ms = Math.floor((seconds % 1) * 100)
        return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
    }

    const handleStartTranscription = async () => {
        if (!videoFile) return
        try {
            addLog('info', '🚀 جاري بدء الترجمة...')
            const response = await fetch(getApiUrl('transcribe'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file_id: videoFile.id,
                    language: 'auto',
                    model_size: preferredModel || 'medium',
                    target_languages: settings.targetLanguages,
                    include_source: settings.includeSource,
                    performance_mode: performanceMode || 'speed',
                    min_silence_ms: settings.minSilenceMs,
                    include_diacritics: settings.includeDiacritics,
                    include_punctuation: settings.includePunctuation,
                    max_words_per_segment: settings.maxWordsPerSegment,
                    use_gpu: gpuEnabled,
                    offline_mode: offlineMode,
                    // VAD Settings
                    vad_enabled: vadPreviewSettings?.enabled || false,
                    vad_threshold: vadPreviewSettings?.threshold || 0.5,
                    vad_segments: vadSegments, // Cleaned up reference
                    // Smart Prompting for Punctuation & Diacritics (Arabic-Centric)
                    initial_prompt: (settings.includePunctuation || settings.includeDiacritics)
                        ? (
                            (settings.includePunctuation ? "مرحباً بكم في الـمنارة. هذا مِثال على الترقيم، والنقاط، والـفواصل؛ هل أنت مستعد؟ نعم، بالتأكيد! " : "") +
                            (settings.includeDiacritics ? "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. كَيْفَ حَالُكُمْ؟ أَهْلًا وَسَهْلًا بِكُمْ فِى بَرْنامَجِنا. " : "")
                        ).trim()
                        : undefined
                }),
            })

            if (response.ok) {
                const data = await response.json()
                startTranscription(data.job_id)
                addLog('info', '⏳ جاري التحميل والتحليل...')
                pollTranscriptionStatus(data.job_id)
            } else {
                throw new Error('Failed to start transcription')
            }
        } catch (error) {
            addLog('error', `❌ خطأ: ${error}`)
        }
    }

    const handleEditStart = (segment: SubtitleSegment) => {
        setEditingId(segment.id)
        setEditText(segment.text)
        setEditSpeaker(segment.speaker || '') // Fixed BUG: Don't force 'Speaker 1'
    }

    const handleEditSave = () => {
        if (editingId !== null) {
            updateSegment(editingId, { text: editText })
            if (editSpeaker) {
                setSpeaker(editingId, editSpeaker)
            }
            addLog('success', 'تم تحديث النص')
            setEditingId(null)
        }
    }

    const handleEditCancel = () => {
        setEditingId(null)
        setEditText('')
    }

    const handleDelete = (id: number) => {
        if (confirm('هل تريد حذف هذا المقطع؟')) {
            deleteSegment(id)
            addLog('info', 'تم حذف المقطع')
        }
    }

    const handleSegmentClick = (segment: SubtitleSegment) => {
        setCurrentSegment(segment.id)
        setCurrentTime(segment.start)
    }

    const handleReplace = () => {
        if (!searchQuery) return
        const filtered = segments.filter(s => s.text.toLowerCase().includes(searchQuery.toLowerCase()))
        if (filtered.length === 0) return
        const target = filtered[0]
        const newText = target.text.replace(new RegExp(searchQuery, 'gi'), replaceText)
        updateSegment(target.id, { text: newText })
        addLog('success', `تم استبدال "${searchQuery}" بـ "${replaceText}" في مقطع واحد`)
    }

    const handleReplaceAll = () => {
        if (!searchQuery) return
        let count = 0
        segments.forEach(seg => {
            if (seg.text.toLowerCase().includes(searchQuery.toLowerCase())) {
                const newText = seg.text.replace(new RegExp(searchQuery, 'gi'), replaceText)
                updateSegment(seg.id, { text: newText })
                count++
            }
        })
        addLog('success', `تم استبدال الكلمات في ${count} مقطع`)
    }

    const renderHighlightedText = (text: string) => {
        const filteredText = filterSubtitleText(text, {
            showDiacritics: style.showDiacritics,
            showPunctuation: style.showPunctuation
        })
        if (!searchQuery) return filteredText
        const parts = filteredText.split(new RegExp(`(${searchQuery})`, 'gi'))
        return parts.map((part, i) =>
            part.toLowerCase() === searchQuery.toLowerCase() ?
                <span key={i} style={{ backgroundColor: '#22c55e40', color: '#fff', borderRadius: '2px', padding: '0 2px' }}>{part}</span> :
                part
        )
    }

    // Conditional Rendering
    if (segments.length === 0 && !isTranscribing) {
        return (
            <TranscriptionPrompt
                videoFileName={videoFile?.name || ''}
                settings={settings}
                vadPreviewSettings={vadPreviewSettings}
                gpuEnabled={gpuEnabled}
                offlineMode={offlineMode}
                performanceMode={performanceMode}
                isTranscribing={isTranscribing}
                onSetSettings={setSettings}
                onSetVADSettings={setVADPreviewSettings}
                onSetSystemSetting={setSystemSetting}
                onStartTranscription={handleStartTranscription}
                onAutoThreshold={calculateAutoThreshold}
                isAnalyzingVAD={isAnalyzingVAD}
            />
        )
    }

    if (isTranscribing) {
        return <TranscribingView statusMessage={statusMessage} progress={progress} />
    }

    return (
        <EditorContent
            segments={segments}
            tracks={tracks}
            activeTrackId={activeTrackId}
            currentSegment={currentSegment}
            editingId={editingId}
            editText={editText}
            editSpeaker={editSpeaker}
            searchQuery={searchQuery}
            replaceText={replaceText}
            speakerStyles={speakerStyles}
            onSetActiveTrack={setActiveTrack}
            onSearchChange={setSearchQuery}
            onReplaceChange={setReplaceText}
            onReplace={handleReplace}
            onReplaceAll={handleReplaceAll}
            onSegmentClick={handleSegmentClick}
            onEditStart={handleEditStart}
            onEditSave={handleEditSave}
            onEditCancel={handleEditCancel}
            onDelete={handleDelete}
            onTextChange={setEditText}
            onSpeakerChange={setEditSpeaker}
            formatTime={formatTime}
            renderHighlightedText={renderHighlightedText}
            editInputRef={editInputRef}
        />
    )
}
