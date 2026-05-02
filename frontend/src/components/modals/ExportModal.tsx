'use client'

import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { generateSRT, generateVTT, generateTXT } from '@/utils/subtitleUtils'
import styles from './ExportModal.module.css'
import { API_BASE_URL } from '@/utils/config'

export default function ExportModal() {
    const {
        segments: globalSegments,
        videoFile,
        projectName,
        tracks,
        activeTrackId,
        isExportModalOpen,
        setExportModalOpen,
        isVideoUploading,
        setExportProgressModalOpen
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
        if (!videoFile?.id || !confirm('هل أنت متأكد من حذف ملفات هذا المشروع من السيرفر؟')) return

        setIsCleaning(true)
        try {
            const response = await fetch(`${API_BASE_URL}/cleanup/project/${videoFile.id}`, {
                method: 'POST'
            })
            if (response.ok) {
                setIsCleaned(true)
                alert('تم تنظيف ملفات المشروع بنجاح')
            }
        } catch (error) {
            console.error('Cleanup failed:', error)
        } finally {
            setIsCleaning(false)
        }
    }

    if (!isExportModalOpen) return null

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>تصدير الترجمة - Export Subtitles</h2>
                    <button className={styles.closeBtn} onClick={handleClose}>×</button>
                </div>

                <div className={styles.content}>
                    {availableTracks.length > 1 && (
                        <div className={styles.section}>
                            <span className={styles.label}>اختر المسار / Select Track</span>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 15 }}>
                                {availableTracks.map(track => (
                                    <button
                                        key={track.id}
                                        onClick={() => setSelectedTrackId(track.id)}
                                        className={styles.trackBtn}
                                        style={{
                                            background: effectiveTrack.id === track.id ? 'var(--accent-primary)' : 'transparent',
                                        }}
                                    >
                                        {track.name} ({track.language})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={styles.section}>
                        <span className={styles.label}>اختر الصيغة / Choose Format</span>
                        <div className={styles.grid}>
                            <button className={styles.exportBtn} onClick={() => handleDownload('srt')}>
                                <span className={styles.icon}>📄</span>
                                <span className={styles.ext}>SRT</span>
                                <span className={styles.label}>Standard</span>
                            </button>
                            <button className={styles.exportBtn} onClick={() => handleDownload('vtt')}>
                                <span className={styles.icon}>🌐</span>
                                <span className={styles.ext}>VTT</span>
                                <span className={styles.label}>Web</span>
                            </button>
                            <button className={styles.exportBtn} onClick={() => handleDownload('txt')}>
                                <span className={styles.icon}>📝</span>
                                <span className={styles.ext}>TXT</span>
                                <span className={styles.label}>Text Only</span>
                            </button>
                            <button className={styles.exportBtn} onClick={() => handleRemoteExport('xml')}>
                                <span className={styles.icon}>🎬</span>
                                <span className={styles.ext}>XML</span>
                                <span className={styles.label}>Adobe Premiere</span>
                            </button>
                        </div>
                    </div>

                    <div className={styles.burnSection}>
                        <span className={styles.icon}>🔥</span>
                        <h3>حرق الترجمة على الفيديو</h3>
                        <p className={styles.label}>Burn subtitles into video (Permanent)</p>
                        
                        {isVideoUploading && (
                            <div className={styles.uploadWarning}>
                                ⏳ جاري رفع الفيديو الأصلي لضمان الجودة... الرجاء الانتظار.
                            </div>
                        )}

                        <button
                            className={styles.burnBtn}
                            onClick={() => handleRemoteExport('burn-in')}
                            disabled={isExporting || isVideoUploading}
                        >
                            {isExporting ? '🔥 جاري حرق الترجمة...' : isVideoUploading ? 'بانتظار الرفع...' : 'بدء الحرق - Start Burn-in'}
                        </button>
                    </div>

                    <div className={styles.cleanupSection}>
                        <span className={styles.icon}>🧹</span>
                        <h3>إنهاء المشروع وتنظيف الملفات</h3>
                        <button
                            className={styles.cleanupBtn}
                            onClick={handleCleanup}
                            disabled={isCleaning || isCleaned}
                            style={{
                                background: isCleaned ? 'transparent' : 'rgba(239, 68, 68, 0.1)',
                                color: isCleaned ? 'var(--text-muted)' : '#ef4444',
                                border: `1px solid ${isCleaned ? 'var(--border-color)' : '#ef4444'}`
                            }}
                        >
                            {isCleaning ? 'جاري التنظيف...' : isCleaned ? '✅ تم التنظيف' : 'حذف ملفات المشروع - Clear Project Files'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
