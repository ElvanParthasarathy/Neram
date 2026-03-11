import React, { useEffect, useRef } from 'react';
import { RiFileLine } from 'react-icons/ri';

const PdfWorkspace = ({ pdfImageSrc, isLoading, loadingText, onCropperReady }) => {
    const imageRef = useRef(null);
    const cropperRef = useRef(null);

    // Initialize / reinitialize cropper when image source changes
    useEffect(() => {
        if (!pdfImageSrc || !imageRef.current) return;

        // Dynamic import to avoid SSR issues
        import('cropperjs').then(({ default: Cropper }) => {
            import('cropperjs/dist/cropper.css');

            if (cropperRef.current) cropperRef.current.destroy();

            cropperRef.current = new Cropper(imageRef.current, {
                viewMode: 1,
                dragMode: 'crop',
                background: true,
                zoomable: true,
                rotatable: false,
                scalable: false,
                autoCrop: false,
                toggleDragModeOnDblclick: false,
            });

            if (onCropperReady) onCropperReady(cropperRef.current);
        });

        return () => {
            if (cropperRef.current) {
                cropperRef.current.destroy();
                cropperRef.current = null;
            }
        };
    }, [pdfImageSrc]);

    return (
        <section className="ea-workspace">
            {/* Loading overlay */}
            <div className={`ea-loading-overlay ${isLoading ? 'active' : ''}`}>
                <div className="ea-spinner"></div>
                <div className="ea-loading-text">{loadingText || 'Processing...'}</div>
            </div>

            {/* Empty state */}
            {!pdfImageSrc && !isLoading && (
                <div className="ea-workspace-empty">
                    <div className="ea-empty-icon"><RiFileLine /></div>
                    <h3>No Document Loaded</h3>
                    <p>Upload a PDF to render it here. Crop a column and extract text via OCR.</p>
                </div>
            )}

            {/* PDF with cropper */}
            <div className={`ea-pdf-container ${pdfImageSrc ? 'active' : ''}`}>
                <canvas style={{ display: 'none' }}></canvas>
                <img ref={imageRef} src={pdfImageSrc || ''} alt="PDF Page" />
            </div>
        </section>
    );
};

export default PdfWorkspace;
