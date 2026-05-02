import React, { useMemo } from 'react';
import { Lock } from 'lucide-react';
import { TimelineAction as LibAction, TimelineRow } from '../../../../lib/timeline-engine/src/index';
import styles from '../VisTimeline.module.css';
import TimelineWaveform from './TimelineWaveform';
import { useProjectStore } from '@/store/useProjectStore';

interface TimelineActionProps {
    action: LibAction;
    row: TimelineRow;
    isHidden: boolean;
    isLocked: boolean;
}

const EMPTY_ARRAY: any[] = [];

const TimelineAction: React.FC<TimelineActionProps> = ({ action, row, isHidden, isLocked }) => {
    const timelineZoom = useProjectStore(state => state.timelineZoom);
    const multiSelectActionIds = useProjectStore(state => state.multiSelectActionIds);
    const tracks = useProjectStore(state => state.tracks);
    const activeTrackId = useProjectStore(state => state.activeTrackId);

    // Only fetch these for Waveform track
    const detectedSilence = useProjectStore(state =>
        row.id === 'waveform-track' ? state.detectedSilence : EMPTY_ARRAY
    );
    const segments = useProjectStore(state =>
        row.id === 'waveform-track' ? state.segments : EMPTY_ARRAY
    );
    // vadSegments removed from common list, will fetch in-line if needed

    // LINKED SELECTION LOGIC:
    // If a video clip is selected, its waveform should also highlight.
    // Video IDs: 'video-123', Waveform IDs: 'audio-waveform-seg-123'
    const isSelected = useMemo(() => {
        if (multiSelectActionIds.includes(action.id)) return true;

        // Link Waveform -> Video
        if (action.id.startsWith('waveform-')) {
            const linkedId = action.id.replace('waveform-', 'video-');
            if (multiSelectActionIds.includes(linkedId)) return true;
        }

        // Link Video -> Waveform
        if (action.id.startsWith('video-')) {
            const linkedId = action.id.replace('video-', 'waveform-');
            if (multiSelectActionIds.includes(linkedId)) return true;
        }

        return false;
    }, [action.id, multiSelectActionIds]);

    const trackColorStyle = useMemo(() => {
        if (row.id === 'subtitle-track' || row.id.startsWith('track-')) {
            const track = (tracks || []).find(t => t.id === row.id || (row.id === 'subtitle-track' && t.id === activeTrackId));
            const lang = track?.language || 'default';
            return {
                '--segment-bg': `var(--track-${lang}-bg, var(--track-default-bg))`,
                '--segment-border': `var(--track-${lang}-border, var(--track-default-border))`
            } as React.CSSProperties;
        }
        if (row.id === 'video-track') {
            return {
                '--segment-bg': 'var(--item-video-bg)',
                '--segment-border': 'var(--item-video-border)'
            } as React.CSSProperties;
        }
        if (row.id === 'waveform-track') {
            return {
                '--segment-bg': 'rgba(59, 130, 246, 0.2)', // Match Blue
                '--segment-border': '#3b82f6' // Match Blue
            } as React.CSSProperties;
        }
        return {};
    }, [row.id, tracks, activeTrackId]);

    const style: React.CSSProperties = useMemo(() => ({
        opacity: isHidden ? 0.5 : 1,
        filter: isHidden ? 'grayscale(100%) brightness(0.7)' : 'none',
        ...trackColorStyle,
    }), [isHidden, trackColorStyle]);

    const commonClasses = useMemo(() => `
        ${isSelected ? styles.selectedAction : ''} 
        ${!isLocked ? styles.hoverEffect : ''}
    `.trim(), [isSelected, isLocked]);

    const editingSegment = useProjectStore(state => state.editingSegment);
    const updateSegment = useProjectStore(state => state.updateSegment);
    const setEditingSegment = useProjectStore(state => state.setEditingSegment);
    const [localText, setLocalText] = React.useState(action.data?.text || '');

    const isEditing = editingSegment === action.data?.id && (row.id === 'subtitle-track' || row.id.startsWith('track-'));

    // Sync local text when action data changes (unless editing)
    React.useEffect(() => {
        if (!isEditing) {
            setLocalText(action.data?.text || '');
        }
    }, [action.data?.text, isEditing]);

    const handleSave = () => {
        if (action.data?.id !== undefined) {
            updateSegment(action.data.id, { text: localText });
            setEditingSegment(null);
        }
    };

    const handleCancel = () => {
        setLocalText(action.data?.text || '');
        setEditingSegment(null);
    };

    const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

    if (row.id === 'subtitle-track' || row.id.startsWith('track-')) {
        return (
            <div className={`${styles.customAction} ${commonClasses} ${isSelected ? styles.selectedSubtitle : ''}`} style={style}>
                {isEditing ? (
                    <textarea
                        autoFocus
                        className={styles.inlineEditor}
                        value={localText}
                        onChange={(e) => setLocalText(e.target.value)}
                        onBlur={handleSave}
                        dir={isArabic(localText) ? 'rtl' : 'ltr'}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSave();
                            } else if (e.key === 'Escape') {
                                handleCancel();
                            }
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span
                        className={styles.actionText}
                        title={action.data?.text}
                        dir={isArabic(action.data?.text || '') ? 'rtl' : 'ltr'}
                    >
                        {action.data?.text}
                    </span>
                )}
                {isLocked && <div className={styles.lockedOverlay}><Lock size={12} /></div>}
            </div>
        );
    }

    if (row.id === 'video-track') {
        return (
            <div className={`${styles.videoAction} ${isSelected ? styles.selectedAction : ''} ${commonClasses}`} style={style}>
                <span className={styles.actionText}>{action.data?.label || 'Video'}</span>
                {isLocked && <div className={styles.lockedOverlay}><Lock size={12} /></div>}
            </div>
        );
    }

    if (row.id === 'waveform-track') {
        return (
            <div className={`${styles.waveformActionWrapper} ${commonClasses}`} style={style}>
                <TimelineWaveform
                    videoUrl={action.data?.videoUrl}
                    pixelsPerSecond={timelineZoom * 160}
                    height={60}
                    scrollLeft={0} // Within action, we don't need scroll offset as lib handles it
                    isSelected={isSelected}
                    segments={segments}
                    silenceSegments={detectedSilence}
                    vadSegments={action.data?.vadSegments}
                    sourceStart={action.data?.sourceStart}
                    sourceEnd={action.data?.sourceEnd}
                />
            </div>
        );
    }

    return null;
};

export default React.memo(TimelineAction);
