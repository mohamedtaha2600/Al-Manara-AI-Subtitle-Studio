'use client'

import { useProjectStore } from '@/store/useProjectStore'

export const useTranscriptionPolling = () => {
    const {
        addLog,
        startTranscription,
        finishTranscription,
        setTracks,
        setActiveTrack,
    } = useProjectStore()

    const pollTranscriptionStatus = async (jobId: string) => {
        let attempts = 0
        const maxAttempts = 900 // 30 minutes
        let lastMessage = ''

        const poll = async () => {
            if (attempts >= maxAttempts) {
                addLog('error', '⏰ انتهت مهلة الانتظار')
                return
            }

            attempts++

            try {
                const response = await fetch(`/api/transcribe/${jobId}`)
                const data = await response.json()

                if (data.message !== lastMessage) {
                    addLog('info', data.message)
                    lastMessage = data.message
                }

                if (data.status === 'completed') {
                    finishTranscription(data)

                    if (data.tracks && data.tracks.length > 0) {
                        const parsedTracks = data.tracks.map((t: any) => ({
                            id: t.id,
                            name: t.name,
                            language: t.language,
                            segments: t.segments,
                            style: useProjectStore.getState().style,
                            isVisible: true,
                            isLocked: false
                        }))

                        setTracks(parsedTracks)

                        const targetTrack = parsedTracks.find((t: any) => t.type === 'translation') || parsedTracks[0]
                        if (targetTrack) {
                            setActiveTrack(targetTrack.id)
                        }
                    }

                    const count = data.tracks ? data.tracks.length + ' مسارات' : (data.segments?.length || 0) + ' مقطع'
                    addLog('success', `✅ تم! ${count}`)
                    return
                } else if (data.status === 'failed') {
                    addLog('error', `❌ فشل: ${data.message}`)
                    return
                } else {
                    setTimeout(poll, 2000)
                }
            } catch (err) {
                setTimeout(poll, 5000)
            }
        }

        poll()
    }

    return { pollTranscriptionStatus }
}
