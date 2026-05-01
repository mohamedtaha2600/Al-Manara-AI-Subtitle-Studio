export interface Word {
    start: number
    end: number
    text: string
    probability: number
}

export interface SubtitleSegment {
    id: number
    start: number
    end: number
    text: string
    speaker?: string
    confidence?: number
    words?: Word[]
    style?: Partial<SubtitleStyle>
}

export interface SubtitleStyle {
    fontFamily: string
    fontSize: number
    primaryColor: string
    outlineColor: string
    outlineWidth: number
    shadowColor: string
    shadowOffset: number
    shadowBlur: number
    position: 'top' | 'center' | 'bottom' | 'custom'
    textAlign: 'left' | 'center' | 'right'
    marginV: number
    marginH: number
    bold: boolean
    italic: boolean
    underline: boolean
    backgroundColor: string
    backgroundOpacity: number
    borderRadius: number
    letterSpacing: number
    lineHeight: number
    animation: string
    animationDuration: number
    backgroundPadding: number
    backgroundBlur: number
    displayMode: string  // 'auto' | 'word' | 'sentence' | 'paragraph'

    // Box Shadow
    boxShadow: boolean
    boxShadowColor: string
    boxShadowOpacity: number
    boxShadowBlur: number
    boxShadowSpread: number

    // Active Word Highlight
    highlightCurrentWord: boolean
    highlightColor: string

    // Text Visibility
    showPunctuation: boolean
    showDiacritics: boolean

    // Free Positioning
    x?: number
    y?: number
}
export interface SubtitleTrack {
    id: string
    name: string
    language: string // 'ar', 'en', etc.
    segments: SubtitleSegment[]
    style: SubtitleStyle
    isVisible: boolean
    isLocked: boolean
}

export interface VideoFile {
    id: string
    name: string
    url: string
    duration: number
    type: 'video' | 'audio' | 'unknown'
}

export interface LogMessage {
    id: string
    timestamp: Date
    level: 'info' | 'success' | 'warning' | 'error'
    message: string
}

export interface SegmentationSettings {
    maxWords: number
    silenceThreshold: number
}

export interface SilenceSegment {
    id: number
    start: number
    end: number
    duration: number
    type: 'silence' | 'audible' // To distinguish between kept and removed parts
}

export interface SilenceSettings {
    threshold: number // dB (e.g. -30)
    minDuration: number // seconds (e.g. 0.5)
    padding: number // seconds (buffer around speech)
}

// Video Cut - a region that will be removed from the final video
export interface VideoCut {
    id: number
    start: number
    end: number
    type: 'manual' | 'silence' // manual = user cut, silence = from silence detection
}

// Video Segment - represents a clip on the timeline (like in real editing software)
// When you cut a video, it splits into multiple segments
export interface VideoSegment {
    id: number
    // Timeline position (where it appears on the timeline)
    timelineStart: number
    timelineEnd: number
    // Source position (which part of the original video this segment shows)
    sourceStart: number
    sourceEnd: number
    // State
    isMuted: boolean
    isLocked: boolean
}
