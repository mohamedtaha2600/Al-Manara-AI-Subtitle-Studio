'use client'

/**
 * Advanced Activity Console
 * سجل النشاط المتقدم - مع البحث والتصفية والتصدير
 */

import { useEffect, useRef, useState, useMemo } from 'react'
import { useProjectStore, LogMessage } from '@/store/useProjectStore'
import styles from './ProgressLog.module.css'
import {
    Terminal,
    Search,
    Filter,
    Download,
    Trash2,
    Copy,
    Info,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Activity
} from 'lucide-react'

// Log Levels to Filter
type LogLevel = 'info' | 'success' | 'warning' | 'error'

interface ProgressLogProps {
    filterSilence?: boolean
}

export default function ProgressLog({ filterSilence = false }: ProgressLogProps) {
    const { logs, clearLogs, isTranscribing, progress, statusMessage } = useProjectStore()
    const logContainerRef = useRef<HTMLDivElement>(null)

    // UI State
    const [searchQuery, setSearchQuery] = useState('')
    const [activeFilters, setActiveFilters] = useState<Set<LogLevel>>(new Set(['info', 'success', 'warning', 'error']))

    // Toggle Filter
    const toggleFilter = (level: LogLevel) => {
        const newFilters = new Set(activeFilters)
        if (newFilters.has(level)) {
            newFilters.delete(level)
        } else {
            newFilters.add(level)
        }
        setActiveFilters(newFilters)
    }

    // Filter Logs
    const filteredLogs = useMemo(() => {
        let result = logs.filter(log => {
            const matchesFilter = activeFilters.has(log.level as LogLevel)
            const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase())
            return matchesFilter && matchesSearch
        })

        // If filterSilence is true, only show silence-related logs
        if (filterSilence) {
            result = result.filter(log =>
                log.message.includes('صمت') ||
                log.message.includes('silence') ||
                log.message.includes('Silence') ||
                log.message.includes('كشف') ||
                log.message.includes('detect')
            )
        }

        return result
    }, [logs, activeFilters, searchQuery, filterSilence])

    // Auto-scroll to bottom on new logs (only if not searching)
    useEffect(() => {
        if (logContainerRef.current && searchQuery === '') {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
        }
    }, [logs, searchQuery])

    // Helper: Format Time
    const formatTime = (date: Date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 2 // Show ms
        })
    }

    // Helper: Export Logs
    const handleExport = () => {
        const text = logs.map(l => `[${formatTime(l.timestamp)}] [${l.level.toUpperCase()}] ${l.message}`).join('\n')
        const blob = new Blob([text], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `aiscrip-log-${new Date().toISOString()}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    // Helper: Copy Logs
    const handleCopy = () => {
        const text = filteredLogs.map(l => `[${formatTime(l.timestamp)}] ${l.message}`).join('\n')
        navigator.clipboard.writeText(text)
    }

    return (
        <div className={styles.container}>
            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.titleRow}>
                    <h4><Terminal size={14} /> سجل النظام</h4>
                    <div className={styles.actions}>
                        <button
                            className={styles.actionBtn}
                            onClick={handleCopy}
                            title="نسخ السجل"
                        >
                            <Copy size={14} />
                        </button>
                        <button
                            className={styles.actionBtn}
                            onClick={handleExport}
                            title="تصدير (TXT)"
                        >
                            <Download size={14} />
                        </button>
                        <button
                            className={`${styles.actionBtn} ${styles.danger}`}
                            onClick={clearLogs}
                            title="مسح السجل"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                <div className={styles.filterRow}>
                    <div className={styles.searchContainer}>
                        <Search className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="بحث في السجل..."
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className={styles.filters}>
                        <button
                            className={`${styles.filterBtn} ${activeFilters.has('info') ? styles.active + ' ' + styles.info : ''}`}
                            onClick={() => toggleFilter('info')}
                            title="Info"
                        >
                            <Info size={14} />
                        </button>
                        <button
                            className={`${styles.filterBtn} ${activeFilters.has('success') ? styles.active + ' ' + styles.success : ''}`}
                            onClick={() => toggleFilter('success')}
                            title="Success"
                        >
                            <CheckCircle size={14} />
                        </button>
                        <button
                            className={`${styles.filterBtn} ${activeFilters.has('warning') ? styles.active + ' ' + styles.warning : ''}`}
                            onClick={() => toggleFilter('warning')}
                            title="Warnings"
                        >
                            <AlertTriangle size={14} />
                        </button>
                        <button
                            className={`${styles.filterBtn} ${activeFilters.has('error') ? styles.active + ' ' + styles.error : ''}`}
                            onClick={() => toggleFilter('error')}
                            title="Errors"
                        >
                            <XCircle size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Processing Status Area */}
            {isTranscribing && (
                <div className={styles.currentStatus}>
                    <div className={styles.statusHeader}>
                        <Activity className="spin" size={14} />
                        <span>جاري المعالجة... {Math.round(progress)}%</span>
                    </div>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressBarFill}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className={styles.statusMessage}>{statusMessage}</span>
                </div>
            )}

            {/* Log List */}
            <div className={styles.logContainer} ref={logContainerRef}>
                {filteredLogs.length === 0 ? (
                    <div className={styles.empty}>
                        {logs.length === 0 ? (
                            <>
                                <Terminal size={32} />
                                <p>السجل فارغ</p>
                            </>
                        ) : (
                            <>
                                <Filter size={32} />
                                <p>لا توجد نتائج مطابقة</p>
                            </>
                        )}
                    </div>
                ) : (
                    filteredLogs.map((log) => (
                        <div
                            key={log.id}
                            className={`${styles.logItem} ${styles[log.level]}`}
                        >
                            <span className={styles.logTime}>
                                {formatTime(log.timestamp)}
                            </span>
                            <div className={styles.logContent}>
                                <LogIcon level={log.level} />
                                <span className={styles.messageText}>
                                    {log.message}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

function LogIcon({ level }: { level: string }) {
    switch (level) {
        case 'success': return <CheckCircle className={styles.logIcon} />
        case 'warning': return <AlertTriangle className={styles.logIcon} />
        case 'error': return <XCircle className={styles.logIcon} />
        default: return <Info className={styles.logIcon} />
    }
}
