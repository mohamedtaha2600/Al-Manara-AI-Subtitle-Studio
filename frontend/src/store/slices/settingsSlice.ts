import { StateCreator } from 'zustand'
import { LogMessage } from './types'

export interface SettingsSlice {
    preferredModel: string
    logs: LogMessage[]

    // System Settings
    // (Consolidated below)

    // System Settings
    gpuEnabled: boolean
    offlineMode: boolean
    autoCleanup: boolean
    performanceMode: 'accuracy' | 'speed' // New: Turbo Mode
    tempPath: string
    outputPath: string

    setSystemSetting: (key: 'gpuEnabled' | 'offlineMode' | 'autoCleanup' | 'performanceMode' | 'tempPath' | 'outputPath', value: any) => void

    setPreferredModel: (model: string) => void
    addLog: (level: LogMessage['level'], message: string) => void
    clearLogs: () => void
    resetSettings: () => void
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set, get) => ({
    preferredModel: 'medium',
    logs: [],

    // Default System Settings
    gpuEnabled: true,
    offlineMode: true,
    autoCleanup: true,
    performanceMode: 'speed', // Default to speed for GTX 1650
    tempPath: './temp',
    outputPath: 'source', // 'source' or custom path

    setSystemSetting: (key, value) => set((state) => ({ ...state, [key]: value })),

    setPreferredModel: (model) => set({ preferredModel: model }),

    addLog: (level, message) => set((state) => ({
        logs: [
            ...state.logs,
            {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date(),
                level,
                message,
            },
        ].slice(-100),
    })),

    clearLogs: () => set({ logs: [] }),

    resetSettings: () => set({ logs: [] })
})
