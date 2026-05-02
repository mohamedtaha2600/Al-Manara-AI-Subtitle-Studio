import { StateCreator } from 'zustand'

export type TimelineTool = 'select' | 'razor' | 'hand' | 'split' | 'delete' | 'text' | 'ripple' | 'slip'

export interface TrackConfig {
    id: string;
    label: string;
    isHidden: boolean;
    isLocked: boolean;
    isMuted?: boolean;
    isSolo?: boolean;
}

export interface UISlice {
    // Modals
    isUploadModalOpen: boolean
    isImportModalOpen: boolean
    isExportModalOpen: boolean
    isSettingsModalOpen: boolean

    // Panels
    activePanel: 'subtitles' | 'style' | 'log' | 'silence' | 'enhance'
    timelineHeight: number
    timelineZoom: number
    activeTool: TimelineTool
    snapEnabled: boolean
    dragGhostPositions: Record<string, { start: number, end: number, rowId: string }> | null

    // Player State (Wireless)
    playerVolume: number
    playerIsMuted: boolean
    playerRate: number
    playerZoom: number
    playerPan: { x: number, y: number }
    playerShowControls: boolean
    selectedActionId: string | null
    multiSelectActionIds: string[]
    selectedTrackId: string | null
    trackConfigs: Record<string, TrackConfig>

    // Actions
    setUploadModalOpen: (isOpen: boolean) => void
    setImportModalOpen: (isOpen: boolean) => void
    setExportModalOpen: (isOpen: boolean) => void
    setSettingsModalOpen: (isOpen: boolean) => void
    setActivePanel: (panel: 'subtitles' | 'style' | 'log' | 'silence' | 'enhance') => void
    setTimelineHeight: (height: number) => void
    setTimelineZoom: (zoom: number) => void
    setActiveTool: (tool: TimelineTool) => void
    setSnapEnabled: (enabled: boolean) => void
    setDragGhostPositions: (ghosts: Record<string, { start: number, end: number, rowId: string }> | null) => void

    // Player Actions
    setPlayerVolume: (vol: number) => void
    setPlayerMuted: (muted: boolean) => void
    setPlayerRate: (rate: number) => void
    setPlayerZoom: (zoom: number) => void
    setPlayerPan: (pan: { x: number, y: number }) => void
    setPlayerShowControls: (show: boolean) => void
    setSelectedActionId: (id: string | null) => void
    setMultiSelectActionIds: (ids: string[]) => void
    setSelectedTrackId: (id: string | null) => void
    setTrackConfig: (trackId: string, updates: Partial<TrackConfig>) => void
    toggleTrackLock: (trackId: string) => void
    toggleTrackVisibility: (trackId: string) => void

    // Navigation
    currentView: 'dashboard' | 'editor'
    setCurrentView: (view: 'dashboard' | 'editor') => void
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
    isUploadModalOpen: false,
    isImportModalOpen: false,
    isExportModalOpen: false,
    isSettingsModalOpen: false,

    activePanel: 'subtitles',
    timelineHeight: 350,
    timelineZoom: 1,
    activeTool: 'select',
    snapEnabled: true,
    dragGhostPositions: null,

    playerVolume: 1,
    playerIsMuted: false,
    playerRate: 1,
    playerZoom: 0.6,
    playerPan: { x: 0, y: 0 },
    playerShowControls: true,
    selectedActionId: null,
    multiSelectActionIds: [],
    selectedTrackId: null,
    trackConfigs: {
        'subtitle-track': { id: 'subtitle-track', label: 'Subtitles', isHidden: false, isLocked: false },
        'video-track': { id: 'video-track', label: 'Video Track', isHidden: false, isLocked: false },
        'waveform-track': { id: 'waveform-track', label: 'Audio', isHidden: false, isLocked: false, isMuted: false, isSolo: false },
    },

    setUploadModalOpen: (isOpen) => set({ isUploadModalOpen: isOpen }),
    setImportModalOpen: (isOpen) => set({ isImportModalOpen: isOpen }),
    setExportModalOpen: (isOpen) => set({ isExportModalOpen: isOpen }),
    setSettingsModalOpen: (isOpen) => set({ isSettingsModalOpen: isOpen }),
    setActivePanel: (panel) => set({ activePanel: panel }),
    setTimelineHeight: (height) => set({ timelineHeight: height }),
    setTimelineZoom: (zoom) => set({ timelineZoom: zoom }),
    setActiveTool: (tool) => set({ activeTool: tool }),
    setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),
    setDragGhostPositions: (ghosts) => set({ dragGhostPositions: ghosts }),

    setPlayerVolume: (vol) => set({ playerVolume: vol }),
    setPlayerMuted: (muted) => set({ playerIsMuted: muted }),
    setPlayerRate: (rate) => set({ playerRate: rate }),
    setPlayerZoom: (zoom) => set({ playerZoom: zoom }),
    setPlayerPan: (pan) => set({ playerPan: pan }),
    setPlayerShowControls: (show) => set({ playerShowControls: show }),
    setSelectedActionId: (id) => set({ selectedActionId: id, multiSelectActionIds: id ? [id] : [] }),
    setMultiSelectActionIds: (ids) => set({ multiSelectActionIds: ids, selectedActionId: ids.length === 1 ? ids[0] : null }),
    setSelectedTrackId: (id) => set({ selectedTrackId: id }),
    setTrackConfig: (trackId, updates) => set((state) => ({
        trackConfigs: {
            ...state.trackConfigs,
            [trackId]: { ...state.trackConfigs[trackId], ...updates }
        }
    })),
    toggleTrackLock: (trackId) => set((state) => ({
        trackConfigs: {
            ...state.trackConfigs,
            [trackId]: { ...state.trackConfigs[trackId], isLocked: !state.trackConfigs[trackId].isLocked }
        }
    })),
    toggleTrackVisibility: (trackId) => set((state) => ({
        trackConfigs: {
            ...state.trackConfigs,
            [trackId]: { ...state.trackConfigs[trackId], isHidden: !state.trackConfigs[trackId].isHidden }
        }
    })),

    currentView: 'dashboard',
    setCurrentView: (view) => set({ currentView: view }),
})
