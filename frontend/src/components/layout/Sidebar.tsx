'use client'

import { useProjectStore } from '@/store/useProjectStore'
import styles from './Sidebar.module.css'
import {
    Captions,
    Scissors,
    Sparkles,
    Plus,
    Upload,
    Download,
    LayoutDashboard
} from 'lucide-react'

export default function Sidebar() {
    const {
        activePanel,
        setActivePanel,
        setUploadModalOpen,
        setImportModalOpen,
        setExportModalOpen,
        setCurrentView,
        currentView
    } = useProjectStore()

    const navItems = [
        {
            id: 'subtitles',
            icon: <Captions size={22} />,
            labelAr: 'ترجمة',
        },
        {
            id: 'silence',
            icon: <Scissors size={22} />,
            labelAr: 'قص',
        },
        {
            id: 'enhance',
            icon: <Sparkles size={22} />,
            labelAr: 'تحسين',
            isComingSoon: true
        },
    ]

    return (
        <aside className={styles.sidebar} suppressHydrationWarning>
            {/* Logo / Home */}
            <div className={styles.logoContainer} onClick={() => setCurrentView('dashboard')} style={{ cursor: 'pointer' }}>
                <ManaraIcon />
            </div>

            {/* Main Action - New Project */}
            <button
                className={styles.uploadBtn}
                onClick={() => {
                    setCurrentView('dashboard');
                    // In dashboard, handleNewProject will be called or just stay there
                }}
                title="الرئيسية"
            >
                <LayoutDashboard size={24} />
            </button>

            {currentView !== 'dashboard' && (
                <>
                    <div style={{ width: '40px', height: '1px', background: 'rgba(255,255,255,0.05)', margin: '10px 0' }} />

                    {/* Editor Actions */}
                    <button
                        className={styles.importBtn}
                        onClick={() => setUploadModalOpen(true)}
                        title="رفع فيديو جديد"
                    >
                        <Plus size={22} />
                    </button>

                    {activePanel === 'subtitles' && (
                        <button
                            className={styles.importBtn}
                            onClick={() => setImportModalOpen(true)}
                            title="استيراد ترجمة"
                            style={{ marginTop: '5px' }}
                        >
                            <Upload size={18} />
                        </button>
                    )}

                    <div style={{ width: '40px', height: '1px', background: 'rgba(255,255,255,0.05)', margin: '10px 0' }} />
                </>
            )}

            {/* Tool Sections */}
            <nav className={styles.nav}>
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        className={`
                            ${styles.navItem} 
                            ${activePanel === item.id ? styles.active : ''}
                            ${item.isComingSoon ? styles.comingSoon : ''}
                        `}
                        onClick={() => !item.isComingSoon && setActivePanel(item.id as any)}
                        title={item.isComingSoon ? 'جاري التطوير - قريباً' : item.labelAr}
                        disabled={item.isComingSoon}
                    >
                        {item.icon}
                        <span className={styles.navLabel}>{item.labelAr}</span>
                        {item.isComingSoon && (
                            <span className={styles.badge}>قريباً</span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className={styles.bottomSection}>
                <button
                    className={styles.navItem}
                    title="تصدير"
                    onClick={() => setExportModalOpen(true)}
                >
                    <Download size={22} />
                    <span className={styles.navLabel}>تصدير</span>
                </button>
            </div>
        </aside>
    )
}

const ManaraIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <path
            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)
