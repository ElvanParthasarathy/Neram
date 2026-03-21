import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from "../../firebase";
import { ref, onValue, set, push, remove, update } from "firebase/database";
import { 
    RiFolderFill, 
    RiDeleteBinLine, 
    RiAddLine,
    RiArrowDownSLine,
    RiArrowUpSLine,
    RiBookOpenFill,
    RiLinkM,
    RiEdit2Line,
    RiDragMoveLine,
    RiFolderTransferLine,
    RiCheckboxBlankLine,
    RiCheckboxFill,
    RiCloseLine,
    RiMore2Fill
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
    
    // Context menu
    const [contextMenu, setContextMenu] = useState(null);
    
    // Inline rename
    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    
    // New folder inline
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const newFolderRef = useRef(null);
    
    // Subject form modal
    const [subjectModal, setSubjectModal] = useState(null); // null | { mode: 'create' | 'edit', subject? }
    const [subjectName, setSubjectName] = useState('');
    const [units, setUnits] = useState([{ name: 'Unit 1', link: '' }]);
    
    // File form modal
    const [fileModal, setFileModal] = useState(null); // null | { mode: 'create' | 'edit', file? }
    const [fileName, setFileName] = useState('');
    const [fileLink, setFileLink] = useState('');
    
    // Move modal
    const [moveModal, setMoveModal] = useState(null); // null | { ids: [], type: 'folder'|'subject' }
    
    // Drag state
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
    useEffect(() => { setSelected(new Set()); setContextMenu(null); }, [currentFolderId]);
    
    // Close context menu on click outside
    useEffect(() => {
        const close = () => setContextMenu(null);
        window.addEventListener('click', close);
        return () => window.removeEventListener('click', close);
    }, []);

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
            // Check if it's a folder, subject or file
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

    // --- DRAG & DROP ---
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

    // --- CONTEXT MENU ---
    const onContextMenu = (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selected.has(item.id)) setSelected(new Set([item.id]));
        setContextMenu({ x: e.clientX, y: e.clientY, item });
    };

    const isFolder = (id) => Object.values(folders).some(f => f.id === id);
    const isSubject = (id) => Object.values(subjects).some(s => s.id === id);
    const isFile = (id) => Object.values(files).some(f => f.id === id);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>Loading Notes Manager...</div>;

    return (
        <div className="notes-manager">
            {/* Mode Toggle */}
            <div className="nm-mode-bar">
                <div>
                    <h3>Notes Mode: {notesMode === 'fetch' ? 'Global RMD Fetch' : 'Custom Folders'}</h3>
                    <p>{notesMode === 'fetch' ? 'Students see the live rmd.ac.in notes.' : 'Students see the custom file explorer.'}</p>
                </div>
                <button className="nm-mode-toggle" onClick={toggleMode}>
                    Switch to {notesMode === 'fetch' ? 'Folder Mode' : 'Fetch Mode'}
                </button>
            </div>

            {/* Explorer */}
            <div className="nm-explorer">
                {/* Toolbar */}
                <div className="nm-toolbar" style={{ padding: '10px 16px' }}>
                    <div className="nm-breadcrumb">
                        {currentPath.map((p, i) => (
                            <React.Fragment key={p.id}>
                                {i > 0 && <span className="nm-breadcrumb-sep">›</span>}
                                <span
                                    className={`nm-breadcrumb-item ${i === currentPath.length - 1 ? 'active' : ''}`}
                                    onClick={() => i < currentPath.length - 1 && navigateToIndex(i)}
                                >
                                    {p.name}
                                </span>
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="nm-actions">
                        <button className="nm-btn" onClick={() => { setCreatingFolder(true); setNewFolderName(''); }}>
                            <RiAddLine /> Folder
                        </button>
                        <button className="nm-btn" onClick={() => openFileModal()}>
                            <RiAddLine /> File
                        </button>
                        <button className="nm-btn primary" onClick={() => openSubjectModal()}>
                            <RiAddLine /> Subject
                        </button>
                    </div>
                </div>

                {/* Selection Bar */}
                {selected.size > 0 && (
                    <div className="nm-selection-bar">
                        <span>{selected.size} selected</span>
                        <button className="nm-btn" onClick={selectAll} style={{ padding: '4px 10px', fontSize: '12px' }}>Select All</button>
                        <button className="nm-btn" onClick={() => setMoveModal({ ids: [...selected] })} style={{ padding: '4px 10px', fontSize: '12px' }}>
                            <RiFolderTransferLine /> Move
                        </button>
                        <button className="nm-btn danger" onClick={() => deleteItems([...selected])} style={{ padding: '4px 10px', fontSize: '12px' }}>
                            <RiDeleteBinLine /> Delete
                        </button>
                        <div style={{ flex: 1 }} />
                        <button className="nm-btn" onClick={clearSelection} style={{ padding: '4px 10px', fontSize: '12px' }}>
                            <RiCloseLine /> Clear
                        </button>
                    </div>
                )}

                {/* Grid */}
                <div className="nm-grid">
                    {/* New Folder Inline */}
                    {creatingFolder && (
                        <div className="nm-new-folder">
                            <RiFolderFill size={44} color="var(--mac-blue)" />
                            <input
                                ref={newFolderRef}
                                value={newFolderName}
                                onChange={e => setNewFolderName(e.target.value)}
                                placeholder="Folder name"
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
                            className={`nm-item ${selected.has(folder.id) ? 'selected' : ''} ${dragId === folder.id ? 'dragging' : ''} ${dragOverId === folder.id ? 'drag-over' : ''}`}
                            onClick={(e) => toggleSelect(folder.id, e)}
                            onDoubleClick={() => navigateTo(folder)}
                            onContextMenu={(e) => onContextMenu(e, folder)}
                            draggable
                            onDragStart={(e) => onDragStart(e, folder.id)}
                            onDragOver={(e) => onDragOver(e, folder.id)}
                            onDragLeave={onDragLeave}
                            onDrop={(e) => onDrop(e, folder)}
                            onDragEnd={onDragEnd}
                        >
                            <div className="nm-item-icon folder"><RiFolderFill /></div>
                            <div className="nm-item-name">
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
                        </div>
                    ))}

                    {/* Subjects */}
                    {currentSubjects.map(subject => (
                        <div
                            key={subject.id}
                            className={`nm-item ${selected.has(subject.id) ? 'selected' : ''} ${dragId === subject.id ? 'dragging' : ''}`}
                            onClick={(e) => toggleSelect(subject.id, e)}
                            onDoubleClick={() => openSubjectModal(subject)}
                            onContextMenu={(e) => onContextMenu(e, subject)}
                            draggable
                            onDragStart={(e) => onDragStart(e, subject.id)}
                            onDragEnd={onDragEnd}
                        >
                            <div className="nm-item-icon subject"><RiBookOpenFill /></div>
                            <div className="nm-item-name">
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
                            <div className="nm-item-badge">{Object.keys(subject.units || {}).length} units</div>
                        </div>
                    ))}

                    {/* Files / Direct Links */}
                    {currentFiles.map(file => (
                        <div
                            key={file.id}
                            className={`nm-item ${selected.has(file.id) ? 'selected' : ''} ${dragId === file.id ? 'dragging' : ''}`}
                            onClick={(e) => toggleSelect(file.id, e)}
                            onDoubleClick={() => openFileModal(file)}
                            onContextMenu={(e) => onContextMenu(e, file)}
                            draggable
                            onDragStart={(e) => onDragStart(e, file.id)}
                            onDragEnd={onDragEnd}
                        >
                            <div className="nm-item-icon file" style={{ color: 'var(--accent-primary)' }}><RiLinkM /></div>
                            <div className="nm-item-name">
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
                            {file.link && <div className="nm-item-badge" style={{ background: 'rgba(0,122,255,0.1)', color: 'var(--accent-primary)' }}>Link</div>}
                        </div>
                    ))}

                    {/* Empty */}
                    {currentFolders.length === 0 && currentSubjects.length === 0 && currentFiles.length === 0 && !creatingFolder && (
                        <div className="nm-empty" style={{ gridColumn: '1 / -1' }}>
                            <div className="nm-empty-icon">📁</div>
                            <div>No items here</div>
                            <div style={{ fontSize: '13px' }}>Create a folder, subject or file to get started</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div className="nm-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={e => e.stopPropagation()}>
                    {isFolder(contextMenu.item.id) && (
                        <div className="nm-context-item" onClick={() => { navigateTo(contextMenu.item); setContextMenu(null); }}>
                            <RiFolderFill size={16} /> Open
                        </div>
                    )}
                    {isSubject(contextMenu.item.id) && (
                        <div className="nm-context-item" onClick={() => { openSubjectModal(contextMenu.item); setContextMenu(null); }}>
                            <RiEdit2Line size={16} /> Edit Subject
                        </div>
                    )}
                    {isFile(contextMenu.item.id) && (
                        <div className="nm-context-item" onClick={() => { openFileModal(contextMenu.item); setContextMenu(null); }}>
                            <RiEdit2Line size={16} /> Edit Link
                        </div>
                    )}
                    <div className="nm-context-item" onClick={() => { setRenamingId(contextMenu.item.id); setRenameValue(contextMenu.item.name); setContextMenu(null); }}>
                        <RiEdit2Line size={16} /> Rename
                    </div>
                    <div className="nm-context-item" onClick={() => { setMoveModal({ ids: selected.size > 0 ? [...selected] : [contextMenu.item.id] }); setContextMenu(null); }}>
                        <RiFolderTransferLine size={16} /> Move to...
                    </div>
                    <div className="nm-context-sep" />
                    <div className="nm-context-item danger" onClick={() => { deleteItems(selected.size > 0 ? [...selected] : [contextMenu.item.id]); setContextMenu(null); }}>
                        <RiDeleteBinLine size={16} /> Delete
                    </div>
                </div>
            )}

            {/* Subject Modal */}
            {subjectModal && (
                <div className="nm-modal-overlay" onClick={() => setSubjectModal(null)}>
                    <div className="nm-modal" onClick={e => e.stopPropagation()}>
                        <h3>{subjectModal.mode === 'edit' ? 'Edit Subject' : 'New Subject'}</h3>
                        <input
                            className="nm-input"
                            placeholder="Subject name (e.g., Mathematics)"
                            value={subjectName}
                            onChange={e => setSubjectName(e.target.value)}
                            autoFocus
                        />
                        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: 8, opacity: 0.7 }}>Units</div>
                        {units.map((unit, i) => (
                            <div key={i} className="nm-unit-row">
                                <input
                                    className="nm-input"
                                    style={{ marginBottom: 0 }}
                                    placeholder="Unit name"
                                    value={unit.name}
                                    onChange={e => setUnits(prev => prev.map((u, j) => j === i ? { ...u, name: e.target.value } : u))}
                                />
                                <input
                                    className="nm-input"
                                    style={{ marginBottom: 0 }}
                                    placeholder="External Link (Drive, Docs, etc.)"
                                    value={unit.link}
                                    onChange={e => setUnits(prev => prev.map((u, j) => j === i ? { ...u, link: e.target.value } : u))}
                                />
                                {units.length > 1 && (
                                    <button className="nm-btn danger" style={{ padding: '6px 8px' }} onClick={() => setUnits(prev => prev.filter((_, j) => j !== i))}>
                                        <RiDeleteBinLine size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <div className="nm-modal-footer">
                            <button className="nm-btn" onClick={() => setUnits(prev => [...prev, { name: `Unit ${prev.length + 1}`, link: '' }])}>
                                <RiAddLine size={14} /> Add Unit
                            </button>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="nm-btn" onClick={() => setSubjectModal(null)}>Cancel</button>
                                <button className="nm-btn primary" onClick={saveSubject}>
                                    {subjectModal.mode === 'edit' ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* File Modal */}
            {fileModal && (
                <div className="nm-modal-overlay" onClick={() => setFileModal(null)}>
                    <div className="nm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
                        <h3>{fileModal.mode === 'edit' ? 'Edit Link' : 'New Link'}</h3>
                        <p style={{ fontSize: '12px', opacity: 0.7, marginBottom: 12 }}>Create a standalone link that opens directly when clicked.</p>
                        
                        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: 4 }}>Name</div>
                        <input
                            className="nm-input"
                            placeholder="File/Link name (e.g., Syllabus, Lab Manual)"
                            value={fileName}
                            onChange={e => setFileName(e.target.value)}
                            autoFocus
                        />

                        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: 4 }}>Link URL</div>
                        <input
                            className="nm-input"
                            placeholder="https://drive.google.com/..."
                            value={fileLink}
                            onChange={e => setFileLink(e.target.value)}
                        />

                        <div className="nm-modal-footer">
                            <div style={{ flex: 1 }} />
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="nm-btn" onClick={() => setFileModal(null)}>Cancel</button>
                                <button className="nm-btn primary" onClick={saveFile}>
                                    {fileModal.mode === 'edit' ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Move Modal */}
            {moveModal && (
                <div className="nm-modal-overlay" onClick={() => setMoveModal(null)}>
                    <div className="nm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <h3>Move to...</h3>
                        <div className="nm-move-list">
                            <div
                                className={`nm-move-item`}
                                onClick={() => moveItems(moveModal.ids, 'root')}
                            >
                                <RiFolderFill color="var(--mac-blue)" /> Notes Drive (Root)
                            </div>
                            {allFoldersList
                                .filter(f => !moveModal.ids.includes(f.id))
                                .map(folder => (
                                    <div
                                        key={folder.id}
                                        className="nm-move-item"
                                        onClick={() => moveItems(moveModal.ids, folder.id)}
                                    >
                                        <RiFolderFill color="var(--mac-blue)" /> {folder.name}
                                    </div>
                                ))
                            }
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="nm-btn" onClick={() => setMoveModal(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotesManager;
