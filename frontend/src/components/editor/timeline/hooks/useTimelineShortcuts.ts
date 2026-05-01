import { useEffect } from 'react';
import { useProjectStore } from '@/store/useProjectStore';

export function useTimelineShortcuts(
    currentTime: number,
    handleSplit: (time: number) => void
) {
    const {
        multiSelectActionIds,
        deleteSegment,
        deleteVideoSegment,
        setMultiSelectActionIds,
        setActiveTool
    } = useProjectStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.key.toLowerCase()) {
                case 'v':
                    setActiveTool('select');
                    e.preventDefault();
                    break;
                case 'b':
                    setActiveTool('ripple');
                    e.preventDefault();
                    break;
                case 'y':
                    setActiveTool('slip');
                    e.preventDefault();
                    break;
                case 'r':
                case 'c':
                    setActiveTool('razor');
                    e.preventDefault();
                    break;
                case 't':
                    setActiveTool('text');
                    e.preventDefault();
                    break;
                case 'backspace':
                    if (multiSelectActionIds.length > 0) {
                        multiSelectActionIds.forEach((fullId: string) => {
                            const isVideo = fullId.startsWith('video-');
                            const isWaveform = fullId.startsWith('waveform-');

                            const match = fullId.match(/(\d+)$/);
                            if (!match) return;
                            const id = parseInt(match[1]);

                            if (!isVideo && !isWaveform) deleteSegment(id);
                            else if (isVideo || isWaveform) deleteVideoSegment(id);
                        });
                        setMultiSelectActionIds([]);
                        e.preventDefault();
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentTime, multiSelectActionIds, handleSplit, deleteSegment, deleteVideoSegment, setMultiSelectActionIds]);
}
