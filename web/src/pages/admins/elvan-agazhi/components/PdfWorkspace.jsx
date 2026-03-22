import React, { useEffect, useRef } from 'react';
import { RiFileTextLine, RiCropLine } from 'react-icons/ri';

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
                dragMode: 'move',
                background: true,
                zoomable: true,
                zoomOnWheel: true,
                zoomOnTouch: true,
                rotatable: false,
                scalable: false,
                autoCrop: false,
                toggleDragModeOnDblclick: true,
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
            {isLoading && (
                <div className="ea-loading-overlay active">
                    <div className="ea-loading-card">
                        <div className="ea-spinner"></div>
                        <div className="ea-loading-text">{loadingText || 'Processing...'}</div>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!pdfImageSrc && !isLoading && (
                <div className="ea-workspace-empty">
                    <div className="ea-empty-visual">
                        <RiFileTextLine className="ea-empty-icon-main" />
                        <RiCropLine className="ea-empty-icon-sub" />
                    </div>
                    <h3>Upload a PDF to get started</h3>
                    <p>Load your academic calendar PDF, crop a column, and extract events using OCR.</p>
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
