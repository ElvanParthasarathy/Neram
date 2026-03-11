import Tesseract from 'tesseract.js';
import { renderPageToCanvas, OCR_SCALE, PDF_SCALE } from './pdfLoader';
import { cleanExtractedText } from './textCleanup';

/**
 * Upscale a canvas by a given factor for sharper OCR input.
 */
export function upscaleCanvas(srcCanvas, factor) {
    if (factor <= 1) return srcCanvas;
    const c = document.createElement('canvas');
    c.width = Math.round(srcCanvas.width * factor);
    c.height = Math.round(srcCanvas.height * factor);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(srcCanvas, 0, 0, c.width, c.height);
    return c;
}

/**
 * Preprocess a canvas for OCR — binarize text and remove long lines/borders.
 */
export function preprocessCanvas(srcCanvas) {
    const c = document.createElement('canvas');
    c.width = srcCanvas.width;
    c.height = srcCanvas.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(srcCanvas, 0, 0);
    const imgData = ctx.getImageData(0, 0, c.width, c.height);
    const px = imgData.data;
    const w = c.width, h = c.height;
    const bin = new Uint8Array(w * h);
    const thr = 160;

    for (let i = 0; i < px.length; i += 4) {
        bin[i / 4] = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) < thr ? 1 : 0;
    }

    const mask = new Uint8Array(w * h);
    const lineLen = 50;

    // Horizontal line detection
    for (let y = 0; y < h; y++) {
        let rs = -1;
        for (let x = 0; x <= w; x++) {
            if (x < w && bin[y * w + x]) {
                if (rs === -1) rs = x;
            } else {
                if (rs !== -1) {
                    if (x - rs > lineLen) for (let k = rs; k < x; k++) mask[y * w + k] = 1;
                    rs = -1;
                }
            }
        }
    }

    // Vertical line detection
    for (let x = 0; x < w; x++) {
        let rs = -1;
        for (let y = 0; y <= h; y++) {
            if (y < h && bin[y * w + x]) {
                if (rs === -1) rs = y;
            } else {
                if (rs !== -1) {
                    if (y - rs > lineLen) for (let k = rs; k < y; k++) mask[k * w + x] = 1;
                    rs = -1;
                }
            }
        }
    }

    // Apply: keep text pixels, remove lines
    for (let i = 0; i < w * h; i++) {
        const cl = (bin[i] === 1 && mask[i] === 0) ? 0 : 255;
        const idx = i * 4;
        px[idx] = px[idx + 1] = px[idx + 2] = cl;
        px[idx + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
    return c;
}

/**
 * OCR a single cropped canvas.
 * @param {HTMLCanvasElement} croppedCanvas
 * @param {string} psmMode  Tesseract PSM value
 * @param {boolean} shouldClean
 * @param {function} onProgress  ({status, progress})
 * @returns {Promise<string>}
 */
export async function extractSinglePage(croppedCanvas, psmMode, shouldClean, onProgress) {
    const upscaled = upscaleCanvas(croppedCanvas, 2);
    const processed = preprocessCanvas(upscaled);

    const worker = await Tesseract.createWorker('eng', 1, {
        logger: m => {
            if (onProgress) {
                if (m.status === 'recognizing text') {
                    onProgress({ status: 'Extracting...', progress: Math.round(m.progress * 100) });
                } else {
                    onProgress({ status: m.status.charAt(0).toUpperCase() + m.status.slice(1), progress: 0 });
                }
            }
        }
    });

    await worker.setParameters({ tessedit_pageseg_mode: psmMode, preserve_interword_spaces: '1' });
    const { data: { text } } = await worker.recognize(processed);
    await worker.terminate();

    return shouldClean ? cleanExtractedText(text) : text;
}

/**
 * Batch-extract OCR text from all pages of a PDF using the same crop region.
 * @returns {Promise<Array<{pageNum, imageDataURL, text}>>}
 */
export async function extractAllPages(pdfDoc, cropData, psmMode, shouldClean, onPageProgress) {
    const scaleFactor = OCR_SCALE / PDF_SCALE;
    const totalPages = pdfDoc.numPages;
    const results = [];

    const worker = await Tesseract.createWorker('eng', 1);
    await worker.setParameters({ tessedit_pageseg_mode: psmMode, preserve_interword_spaces: '1' });

    try {
        for (let p = 1; p <= totalPages; p++) {
            if (onPageProgress) {
                onPageProgress({
                    currentPage: p,
                    totalPages,
                    overallPercent: Math.round(((p - 1) / totalPages) * 100),
                    subLabel: `Rendering page ${p} at high-res...`
                });
            }

            // Render at OCR scale
            const canvas = await renderPageToCanvas(pdfDoc, p, OCR_SCALE);

            // Crop the same region at higher resolution
            const cx = Math.round(cropData.x * scaleFactor);
            const cy = Math.round(cropData.y * scaleFactor);
            const cw = Math.round(cropData.width * scaleFactor);
            const ch = Math.round(cropData.height * scaleFactor);

            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = cw;
            cropCanvas.height = ch;
            const cropCtx = cropCanvas.getContext('2d');
            cropCtx.drawImage(canvas, cx, cy, cw, ch, 0, 0, cw, ch);

            const croppedDataURL = cropCanvas.toDataURL('image/png');
            const processed = preprocessCanvas(cropCanvas);

            if (onPageProgress) {
                onPageProgress({
                    currentPage: p,
                    totalPages,
                    overallPercent: Math.round(((p - 0.5) / totalPages) * 100),
                    subLabel: `OCR on page ${p}...`
                });
            }

            const { data: { text } } = await worker.recognize(processed);
            const cleaned = shouldClean ? cleanExtractedText(text) : text;

            results.push({ pageNum: p, imageDataURL: croppedDataURL, text: cleaned });

            if (onPageProgress) {
                onPageProgress({
                    currentPage: p,
                    totalPages,
                    overallPercent: Math.round((p / totalPages) * 100),
                    subLabel: p === totalPages ? 'Done! All pages processed.' : `Completed page ${p}.`
                });
            }
        }
    } finally {
        await worker.terminate();
    }

    return results;
}
