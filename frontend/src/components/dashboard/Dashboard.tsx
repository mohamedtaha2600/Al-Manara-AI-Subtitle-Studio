'use client'

import { useState, useEffect } from 'react'
import styles from './Dashboard.module.css'
import { useProjectStore } from '@/store/useProjectStore'
import Sidebar from '@/components/layout/Sidebar'
import { Plus, Folder, FileText } from 'lucide-react'

interface Project {
    id: string
    name: string
    date: string
    type: 'video' | 'srt'
}

export default function Dashboard() {
    const { setCurrentView, reset, setImportModalOpen, setProjectName, setUploadModalOpen, setSettingsModalOpen } = useProjectStore()
    const [activeTab, setActiveTab] = useState('home')
    const [recentProjects, setRecentProjects] = useState<Project[]>([])

    // Load recent projects from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('almanara_recent_projects')
        if (saved) {
            try {
                setRecentProjects(JSON.parse(saved))
            } catch (e) {
                console.error('Failed to parse recent projects')
            }
        } else {
            // Initial mock data if empty
            const initial: Project[] = [
                { id: '1', name: 'مشروع تجريبي 1', date: 'منذ يومين', type: 'video' },
                { id: '2', name: 'ترجمة سريعة', date: 'أمس', type: 'srt' }
            ]
            setRecentProjects(initial)
            localStorage.setItem('almanara_recent_projects', JSON.stringify(initial))
        }
    }, [])

    const handleNewProject = () => {
        reset()
        setProjectName('مشروع جديد')
        setCurrentView('editor')
    }

    const handleOpenProject = () => {
        // Future: Open local file system project
        setCurrentView('editor')
    }

    const handleImportSRT = () => {
        reset()
        setCurrentView('editor')
    }

    const handleOpenRecent = (project: Project) => {
        setProjectName(project.name)
        setCurrentView('editor')
    }

    return (
        <div className={styles.container}>
            <Sidebar />

            {/* Main Content */}
            <main className={styles.main}>
                <header className={styles.header}>
                    <div className={styles.welcome}>
                        <h1>مرحباً بك 👋</h1>
                        <p>ابدأ رحلتك الإبداعية مع محرك المنارة للذكاء الاصطناعي. تحكم كامل، سرعة فائقة، ودقة لا متناهية.</p>
                    </div>
                </header>

                <div className={styles.actionsGrid}>
                    <div className={styles.actionCard} onClick={handleNewProject}>
                        <div className={styles.cardIcon}>
                            <Plus size={32} />
                        </div>
                        <div>
                            <div className={styles.cardTitle}>مشروع جديد</div>
                            <p className={styles.cardDesc}>ابدأ مشروعاً فارغاً وأضف الفيديو والصوت من جهازك</p>
                        </div>
                    </div>

                    <div className={styles.actionCard} onClick={handleOpenProject}>
                        <div className={styles.cardIcon}>
                            <Folder size={32} />
                        </div>
                        <div>
                            <div className={styles.cardTitle}>فتح مشروع</div>
                            <p className={styles.cardDesc}>استعرض الملفات المحلية وافتح مشروعاً قمت بحفظه سابقاً</p>
                        </div>
                    </div>

                    <div className={styles.actionCard} onClick={handleImportSRT}>
                        <div className={styles.cardIcon}>
                            <FileText size={32} />
                        </div>
                        <div>
                            <div className={styles.cardTitle}>استيراد ترجمة</div>
                            <p className={styles.cardDesc}>ارفع ملف SRT موجود وقم بتنسيقه أو تعديله باحترافية</p>
                        </div>
                    </div>
                </div>

                <div className={styles.recentSection}>
                    <h2>المشاريع الأخيرة</h2>
                    <div className={styles.recentGrid}>
                        {recentProjects.map((project) => (
                            <div
                                key={project.id}
                                className={styles.recentCard}
                                onClick={() => handleOpenRecent(project)}
                            >
                                <div className={styles.recentIcon}>
                                    {project.type === 'video' ? <Folder size={24} /> : <FileText size={24} />}
                                </div>
                                <div className={styles.recentInfo}>
                                    <div className={styles.recentName}>{project.name}</div>
                                    <div className={styles.recentDate}>{project.date}</div>
                                </div>
                                <span className={styles.recentType}>{project.type}</span>
                            </div>
                        ))}
                        {recentProjects.length === 0 && (
                            <p style={{ color: 'rgba(255,255,255,0.2)', padding: '20px' }}>لا توجد مشاريع سابقة حالياً.</p>
                        )}
                    </div>
                </div>

                {/* Cloud Promotion / Guide */}
                <div style={{
                    marginTop: '60px',
                    padding: '40px',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, transparent 100%)',
                    borderRadius: '30px',
                    border: '1px dashed rgba(245, 158, 11, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '30px'
                }}>
                    <div style={{
                        background: '#f59e0b',
                        color: '#000',
                        width: '80px',
                        height: '80px',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem'
                    }}>🚀</div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '10px' }}>قريباً: التخزين السحابي المتكامل</h3>
                        <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                            سنقوم بربط حسابك على Google Drive لتوفير مساحة تخزين تصل إلى 2 تيرا لمشاريعك. 
                            سيتم الاحتفاظ بالملفات الكبيرة لمدة 6 ساعات مجاناً، مع خيار الحفظ الدائم للمشتركين.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}
