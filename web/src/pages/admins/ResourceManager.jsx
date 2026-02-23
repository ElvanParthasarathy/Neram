import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { ref as dbRef, onValue, set } from 'firebase/database';
import { RiFilePdfLine, RiCheckLine, RiLoader4Line, RiSave3Line, RiExternalLinkLine, RiInformationLine } from 'react-icons/ri';
import '../../styles/resource-manager.css';

const ResourceManager = () => {
    const [currentFile, setCurrentFile] = useState(null);
    const [inputUrl, setInputUrl] = useState('');
    const [inputName, setInputName] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    // Fetch current file info
    useEffect(() => {
        const docRef = dbRef(db, 'official_docs/academic_calendar');
        const unsub = onValue(docRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setCurrentFile(data);
                setInputUrl(data.url || data.originalUrl || '');
                setInputName(data.name || '');
            }
        });
        return () => unsub();
    }, []);

    // Convert Google Drive share link to direct download link
    const convertToDriveDirectLink = (url) => {
        const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/uc?export=download&id=${match[1]}`;
        }
        return url;
    };

    const handleSave = async () => {
        if (!inputUrl.trim()) {
            setMessage('Please enter a valid URL.');
            return;
        }

        setSaving(true);
        setMessage('');

        try {
            const directUrl = convertToDriveDirectLink(inputUrl.trim());

            await set(dbRef(db, 'official_docs/academic_calendar'), {
                name: inputName.trim() || 'Academic Calendar',
                url: directUrl,
                originalUrl: inputUrl.trim(), // Keep original for display
                updatedAt: Date.now(),
                mimeType: 'application/pdf'
            });

            setMessage('Academic Calendar updated successfully!');
        } catch (error) {
            console.error("Save error:", error);
            setMessage(`Save failed: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="admin-subpage animate-fade-in resources-page-wrapper">
            <header className="explorer-header">
                <div className="breadcrumb-nav">
                    <RiInformationLine className="card-icon-mini" />
                    <span className="crumb-static">Official Resources</span>
                </div>
            </header>

            <div className="resources-container">
                <div className="resource-card settings-card">
                    <div className="rc-header">
                        <h3>Academic Calendar</h3>
                        <p>Manage the official academic calendar PDF. Upload your file to Google Drive, set permissions to "Anyone with the link", and paste it below.</p>
                    </div>

                    {/* Current File Status Block */}
                    <div className="active-file-wrapper">
                        <div className="wrapper-label">Current Configuration</div>
                        {currentFile ? (
                            <div className="active-file-block">
                                <div className="file-icon-box">
                                    <RiFilePdfLine />
                                </div>
                                <div className="file-meta">
                                    <h4>{currentFile.name || 'Academic Calendar'}</h4>
                                    <span>Last Updated: {new Date(currentFile.updatedAt).toLocaleDateString()}</span>
                                </div>
                                <a href={currentFile.originalUrl || currentFile.url} target="_blank" rel="noreferrer" className="btn-verify-link">
                                    <RiExternalLinkLine />
                                    <span>Check Link</span>
                                </a>
                            </div>
                        ) : (
                            <div className="empty-file-block">No calendar configured currently.</div>
                        )}
                    </div>

                    {/* Editor Form */}
                    <div className="resource-editor-form">
                        <div className="input-split-row">
                            <div className="input-group">
                                <label>Display Name</label>
                                <input
                                    value={inputName}
                                    onChange={(e) => setInputName(e.target.value)}
                                    placeholder="e.g. Academic Calendar 2025-26"
                                    className="mac-input"
                                />
                            </div>
                            <div className="input-group">
                                <label>PDF Link (Google Drive / GitHub)</label>
                                <input
                                    value={inputUrl}
                                    onChange={(e) => setInputUrl(e.target.value)}
                                    placeholder="https://drive.google.com/..."
                                    className="mac-input"
                                />
                            </div>
                        </div>

                        <div className="form-actions-row">
                            <button onClick={handleSave} disabled={saving} className="btn-save-master">
                                {saving ? <RiLoader4Line className="spin" /> : <RiSave3Line />}
                                {saving ? 'Updating...' : 'Save Changes'}
                            </button>

                            {message && (
                                <div className={`status-badge ${message.includes('failed') ? 'error' : 'success'}`}>
                                    {message.includes('success') && <RiCheckLine />}
                                    {message}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="resource-help-section settings-card">
                    <h4><RiInformationLine /> Quick Guide: Obtaining a Direct Link</h4>
                    <ol>
                        <li>Upload your PDF file to <strong>Google Drive</strong>.</li>
                        <li>Right click the uploaded file and select <strong>Share</strong>.</li>
                        <li>Under "General Access", change it to <strong>"Anyone with the link"</strong>.</li>
                        <li>Click <strong>Copy Link</strong> and paste it into the field above.</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default ResourceManager;
