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
        <div className="admin-subpage animate-fade-in">
            <header className="explorer-header">
                <div className="breadcrumb-nav">
                    <RiInformationLine className="card-icon-mini" />
                    <span className="crumb-static">Official Resources</span>
                </div>
            </header>

            <div className="explorer-content">
                <div className="settings-card rm-card-limit">
                    <h3>Academic Calendar</h3>
                    <p className="rm-description">
                        Update the official academic calendar PDF. Upload your PDF to Google Drive,
                        make it public ("Anyone with the link"), and paste the link below.
                    </p>

                    {/* Current File Status */}
                    <div className="rm-status-box">
                        <div className="rm-status-label">
                            Current Configuration
                        </div>
                        {currentFile ? (
                            <div className="rm-file-info">
                                <RiFilePdfLine size={28} className="mac-icon-alt" />
                                <div className="rm-file-details">
                                    <div className="rm-file-name">{currentFile.name || 'Academic Calendar'}</div>
                                    <div className="rm-file-date">Last Updated: {new Date(currentFile.updatedAt).toLocaleDateString()}</div>
                                </div>
                                <a href={currentFile.originalUrl || currentFile.url} target="_blank" rel="noreferrer"
                                    className="rm-view-link">
                                    <RiExternalLinkLine /> Check Link
                                </a>
                            </div>
                        ) : (
                            <div className="rm-no-file">No calendar configured.</div>
                        )}
                    </div>

                    {/* Form */}
                    <div className="rm-form-stack">
                        <div className="input-group">
                            <label className="rm-input-label">Display Name</label>
                            <input
                                value={inputName}
                                onChange={(e) => setInputName(e.target.value)}
                                placeholder="e.g. Academic Calendar 2025-26"
                                className="rm-text-input"
                            />
                        </div>

                        <div className="input-group">
                            <label className="rm-input-label">PDF Link (Google Drive / GitHub)</label>
                            <input
                                value={inputUrl}
                                onChange={(e) => setInputUrl(e.target.value)}
                                placeholder="https://drive.google.com/..."
                                className="rm-text-input"
                            />
                        </div>

                        <div className="rm-action-row">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="rm-save-btn"
                            >
                                {saving ? <RiLoader4Line className="spin" /> : <RiSave3Line />}
                                {saving ? 'Updating...' : 'Save Changes'}
                            </button>

                            {message && (
                                <div className={`rm-message ${message.includes('failed') ? 'error' : 'success'}`}>
                                    {message.includes('success') && <RiCheckLine />}
                                    {message}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rm-help-box">
                        <strong className="rm-help-title">
                            <RiInformationLine size={16} /> How to get a Google Drive Link:
                        </strong>
                        <ol className="rm-help-list">
                            <li>Upload PDF to Google Drive.</li>
                            <li>Right click the file → Share → Share.</li>
                            <li>Under "General Access", select <strong>"Anyone with the link"</strong>.</li>
                            <li>Click "Copy Link" and paste it above.</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResourceManager;
