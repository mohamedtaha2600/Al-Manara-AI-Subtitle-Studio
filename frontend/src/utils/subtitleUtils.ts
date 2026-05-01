export const formatTimeSRT = (seconds: number): string => {
    const date = new Date(0);
    date.setSeconds(seconds);
    date.setMilliseconds((seconds % 1) * 1000);
    const timeStr = date.toISOString().substr(11, 12);
    return timeStr.replace('.', ',');
};

export const formatTimeVTT = (seconds: number): string => {
    const date = new Date(0);
    date.setSeconds(seconds);
    date.setMilliseconds((seconds % 1) * 1000);
    return date.toISOString().substr(11, 12);
};

export const generateSRT = (segments: any[]): string => {
    return segments.map((seg, index) => {
        return `${index + 1}\n${formatTimeSRT(seg.start)} --> ${formatTimeSRT(seg.end)}\n${seg.text.trim()}\n`;
    }).join('\n');
};

export const generateVTT = (segments: any[]): string => {
    return 'WEBVTT\n\n' + segments.map((seg) => {
        return `${formatTimeVTT(seg.start)} --> ${formatTimeVTT(seg.end)}\n${seg.text.trim()}\n`;
    }).join('\n');
};

export const generateTXT = (segments: any[]): string => {
    return segments.map(seg => seg.text.trim()).join('\n');
};

/**
 * Parse SRT timestamp to seconds
 * Format: HH:MM:SS,mmm or HH:MM:SS.mmm
 */
export const parseTimeToSeconds = (timeStr: string): number => {
    // Handle both comma (SRT) and period (VTT) formats
    const normalized = timeStr.trim().replace(',', '.');
    const parts = normalized.split(':');

    if (parts.length !== 3) return 0;

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const secondsParts = parts[2].split('.');
    const seconds = parseInt(secondsParts[0], 10);
    const milliseconds = secondsParts[1] ? parseInt(secondsParts[1].padEnd(3, '0').slice(0, 3), 10) : 0;

    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
};

/**
 * Parse SRT file content into SubtitleSegment array
 * SRT Format:
 * 1
 * 00:00:01,000 --> 00:00:04,000
 * Text line 1
 * Text line 2
 * 
 * 2
 * ...
 */
export const parseSRT = (content: string): { id: number; start: number; end: number; text: string }[] => {
    const segments: { id: number; start: number; end: number; text: string }[] = [];

    // Normalize line endings and split into blocks
    const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const blocks = normalized.split(/\n\n+/).filter(block => block.trim());

    for (const block of blocks) {
        const lines = block.split('\n').filter(line => line.trim());
        if (lines.length < 2) continue;

        // First line is typically the index (we'll use our own)
        // Find the timestamp line (contains -->)
        const timestampLineIndex = lines.findIndex(line => line.includes('-->'));
        if (timestampLineIndex === -1) continue;

        const timestampLine = lines[timestampLineIndex];
        const timestampMatch = timestampLine.match(/(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/);

        if (!timestampMatch) continue;

        const start = parseTimeToSeconds(timestampMatch[1]);
        const end = parseTimeToSeconds(timestampMatch[2]);

        // Text is everything after the timestamp line
        const text = lines.slice(timestampLineIndex + 1).join('\n').trim();

        if (text) {
            segments.push({
                id: segments.length + 1,
                start,
                end,
                text
            });
        }
    }

    return segments;
};

/**
 * Parse VTT file content into SubtitleSegment array
 * VTT Format:
 * WEBVTT
 * 
 * 00:00:01.000 --> 00:00:04.000
 * Text line 1
 * 
 * ...
 */
export const parseVTT = (content: string): { id: number; start: number; end: number; text: string }[] => {
    const segments: { id: number; start: number; end: number; text: string }[] = [];

    // Normalize line endings
    let normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Remove WEBVTT header and any metadata
    const headerEnd = normalized.indexOf('\n\n');
    if (headerEnd !== -1 && normalized.substring(0, headerEnd).includes('WEBVTT')) {
        normalized = normalized.substring(headerEnd + 2);
    }

    const blocks = normalized.split(/\n\n+/).filter(block => block.trim());

    for (const block of blocks) {
        const lines = block.split('\n').filter(line => line.trim());
        if (lines.length < 1) continue;

        // Find the timestamp line
        const timestampLineIndex = lines.findIndex(line => line.includes('-->'));
        if (timestampLineIndex === -1) continue;

        const timestampLine = lines[timestampLineIndex];
        // VTT can have optional cue settings after timestamps
        const timestampMatch = timestampLine.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/);

        if (!timestampMatch) continue;

        const start = parseTimeToSeconds(timestampMatch[1]);
        const end = parseTimeToSeconds(timestampMatch[2]);

        // Text is everything after the timestamp line
        const text = lines.slice(timestampLineIndex + 1).join('\n').trim();

        if (text) {
            segments.push({
                id: segments.length + 1,
                start,
                end,
                text
            });
        }
    }

    return segments;
};
