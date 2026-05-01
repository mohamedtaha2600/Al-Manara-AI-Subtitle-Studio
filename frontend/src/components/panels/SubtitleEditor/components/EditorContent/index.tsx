'use client'

import React from 'react'
import { User } from 'lucide-react'
import { SubtitleSegment } from '@/store/useProjectStore'
import { EditorHeader } from './EditorHeader'
import { SegmentItem } from './SegmentItem'
import styles from './EditorContent.module.css'

interface EditorContentProps {
    segments: SubtitleSegment[]
    tracks: any[]
    activeTrackId: string | null
    currentSegment: number | null
    editingId: number | null
    editText: string
    editSpeaker: string
    searchQuery: string
    replaceText: string
    speakerStyles: Record<string, { color: string }>
    onSetActiveTrack: (id: string) => void
    onSearchChange: (value: string) => void
    onReplaceChange: (value: string) => void
    onReplace: () => void
    onReplaceAll: () => void
    onSegmentClick: (segment: SubtitleSegment) => void
    onEditStart: (segment: SubtitleSegment) => void
    onEditSave: () => void
    onEditCancel: () => void
    onDelete: (id: number) => void
    onTextChange: (text: string) => void
    onSpeakerChange: (speaker: string) => void
    formatTime: (seconds: number) => string
    renderHighlightedText: (text: string) => React.ReactNode
    editInputRef: React.RefObject<HTMLTextAreaElement>
}

export const EditorContent: React.FC<EditorContentProps> = ({
    segments,
    tracks,
    activeTrackId,
    currentSegment,
    editingId,
    editText,
    editSpeaker,
    searchQuery,
    replaceText,
    speakerStyles,
    onSetActiveTrack,
    onSearchChange,
    onReplaceChange,
    onReplace,
    onReplaceAll,
    onSegmentClick,
    onEditStart,
    onEditSave,
    onEditCancel,
    onDelete,
    onTextChange,
    onSpeakerChange,
    formatTime,
    renderHighlightedText,
    editInputRef
}) => {
    const listRef = React.useRef<HTMLDivElement>(null)
    const [activeSpeakerFilter, setActiveSpeakerFilter] = React.useState<string | null>(null)

    // Sync scroll with currentSegment (Timeline selection)
    React.useEffect(() => {
        if (currentSegment !== null && listRef.current) {
            const activeEl = listRef.current.querySelector(`[data-segment-id="${currentSegment}"]`)
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
        }
    }, [currentSegment])

    // Calculate unique speakers for filtering
    const uniqueSpeakers = React.useMemo(() => {
        const set = new Set<string>()
        segments.forEach(s => { if (s.speaker) set.add(s.speaker) })
        return Array.from(set).sort()
    }, [segments])

    // Filter segments by search AND speaker
    const filteredSegments = segments.filter(s => {
        const matchesSearch = s.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.speaker && s.speaker.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesSpeaker = !activeSpeakerFilter || s.speaker === activeSpeakerFilter

        return matchesSearch && matchesSpeaker
    })

    return (
        <div className={styles.container}>
            <EditorHeader
                tracks={tracks}
                activeTrackId={activeTrackId}
                searchQuery={searchQuery}
                replaceText={replaceText}
                matchCount={filteredSegments.length}
                totalCount={segments.length}
                uniqueSpeakers={uniqueSpeakers}
                activeSpeakerFilter={activeSpeakerFilter}
                speakerStyles={speakerStyles}
                onSetActiveTrack={onSetActiveTrack}
                onSearchChange={onSearchChange}
                onReplaceChange={onReplaceChange}
                onReplace={onReplace}
                onReplaceAll={onReplaceAll}
                onSpeakerFilterChange={setActiveSpeakerFilter}
            />

            <div className={styles.list} ref={listRef}>
                {filteredSegments.map((segment, index) => {
                    const prevSegment = index > 0 ? filteredSegments[index - 1] : null
                    const showSpeakerHeader = segment.speaker && (!prevSegment || prevSegment.speaker !== segment.speaker)

                    return (
                        <React.Fragment key={segment.id}>
                            {showSpeakerHeader && (
                                <div className={styles.speakerGroupHeader}>
                                    <User size={12} />
                                    <span>{segment.speaker}</span>
                                </div>
                            )}
                            <SegmentItem
                                segment={segment}
                                isActive={currentSegment === segment.id}
                                isEditing={editingId === segment.id}
                                editText={editText}
                                editSpeaker={editSpeaker}
                                speakerStyle={segment.speaker ? speakerStyles[segment.speaker] : undefined}
                                onSegmentClick={() => onSegmentClick(segment)}
                                onEditStart={() => onEditStart(segment)}
                                onEditSave={onEditSave}
                                onEditCancel={onEditCancel}
                                onDelete={() => onDelete(segment.id)}
                                onTextChange={onTextChange}
                                onSpeakerChange={onSpeakerChange}
                                formatTime={formatTime}
                                renderHighlightedText={renderHighlightedText}
                                editInputRef={editInputRef}
                            />
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    )
}
