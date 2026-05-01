import React, { useEffect, useRef } from 'react'

interface ContextMenuProps {
    x: number
    y: number
    onClose: () => void
    onDelete?: () => void
    onSplit?: () => void
    onCopy?: () => void
    onPaste?: () => void
}

export default function TimelineContextMenu({
    x,
    y,
    onClose,
    onDelete,
    onSplit,
    onCopy,
    onPaste
}: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null)

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose()
            }
        }
        window.addEventListener('mousedown', handleClickOutside)
        return () => window.removeEventListener('mousedown', handleClickOutside)
    }, [onClose])

    return (
        <div
            ref={menuRef}
            style={{
                position: 'fixed',
                top: y,
                left: x,
                zIndex: 1000,
                backgroundColor: '#1e1e2e',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '4px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                minWidth: '160px',
            }}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <MenuItem label="✂️ قص من هنا (Split)" onClick={onSplit} shortcut="S" />
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                <MenuItem label="📋 نسخ (Copy)" onClick={onCopy} shortcut="Ctrl+C" />
                <MenuItem label="📌 لصق (Paste)" onClick={onPaste} shortcut="Ctrl+V" />
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                <MenuItem label="🗑️ حذف (Delete)" onClick={onDelete} shortcut="Del" danger />
            </div>
        </div>
    )
}

function MenuItem({ label, onClick, shortcut, danger = false }: { label: string, onClick?: () => void, shortcut?: string, danger?: boolean }) {
    if (!onClick) return null

    return (
        <button
            onClick={(e) => {
                e.stopPropagation()
                onClick()
            }}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                color: danger ? '#ef4444' : '#e0e0e0',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textAlign: 'right', // Arabic alignment
                borderRadius: '4px',
                fontFamily: 'inherit',
                transition: 'background 0.1s'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = danger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 0255, 0.1)'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
            }}
        >
            <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>{shortcut}</span>
            <span>{label}</span>
        </button>
    )
}
