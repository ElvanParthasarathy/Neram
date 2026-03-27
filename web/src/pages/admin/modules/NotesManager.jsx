import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { db } from "../../../firebase";
import { ref, onValue, set, push, remove, update } from "firebase/database";
import { 
    RiFolderFill, 
    RiDeleteBinLine, 
    RiAddLine,
    RiBookOpenFill,
    RiLinkM,
    RiEdit2Line,
    RiFolderTransferLine,
    RiCloseLine,
    RiArrowRightSLine,
    RiArrowLeftLine,
    RiGlobalLine,
    RiFolderLine,
    RiMore2Fill,
    RiDeleteBin6Line,
    RiCheckDoubleFill,
    RiSettings4Line,
    RiCheckLine
} from 'react-icons/ri';
import '../../../styles/admin/notes-manager.css';
import { ListItemSkeleton } from '../../../components/ui/AdminSkeletons';
import { useToast } from '../../../contexts/ToastContext';

const NotesManager = () => {
    const { showToast } = useToast();
    const [notesMode, setNotesMode] = useState('fetch');
    const [folders, setFolders] = useState({});
    const [subjects, setSubjects] = useState({});
    const [files, setFiles] = useState({});
    const [searchParams, setSearchParams] = useSearchParams();
    
    const urlPathStr = searchParams.get('nfp');
    const currentPath = urlPathStr 
        ? JSON.parse(decodeURIComponent(urlPathStr)) 
        : [{ id: 'root', name: 'Notes Drive' }];

    const updateCurrentPath = (newPath) => {
        setSearchParams({ 
            mod: 'notes', 
            nfp: encodeURIComponent(JSON.stringify(newPath)) 
        }, { replace: false });
    };
    const [loading, setLoading] = useState(true);

    // Edit List mode (like ExamManager)
    const [isEditListMode, setIsEditListMode] = useState(false);
    
    // Selection Mode (activated via bottom bar)
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    // Selection
    const [selected, setSelected] = useState(new Set());
    
    // Action sheet
    const [actionSheet, setActionSheet] = useState(null);
    
    // Inline rename
    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    
    // New folder inline
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const newFolderRef = useRef(null);
    
    // FAB menu
    const [fabOpen, setFabOpen] = useState(false);
    
    // Subject form modal
    const [subjectModal, setSubjectModal] = useState(null);
    const [subjectName, setSubjectName] = useState('');
    const [units, setUnits] = useState([{ name: 'Unit 1', link: '' }]);
    
    // File form modal
    const [fileModal, setFileModal] = useState(null);
    const [fileName, setFileName] = useState('');
    const [fileLink, setFileLink] = useState('');
    
    // Move modal
    const [moveModal, setMoveModal] = useState(null);

    // Settings modal
    const [settingsModal, setSettingsModal] = useState(false);
    const [tempMode, setTempMode] = useState('fetch');
    
    // Drag state (desktop)
    const [dragId, setDragId] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);

    // Confirmation modal state (like ExamManager)
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

    const showConfirm = (title, message, onConfirm) => {
        setConfirmModal({ show: true, title, message, onConfirm });
    };
    const closeConfirm = () => setConfirmModal({ ...confirmModal, show: false });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const currentFolderId = currentPath[currentPath.length - 1].id;

    // Firebase listeners
    useEffect(() => {
        const unsubMode = onValue(ref(db, 'settings/notesMode'), s => setNotesMode(s.val() || 'fetch'));
        const unsubFolders = onValue(ref(db, 'notes_drive/folders'), s => setFolders(s.val() || {}));
        const unsubSubjects = onValue(ref(db, 'notes_drive/subjects'), s => setSubjects(s.val() || {}));
        const unsubFiles = onValue(ref(db, 'notes_drive/files'), s => {
            setFiles(s.val() || {});
            setLoading(false);
        }, () => setLoading(false));
        return () => { unsubMode(); unsubFolders(); unsubSubjects(); unsubFiles(); };
    }, []);

    // Clear selection on path change
    useEffect(() => { setSelected(new Set()); setActionSheet(null); setFabOpen(false); }, [currentFolderId]);

    // Focus handled by autoFocus in modal

    // --- DATA ---
    const currentFolders = Object.entries(folders)
        .filter(([, f]) => f.parentId === currentFolderId)
        .map(([k, f]) => ({ ...f, _key: k }));
    const currentSubjects = Object.entries(subjects)
        .filter(([, s]) => s.parentId === currentFolderId)
        .map(([k, s]) => ({ ...s, _key: k }));
    const currentFiles = Object.entries(files)
        .filter(([, f]) => f.parentId === currentFolderId)
        .map(([k, f]) => ({ ...f, _key: k }));
    const allFoldersList = Object.entries(folders).map(([k, f]) => ({ ...f, _key: k }));

    const totalItems = currentFolders.length + currentSubjects.length + currentFiles.length;

    // --- NAVIGATION ---
    const navigateTo = (folder) => updateCurrentPath([...currentPath, { id: folder.id, name: folder.name }]);
    const navigateToIndex = (i) => updateCurrentPath(currentPath.slice(0, i + 1));

    // --- SELECTION ---
    const toggleSelect = (id) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAll = () => {
        const allIds = [
            ...currentFolders.map(f => f.id), 
            ...currentSubjects.map(s => s.id),
            ...currentFiles.map(f => f.id)
        ];
        
        // If all are already selected, clear it. Else, select all.
        if (selected.size === allIds.length && allIds.length > 0) {
            setSelected(new Set());
        } else {
            setSelected(new Set(allIds));
        }
    };

    const clearSelection = () => {
        setSelected(new Set());
    };

    // --- CRUD ---
    const updateMode = async (newMode) => {
        if (newMode === notesMode) return;
        await set(ref(db, 'settings/notesMode'), newMode);
        showToast("✅ Notes visibility updated.");
    };

    const createFolder = async (name) => {
        if (!name?.trim()) return;
        const newRef = push(ref(db, 'notes_drive/folders'));
        await set(newRef, { id: newRef.key, name: name.trim(), parentId: currentFolderId });
        showToast("✅ Folder created successfully.");
        setCreatingFolder(false);
        setNewFolderName('');
    };

    const deleteItems = async (ids) => {
        showConfirm(
            "Delete Items?",
            `Are you sure you want to delete ${ids.length} item(s)? This action cannot be undone.`,
            async () => {
                for (const id of ids) {
                    const fKey = Object.entries(folders).find(([, f]) => f.id === id)?.[0];
                    const sKey = Object.entries(subjects).find(([, s]) => s.id === id)?.[0];
                    const fiKey = Object.entries(files).find(([, f]) => f.id === id)?.[0];
                    if (fKey) await remove(ref(db, `notes_drive/folders/${fKey}`));
                    if (sKey) await remove(ref(db, `notes_drive/subjects/${sKey}`));
                    if (fiKey) await remove(ref(db, `notes_drive/files/${fiKey}`));
                }
                showToast(`✅ ${ids.length} item(s) deleted.`);
                setSelected(new Set());
            }
        );
    };

    const renameItem = async (id) => {
        if (!renameValue.trim()) { setRenamingId(null); return; }
        const fKey = Object.entries(folders).find(([, f]) => f.id === id)?.[0];
        const sKey = Object.entries(subjects).find(([, s]) => s.id === id)?.[0];
        const fiKey = Object.entries(files).find(([, f]) => f.id === id)?.[0];
        if (fKey) await update(ref(db, `notes_drive/folders/${fKey}`), { name: renameValue.trim() });
        if (sKey) await update(ref(db, `notes_drive/subjects/${sKey}`), { name: renameValue.trim() });
        if (fiKey) await update(ref(db, `notes_drive/files/${fiKey}`), { name: renameValue.trim() });
        showToast("✅ Item renamed successfully.");
        setRenamingId(null);
    };

    const moveItems = async (ids, targetFolderId) => {
        for (const id of ids) {
            const fKey = Object.entries(folders).find(([, f]) => f.id === id)?.[0];
            const sKey = Object.entries(subjects).find(([, s]) => s.id === id)?.[0];
            const fiKey = Object.entries(files).find(([, f]) => f.id === id)?.[0];
            if (fKey) await update(ref(db, `notes_drive/folders/${fKey}`), { parentId: targetFolderId });
            if (sKey) await update(ref(db, `notes_drive/subjects/${sKey}`), { parentId: targetFolderId });
            if (fiKey) await update(ref(db, `notes_drive/files/${fiKey}`), { parentId: targetFolderId });
        }
        showToast("✅ Items moved successfully.");
        setMoveModal(null);
        setSelected(new Set());
    };

    // --- SUBJECT ---
    const openSubjectModal = (existing = null) => {
        if (existing) {
            setSubjectName(existing.name);
            const entries = Object.entries(existing.units || {}).map(([n, l]) => ({ name: n, link: l }));
            setUnits(entries.length > 0 ? entries : [{ name: 'Unit 1', link: '' }]);
            setSubjectModal({ mode: 'edit', subject: existing });
        } else {
            setSubjectName('');
            setUnits([{ name: 'Unit 1', link: '' }]);
            setSubjectModal({ mode: 'create' });
        }
    };

    const saveSubject = async () => {
        if (!subjectName.trim()) return;
        const unitsMap = {};
        units.forEach(u => { if (u.name.trim()) unitsMap[u.name.trim()] = u.link.trim(); });

        if (subjectModal.mode === 'edit') {
            const sKey = Object.entries(subjects).find(([, s]) => s.id === subjectModal.subject.id)?.[0];
            if (sKey) await update(ref(db, `notes_drive/subjects/${sKey}`), { name: subjectName.trim(), units: unitsMap });
            showToast("✅ Subject updated successfully.");
        } else {
            const newRef = push(ref(db, 'notes_drive/subjects'));
            await set(newRef, { id: newRef.key, name: subjectName.trim(), parentId: currentFolderId, units: unitsMap });
            showToast("✅ Subject created successfully.");
        }
        setSubjectModal(null);
    };

    // --- FILE ---
    const openFileModal = (existing = null) => {
        if (existing) {
            setFileName(existing.name);
            setFileLink(existing.link);
            setFileModal({ mode: 'edit', file: existing });
        } else {
            setFileName('');
            setFileLink('');
            setFileModal({ mode: 'create' });
        }
    };

    const saveFile = async () => {
        if (!fileName.trim()) return;
        if (fileModal.mode === 'edit') {
            const fiKey = Object.entries(files).find(([, f]) => f.id === fileModal.file.id)?.[0];
            if (fiKey) await update(ref(db, `notes_drive/files/${fiKey}`), { name: fileName.trim(), link: fileLink.trim() });
            showToast("✅ Link updated successfully.");
        } else {
            const newRef = push(ref(db, 'notes_drive/files'));
            await set(newRef, { id: newRef.key, name: fileName.trim(), link: fileLink.trim(), parentId: currentFolderId });
            showToast("✅ Link created successfully.");
        }
        setFileModal(null);
    };

    // --- DRAG & DROP (Desktop) ---
    const onDragStart = (e, id) => { setDragId(id); e.dataTransfer.effectAllowed = 'move'; };
    const onDragOver = (e, id) => { e.preventDefault(); if (id !== dragId) setDragOverId(id); };
    const onDragLeave = () => setDragOverId(null);
    const onDrop = async (e, targetFolder) => {
        e.preventDefault();
        setDragOverId(null);
        if (!dragId || dragId === targetFolder.id) return;
        const idsToMove = selected.size > 0 && selected.has(dragId) ? [...selected] : [dragId];
        await moveItems(idsToMove, targetFolder.id);
        setDragId(null);
    };
    const onDragEnd = () => { setDragId(null); setDragOverId(null); };

    // --- HELPERS ---
    const isFolder = (id) => Object.values(folders).some(f => f.id === id);
    const isSubject = (id) => Object.values(subjects).some(s => s.id === id);
    const isFile = (id) => Object.values(files).some(f => f.id === id);

    const openActionSheet = (item, e) => {
        let rect = null;
        if (e && e.currentTarget && e.type === 'click') {
            rect = e.currentTarget.getBoundingClientRect();
        } else if (e && e.clientX) {
            rect = { bottom: e.clientY - 8, right: e.clientX, left: e.clientX, top: e.clientY - 8 };
        }
        setActionSheet({ item, rect });
        // Selection is now only accessible via the selection menu
    };

    // --- FAB actions ---
    const handleFabFolder = () => {
        setFabOpen(false);
        setCreatingFolder(true);
        setNewFolderName('');
    };

    const handleFabLink = () => {
        setFabOpen(false);
        openFileModal();
    };

    const handleFabSubject = () => {
        setFabOpen(false);
        openSubjectModal();
    };

    if (loading) return (
        <div style={{ padding: '20px' }}>
            <ListItemSkeleton count={5} />
        </div>
    );

    return (
        <div className="notes-manager">


            {/* ─── Breadcrumb Navigation (EXAM MANAGER STYLE) ─── */}
            <header className="explorer-header focus-mode" style={{ marginBottom: '20px', marginTop: 0 }}>
                <div className="breadcrumb-nav">
                    <div className="breadcrumb-list">
                        <span className="crumb-btn level-root" onClick={() => navigateToIndex(0)}>{currentPath[0].name}</span>

                        {(isMobile && currentPath.length > 2) && (
                            <span className="crumb-ellipsis-container">
                                <RiArrowRightSLine className="crumb-sep" />
                                <span className="crumb-static">...</span>
                            </span>
                        )}

                        {!isMobile ? (
                            currentPath.slice(1).map((p, i) => (
                                <React.Fragment key={p.id}>
                                    <RiArrowRightSLine className="crumb-sep" />
                                    {i === currentPath.slice(1).length - 1 ? (
                                        <span className="crumb-static">{p.name}</span>
                                    ) : (
                                        <span className="crumb-btn" onClick={() => navigateToIndex(i + 1)}>{p.name}</span>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            currentPath.length > 1 && (
                                <>
                                    <RiArrowRightSLine className="crumb-sep" />
                                    <span className="crumb-static">{currentPath[currentPath.length - 1].name}</span>
                                </>
                            )
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className="explorer-back-btn" onClick={() => {
                        if (currentPath.length > 1) {
                            navigateToIndex(currentPath.length - 2);
                        } else {
                            const params = new URLSearchParams(searchParams);
                            params.set('mod', 'home');
                            setSearchParams(params);
                        }
                    }}>
                        <RiArrowLeftLine /> Back
                    </button>
                </div>
            </header>

            {/* ─── Actions Toolbar (Row 2) ─── */}
            <div className="nm-header-row" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '16px', gap: '10px' }}>
                <div className="nm-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button 
                        className="nm-file-more-btn" 
                        style={{ background: 'var(--mac-sidebar-bg)', color: 'var(--mac-text)', width: '36px', height: '36px', flexShrink: 0 }}
                        onClick={() => { setTempMode(notesMode); setSettingsModal(true); }}
                    >
                        <RiSettings4Line />
                    </button>
                    
                    {isEditListMode ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className="role-header-pill secondary nm-action-pill"
                                onClick={() => { setIsEditListMode(false); clearSelection(); setCreatingFolder(false); setIsSelectionMode(false); }}
                            >
                                Cancel
                            </button>
                            <button
                                className="role-header-pill active nm-action-pill"
                                onClick={() => { setIsEditListMode(false); clearSelection(); setCreatingFolder(false); setIsSelectionMode(false); }}
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <button
                            className="edit-list-btn nm-btn-edit"
                            onClick={() => setIsEditListMode(true)}
                        >
                            <RiEdit2Line /> Edit
                        </button>
                    )}
                </div>
            </div>

            {/* ─── Desktop Toolbar (only in edit mode) ─── */}
            {isEditListMode && (
                <div className="nm-desktop-toolbar">
                    {!isSelectionMode ? (
                        <>
                            <button className="nm-desk-btn" onClick={() => { setCreatingFolder(true); setNewFolderName(''); }}>
                                <RiAddLine /> Folder
                            </button>
                            <button className="nm-desk-btn" onClick={() => openFileModal()}>
                                <RiAddLine /> Link
                            </button>
                            <button className="nm-desk-btn" onClick={() => openSubjectModal()}>
                                <RiAddLine /> Subject
                            </button>
                            <button className="nm-desk-btn" onClick={() => setIsSelectionMode(true)} style={{ background: 'var(--mac-blue)', color: 'white', border: 'none', marginLeft: '6px' }}>
                                <RiCheckDoubleFill /> Select Items
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="nm-desk-btn" onClick={selectAll}>
                                {selected.size === totalItems && totalItems > 0 ? 'Deselect All' : 'Select All'}
                            </button>
                            <button className="nm-desk-btn" onClick={() => { clearSelection(); setIsSelectionMode(false); }}>
                                Cancel
                            </button>
                            <button className="nm-desk-btn" onClick={() => setMoveModal({ ids: [...selected] })} disabled={selected.size === 0}>
                                Move
                            </button>
                            <button className="nm-desk-btn danger" onClick={() => deleteItems([...selected])} disabled={selected.size === 0} style={{ color: 'var(--mac-traffic-red)' }}>
                                Delete
                            </button>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--mac-text)', marginLeft: 'auto' }}>
                                {selected.size === 0 ? "Select items to modify" : `${selected.size} Selected`}
                            </span>
                        </>
                    )}
                </div>
            )}

            {/* ─── File List ─── */}
            <div className="nm-file-list">

                {/* Folders */}
                {currentFolders.map(folder => (
                    <div
                        key={folder.id}
                        className={`nm-file-row ${selected.has(folder.id) ? 'selected' : ''} ${dragId === folder.id ? 'dragging' : ''} ${dragOverId === folder.id ? 'drag-over' : ''}`}
                        onClick={(e) => {
                            if (e.target.closest('input')) return;
                            if (isSelectionMode) {
                                toggleSelect(folder.id);
                            } else if (!isEditListMode) {
                                navigateTo(folder);
                            }
                        }}
                        draggable={isEditListMode}
                        onDragStart={isEditListMode ? (e) => onDragStart(e, folder.id) : undefined}
                        onDragOver={isEditListMode ? (e) => onDragOver(e, folder.id) : undefined}
                        onDragLeave={isEditListMode ? onDragLeave : undefined}
                        onDrop={isEditListMode ? (e) => onDrop(e, folder) : undefined}
                        onDragEnd={isEditListMode ? onDragEnd : undefined}
                    >
                        {isSelectionMode && (
                            <input
                                type="checkbox"
                                className="mac-checkbox"
                                style={{ margin: '0 4px 0 0', flexShrink: 0 }}
                                checked={selected.has(folder.id)}
                                onChange={(e) => { e.stopPropagation(); toggleSelect(folder.id); }}
                                onClick={(e) => e.stopPropagation()}
                            />
                        )}
                        <div className="nm-file-icon folder"><RiFolderFill /></div>
                        <div className="nm-file-info">
                            <div className="nm-file-name">
                                {folder.name}
                            </div>
                            <div className="nm-file-meta">Folder</div>
                        </div>
                        <div className="nm-file-end">
                            {isEditListMode && (
                                <button className="nm-file-more-btn" onClick={(e) => { e.stopPropagation(); openActionSheet(folder, e); }}>
                                    <RiMore2Fill />
                                </button>
                            )}
                            {!isEditListMode && <RiArrowRightSLine className="nm-file-chevron" />}
                        </div>
                    </div>
                ))}

                {/* Subjects */}
                {currentSubjects.map(subject => (
                    <div
                        key={subject.id}
                        className={`nm-file-row ${selected.has(subject.id) ? 'selected' : ''} ${dragId === subject.id ? 'dragging' : ''}`}
                        onClick={(e) => {
                            if (e.target.closest('input')) return;
                            if (isSelectionMode) {
                                toggleSelect(subject.id);
                            } else if (!isEditListMode) {
                                openSubjectModal(subject);
                            }
                        }}
                        draggable={isEditListMode}
                        onDragStart={isEditListMode ? (e) => onDragStart(e, subject.id) : undefined}
                        onDragEnd={isEditListMode ? onDragEnd : undefined}
                    >
                        {isSelectionMode && (
                            <input
                                type="checkbox"
                                className="mac-checkbox"
                                style={{ margin: '0 4px 0 0', flexShrink: 0 }}
                                checked={selected.has(subject.id)}
                                onChange={(e) => { e.stopPropagation(); toggleSelect(subject.id); }}
                                onClick={(e) => e.stopPropagation()}
                            />
                        )}
                        <div className="nm-file-icon subject"><RiBookOpenFill /></div>
                        <div className="nm-file-info">
                            <div className="nm-file-name">
                                {subject.name}
                            </div>
                            <div className="nm-file-meta">{Object.keys(subject.units || {}).length} units</div>
                        </div>
                        <div className="nm-file-end">
                            <span className="nm-file-badge units">{Object.keys(subject.units || {}).length} Units</span>
                            {isEditListMode && (
                                <button className="nm-file-more-btn" onClick={(e) => { e.stopPropagation(); openActionSheet(subject, e); }}>
                                    <RiMore2Fill />
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {/* Files / Links */}
                {currentFiles.map(file => (
                    <div
                        key={file.id}
                        className={`nm-file-row ${selected.has(file.id) ? 'selected' : ''} ${dragId === file.id ? 'dragging' : ''}`}
                        onClick={(e) => {
                            if (e.target.closest('input')) return;
                            if (isSelectionMode) {
                                toggleSelect(file.id);
                            } else if (!isEditListMode) {
                                if (file.link) window.open(file.link, '_blank');
                            }
                        }}
                        draggable={isEditListMode}
                        onDragStart={isEditListMode ? (e) => onDragStart(e, file.id) : undefined}
                        onDragEnd={isEditListMode ? onDragEnd : undefined}
                    >
                        {isSelectionMode && (
                            <input
                                type="checkbox"
                                className="mac-checkbox"
                                style={{ margin: '0 4px 0 0', flexShrink: 0 }}
                                checked={selected.has(file.id)}
                                onChange={(e) => { e.stopPropagation(); toggleSelect(file.id); }}
                                onClick={(e) => e.stopPropagation()}
                            />
                        )}
                        <div className="nm-file-icon link"><RiLinkM /></div>
                        <div className="nm-file-info">
                            <div className="nm-file-name">
                                {file.name}
                            </div>
                            <div className="nm-file-meta">{file.link ? 'External Link' : 'No link'}</div>
                        </div>
                        <div className="nm-file-end">
                            {file.link && <span className="nm-file-badge link-type">Link</span>}
                            {isEditListMode && (
                                <button className="nm-file-more-btn" onClick={(e) => { e.stopPropagation(); openActionSheet(file, e); }}>
                                    <RiMore2Fill />
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {/* Empty */}
                {totalItems === 0 && !creatingFolder && (
                    <div className="nm-empty-state">
                        <RiFolderFill className="nm-empty-folder-icon" />
                        <div className="nm-empty-title">This folder is empty</div>
                        <div className="nm-empty-desc">
                            Tap the + button to create a folder, subject, or link.
                        </div>
                    </div>
                )}
            </div>

            {/* ─── FAB (Mobile only — edit mode only) ─── */}
            {isEditListMode && !subjectModal && !fileModal && !moveModal && !renamingId && !creatingFolder && !settingsModal && !confirmModal.show && createPortal(
                <>
                    {fabOpen && <div className="nm-fab-backdrop" onClick={() => setFabOpen(false)} />}

                    {fabOpen && (
                        <div className="nm-fab-menu">
                            {!isSelectionMode ? (
                                <>
                                    <div className="nm-fab-option" onClick={() => { setIsSelectionMode(true); setFabOpen(false); }}>
                                        <button className="nm-fab-option-btn select-btn"><RiCheckDoubleFill /></button>
                                        <span className="nm-fab-option-label">Select Items</span>
                                    </div>
                                    <div className="nm-fab-option" onClick={handleFabSubject}>
                                        <button className="nm-fab-option-btn subject-btn"><RiBookOpenFill /></button>
                                        <span className="nm-fab-option-label">Subject</span>
                                    </div>
                                    <div className="nm-fab-option" onClick={handleFabLink}>
                                        <button className="nm-fab-option-btn link-btn"><RiLinkM /></button>
                                        <span className="nm-fab-option-label">Link</span>
                                    </div>
                                    <div className="nm-fab-option" onClick={handleFabFolder}>
                                        <button className="nm-fab-option-btn folder-btn"><RiFolderFill /></button>
                                        <span className="nm-fab-option-label">Folder</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="nm-fab-option" onClick={() => { clearSelection(); setIsSelectionMode(false); setFabOpen(false); }}>
                                        <button className="nm-fab-option-btn"><RiCloseLine /></button>
                                        <span className="nm-fab-option-label">Cancel Selection</span>
                                    </div>
                                    <div className="nm-fab-option" onClick={() => { selectAll(); setFabOpen(false); }}>
                                        <button className="nm-fab-option-btn"><RiCheckDoubleFill /></button>
                                        <span className="nm-fab-option-label">{selected.size === totalItems && totalItems > 0 ? 'Deselect All' : 'Select All'}</span>
                                    </div>
                                    <div className="nm-fab-option" onClick={() => { if(selected.size>0) { setMoveModal({ids: [...selected]}); setFabOpen(false); } }} style={{opacity: selected.size===0?0.5:1}}>
                                        <button className="nm-fab-option-btn select-btn"><RiFolderTransferLine /></button>
                                        <span className="nm-fab-option-label">Move</span>
                                    </div>
                                    <div className="nm-fab-option" onClick={() => { if(selected.size>0) { deleteItems([...selected]); setFabOpen(false); } }} style={{opacity: selected.size===0?0.5:1}}>
                                        <button className="nm-fab-option-btn danger-btn"><RiDeleteBin6Line /></button>
                                        <span className="nm-fab-option-label">Delete</span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <button className={`nm-fab ${fabOpen ? 'open' : ''}`} onClick={() => setFabOpen(!fabOpen)}>
                        <RiAddLine />
                    </button>
                </>,
                document.body
            )}

            {/* ─── Action Sheet (edit mode only) ─── */}
            {isEditListMode && actionSheet && createPortal(
                <div 
                    className="nm-action-sheet-overlay" 
                    onClick={() => setActionSheet(null)}
                    style={window.innerWidth >= 768 ? { alignItems: 'flex-start', backgroundColor: 'transparent' } : {}}
                >
                    <div 
                        className="nm-action-sheet" 
                        onClick={e => e.stopPropagation()}
                        style={window.innerWidth >= 768 && actionSheet.rect ? {
                            position: 'absolute',
                            top: `${Math.min(actionSheet.rect.bottom + 8, window.innerHeight - 300)}px`,
                            left: `${Math.max(10, Math.min(actionSheet.rect.right - 220, window.innerWidth - 230))}px`,
                            margin: 0,
                            width: '220px',
                            borderRadius: '16px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                            animation: 'none'
                        } : {}}
                    >
                        <div className="nm-action-sheet-handle" />

                        {actionSheet.item && (
                            <>
                                {isSubject(actionSheet.item.id) && (
                                    <div className="nm-action-item" onClick={() => { openSubjectModal(actionSheet.item); setActionSheet(null); }}>
                                        <RiEdit2Line /> Edit Subject
                                    </div>
                                )}
                                {isFile(actionSheet.item.id) && (
                                    <div className="nm-action-item" onClick={() => { openFileModal(actionSheet.item); setActionSheet(null); }}>
                                        <RiEdit2Line /> Edit Link
                                    </div>
                                )}

                                <div className="nm-action-item" onClick={() => { setRenamingId(actionSheet.item.id); setRenameValue(actionSheet.item.name); setActionSheet(null); }}>
                                    <RiEdit2Line /> Rename
                                </div>
                                <div className="nm-action-item" onClick={() => { setMoveModal({ ids: selected.size > 0 ? [...selected] : [actionSheet.item.id] }); setActionSheet(null); }}>
                                    <RiFolderTransferLine /> Move to...
                                </div>
                            </>
                        )}

                        <div className="nm-action-sep" />

                        <div className="nm-action-item danger" onClick={() => { deleteItems(selected.size > 0 ? [...selected] : [actionSheet.item.id]); setActionSheet(null); }}>
                            <RiDeleteBinLine /> Delete
                        </div>

                        <div className="nm-action-cancel" onClick={() => setActionSheet(null)}>
                            Cancel
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ─── Subject Modal ─── */}
            {subjectModal && (
                <div className="nm-modal-overlay">
                    <div className="nm-modal-sheet" onClick={e => e.stopPropagation()}>
                        <div className="nm-modal-header">
                            <h3>{subjectModal.mode === 'edit' ? 'Edit Subject' : 'New Subject'}</h3>
                            <button className="nm-modal-close" onClick={() => setSubjectModal(null)}>
                                <RiCloseLine />
                            </button>
                        </div>

                        <div className="nm-modal-body">
                            <div className="nm-field">
                                <label>Subject Name</label>
                                <input
                                    className="nm-field-input"
                                    placeholder="e.g. Mathematics, Physics"
                                    value={subjectName}
                                    onChange={e => setSubjectName(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mac-text)', marginBottom: '10px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Units
                            </label>

                            {units.map((unit, i) => (
                                <div key={i} className="nm-unit-row">
                                    <div className="nm-field">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <label style={{ margin: 0 }}>Name</label>
                                            {units.length > 1 && (
                                                <button 
                                                    className="nm-unit-remove-pill" 
                                                    onClick={() => showConfirm(
                                                        "Remove Unit?", 
                                                        `Remove "${unit.name || 'this unit'}" from the subject?`, 
                                                        () => setUnits(prev => prev.filter((_, j) => j !== i))
                                                    )}
                                                >
                                                    <RiDeleteBinLine style={{ fontSize: '14px' }} /> Delete
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            className="nm-field-input"
                                            placeholder="Unit name"
                                            value={unit.name}
                                            onChange={e => setUnits(prev => prev.map((u, j) => j === i ? { ...u, name: e.target.value } : u))}
                                        />
                                    </div>
                                    <div className="nm-field">
                                        <label>Link</label>
                                        <input
                                            className="nm-field-input"
                                            placeholder="https://drive.google.com/..."
                                            value={unit.link}
                                            onChange={e => setUnits(prev => prev.map((u, j) => j === i ? { ...u, link: e.target.value } : u))}
                                        />
                                    </div>
                                </div>
                            ))}

                            <button className="nm-add-unit-btn" onClick={() => setUnits(prev => [...prev, { name: `Unit ${prev.length + 1}`, link: '' }])}>
                                <RiAddLine /> Add Unit
                            </button>
                        </div>

                        <div className="nm-modal-footer">
                            <button className="nm-modal-footer-btn cancel" onClick={() => setSubjectModal(null)}>Cancel</button>
                            <button className="nm-modal-footer-btn confirm" onClick={saveSubject}>
                                {subjectModal.mode === 'edit' ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── File / Link Modal ─── */}
            {fileModal && (
                <div className="nm-modal-overlay">
                    <div className="nm-modal-sheet" onClick={e => e.stopPropagation()}>
                        <div className="nm-modal-header">
                            <h3>{fileModal.mode === 'edit' ? 'Edit Link' : 'New Link'}</h3>
                            <button className="nm-modal-close" onClick={() => setFileModal(null)}>
                                <RiCloseLine />
                            </button>
                        </div>

                        <div className="nm-modal-body">
                            <p style={{ fontSize: '13px', color: 'var(--mac-text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                                Create a standalone link that opens when students tap it.
                            </p>

                            <div className="nm-field">
                                <label>Name</label>
                                <input
                                    className="nm-field-input"
                                    placeholder="e.g. Syllabus, Lab Manual"
                                    value={fileName}
                                    onChange={e => setFileName(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="nm-field">
                                <label>Link URL</label>
                                <input
                                    className="nm-field-input"
                                    placeholder="https://drive.google.com/..."
                                    value={fileLink}
                                    onChange={e => setFileLink(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="nm-modal-footer">
                            <button className="nm-modal-footer-btn cancel" onClick={() => setFileModal(null)}>Cancel</button>
                            <button className="nm-modal-footer-btn confirm" onClick={saveFile}>
                                {fileModal.mode === 'edit' ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {moveModal && (
                <div className="nm-modal-overlay">
                    <div className="nm-modal-sheet" onClick={e => e.stopPropagation()}>
                        <div className="nm-modal-header">
                            <h3>Move to...</h3>
                            <button className="nm-modal-close" onClick={() => setMoveModal(null)}>
                                <RiCloseLine />
                            </button>
                        </div>

                        <div className="nm-modal-body">
                            <div className="nm-move-list">
                                <div className="nm-move-option" onClick={() => moveItems(moveModal.ids, 'root')}>
                                    <RiFolderFill /> Notes Drive (Root)
                                </div>
                                {allFoldersList
                                    .filter(f => !moveModal.ids.includes(f.id))
                                    .map(folder => (
                                        <div
                                            key={folder.id}
                                            className="nm-move-option"
                                            onClick={() => moveItems(moveModal.ids, folder.id)}
                                        >
                                            <RiFolderFill /> {folder.name}
                                        </div>
                                    ))
                                }
                            </div>
                        </div>

                        <div className="nm-modal-footer">
                            <button className="nm-modal-footer-btn cancel" onClick={() => setMoveModal(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Rename Modal ─── */}
            {renamingId && (
                <div className="nm-modal-overlay">
                    <div className="nm-modal-sheet" onClick={e => e.stopPropagation()}>
                        <div className="nm-modal-header">
                            <h3>Rename Item</h3>
                            <button className="nm-modal-close" onClick={() => setRenamingId(null)}>
                                <RiCloseLine />
                            </button>
                        </div>
                        <div className="nm-modal-body">
                            <div className="nm-field">
                                <label>New Name</label>
                                <input
                                    className="nm-field-input"
                                    placeholder="Enter new name"
                                    value={renameValue}
                                    onChange={e => setRenameValue(e.target.value)}
                                    autoFocus
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') renameItem(renamingId);
                                    }}
                                />
                            </div>
                        </div>
                        <div className="nm-modal-footer">
                            <button className="nm-modal-footer-btn cancel" onClick={() => setRenamingId(null)}>Cancel</button>
                            <button className="nm-modal-footer-btn confirm" onClick={() => renameItem(renamingId)}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Folder Creation Modal ─── */}
            {creatingFolder && (
                <div className="nm-modal-overlay">
                    <div className="nm-modal-sheet" onClick={e => e.stopPropagation()}>
                        <div className="nm-modal-header">
                            <h3>New Folder</h3>
                            <button className="nm-modal-close" onClick={() => setCreatingFolder(false)}>
                                <RiCloseLine />
                            </button>
                        </div>
                        <div className="nm-modal-body">
                            <div className="nm-field">
                                <label>Folder Name</label>
                                <input
                                    className="nm-field-input"
                                    placeholder="e.g. Assignments, Projects"
                                    value={newFolderName}
                                    onChange={e => setNewFolderName(e.target.value)}
                                    autoFocus
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') createFolder(newFolderName);
                                    }}
                                />
                            </div>
                        </div>
                        <div className="nm-modal-footer">
                            <button className="nm-modal-footer-btn cancel" onClick={() => setCreatingFolder(false)}>Cancel</button>
                            <button className="nm-modal-footer-btn confirm" onClick={() => createFolder(newFolderName)}>Create</button>
                        </div>
                    </div>
                </div>
            )}
            {/* ─── Settings Modal ─── */}
            {settingsModal && (
                <div className="nm-modal-overlay">
                    <div className="nm-modal-sheet" onClick={e => e.stopPropagation()}>
                        <div className="nm-modal-header">
                            <h3>Fetch Settings</h3>
                            <button className="nm-modal-close" onClick={() => setSettingsModal(false)}>
                                <RiCloseLine />
                            </button>
                        </div>
                        <div className="nm-modal-body">
                            <p style={{ fontSize: '13px', color: 'var(--mac-text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                                Choose how the notes drive displays content for students.
                            </p>

                            <div className="nm-move-list">
                                <div 
                                    className={`nm-move-option ${tempMode === 'fetch' ? 'selected' : ''}`} 
                                    onClick={() => setTempMode('fetch')}
                                >
                                    <div style={{ width: '24px', display: 'flex', alignItems: 'center', color: tempMode === 'fetch' ? 'var(--mac-blue)' : 'var(--mac-text-secondary)' }}>
                                        {tempMode === 'fetch' ? <RiCheckLine /> : <div style={{ width: 16, height: 16, border: '2px solid var(--mac-border)', borderRadius: '50%' }} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '15px' }}>RMD Fetch Mode</div>
                                        <div style={{ fontSize: '12px', opacity: 0.6 }}>Load notes directly from rmd.ac.in</div>
                                    </div>
                                </div>
                                <div 
                                    className={`nm-move-option ${tempMode === 'folder' ? 'selected' : ''}`} 
                                    onClick={() => setTempMode('folder')}
                                >
                                    <div style={{ width: '24px', display: 'flex', alignItems: 'center', color: tempMode === 'folder' ? 'var(--mac-blue)' : 'var(--mac-text-secondary)' }}>
                                        {tempMode === 'folder' ? <RiCheckLine /> : <div style={{ width: 16, height: 16, border: '2px solid var(--mac-border)', borderRadius: '50%' }} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '15px' }}>Custom Folder Mode</div>
                                        <div style={{ fontSize: '12px', opacity: 0.6 }}>Use your manual folder structure</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="nm-modal-footer">
                            <button className="nm-modal-footer-btn cancel" onClick={() => setSettingsModal(false)}>Cancel</button>
                            <button 
                                className="nm-modal-footer-btn confirm" 
                                onClick={() => { updateMode(tempMode); setSettingsModal(false); }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PREM CONF MODAL (like ExamManager) --- */}
            {confirmModal.show && createPortal(
                <div className="modal-overlay animate-fade-in" onClick={closeConfirm}>
                    <div className="modal-content animate-pop-in" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <RiDeleteBin6Line className="modal-icon-danger" />
                            <h3>{confirmModal.title}</h3>
                        </div>
                        <p className="modal-message">{confirmModal.message}</p>
                        <div className="modal-footer">
                            <button className="btn-modal-cancel" onClick={closeConfirm}>Cancel</button>
                            <button className="btn-modal-confirm" onClick={() => { confirmModal.onConfirm(); closeConfirm(); }}>Delete</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default NotesManager;
