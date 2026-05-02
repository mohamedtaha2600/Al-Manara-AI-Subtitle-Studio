'use client'

/**
 * Upload Modal Component
 * نافذة رفع الملفات
 */

import { useState, useRef, useCallback } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import styles from './UploadModal.module.css'
import { API_BASE_URL, getApiUrl } from '@/utils/config'
import { extractAudioFromVideo } from '@/utils/audioUtils'



export default function UploadModal() {
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const {
        setVideoFile,
        startTranscription,
        updateProgress,
        finishTranscription,
        addLog,
        isUploadModalOpen,
        setUploadModalOpen
    } = useProjectStore()



    const handleClose = () => setUploadModalOpen(false)

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const files = e.dataTransfer.files
        if (files.length > 0) {
            handleFile(files[0])
        }
    }, [])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            handleFile(files[0])
        }
    }

    const handleFile = async (file: File) => {
        // Validate file type
        const videoExts = ['.mp4', '.mkv', '.avi', '.mov', '.webm']
        const audioExts = ['.mp3', '.wav', '.m4a', '.flac']
        const ext = '.' + file.name.split('.').pop()?.toLowerCase()
        
        if (!videoExts.includes(ext) && !audioExts.includes(ext)) {
            setError('نوع الملف غير مدعوم. الرجاء رفع ملف فيديو أو صوت.')
            return
        }

        setIsUploading(true)
        setError(null)
        setUploadProgress(0)
        addLog('info', `🚀 بدء معالجة "توربو": ${file.name}`)

        try {
            const isVideo = videoExts.includes(ext)
            const localUrl = URL.createObjectURL(file)

            // Step 1: Immediate Preview
            setVideoFile({
                id: 'temp-' + Date.now(),
                name: file.name,
                url: localUrl,
                duration: 0,
                type: isVideo ? 'video' : 'audio'
            })

            let uploadFile: File | Blob = file
            let audioFileId = ''

            // Step 2: Turbo Extraction (if video)
            if (isVideo) {
                addLog('info', '🔹 جاري استخراج الصوت محلياً لتسريع العملية...')
                const audioBlob = await extractAudioFromVideo(file)
                uploadFile = new File([audioBlob], 'extracted_audio.wav', { type: 'audio/wav' })
                addLog('success', '✅ تم استخراج الصوت بنجاح!')
            }

            // Step 3: Upload Audio/Main File for Transcription
            addLog('info', '📤 جاري رفع مسار الصوت للمحرك...')
            const formData = new FormData()
            formData.append('file', uploadFile)

            const uploadRes = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                body: formData,
            })

            if (!uploadRes.ok) throw new Error('فشل رفع مسار الصوت')
            const uploadData = await uploadRes.json()
            audioFileId = uploadData.file_id

            // Update store with server ID (important for transcription)
            const currentVideo = useProjectStore.getState().videoFile
            if (currentVideo) {
                setVideoFile({ ...currentVideo, id: audioFileId })
            }

            addLog('success', '✅ مسار الصوت جاهز للترجمة!')

            // Step 4: Background Video Upload (if video)
            if (isVideo) {
                startBackgroundVideoUpload(file)
            }

            handleClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
            addLog('error', `خطأ: ${err instanceof Error ? err.message : 'Unknown error'}`)
        } finally {
            setIsUploading(false)
        }
    }

    const startBackgroundVideoUpload = (file: File) => {
        const { setIsVideoUploading, setVideoUploadProgress, addLog } = useProjectStore.getState()
        
        setIsVideoUploading(true)
        setVideoUploadProgress(0)
        addLog('info', '☁️ بدأ رفع الفيديو الأصلي في الخلفية...')

        const formData = new FormData()
        formData.append('file', file)

        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${API_BASE_URL}/upload`, true)

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100)
                setVideoUploadProgress(percent)
            }
        }

        xhr.onload = () => {
            if (xhr.status === 200) {
                try {
                    const data = JSON.parse(xhr.responseText)
                    const { videoFile, setVideoFile } = useProjectStore.getState()
                    if (videoFile) {
                        // Crucial: Update the videoFile ID to the real video ID (was audio ID)
                        setVideoFile({ ...videoFile, id: data.file_id })
                    }
                    addLog('success', '✅ اكتمل رفع الفيديو الأصلي! التصدير متاح الآن بأقصى جودة.')
                } catch (e) {
                    addLog('warning', '⚠️ اكتمل الرفع ولكن فشل تحديث المعرف ID.')
                }
            } else {
                addLog('warning', '⚠️ فشل رفع الفيديو الأصلي في الخلفية، قد لا يعمل التصدير بشكل صحيح.')
            }
            setIsVideoUploading(false)
        }

        xhr.onerror = () => {
            addLog('error', '❌ انقطع اتصال رفع الفيديو في الخلفية.')
            setIsVideoUploading(false)
        }

        xhr.send(formData)
    }

    const pollTranscriptionStatus = async (jobId: string) => {
        let attempts = 0
        const maxAttempts = 180 // 6 minutes max (2s * 180)
        let lastMessage = ''

        const poll = async () => {
            if (attempts >= maxAttempts) {
                addLog('error', 'انتهت مهلة الانتظار - Timeout reached')
                return
            }

            attempts++

            try {
                const response = await fetch(getApiUrl(`transcribe/${jobId}`))
                const data = await response.json()

                // Only update if message changed (avoid spam)
                if (data.message !== lastMessage) {
                    updateProgress(data.progress, data.message)
                    lastMessage = data.message
                }

                if (data.status === 'completed') {
                    finishTranscription(data)
                    addLog('success', `✅ تم النسخ بنجاح!`)
                    return // Stop polling
                } else if (data.status === 'failed') {
                    addLog('error', `❌ فشل النسخ: ${data.message}`)
                    return // Stop polling
                } else {
                    // Continue polling with 2 second interval
                    setTimeout(poll, 2000)
                }
            } catch (err) {
                console.error('Polling error:', err)
                // Retry after error with longer delay
                setTimeout(poll, 5000)
            }
        }

        poll()
    }

    if (!isUploadModalOpen) return null

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <h2>رفع ملف جديد</h2>
                    <button className={styles.closeBtn} onClick={handleClose}>
                        <CloseIcon />
                    </button>
                </div>

                {/* Drop Zone */}
                <div
                    className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${isUploading ? styles.uploading : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    {isUploading ? (
                        <div className={styles.uploadingState}>
                            <div className="spinner" />
                            <p>جاري الرفع... {uploadProgress}%</p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.dropIcon}>
                                <UploadIcon />
                            </div>
                            <h3>اسحب الملف هنا</h3>
                            <p>أو اضغط للاختيار من جهازك</p>
                            <div className={styles.formats}>
                                <span>MP4</span>
                                <span>MKV</span>
                                <span>AVI</span>
                                <span>MOV</span>
                                <span>MP3</span>
                                <span>WAV</span>
                            </div>
                        </>
                    )}
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*,audio/*"
                    onChange={handleFileSelect}
                    className={styles.hiddenInput}
                />

                {/* Error Message */}
                {error && (
                    <div className={styles.error}>
                        <ErrorIcon />
                        {error}
                    </div>
                )}

                {/* Info */}
                <div className={styles.info}>
                    <InfoIcon />
                    <span>يدعم البرنامج ملفات حتى 5GB ومدة تصل إلى 3 ساعات</span>
                </div>
            </div>
        </div>
    )
}

// Icons
const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6L6 18M6 6l12 12" />
    </svg>
)

const UploadIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
)

const ErrorIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
    </svg>
)

const InfoIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
    </svg>
)
