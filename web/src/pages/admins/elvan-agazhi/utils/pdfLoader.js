import * as pdfjsLib from 'pdfjs-dist';

// Use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

export const PDF_SCALE = 3.0;   // Display scale
export const OCR_SCALE = 6.0;   // Internal OCR scale (higher = sharper text)

/**
 * Load a PDF document from an ArrayBuffer.
 * @param {ArrayBuffer} data
 * @returns {Promise<PDFDocumentProxy>}
 */
export async function loadPdfDocument(data) {
    return pdfjsLib.getDocument({ data }).promise;
}

/**
 * Render a single page of a PDF to an offscreen canvas.
 * @param {PDFDocumentProxy} pdfDoc
 * @param {number} pageNum  1-indexed
 * @param {number} scale
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function renderPageToCanvas(pdfDoc, pageNum, scale) {
    const page = await pdfDoc.getPage(pageNum);
    const vp = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = vp.width;
    canvas.height = vp.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    return canvas;
}
