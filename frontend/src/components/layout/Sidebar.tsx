'use client'

/**
 * Sidebar Component
 * شريط التنقل الجانبي
 */

import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import styles from './Sidebar.module.css'
import {
    Captions,
    Languages,
    Scissors,
    Sparkles,
    Plus,
    Upload,
    Settings
} from 'lucide-react'

// Wireless Component - No Props Needed
export default function Sidebar() {
    const {
        activePanel,
        setActivePanel,
        setUploadModalOpen,
        setImportModalOpen,
        setSettingsModalOpen,
        isSettingsModalOpen // Optional if we need to show active state
    } = useProjectStore()

    const navItems = [
        {
            id: 'subtitles',
            icon: <Captions size={20} />,
            label: 'Translation',
            labelAr: 'ترجمة',
        },
        {
            id: 'silence',
            icon: <Scissors size={20} />,
            label: 'Silence Remover',
            labelAr: 'إزالة الصمت',
        },
        {
            id: 'enhance',
            icon: <Sparkles size={20} />,
            label: 'Enhance',
            labelAr: 'تحسين',
        },
    ]

    return (
        <aside className={styles.sidebar}>
            {/* Logo */}
            <div className={styles.logoContainer}>
                <div className={styles.logoIcon}>
                    <ManaraIcon />
                </div>
            </div>

            {/* Upload Button */}
            <button
                className={styles.uploadBtn}
                onClick={() => setUploadModalOpen(true)}
                title="رفع ملف - Upload"
            >
                <Plus size={24} />
            </button>

            {/* Import SRT Button */}
            <button
                className={styles.importBtn}
                onClick={() => setImportModalOpen(true)}
                title="استيراد ترجمة - Import SRT"
            >
                <Upload size={20} />
            </button>

            {/* Navigation */}
            <nav className={styles.nav}>
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        className={`${styles.navItem} ${activePanel === item.id ? styles.active : ''}`}
                        onClick={() => setActivePanel(item.id as any)}
                        title={item.labelAr}
                    >
                        {item.icon}
                        <span className={styles.navLabel}>{item.labelAr}</span>
                    </button>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className={styles.bottomSection}>
                <button
                    className={`${styles.navItem} ${isSettingsModalOpen ? styles.active : ''}`}
                    title="الإعدادات"
                    onClick={() => setSettingsModalOpen(true)}
                >
                    <Settings size={20} />
                </button>
            </div>
        </aside>
    )
}

// Icons
const ManaraIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path
            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="url(#gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <defs>
            <linearGradient id="gradient" x1="2" y1="2" x2="22" y2="22">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#a855f7" />
            </linearGradient>
        </defs>
    </svg>
)
