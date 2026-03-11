import React from 'react';
import {
    RiUploadCloud2Line, RiArrowLeftSLine, RiArrowRightSLine,
    RiFlashlightLine, RiStackLine, RiFileCopyLine,
    RiFileListLine, RiArrowRightLine, RiInformationLine
} from 'react-icons/ri';

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
    showOcrControls
}) => {

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') onFileSelect(file);
    };

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') onFileSelect(file);
        else if (file) alert('Please select a valid PDF file.');
    };

    return (
        <aside className="ea-sidebar">
            {/* Step 1: Upload */}
            <div className="ea-sidebar-section">
                <div className="ea-section-label">
                    <span className="ea-step-num">1</span> Load Document
                </div>
                <div className="ea-file-drop" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
                    <input type="file" accept="application/pdf" onChange={handleFileInput} />
                    <div className="ea-drop-icon"><RiUploadCloud2Line /></div>
                    <div className="ea-drop-label">Click to upload PDF</div>
                    <div className="ea-drop-sublabel">or drag and drop</div>
                    <div className={`ea-file-name ${fileName ? 'visible' : ''}`}>✓ {fileName}</div>
                </div>
            </div>

            {/* Step 2: Page Nav */}
            {showPageControls && (
                <div className="ea-sidebar-section">
                    <div className="ea-section-label">
                        <span className="ea-step-num">2</span> Navigate
                    </div>
                    <div className="ea-page-nav">
                        <button onClick={onPrevPage} disabled={currentPage <= 1}>
                            <RiArrowLeftSLine />
                        </button>
                        <span className="ea-page-info">
                            Page <strong>{currentPage}</strong> / {totalPages}
                        </span>
                        <button onClick={onNextPage} disabled={currentPage >= totalPages}>
                            <RiArrowRightSLine />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: OCR Controls */}
            {showOcrControls && (
                <div className="ea-sidebar-section">
                    <div className="ea-section-label">
                        <span className="ea-step-num">3</span> Extract
                    </div>

                    <div className="ea-tip-badge">
                        <RiInformationLine />
                        Crop a single column, then extract
                    </div>

                    <label style={{ fontSize: '11px', color: 'var(--mac-text-secondary)', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                        OCR Mode
                    </label>
                    <select className="ea-select" value={psmMode} onChange={(e) => onPsmChange(e.target.value)}>
                        <option value="4">Single column varying sizes</option>
                        <option value="6">Uniform block of text</option>
                        <option value="3">Fully automatic</option>
                        <option value="11">Sparse text / Scrape all</option>
                    </select>

                    <label className="ea-checkbox-row">
                        <input type="checkbox" checked={cleanText} onChange={onCleanTextToggle} />
                        Auto-clean &amp; format output
                    </label>

                    {/* Single page button */}
                    <button className="ea-btn ea-btn-extract" disabled={isExtracting} onClick={onExtractSingle}>
                        <RiFlashlightLine />
                        <span>{isExtracting ? 'Processing...' : 'Extract This Page'}</span>
                    </button>

                    {/* Batch button */}
                    <button className="ea-btn ea-btn-batch" disabled={isExtracting} onClick={onExtractBatch}>
                        <RiStackLine />
                        <span>{isExtracting ? 'Processing...' : 'Extract ALL Pages'}</span>
                    </button>

                    {/* Single progress */}
                    <div className={`ea-progress ${singleProgress ? 'active' : ''}`}>
                        <div className="ea-progress-info">
                            <span>{singleProgress?.status || 'Initializing...'}</span>
                            <span>{singleProgress?.progress || 0}%</span>
                        </div>
                        <div className="ea-progress-track">
                            <div className="ea-progress-fill" style={{ width: `${singleProgress?.progress || 0}%` }}></div>
                        </div>
                    </div>

                    {/* Batch progress */}
                    <div className={`ea-batch-progress ${batchProgress ? 'active' : ''}`}>
                        <div className="ea-batch-label">
                            <span>Page {batchProgress?.currentPage || 0} / {batchProgress?.totalPages || 0}</span>
                            <span>{batchProgress?.overallPercent || 0}%</span>
                        </div>
                        <div className="ea-batch-track">
                            <div className="ea-batch-fill" style={{ width: `${batchProgress?.overallPercent || 0}%` }}></div>
                        </div>
                        <div className="ea-batch-sub">{batchProgress?.subLabel || 'Initializing...'}</div>
                    </div>
                </div>
            )}

            {/* Step 4: Output */}
            <div className="ea-sidebar-section ea-output-section" style={{ flex: 1 }}>
                <div className="ea-output-header">
                    <div className="ea-section-label" style={{ marginBottom: 0 }}>
                        <span className="ea-step-num">4</span> Result
                    </div>
                    <div className="ea-output-btns">
                        <button className={`ea-btn-small ${showCompare ? 'visible' : ''}`} onClick={onCompare} title="Compare extracted data page by page">
                            <RiFileListLine /> Compare
                        </button>
                        <button className={`ea-btn-small ${showCopy ? 'visible' : ''}`} onClick={onCopy}>
                            <RiFileCopyLine /> Copy
                        </button>
                    </div>
                </div>
                <textarea
                    className="ea-output-textarea"
                    value={outputText}
                    readOnly
                    placeholder="Extracted text will appear here..."
                />
                <button className={`ea-btn ea-btn-next ${showNext ? 'visible' : ''}`} onClick={onNext}>
                    <RiArrowRightLine /> Next → Build Calendar
                </button>
            </div>
        </aside>
    );
};

export default OcrSidebar;
