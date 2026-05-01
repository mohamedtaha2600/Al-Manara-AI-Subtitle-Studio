import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createVideoSlice, VideoSlice } from './slices/videoSlice'
import { createTrackSlice, TrackSlice } from './slices/trackSlice'
import { createSubtitleSlice, SubtitleSlice } from './slices/subtitleSlice'
import { createTranscriptionSlice, TranscriptionSlice } from './slices/transcriptionSlice'
import { createSettingsSlice, SettingsSlice } from './slices/settingsSlice'
import { createUISlice, UISlice } from './slices/uiSlice'
import { createSilenceSlice, SilenceSlice } from './slices/silenceSlice'
import { createVideoEditingSlice, VideoEditingSlice } from './slices/videoEditingSlice'
import { createRecentSlice, RecentSlice } from './slices/recentSlice'
import { SubtitleSegment, SubtitleStyle, VideoFile, LogMessage, Word, SubtitleTrack } from './slices/types'

// Export types for consumers
export type { SubtitleSegment, SubtitleStyle, VideoFile, LogMessage, Word, SubtitleTrack }

// Combined State
interface ProjectState extends
    VideoSlice,
    TrackSlice,
    SubtitleSlice,
    TranscriptionSlice,
    SettingsSlice,
    UISlice,
    SilenceSlice,
    VideoEditingSlice,
    RecentSlice {
    batchMoveItems: (videoSegments?: any[], subtitleUpdates?: { id: number; updates: any }[], ghosts?: any) => void
    reset: () => void
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set, get, api) => ({
            ...createVideoSlice(set, get, api),
            ...createTrackSlice(set, get, api),
            ...createSubtitleSlice(set, get, api),
            ...createTranscriptionSlice(set, get, api),
            ...createSettingsSlice(set, get, api),
            ...createUISlice(set, get, api),
            ...createSilenceSlice(set, get, api),
            ...createVideoEditingSlice(set, get, api),
            ...createRecentSlice(set, get, api),

            // Overrides or Combined Actions

            finishTranscription: (result: any) => {
                const segments = Array.isArray(result) ? result : (result.segments || [])
                const rawTracks = result.tracks || []

                // 1. Reset transcription state
                set({
                    isTranscribing: false,
                    progress: 100,
                    statusMessage: 'تم النسخ بنجاح!',
                    jobId: null
                })

                // 2. Set segments and generate speaker colors
                const speakerStyles: Record<string, { name: string; color: string }> = {}
                const colors = [
                    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
                    '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
                    '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e'
                ]

                let colorIdx = 0
                segments.forEach((seg: SubtitleSegment) => {
                    if (seg.speaker && !speakerStyles[seg.speaker]) {
                        speakerStyles[seg.speaker] = {
                            name: seg.speaker,
                            color: colors[colorIdx % colors.length]
                        }
                        colorIdx++
                    }
                })

                // 3. Process Tracks
                let finalTracks: SubtitleTrack[] = []

                if (rawTracks.length > 0) {
                    finalTracks = rawTracks.map((t: any) => ({
                        id: t.id,
                        name: t.name || t.id,
                        language: t.language || 'auto',
                        segments: t.segments,
                        style: { ...get().style },
                        isVisible: true,
                        isLocked: false
                    }))
                } else {
                    finalTracks = [{
                        id: 'track-original',
                        name: 'Original',
                        language: 'auto',
                        segments: segments,
                        style: { ...get().style },
                        isVisible: true,
                        isLocked: false
                    }]
                }

                const translationTracks = finalTracks.filter((t: SubtitleTrack) => t.id.includes('track-ar') || t.id.includes('translation'));
                const activeTrack = translationTracks.length > 0 ? translationTracks[0] : finalTracks[0];
                const activeSegments = activeTrack?.segments || segments;

                // AUTO-SELECT LOGIC: Select ALL translation tracks by default
                const initialSelectedIds = translationTracks.length > 0
                    ? translationTracks.map(t => t.id)
                    : (activeTrack ? [activeTrack.id] : []);

                set({
                    segments: activeSegments,
                    originalSegments: activeSegments,
                    speakerStyles,
                    tracks: finalTracks,
                    activeTrackId: activeTrack?.id || null,
                    selectedTrackIds: initialSelectedIds // Auto-select translation tracks
                })

                get().addLog('success', `✅ تم النسخ! ${finalTracks.length > 1 ? `تم إنشاء ${finalTracks.length} مسارات` : `${segments.length} مقطع`}`)
            },

            batchMoveItems: (videoSegments?: any[], subtitleUpdates?: { id: number; updates: any }[], ghosts?: any) => {
                set((state) => {
                    const updates: any = {};
                    if (videoSegments) updates.videoSegments = videoSegments;
                    if (ghosts !== undefined) updates.dragGhostPositions = ghosts;

                    if (subtitleUpdates && subtitleUpdates.length > 0) {
                        const updatesMap = new Map(subtitleUpdates.map(u => [u.id, u.updates]));
                        const newSegments = state.segments.map((seg: any) => {
                            const up = updatesMap.get(seg.id);
                            return up ? { ...seg, ...up } : seg;
                        });
                        updates.segments = newSegments;

                        if (state.activeTrackId) {
                            updates.tracks = (state.tracks || []).map((t: any) =>
                                t.id === state.activeTrackId ? { ...t, segments: newSegments } : t
                            );
                        }
                    }
                    return updates;
                });
            },

            reset: () => {
                get().resetVideo()
                get().resetTracks()
                get().resetSubtitleEditor()
                get().resetTranscription()
                get().resetSettings()
                get().resetSilence()
                get().resetVideoEditing()
            },

            setTrackConfig: (trackId: string, updates: any) => {
                set((state) => {
                    const currentConfig = state.trackConfigs[trackId];
                    let baseConfig = currentConfig;

                    // If config doesn't exist yet (dynamic track), create it from source
                    if (!baseConfig) {
                        const track = state.tracks.find(t => t.id === trackId);
                        if (track) {
                            baseConfig = {
                                id: track.id,
                                label: track.name,
                                isHidden: !track.isVisible,
                                isLocked: track.isLocked
                            };
                        } else {
                            // Fallback for unknown IDs (e.g. video/waveform should be in initial state but just in case)
                            baseConfig = {
                                id: trackId,
                                label: 'Track',
                                isHidden: false,
                                isLocked: false
                            };
                        }
                    }

                    return {
                        trackConfigs: {
                            ...state.trackConfigs,
                            [trackId]: { ...baseConfig, ...updates }
                        }
                    };
                });
            },

            toggleTrackLock: (trackId: string) => {
                set((state) => {
                    // 1. Update UI Config (Primary for Video/Audio)
                    const currentConfig = state.trackConfigs[trackId];
                    const newLocked = currentConfig ? !currentConfig.isLocked : true;

                    const newConfigs = {
                        ...state.trackConfigs,
                        [trackId]: {
                            ...(currentConfig || { id: trackId, label: 'Track', isHidden: false }),
                            isLocked: newLocked
                        }
                    };

                    // 2. Update Data Tracks (Subtitles)
                    const newTracks = state.tracks.map(t =>
                        t.id === trackId ? { ...t, isLocked: newLocked } : t
                    );

                    return {
                        trackConfigs: newConfigs,
                        tracks: newTracks
                    };
                });
            },

            toggleTrackVisibility: (trackId: string) => {
                set((state) => {
                    // 1. Update UI Config
                    const currentConfig = state.trackConfigs[trackId];
                    const newHidden = currentConfig ? !currentConfig.isHidden : true;

                    const newConfigs = {
                        ...state.trackConfigs,
                        [trackId]: {
                            ...(currentConfig || { id: trackId, label: 'Track', isLocked: false }),
                            isHidden: newHidden
                        }
                    };

                    // 2. Update Data Tracks
                    const newTracks = state.tracks.map(t =>
                        t.id === trackId ? { ...t, isVisible: !newHidden } : t
                    );

                    return {
                        trackConfigs: newConfigs,
                        tracks: newTracks
                    };
                });
            }
        }),
        {
            name: 'project-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                recentProjects: state.recentProjects,
                preferredModel: state.preferredModel,
                // We can add more preference-like state here later
            })
        }
    )
)
