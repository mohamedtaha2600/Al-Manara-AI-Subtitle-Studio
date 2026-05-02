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
        setExportModalOpen
    } = useProjectStore()
    const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)

    // Determine available tracks
    const availableTracks = (tracks && tracks.length > 0)
        ? tracks
        : [{ id: 'default', name: 'Original', language: 'auto', segments: globalSegments }]

    // Use activeTrackId from store as default (this is the Arabic track if selected)
    // Then fallback to Arabic track, then first track
    const storeActiveTrack = availableTracks.find(t => t.id === activeTrackId)
    const arabicTrack = availableTracks.find(t => t.id?.includes('ar') || t.language === 'ar')
    const defaultTrack = storeActiveTrack || arabicTrack || availableTracks[0]

    const effectiveTrack = availableTracks.find(t => t.id === selectedTrackId) || defaultTrack
    const availableSegments = effectiveTrack?.segments || globalSegments

    const handleClose = () => setExportModalOpen(false)

    // Debug logging
    console.log('[ExportModal] tracks:', tracks?.length, 'activeTrackId:', activeTrackId)
    console.log('[ExportModal] effectiveTrack:', effectiveTrack?.id, effectiveTrack?.language)
    console.log('[ExportModal] segments count:', availableSegments?.length, 'first text:', availableSegments?.[0]?.text?.substring(0, 50))

    const [isCleaning, setIsCleaning] = useState(false)
    const [isCleaned, setIsCleaned] = useState(false)

    const handleCleanup = async () => {
        if (!videoFile?.id || !confirm('هل أنت متأكد من حذف ملفات هذا المشروع من السيرفر؟\nسيتم حذف الفيديو الأصلي والمقاطع المؤقتة.')) return

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

        // Use project name with lang suffix
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

    const [isExporting, setIsExporting] = useState(false)

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
                if (data.downloadUrl) {
                    // Check if downloadUrl is relative or absolute
                    const finalUrl = data.downloadUrl.startsWith('http') 
                        ? data.downloadUrl 
                        : `${API_BASE_URL.replace('/api', '')}${data.downloadUrl}`;
                    window.open(finalUrl, '_blank')
                } else {
                    alert('تم إنشاء الملف ولكن لم يتم العثور على رابط التنزيل')
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

    if (!isExportModalOpen) return null

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>تصدير الترجمة - Export Subtitles</h2>
                    <button className={styles.closeBtn} onClick={handleClose}>×</button>
                </div>

                <div className={styles.content}>
                    {/* Track Selector */}
                    {availableTracks.length > 1 && (
                        <div className={styles.section}>
                            <span className={styles.label}>اختر المسار / Select Track</span>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 15 }}>
                                {availableTracks.map(track => (
                                    <button
                                        key={track.id}
                                        onClick={() => setSelectedTrackId(track.id)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            border: '1px solid var(--border-color)',
                                            background: effectiveTrack.id === track.id ? 'var(--accent-primary)' : 'transparent',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem'
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
                        <button
                            className={styles.burnBtn}
                            onClick={() => handleRemoteExport('burn-in')}
                            disabled={isExporting}
                        >
                            {isExporting ? 'جاري التجهيز...' : 'بدء الحرق - Start Burn-in'}
                        </button>
                    </div>

                    <div className={styles.cleanupSection} style={{
                        marginTop: '12px',
                        padding: '16px',
                        background: 'rgba(239, 68, 68, 0.05)',
                        border: '1px dashed rgba(239, 68, 68, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center'
                    }}>
                        <span className={styles.icon}>🧹</span>
                        <h3>إنهاء المشروع وتنظيف الملفات</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '8px 0' }}>
                            Finish project and clear server storage
                        </p>
                        <button
                            className={styles.cleanupBtn}
                            onClick={handleCleanup}
                            disabled={isCleaning || isCleaned}
                            style={{
                                width: '100%',
                                padding: '10px',
                                background: isCleaned ? 'transparent' : 'rgba(239, 68, 68, 0.1)',
                                color: isCleaned ? 'var(--text-muted)' : '#ef4444',
                                border: `1px solid ${isCleaned ? 'var(--border-color)' : '#ef4444'}`,
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: 600,
                                cursor: isCleaned ? 'default' : 'pointer'
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
