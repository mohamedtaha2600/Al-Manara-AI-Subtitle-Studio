'use client'

import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { generateSRT, generateVTT, generateTXT } from '@/utils/subtitleUtils'
import styles from './ExportModal.module.css'
import { API_BASE_URL } from '@/utils/config'
import { 
    X, 
    Download, 
    Share2, 
    FileText, 
    Globe, 
    FileCode, 
    Video, 
    Zap, 
    Trash2, 
    Scissors,
    Monitor,
    Flame,
    CheckCircle2,
    Info
} from 'lucide-react'

export default function ExportModal() {
    const {
        activePanel,
        segments: globalSegments,
        videoFile,
        projectName,
        tracks,
        activeTrackId,
        isExportModalOpen,
        setExportModalOpen,
        isVideoUploading,
        setExportProgressModalOpen,
        detectedSilence,
        exportWithoutSilence
    } = useProjectStore()

    const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)
    const [isExporting, setIsExporting] = useState(false)
    const [isCleaning, setIsCleaning] = useState(false)
    const [isCleaned, setIsCleaned] = useState(false)

    // Determine available tracks
    const availableTracks = (tracks && tracks.length > 0)
        ? tracks
        : [{ id: 'default', name: 'Original', language: 'auto', segments: globalSegments }]

    // Logic to select effective track
    const storeActiveTrack = availableTracks.find(t => t.id === activeTrackId)
    const arabicTrack = availableTracks.find(t => t.id?.includes('ar') || t.language === 'ar')
    const defaultTrack = storeActiveTrack || arabicTrack || availableTracks[0]

    const effectiveTrack = availableTracks.find(t => t.id === selectedTrackId) || defaultTrack
    const availableSegments = effectiveTrack?.segments || globalSegments

    const handleClose = () => setExportModalOpen(false)

    const handleDownload = (format: 'srt' | 'vtt' | 'txt') => {
        let content = ''
        let mime = 'text/plain'

        switch (format) {
            case 'srt':
                content = generateSRT(availableSegments)
                mime = 'application/x-subrip'
                break
            case 'vtt':
                content = generateVTT(availableSegments)
                mime = 'text/vtt'
                break
            case 'txt':
                content = generateTXT(availableSegments)
                break
        }

        const blob = new Blob([content], { type: mime })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')

        const trackName = effectiveTrack.language || 'sub'
        const base = projectName || (videoFile?.name.split('.')[0] || 'subtitles')
        const baseName = `${base}_${trackName}`

        a.href = url
        a.download = `${baseName}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const handleRemoteExport = async (format: 'xml' | 'fcpxml' | 'burn-in') => {
        if (!videoFile?.id) return

        setIsExporting(true)
        try {
            const response = await fetch(`${API_BASE_URL}/export/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    segments: availableSegments,
                    video_id: videoFile.id,
                    format: format,
                })
            })

            if (response.ok) {
                const data = await response.json()
                
                if (format === 'burn-in' && data.job_id) {
                    setExportProgressModalOpen(true, data.job_id, 'burn-in')
                    setExportModalOpen(false)
                } else if (data.downloadUrl) {
                    const finalUrl = data.downloadUrl.startsWith('http') 
                        ? data.downloadUrl 
                        : `${API_BASE_URL.replace('/api', '')}${data.downloadUrl}`;
                    window.open(finalUrl, '_blank')
                }
            } else {
                const err = await response.json()
                alert(`خطأ في التصدير: ${err.detail || 'حدث خطأ غير معروف'}`)
            }
        } catch (error) {
            console.error('Remote export failed:', error)
            alert('حدث خطأ أثناء الاتصال بالسيرفر')
        } finally {
            setIsExporting(false)
        }
    }

    const handleCleanup = async () => {
        if (!videoFile?.id) return

        setIsCleaning(true)
        try {
            const response = await fetch(`${API_BASE_URL}/cleanup/project/${videoFile.id}`, {
                method: 'POST'
            })
            if (response.ok) {
                setIsCleaned(true)
            }
        } catch (error) {
            console.error('Cleanup failed:', error)
        } finally {
            setIsCleaning(false)
        }
    }

    if (!isExportModalOpen) return null

    const isSilenceMode = activePanel === 'silence'
    const hasVideo = !!videoFile
    const hasSubtitles = availableSegments.length > 0
    const hasSilence = detectedSilence.length > 0

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()} dir="rtl">
                
                {/* Header Section */}
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <div className={styles.iconBox}>
                            <Share2 size={24} />
                        </div>
                        <div className={styles.titleInfo}>
                            <h2>{isSilenceMode ? 'تصدير الفيديو النظيف' : 'تصدير المشروع'}</h2>
                            <p>{isSilenceMode ? 'تصدير الفيديو بعد إزالة السكتات' : 'اختر صيغة التصدير المناسبة لعملك'}</p>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={handleClose} title="إغلاق">
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {!hasVideo ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}><Video size={48} /></div>
                            <h3>لا يوجد ملف فيديو متاح</h3>
                            <p>يرجى رفع ملف فيديو أو البدء بمشروع جديد لتتمكن من التصدير.</p>
                            <button className={styles.emptyBtn} onClick={handleClose}>فهمت</button>
                        </div>
                    ) : (
                        <div className={styles.mainContent}>
                            
                            {/* 1. Silence Mode Export Options */}
                            {isSilenceMode ? (
                                <div className={styles.section}>
                                    <div className={styles.sectionHeader}>
                                        <div className={styles.sectionIcon}><Zap size={18} /></div>
                                        <h3>تصدير معالجة الصمت</h3>
                                    </div>
                                    
                                    <div className={styles.infoCard}>
                                        <Info size={18} />
                                        <p>سيتم إنتاج فيديو جديد بحذف <strong>{detectedSilence.length}</strong> منطقة صامتة تم العثور عليها.</p>
                                    </div>

                                    {!hasSilence ? (
                                        <div className={styles.warningBox}>
                                            لم يتم العثور على مناطق صامتة بعد. يرجى ضبط الإعدادات للبدء.
                                        </div>
                                    ) : (
                                        <div className={styles.actionGrid}>
                                            <button 
                                                className={styles.primaryExportBtn}
                                                onClick={() => exportWithoutSilence()}
                                            >
                                                <div className={styles.btnContent}>
                                                    <Video size={24} />
                                                    <div className={styles.btnText}>
                                                        <span>تصدير فيديو عالي الجودة</span>
                                                        <small>بدون فراغات (MP4/MOV)</small>
                                                    </div>
                                                </div>
                                                <div className={styles.btnArrow}>→</div>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* 2. Subtitle Mode Export Options */
                                <div className={styles.section}>
                                    <div className={styles.sectionHeader}>
                                        <div className={styles.sectionIcon}><FileText size={18} /></div>
                                        <h3>تصدير ملفات الترجمة</h3>
                                    </div>

                                    {!hasSubtitles ? (
                                        <div className={styles.warningBox}>
                                            لا توجد نصوص ترجمة لتصديرها. يرجى إنشاء ترجمة أولاً.
                                        </div>
                                    ) : (
                                        <>
                                            {availableTracks.length > 1 && (
                                                <div className={styles.trackSelector}>
                                                    <span className={styles.label}>اختر المسار</span>
                                                    <div className={styles.trackList}>
                                                        {availableTracks.map(track => (
                                                            <button
                                                                key={track.id}
                                                                onClick={() => setSelectedTrackId(track.id)}
                                                                className={`${styles.trackChip} ${effectiveTrack.id === track.id ? styles.activeTrack : ''}`}
                                                            >
                                                                {track.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className={styles.formatGrid}>
                                                <div className={styles.formatCard} onClick={() => handleDownload('srt')}>
                                                    <div className={styles.formatIcon}><FileCode size={24} color="#f59e0b" /></div>
                                                    <div className={styles.formatInfo}>
                                                        <span className={styles.formatName}>SRT Standard</span>
                                                        <span className={styles.formatDesc}>الصيغة القياسية للأفلام واليوتيوب</span>
                                                    </div>
                                                    <Download size={16} className={styles.dlIcon} />
                                                </div>

                                                <div className={styles.formatCard} onClick={() => handleDownload('vtt')}>
                                                    <div className={styles.formatIcon}><Globe size={24} color="#3b82f6" /></div>
                                                    <div className={styles.formatInfo}>
                                                        <span className={styles.formatName}>VTT Web</span>
                                                        <span className={styles.formatDesc}>متوافقة مع مشغلات الويب الحديثة</span>
                                                    </div>
                                                    <Download size={16} className={styles.dlIcon} />
                                                </div>

                                                <div className={styles.formatCard} onClick={() => handleDownload('txt')}>
                                                    <div className={styles.formatIcon}><FileText size={24} color="#ef4444" /></div>
                                                    <div className={styles.formatInfo}>
                                                        <span className={styles.formatName}>TXT Plain</span>
                                                        <span className={styles.formatDesc}>نص مجرد بدون توقيتات زمنية</span>
                                                    </div>
                                                    <Download size={16} className={styles.dlIcon} />
                                                </div>

                                                <div className={styles.formatCard} onClick={() => handleRemoteExport('xml')}>
                                                    <div className={styles.formatIcon}><Monitor size={24} color="#8b5cf6" /></div>
                                                    <div className={styles.formatInfo}>
                                                        <span className={styles.formatName}>Adobe Premiere</span>
                                                        <span className={styles.formatDesc}>ملف XML جاهز لبرامج المونتاج</span>
                                                    </div>
                                                    <Download size={16} className={styles.dlIcon} />
                                                </div>
                                            </div>

                                            <div className={styles.divider} />

                                            <div className={styles.burnSection}>
                                                <div className={styles.burnInfo}>
                                                    <div className={styles.burnTitle}>
                                                        <Flame size={20} color="#f59e0b" />
                                                        <h3>حرق الترجمة (Hard-code)</h3>
                                                    </div>
                                                    <p>دمج الترجمة داخل الفيديو بشكل دائم بأعلى جودة ممكنة.</p>
                                                </div>
                                                <button 
                                                    className={styles.burnBtn}
                                                    onClick={() => handleRemoteExport('burn-in')}
                                                    disabled={isExporting || isVideoUploading}
                                                >
                                                    {isExporting ? 'جاري المعالجة...' : 'بدء الحرق الآن'}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Cleanup Section */}
                            <div className={styles.cleanupSection}>
                                <div className={styles.cleanupInfo}>
                                    <h4>إنهاء العمل</h4>
                                    <p>حذف جميع الملفات المرفوعة والمؤقتة من السيرفر.</p>
                                </div>
                                <button
                                    className={`${styles.cleanupBtn} ${isCleaned ? styles.cleaned : ''}`}
                                    onClick={handleCleanup}
                                    disabled={isCleaning || isCleaned}
                                >
                                    {isCleaning ? 'جاري التنظيف...' : isCleaned ? <><CheckCircle2 size={16} /> تم الحذف</> : <><Trash2 size={16} /> تنظيف السيرفر</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
