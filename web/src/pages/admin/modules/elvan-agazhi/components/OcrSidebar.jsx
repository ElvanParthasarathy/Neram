import React, { useState } from 'react';
import {
    RiUploadCloud2Line, RiArrowLeftSLine, RiArrowRightSLine,
    RiFlashlightLine, RiStackLine, RiFileCopyLine,
    RiFileListLine, RiArrowRightLine, RiSettings4Line,
    RiCheckLine, RiFilePdfLine, RiCropLine, RiDragMoveLine
} from 'react-icons/ri';
import { useToast } from '../../../../../contexts/ToastContext';

const OcrSidebar = ({
    // File upload
    fileName, onFileSelect,
    // Page nav
    currentPage, totalPages, onPrevPage, onNextPage, showPageControls,
    // OCR settings
    psmMode, onPsmChange, cleanText, onCleanTextToggle,
    // Actions
    onExtractSingle, onExtractBatch, isExtracting,
    // Progress – single
    singleProgress,
    // Progress – batch
    batchProgress,
    // Output
    outputText, showCopy, showCompare, showNext,
    onCopy, onCompare, onNext,
    // Show OCR controls
    showOcrControls,
    // Drag mode
    dragMode, onToggleDragMode
}) => {
    const { showToast } = useToast();
    const [showSettings, setShowSettings] = useState(false);

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') onFileSelect(file);
    };

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') onFileSelect(file);
        else if (file) showToast('Please select a valid PDF file.');
    };

    const isProcessing = singleProgress || batchProgress;
    const progressPercent = batchProgress?.overallPercent || singleProgress?.progress || 0;
    const progressLabel = batchProgress 
        ? `Page ${batchProgress.currentPage}/${batchProgress.totalPages}` 
        : singleProgress?.status || '';

    return (
        <div className="ea-toolbar">
            {/* Left: File + Nav */}
            <div className="ea-toolbar-group">
                <div className="ea-file-zone" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
                    <input type="file" accept="application/pdf" onChange={handleFileInput} />
                    {fileName ? (
                        <div className="ea-file-loaded">
                            <RiFilePdfLine className="ea-file-icon" />
                            <span className="ea-file-label">{fileName}</span>
                        </div>
                    ) : (
                        <div className="ea-file-empty">
                            <RiUploadCloud2Line />
                            <span>Upload PDF</span>
                        </div>
                    )}
                </div>

                {showPageControls && (
                    <div className="ea-nav-pill">
                        <button onClick={onPrevPage} disabled={currentPage <= 1}>
                            <RiArrowLeftSLine />
                        </button>
                        <span className="ea-nav-label">
                            <strong>{currentPage}</strong> / {totalPages}
                        </span>
                        <button onClick={onNextPage} disabled={currentPage >= totalPages}>
                            <RiArrowRightSLine />
                        </button>
                    </div>
                )}

                {/* Move/Crop toggle */}
                {showPageControls && (
                    <button
                        className={`ea-action-btn ${dragMode === 'crop' ? 'ea-action-primary' : 'ea-action-ghost'}`}
                        onClick={onToggleDragMode}
                        title={dragMode === 'crop' ? 'Switch to Move mode' : 'Switch to Crop mode'}
                    >
                        {dragMode === 'crop' ? <RiCropLine /> : <RiDragMoveLine />}
                        <span>{dragMode === 'crop' ? 'Crop' : 'Move'}</span>
                    </button>
                )}
            </div>

            {/* Center: Actions */}
            {showOcrControls && (
                <div className="ea-toolbar-group ea-toolbar-center">
                    <button 
                        className="ea-action-btn ea-action-primary" 
                        disabled={isExtracting} 
                        onClick={onExtractSingle}
                    >
                        <RiFlashlightLine />
                        <span>{isExtracting && singleProgress ? 'Extracting...' : 'Extract Page'}</span>
                    </button>

                    <button 
                        className="ea-action-btn ea-action-success" 
                        disabled={isExtracting} 
                        onClick={onExtractBatch}
                    >
                        <RiStackLine />
                        <span>{isExtracting && batchProgress ? 'Processing...' : 'Extract All'}</span>
                    </button>

                    <button 
                        className={`ea-action-btn ea-action-ghost ${showSettings ? 'active' : ''}`}
                        onClick={() => setShowSettings(!showSettings)}
                    >
                        <RiSettings4Line />
                    </button>

                    {/* Inline settings dropdown */}
                    {showSettings && (
                        <div className="ea-settings-dropdown">
                            <label className="ea-settings-label">OCR Mode</label>
                            <select className="ea-settings-select" value={psmMode} onChange={(e) => onPsmChange(e.target.value)}>
                                <option value="4">Single column</option>
                                <option value="6">Uniform block</option>
                                <option value="3">Auto detect</option>
                                <option value="11">Sparse text</option>
                            </select>
                            <label className="ea-settings-check" onClick={onCleanTextToggle}>
                                <span className={`ea-check-box ${cleanText ? 'checked' : ''}`}>
                                    {cleanText && <RiCheckLine />}
                                </span>
                                Auto-clean output
                            </label>
                        </div>
                    )}
                </div>
            )}

            {/* Progress bar – appears inline */}
            {isProcessing && (
                <div className="ea-toolbar-progress">
                    <div className="ea-progress-bar">
                        <div className="ea-progress-fill" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <span className="ea-progress-label">{progressLabel} — {progressPercent}%</span>
                </div>
            )}

        </div>
    );
};

export default OcrSidebar;
