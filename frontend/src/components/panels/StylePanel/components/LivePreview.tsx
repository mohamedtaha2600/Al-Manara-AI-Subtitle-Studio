'use client'

import React from 'react'
import styles from './LivePreview.module.css'

interface LivePreviewProps {
    style: any
}

export const LivePreview: React.FC<LivePreviewProps> = ({ style }) => {
    return (
        <div className={styles.preview}>
            <div className={styles.previewScreen}>
                <span
                    className={styles.previewText}
                    style={{
                        fontFamily: style.fontFamily,
                        fontSize: `${Math.min(style.fontSize * 0.45, 18)}px`,
                        color: style.primaryColor,
                        fontWeight: style.bold ? 'bold' : 'normal',
                        fontStyle: style.italic ? 'italic' : 'normal',
                        textDecoration: style.underline ? 'underline' : 'none',
                        letterSpacing: `${style.letterSpacing}px`,
                        textShadow: style.outlineWidth > 0
                            ? `1px 1px 0 ${style.outlineColor}, -1px 1px 0 ${style.outlineColor}`
                            : 'none',
                        backgroundColor: style.backgroundColor,
                        padding: style.backgroundColor !== 'transparent' ? '3px 8px' : '0',
                        borderRadius: `${style.borderRadius}px`,
                    }}
                >
                    معاينة النص
                </span>
            </div>
        </div>
    )
}
