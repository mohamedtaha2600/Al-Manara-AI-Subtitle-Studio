import { StateCreator } from 'zustand'

export interface ProjectMetadata {
    id: string
    name: string
    lastModified: number // timestamp
    type: 'video' | 'srt'
    path?: string // For future use with file system
    thumbnail?: string // For future use
}

export interface RecentSlice {
    recentProjects: ProjectMetadata[]
    addRecentProject: (project: Omit<ProjectMetadata, 'id' | 'lastModified'>) => void
    removeRecentProject: (id: string) => void
    clearRecentProjects: () => void
}

export const createRecentSlice: StateCreator<RecentSlice> = (set) => ({
    recentProjects: [],

    addRecentProject: (project) => set((state) => {
        const newProject = {
            ...project,
            id: crypto.randomUUID(),
            lastModified: Date.now()
        }

        // Remove duplicates by name (simple check for now)
        const filtered = state.recentProjects.filter(p => p.name !== project.name)

        return {
            recentProjects: [newProject, ...filtered].slice(0, 10) // Keep last 10
        }
    }),

    removeRecentProject: (id) => set((state) => ({
        recentProjects: state.recentProjects.filter(p => p.id !== id)
    })),

    clearRecentProjects: () => set({ recentProjects: [] })
})
