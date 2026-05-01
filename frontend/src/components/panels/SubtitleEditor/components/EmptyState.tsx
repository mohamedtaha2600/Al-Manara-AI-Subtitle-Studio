'use client'

import React from 'react'
import { UploadIcon } from './SubtitleIcons'
import styles from './EmptyState.module.css'

export const EmptyState = () => (
    <div className={styles.empty}>
        <UploadIcon />
        <p>ارفع ملف فيديو أولاً</p>
    </div>
)
