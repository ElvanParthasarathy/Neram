import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { db } from "../../../firebase";
import { ref, onValue, set } from "firebase/database";
import { 
    RiAddLine, 
    RiEdit2Line, 
    RiDeleteBinLine, 
    RiCloseLine, 
    RiEyeLine, 
    RiEyeOffLine,
    RiInformationLine,
    RiSparklingLine,
    RiArrowRightLine,
    RiArrowLeftLine
} from 'react-icons/ri';
import { ToggleSwitch } from '../../student/settings/SettingsShared';
import { useToast } from '../../../contexts/ToastContext';

const TYPE_OPTIONS = ['UPDATE', 'TIPS', 'NOTICE', 'NEW', 'ALERT'];

const ROUTE_OPTIONS = [
    { value: '', label: 'None (No Click Action)' },
    { value: 'language', label: 'Language Settings (Tamil / English)' },
    { value: 'display', label: 'Display & Theme Settings' },
    { value: 'notes', label: 'Notes & Syllabus' },
    { value: 'schedule', label: 'Schedule & Timetable' },
    { value: 'calendar', label: 'Academic Calendar' },
    { value: 'profile', label: 'Profile Screen' },
    { value: 'security', label: 'Security & Linked Accounts' },
    { value: 'about_app', label: 'About Neram' }
];

const BannerManager = ({ isMobile }) => {
    const { showToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const [enabled, setEnabled] = useState(true);
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editModal, setEditModal] = useState(null); // null, 'new', or banner object

    // Single language entry + Settings / Screen Mapper
    const [formId, setFormId] = useState('');
    const [formType, setFormType] = useState('UPDATE');
    const [formCustomType, setFormCustomType] = useState('');
    const [formMessage, setFormMessage] = useState('');
    const [formActionRoute, setFormActionRoute] = useState('');
    const [formEnabled, setFormEnabled] = useState(true);

    const STALE_IDS = ['card_drive_notes', 'card_tamil_language'];

    useEffect(() => {
        const featureCardsRef = ref(db, 'settings/feature_cards');
        const unsubscribe = onValue(featureCardsRef, (snapshot) => {
            if (snapshot.exists()) {
                const val = snapshot.val();
                const isEnabled = val.enabled !== false;
                setEnabled(isEnabled);
                if (val.cards) {
                    const rawList = Array.isArray(val.cards) 
                        ? val.cards.filter(Boolean) 
                        : Object.entries(val.cards).map(([k, v]) => ({ id: k, ...v }));

                    // Normalize to single language: { id, type, message, actionRoute, enabled }
                    const cleanedList = rawList
                        .filter(item => !STALE_IDS.includes(item.id))
                        .map(item => ({
                            id: item.id || ('banner_' + Math.random().toString(36).substr(2, 9)),
                            type: item.type || item.badge || 'UPDATE',
                            message: item.message || item.description || item.title || '',
                            actionRoute: item.actionRoute || '',
                            enabled: item.enabled !== false
                        }));

                    const hasStale = rawList.some(item => STALE_IDS.includes(item.id));
                    if (hasStale) {
                        set(ref(db, 'settings/feature_cards'), { enabled: isEnabled, cards: cleanedList });
                    }
                    setBanners(cleanedList);
                } else {
                    setBanners([]);
                }
            } else {
                setEnabled(true);
                setBanners([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const saveToFirebase = async (newEnabled, newBanners) => {
        try {
            await set(ref(db, 'settings/feature_cards'), {
                enabled: newEnabled,
                cards: newBanners
            });
            showToast('Banners saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving banners:', error);
            showToast('Failed to save: ' + error.message, 'error');
        }
    };

    const handleToggleMaster = () => {
        const newEnabled = !enabled;
        setEnabled(newEnabled);
        saveToFirebase(newEnabled, banners);
    };

    const handleToggleBannerEnabled = (id) => {
        const updated = banners.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b);
        setBanners(updated);
        saveToFirebase(enabled, updated);
    };

    const handleDeleteBanner = (id) => {
        if (window.confirm('Delete this banner?')) {
            const updated = banners.filter(b => b.id !== id);
            setBanners(updated);
            saveToFirebase(enabled, updated);
        }
    };

    const openAddModal = () => {
        setFormId('banner_' + Date.now().toString(36));
        setFormType('UPDATE');
        setFormCustomType('');
        setFormMessage('');
        setFormActionRoute('');
        setFormEnabled(true);
        setEditModal('new');
    };

    const openEditModal = (banner) => {
        setFormId(banner.id);
        const isStandard = TYPE_OPTIONS.includes(banner.type);
        setFormType(isStandard ? banner.type : 'CUSTOM');
        setFormCustomType(isStandard ? '' : banner.type);
        setFormMessage(banner.message || '');
        setFormActionRoute(banner.actionRoute || '');
        setFormEnabled(banner.enabled !== false);
        setEditModal(banner);
    };

    const handleSaveModal = (e) => {
        e.preventDefault();
        if (!formMessage.trim()) {
            showToast('Please enter a message', 'error');
            return;
        }

        const resolvedType = (formType === 'CUSTOM' ? formCustomType.trim() : formType) || 'UPDATE';

        const newBannerObj = {
            id: formId || ('banner_' + Date.now().toString(36)),
            type: resolvedType.toUpperCase(),
            badge: resolvedType.toUpperCase(),
            message: formMessage.trim(),
            title: formMessage.trim(),
            description: formMessage.trim(),
            actionRoute: formActionRoute,
            enabled: formEnabled
        };

        let updated;
        if (editModal === 'new') {
            updated = [...banners, newBannerObj];
        } else {
            updated = banners.map(b => b.id === formId ? newBannerObj : b);
        }

        setBanners(updated);
        saveToFirebase(enabled, updated);
        setEditModal(null);
    };

    return (
        <div className="admin-subpage animate-fade-in central-schedule-manager" style={{ maxWidth: '840px', margin: '0 auto', padding: isMobile ? '16px' : '24px' }}>
            {/* Standard Explorer Header */}
            <header className="explorer-header focus-mode" style={{ marginBottom: '24px', borderBottom: '1px solid var(--mac-divider)', paddingBottom: '16px' }}>
                <div className="breadcrumb-nav">
                    <div className="breadcrumb-list" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="crumb-static" style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: 'var(--mac-text)' }}>
                            Tips & Banners
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button 
                        className="explorer-back-btn" 
                        onClick={() => {
                            const params = new URLSearchParams(searchParams);
                            params.set('mod', 'home');
                            setSearchParams(params);
                        }}
                    >
                        <RiArrowLeftLine /> Back
                    </button>
                </div>
            </header>

            {/* Master Switch & Add Action Card */}
            <div 
                className="settings-card"
                style={{
                    background: 'var(--mac-card-bg)',
                    border: '1px solid var(--mac-border)',
                    borderRadius: '20px',
                    padding: '16px 20px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        background: enabled ? 'rgba(0, 122, 255, 0.12)' : 'rgba(142, 142, 147, 0.12)',
                        color: enabled ? 'var(--mac-blue)' : 'var(--mac-text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        flexShrink: 0
                    }}>
                        <RiSparklingLine />
                    </div>
                    <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--mac-text)' }}>
                            Header Tips & Banners
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--mac-text-secondary)' }}>
                            {enabled ? 'Active inside home screen header' : 'Globally disabled for all users'}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                    <ToggleSwitch checked={enabled} onChange={handleToggleMaster} />
                    <button 
                        className="role-header-pill active"
                        onClick={openAddModal}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
                    >
                        <RiAddLine size={16} /> Add Banner
                    </button>
                </div>
            </div>

            {/* Status Alert if Master Disabled */}
            {!enabled && (
                <div style={{
                    padding: '12px 18px',
                    borderRadius: '14px',
                    background: 'rgba(255, 149, 0, 0.1)',
                    border: '1px solid rgba(255, 149, 0, 0.25)',
                    color: '#d97706',
                    fontSize: '13px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <RiInformationLine size={18} style={{ flexShrink: 0 }} />
                    <span>Header banners are currently <strong>disabled globally</strong>. Students will not see any tips.</span>
                </div>
            )}

            {/* Banners List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--mac-text-secondary)' }}>Loading banners...</div>
            ) : banners.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '50px 20px',
                    background: 'var(--mac-card-bg)',
                    borderRadius: '24px',
                    border: '1px dashed var(--mac-border)'
                }}>
                    <RiSparklingLine size={40} style={{ color: 'var(--mac-blue)', marginBottom: '12px' }} />
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', color: 'var(--mac-text)' }}>No Header Banners</h3>
                    <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--mac-text-secondary)' }}>
                        Add an update or tip to appear inside the top large header.
                    </p>
                    <button 
                        className="role-header-pill active"
                        onClick={openAddModal}
                        style={{ padding: '8px 18px', fontSize: '13px' }}
                    >
                        Create Banner
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {banners.map((banner) => {
                        const targetOpt = ROUTE_OPTIONS.find(r => r.value === banner.actionRoute);
                        return (
                            <div 
                                key={banner.id}
                                className="settings-card"
                                style={{
                                    background: 'var(--mac-card-bg)',
                                    borderRadius: '18px',
                                    padding: '14px 18px',
                                    border: `1px solid ${banner.enabled ? 'var(--mac-border)' : 'rgba(255, 69, 58, 0.25)'}`,
                                    opacity: banner.enabled ? 1 : 0.6,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        background: 'rgba(0, 114, 222, 0.12)',
                                        color: 'var(--mac-blue)',
                                        padding: '4px 10px',
                                        borderRadius: '100px',
                                        letterSpacing: '0.4px',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {banner.type || 'UPDATE'}
                                    </span>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--mac-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {banner.message}
                                        </div>
                                        {targetOpt && targetOpt.value && (
                                            <div style={{ fontSize: '12px', color: 'var(--mac-blue)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span>Opens: {targetOpt.label}</span>
                                                <RiArrowRightLine size={12} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    <button 
                                        className="nm-file-more-btn"
                                        title={banner.enabled ? "Disable" : "Enable"}
                                        onClick={() => handleToggleBannerEnabled(banner.id)}
                                        style={{ color: banner.enabled ? 'var(--mac-blue)' : 'var(--mac-text-secondary)' }}
                                    >
                                        {banner.enabled ? <RiEyeLine size={17} /> : <RiEyeOffLine size={17} />}
                                    </button>
                                    <button 
                                        className="nm-file-more-btn"
                                        title="Edit"
                                        onClick={() => openEditModal(banner)}
                                    >
                                        <RiEdit2Line size={17} />
                                    </button>
                                    <button 
                                        className="nm-file-more-btn"
                                        title="Delete"
                                        onClick={() => handleDeleteBanner(banner.id)}
                                        style={{ color: '#FF3B30' }}
                                    >
                                        <RiDeleteBinLine size={17} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add / Edit Modal using createPortal and global modal-overlay */}
            {editModal && createPortal(
                <div className="modal-overlay animate-fade-in" onClick={() => setEditModal(null)}>
                    <div 
                        className="settings-card animate-pop-in" 
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: '480px',
                            background: 'var(--mac-card-bg)',
                            border: '1px solid var(--mac-border)',
                            borderRadius: '24px',
                            padding: '24px',
                            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.4)',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--mac-text)' }}>
                                {editModal === 'new' ? 'New Banner' : 'Edit Banner'}
                            </h3>
                            <button 
                                className="nm-file-more-btn"
                                onClick={() => setEditModal(null)}
                                style={{ width: '32px', height: '32px' }}
                            >
                                <RiCloseLine size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveModal}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--mac-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                                        Type / Category
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <select 
                                            value={formType}
                                            onChange={e => setFormType(e.target.value)}
                                            style={{
                                                flex: 1,
                                                padding: '12px 14px',
                                                borderRadius: '12px',
                                                border: '1.5px solid var(--mac-border)',
                                                background: 'var(--mac-bg-secondary)',
                                                color: 'var(--mac-text)',
                                                fontSize: '14px',
                                                fontWeight: 500,
                                                outline: 'none',
                                                colorScheme: 'light dark'
                                            }}
                                        >
                                            {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            <option value="CUSTOM">Custom...</option>
                                        </select>

                                        {formType === 'CUSTOM' && (
                                            <input 
                                                type="text"
                                                required
                                                value={formCustomType}
                                                onChange={e => setFormCustomType(e.target.value)}
                                                placeholder="Custom Type"
                                                style={{
                                                    flex: 1,
                                                    padding: '12px 14px',
                                                    borderRadius: '12px',
                                                    border: '1.5px solid var(--mac-border)',
                                                    background: 'var(--mac-bg-secondary)',
                                                    color: 'var(--mac-text)',
                                                    fontSize: '14px',
                                                    fontWeight: 500,
                                                    outline: 'none',
                                                    colorScheme: 'light dark'
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--mac-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                                        Message Content *
                                    </label>
                                    <textarea 
                                        rows={3}
                                        required
                                        value={formMessage}
                                        onChange={e => setFormMessage(e.target.value)}
                                        placeholder="Type the tip or announcement to display..."
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px',
                                            borderRadius: '12px',
                                            border: '1.5px solid var(--mac-border)',
                                            background: 'var(--mac-bg-secondary)',
                                            color: 'var(--mac-text)',
                                            fontSize: '14px',
                                            fontWeight: 500,
                                            outline: 'none',
                                            resize: 'vertical',
                                            boxSizing: 'border-box',
                                            fontFamily: 'inherit',
                                            colorScheme: 'light dark'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--mac-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                                        Open Page on Click (Optional)
                                    </label>
                                    <select 
                                        value={formActionRoute}
                                        onChange={e => setFormActionRoute(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px',
                                            borderRadius: '12px',
                                            border: '1.5px solid var(--mac-border)',
                                            background: 'var(--mac-bg-secondary)',
                                            color: 'var(--mac-text)',
                                            fontSize: '14px',
                                            fontWeight: 500,
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                            colorScheme: 'light dark'
                                        }}
                                    >
                                        {ROUTE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>

                                <div 
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '10px', 
                                        padding: '12px 14px', 
                                        borderRadius: '12px', 
                                        background: 'var(--mac-bg-secondary)', 
                                        border: '1px solid var(--mac-border)',
                                        cursor: 'pointer'
                                    }} 
                                    onClick={() => setFormEnabled(!formEnabled)}
                                >
                                    <input 
                                        type="checkbox" 
                                        className="mac-checkbox"
                                        checked={formEnabled}
                                        onChange={e => { e.stopPropagation(); setFormEnabled(e.target.checked); }}
                                        onClick={e => e.stopPropagation()}
                                    />
                                    <span style={{ fontSize: '13px', color: 'var(--mac-text)', fontWeight: 500 }}>
                                        Active (visible to students in header)
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                                <button 
                                    type="button" 
                                    className="role-header-pill secondary"
                                    onClick={() => setEditModal(null)}
                                    style={{ padding: '10px 20px', fontSize: '14px' }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="role-header-pill active"
                                    style={{ padding: '10px 22px', fontSize: '14px' }}
                                >
                                    {editModal === 'new' ? 'Create Banner' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default BannerManager;
