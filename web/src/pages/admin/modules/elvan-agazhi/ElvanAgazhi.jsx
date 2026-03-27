import React, { useState, useRef, useCallback, useEffect } from 'react';

// Sub-components
import OcrSidebar from './components/OcrSidebar';
import PdfWorkspace from './components/PdfWorkspace';
import ComparisonModal from './components/ComparisonModal';
import CalendarBuilder from '../../../../components/features/CalendarBuilder';

// Utilities
import { loadPdfDocument, renderPageToCanvas, PDF_SCALE } from './utils/pdfLoader';
import { extractSinglePage, extractAllPages } from './utils/ocrEngine';
import { parseAllPages } from './utils/calendarParser';
import { buildRTDBEvents, downloadRTDBJson } from './utils/calendarExport';

// Styles
import '../../../../styles/admin/elvan-agazhi.css';

// Firebase
import { db } from '../../../../firebase';
import { ref, set, get } from 'firebase/database';
import { RiFileListLine, RiFileCopyLine, RiArrowRightLine } from 'react-icons/ri';
import { useToast } from '../../../../contexts/ToastContext';

const ElvanAgazhi = ({ preselectedBatch }) => {
    const { showToast } = useToast();
    // ─── PDF State ───
    const [pdfDoc, setPdfDoc] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [pdfImageSrc, setPdfImageSrc] = useState('');
    const [fileName, setFileName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');

    // ─── Cropper ───
    const cropperRef = useRef(null);
    const [dragMode, setDragMode] = useState('move');

    const toggleDragMode = useCallback(() => {
        const newMode = dragMode === 'move' ? 'crop' : 'move';
        setDragMode(newMode);
        if (cropperRef.current) {
            cropperRef.current.setDragMode(newMode);
        }
    }, [dragMode]);

    // ─── OCR State ───
    const [psmMode, setPsmMode] = useState('4');
    const [cleanText, setCleanText] = useState(true);
    const [isExtracting, setIsExtracting] = useState(false);
    const [singleProgress, setSingleProgress] = useState(null);
    const [batchProgress, setBatchProgress] = useState(null);
    const [outputText, setOutputText] = useState('');

    // ─── Batch Results ───
    const [batchResults, setBatchResults] = useState([]);

    // ─── Modal State ───
    const [showComparison, setShowComparison] = useState(false);
    const [comparisonIndex, setComparisonIndex] = useState(0);

    // ─── Calendar State ───
    const [showCalendar, setShowCalendar] = useState(false);
    const [parsedCalendar, setParsedCalendar] = useState([]);

    // ─── Firebase Push State ───
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [isPushing, setIsPushing] = useState(false);

    // ─── Load batch list from academic_hierarchy on mount ───
    useEffect(() => {
        if (preselectedBatch) {
            setSelectedBatch(preselectedBatch);
            setBatches([preselectedBatch]);
            return;
        }
        get(ref(db, 'academic_hierarchy')).then(snap => {
            if (snap.exists()) {
                const keys = Object.keys(snap.val()).filter(k => k !== 'initialized').sort().reverse();
                setBatches(keys);
                if (keys.length > 0) setSelectedBatch(keys[0]);
            }
        }).catch(() => { });
    }, []);

    // ─── Helpers ───
    const showCopy = outputText.trim().length > 0;
    const showCompare = batchResults.length > 0 && !isExtracting;
    const showNext = batchResults.length > 0 && !isExtracting;

    // ─── PDF Loading ───
    const handleFileSelect = useCallback(async (file) => {
        setFileName(file.name);
        setIsLoading(true);
        setLoadingText('Parsing document...');
        setPdfImageSrc('');
        setBatchResults([]);
        setOutputText('');

        try {
            const reader = new FileReader();
            const arrayBuffer = await new Promise((resolve, reject) => {
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsArrayBuffer(file);
            });

            const doc = await loadPdfDocument(new Uint8Array(arrayBuffer));
            setPdfDoc(doc);
            setTotalPages(doc.numPages);
            setCurrentPage(1);

            // Render first page
            await renderAndShowPage(doc, 1);
        } catch (err) {
            console.error(err);
            showToast('Could not load PDF.');
            setIsLoading(false);
        }
    }, []);

    const renderAndShowPage = async (doc, pageNum) => {
        setIsLoading(true);
        setLoadingText(`Rendering page ${pageNum}...`);

        try {
            const canvas = await renderPageToCanvas(doc, pageNum, PDF_SCALE);
            setPdfImageSrc(canvas.toDataURL('image/png'));
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrevPage = useCallback(() => {
        if (currentPage > 1 && pdfDoc) {
            const newPage = currentPage - 1;
            setCurrentPage(newPage);
            renderAndShowPage(pdfDoc, newPage);
        }
    }, [currentPage, pdfDoc]);

    const handleNextPage = useCallback(() => {
        if (currentPage < totalPages && pdfDoc) {
            const newPage = currentPage + 1;
            setCurrentPage(newPage);
            renderAndShowPage(pdfDoc, newPage);
        }
    }, [currentPage, totalPages, pdfDoc]);

    const handleCropperReady = useCallback((cropper) => {
        cropperRef.current = cropper;
    }, []);

    // ─── Single Page Extract ───
    const handleExtractSingle = useCallback(async () => {
        const cropper = cropperRef.current;
        if (!cropper) return;

        const cd = cropper.getData();
        if (Math.round(cd.width) === 0 || Math.round(cd.height) === 0) {
            showToast('Please draw a crop box around the column you want to extract.');
            return;
        }

        const croppedCanvas = cropper.getCroppedCanvas({ imageSmoothingEnabled: false, imageSmoothingQuality: 'high' });
        if (!croppedCanvas) return;

        setIsExtracting(true);
        setSingleProgress({ status: 'Initializing...', progress: 0 });
        setOutputText('');
        setBatchResults([]);

        try {
            const result = await extractSinglePage(croppedCanvas, psmMode, cleanText, (p) => {
                setSingleProgress(p);
            });
            setOutputText(result.trim() || 'No text found.');
        } catch (err) {
            console.error(err);
            setOutputText('OCR Error: ' + err.message);
        } finally {
            setIsExtracting(false);
            setSingleProgress(null);
        }
    }, [psmMode, cleanText]);

    // ─── Batch Extract ───
    const handleExtractBatch = useCallback(async () => {
        const cropper = cropperRef.current;
        if (!cropper || !pdfDoc) return;

        const cd = cropper.getData();
        if (Math.round(cd.width) === 0 || Math.round(cd.height) === 0) {
            showToast('Please draw a crop box on the current page first. The same crop will be applied to all pages.');
            return;
        }

        setIsExtracting(true);
        setBatchProgress({ currentPage: 0, totalPages: totalPages, overallPercent: 0, subLabel: 'Starting...' });
        setOutputText('');
        setBatchResults([]);

        try {
            const results = await extractAllPages(pdfDoc, cropper.getData(), psmMode, cleanText, (p) => {
                setBatchProgress(p);
            });

            setBatchResults(results);

            let combined = '';
            for (const r of results) {
                combined += `──── Page ${r.pageNum} ────\n${r.text}\n\n`;
            }
            setOutputText(combined.trim());
        } catch (err) {
            console.error(err);
            setOutputText('Batch OCR Error: ' + err.message);
        } finally {
            setIsExtracting(false);
            setTimeout(() => setBatchProgress(null), 2000);
        }
    }, [pdfDoc, totalPages, psmMode, cleanText]);

    // ─── Copy ───
    const handleCopy = useCallback(() => {
        if (!outputText) return;
        navigator.clipboard.writeText(outputText).catch(() => { });
    }, [outputText]);

    // ─── Compare ───
    const handleCompare = useCallback(() => {
        if (batchResults.length === 0) return;
        setComparisonIndex(0);
        setShowComparison(true);
    }, [batchResults]);

    // ─── Calendar ───
    const handleNext = useCallback(() => {
        if (batchResults.length === 0) return;
        const calendar = parseAllPages(batchResults);
        setParsedCalendar(calendar);
        setShowCalendar(true);
    }, [batchResults]);

    const handleCellChange = useCallback((mi, ri, field, value) => {
        setParsedCalendar(prev => {
            const updated = [...prev];
            if (updated[mi] && updated[mi].rows[ri]) {
                const newMonth = { ...updated[mi], rows: [...updated[mi].rows] };
                if (field === '_DELETE_ROW') {
                    newMonth.rows[ri] = { 
                        ...newMonth.rows[ri], 
                        event: '', 
                        workingDay: '', 
                        fullTime: '', 
                        type: '', 
                        isHoliday: false 
                    };
                } else {
                    newMonth.rows[ri] = { ...newMonth.rows[ri], [field]: value };
                }
                updated[mi] = newMonth;
            }
            return updated;
        });
    }, []);

    const handleExport = useCallback(() => {
        const events = buildRTDBEvents(parsedCalendar);
        downloadRTDBJson(events);
    }, [parsedCalendar]);

    // ─── Push to Firebase ───
    const handlePushToFirebase = useCallback(async () => {
        if (!selectedBatch) {
            showToast('Please select a batch first.');
            return;
        }
        const events = buildRTDBEvents(parsedCalendar);
        if (events.length === 0) {
            showToast('No events to push.');
            return;
        }
        if (!confirm(`Push ${events.length} events to batch "${selectedBatch}"? This will replace existing calendar data.`)) return;

        setIsPushing(true);
        try {
            await set(ref(db, `calendars/${selectedBatch}/events`), events);
            showToast(`✅ ${events.length} events pushed to batch ${selectedBatch}!`);
        } catch (err) {
            console.error(err);
            showToast('Push failed: ' + err.message);
        } finally {
            setIsPushing(false);
        }
    }, [parsedCalendar, selectedBatch]);

    return (
        <div className="ea-container">
            {/* Sidebar */}
            <OcrSidebar
                fileName={fileName}
                onFileSelect={handleFileSelect}
                currentPage={currentPage}
                totalPages={totalPages}
                onPrevPage={handlePrevPage}
                onNextPage={handleNextPage}
                showPageControls={totalPages > 0}
                psmMode={psmMode}
                onPsmChange={setPsmMode}
                cleanText={cleanText}
                onCleanTextToggle={() => setCleanText(p => !p)}
                onExtractSingle={handleExtractSingle}
                onExtractBatch={handleExtractBatch}
                isExtracting={isExtracting}
                singleProgress={singleProgress}
                batchProgress={batchProgress}
                outputText={outputText}
                showCopy={showCopy}
                showCompare={showCompare}
                showNext={showNext}
                onCopy={handleCopy}
                onCompare={handleCompare}
                onNext={handleNext}
                showOcrControls={totalPages > 0}
                dragMode={dragMode}
                onToggleDragMode={toggleDragMode}
            />

            {/* PDF Workspace */}
            <PdfWorkspace
                pdfImageSrc={pdfImageSrc}
                isLoading={isLoading}
                loadingText={loadingText}
                onCropperReady={handleCropperReady}
            />

            {/* Bottom Output Actions */}
            {(showCompare || showCopy || showNext) && (
                <div className="ea-toolbar ea-bottom-bar" style={{ marginTop: '10px', justifyContent: 'flex-end' }}>
                    <div className="ea-toolbar-group">
                        {showCompare && (
                            <button className="ea-action-btn ea-action-ghost" onClick={handleCompare}>
                                <RiFileListLine />
                                <span>Compare</span>
                            </button>
                        )}
                        {showCopy && (
                            <button className="ea-action-btn ea-action-ghost" onClick={handleCopy}>
                                <RiFileCopyLine />
                                <span>Copy</span>
                            </button>
                        )}
                        {showNext && (
                            <button className="ea-action-btn ea-action-accent" onClick={handleNext}>
                                <span>Build Calendar</span>
                                <RiArrowRightLine />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Comparison Modal */}
            <ComparisonModal
                isOpen={showComparison}
                onClose={() => setShowComparison(false)}
                batchResults={batchResults}
                totalPages={totalPages}
                currentIndex={comparisonIndex}
                onChangeIndex={setComparisonIndex}
            />

            {/* Calendar Builder */}
            <CalendarBuilder
                isOpen={showCalendar}
                onClose={() => setShowCalendar(false)}
                parsedCalendar={parsedCalendar}
                batchResults={batchResults}
                onCellChange={handleCellChange}
                onExport={handleExport}
                onPushToFirebase={handlePushToFirebase}
                isPushing={isPushing}
                batches={batches}
                selectedBatch={selectedBatch}
                onBatchChange={setSelectedBatch}
            />
        </div>
    );
};

export default ElvanAgazhi;
