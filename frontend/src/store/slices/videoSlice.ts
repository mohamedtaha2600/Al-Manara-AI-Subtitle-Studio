import { StateCreator } from 'zustand'
import { VideoFile } from './types'

export interface VideoSlice {
    videoFile: VideoFile | null
    projectName: string
    currentTime: number
    isPlaying: boolean

    setVideoFile: (file: VideoFile | null) => void
    setProjectName: (name: string) => void
    setCurrentTime: (time: number) => void
    setIsPlaying: (playing: boolean) => void

    // Derived/Complex Actions if needed
    resetVideo: () => void
}

export const createVideoSlice: StateCreator<VideoSlice> = (set) => ({
    videoFile: null,
    projectName: 'مشروع جديد',
    currentTime: 0,
    isPlaying: false,

    setVideoFile: (file) => set({ videoFile: file }),
    setProjectName: (name) => set({ projectName: name }),
    setCurrentTime: (time) => set({ currentTime: time }),
    setIsPlaying: (playing) => set({ isPlaying: playing }),

    resetVideo: () => set({
        videoFile: null,
        projectName: 'مشروع جديد',
        currentTime: 0,
        isPlaying: false
    }),
})
