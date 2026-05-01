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
    return (
        <section className={`${styles.section} ${styles[theme]}`} data-active={isActive}>
            <button
                className={styles.sectionHeader}
                onClick={() => onToggle(id)}
                style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}
            >
                <span className={styles.headerTitle} style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
                    {icon} {title}
                </span>
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
