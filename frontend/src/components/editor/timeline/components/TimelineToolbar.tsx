/**
 * TimelineToolbar Component
 * Toolbar with editing tools, time display, and zoom controls
 * شريط أدوات التايم لاين المحسّن
 * 
 * Layout: [Zoom Controls] --- [Tools in Center] --- [Time Display]
 */

'use client'

import { useProjectStore } from '@/store/useProjectStore'
import { formatTime, formatSMPTE } from '@/utils/timeUtils'
import styles from '../Timeline.module.css'
import { TimelineTool } from '../hooks/useTimelineTools'

interface TimelineToolbarProps {
    onSplitSegment: () => void
    isVideoAudioLinked?: boolean
    onToggleLink?: () => void
}

export default function TimelineToolbar({
    onSplitSegment,
    isVideoAudioLinked = true,
    onToggleLink
}: TimelineToolbarProps) {
    const {
        activePanel,
        currentTime,
        videoFile,
        segments,
        timelineZoom,
        setTimelineZoom,
        activeTool,
        setActiveTool,
        snapEnabled,
        setSnapEnabled,
        showVADOverlay,
        setShowVADOverlay
    } = useProjectStore()

    const isSilenceMode = activePanel === 'silence'

    const onToolChange = (tool: TimelineTool) => {
        // Prevent switching to text tool in silence mode
        if (isSilenceMode && tool === 'text') return;
        
        console.log('[Toolbar] Tool changed to:', tool);
        setActiveTool(tool);
    }

    const totalDuration = videoFile?.duration || 0

    return (
        <div className={styles.toolbar}>
            {/* === RIGHT: Zoom Controls (Moved to the Right in RTL) === */}
            <div className={styles.toolbarRight}>
                {/* VAD Overlay Toggle */}
                <button
                    className={`${styles.zoomBtn} ${showVADOverlay ? styles.vadActive : ''}`}
                    onClick={() => setShowVADOverlay(!showVADOverlay)}
                    title={showVADOverlay ? "إخفاء معاينة تحليل الكلام" : "إظهار معاينة تحليل الكلام"}
                >
                    <VADIcon />
                </button>

                <div className={styles.toolSeparator} style={{ height: 16, margin: '0 8px' }} />

                <button
                    className={styles.zoomBtn}
                    onClick={() => setTimelineZoom(Math.max(0.01, timelineZoom / 1.25))}
                    disabled={timelineZoom <= 0.02}
                    title="تصغير"
                >
                    <ZoomOutIcon />
                </button>
                <span className={styles.zoomLevel}>{Math.round(timelineZoom * 100)}%</span>
                <button
                    className={styles.zoomBtn}
                    onClick={() => setTimelineZoom(Math.min(10, timelineZoom * 1.25))}
                    disabled={timelineZoom >= 10}
                    title="تكبير"
                >
                    <ZoomInIcon />
                </button>
            </div>

            {/* === CENTER: Editing Tools === */}
            <div className={styles.toolbarCenter}>
                <div className={styles.toolGroup}>
                    {/* Select Tool */}
                    <button
                        className={`${styles.toolBtn} ${activeTool === 'select' ? styles.toolActive : ''}`}
                        onClick={() => onToolChange('select')}
                        title="تحديد (V)"
                    >
                        <SelectIcon />
                    </button>

                    {/* Razor/Cut Tool - Cuts everything */}
                    <button
                        className={`${styles.toolBtn} ${activeTool === 'razor' ? styles.toolActive : ''}`}
                        onClick={() => onToolChange('razor')}
                        title="قص (C) - يقص الفيديو والصوت والترجمات"
                    >
                        <ScissorsIcon />
                    </button>

                    {/* Hand/Pan Tool */}
                    <button
                        className={`${styles.toolBtn} ${activeTool === 'hand' ? styles.toolActive : ''}`}
                        onClick={() => onToolChange('hand')}
                        title="سحب (H)"
                    >
                        <HandIcon />
                    </button>

                    {/* Text Tool */}
                    {!isSilenceMode && (
                        <button
                            className={`${styles.toolBtn} ${activeTool === 'text' ? styles.toolActive : ''}`}
                            onClick={() => onToolChange('text')}
                            title="نص (T) - إضافة ترجمة يدوية"
                        >
                            <TextIcon />
                        </button>
                    )}

                    {/* Ripple Edit Tool */}
                    <button
                        className={`${styles.toolBtn} ${activeTool === 'ripple' ? styles.toolActive : ''}`}
                        onClick={() => onToolChange('ripple')}
                        title="تحريك متسلسل / Ripple Edit (B)"
                    >
                        <RippleIcon />
                    </button>

                    {/* Slip Tool */}
                    <button
                        className={`${styles.toolBtn} ${activeTool === 'slip' ? styles.toolActive : ''}`}
                        onClick={() => onToolChange('slip')}
                        title="تعديل المحتوى / Slip Tool (Y)"
                    >
                        <SlipIcon />
                    </button>
                </div>

                {/* Separator */}
                <div className={styles.toolSeparator} />

                {/* Link Video/Audio Toggle */}
                {onToggleLink && (
                    <button
                        className={`${styles.toolBtn} ${isVideoAudioLinked ? styles.linked : ''}`}
                        onClick={onToggleLink}
                        title={isVideoAudioLinked ? "الفيديو والصوت مرتبطان" : "الفيديو والصوت منفصلان"}
                    >
                        {isVideoAudioLinked ? <LinkIcon /> : <UnlinkIcon />}
                    </button>
                )}

                {/* Quick Split Button */}
                <button
                    className={styles.toolBtn}
                    onClick={onSplitSegment}
                    title="قص سريع في موضع Playhead (S)"
                >
                    <QuickSplitIcon />
                </button>

                {/* Separator */}
                <div className={styles.toolSeparator} />

                {/* Snapping Toggle */}
                <button
                    className={`${styles.toolBtn} ${snapEnabled ? styles.toolActive : ''}`}
                    onClick={() => setSnapEnabled(!snapEnabled)}
                    title={snapEnabled ? "تعطيل المغناطيس" : "تفعيل المغناطيس"}
                >
                    <MagnetIcon />
                </button>
            </div>

            {/* === LEFT: Time Display (Moved to the Left in RTL) === */}
            <div className={styles.toolbarLeft}>
                <span className={styles.segmentCount}>
                    {segments.length} مقطع
                </span>
                <div className={styles.timeDisplay} title="الوقت الحالي / إجمالي المدة">
                    <span className={styles.currentTimeValue}>
                        {formatSMPTE(currentTime)}
                    </span>
                    <span className={styles.timeSeparator}>/</span>
                    <span className={styles.totalDuration}>
                        {formatTime(totalDuration)}
                    </span>
                </div>
            </div>
        </div>
    )
}

// ========== ICONS ==========

// Arrow/Select cursor icon
const SelectIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 3l14 9-7 2-3 7-4-18z" />
    </svg>
)

// Scissors icon for cutting
const ScissorsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M20 4L8.12 15.88" />
        <path d="M14.47 14.48L20 20" />
        <path d="M8.12 8.12L12 12" />
    </svg>
)

// Hand/Pan icon
const HandIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
        <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
)

// Text Tool Icon
const TextIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 7V4h16v3" />
        <path d="M9 20h6" />
        <path d="M12 4v16" />
    </svg>
)

// Quick split at playhead
const QuickSplitIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20" />
        <path d="M8 6l-4 4 4 4" />
        <path d="M16 6l4 4-4 4" />
    </svg>
)

// Link icon - video/audio linked
const LinkIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
)

// Unlink icon - video/audio separate
const UnlinkIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M5.16 11.75l-1.72 1.71a5 5 0 0 0 7.07 7.07l1.72-1.71" />
        <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
)

// Zoom In
const ZoomInIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
    </svg>
)

// Zoom Out
const ZoomOutIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35M8 11h6" />
    </svg>
)

// Magnet Icon for snapping
const MagnetIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 10V5a6 6 0 0 1 12 0v5" />
        <path d="M18 10h4v5a10 10 0 0 1-20 0v-5h4" />
        <path d="M6 10h4v5h-4z" />
        <path d="M14 10h4v5h-4z" />
    </svg>
)

// Ripple Edit Icon
const RippleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 12h10M12 12l-4-4M12 12l-4 4" />
        <rect x="14" y="6" width="8" height="12" rx="1" />
    </svg>
)

// Slip Tool Icon
const SlipIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 12h12M6 12l3-3M6 12l3 3M18 12l-3-3M18 12l-3 3" />
        <rect x="2" y="4" width="20" height="16" rx="2" strokeDasharray="4 2" />
    </svg>
)

// VAD Analysis Icon (Waves)
const VADIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 10v4M6 4v16M10 8v8M14 4v16M18 8v8M22 10v4" />
    </svg>
)
