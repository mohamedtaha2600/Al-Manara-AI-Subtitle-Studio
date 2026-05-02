import React, { useState } from 'react'
import styles from './VideoPlayerOverlay.module.css'
import { SubtitleSegment, useProjectStore } from '@/store/useProjectStore'
import { filterSubtitleText } from '@/utils/textUtils'
import SubtitleInlineEditor from './SubtitleInlineEditor'

interface VideoPlayerOverlayProps {
    activeSubtitles: { trackId: string, segment: SubtitleSegment, style: any }[]
    currentTime: number
    onSubtitleMouseDown: (e: React.MouseEvent) => void
}

export default function VideoPlayerOverlay({
    activeSubtitles,
    currentTime,
    onSubtitleMouseDown
}: VideoPlayerOverlayProps) {
    const [editingInfo, setEditingInfo] = useState<{ trackId: string, segmentId: number } | null>(null)
    const { 
        updateSegment, 
        showGrid, 
        showSafeZones 
    } = useProjectStore()

    const handleDoubleClick = (e: React.MouseEvent, trackId: string, segmentId: number) => {
        e.stopPropagation()
        setEditingInfo({ trackId, segmentId })
    }

    const handleSave = (newText: string) => {
        if (editingInfo) {
            updateSegment(editingInfo.segmentId, { text: newText })
            setEditingInfo(null)
        }
    }

    const hexToRgba = (hex: string, opacity: number) => {
        if (!hex) return 'transparent'
        if (hex.startsWith('rgba')) return hex // Already rgba
        if (hex === 'transparent') return 'transparent'

        let c = hex.substring(1).split('')
        if (c.length === 3) c = [c[0], c[0], c[1], c[2], c[2]]
        const r = parseInt(c[0] + c[1], 16)
        const g = parseInt(c[2] + c[3], 16)
        const b = parseInt(c[4] + c[5], 16)

        return `rgba(${r},${g},${b},${opacity / 100})`
    }

    const renderSubtitleContent = (trackId: string, segment: SubtitleSegment, style: any) => {
        const isEditing = editingInfo?.trackId === trackId && editingInfo?.segmentId === segment.id

        if (isEditing) {
            return (
                <SubtitleInlineEditor
                    initialText={segment.text}
                    style={style}
                    onSave={handleSave}
                    onCancel={() => setEditingInfo(null)}
                />
            )
        }

        const filteredText = filterSubtitleText(segment.text, {
            showDiacritics: style.showDiacritics,
            showPunctuation: style.showPunctuation
        })

        return (
            <div onDoubleClick={(e) => handleDoubleClick(e, trackId, segment.id)}>
                <span
                    className={styles.subtitleText}
                    style={{
                        fontFamily: style.fontFamily,
                        fontSize: `${style.fontSize}px`,
                        color: style.primaryColor,
                        fontWeight: style.bold ? 'bold' : 'normal',
                        fontStyle: style.italic ? 'italic' : 'normal',
                        textShadow: style.outlineWidth > 0 ? `
                            ${style.outlineWidth}px ${style.outlineWidth}px 0 ${style.outlineColor},
                            -${style.outlineWidth}px ${style.outlineWidth}px 0 ${style.outlineColor},
                            ${style.outlineWidth}px -${style.outlineWidth}px 0 ${style.outlineColor},
                            -${style.outlineWidth}px -${style.outlineWidth}px 0 ${style.outlineColor}
                        ` : 'none',
                        direction: 'rtl', // Arabic support
                        backgroundColor: hexToRgba(style.backgroundColor, style.backgroundOpacity),
                        padding: `${style.backgroundPadding}px`,
                        borderRadius: `${style.borderRadius}px`,
                        backdropFilter: style.backgroundBlur > 0 ? `blur(${style.backgroundBlur}px)` : 'none',
                        boxShadow: style.boxShadow
                            ? `0 4px ${style.boxShadowBlur}px ${hexToRgba(style.boxShadowColor, style.boxShadowOpacity)}`
                            : 'none',
                        lineHeight: style.lineHeight || 1.4,
                        cursor: 'text'
                    }}
                >
                    {style.highlightCurrentWord && segment.words ? (
                        segment.words.map((word, idx) => {
                            const isActive = currentTime >= word.start && currentTime <= word.end
                            const wordText = filterSubtitleText(word.text, {
                                showDiacritics: style.showDiacritics,
                                showPunctuation: style.showPunctuation
                            })
                            return (
                                <span
                                    key={idx}
                                    style={{
                                        color: isActive ? style.highlightColor : 'inherit',
                                        transition: 'color 0.1s ease',
                                        display: 'inline-block',
                                        whiteSpace: 'pre'
                                    }}
                                >
                                    {wordText}{' '}
                                </span>
                            )
                        })
                    ) : (
                        filteredText
                    )}
                </span>
                {segment.speaker && (
                    <span className={styles.speakerLabel}>{segment.speaker}</span>
                )}
            </div>
        )
    }

    return (
        <div className={styles.subtitleLayer}>
            {/* 1. Professional Grid Overlay (Rule of Thirds) */}
            {showGrid && (
                <div className={styles.gridLayer}>
                    <div className={styles.gridLineH} style={{ top: '33.33%' }} />
                    <div className={styles.gridLineH} style={{ top: '66.66%' }} />
                    <div className={styles.gridLineV} style={{ left: '33.33%' }} />
                    <div className={styles.gridLineV} style={{ left: '66.66%' }} />
                    <div className={styles.centerMark} />
                </div>
            )}

            {/* 2. Professional Safe Zones (Title & Action Safe) */}
            {showSafeZones && (
                <div className={styles.safeZones}>
                    <div className={styles.actionSafe} title="Action Safe (90%)" />
                    <div className={styles.titleSafe} title="Title Safe (80%)" />
                </div>
            )}

            {/* 3. Subtitles */}
            {activeSubtitles.map((item) => {
                const { segment, style: trackStyle, trackId } = item
                // Compute merged style: segment overrides track
                const style = segment.style ? { ...trackStyle, ...segment.style } : trackStyle

                // Check if custom positioning
                const isCustom = style.position === 'custom' || (style.x !== undefined)

                // Render Custom Positioned
                if (isCustom) {
                    return (
                        <div
                            key={`${trackId}-${segment.id}`}
                            className={styles.subtitleOverlay}
                            style={{
                                position: 'absolute',
                                top: `${style.y}%`,
                                left: `${style.x}%`,
                                transform: 'translate(-50%, -50%)',
                                width: 'max-content',
                                cursor: 'move',
                                bottom: 'auto',
                                right: 'auto',
                                pointerEvents: 'auto'
                            }}
                            onMouseDown={onSubtitleMouseDown}
                        >
                            {renderSubtitleContent(trackId, segment, style)}
                        </div>
                    )
                }
                return null
            })}

            {/* Stacked Subtitles (Bottom/Top) */}
            {(() => {
                const stacked = activeSubtitles.filter(i =>
                    i.style.position !== 'custom' && i.style.x === undefined
                )
                if (stacked.length === 0) return null

                const topStack = stacked.filter(i => i.style.position === 'top')
                const bottomStack = stacked.filter(i => i.style.position !== 'top')

                return (
                    <>
                        {/* Top Stack */}
                        {topStack.length > 0 && (
                            <div className={styles.stackContainerTop}>
                                {topStack.map(({ segment, style, trackId }) => (
                                    <div key={`${trackId}-${segment.id}`} className={styles.stackedItem} onMouseDown={onSubtitleMouseDown}>
                                        {renderSubtitleContent(trackId, segment, style)}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Bottom Stack */}
                        {bottomStack.length > 0 && (
                            <div className={styles.stackContainerBottom}>
                                {bottomStack.map(({ segment, style, trackId }) => (
                                    <div key={`${trackId}-${segment.id}`} className={styles.stackedItem} onMouseDown={onSubtitleMouseDown}>
                                        {renderSubtitleContent(trackId, segment, style)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )
            })()}
        </div>
    )
}
