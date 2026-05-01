'use client'

import React from 'react'
import { SubtitleSegment } from '@/store/useProjectStore'
import { EditIcon, DeleteIcon } from '../SubtitleIcons'
import styles from './SegmentItem.module.css'

interface SegmentItemProps {
    segment: SubtitleSegment
    isActive: boolean
    isEditing: boolean
    editText: string
    editSpeaker: string
    speakerStyle?: { color: string }
    onSegmentClick: () => void
    onEditStart: () => void
    onEditSave: () => void
    onEditCancel: () => void
    onDelete: () => void
    onTextChange: (text: string) => void
    onSpeakerChange: (speaker: string) => void
    renderHighlightedText: (text: string) => React.ReactNode
    formatTime: (seconds: number) => string
    editInputRef: React.RefObject<HTMLTextAreaElement>
}

export const SegmentItem: React.FC<SegmentItemProps> = ({
    segment,
    isActive,
    isEditing,
    editText,
    editSpeaker,
    speakerStyle,
    onSegmentClick,
    onEditStart,
    onEditSave,
    onEditCancel,
    onDelete,
    onTextChange,
    onSpeakerChange,
    renderHighlightedText,
    formatTime,
    editInputRef
}) => {
    return (
        <div
            className={`${styles.item} ${isActive ? styles.active : ''}`}
            onClick={onSegmentClick}
            data-segment-id={segment.id}
        >
            <div className={styles.timeBadges}>
                <span className={styles.timeBadge}>{formatTime(segment.start)}</span>
                <span className={styles.timeArrow}>→</span>
                <span className={styles.timeBadge}>{formatTime(segment.end)}</span>
            </div>

            {isEditing ? (
                <div className={styles.editMode}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                        <input
                            className={styles.speakerInput}
                            value={editSpeaker}
                            onChange={(e) => onSpeakerChange(e.target.value)}
                            placeholder="متحدث..."
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <textarea
                        ref={editInputRef}
                        value={editText}
                        onChange={(e) => onTextChange(e.target.value)}
                        className={styles.editInput}
                        rows={2}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                onEditSave()
                            }
                            if (e.key === 'Escape') onEditCancel()
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className={styles.editActions}>
                        <button className={styles.saveBtn} onClick={onEditSave}>✓</button>
                        <button className={styles.cancelBtn} onClick={onEditCancel}>✕</button>
                    </div>
                </div>
            ) : (
                <div className={styles.textContent}>
                    {segment.speaker && (
                        <span
                            className={styles.speakerBadge}
                            style={{ backgroundColor: speakerStyle?.color || 'var(--accent-primary)' }}
                            onClick={(e) => { e.stopPropagation(); onEditStart() }}
                            title="انقر للتعديل Click to edit"
                        >
                            {segment.speaker}
                        </span>
                    )}
                    <p className={styles.text}>{renderHighlightedText(segment.text)}</p>
                    <div className={styles.actions}>
                        <button
                            className={styles.actionBtn}
                            onClick={(e) => { e.stopPropagation(); onEditStart() }}
                            title="تعديل"
                        >
                            <EditIcon />
                        </button>
                        <button
                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            onClick={(e) => { e.stopPropagation(); onDelete() }}
                            title="حذف"
                        >
                            <DeleteIcon />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
