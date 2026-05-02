'use client'

import { useState, useCallback, useEffect } from 'react'
import styles from './EditorInterface.module.css'
import Sidebar from '@/components/layout/Sidebar'
import Timeline from '@/components/editor/timeline/Timeline'
import StatusBar from '@/components/layout/StatusBar'
import VideoPlayer from '@/components/editor/videoplayer/VideoPlayer'
import StylePanel from '@/components/panels/StylePanel'
import SubtitleEditor from '@/components/panels/SubtitleEditor'
import ProgressLog from '@/components/console/ProgressLog'
import UploadModal from '@/components/modals/UploadModal'
import ExportModal from '@/components/modals/ExportModal'
import ImportModal from '@/components/modals/ImportModal'
import SettingsModal from '@/components/modals/SettingsModal'
import ExportProgressModal from '@/components/modals/ExportProgressModal'
import SilenceControls from '@/components/panels/SilencePanel/components/SilenceControls'
import SilenceSegmentsList from '@/components/panels/SilencePanel/components/SilenceSegmentsList'
import { EmptyState } from '@/components/panels/SubtitleEditor/components/EmptyState'
import { useProjectStore } from '@/store/useProjectStore'

// Icons
const SubtitlesIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
const StyleIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94" /></svg>
const LogIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
const UploadIcon = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
const ExportIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
const ScissorsIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></svg>
const SettingsIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
const ChevronRight = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
const ChevronLeft = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>

export default function EditorInterface() {
    // Timeline resize state
    const [timelineHeight, setTimelineHeight] = useState(350)
    const [isResizing, setIsResizing] = useState(false)
    const [startResizeData, setStartResizeData] = useState<{ mouseY: number; startHeight: number } | null>(null)

    // Sub-panel state for right panel tabs
    const [rightPanelTab, setRightPanelTab] = useState<'content' | 'settings' | 'log'>('content')
    const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false)

    // Project Name Editing
    const [isEditingName, setIsEditingName] = useState(false)
    const [editedName, setEditedName] = useState('')

    // Store Access
    const {
        segments,
        activePanel,
        setActivePanel,
        videoFile,
        projectName,
        setProjectName,
        setUploadModalOpen,
        setExportModalOpen,
        isVideoUploading,
        videoUploadProgress,
        editorLayout,
        setEditorLayout
    } = useProjectStore()

    // Check if we're in silence mode
    const isSilenceMode = activePanel === 'silence'

    // Handle Timeline Resizing
    const handleResizeMove = useCallback((e: MouseEvent) => {
        if (!isResizing || !startResizeData) return

        // Account for 0.9 zoom factor:
        // Mouse coordinates are in physical pixels, but CSS units are scaled
        // We need to translate screen pixels to CSS pixels
        const zoomFactor = 0.9
        const deltaY = (e.clientY - startResizeData.mouseY) / zoomFactor

        // As mouse moves UP (negative delta), height INCREASES
        const newHeight = startResizeData.startHeight - deltaY

        const windowHeightCss = window.innerHeight / zoomFactor
        // Status bar is roughly 30px (scaled), so we account for it
        const clampedHeight = Math.max(150, Math.min(newHeight, windowHeightCss * 0.7))

        setTimelineHeight(clampedHeight)
    }, [isResizing, startResizeData])

    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizing(true)
        setStartResizeData({
            mouseY: e.clientY,
            startHeight: timelineHeight
        })
    }

    const handleResizeEnd = useCallback(() => {
        setIsResizing(false)
        setStartResizeData(null)
    }, [])

    const handleTouchResizeStart = (e: React.TouchEvent) => {
        setIsResizing(true)
        setStartResizeData({
            mouseY: e.touches[0].clientY,
            startHeight: timelineHeight
        })
    }

    const handleTouchResizeMove = useCallback((e: TouchEvent) => {
        if (!isResizing || !startResizeData) return
        
        const zoomFactor = window.innerWidth <= 768 ? 1.0 : 0.9
        const deltaY = (e.touches[0].clientY - startResizeData.mouseY) / zoomFactor
        const newHeight = startResizeData.startHeight - deltaY
        
        const windowHeightCss = window.innerHeight / zoomFactor
        const clampedHeight = Math.max(120, Math.min(newHeight, windowHeightCss * 0.8))
        
        setTimelineHeight(clampedHeight)
    }, [isResizing, startResizeData])

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleResizeMove)
            window.addEventListener('mouseup', handleResizeEnd)
            window.addEventListener('touchmove', handleTouchResizeMove, { passive: false })
            window.addEventListener('touchend', handleResizeEnd)
        }
        return () => {
            window.removeEventListener('mousemove', handleResizeMove)
            window.removeEventListener('mouseup', handleResizeEnd)
            window.removeEventListener('touchmove', handleTouchResizeMove)
            window.removeEventListener('touchend', handleResizeEnd)
        }
    }, [isResizing, handleResizeMove, handleResizeEnd])

    // Get tab labels based on mode
    const getTabLabels = () => {
        if (isSilenceMode) {
            return {
                content: { icon: <ScissorsIcon />, label: 'أماكن الصمت' },
                settings: { icon: <SettingsIcon />, label: 'إعدادات الصمت' },
                log: { icon: <LogIcon />, label: 'السجل' }
            }
        }
        return {
            content: { icon: <SubtitlesIcon />, label: 'الترجمات' },
            settings: { icon: <StyleIcon />, label: 'التنسيق' },
            log: { icon: <LogIcon />, label: 'السجل' }
        }
    }

    const tabLabels = getTabLabels()

    // Render right panel content based on mode and active tab
    const renderRightPanelContent = () => {
        // Global check: If no video is uploaded, show upload prompt regardless of tab
        if (!videoFile) {
            return <EmptyState />
        }

        if (isSilenceMode) {
            // Silence Mode
            switch (rightPanelTab) {
                case 'content':
                    return <SilenceSegmentsList />
                case 'settings':
                    return <SilenceControls />
                case 'log':
                    return <ProgressLog filterSilence />
                default:
                    return <SilenceControls />
            }
        } else {
            // Subtitle/Translation Mode
            switch (rightPanelTab) {
                case 'content':
                    return <SubtitleEditor />
                case 'settings':
                    return <StylePanel />
                case 'log':
                    return <ProgressLog />
                default:
                    return <StylePanel />
            }
        }
    }

    return (
        <div className={styles.container}>
            <Sidebar />
            <main className={`${styles.mainContent} ${editorLayout === 'vertical' ? styles.verticalMode : ''}`}>
                {editorLayout === 'vertical' ? (
                    /* Vertical Layout Mode */
                    <div className={styles.verticalSplitWrapper}>
                        {/* Left Side: Header + Controls + Timeline (Stacked) */}
                        <div className={styles.verticalLeftStack}>
                            <header className={styles.header}>
                                <div className={styles.headerLeft}>
                                    <div
                                        className={styles.projectNameContainer}
                                        onDoubleClick={() => {
                                            setIsEditingName(true);
                                            setEditedName(projectName);
                                        }}
                                        title="اضغط مرتين لتغيير الاسم"
                                    >
                                        {isEditingName ? (
                                            <input
                                                autoFocus
                                                className={styles.projectNameInput}
                                                value={editedName}
                                                onChange={(e) => setEditedName(e.target.value)}
                                                onBlur={() => {
                                                    if (editedName.trim()) setProjectName(editedName);
                                                    setIsEditingName(false);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        if (editedName.trim()) setProjectName(editedName);
                                                        setIsEditingName(false);
                                                    } else if (e.key === 'Escape') {
                                                        setIsEditingName(false);
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <h1 className={styles.projectNameText}>{projectName}</h1>
                                        )}
                                        {videoFile && (
                                            <span className={styles.fileNameBadge}>
                                                {videoFile.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.headerRight}>
                                    <button 
                                        className={styles.layoutToggleBtn}
                                        onClick={() => setEditorLayout('horizontal')}
                                        title="تبديل للوضع العرضي"
                                    >
                                        وضع عرضي
                                    </button>
                                </div>
                            </header>

                            <div className={styles.verticalEditorArea}>
                                <aside className={`${styles.rightPanel} ${isRightPanelCollapsed ? styles.collapsed : ''} ${styles.verticalPanel}`}>
                                    <button 
                                        className={styles.collapseToggle} 
                                        onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
                                    >
                                        {isRightPanelCollapsed ? <ChevronLeft /> : <ChevronRight />}
                                    </button>
                                    <div className={styles.panelTabs}>
                                        <button className={`${styles.panelTab} ${rightPanelTab === 'content' ? styles.active : ''}`} onClick={() => setRightPanelTab('content')}>
                                            {tabLabels.content.icon} <span>{tabLabels.content.label}</span>
                                        </button>
                                        <button className={`${styles.panelTab} ${rightPanelTab === 'settings' ? styles.active : ''}`} onClick={() => setRightPanelTab('settings')}>
                                            {tabLabels.settings.icon} <span>{tabLabels.settings.label}</span>
                                        </button>
                                    </div>
                                    <div className={styles.panelContent}>
                                        {renderRightPanelContent()}
                                    </div>
                                </aside>
                            </div>

                            <section className={styles.verticalTimelineSection} style={{ height: timelineHeight }}>
                                <div 
                                    className={styles.resizeDivider} 
                                    onMouseDown={handleResizeStart} 
                                    onTouchStart={handleTouchResizeStart}
                                />
                                <Timeline />
                            </section>
                        </div>

                        {/* Right Side: Tall Preview */}
                        <section className={styles.verticalPlayerSection}>
                            <VideoPlayer />
                            <div className={styles.verticalControlsOverlay}>
                                <button 
                                    className={styles.layoutToggleBtnSmall}
                                    onClick={() => setEditorLayout('horizontal')}
                                    title="تبديل للوضع العرضي"
                                >
                                    عرضي
                                </button>
                            </div>
                        </section>
                    </div>
                ) : (
                    /* Standard Horizontal Layout Mode */
                    <>
                        <header className={styles.header}>
                            <div className={styles.headerLeft}>
                                <div
                                    className={styles.projectNameContainer}
                                    onDoubleClick={() => {
                                        setIsEditingName(true);
                                        setEditedName(projectName);
                                    }}
                                    title="اضغط مرتين لتغيير الاسم"
                                >
                                    {isEditingName ? (
                                        <input
                                            autoFocus
                                            className={styles.projectNameInput}
                                            value={editedName}
                                            onChange={(e) => setEditedName(e.target.value)}
                                            onBlur={() => {
                                                if (editedName.trim()) setProjectName(editedName);
                                                setIsEditingName(false);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    if (editedName.trim()) setProjectName(editedName);
                                                    setIsEditingName(false);
                                                } else if (e.key === 'Escape') {
                                                    setIsEditingName(false);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <h1 className={styles.projectNameText}>{projectName}</h1>
                                    )}
                                    {videoFile && (
                                        <span className={styles.fileNameBadge}>
                                            {videoFile.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className={styles.headerRight}>
                                <button 
                                    className={styles.layoutToggleBtn}
                                    onClick={() => setEditorLayout('vertical')}
                                    title="تبديل للوضع الطولي"
                                >
                                    وضع طولي
                                </button>
                            </div>
                        </header>

                        <div className={styles.editorArea}>
                            <aside className={`${styles.rightPanel} ${isRightPanelCollapsed ? styles.collapsed : ''}`}>
                                <button 
                                    className={styles.collapseToggle} 
                                    onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
                                    title={isRightPanelCollapsed ? "فتح القائمة" : "إغلاق القائمة"}
                                >
                                    {isRightPanelCollapsed ? <ChevronLeft /> : <ChevronRight />}
                                </button>

                                <div className={styles.panelTabs}>
                                    <button
                                        className={`${styles.panelTab} ${rightPanelTab === 'content' ? styles.active : ''}`}
                                        onClick={() => setRightPanelTab('content')}
                                    >
                                        {tabLabels.content.icon} <span>{tabLabels.content.label}</span>
                                    </button>
                                    <button
                                        className={`${styles.panelTab} ${rightPanelTab === 'settings' ? styles.active : ''}`}
                                        onClick={() => setRightPanelTab('settings')}
                                    >
                                        {tabLabels.settings.icon} <span>{tabLabels.settings.label}</span>
                                    </button>
                                    <button
                                        className={`${styles.panelTab} ${rightPanelTab === 'log' ? styles.active : ''}`}
                                        onClick={() => setRightPanelTab('log')}
                                    >
                                        {tabLabels.log.icon} <span>{tabLabels.log.label}</span>
                                    </button>
                                </div>
                                <div className={styles.panelContent}>
                                    {renderRightPanelContent()}
                                </div>
                            </aside>

                            <section className={styles.playerSection}>
                                {videoFile ? (
                                    <VideoPlayer />
                                ) : (
                                    <div className={styles.emptyPlayer} onClick={() => setUploadModalOpen(true)}>
                                        <UploadIcon />
                                        <h2>ارفع ملف فيديو أو صوت</h2>
                                        <p>اسحب الملف هنا أو اضغط للاختيار</p>
                                        <span className={styles.formats}>MP4, MKV, AVI, MP3, WAV</span>
                                    </div>
                                )}
                            </section>
                        </div>

                        <section className={styles.timelineSection} style={{ height: timelineHeight }}>
                            <div 
                                className={`${styles.resizeDivider} ${isResizing ? styles.dragging : ''}`} 
                                onMouseDown={handleResizeStart} 
                                onTouchStart={handleTouchResizeStart}
                            />
                            <Timeline />
                        </section>
                    </>
                )}
                <StatusBar />
            </main>

            {/* Wireless Modals */}
            <UploadModal />
            <ImportModal />
            <ExportModal />
            <SettingsModal />
            <ExportProgressModal />
        </div>
    )
}
