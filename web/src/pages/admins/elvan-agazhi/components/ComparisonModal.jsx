import React, { useEffect, useCallback } from 'react';
import { RiArrowLeftSLine, RiArrowRightSLine, RiCloseLine } from 'react-icons/ri';

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const ComparisonModal = ({ isOpen, onClose, batchResults, totalPages, currentIndex, onChangeIndex }) => {

    const goPrev = useCallback(() => {
        if (currentIndex > 0) onChangeIndex(currentIndex - 1);
    }, [currentIndex, onChangeIndex]);

    const goNext = useCallback(() => {
        if (currentIndex < batchResults.length - 1) onChangeIndex(currentIndex + 1);
    }, [currentIndex, batchResults.length, onChangeIndex]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') goPrev();
            if (e.key === 'ArrowRight') goNext();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, goPrev, goNext, onClose]);

    if (!isOpen || batchResults.length === 0) return null;

    const r = batchResults[currentIndex];

    return (
        <div className={`ea-modal-backdrop ${isOpen ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="ea-modal">
                {/* Header */}
                <div className="ea-modal-header">
                    <div>
                        <div className="ea-modal-title">Page-by-Page Comparison</div>
                        <div className="ea-modal-page-info">Page {r.pageNum} / {totalPages}</div>
                    </div>
                    <button className="ea-modal-close" onClick={onClose}><RiCloseLine /></button>
                </div>

                {/* Body */}
                <div className="ea-modal-body">
                    <div className="ea-modal-pane">
                        <div className="ea-modal-pane-header">📄 Cropped Image</div>
                        <div className="ea-modal-pane-content">
                            <img src={r.imageDataURL} alt={`Page ${r.pageNum} crop`} />
                        </div>
                    </div>
                    <div className="ea-modal-pane">
                        <div className="ea-modal-pane-header">📝 Extracted Text</div>
                        <div className="ea-modal-pane-content">
                            <pre dangerouslySetInnerHTML={{ __html: escapeHtml(r.text || '(No text extracted)') }} />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="ea-modal-footer">
                    <button className="ea-modal-nav-btn" disabled={currentIndex === 0} onClick={goPrev}>
                        <RiArrowLeftSLine /> Previous
                    </button>
                    <div className="ea-modal-dots">
                        {batchResults.map((_, i) => (
                            <div
                                key={i}
                                className={`ea-page-dot ${i === currentIndex ? 'active' : 'done'}`}
                                title={`Page ${batchResults[i].pageNum}`}
                                onClick={() => onChangeIndex(i)}
                            />
                        ))}
                    </div>
                    <button className="ea-modal-nav-btn" disabled={currentIndex === batchResults.length - 1} onClick={goNext}>
                        Next <RiArrowRightSLine />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComparisonModal;
