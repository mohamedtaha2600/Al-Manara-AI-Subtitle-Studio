import React, { useState, useEffect, useRef } from 'react'
import styles from './SubtitleInlineEditor.module.css'

interface SubtitleInlineEditorProps {
    initialText: string
    style: any
    onSave: (text: string) => void
    onCancel: () => void
}

export default function SubtitleInlineEditor({
    initialText,
    style,
    onSave,
    onCancel
}: SubtitleInlineEditorProps) {
    const [text, setText] = useState(initialText)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus()
            // Place cursor at end
            textareaRef.current.setSelectionRange(initialText.length, initialText.length)
        }
    }, [])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSave(text)
        } else if (e.key === 'Escape') {
            onCancel()
        }
    }

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current
        if (!textarea) return
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
    }, [text])

    // Convert hex to rgba helper (Sync with overlay)
    const hexToRgba = (hex: string, opacity: number) => {
        if (!hex) return 'transparent'
        if (hex.startsWith('rgba')) return hex
        if (hex === 'transparent') return 'transparent'
        let c = hex.substring(1).split('')
        if (c.length === 3) c = [c[0], c[0], c[1], c[2], c[2]]
        const r = parseInt(c[0] + c[1], 16)
        const g = parseInt(c[2] + c[3], 16)
        const b = parseInt(c[4] + c[5], 16)
        return `rgba(${r},${g},${b},${opacity / 100})`
    }

    return (
        <textarea
            ref={textareaRef}
            className={styles.editor}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => onSave(text)}
            style={{
                fontFamily: style.fontFamily,
                fontSize: `${style.fontSize}px`,
                color: style.primaryColor,
                fontWeight: style.bold ? 'bold' : 'normal',
                fontStyle: style.italic ? 'italic' : 'normal',
                textAlign: 'center',
                backgroundColor: hexToRgba(style.backgroundColor, style.backgroundOpacity),
                padding: `${style.backgroundPadding}px`,
                borderRadius: `${style.borderRadius}px`,
                lineHeight: style.lineHeight || 1.4,
                width: '100%',
                maxWidth: '600px',
                border: 'none',
                outline: '2px solid var(--accent-primary)',
                resize: 'none',
                overflow: 'hidden',
                display: 'block',
                direction: 'rtl'
            }}
        />
    )
}
