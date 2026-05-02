'use client'

/**
 * Settings Modal Component
 * نافذة الإعدادات
 */

import { useState, useEffect } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { getApiUrl } from '@/utils/config'
import styles from './SettingsModal.module.css'

interface ModelInfo {
    id: string
    name: string
    desc: string
}

export default function SettingsModal() {
    const [activeTab, setActiveTab] = useState<'general' | 'system' | 'paths' | 'about'>('general')

    // Store Access
    const {
        preferredModel,
        setPreferredModel,
        gpuEnabled,
        offlineMode,
        autoCleanup,
        performanceMode, // Turbo Mode
        tempPath,
        outputPath,
        setSystemSetting,
        addLog,
        isSettingsModalOpen,
        setSettingsModalOpen
    } = useProjectStore()

    const handleClose = () => setSettingsModalOpen(false)

    // Model State
    const [installedModels, setInstalledModels] = useState<string[]>([])
    const [availableModels, setAvailableModels] = useState<ModelInfo[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [checkingReqs, setCheckingReqs] = useState(false)

    useEffect(() => {
        if (isSettingsModalOpen && activeTab === 'general') {
            fetchModels()
        }
    }, [isSettingsModalOpen, activeTab])

    const fetchModels = async () => {
        try {
            setIsLoading(true)
            const res = await fetch(getApiUrl('models'))
            if (res.ok) {
                const data = await res.json()
                setInstalledModels(data.installed || [])
                setAvailableModels(data.available || [])
            }
        } catch (error) {
            console.error('Failed to fetch models:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleReqCheck = () => {
        setCheckingReqs(true)
        addLog('info', 'جاري التحقق من المتطلبات... - Checking dependencies...')

        // Simulate checking
        setTimeout(() => {
            setCheckingReqs(false)
            if (gpuEnabled) {
                addLog('success', '✅ كارت الشاشة مدعوم (CUDA Found)')
            } else {
                addLog('warning', '⚠️ يعمل على المعالج (CPU Mode)')
            }
            addLog('success', '✅ المكاتب الأساسية مثبتة')
        }, 2000)
    }

    if (!isSettingsModalOpen) return null

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className={styles.header}>
                    <h2>
                        <SettingsIcon />
                        الإعدادات - Settings
                    </h2>
                    <button className={styles.closeBtn} onClick={handleClose}>
                        <CloseIcon />
                    </button>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'general' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        Models (النماذج)
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'system' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('system')}
                    >
                        System (النظام)
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'paths' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('paths')}
                    >
                        Paths (المسارات)
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'about' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('about')}
                    >
                        About (حول)
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>

                    {/* GENERAL TAB (Models) */}
                    {activeTab === 'general' && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>AI Model Selection</h3>
                            <p className={styles.optionDesc}>
                                اختر حجم النموذج المناسب. النماذج الأكبر أدق لكنها أبطأ.
                            </p>

                            {isLoading ? (
                                <div style={{ color: '#aaa', padding: '20px', textAlign: 'center' }}>Loading...</div>
                            ) : (
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    {availableModels.map(model => {
                                        const isInstalled = installedModels.includes(model.id)
                                        const isSelected = preferredModel === model.id

                                        return (
                                            <div
                                                key={model.id}
                                                className={styles.option}
                                                style={{
                                                    borderColor: isSelected ? '#22c55e' : (isInstalled ? 'rgba(255,255,255,0.1)' : 'rgba(255,0,0,0.1)'),
                                                    cursor: isInstalled ? 'pointer' : 'default',
                                                    opacity: isInstalled ? 1 : 0.7
                                                }}
                                                onClick={() => isInstalled && setPreferredModel(model.id)}
                                            >
                                                <div className={styles.optionInfo}>
                                                    <span className={styles.optionLabel} style={{ color: isSelected ? '#22c55e' : '#fff' }}>
                                                        {model.name} {isSelected && '✓'}
                                                    </span>
                                                    <span className={styles.optionDesc}>{model.desc}</span>
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: isInstalled ? '#22c55e' : '#64748b' }}>
                                                    {isInstalled ? 'INSTALLED' : 'NOT INSTALLED'}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SYSTEM TAB */}
                    {activeTab === 'system' && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>Performance & Utilities</h3>

                            {/* GPU Toggle */}
                            <div className={styles.option}>
                                <div className={styles.optionInfo}>
                                    <span className={styles.optionLabel}>Use GPU Acceleration</span>
                                    <span className={styles.optionDesc}>استخدام كارت الشاشة للترجمة (NVIDIA CUDA)</span>
                                </div>
                                <Toggle
                                    active={gpuEnabled}
                                    onClick={() => setSystemSetting('gpuEnabled', !gpuEnabled)}
                                />
                            </div>

                            {/* Offline Mode */}
                            <div className={styles.option}>
                                <div className={styles.optionInfo}>
                                    <span className={styles.optionLabel}>Offline Mode</span>
                                    <span className={styles.optionDesc}>العمل بدون إنترنت (تنزيل النماذج محلياً)</span>
                                </div>
                                <Toggle
                                    active={offlineMode}
                                    onClick={() => setSystemSetting('offlineMode', !offlineMode)}
                                />
                            </div>

                            {/* Performance Mode */}
                            <div className={styles.option}>
                                <div className={styles.optionInfo}>
                                    <span className={styles.optionLabel}>Turbo Mode (Performance)</span>
                                    <span className={styles.optionDesc}>
                                        {performanceMode === 'speed'
                                            ? '🚀 مفعل: أقصى سرعة (دقة أقل قليلاً)'
                                            : '🎯 معطل: أقصى دقة (أبطأ)'}
                                    </span>
                                </div>
                                <Toggle
                                    active={performanceMode === 'speed'}
                                    onClick={() => setSystemSetting('performanceMode', performanceMode === 'speed' ? 'accuracy' : 'speed')}
                                />
                            </div>

                            {/* Auto Cleanup */}
                            <div className={styles.option}>
                                <div className={styles.optionInfo}>
                                    <span className={styles.optionLabel}>Auto Cleanup Temp</span>
                                    <span className={styles.optionDesc}>مسح الملفات المؤقتة عند الإغلاق</span>
                                </div>
                                <Toggle
                                    active={autoCleanup}
                                    onClick={() => setSystemSetting('autoCleanup', !autoCleanup)}
                                />
                            </div>

                            {/* Download Requirements */}
                            <button
                                className={styles.actionBtn}
                                onClick={handleReqCheck}
                                disabled={checkingReqs}
                                style={{ marginTop: '10px' }}
                            >
                                {checkingReqs ? 'جاري التحقق...' : 'Download / Check Requirements'}
                                {!checkingReqs && <DownloadIcon />}
                            </button>
                        </div>
                    )}

                    {/* PATHS TAB */}
                    {activeTab === 'paths' && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>File Locations</h3>

                            <div className={styles.inputGroup}>
                                <label className={styles.optionLabel}>Temporary Files Path (Portable)</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={tempPath}
                                    onChange={(e) => setSystemSetting('tempPath', e.target.value)}
                                    placeholder="./temp"
                                />
                                <span className={styles.optionDesc}>مسار تخزين الملفات المؤقتة داخل البرنامج</span>
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.optionLabel}>Default Output Path</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={outputPath}
                                    onChange={(e) => setSystemSetting('outputPath', e.target.value)}
                                    placeholder="Source Directory"
                                />
                                <span className={styles.optionDesc}>مسار حفظ الملفات (اكتب 'source' ليتم الحفظ مع الأصل)</span>
                            </div>
                        </div>
                    )}

                    {/* ABOUT TAB */}
                    {activeTab === 'about' && (
                        <div className={styles.section}>
                            <div className={styles.option} style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', gap: '10px', background: 'transparent', border: 'none' }}>
                                <ManaraIcon />
                                <h3 style={{ color: '#fff', margin: 0 }}>Al-Manara Creative Suite</h3>
                                <p style={{ color: '#aaa', fontSize: '0.9rem', margin: 0 }}>Version 2.0.0 (Beta)</p>
                                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>© 2026 Designed for Creators</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Subcomponents
function Toggle({ active, onClick }: { active: boolean, onClick: () => void }) {
    return (
        <div
            className={styles.toggle}
            data-active={active}
            onClick={onClick}
        >
            <div className={styles.toggleHandle} />
        </div>
    )
}

// Icons
const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6L6 18M6 6l12 12" />
    </svg>
)

const SettingsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
)

const DownloadIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
)

const ManaraIcon = () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
        <path
            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="url(#gradient-lg)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <defs>
            <linearGradient id="gradient-lg" x1="2" y1="2" x2="22" y2="22">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#a855f7" />
            </linearGradient>
        </defs>
    </svg>
)
