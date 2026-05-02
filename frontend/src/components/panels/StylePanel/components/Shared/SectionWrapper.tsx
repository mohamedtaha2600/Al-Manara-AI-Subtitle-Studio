'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'
import styles from './SectionWrapper.module.css'

interface SectionWrapperProps {
    id: string
    title: React.ReactNode | string
    icon: React.ReactNode
    isActive: boolean
    onToggle: (id: string) => void
    children: React.ReactNode
    theme?: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan' | 'slate' // Semantic themes
    dir?: 'ltr' | 'rtl'
}

export const SectionWrapper: React.FC<SectionWrapperProps> = ({
    id,
    title,
    icon,
    isActive,
    onToggle,
    children,
    theme = 'slate',
    dir = 'ltr'
}) => {
    const isRTL = dir === 'rtl'

    return (
        <section 
            className={`${styles.section} ${styles[theme]}`} 
            data-active={isActive}
            style={{ direction: dir }}
        >
            <button
                className={styles.sectionHeader}
                onClick={() => onToggle(id)}
                style={{ flexDirection: 'row' }} // Let direction: rtl handle the flip
            >
                <div className={styles.headerTitle} style={{ gap: 8 }}>
                    {icon}
                    <span>{title}</span>
                </div>
                <ChevronIcon open={isActive} />
            </button>
            <div className={styles.contentWrapper} style={{ gridTemplateRows: isActive ? '1fr' : '0fr' }}>
                <div className={styles.contentInner}>
                    {children}
                </div>
            </div>
        </section>
    )
}

const ChevronIcon = ({ open }: { open: boolean }) => (
    <div style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', display: 'flex' }}>
        <ChevronDown size={20} />
    </div>
)
