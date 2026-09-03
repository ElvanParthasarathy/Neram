import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { db, auth } from "../../../firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
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
    RiCheckLine,
    RiGoogleLine,
    RiFileCopyLine,
    RiInformationLine,
    RiRefreshLine,
    RiLoader4Line,
    RiFilePdfLine
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
    
    // Google Drive OAuth & Direct Drive API Sync
    const [driveSyncModal, setDriveSyncModal] = useState(false);
    const [driveAccessToken, setDriveAccessToken] = useState(() => sessionStorage.getItem('neram_drive_token') || null);
    const [driveConnectedEmail, setDriveConnectedEmail] = useState(() => sessionStorage.getItem('neram_drive_email') || null);
    const [connectingDrive, setConnectingDrive] = useState(false);
    const [driveUrl, setDriveUrl] = useState('');
    const [fetchingDrive, setFetchingDrive] = useState(false);
    const [drivePreview, setDrivePreview] = useState(null);
    const [importingDrive, setImportingDrive] = useState(false);
    const [importTarget, setImportTarget] = useState('current'); // 'current' | 'root'
    const [importMode, setImportMode] = useState('merge'); // 'merge' | 'replace'
    const [structureMode, setStructureMode] = useState('smart'); // 'smart' | 'normal'
    const [createTopFolder, setCreateTopFolder] = useState(true);
    const [customRootName, setCustomRootName] = useState('');
    
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
    const currentSubjects = Object.entries(subjects)
        .filter(([, s]) => s.parentId === currentFolderId)
        .map(([k, s]) => ({ ...s, _key: k }));

    // Extract subject IDs and names to deduplicate against legacy/ghost folders
    const subjectIdSet = new Set(currentSubjects.map(s => s.id));
    const subjectNameSet = new Set(currentSubjects.map(s => (s.name || '').trim().toLowerCase()));

    const currentFolders = Object.entries(folders)
        .filter(([, f]) => {
            if (f.parentId !== currentFolderId) return false;
            // Deduplicate: If an item in this folder already exists as a Subject, hide the duplicate folder
            if (f.id && subjectIdSet.has(f.id)) return false;
            if (f.name && subjectNameSet.has((f.name || '').trim().toLowerCase())) return false;
            return true;
        })
        .map(([k, f]) => ({ ...f, _key: k }));

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

    // --- GOOGLE DRIVE OAUTH & DIRECT API HANDLERS ---
    const handleConnectDrive = async () => {
        setConnectingDrive(true);
        try {
            const provider = new GoogleAuthProvider();
            provider.addScope('https://www.googleapis.com/auth/drive.readonly');
            provider.setCustomParameters({ prompt: 'select_account' });
            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;
            if (!token) {
                throw new Error("Could not retrieve Google Drive access token. Please ensure popup was not blocked.");
            }
            const email = result.user?.email || "Google Account";
            setDriveAccessToken(token);
            setDriveConnectedEmail(email);
            sessionStorage.setItem('neram_drive_token', token);
            sessionStorage.setItem('neram_drive_email', email);
            showToast(`✅ Connected to Google Drive (${email})`);
        } catch (err) {
            console.error("Google Drive OAuth error:", err);
            showToast(`❌ Connection failed: ${err.message}`);
        } finally {
            setConnectingDrive(false);
        }
    };

    const handleDisconnectDrive = () => {
        setDriveAccessToken(null);
        setDriveConnectedEmail(null);
        sessionStorage.removeItem('neram_drive_token');
        sessionStorage.removeItem('neram_drive_email');
        setDrivePreview(null);
        showToast("Disconnected Google Drive.");
    };

    const extractFolderId = (input) => {
        if (!input) return null;
        const trimmed = input.trim();
        // Match /folders/<ID>
        const mFolder = trimmed.match(/\/folders\/([a-zA-Z0-9-_]+)/);
        if (mFolder && mFolder[1]) return mFolder[1];
        // Match id=<ID>
        const mId = trimmed.match(/[?&]id=([a-zA-Z0-9-_]+)/);
        if (mId && mId[1]) return mId[1];
        // Standalone Google Drive folder ID (alphanumeric, hyphens, underscores >= 20 chars)
        const mStandalone = trimmed.match(/^[a-zA-Z0-9-_]{20,}$/);
        if (mStandalone) return mStandalone[0];
        return null;
    };

    const handleFetchDrive = async () => {
        if (!driveAccessToken) {
            showToast("⚠️ Please connect your Google Drive first.");
            return;
        }
        const folderId = extractFolderId(driveUrl);
        if (!folderId) {
            showToast("⚠️ Please enter a valid Google Drive folder link or ID.");
            return;
        }

        setFetchingDrive(true);
        setDrivePreview(null);

        try {
            // 1. Fetch root folder metadata
            const metaResp = await fetch(
                `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType&supportsAllDrives=true`,
                { headers: { Authorization: `Bearer ${driveAccessToken}` } }
            );

            if (!metaResp.ok) {
                const errData = await metaResp.json().catch(() => ({}));
                const msg = errData?.error?.message || `HTTP ${metaResp.status}`;
                if (metaResp.status === 401) {
                    handleDisconnectDrive();
                    throw new Error("Session expired. Please reconnect Google Drive.");
                }
                throw new Error(msg);
            }
            const rootMeta = await metaResp.json();

            // 2. Recursive crawler (supports Shared Drives & My Drive)
            let totalF = 0;
            let totalFiles = 0;

            const crawlFolder = async (fId, fName, depth = 0) => {
                if (depth > 6) return { id: fId, name: fName, folders: [], files: [] };

                let items = [];
                let pageToken = null;

                do {
                    const url = new URL('https://www.googleapis.com/drive/v3/files');
                    url.searchParams.set('q', `'${fId}' in parents and trashed = false`);
                    url.searchParams.set('fields', 'nextPageToken, files(id, name, mimeType, webViewLink, size)');
                    url.searchParams.set('pageSize', '1000');
                    url.searchParams.set('supportsAllDrives', 'true');
                    url.searchParams.set('includeItemsFromAllDrives', 'true');
                    if (pageToken) url.searchParams.set('pageToken', pageToken);

                    const resp = await fetch(url.toString(), {
                        headers: { Authorization: `Bearer ${driveAccessToken}` }
                    });
                    if (!resp.ok) break;
                    const data = await resp.json();
                    items = items.concat(data.files || []);
                    pageToken = data.nextPageToken;
                } while (pageToken);

                const subfolders = [];
                const files = [];

                for (const item of items) {
                    if (item.mimeType === 'application/vnd.google-apps.folder') {
                        totalF++;
                        const subTree = await crawlFolder(item.id, item.name, depth + 1);
                        subfolders.push(subTree);
                    } else {
                        totalFiles++;
                        files.push({
                            id: item.id,
                            name: item.name,
                            link: `https://drive.google.com/file/d/${item.id}/view?usp=drivesdk`,
                            mimeType: item.mimeType,
                            size: item.size
                        });
                    }
                }

                return {
                    id: fId,
                    name: fName,
                    folders: subfolders,
                    files: files
                };
            };

            const tree = await crawlFolder(folderId, rootMeta.name || "Drive Folder", 0);

            // 3. Analyze discovered structure (Folders vs Subjects vs Files)
            let totalBranchFolders = 0;
            let totalSubjectNodes = 0;
            let totalFilesCount = 0;

            const analyzeTree = (node) => {
                const hasSub = (node.folders || []).length > 0;
                const hasFl = (node.files || []).length > 0;
                if (!hasSub && hasFl) {
                    totalSubjectNodes++;
                    totalFilesCount += node.files.length;
                } else {
                    if (hasSub) totalBranchFolders++;
                    totalFilesCount += (node.files || []).length;
                    (node.folders || []).forEach(analyzeTree);
                }
            };
            analyzeTree(tree);

            setCustomRootName(tree.name);
            setDrivePreview({
                rootName: tree.name,
                rootId: tree.id,
                tree: tree,
                totalFolders: totalBranchFolders,
                totalSubjects: totalSubjectNodes,
                totalFiles: totalFilesCount
            });

            showToast(`✅ Found ${totalSubjectNodes} subjects, ${totalBranchFolders} folders, & ${totalFilesCount} files!`);
        } catch (err) {
            console.error("Google Drive API Fetch Error:", err);
            showToast(`❌ Fetch Error: ${err.message || "Failed to fetch from Google Drive"}`);
        } finally {
            setFetchingDrive(false);
        }
    };

    const cleanUnitName = (fileName, fallbackIdx = 0) => {
        if (!fileName) return `File ${fallbackIdx + 1}`;
        // Use the actual file name used by the individual (strip only file extension like .pdf, .docx)
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '').trim();
        return nameWithoutExt || fileName || `File ${fallbackIdx + 1}`;
    };

    const handleImportDrive = async () => {
        if (!drivePreview || !drivePreview.tree) return;
        setImportingDrive(true);

        try {
            const updates = {};
            const baseParentId = importTarget === 'root' ? 'root' : currentFolderId;
            const finalRootName = customRootName.trim() || drivePreview.rootName;

            // If user chose 'replace', wipe existing items
            if (importMode === 'replace') {
                if (importTarget === 'root') {
                    updates['notes_drive/folders'] = null;
                    updates['notes_drive/subjects'] = null;
                    updates['notes_drive/files'] = null;
                } else {
                    // Wipe current folder's immediate children so old folders don't duplicate with new subjects
                    currentFolders.forEach(f => { updates[`notes_drive/folders/${f._key}`] = null; });
                    currentSubjects.forEach(s => { updates[`notes_drive/subjects/${s._key}`] = null; });
                    currentFiles.forEach(fl => { updates[`notes_drive/files/${fl._key}`] = null; });
                }
            }

            let importedSubjects = 0;
            let importedFolders = 0;
            let importedFiles = 0;

            const buildSubjectNode = (node, parentId, nodeName = node.name) => {
                importedSubjects++;
                const unitsMap = {};
                // Numerical sort: Unit 1 before Unit 2 before Unit 10
                const sortedFiles = [...(node.files || [])].sort((a, b) => {
                    const numA = parseInt((a.name || '').replace(/\D/g, '')) || 0;
                    const numB = parseInt((b.name || '').replace(/\D/g, '')) || 0;
                    return numA - numB;
                });

                sortedFiles.forEach((f, idx) => {
                    importedFiles++;
                    let unitKey = cleanUnitName(f.name, idx);
                    if (unitsMap[unitKey]) {
                        const clean = f.name.replace(/\.[^/.]+$/, '').trim();
                        unitKey = clean || `${unitKey} (${idx + 1})`;
                    }
                    unitsMap[unitKey] = f.link;
                });

                updates[`notes_drive/subjects/${node.id}`] = {
                    id: node.id,
                    name: nodeName,
                    parentId: parentId,
                    units: unitsMap
                };

                // Explicitly purge any folder with this ID/name to prevent duplicate blue folders
                updates[`notes_drive/folders/${node.id}`] = null;
                Object.entries(folders).forEach(([fKey, fVal]) => {
                    if (fVal.parentId === parentId && (fVal.id === node.id || (fVal.name || '').trim().toLowerCase() === (nodeName || '').trim().toLowerCase())) {
                        updates[`notes_drive/folders/${fKey}`] = null;
                    }
                });
            };

            const recurseBuild = (node, parentId, isRoot = false) => {
                const nodeName = isRoot ? finalRootName : node.name;
                const hasSubfolders = (node.folders || []).length > 0;
                const hasFiles = (node.files || []).length > 0;

                if (structureMode === 'smart' && !hasSubfolders && hasFiles) {
                    // Smart Mode: Leaf folder containing files -> SUBJECT
                    buildSubjectNode(node, parentId, nodeName);
                } else {
                    // Normal Mode OR Branch folder -> REGULAR FOLDER
                    importedFolders++;
                    updates[`notes_drive/folders/${node.id}`] = {
                        id: node.id,
                        name: nodeName,
                        parentId: parentId
                    };

                    // Explicitly purge any subject with this ID/name to prevent duplicate books
                    updates[`notes_drive/subjects/${node.id}`] = null;
                    Object.entries(subjects).forEach(([sKey, sVal]) => {
                        if (sVal.parentId === parentId && (sVal.id === node.id || (sVal.name || '').trim().toLowerCase() === (nodeName || '').trim().toLowerCase())) {
                            updates[`notes_drive/subjects/${sKey}`] = null;
                        }
                    });

                    // Recurse subfolders
                    (node.folders || []).forEach(sub => {
                        recurseBuild(sub, node.id, false);
                    });

                    // Files inside this folder
                    (node.files || []).forEach(f => {
                        importedFiles++;
                        updates[`notes_drive/files/${f.id}`] = {
                            id: f.id,
                            name: f.name.replace(/\.[^/.]+$/, '').trim() || f.name,
                            link: f.link,
                            parentId: node.id
                        };
                    });
                }
            };

            if (createTopFolder) {
                recurseBuild(drivePreview.tree, baseParentId, true);
            } else {
                const hasSubfolders = (drivePreview.tree.folders || []).length > 0;
                const hasFiles = (drivePreview.tree.files || []).length > 0;

                if (structureMode === 'smart' && !hasSubfolders && hasFiles) {
                    buildSubjectNode(drivePreview.tree, baseParentId, finalRootName);
                } else {
                    (drivePreview.tree.folders || []).forEach(sub => {
                        recurseBuild(sub, baseParentId, false);
                    });
                    (drivePreview.tree.files || []).forEach(f => {
                        importedFiles++;
                        updates[`notes_drive/files/${f.id}`] = {
                            id: f.id,
                            name: f.name.replace(/\.[^/.]+$/, '').trim() || f.name,
                            link: f.link,
                            parentId: baseParentId
                        };
                    });
                }
            }

            // Atomic batch update to Firebase
            await update(ref(db), updates);

            showToast(`🎉 Imported ${importedSubjects} subjects, ${importedFolders} folders, and ${importedFiles} units/files!`);
            setDriveSyncModal(false);
            setDrivePreview(null);
            setDriveUrl('');
        } catch (err) {
            console.error("Firebase write error:", err);
            showToast(`❌ Import Error: ${err.message}`);
        } finally {
            setImportingDrive(false);
        }
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

            <div className="nm-header-row" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '16px', gap: '10px' }}>
                <div className="nm-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                        className="nm-file-more-btn" 
                        style={{ background: 'var(--mac-sidebar-bg)', color: 'var(--mac-text)', width: '36px', height: '36px', flexShrink: 0 }}
                        onClick={() => setDriveSyncModal(true)}
                        title="Google Drive Auto-Sync"
                    >
                        <RiGoogleLine style={{ fontSize: '18px' }} />
                    </button>

                    <button 
                        className="nm-file-more-btn" 
                        style={{ background: 'var(--mac-sidebar-bg)', color: 'var(--mac-text)', width: '36px', height: '36px', flexShrink: 0 }}
                        onClick={() => { setTempMode(notesMode); setSettingsModal(true); }}
                        title="Display Settings"
                    >
                        <RiSettings4Line style={{ fontSize: '18px' }} />
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
                            className="role-header-pill secondary nm-btn-edit"
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
                            <button className="nm-desk-btn" onClick={() => setDriveSyncModal(true)} style={{ color: 'var(--mac-blue)' }}>
                                <RiGoogleLine /> Drive Sync
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
                                    <div className="nm-fab-option" onClick={() => { setFabOpen(false); setDriveSyncModal(true); }}>
                                        <button className="nm-fab-option-btn link-btn" style={{ background: 'var(--mac-blue)' }}><RiGoogleLine /></button>
                                        <span className="nm-fab-option-label">Drive Sync</span>
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
                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--mac-border)' }}>
                                <button 
                                    type="button" 
                                    className="nm-modal-footer-btn cancel" 
                                    style={{ width: '100%', borderRadius: '14px', fontSize: '13px' }}
                                    onClick={() => { setSettingsModal(false); setDriveSyncModal(true); }}
                                >
                                    <RiGoogleLine style={{ fontSize: '16px' }} /> Open Google Drive Auto-Sync
                                </button>
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

            {/* ─── GOOGLE DRIVE SYNC MODAL (OAUTH & DIRECT DRIVE API) ─── */}
            {driveSyncModal && createPortal(
                <div className="modal-overlay animate-fade-in" onClick={() => !importingDrive && !fetchingDrive && setDriveSyncModal(false)}>
                    <div className="settings-card animate-pop-in" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '580px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                        <div className="nm-modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--mac-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: 'rgba(0, 122, 255, 0.1)',
                                    color: 'var(--mac-blue)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px'
                                }}>
                                    <RiGoogleLine />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--mac-text)' }}>Google Drive Sync</h3>
                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--mac-text-secondary)' }}>Direct Google Drive API</p>
                                </div>
                            </div>
                            <button 
                                className="nm-modal-close" 
                                onClick={() => !importingDrive && !fetchingDrive && setDriveSyncModal(false)}
                            >
                                <RiCloseLine />
                            </button>
                        </div>

                        <div className="nm-modal-body" style={{ padding: '20px 24px', overflowY: 'auto' }}>
                            {/* Google Account Connection Status Card */}
                            {!driveAccessToken ? (
                                <div style={{
                                    background: 'var(--mac-bg-secondary)',
                                    border: '1px solid var(--mac-border)',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    marginBottom: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '12px',
                                            background: 'rgba(0, 122, 255, 0.12)',
                                            color: 'var(--mac-blue)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '22px',
                                            flexShrink: 0
                                        }}>
                                            <RiGoogleLine />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--mac-text)' }}>
                                                Connect Google Drive
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--mac-text-secondary)', marginTop: '2px' }}>
                                                Authorize 1-click read access to your Drive notes & folders
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="role-header-pill active"
                                        onClick={handleConnectDrive}
                                        disabled={connectingDrive}
                                        style={{ padding: '8px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        {connectingDrive ? (
                                            <>
                                                <RiLoader4Line className="nm-spin" /> Connecting...
                                            </>
                                        ) : (
                                            <>
                                                <RiGoogleLine size={16} /> Connect Account
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div style={{
                                    background: 'rgba(48, 209, 88, 0.08)',
                                    border: '1px solid rgba(48, 209, 88, 0.25)',
                                    borderRadius: '16px',
                                    padding: '12px 16px',
                                    marginBottom: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '10px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            background: 'rgba(48, 209, 88, 0.15)',
                                            color: '#30D158',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '16px',
                                            flexShrink: 0
                                        }}>
                                            <RiCheckLine />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--mac-text)' }}>
                                                Connected to Google Drive
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--mac-text-secondary)' }}>
                                                {driveConnectedEmail || "Account Connected"}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="role-header-pill secondary"
                                        onClick={handleDisconnectDrive}
                                        style={{ padding: '6px 14px', fontSize: '12px' }}
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            )}

                            {/* Google Drive Folder Link */}
                            <div className="nm-field">
                                <label>Google Drive Folder Link or ID</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        className="nm-field-input"
                                        placeholder="https://drive.google.com/drive/folders/1ABC... or Folder ID"
                                        value={driveUrl}
                                        onChange={e => setDriveUrl(e.target.value)}
                                        disabled={fetchingDrive || importingDrive}
                                        style={{ flex: 1 }}
                                        onKeyDown={e => { if (e.key === 'Enter') handleFetchDrive(); }}
                                    />
                                    <button
                                        type="button"
                                        className="nm-modal-footer-btn confirm"
                                        onClick={handleFetchDrive}
                                        disabled={fetchingDrive || importingDrive || !driveUrl.trim() || !driveAccessToken}
                                        style={{ 
                                            flex: 'initial', 
                                            padding: '0 18px', 
                                            borderRadius: '12px', 
                                            fontSize: '13px', 
                                            whiteSpace: 'nowrap' 
                                        }}
                                    >
                                        {fetchingDrive ? (
                                            <>
                                                <RiLoader4Line className="nm-spin" /> Scanning...
                                            </>
                                        ) : (
                                            <>
                                                <RiRefreshLine /> Scan Folder
                                            </>
                                        )}
                                    </button>
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--mac-text-secondary)', marginTop: '2px' }}>
                                    Paste any folder link from My Drive, "Shared with me", or Shared Drives.
                                </span>
                            </div>

                            {/* Discovered Items Preview */}
                            {drivePreview && (
                                <div style={{
                                    background: 'var(--mac-bg-secondary)',
                                    border: '1px solid var(--mac-border)',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    marginTop: '16px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="nm-file-icon folder" style={{ width: '32px', height: '32px', fontSize: '18px' }}>
                                                <RiFolderFill />
                                            </div>
                                            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--mac-text)' }}>
                                                {drivePreview.rootName}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            {drivePreview.totalSubjects > 0 && (
                                                <span className="nm-file-badge subject" style={{ background: 'rgba(255, 159, 10, 0.15)', color: '#FF9F0A' }}>
                                                    {drivePreview.totalSubjects} Subjects
                                                </span>
                                            )}
                                            <span className="nm-file-badge link-type">
                                                {drivePreview.totalFolders} Folders
                                            </span>
                                            <span className="nm-file-badge units">
                                                {drivePreview.totalFiles} Units / Files
                                            </span>
                                        </div>
                                    </div>

                                    {/* Editable Root/Subject Name */}
                                    <div className="nm-field" style={{ marginBottom: '14px' }}>
                                        <label>Folder / Subject Name (Editable)</label>
                                        <input
                                            className="nm-field-input"
                                            value={customRootName}
                                            onChange={e => setCustomRootName(e.target.value)}
                                            placeholder="Enter name to display in Notes Drive"
                                        />
                                    </div>

                                    {/* Import Style Selection (Smart vs Normal) */}
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mac-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '8px' }}>
                                        Import Style
                                    </label>
                                    <div className="nm-move-list" style={{ marginBottom: '14px' }}>
                                        <div 
                                            className={`nm-move-option ${structureMode === 'smart' ? 'selected' : ''}`}
                                            onClick={() => setStructureMode('smart')}
                                            style={{ background: structureMode === 'smart' ? 'color-mix(in srgb, var(--mac-blue) 12%, transparent)' : 'var(--mac-card-bg)', border: '1px solid var(--mac-border)' }}
                                        >
                                            <div style={{ width: '20px', display: 'flex', alignItems: 'center', color: structureMode === 'smart' ? 'var(--mac-blue)' : 'var(--mac-text-secondary)' }}>
                                                {structureMode === 'smart' ? <RiCheckLine /> : <div style={{ width: 14, height: 14, border: '2px solid var(--mac-border)', borderRadius: '50%' }} />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--mac-text)' }}>Smart Subject Mode</div>
                                                <div style={{ fontSize: '12px', color: 'var(--mac-text-secondary)' }}>Converts unit folders into Subjects with expandable Units (Unit 1 to 5)</div>
                                            </div>
                                        </div>

                                        <div 
                                            className={`nm-move-option ${structureMode === 'normal' ? 'selected' : ''}`}
                                            onClick={() => setStructureMode('normal')}
                                            style={{ background: structureMode === 'normal' ? 'color-mix(in srgb, var(--mac-blue) 12%, transparent)' : 'var(--mac-card-bg)', border: '1px solid var(--mac-border)' }}
                                        >
                                            <div style={{ width: '20px', display: 'flex', alignItems: 'center', color: structureMode === 'normal' ? 'var(--mac-blue)' : 'var(--mac-text-secondary)' }}>
                                                {structureMode === 'normal' ? <RiCheckLine /> : <div style={{ width: 14, height: 14, border: '2px solid var(--mac-border)', borderRadius: '50%' }} />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--mac-text)' }}>Normal Folder Mode</div>
                                                <div style={{ fontSize: '12px', color: 'var(--mac-text-secondary)' }}>Exact 1:1 Google Drive mirror (all folders stay Folders, files stay loose links)</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Import Target Selection */}
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mac-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '8px' }}>
                                        Import Location
                                    </label>
                                    <div className="nm-move-list" style={{ marginBottom: '12px' }}>
                                        <div 
                                            className={`nm-move-option ${importTarget === 'current' ? 'selected' : ''}`}
                                            onClick={() => setImportTarget('current')}
                                            style={{ background: importTarget === 'current' ? 'color-mix(in srgb, var(--mac-blue) 12%, transparent)' : 'var(--mac-card-bg)', border: '1px solid var(--mac-border)' }}
                                        >
                                            <div style={{ width: '20px', display: 'flex', alignItems: 'center', color: importTarget === 'current' ? 'var(--mac-blue)' : 'var(--mac-text-secondary)' }}>
                                                {importTarget === 'current' ? <RiCheckLine /> : <div style={{ width: 14, height: 14, border: '2px solid var(--mac-border)', borderRadius: '50%' }} />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--mac-text)' }}>Current Folder ({currentPath[currentPath.length - 1].name})</div>
                                                <div style={{ fontSize: '12px', color: 'var(--mac-text-secondary)' }}>Import inside this folder</div>
                                            </div>
                                        </div>

                                        <div 
                                            className={`nm-move-option ${importTarget === 'root' ? 'selected' : ''}`}
                                            onClick={() => setImportTarget('root')}
                                            style={{ background: importTarget === 'root' ? 'color-mix(in srgb, var(--mac-blue) 12%, transparent)' : 'var(--mac-card-bg)', border: '1px solid var(--mac-border)' }}
                                        >
                                            <div style={{ width: '20px', display: 'flex', alignItems: 'center', color: importTarget === 'root' ? 'var(--mac-blue)' : 'var(--mac-text-secondary)' }}>
                                                {importTarget === 'root' ? <RiCheckLine /> : <div style={{ width: 14, height: 14, border: '2px solid var(--mac-border)', borderRadius: '50%' }} />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--mac-text)' }}>Root Notes Drive</div>
                                                <div style={{ fontSize: '12px', color: 'var(--mac-text-secondary)' }}>Import at top level</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sync Mode */}
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mac-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '8px' }}>
                                        Sync Mode
                                    </label>
                                    <div className="nm-move-list" style={{ marginBottom: '12px' }}>
                                        <div 
                                            className={`nm-move-option ${importMode === 'merge' ? 'selected' : ''}`}
                                            onClick={() => setImportMode('merge')}
                                            style={{ background: importMode === 'merge' ? 'color-mix(in srgb, var(--mac-blue) 12%, transparent)' : 'var(--mac-card-bg)', border: '1px solid var(--mac-border)' }}
                                        >
                                            <div style={{ width: '20px', display: 'flex', alignItems: 'center', color: importMode === 'merge' ? 'var(--mac-blue)' : 'var(--mac-text-secondary)' }}>
                                                {importMode === 'merge' ? <RiCheckLine /> : <div style={{ width: 14, height: 14, border: '2px solid var(--mac-border)', borderRadius: '50%' }} />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--mac-text)' }}>Merge with Existing Notes</div>
                                                <div style={{ fontSize: '12px', color: 'var(--mac-text-secondary)' }}>Keep existing items and add new items</div>
                                            </div>
                                        </div>

                                        <div 
                                            className={`nm-move-option ${importMode === 'replace' ? 'selected' : ''}`}
                                            onClick={() => setImportMode('replace')}
                                            style={{ background: importMode === 'replace' ? 'color-mix(in srgb, var(--mac-blue) 12%, transparent)' : 'var(--mac-card-bg)', border: '1px solid var(--mac-border)' }}
                                        >
                                            <div style={{ width: '20px', display: 'flex', alignItems: 'center', color: importMode === 'replace' ? 'var(--mac-blue)' : 'var(--mac-text-secondary)' }}>
                                                {importMode === 'replace' ? <RiCheckLine /> : <div style={{ width: 14, height: 14, border: '2px solid var(--mac-border)', borderRadius: '50%' }} />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--mac-text)' }}>Full Replace (Clean Old Duplicates)</div>
                                                <div style={{ fontSize: '12px', color: 'var(--mac-text-secondary)' }}>{importTarget === 'root' ? "Wipe entire Notes Drive and sync fresh" : "Clear this folder's contents and sync fresh"}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Create enclosing folder checkbox */}
                                    <div 
                                        style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '10px', 
                                            padding: '12px 14px', 
                                            borderRadius: '12px', 
                                            background: 'var(--mac-card-bg)', 
                                            border: '1px solid var(--mac-border)',
                                            cursor: 'pointer'
                                        }} 
                                        onClick={() => setCreateTopFolder(!createTopFolder)}
                                    >
                                        <input 
                                            type="checkbox" 
                                            className="mac-checkbox"
                                            checked={createTopFolder}
                                            onChange={e => { e.stopPropagation(); setCreateTopFolder(e.target.checked); }}
                                            onClick={e => e.stopPropagation()}
                                        />
                                        <span style={{ fontSize: '13px', color: 'var(--mac-text)' }}>
                                            Create enclosing folder named <strong>"{customRootName.trim() || drivePreview.rootName}"</strong>
                                        </span>
                                    </div>

                                    {/* Discovered Items Peek */}
                                    <div style={{ marginTop: '14px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mac-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '8px' }}>
                                            Top-Level Items
                                        </label>
                                        <div style={{ 
                                            maxHeight: '140px', 
                                            overflowY: 'auto', 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            gap: '4px',
                                            padding: '8px',
                                            borderRadius: '12px',
                                            background: 'var(--mac-card-bg)',
                                            border: '1px solid var(--mac-border)'
                                        }}>
                                            {(drivePreview.tree.folders || []).map(f => {
                                                const isSubject = (f.folders || []).length === 0 && (f.files || []).length > 0;
                                                return (
                                                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '8px' }}>
                                                        <div className={`nm-file-icon ${isSubject ? 'subject' : 'folder'}`} style={{ width: '24px', height: '24px', fontSize: '14px', background: isSubject ? 'rgba(255, 159, 10, 0.15)' : undefined, color: isSubject ? '#FF9F0A' : undefined }}>
                                                            {isSubject ? <RiBookOpenFill /> : <RiFolderFill />}
                                                        </div>
                                                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--mac-text)' }}>{f.name}</span>
                                                        <span style={{ fontSize: '11px', color: 'var(--mac-text-secondary)', marginLeft: 'auto' }}>
                                                            {isSubject ? `Subject (${(f.files || []).length} units)` : `${(f.folders || []).length} folders, ${(f.files || []).length} files`}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                            {(drivePreview.tree.files || []).map(fl => (
                                                <div key={fl.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '8px' }}>
                                                    <div className="nm-file-icon file" style={{ width: '24px', height: '24px', fontSize: '14px' }}>
                                                        <RiLinkM />
                                                    </div>
                                                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--mac-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {fl.name}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: 'var(--mac-text-secondary)', marginLeft: 'auto' }}>
                                                        Direct Link
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="nm-modal-footer">
                            <button 
                                type="button"
                                className="nm-modal-footer-btn cancel" 
                                onClick={() => setDriveSyncModal(false)}
                                disabled={importingDrive || fetchingDrive}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button"
                                className="nm-modal-footer-btn confirm"
                                onClick={handleImportDrive}
                                disabled={!drivePreview || importingDrive || fetchingDrive}
                            >
                                {importingDrive ? (
                                    <>
                                        <RiLoader4Line className="nm-spin" /> Importing...
                                    </>
                                ) : (
                                    <>
                                        Import to Notes Drive
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
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
