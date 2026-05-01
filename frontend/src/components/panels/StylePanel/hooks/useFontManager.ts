'use client'

import { useState, useCallback } from 'react'
import { useProjectStore } from '@/store/useProjectStore'

export function useFontManager() {
    const { addLog, style, setStyle } = useProjectStore()
    const [systemFonts, setSystemFonts] = useState<any[]>([])

    const loadSystemFonts = useCallback(async () => {
        try {
            if ('queryLocalFonts' in window) {
                const fonts = await (window as any).queryLocalFonts();
                // Deduplicate families
                const families = new Set();
                const uniqueFonts = fonts.filter((f: any) => {
                    if (families.has(f.family)) return false;
                    families.add(f.family);
                    return true;
                });

                setSystemFonts(uniqueFonts);
                // Also store globally if needed by other components
                (window as any).systemFonts = uniqueFonts;

                // Trigger re-render by updating style (hack used in original code)
                setStyle({ ...style });

                addLog('success', `تم تحميل ${uniqueFonts.length} خط من جهازك!`)
            } else {
                alert('متصفحك لا يدعم هذه الميزة (جرب Chrome/Edge)')
            }
        } catch (err) {
            console.error(err)
            addLog('error', 'فشل تحميل الخطوط (تأكد من الموافقة على الصلاحية)')
        }
    }, [addLog, style, setStyle])

    return {
        systemFonts,
        loadSystemFonts
    }
}
