import { StateCreator } from 'zustand'
import { SubtitleStyle, SubtitleTrack } from './types'

export const defaultStyle: SubtitleStyle = {
    fontFamily: 'Arial',
    fontSize: 32,
    primaryColor: '#FFFFFF',
    outlineColor: '#000000',
    outlineWidth: 2,
    shadowColor: '#000000',
    shadowOffset: 2,
    shadowBlur: 4,
    position: 'bottom',
    textAlign: 'center',
    marginV: 30,
    marginH: 20,
    bold: false,
    italic: false,
    underline: false,
    backgroundColor: 'transparent',
    backgroundOpacity: 70,
    borderRadius: 4,
    letterSpacing: 0,
    lineHeight: 1.4,
    animation: 'fade',
    animationDuration: 300,
    backgroundPadding: 4,
    backgroundBlur: 0,
    boxShadow: false,
    boxShadowColor: '#000000',
    boxShadowOpacity: 50,
    boxShadowBlur: 10,
    boxShadowSpread: 0,
    displayMode: 'auto',
    // Text Visibility
    showPunctuation: true,
    showDiacritics: true,

    highlightCurrentWord: false,
    highlightColor: '#ffff00',
}

export interface TrackSlice {
    tracks: SubtitleTrack[]
    activeTrackId: string | null
    selectedTrackIds: string[] // Multi-select support
    style: SubtitleStyle

    // Actions
    addTrack: (track: SubtitleTrack) => void
    removeTrack: (trackId: string) => void
    setActiveTrack: (trackId: string) => void
    toggleTrackSelection: (trackId: string) => void // New
    setSelectedTracks: (trackIds: string[]) => void // New
    updateTrackStyle: (trackId: string, style: Partial<SubtitleStyle>) => void
    setTracks: (tracks: SubtitleTrack[]) => void
    setStyle: (updates: Partial<SubtitleStyle>) => void
    applyStyleToAll: () => void

    resetTracks: () => void
}

export const createTrackSlice: StateCreator<TrackSlice> = (set, get) => ({
    tracks: [],
    activeTrackId: null,
    selectedTrackIds: [], // Init
    style: defaultStyle,

    addTrack: (track) => set((state) => {
        const newTracks = [...state.tracks, track]
        const activeId = state.activeTrackId || track.id

        // Coordination: We update tracks and potentially active track info
        return {
            tracks: newTracks,
            activeTrackId: activeId,
            // Note: segments/style sync happens via useProjectStore orchestration 
            // or by the components reacting to activeTrackId
            style: activeId === track.id ? track.style : state.style
        }
    }),

    removeTrack: (trackId) => set((state) => {
        const newTracks = state.tracks.filter(t => t.id !== trackId)
        let newActiveId = state.activeTrackId
        let newStyle = state.style

        if (state.activeTrackId === trackId) {
            const nextTrack = newTracks[0]
            newActiveId = nextTrack ? nextTrack.id : null
            newStyle = nextTrack ? nextTrack.style : defaultStyle
        }

        return {
            tracks: newTracks,
            activeTrackId: newActiveId,
            style: newStyle
        }
    }),

    setActiveTrack: (trackId) => set((state) => {
        const track = state.tracks.find(t => t.id === trackId)
        if (!track) return {}
        return {
            activeTrackId: trackId,
            style: track.style,
            // Also select it by default if clicking to activate, unless multi-select logic handles it separately
            // For now, let's keep selection and activation somewhat synced but distinct
        }
    }),

    // Multi-Select Actions
    toggleTrackSelection: (trackId) => set((state) => {
        const currentSelected = state.selectedTrackIds || [];
        const isSelected = currentSelected.includes(trackId);

        let newSelected;
        if (isSelected) {
            newSelected = currentSelected.filter(id => id !== trackId);
        } else {
            newSelected = [...currentSelected, trackId];
        }

        return { selectedTrackIds: newSelected };
    }),

    setSelectedTracks: (trackIds) => set({ selectedTrackIds: trackIds }),

    updateTrackStyle: (trackId, styleUpdates) => set((state) => {

        const newTracks = state.tracks.map(t =>
            t.id === trackId ? { ...t, style: { ...t.style, ...styleUpdates } } : t
        )
        const newStyle = state.activeTrackId === trackId
            ? { ...state.style, ...styleUpdates }
            : state.style

        return { tracks: newTracks, style: newStyle }
    }),

    setTracks: (tracks) => set((state) => {
        const activeId = tracks.length > 0 ? tracks[0].id : null
        const activeTrack = tracks[0]

        return {
            tracks,
            activeTrackId: activeId,
            style: activeTrack ? activeTrack.style : state.style
        }
    }),

    setStyle: (updates) => set((state) => {
        const newStyle = { ...state.style, ...updates }
        let newTracks = state.tracks
        if (state.activeTrackId) {
            newTracks = state.tracks.map(t =>
                t.id === state.activeTrackId ? { ...t, style: newStyle } : t
            )
        }
        return { style: newStyle, tracks: newTracks }
    }),

    applyStyleToAll: () => set((state) => {
        const currentStyle = state.style
        const newTracks = state.tracks.map(t => ({
            ...t,
            style: { ...t.style, ...currentStyle }
        }))
        return { tracks: newTracks }
    }),

    resetTracks: () => set({
        tracks: [],
        activeTrackId: null,
        style: defaultStyle
    })
})
