'use client'

/**
 * Import Modal Component
 * نافذة استيراد ملفات SRT/VTT مع الفيديو
 */

import { useState, useRef, useCallback } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { parseSRT, parseVTT } from '@/utils/subtitleUtils'
import styles from './ImportModal.module.css'



const SUBTITLE_EXTENSIONS = ['.srt', '.vtt']
const MEDIA_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.mp3', '.wav', '.m4a', '.flac']

export default function ImportModal() {
    const [subtitleFile, setSubtitleFile] = useState<File | null>(null)
    const [mediaFile, setMediaFile] = useState<File | null>(null)
    const [isDraggingSub, setIsDraggingSub] = useState(false)
    const [isDraggingMedia, setIsDraggingMedia] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [language, setLanguage] = useState('ar')

    const subtitleInputRef = useRef<HTMLInputElement>(null)
    const mediaInputRef = useRef<HTMLInputElement>(null)

    const {
        setVideoFile,
        setTracks,
        setActiveTrack,
        addLog,
        setSegments,
        isImportModalOpen,
        setImportModalOpen
    } = useProjectStore()

    const handleClose = () => setImportModalOpen(false)

    // Validate file extension
    const validateExtension = (file: File, validExtensions: string[]): boolean => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase()
        return validExtensions.includes(ext)
    }

    // Handle subtitle file selection
    const handleSubtitleFile = useCallback((file: File) => {
        if (!validateExtension(file, SUBTITLE_EXTENSIONS)) {
            setError('صيغة الترجمة غير مدعومة. الرجاء رفع ملف SRT أو VTT.')
            return
        }
        setSubtitleFile(file)
        setError(null)
    }, [])

    // Handle media file selection
    const handleMediaFile = useCallback((file: File) => {
        if (!validateExtension(file, MEDIA_EXTENSIONS)) {
            setError('صيغة الملف غير مدعومة. الرجاء رفع ملف فيديو أو صوت.')
            return
        }
        setMediaFile(file)
        setError(null)
    }, [])

    // Drag handlers for subtitle zone
    const handleSubDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDraggingSub(true)
    }, [])

    const handleSubDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDraggingSub(false)
    }, [])

    const handleSubDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDraggingSub(false)
        const files = e.dataTransfer.files
        if (files.length > 0) {
            handleSubtitleFile(files[0])
        }
    }, [handleSubtitleFile])

    // Drag handlers for media zone
    const handleMediaDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDraggingMedia(true)
    }, [])

    const handleMediaDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDraggingMedia(false)
    }, [])

    const handleMediaDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDraggingMedia(false)
        const files = e.dataTransfer.files
        if (files.length > 0) {
            handleMediaFile(files[0])
        }
    }, [handleMediaFile])

    // Parse subtitle file content
    const parseSubtitleFile = async (file: File): Promise<{ id: number; start: number; end: number; text: string }[]> => {
        const content = await file.text()
        const ext = file.name.split('.').pop()?.toLowerCase()

        if (ext === 'srt') {
            return parseSRT(content)
        } else if (ext === 'vtt') {
            return parseVTT(content)
        }

        throw new Error('Unsupported subtitle format')
    }

    // Upload media file to backend
    const uploadMediaFile = async (file: File): Promise<string> => {
        const formData = new FormData()
        formData.append('file', file)

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://mohamedtaha2600-almanara-ai-engine.hf.space/api'
        const response = await fetch(`${apiUrl}/upload`, {
            method: 'POST',
            body: formData,
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.detail || `فشل رفع الملف (${response.status})`)
        }

        const data = await response.json()
        return data.file_id
    }

    // Handle import
    const handleImport = async () => {
        if (!subtitleFile) {
            setError('الرجاء اختيار ملف الترجمة أولاً')
            return
        }

        setIsImporting(true)
        setError(null)

        try {
            // Parse subtitle file
            addLog('info', `جاري تحليل ملف الترجمة: ${subtitleFile.name}`)
            const segments = await parseSubtitleFile(subtitleFile)

            if (segments.length === 0) {
                throw new Error('لم يتم العثور على ترجمات في الملف')
            }

            addLog('success', `تم تحليل ${segments.length} سطر ترجمة`)

            // Upload media file if provided
            let fileId = 'imported-' + Date.now()
            let localUrl = ''

            if (mediaFile) {
                addLog('info', `جاري رفع الملف: ${mediaFile.name}`)
                fileId = await uploadMediaFile(mediaFile)
                localUrl = URL.createObjectURL(mediaFile)
                addLog('success', `تم رفع الملف بنجاح: ${fileId}`)

                // Set video file
                setVideoFile({
                    id: fileId,
                    name: mediaFile.name,
                    url: localUrl,
                    duration: 0,
                    type: 'video'
                })
            }

            // Create track with imported segments
            const trackId = `track-imported-${language}`
            const trackName = language === 'ar' ? 'عربي (مستورد)' :
                language === 'en' ? 'English (Imported)' :
                    `${language.toUpperCase()} (Imported)`

            const defaultStyle = {
                fontFamily: 'Arial',
                fontSize: 32,
                primaryColor: '#FFFFFF',
                outlineColor: '#000000',
                outlineWidth: 2,
                shadowColor: 'rgba(0,0,0,0.8)',
                shadowOffset: 2,
                shadowBlur: 4,
                position: 'bottom' as const,
                textAlign: 'center' as const,
                marginV: 50,
                marginH: 20,
                bold: false,
                italic: false,
                underline: false,
                backgroundColor: 'rgba(0,0,0,0.6)',
                backgroundOpacity: 70,
                borderRadius: 4,
                letterSpacing: 0,
                lineHeight: 1.4,
                animation: 'fade',
                animationDuration: 300,
                backgroundPadding: 8,
                backgroundBlur: 0,

                // Box Shadow
                boxShadow: false,
                boxShadowColor: 'rgba(0,0,0,0.5)',
                boxShadowOpacity: 0.5,
                boxShadowBlur: 4,
                boxShadowSpread: 0,

                displayMode: 'auto',
                highlightCurrentWord: false,
                highlightColor: '#ffff00',

                // Free Positioning
                x: 0,
                y: 0
            }

            const track = {
                id: trackId,
                name: trackName,
                language: language,
                segments: segments,
                style: defaultStyle,
                isVisible: true,
                isLocked: false,
            }

            // Set tracks and segments in store
            setTracks([track])
            setActiveTrack(trackId)
            setSegments(segments)

            addLog('success', `✅ تم استيراد الترجمة بنجاح! ${segments.length} سطر`)

            addLog('success', `✅ تم استيراد الترجمة بنجاح! ${segments.length} سطر`)

            handleClose()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع'
            setError(message)
            addLog('error', `خطأ: ${message}`)
        } finally {
            setIsImporting(false)
        }
    }

    if (!isImportModalOpen) return null

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <h2>📥 استيراد ترجمة - Import Subtitles</h2>
                    <button className={styles.closeBtn} onClick={handleClose}>
                        <CloseIcon />
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Subtitle File Zone */}
                    <div className={styles.section}>
                        <span className={styles.sectionTitle}>
                            <span className={styles.icon}>📄</span>
                            ملف الترجمة (مطلوب) - Subtitle File (Required)
                        </span>
                        <div
                            className={`${styles.dropZone} ${isDraggingSub ? styles.dragging : ''} ${subtitleFile ? styles.hasFile : ''}`}
                            onDragOver={handleSubDragOver}
                            onDragLeave={handleSubDragLeave}
                            onDrop={handleSubDrop}
                            onClick={() => subtitleInputRef.current?.click()}
                        >
                            <div className={styles.dropIcon}>
                                {subtitleFile ? '✓' : <SubtitleIcon />}
                            </div>
                            {subtitleFile ? (
                                <>
                                    <h4>تم اختيار الملف</h4>
                                    <p className={styles.fileName}>{subtitleFile.name}</p>
                                </>
                            ) : (
                                <>
                                    <h4>اسحب ملف الترجمة هنا</h4>
                                    <p>أو اضغط للاختيار</p>
                                    <div className={styles.formats}>
                                        <span>SRT</span>
                                        <span>VTT</span>
                                    </div>
                                </>
                            )}
                        </div>
                        <input
                            ref={subtitleInputRef}
                            type="file"
                            accept=".srt,.vtt"
                            onChange={e => e.target.files?.[0] && handleSubtitleFile(e.target.files[0])}
                            className={styles.hiddenInput}
                        />
                    </div>

                    {/* Media File Zone */}
                    <div className={styles.section}>
                        <span className={styles.sectionTitle}>
                            <span className={styles.icon}>🎬</span>
                            ملف الفيديو/الصوت (اختياري) - Media File (Optional)
                        </span>
                        <div
                            className={`${styles.dropZone} ${isDraggingMedia ? styles.dragging : ''} ${mediaFile ? styles.hasFile : ''}`}
                            onDragOver={handleMediaDragOver}
                            onDragLeave={handleMediaDragLeave}
                            onDrop={handleMediaDrop}
                            onClick={() => mediaInputRef.current?.click()}
                        >
                            <div className={styles.dropIcon}>
                                {mediaFile ? '✓' : <MediaIcon />}
                            </div>
                            {mediaFile ? (
                                <>
                                    <h4>تم اختيار الملف</h4>
                                    <p className={styles.fileName}>{mediaFile.name}</p>
                                </>
                            ) : (
                                <>
                                    <h4>اسحب ملف الفيديو أو الصوت هنا</h4>
                                    <p>أو اضغط للاختيار</p>
                                    <div className={styles.formats}>
                                        <span>MP4</span>
                                        <span>MKV</span>
                                        <span>MP3</span>
                                        <span>WAV</span>
                                    </div>
                                </>
                            )}
                        </div>
                        <input
                            ref={mediaInputRef}
                            type="file"
                            accept="video/*,audio/*"
                            onChange={e => e.target.files?.[0] && handleMediaFile(e.target.files[0])}
                            className={styles.hiddenInput}
                        />
                    </div>

                    {/* Language Selection */}
                    <div className={styles.section}>
                        <div className={styles.languageSelect}>
                            <label>لغة الترجمة:</label>
                            <select value={language} onChange={e => setLanguage(e.target.value)}>
                                <option value="ar">العربية - Arabic</option>
                                <option value="en">English</option>
                                <option value="fr">Français</option>
                                <option value="es">Español</option>
                                <option value="de">Deutsch</option>
                                <option value="tr">Türkçe</option>
                                <option value="other">أخرى - Other</option>
                            </select>
                        </div>
                    </div>

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
                        <span>
                            يمكنك استيراد ملف ترجمة SRT أو VTT جاهز وتعديله كما لو كان تم توليده بالذكاء الاصطناعي.
                            ملف الفيديو اختياري للمعاينة.
                        </span>
                    </div>

                    {/* Actions */}
                    <div className={styles.actions}>
                        <button className={styles.cancelBtn} onClick={handleClose}>
                            إلغاء
                        </button>
                        <button
                            className={styles.importBtn}
                            onClick={handleImport}
                            disabled={!subtitleFile || isImporting}
                        >
                            {isImporting ? (
                                <>
                                    <span className="spinner-small" />
                                    جاري الاستيراد...
                                </>
                            ) : (
                                <>📥 استيراد</>
                            )}
                        </button>
                    </div>
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

const SubtitleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M6 12h4M6 16h8M14 12h4" />
    </svg>
)

const MediaIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <polygon points="10,8 16,12 10,16" fill="currentColor" />
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
