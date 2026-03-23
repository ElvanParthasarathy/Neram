import React, { useState, useEffect, useRef } from 'react';
import { db } from "../../firebase";
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
    RiGlobalLine,
    RiFolderLine
} from 'react-icons/ri';
import '../../styles/notes-manager.css';

const NotesManager = () => {
    const [notesMode, setNotesMode] = useState('fetch');
    const [folders, setFolders] = useState({});
    const [subjects, setSubjects] = useState({});
    const [files, setFiles] = useState({});
    const [currentPath, setCurrentPath] = useState([{ id: 'root', name: 'Notes Drive' }]);
    const [loading, setLoading] = useState(true);

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
    
    // Drag state (desktop)
    const [dragId, setDragId] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);

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

    // Focus new folder input
    useEffect(() => {
        if (creatingFolder && newFolderRef.current) newFolderRef.current.focus();
    }, [creatingFolder]);

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
    const navigateTo = (folder) => setCurrentPath(prev => [...prev, folder]);
    const navigateToIndex = (i) => setCurrentPath(prev => prev.slice(0, i + 1));

    // --- SELECTION ---
    const toggleSelect = (id, e) => {
        if (e?.shiftKey || e?.ctrlKey || e?.metaKey) {
            setSelected(prev => {
                const next = new Set(prev);
                next.has(id) ? next.delete(id) : next.add(id);
                return next;
            });
        } else {
            setSelected(prev => prev.has(id) && prev.size === 1 ? new Set() : new Set([id]));
        }
    };
    const selectAll = () => {
        const all = [
            ...currentFolders.map(f => f.id), 
            ...currentSubjects.map(s => s.id),
            ...currentFiles.map(f => f.id)
        ];
        setSelected(new Set(all));
    };
    const clearSelection = () => setSelected(new Set());

    // --- CRUD ---
    const toggleMode = async () => {
        await set(ref(db, 'settings/notesMode'), notesMode === 'fetch' ? 'folder' : 'fetch');
    };

    const createFolder = async (name) => {
        if (!name?.trim()) return;
        const newRef = push(ref(db, 'notes_drive/folders'));
        await set(newRef, { id: newRef.key, name: name.trim(), parentId: currentFolderId });
        setCreatingFolder(false);
        setNewFolderName('');
    };

    const deleteItems = async (ids) => {
        if (!window.confirm(`Delete ${ids.length} item(s)?`)) return;
        for (const id of ids) {
            const fKey = Object.entries(folders).find(([, f]) => f.id === id)?.[0];
            const sKey = Object.entries(subjects).find(([, s]) => s.id === id)?.[0];
            const fiKey = Object.entries(files).find(([, f]) => f.id === id)?.[0];
            if (fKey) await remove(ref(db, `notes_drive/folders/${fKey}`));
            if (sKey) await remove(ref(db, `notes_drive/subjects/${sKey}`));
            if (fiKey) await remove(ref(db, `notes_drive/files/${fiKey}`));
        }
        setSelected(new Set());
    };

    const renameItem = async (id) => {
        if (!renameValue.trim()) { setRenamingId(null); return; }
        const fKey = Object.entries(folders).find(([, f]) => f.id === id)?.[0];
        const sKey = Object.entries(subjects).find(([, s]) => s.id === id)?.[0];
        const fiKey = Object.entries(files).find(([, f]) => f.id === id)?.[0];
        if (fKey) await update(ref(db, `notes_drive/folders/${fKey}`), { name: renameValue.trim() });
        if (sKey) await update(ref(db, `notes_drive/subjects/${sKey}`), { name: renameValue.trim() });
        if (fiKey) await update(ref(db, `notes_drive/files/${fiKey}`), { name: renameValue.trim() });
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
        } else {
            const newRef = push(ref(db, 'notes_drive/subjects'));
            await set(newRef, { id: newRef.key, name: subjectName.trim(), parentId: currentFolderId, units: unitsMap });
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
        } else {
            const newRef = push(ref(db, 'notes_drive/files'));
            await set(newRef, { id: newRef.key, name: fileName.trim(), link: fileLink.trim(), parentId: currentFolderId });
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

    const openActionSheet = (item) => {
        setActionSheet({ item });
        if (!selected.has(item.id)) setSelected(new Set([item.id]));
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: 'var(--mac-text-secondary)' }}>
            Loading...
        </div>
    );

    return (
        <div className="notes-manager">
            {/* ─── Mode Banner (compact) ─── */}
            <div className="nm-mode-banner">
                <div className={`nm-mode-dot ${notesMode === 'fetch' ? 'fetch' : 'folder'}`} />
                <span className="nm-mode-label">
                    <strong>{notesMode === 'fetch' ? 'RMD Fetch' : 'Folder Mode'}</strong> · {notesMode === 'fetch' ? 'Live rmd.ac.in' : 'Custom folders'}
                </span>
                <button className="nm-mode-switch" onClick={toggleMode}>
                    Switch
                </button>
            </div>

            {/* ─── Path Bar (Samsung-style breadcrumb) ─── */}
            <div className="nm-path-bar">
                {currentPath.map((p, i) => (
                    <React.Fragment key={p.id}>
                        {i > 0 && <RiArrowRightSLine className="nm-path-sep" />}
                        <span
                            className={`nm-path-item ${i === currentPath.length - 1 ? 'active' : ''}`}
                            onClick={() => i < currentPath.length - 1 && navigateToIndex(i)}
                        >
                            {p.name}
                        </span>
                    </React.Fragment>
                ))}
            </div>

            {/* ─── Desktop Toolbar (hidden on mobile, shown on desktop) ─── */}
            <div className="nm-desktop-toolbar">
                <button className="nm-desk-btn" onClick={() => { setCreatingFolder(true); setNewFolderName(''); }}>
                    <RiAddLine /> Folder
                </button>
                <button className="nm-desk-btn" onClick={() => openFileModal()}>
                    <RiAddLine /> Link
                </button>
                <button className="nm-desk-btn accent" onClick={() => openSubjectModal()}>
                    <RiAddLine /> Subject
                </button>
            </div>

            {/* ─── Selection Bar ─── */}
            {selected.size > 0 && (
                <div className="nm-sel-strip">
                    <span className="nm-sel-strip-count">{selected.size} selected</span>
                    <button className="nm-sel-strip-btn all" onClick={selectAll}>All</button>
                    <button className="nm-sel-strip-btn move" onClick={() => setMoveModal({ ids: [...selected] })}>
                        Move
                    </button>
                    <button className="nm-sel-strip-btn delete" onClick={() => deleteItems([...selected])}>
                        Delete
                    </button>
                    <button className="nm-sel-strip-btn clear" onClick={clearSelection}>
                        ✕
                    </button>
                </div>
            )}

            {/* ─── File List ─── */}
            <div className="nm-file-list">
                {/* Inline new folder */}
                {creatingFolder && (
                    <div className="nm-new-folder-inline">
                        <div className="nm-file-icon folder"><RiFolderFill /></div>
                        <input
                            ref={newFolderRef}
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            placeholder="Folder name..."
                            onKeyDown={e => {
                                if (e.key === 'Enter') createFolder(newFolderName);
                                if (e.key === 'Escape') setCreatingFolder(false);
                            }}
                            onBlur={() => { if (newFolderName.trim()) createFolder(newFolderName); else setCreatingFolder(false); }}
                        />
                    </div>
                )}

                {/* Folders */}
                {currentFolders.map(folder => (
                    <div
                        key={folder.id}
                        className={`nm-file-row ${selected.has(folder.id) ? 'selected' : ''} ${dragId === folder.id ? 'dragging' : ''} ${dragOverId === folder.id ? 'drag-over' : ''}`}
                        onClick={(e) => {
                            if (e.target.closest('input')) return;
                            navigateTo(folder);
                        }}
                        onContextMenu={(e) => { e.preventDefault(); openActionSheet(folder); }}
                        draggable
                        onDragStart={(e) => onDragStart(e, folder.id)}
                        onDragOver={(e) => onDragOver(e, folder.id)}
                        onDragLeave={onDragLeave}
                        onDrop={(e) => onDrop(e, folder)}
                        onDragEnd={onDragEnd}
                    >
                        <div className="nm-file-icon folder"><RiFolderFill /></div>
                        <div className="nm-file-info">
                            <div className="nm-file-name">
                                {renamingId === folder.id ? (
                                    <input
                                        value={renameValue}
                                        onChange={e => setRenameValue(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') renameItem(folder.id); if (e.key === 'Escape') setRenamingId(null); }}
                                        onBlur={() => renameItem(folder.id)}
                                        autoFocus
                                        onClick={e => e.stopPropagation()}
                                    />
                                ) : folder.name}
                            </div>
                            <div className="nm-file-meta">Folder</div>
                        </div>
                        <div className="nm-file-end">
                            <RiArrowRightSLine className="nm-file-chevron" />
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
                            openSubjectModal(subject);
                        }}
                        onContextMenu={(e) => { e.preventDefault(); openActionSheet(subject); }}
                        draggable
                        onDragStart={(e) => onDragStart(e, subject.id)}
                        onDragEnd={onDragEnd}
                    >
                        <div className="nm-file-icon subject"><RiBookOpenFill /></div>
                        <div className="nm-file-info">
                            <div className="nm-file-name">
                                {renamingId === subject.id ? (
                                    <input
                                        value={renameValue}
                                        onChange={e => setRenameValue(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') renameItem(subject.id); if (e.key === 'Escape') setRenamingId(null); }}
                                        onBlur={() => renameItem(subject.id)}
                                        autoFocus
                                        onClick={e => e.stopPropagation()}
                                    />
                                ) : subject.name}
                            </div>
                            <div className="nm-file-meta">{Object.keys(subject.units || {}).length} units</div>
                        </div>
                        <div className="nm-file-end">
                            <span className="nm-file-badge units">{Object.keys(subject.units || {}).length} Units</span>
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
                            openFileModal(file);
                        }}
                        onContextMenu={(e) => { e.preventDefault(); openActionSheet(file); }}
                        draggable
                        onDragStart={(e) => onDragStart(e, file.id)}
                        onDragEnd={onDragEnd}
                    >
                        <div className="nm-file-icon link"><RiLinkM /></div>
                        <div className="nm-file-info">
                            <div className="nm-file-name">
                                {renamingId === file.id ? (
                                    <input
                                        value={renameValue}
                                        onChange={e => setRenameValue(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') renameItem(file.id); if (e.key === 'Escape') setRenamingId(null); }}
                                        onBlur={() => renameItem(file.id)}
                                        autoFocus
                                        onClick={e => e.stopPropagation()}
                                    />
                                ) : file.name}
                            </div>
                            <div className="nm-file-meta">{file.link ? 'External Link' : 'No link'}</div>
                        </div>
                        <div className="nm-file-end">
                            {file.link && <span className="nm-file-badge link-type">Link</span>}
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

            {/* ─── FAB (Mobile only — Samsung style) ─── */}
            {fabOpen && <div className="nm-fab-backdrop" onClick={() => setFabOpen(false)} />}

            {fabOpen && (
                <div className="nm-fab-menu">
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
                </div>
            )}

            <button className={`nm-fab ${fabOpen ? 'open' : ''}`} onClick={() => setFabOpen(!fabOpen)}>
                <RiAddLine />
            </button>

            {/* ─── Action Sheet (long-press / context menu) ─── */}
            {actionSheet && (
                <div className="nm-action-sheet-overlay" onClick={() => setActionSheet(null)}>
                    <div className="nm-action-sheet" onClick={e => e.stopPropagation()}>
                        <div className="nm-action-sheet-handle" />

                        {isFolder(actionSheet.item.id) && (
                            <div className="nm-action-item" onClick={() => { navigateTo(actionSheet.item); setActionSheet(null); }}>
                                <RiFolderFill /> Open Folder
                            </div>
                        )}
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

                        <div className="nm-action-sep" />

                        <div className="nm-action-item danger" onClick={() => { deleteItems(selected.size > 0 ? [...selected] : [actionSheet.item.id]); setActionSheet(null); }}>
                            <RiDeleteBinLine /> Delete
                        </div>

                        <div className="nm-action-cancel" onClick={() => setActionSheet(null)}>
                            Cancel
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Subject Modal ─── */}
            {subjectModal && (
                <div className="nm-modal-overlay" onClick={() => setSubjectModal(null)}>
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
                                        <label>Name</label>
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
                                    {units.length > 1 && (
                                        <button className="nm-unit-remove-btn" onClick={() => setUnits(prev => prev.filter((_, j) => j !== i))}>
                                            <RiDeleteBinLine />
                                        </button>
                                    )}
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
                <div className="nm-modal-overlay" onClick={() => setFileModal(null)}>
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

            {/* ─── Move Modal ─── */}
            {moveModal && (
                <div className="nm-modal-overlay" onClick={() => setMoveModal(null)}>
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
        </div>
    );
};

export default NotesManager;
