/**
 * Clean raw OCR output — strip artifacts, normalize whitespace.
 * @param {string} raw
 * @returns {string}
 */
export function cleanExtractedText(raw) {
    let lines = raw.split('\n').map(l => {
        l = l.replace(/^[|[\](){}]+\s*/g, '');
        l = l.replace(/\s*[|[\](){}]+$/g, '');
        l = l.replace(/\s{2,}/g, '  ');
        return l.trim();
    })
        .filter(l => l.length > 0)
        .filter(l => l.replace(/[\s|[\](){}\-_.,:/]/g, '').length >= 1);
    return lines.join('\n');
}
