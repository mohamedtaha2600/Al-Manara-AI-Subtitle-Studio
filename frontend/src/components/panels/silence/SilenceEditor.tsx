'use client'

import { useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import StatusBar from '@/components/layout/StatusBar'
import VideoPlayer from '@/components/editor/videoplayer/VideoPlayer'
import Timeline from '@/components/editor/timeline/Timeline'
import SilenceControls from './SilenceControls'
import UploadModal from '@/components/modals/UploadModal'
import ExportModal from '@/components/modals/ExportModal'
import ImportModal from '@/components/modals/ImportModal'
import SettingsModal from '@/components/modals/SettingsModal'
import { useProjectStore } from '@/store/useProjectStore'
import styles from './SilenceEditor.module.css'

export default function SilenceEditor() {
    const {
        videoFile,
        setUploadModalOpen,
        timelineHeight,
        setTimelineHeight,
        activePanel
    } = useProjectStore()

    // Override theme for Silence Mode
    useEffect(() => {
        document.documentElement.style.setProperty('--accent-primary', '#f97316') // Orange
        document.documentElement.style.setProperty('--accent-secondary', '#ea580c')

        return () => {
            // Reset to default purple on unmount
            document.documentElement.style.setProperty('--accent-primary', '#6366f1')
            document.documentElement.style.setProperty('--accent-secondary', '#4f46e5')
        }
    }, [])

    return (
        <div className={styles.container}>
            {/* Sidebar Navigation */}
            <Sidebar />

            <main className={styles.main}>
                {/* Header tailored for Silence */}
                <header className={styles.header}>
                    <div className={styles.headerTitle}>
                        <h1>مزيل الصمت الذكي</h1>
                        <span className={styles.badge}>Silence AI</span>
                    </div>
                </header>

                <div className={styles.editorArea}>
                    {/* Video Player Section */}
                    <section className={styles.playerSection}>
                        {videoFile ? (
                            <VideoPlayer />
                        ) : (
                            <div className={styles.emptyPlayer} onClick={() => setUploadModalOpen(true)}>
                                <h2>ارفع ملف للبدء</h2>
                            </div>
                        )}
                    </section>

                    {/* Right Panel - Silence Controls */}
                    <aside className={styles.rightPanel}>
                        <SilenceControls />
                    </aside>
                </div>

                {/* Timeline Section */}
                <section
                    className={styles.timelineSection}
                    style={{ height: timelineHeight }}
                >
                    <Timeline />
                </section>

                <StatusBar />
            </main>

            {/* Modals */}
            <UploadModal />
            <ImportModal />
            <ExportModal />
            <SettingsModal />
        </div>
    )
}
