'use client'

import { useState } from 'react'
import styles from './Dashboard.module.css'
import { useProjectStore } from '@/store/useProjectStore'

// Icons
const HomeIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
const FolderIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
const FileTextIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
const SettingsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
const PlusIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
const UploadCloudIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 16 12 12 8 16"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path><polyline points="16 16 12 12 8 16"></polyline></svg>

const MOCK_RECENT_PROJECTS = [
    { id: 1, name: 'مشروع جديد 1', date: 'منذ ساعتين', type: 'video' },
    { id: 2, name: 'ترجمة فيلم وثائقي', date: 'أمس', type: 'srt' },
    { id: 3, name: 'شرح تعليمي 2024', date: 'منذ 3 أيام', type: 'video' },
]

export default function Dashboard() {
    const { setCurrentView, reset, setImportModalOpen, setProjectName, setUploadModalOpen } = useProjectStore()
    const [activeTab, setActiveTab] = useState('home')

    const handleNewProject = () => {
        reset()
        setProjectName('مشروع جديد')
        setCurrentView('editor')
        setTimeout(() => setUploadModalOpen(true), 100) // Open upload modal automatically
    }

    const handleOpenProject = () => {
        // In a real app, this would open a file dialog
        // For now, we just go to editor
        setCurrentView('editor')
    }

    const handleImportSRT = () => {
        reset()
        setCurrentView('editor')
        setTimeout(() => setImportModalOpen(true), 100)
    }

    const handleOpenRecent = (name: string) => {
        setProjectName(name)
        setCurrentView('editor')
    }

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.logo}>AISCRIP</div>

                <nav className={styles.nav}>
                    <div
                        className={`${styles.navItem} ${activeTab === 'home' ? styles.active : ''}`}
                        onClick={() => setActiveTab('home')}
                    >
                        <div className={styles.navIcon}><HomeIcon /></div>
                        <span>الرئيسية</span>
                    </div>
                    <div
                        className={`${styles.navItem} ${activeTab === 'projects' ? styles.active : ''}`}
                        onClick={() => setActiveTab('projects')}
                    >
                        <div className={styles.navIcon}><FolderIcon /></div>
                        <span>المشاريع</span>
                    </div>
                    <div
                        className={`${styles.navItem} ${activeTab === 'translations' ? styles.active : ''}`}
                        onClick={() => setActiveTab('translations')}
                    >
                        <div className={styles.navIcon}><FileTextIcon /></div>
                        <span>الترجمات</span>
                    </div>
                </nav>

                <div
                    className={styles.navItem}
                    onClick={() => { /* Settings Logic */ }}
                >
                    <div className={styles.navIcon}><SettingsIcon /></div>
                    <span>الإعدادات</span>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                <header className={styles.header}>
                    <div className={styles.welcome}>
                        <h1>مرحباً بك 👋</h1>
                        <p>ابدأ مشروعاً جديداً أو اكمل العمل على مشاريعك السابقة</p>
                    </div>
                </header>

                <div className={styles.actionsGrid}>
                    <div className={styles.actionCard} onClick={handleNewProject}>
                        <div className={styles.cardIcon}>
                            <PlusIcon />
                        </div>
                        <div>
                            <div className={styles.cardTitle}>مشروع جديد</div>
                            <p className={styles.cardDesc}>ابدأ مشروعاً فارغاً وأضف الفيديو والصوت</p>
                        </div>
                    </div>

                    <div className={styles.actionCard} onClick={handleOpenProject}>
                        <div className={styles.cardIcon}>
                            <FolderIcon />
                        </div>
                        <div>
                            <div className={styles.cardTitle}>فتح مشروع</div>
                            <p className={styles.cardDesc}>استعرض ملفاتك وافتح مشروعاً موجوداً</p>
                        </div>
                    </div>

                    <div className={styles.actionCard} onClick={handleImportSRT}>
                        <div className={styles.cardIcon}>
                            <FileTextIcon />
                        </div>
                        <div>
                            <div className={styles.cardTitle}>استيراد ترجمة</div>
                            <p className={styles.cardDesc}>افتح ملف SRT سابق وقم بتعديله</p>
                        </div>
                    </div>
                </div>

                <div className={styles.recentSection}>
                    <h2>المشاريع الأخيرة</h2>
                    <div className={styles.recentGrid}>
                        {MOCK_RECENT_PROJECTS.map((project) => (
                            <div
                                key={project.id}
                                className={styles.recentCard}
                                onClick={() => handleOpenRecent(project.name)}
                            >
                                <div className={styles.recentIcon}>
                                    {project.type === 'video' ? <FolderIcon /> : <FileTextIcon />}
                                </div>
                                <div className={styles.recentInfo}>
                                    <div className={styles.recentName}>{project.name}</div>
                                    <div className={styles.recentDate}>{project.date}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
