'use client'

import { useProjectStore } from '@/store/useProjectStore'
import EditorInterface from '@/components/editor/EditorInterface'
import Dashboard from '@/components/dashboard/Dashboard'

export default function Home() {
    const { currentView } = useProjectStore()

    if (currentView === 'editor') {
        return <EditorInterface />
    }

    return <Dashboard />
}
