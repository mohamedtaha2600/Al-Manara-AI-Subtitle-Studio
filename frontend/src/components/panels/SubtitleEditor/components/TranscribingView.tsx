'use client'

import React from 'react'
import styles from './TranscribingView.module.css'

interface TranscribingViewProps {
    statusMessage: string
    progress: number
}

export const TranscribingView: React.FC<TranscribingViewProps> = ({ statusMessage, progress }) => (
    <div className={styles.transcribing}>
        <div className={styles.spinner}>
            <div className={styles.spinnerRing}></div>
            <div className={styles.spinnerRing}></div>
            <div className={styles.spinnerRing}></div>
        </div>
        <h3>جاري التحليل والترجمة...</h3>
        <p className={styles.statusText}>{statusMessage}</p>
        <div className={styles.progressBar}>
            <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
            />
        </div>
        <span className={styles.progressPercent}>{progress.toFixed(0)}%</span>
    </div>
)
