'use client'

import React from 'react'
import {
    Clapperboard,
    Youtube,
    Music2,
    Tv,
    Mic2,
    Film,
    Gamepad2,
    Feather,
    Type,
    ArrowRight,
    Zap,
    Keyboard,
    Activity,
    Sparkles,
    ArrowUp,
    Vibrate
} from 'lucide-react'

// Professional Preset styles
export const PRESETS = [
    {
        id: 'netflix',
        name: 'Netflix',
        icon: <Clapperboard size={20} />,
        style: { fontFamily: 'Arial', fontSize: 32, primaryColor: '#FFFFFF', outlineColor: '#000000', outlineWidth: 2, backgroundColor: 'rgba(0,0,0,0.7)', animation: 'fade', position: 'bottom' as const }
    },
    {
        id: 'youtube',
        name: 'YouTube',
        icon: <Youtube size={20} />,
        style: { fontFamily: 'Arial', fontSize: 34, primaryColor: '#FFFF00', outlineColor: '#000000', outlineWidth: 3, backgroundColor: 'transparent', animation: 'none', position: 'bottom' as const }
    },
    {
        id: 'tiktok',
        name: 'TikTok',
        icon: <Music2 size={20} />,
        style: { fontFamily: 'Arial', fontSize: 36, primaryColor: '#FFFFFF', outlineColor: '#FF0050', outlineWidth: 2, backgroundColor: 'transparent', animation: 'pop', position: 'center' as const }
    },
    {
        id: 'news',
        name: 'أخبار',
        icon: <Tv size={20} />,
        style: { fontFamily: 'Cairo', fontSize: 28, primaryColor: '#FFFFFF', outlineColor: '#000000', outlineWidth: 0, backgroundColor: 'rgba(0,100,200,0.9)', animation: 'slide', position: 'bottom' as const }
    },
    {
        id: 'karaoke',
        name: 'كاريوكي',
        icon: <Mic2 size={20} />,
        style: { fontFamily: 'Arial', fontSize: 38, primaryColor: '#00FF00', outlineColor: '#000000', outlineWidth: 3, backgroundColor: 'transparent', animation: 'glow', position: 'bottom' as const }
    },
    {
        id: 'cinematic',
        name: 'سينمائي',
        icon: <Film size={20} />,
        style: { fontFamily: 'Georgia', fontSize: 28, primaryColor: '#F5F5F5', outlineColor: '#1a1a1a', outlineWidth: 1, backgroundColor: 'transparent', animation: 'fade', position: 'bottom' as const }
    },
    {
        id: 'gaming',
        name: 'ألعاب',
        icon: <Gamepad2 size={20} />,
        style: { fontFamily: 'Impact', fontSize: 32, primaryColor: '#00FF88', outlineColor: '#000000', outlineWidth: 3, backgroundColor: 'rgba(0,0,0,0.5)', animation: 'pop', position: 'bottom' as const, bold: true }
    },
    {
        id: 'elegant',
        name: 'أنيق',
        icon: <Feather size={20} />,
        style: { fontFamily: 'Amiri', fontSize: 30, primaryColor: '#FFD700', outlineColor: '#000000', outlineWidth: 1, backgroundColor: 'transparent', animation: 'fade', position: 'bottom' as const, italic: true }
    },
]

// System fonts + Google fonts
export const FONTS = [
    // Arabic fonts
    { name: 'Cairo', type: 'arabic' },
    { name: 'Tajawal', type: 'arabic' },
    { name: 'Amiri', type: 'arabic' },
    { name: 'Noto Sans Arabic', type: 'arabic' },
    { name: 'Noto Kufi Arabic', type: 'arabic' },
    { name: 'Almarai', type: 'arabic' },
    { name: 'Changa', type: 'arabic' },
    { name: 'Lateef', type: 'arabic' },
    // System fonts
    { name: 'Arial', type: 'system' },
    { name: 'Arial Black', type: 'system' },
    { name: 'Verdana', type: 'system' },
    { name: 'Tahoma', type: 'system' },
    { name: 'Trebuchet MS', type: 'system' },
    { name: 'Georgia', type: 'system' },
    { name: 'Times New Roman', type: 'system' },
    { name: 'Impact', type: 'system' },
    { name: 'Comic Sans MS', type: 'system' },
    { name: 'Segoe UI', type: 'system' },
    { name: 'Calibri', type: 'system' },
    // Google fonts
    { name: 'Roboto', type: 'google' },
    { name: 'Open Sans', type: 'google' },
    { name: 'Montserrat', type: 'google' },
    { name: 'Poppins', type: 'google' },
    { name: 'Oswald', type: 'google' },
]

export const ANIMATIONS = [
    { id: 'none', name: 'بدون', icon: <Type size={18} /> },
    { id: 'fade', name: 'ظهور', icon: <Activity size={18} /> },
    { id: 'slide', name: 'انزلاق', icon: <ArrowRight size={18} /> },
    { id: 'pop', name: 'قفز', icon: <Zap size={18} /> },
    { id: 'typewriter', name: 'طباعة', icon: <Keyboard size={18} /> },
    { id: 'glow', name: 'توهج', icon: <Sparkles size={18} /> },
    { id: 'bounce', name: 'ارتداد', icon: <ArrowUp size={18} /> },
    { id: 'shake', name: 'اهتزاز', icon: <Vibrate size={18} /> },
]

export const DISPLAY_MODES = [
    { id: 'auto', name: 'تلقائي', desc: 'Whisper يقرر' },
    { id: 'word', name: 'كلمة', desc: 'كلمة واحدة' },
    { id: 'sentence', name: 'جملة', desc: 'جملة كاملة' },
    { id: 'paragraph', name: 'فقرة', desc: 'عدة جمل' },
]

export const BG_COLORS = [
    { id: 'transparent', name: 'شفاف', color: 'transparent' },
    { id: 'black', name: 'أسود', color: 'rgba(0,0,0,0.8)' },
    { id: 'dark', name: 'داكن', color: 'rgba(30,30,30,0.9)' },
    { id: 'blue', name: 'أزرق', color: 'rgba(0,80,180,0.9)' },
    { id: 'red', name: 'أحمر', color: 'rgba(180,0,0,0.9)' },
    { id: 'green', name: 'أخضر', color: 'rgba(0,120,0,0.9)' },
]
