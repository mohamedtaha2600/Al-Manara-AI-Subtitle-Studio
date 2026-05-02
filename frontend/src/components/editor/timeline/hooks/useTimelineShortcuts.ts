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
        setActiveTool,
        isPlaying,
        setIsPlaying,
        setPlayerRate
    } = useProjectStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            // Use e.code for keyboard layout independence (works with Arabic/English/etc.)
            switch (e.code) {
                case 'KeyV':
                    setActiveTool('select');
                    e.preventDefault();
                    break;
                case 'KeyH':
                    setActiveTool('hand');
                    e.preventDefault();
                    break;
                case 'KeyB':
                    setActiveTool('ripple');
                    e.preventDefault();
                    break;
                case 'KeyY':
                    setActiveTool('slip');
                    e.preventDefault();
                    break;
                case 'KeyR':
                case 'KeyC':
                    setActiveTool('razor');
                    e.preventDefault();
                    break;
                case 'KeyT':
                    setActiveTool('text');
                    e.preventDefault();
                    break;
                case 'KeyS':
                    handleSplit(currentTime);
                    e.preventDefault();
                    break;
                case 'Space':
                    e.preventDefault();
                    if (e.shiftKey && e.ctrlKey) {
                        setPlayerRate(5);
                        setIsPlaying(true);
                    } else if (e.shiftKey) {
                        setPlayerRate(2);
                        setIsPlaying(true);
                    } else {
                        // Regular space tap: toggle play/pause and reset to 1x speed
                        if (!isPlaying) setPlayerRate(1); 
                        setIsPlaying(!isPlaying);
                    }
                    break;
                case 'Backspace':
                case 'Delete':
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
