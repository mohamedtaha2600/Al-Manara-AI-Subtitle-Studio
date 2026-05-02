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
        selectedTrackId, 
        setSelectedTrackId,
        setActiveTrack,
        tracks,
        activePanel // Added to determine color
    } = useProjectStore();

    // Check if this track is the ACTIVE one
    const isTargeted = selectedTrackId === trackId;

    // Resolve Config (Static or Dynamic)
    let config = trackConfigs[trackId];
    if (!config) {
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
            return null;
        }
    }

    const isWaveTrack = trackId === 'waveform-track';

    const handleHeaderClick = (e: React.MouseEvent) => {
        setSelectedTrackId(trackId);
        setActiveTrack(trackId);
    };

    // Determine Lock Active Class
    const getLockActiveClass = () => {
        if (!config.isLocked) return '';
        return activePanel === 'silence' ? styles.lockActiveSilence : styles.lockActiveSubtitle;
    };

    return (
        <div
            className={`${styles.trackHeader} ${isTargeted ? styles.selectedTrackHeader : ''}`}
            onClick={handleHeaderClick}
            style={{ cursor: 'pointer' }}
        >
            <div className={styles.trackInfo}>
                <div className={`${styles.trackCheckmark} ${isTargeted ? styles.visible : ''}`}>
                    <Check size={12} />
                </div>
                <span className={styles.trackName}>{config.label}</span>
            </div>

            <div className={styles.trackControls}>
                {/* Waveform specific: Mute / Solo */}
                {isWaveTrack && (
                    <>
                        <button
                            className={`${styles.iconBtn} ${config.isSolo ? styles.soloActive : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setTrackConfig(trackId, { isSolo: !config.isSolo });
                            }}
                            title="Solo Audio"
                        >
                            S
                        </button>
                        <button
                            className={`${styles.iconBtn} ${config.isMuted ? styles.muteActive : ''}`}
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
                    className={`${styles.iconBtn} ${getLockActiveClass()}`}
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
                    className={`${styles.iconBtn} ${config.isHidden ? styles.eyeDisabled : ''}`}
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
