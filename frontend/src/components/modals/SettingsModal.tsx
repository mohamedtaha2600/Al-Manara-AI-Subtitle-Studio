'use client'

/**
 * Settings Modal Component
 * نافذة الإعدادات
 */

import { useState, useEffect } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { getApiUrl } from '@/utils/config'
import styles from './SettingsModal.module.css'
import { Info } from 'lucide-react'

interface ModelInfo {
    id: string
    name: string
    desc: string
}

export default function SettingsModal() {
    const [activeTab, setActiveTab] = useState<'general' | 'system' | 'paths' | 'setup' | 'about'>('general')

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
        engineSource,
        localModelPath,
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
    const [checkResult, setCheckResult] = useState<any>(null)
    const [isOnline, setIsOnline] = useState(false)

    useEffect(() => {
        setIsOnline(window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
    }, [])

    useEffect(() => {
        if (isSettingsModalOpen && activeTab === 'general') {
            fetchModels()
        }
    }, [isSettingsModalOpen, activeTab])

    const fetchModels = async () => {
        try {
            setIsLoading(true)
            const res = await fetch(getApiUrl('models', engineSource))
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

    const handleReqCheck = async () => {
        try {
            setCheckingReqs(true)
            setCheckResult(null)
            const sourceLabel = engineSource === 'local' ? 'الجهاز المحلي' : 'السيرفر السحابي'
            addLog('info', `🔍 جاري فحص موارد ${sourceLabel}...`)
            
            const res = await fetch(getApiUrl('system_check', engineSource))
            if (res.ok) {
                const data = await res.json()
                setCheckResult({ ...data, checkSource: engineSource })
                addLog('success', `✅ تم فحص ${sourceLabel} بنجاح`)
            } else {
                throw new Error('Check failed')
            }
        } catch (error) {
            addLog('error', '❌ فشل الاتصال بالخادم للفحص')
        } finally {
            setCheckingReqs(false)
        }
    }

    const handleDownloadSetup = () => {
        const batContent = `@echo off
title Al-Manara Local Studio Setup
echo 🚀 Starting Al-Manara Local Environment...
echo ------------------------------------------
echo 📂 Checking Directories...
if not exist "models" mkdir "models"
if not exist "temp" mkdir "temp"

echo 🐍 Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found! Please install Python 3.10+
    pause
    exit
)

echo 📦 Installing Dependencies...
pip install faster-whisper torch psutil fastapi uvicorn

echo 🤖 Downloading Preferred Model (Medium)...
echo Please wait, this might take a few minutes...

echo ✅ System Ready!
echo 🌐 Local Server starting on http://localhost:8000
python backend/app/main.py
pause`

        const blob = new Blob([batContent], { type: 'text/plain' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'AlManara_Local_Setup.bat'
        a.click()
        window.URL.revokeObjectURL(url)
        addLog('success', '✅ تم تحميل ملف الإعداد المحلي')
    }

    if (!isSettingsModalOpen) return null

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

                {/* Header Area */}
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <div className={styles.iconBox}>
                            <SettingsIcon />
                        </div>
                        <div className={styles.titleInfo}>
                            <h2>الإعدادات - Studio Settings</h2>
                            <p>تخصيص محرك النسخ والواجهة</p>
                        </div>
                    </div>
                    
                    <div className={styles.headerActions}>
                        <div className={`${styles.envBadge} ${isOnline ? styles.onlineBadge : styles.localBadge}`}>
                            {isOnline ? '🌐 Cloud Engine' : '💻 Local Studio' }
                        </div>
                        <button className={styles.closeBtn} onClick={handleClose}>
                            <CloseIcon />
                        </button>
                    </div>
                </div>

                <div className={styles.modalBody}>
                    {/* Sidebar Tabs */}
                    <div className={styles.sidebar}>
                        <button
                            className={`${styles.sideTab} ${activeTab === 'general' ? styles.activeSideTab : ''}`}
                            onClick={() => setActiveTab('general')}
                        >
                            <ModelIcon /> النماذج الذكية
                        </button>
                        <button
                            className={`${styles.sideTab} ${activeTab === 'system' ? styles.activeSideTab : ''}`}
                            onClick={() => setActiveTab('system')}
                        >
                            <SystemIcon /> النظام والأداء
                        </button>
                        <button
                            className={`${styles.sideTab} ${activeTab === 'paths' ? styles.activeSideTab : ''}`}
                            onClick={() => setActiveTab('paths')}
                        >
                            <PathIcon /> مسارات العمل
                        </button>
                        <button
                            className={`${styles.sideTab} ${activeTab === 'setup' ? styles.activeSideTab : ''}`}
                            onClick={() => setActiveTab('setup')}
                        >
                            <SystemIcon /> إعداد محلي
                        </button>
                        <button
                            className={`${styles.sideTab} ${activeTab === 'about' ? styles.activeSideTab : ''}`}
                            onClick={() => setActiveTab('about')}
                        >
                            <AboutIcon /> حول المنارة
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className={styles.mainArea}>
                        {/* GENERAL TAB (Models) */}
                        {activeTab === 'general' && (
                            <div className={styles.section}>
                                <div className={styles.sectionHeader}>
                                    <h3>اختيار محرك الذكاء الاصطناعي</h3>
                                    <p>تحكم في دقة وسرعة النسخ التلقائي</p>
                                </div>

                                {!isOnline && (
                                    <div className={styles.localNotice}>
                                        <Info size={16} />
                                        <span>تعمل الآن محلياً، تأكد من وجود الموديلات في مجلد <code>models/</code></span>
                                    </div>
                                )}

                                {isLoading ? (
                                    <div className={styles.loadingState}>
                                        <div className="spinner-small" />
                                        <span>جاري فحص الموديلات...</span>
                                    </div>
                                ) : (
                                    <div className={styles.optionsGrid}>
                                        {(availableModels.length > 0 ? availableModels : [
                                            { id: 'tiny', name: 'Tiny (سريع جداً)', desc: 'الأسرع، دقة مقبولة للمسودات' },
                                            { id: 'base', name: 'Base (متوازن)', desc: 'توازن جيد بين السرعة والدقة' },
                                            { id: 'small', name: 'Small (دقيق)', desc: 'دقة عالية، يتطلب ذاكرة متوسطة' },
                                            { id: 'medium', name: 'Medium (احترافي)', desc: 'الخيار الأفضل للغة العربية' },
                                            { id: 'large-v3', name: 'Large V3 (أقصى دقة)', desc: 'الأكثر دقة، يتطلب كارت شاشة قوي' }
                                        ]).map(model => {
                                            const isInstalled = isOnline || installedModels.includes(model.id)
                                            const isSelected = preferredModel === model.id

                                            return (
                                                <div
                                                    key={model.id}
                                                    className={`${styles.modelCard} ${isSelected ? styles.selectedModel : ''} ${!isInstalled ? styles.notInstalled : ''}`}
                                                    onClick={() => isInstalled && setPreferredModel(model.id)}
                                                >
                                                    <div className={styles.modelInfo}>
                                                        <span className={styles.modelName}>{model.name}</span>
                                                        <span className={styles.modelDesc}>{model.desc}</span>
                                                    </div>
                                                    <div className={styles.modelStatus}>
                                                        {isSelected ? 'فعال ✓' : (isInstalled ? 'مثبت' : 'غير موجود')}
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
                                <div className={styles.sectionHeader}>
                                    <h3>تفضيلات النظام</h3>
                                    <p>تحسين تجربة الاستخدام وأداء الجهاز</p>
                                </div>

                                <div className={styles.settingsList}>
                                    {/* Engine Source Selector */}
                                    <div className={styles.settingNode}>
                                        <div className={styles.nodeInfo}>
                                            <span className={styles.nodeLabel}>محرك المعالجة (Processing Engine)</span>
                                            <span className={styles.nodeDesc}>اختر المكان الذي سيتم فيه تشغيل نماذج الذكاء الاصطناعي</span>
                                        </div>
                                        <div className={styles.engineToggleGroup}>
                                            <button 
                                                className={`${styles.engineBtn} ${engineSource === 'local' ? styles.activeEngine : ''}`}
                                                onClick={() => setSystemSetting('engineSource', 'local')}
                                            >
                                                💻 محلي
                                            </button>
                                            <button 
                                                className={`${styles.engineBtn} ${engineSource === 'cloud' ? styles.activeEngine : ''}`}
                                                onClick={() => setSystemSetting('engineSource', 'cloud')}
                                            >
                                                🌐 سحابي
                                            </button>
                                        </div>
                                    </div>

                                    <div className={styles.settingNode}>
                                        <div className={styles.nodeInfo}>
                                            <span className={styles.nodeLabel}>تسريع العتاد (GPU Acceleration)</span>
                                            <span className={styles.nodeDesc}>استخدام كارت الشاشة NVIDIA لزيادة سرعة النسخ</span>
                                        </div>
                                        <Toggle active={gpuEnabled} onClick={() => setSystemSetting('gpuEnabled', !gpuEnabled)} />
                                    </div>

                                    <div className={styles.settingNode}>
                                        <div className={styles.nodeInfo}>
                                            <span className={styles.nodeLabel}>الوضع التوربيني (Turbo Mode)</span>
                                            <span className={styles.nodeDesc}>زيادة سرعة المعالجة مع الحفاظ على الدقة</span>
                                        </div>
                                        <Toggle active={performanceMode === 'speed'} onClick={() => setSystemSetting('performanceMode', performanceMode === 'speed' ? 'accuracy' : 'speed')} />
                                    </div>

                                    <div className={styles.settingNode}>
                                        <div className={styles.nodeInfo}>
                                            <span className={styles.nodeLabel}>التنظيف التلقائي (Auto Cleanup)</span>
                                            <span className={styles.nodeDesc}>حذف الملفات المؤقتة تلقائياً عند إنهاء المشروع</span>
                                        </div>
                                        <Toggle active={autoCleanup} onClick={() => setSystemSetting('autoCleanup', !autoCleanup)} />
                                    </div>

                                    <button className={styles.checkBtn} onClick={handleReqCheck} disabled={checkingReqs}>
                                        {checkingReqs ? 'جاري الفحص...' : 'فحص متطلبات النظام (System Check)'}
                                    </button>

                                    {checkResult && (
                                        <div className={styles.resultsDashboard}>
                                            <div className={styles.checkSourceLabel}>
                                                فحص لـ: {checkResult.checkSource === 'local' ? '💻 الجهاز المحلي' : '🌐 السيرفر السحابي'}
                                            </div>
                                            <div className={styles.resItem}>
                                                <span className={styles.resLabel}>GPU (كارت الشاشة)</span>
                                                <span className={checkResult.gpu.available ? styles.resValueSuccess : styles.resValueWarn}>
                                                    {checkResult.gpu.available ? `${checkResult.gpu.name} (${checkResult.gpu.vram})` : 'غير متوفر (CPU Mode)'}
                                                </span>
                                            </div>
                                            <div className={styles.resGrid}>
                                                <div className={styles.resItem}>
                                                    <span className={styles.resLabel}>Memory (الرام)</span>
                                                    <span className={styles.resValue}>{checkResult.memory.available} / {checkResult.memory.total}</span>
                                                </div>
                                                <div className={styles.resItem}>
                                                    <span className={styles.resLabel}>Disk (المساحة)</span>
                                                    <span className={styles.resValue}>{checkResult.disk.free} متوفر</span>
                                                </div>
                                            </div>
                                            <div className={styles.resItem}>
                                                 <span className={styles.resLabel}>Environment (البيئة)</span>
                                                 <span className={styles.resValue}>Python {checkResult.python} | {checkResult.os}</span>
                                             </div>

                                             {checkResult.dependencies && (
                                                 <div className={styles.dependencyList}>
                                                     <span className={styles.resLabel}>Dependencies (المكتبات)</span>
                                                     <div className={styles.depGrid}>
                                                         {Object.entries(checkResult.dependencies).map(([name, installed]) => (
                                                             <div key={name} className={`${styles.depTag} ${installed ? styles.depOk : styles.depMissing}`}>
                                                                 {name}: {installed ? 'مثبت ✓' : 'مفقود ✗'}
                                                             </div>
                                                         ))}
                                                     </div>
                                                 </div>
                                             )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* PATHS TAB */}
                        {activeTab === 'paths' && (
                            <div className={styles.section}>
                                <div className={styles.sectionHeader}>
                                    <h3>مسارات التخزين</h3>
                                    <p>تحديد أماكن حفظ الملفات المؤقتة والنهائية</p>
                                </div>

                                <div className={styles.inputStack}>
                                    <div className={styles.fieldGroup}>
                                        <label>مسار الموديلات (AI Models Path)</label>
                                        <input
                                            type="text"
                                            value={localModelPath}
                                            onChange={(e) => setSystemSetting('localModelPath', e.target.value)}
                                            placeholder="./models"
                                        />
                                        <p className={styles.fieldHint}>المجلد الذي سيتم تحميل وحفظ نماذج الذكاء الاصطناعي فيه</p>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <label>مجلد الملفات المؤقتة (Temp Path)</label>
                                        <input
                                            type="text"
                                            value={tempPath}
                                            onChange={(e) => setSystemSetting('tempPath', e.target.value)}
                                            placeholder="./temp_data"
                                        />
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <label>مجلد التصدير الافتراضي (Output)</label>
                                        <input
                                            type="text"
                                            value={outputPath}
                                            onChange={(e) => setSystemSetting('outputPath', e.target.value)}
                                            placeholder="Source Directory"
                                        />
                                        <p className={styles.fieldHint}>اكتب 'source' لحفظ النتائج بجانب الفيديو الأصلي</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SETUP TAB */}
                        {activeTab === 'setup' && (
                            <div className={styles.section}>
                                <div className={styles.sectionHeader}>
                                    <h3>إعداد الاستوديو المحلي (Local Studio)</h3>
                                    <p>حوّل متصفحك إلى استوديو احترافي يعمل بقدرات جهازك الشخصي</p>
                                </div>
                                
                                <div className={styles.setupCard}>
                                    <div className={styles.setupSteps}>
                                        <div className={styles.step}>
                                            <div className={styles.stepNum}>1</div>
                                            <div className={styles.stepContent}>
                                                <h4>تحميل ملف التشغيل</h4>
                                                <p>قم بتحميل ملف <code>PAT.bat</code> الذي يحتوي على أوامر الإعداد التلقائي.</p>
                                            </div>
                                        </div>
                                        <div className={styles.step}>
                                            <div className={styles.stepNum}>2</div>
                                            <div className={styles.stepContent}>
                                                <h4>التثبيت والتشغيل</h4>
                                                <p>قم بتشغيل الملف كمسؤول (Run as Admin) ليقوم بتجهيز بيئة Python والموديلات.</p>
                                            </div>
                                        </div>
                                        <div className={styles.step}>
                                            <div className={styles.stepNum}>3</div>
                                            <div className={styles.stepContent}>
                                                <h4>الاتصال بالاستوديو</h4>
                                                <p>بمجرد ظهور رسالة "System Ready"، سيتم ربط المتصفح بموارد جهازك تلقائياً.</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button className={styles.downloadSetupBtn} onClick={handleDownloadSetup}>
                                        <DownloadIcon />
                                        <span>تحميل ملف الإعداد (Auto-Setup Script)</span>
                                    </button>

                                    <div className={styles.setupNote}>
                                        💡 ملاحظة: هذا الخيار مثالي إذا كنت تريد استخدام كارت الشاشة الخاص بك لتوفير الوقت والمال.
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ABOUT TAB */}
                        {activeTab === 'about' && (
                            <div className={styles.aboutContainer}>
                                <div className={styles.aboutBrand}>
                                    <ManaraIcon />
                                    <h3>Al-Manara Creative Suite</h3>
                                    <span className={styles.version}>v2.5.0 Professional Edition</span>
                                </div>
                                <div className={styles.aboutDetails}>
                                    <p>نظام "المنارة" هو استوديو متكامل يعمل بالذكاء الاصطناعي لتبسيط عملية صناعة المحتوى المرئي، من خلال أدوات ترجمة ونسخ وتحليل متطورة.</p>
                                    <div className={styles.credits}>
                                        <span>تم التطوير بواسطة:</span>
                                        <strong>Mohamed Taha & Al-Manara Team</strong>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// Subcomponents & Icons
function Toggle({ active, onClick }: { active: boolean, onClick: () => void }) {
    return (
        <div className={styles.toggle} data-active={active} onClick={onClick}>
            <div className={styles.toggleHandle} />
        </div>
    )
}

const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
)

const ModelIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
)

const SystemIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>
)

const PathIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
)

const AboutIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
)

const SettingsIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
)

const ManaraIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const DownloadIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
)
