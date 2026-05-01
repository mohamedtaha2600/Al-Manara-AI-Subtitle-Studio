import React from 'react';
import { Eye, EyeOff, Lock, Unlock, Volume2, VolumeX, Check } from 'lucide-react';
import { useProjectStore } from '@/store/useProjectStore';
import styles from '../VisTimeline.module.css';

interface TimelineTrackHeaderProps {
    trackId: string;
}

const TimelineTrackHeader: React.FC<TimelineTrackHeaderProps> = ({ trackId }) => {
    const {
        trackConfigs,
        toggleTrackLock,
        toggleTrackVisibility,
        setTrackConfig,
        selectedTrackId, // Keep for legacy/active check
        selectedTrackIds, // New multi-select
        setSelectedTrackId,
        toggleTrackSelection, // New action
        tracks // Get dynamic tracks
    } = useProjectStore();

    // Check if this track is in the selected set
    const isTargeted = selectedTrackIds?.includes(trackId) || selectedTrackId === trackId;

    // Resolve Config (Static or Dynamic)
    let config = trackConfigs[trackId];
    if (!config) {
        // Fallback: Find in dynamic tracks
        const track = tracks?.find(t => t.id === trackId);
        if (track) {
            config = {
                id: track.id,
                label: track.name,
                isHidden: !track.isVisible,
                isLocked: track.isLocked,
                isMuted: false,
                isSolo: false
            };
        } else {
            return null; // Truly not found
        }
    }

    const isSubTrack = trackId === 'subtitle-track';
    const isVidTrack = trackId === 'video-track';
    const isWaveTrack = trackId === 'waveform-track';

    const handleHeaderClick = (e: React.MouseEvent) => {
        // Multi-select Toggle Logic
        // Check if currently selected
        const isCurrentlySelected = selectedTrackIds?.includes(trackId);

        // 1. Toggle Selection State (Add/Remove from Set)
        toggleTrackSelection(trackId);

        // 2. Manage Active Focus (Singular ID)
        if (isCurrentlySelected) {
            // Deselecting: If it was the active focus, clear it to avoid "stuck" highlight
            if (selectedTrackId === trackId) {
                setSelectedTrackId(null);
            }
        } else {
            // Selecting: Set as active focus
            setSelectedTrackId(trackId);
        }
    };

    return (
        <div
            className={`${styles.trackHeader} ${isTargeted ? styles.selectedTrackHeader : ''}`}
            onClick={handleHeaderClick}
            style={{ cursor: 'pointer' }}
        >
            <div className={styles.trackInfo}>
                <div className={`${styles.trackCheckmark} ${styles.visible}`}>
                    <Check size={12} />
                </div>
                <span className={styles.trackName}>{config.label}</span>
            </div>

            <div className={styles.trackControls}>
                {/* Waveform specific: Mute / Solo */}
                {isWaveTrack && (
                    <>
                        <button
                            className={`${styles.iconBtn} ${config.isSolo ? styles.activeState : ''} ${styles.soloBtn}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setTrackConfig(trackId, { isSolo: !config.isSolo });
                            }}
                            title="Solo Audio"
                        >
                            S
                        </button>
                        <button
                            className={`${styles.iconBtn} ${config.isMuted ? styles.activeState : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setTrackConfig(trackId, { isMuted: !config.isMuted });
                            }}
                            title="Mute Audio"
                        >
                            {config.isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        </button>
                    </>
                )}

                {/* Lock Toggle */}
                <button
                    className={`${styles.iconBtn} ${config.isLocked ? styles.active : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleTrackLock(trackId);
                    }}
                    title={config.isLocked ? "Unlock Track" : "Lock Track"}
                >
                    {config.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>

                {/* Visibility Toggle */}
                <button
                    className={`${styles.iconBtn} ${config.isHidden ? styles.active : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleTrackVisibility(trackId);
                    }}
                    title={config.isHidden ? "Show Track" : "Hide Track"}
                >
                    {config.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
            </div>
        </div>
    );
};

export default React.memo(TimelineTrackHeader);
