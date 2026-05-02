'use client'

import React from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { Upload } from 'lucide-react'
import styles from './EmptyState.module.css'

export const EmptyState = () => {
    const { setUploadModalOpen } = useProjectStore()

    return (
        <div className={styles.empty} onClick={() => setUploadModalOpen(true)}>
            <div className={styles.iconBox}>
                <Upload size={32} />
            </div>
            <p>ارفع ملف فيديو أولاً</p>
            <span className={styles.hint}>اضغط هنا لفتح نافذة الرفع</span>
        </div>
    )
}
