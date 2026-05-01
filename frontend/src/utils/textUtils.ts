/**
 * Utility functions for text processing
 */

/**
 * Removes Arabic diacritics (Harakat) from a string.
 */
export const removeDiacritics = (text: string): string => {
    // Range: \u064B-\u065F (Fathatan to Shadda), \u0670 (Dagger Alif)
    return text.replace(/[\u064B-\u065F\u0670]/g, '');
};

/**
 * Removes punctuation from a string, supporting both standard and Arabic punctuation.
 */
export const removePunctuation = (text: string): string => {
    // English: . , ! ? ; : - _ ( ) [ ] { } " '
    // Arabic: ، ؛ ؟
    return text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()،؛؟]/g, "").replace(/\s{2,}/g, " ");
};

/**
 * Filters text based on visibility settings.
 */
export const filterSubtitleText = (text: string, settings: { showDiacritics: boolean, showPunctuation: boolean }): string => {
    let result = text;
    if (!settings.showDiacritics) {
        result = removeDiacritics(result);
    }
    if (!settings.showPunctuation) {
        result = removePunctuation(result);
    }
    return result;
};
