'use client'

import { SearchIcon, EditIcon } from '../SubtitleIcons'
import { User } from 'lucide-react'
import styles from './EditorHeader.module.css'

interface EditorHeaderProps {
    tracks: any[]
    activeTrackId: string | null
    searchQuery: string
    replaceText: string
    matchCount: number
    totalCount: number
    uniqueSpeakers: string[]
    activeSpeakerFilter: string | null
    speakerStyles: Record<string, { color: string }>
    onSetActiveTrack: (id: string) => void
    onSearchChange: (value: string) => void
    onReplaceChange: (value: string) => void
    onReplace: () => void
    onReplaceAll: () => void
    onSpeakerFilterChange: (speaker: string | null) => void
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
    tracks,
    activeTrackId,
    searchQuery,
    replaceText,
    matchCount,
    totalCount,
    uniqueSpeakers,
    activeSpeakerFilter,
    speakerStyles,
    onSetActiveTrack,
    onSearchChange,
    onReplaceChange,
    onReplace,
    onReplaceAll,
    onSpeakerFilterChange
}) => {
    return (
        <div className={styles.header} style={{ flexDirection: 'column', gap: 10, alignItems: 'stretch' }}>
            {/* Track Tabs */}
            {tracks.length > 0 && (
                <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 5, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    {tracks.map(track => (
                        <button
                            key={track.id}
                            onClick={() => onSetActiveTrack(track.id)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: activeTrackId === track.id ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                                color: activeTrackId === track.id ? 'white' : 'rgba(255,255,255,0.7)',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s'
                            }}
                        >
                            {track.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Speaker Filter Bar */}
            {uniqueSpeakers.length > 0 && (
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, alignItems: 'center' }}>
                    <div
                        onClick={() => onSpeakerFilterChange(null)}
                        style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            cursor: 'pointer',
                            background: activeSpeakerFilter === null ? 'rgba(255,255,255,0.2)' : 'transparent',
                            color: activeSpeakerFilter === null ? 'white' : 'var(--text-muted)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            flexShrink: 0
                        }}
                    >
                        الكل / All
                    </div>
                    {uniqueSpeakers.map(spk => (
                        <div
                            key={spk}
                            onClick={() => onSpeakerFilterChange(spk)}
                            style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '0.65rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                background: activeSpeakerFilter === spk ? (speakerStyles[spk]?.color || 'var(--accent-primary)') : 'transparent',
                                color: activeSpeakerFilter === spk ? 'white' : 'var(--text-muted)',
                                border: `1px solid ${speakerStyles[spk]?.color || 'rgba(255,255,255,0.1)'}`,
                                opacity: activeSpeakerFilter === spk ? 1 : 0.7,
                                flexShrink: 0
                            }}
                        >
                            <User size={10} />
                            {spk}
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <div className={styles.searchBox}>
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="بحث / Find..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>

                    {/* Replace Interface */}
                    {searchQuery && (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '0 4px', animation: 'fadeIn 0.2s' }}>
                            <div className={styles.searchBox} style={{ padding: '2px 8px', flex: 1 }}>
                                <EditIcon />
                                <input
                                    type="text"
                                    placeholder="استبدال بـ / Replace with..."
                                    value={replaceText}
                                    onChange={(e) => onReplaceChange(e.target.value)}
                                    style={{ fontSize: '0.7rem' }}
                                />
                            </div>
                            <button onClick={onReplace} className={styles.replaceBtn} style={{ fontSize: '0.7rem', padding: '4px 8px' }}>Replace</button>
                            <button onClick={onReplaceAll} className={styles.replaceBtn} style={{ fontSize: '0.7rem', padding: '4px 8px' }}>All</button>
                        </div>
                    )}
                </div>
                <div className={styles.stats}>
                    {searchQuery ? `${matchCount}/` : ''}{totalCount}
                </div>
            </div>
        </div>
    )
}
