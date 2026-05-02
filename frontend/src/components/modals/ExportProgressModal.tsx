'use client'

/**
 * Export Progress Modal Component
 * نافذة تتبع تقدم التصدير والمعاينة
 */

import { useState, useEffect, useCallback } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import styles from './ExportProgressModal.module.css'
import { getApiUrl, API_BASE_URL } from '@/utils/config'

export default function ExportProgressModal() {
    const { 
        isExportProgressModalOpen, 
        exportJobId, 
        exportType, 
        setExportProgressModalOpen,
        addLog 
    } = useProjectStore()

    const [status, setStatus] = useState<'processing' | 'completed' | 'failed'>('processing')
    const [progress, setProgress] = useState(0)
    const [message, setMessage] = useState('جاري بدء المعالجة...')
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleClose = () => {
        if (status === 'processing' && !confirm('المعالجة لا تزال جارية. هل تريد الإغلاق؟')) return
        setExportProgressModalOpen(false)
    }

    const pollStatus = useCallback(async () => {
        if (!exportJobId || !exportType) return

        const endpoint = exportType === 'silence' 
            ? `silence/export/status/${exportJobId}` 
            : `export/status/${exportJobId}`

        try {
            const response = await fetch(getApiUrl(endpoint))
            if (!response.ok) throw new Error('فشل الحصول على الحالة')
            
            const data = await response.json()
            
            setProgress(data.progress || 0)
            setMessage(data.message || 'جاري المعالجة...')
            setStatus(data.status)

            if (data.status === 'completed') {
                setDownloadUrl(data.download_url)
                addLog('success', '✅ تم تجهيز الفيديو بنجاح!')
                return // Stop polling
            } else if (data.status === 'failed') {
                setError(data.message || 'فشلت عملية التصدير')
                addLog('error', `❌ فشل التصدir: ${data.message}`)
                return // Stop polling
            }

            // Continue polling
            setTimeout(pollStatus, 2000)
        } catch (err) {
            console.error('Polling error:', err)
            setTimeout(pollStatus, 5000) // Retry after error
        }
    }, [exportJobId, exportType, addLog])

    useEffect(() => {
        if (isExportProgressModalOpen && exportJobId) {
            setStatus('processing')
            setProgress(0)
            setError(null)
            setDownloadUrl(null)
            pollStatus()
        }
    }, [isExportProgressModalOpen, exportJobId, pollStatus])

    if (!isExportProgressModalOpen) return null

    const finalVideoUrl = downloadUrl 
        ? (downloadUrl.startsWith('http') ? downloadUrl : `${API_BASE_URL.replace('/api', '')}${downloadUrl}`)
        : null

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>{exportType === 'silence' ? 'حذف الصمت' : 'حرق الترجمة'} - {status === 'completed' ? 'جاهز!' : 'جاري الحفظ'}</h2>
                    <button className={styles.closeBtn} onClick={handleClose}>×</button>
                </div>

                <div className={styles.content}>
                    {status === 'processing' && (
                        <div className={styles.processingState}>
                            <div className={styles.loaderWrapper}>
                                <div className={styles.spinner} />
                                <span className={styles.percentage}>{progress}%</span>
                            </div>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                            </div>
                            <p className={styles.message}>{message}</p>
                            <p className={styles.subMessage}>الرجاء عدم إغلاق المتصفح حتى انتهاء العملية</p>
                        </div>
                    )}

                    {status === 'failed' && (
                        <div className={styles.failedState}>
                            <div className={styles.errorIcon}>⚠️</div>
                            <h3>حدث خطأ أثناء المعالجة</h3>
                            <p className={styles.errorMessage}>{error}</p>
                            <button className={styles.retryBtn} onClick={handleClose}>إغلاق وحاول مرة أخرى</button>
                        </div>
                    )}

                    {status === 'completed' && finalVideoUrl && (
                        <div className={styles.completedState}>
                            <div className={styles.previewHeader}>
                                <span>🎉 اكتمل المعالجة! يمكنك المعاينة أدناه:</span>
                            </div>
                            
                            <div className={styles.videoPreview}>
                                <video controls src={finalVideoUrl} className={styles.videoPlayer}>
                                    متصفحك لا يدعم تشغيل الفيديو.
                                </video>
                            </div>

                            <div className={styles.actions}>
                                <a 
                                    href={finalVideoUrl} 
                                    download 
                                    className={styles.downloadBtn}
                                    onClick={() => addLog('success', '📥 بدأ تنزيل الفيديو')}
                                >
                                    📥 تنزيل الفيديو الآن
                                </a>
                                <button className={styles.secondaryBtn} onClick={handleClose}>إغلاق</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
