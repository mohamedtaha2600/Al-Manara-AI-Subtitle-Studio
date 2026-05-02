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
                
                // --- J/K/L PROFESSIONAL SCRUBBING ---
                case 'KeyL':
                    e.preventDefault();
                    if (!isPlaying) {
                        setIsPlaying(true);
                        setPlayerRate(1);
                    } else {
                        // Cycle rates: 1x -> 2x -> 4x -> 8x
                        const rates = [1, 2, 4, 8];
                        const currentRate = useProjectStore.getState().playerRate;
                        const nextRate = rates.find(r => r > currentRate) || 1;
                        setPlayerRate(nextRate);
                    }
                    break;
                case 'KeyK':
                    e.preventDefault();
                    setIsPlaying(false);
                    setPlayerRate(1);
                    break;
                case 'KeyJ':
                    e.preventDefault();
                    // Reverse playback is hardware-dependent in browsers, 
                    // for now we stop or set to 1x to avoid errors
                    setIsPlaying(false); 
                    setPlayerRate(1);
                    break;

                // --- FRAME NAVIGATION ---
                case 'ArrowRight':
                    e.preventDefault();
                    {
                        const step = e.shiftKey ? 1.0 : 0.04; // 1s or ~1 frame (25fps)
                        useProjectStore.getState().setCurrentTime(currentTime + step);
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    {
                        const step = e.shiftKey ? 1.0 : 0.04;
                        useProjectStore.getState().setCurrentTime(Math.max(0, currentTime - step));
                    }
                    break;
                
                // --- SEGMENT NAVIGATION ---
                case 'ArrowDown':
                    e.preventDefault();
                    {
                        const state = useProjectStore.getState();
                        const next = state.segments.find(s => s.start > currentTime + 0.1);
                        if (next) {
                            state.setCurrentTime(next.start);
                            state.setCurrentSegment(next.id);
                        }
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    {
                        const state = useProjectStore.getState();
                        // Find the segment that ends before current time, or the one we are in
                        const prev = [...state.segments].reverse().find(s => s.start < currentTime - 0.5);
                        if (prev) {
                            state.setCurrentTime(prev.start);
                            state.setCurrentSegment(prev.id);
                        }
                    }
                    break;

                // --- ZOOM SHORTCUTS (TO PLAYHEAD) ---
                case 'Equal':
                case 'NumpadAdd':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        const oldZoom = useProjectStore.getState().timelineZoom;
                        useProjectStore.getState().setTimelineZoom(Math.min(10, oldZoom * 1.5));
                    }
                    break;
                case 'Minus':
                case 'NumpadSubtract':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        const oldZoom = useProjectStore.getState().timelineZoom;
                        useProjectStore.getState().setTimelineZoom(Math.max(0.01, oldZoom / 1.5));
                    }
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
