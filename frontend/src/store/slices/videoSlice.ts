import { StateCreator } from 'zustand'
import { VideoFile } from './types'

export interface VideoSlice {
    videoFile: VideoFile | null
    projectName: string
    currentTime: number
    isPlaying: boolean

    // Background Upload Tracking
    isVideoUploading: boolean
    videoUploadProgress: number

    setVideoFile: (file: VideoFile | null) => void
    setProjectName: (name: string) => void
    setCurrentTime: (time: number) => void
    setIsPlaying: (playing: boolean) => void

    // Background Upload Actions
    setVideoUploadProgress: (progress: number) => void
    setIsVideoUploading: (uploading: boolean) => void

    // Derived/Complex Actions if needed
    resetVideo: () => void
}

export const createVideoSlice: StateCreator<VideoSlice> = (set) => ({
    videoFile: null,
    projectName: 'مشروع جديد',
    currentTime: 0,
    isPlaying: false,

    // Background Upload
    isVideoUploading: false,
    videoUploadProgress: 0,

    setVideoFile: (file) => set({ videoFile: file }),
    setProjectName: (name) => set({ projectName: name }),
    setCurrentTime: (time) => set({ currentTime: time }),
    setIsPlaying: (playing) => set({ isPlaying: playing }),

    setVideoUploadProgress: (progress) => set({ videoUploadProgress: progress }),
    setIsVideoUploading: (uploading) => set({ isVideoUploading: uploading }),

    resetVideo: () => set({
        videoFile: null,
        projectName: 'مشروع جديد',
        currentTime: 0,
        isPlaying: false,
        isVideoUploading: false,
        videoUploadProgress: 0
    }),
})
