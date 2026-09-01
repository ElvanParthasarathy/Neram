import React, { useState, useEffect } from 'react';
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
    RiArrowRightLine
} from 'react-icons/ri';
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
        <div className="admin-module-container" style={{ padding: isMobile ? '16px' : '32px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0', color: 'var(--mac-text)' }}>
                        Header Tips & Banners
                    </h1>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--mac-subtext)' }}>
                        Display simple updates & tips inside the top expanded header with direct page mapping.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* Master Switch */}
                    <div 
                        onClick={handleToggleMaster}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px', 
                            background: enabled ? 'rgba(0, 114, 222, 0.12)' : 'var(--mac-card-bg)', 
                            border: `1px solid ${enabled ? 'var(--mac-blue)' : 'var(--mac-border)'}`,
                            padding: '8px 16px', 
                            borderRadius: '50px', 
                            cursor: 'pointer',
                            userSelect: 'none'
                        }}
                    >
                        <span style={{ fontSize: '13px', fontWeight: '600', color: enabled ? 'var(--mac-blue)' : 'var(--mac-subtext)' }}>
                            {enabled ? 'Banner: ON' : 'Banner: OFF'}
                        </span>
                        <div style={{
                            width: '36px',
                            height: '20px',
                            background: enabled ? 'var(--mac-blue)' : '#888',
                            borderRadius: '10px',
                            position: 'relative'
                        }}>
                            <div style={{
                                width: '16px',
                                height: '16px',
                                background: '#fff',
                                borderRadius: '50%',
                                position: 'absolute',
                                top: '2px',
                                left: enabled ? '18px' : '2px',
                                transition: 'left 0.2s'
                            }} />
                        </div>
                    </div>

                    {/* Add Banner Button */}
                    <button 
                        className="admin-primary-btn" 
                        onClick={openAddModal}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'var(--mac-blue)',
                            color: '#fff',
                            border: 'none',
                            padding: '10px 18px',
                            borderRadius: '50px',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}
                    >
                        <RiAddLine size={18} /> Add Banner
                    </button>
                </div>
            </div>

            {/* Status Alert if Master Disabled */}
            {!enabled && (
                <div style={{
                    padding: '12px 18px',
                    borderRadius: '14px',
                    background: 'rgba(255, 149, 0, 0.12)',
                    border: '1px solid rgba(255, 149, 0, 0.3)',
                    color: '#d97706',
                    fontSize: '13.5px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <RiInformationLine size={18} />
                    <span>Header banners are currently <strong>disabled globally</strong>. Students will not see any tips.</span>
                </div>
            )}

            {/* Banners List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--mac-subtext)' }}>Loading banners...</div>
            ) : banners.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '50px 20px',
                    background: 'var(--mac-card-bg)',
                    borderRadius: '20px',
                    border: '1px dashed var(--mac-border)'
                }}>
                    <RiSparklingLine size={40} style={{ color: 'var(--mac-blue)', marginBottom: '12px' }} />
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '17px' }}>No Header Banners</h3>
                    <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', color: 'var(--mac-subtext)' }}>
                        Add an update or tip to appear inside the top large header.
                    </p>
                    <button 
                        className="admin-primary-btn" 
                        onClick={openAddModal}
                        style={{
                            background: 'var(--mac-blue)',
                            color: '#fff',
                            border: 'none',
                            padding: '9px 18px',
                            borderRadius: '50px',
                            fontWeight: '600',
                            fontSize: '13.5px',
                            cursor: 'pointer'
                        }}
                    >
                        Create Banner
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {banners.map((banner) => {
                        const targetOpt = ROUTE_OPTIONS.find(r => r.value === banner.actionRoute);
                        return (
                            <div 
                                key={banner.id}
                                style={{
                                    background: 'var(--mac-card-bg)',
                                    borderRadius: '16px',
                                    padding: '16px 20px',
                                    border: `1px solid ${banner.enabled ? 'var(--mac-border)' : 'rgba(255, 69, 58, 0.2)'}`,
                                    opacity: banner.enabled ? 1 : 0.6,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        background: 'rgba(0, 114, 222, 0.12)',
                                        color: 'var(--mac-blue)',
                                        padding: '4px 10px',
                                        borderRadius: '50px',
                                        letterSpacing: '0.4px',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {banner.type || 'UPDATE'}
                                    </span>
                                    <div>
                                        <div style={{ fontSize: '14.5px', fontWeight: '500', color: 'var(--mac-text)' }}>
                                            {banner.message}
                                        </div>
                                        {targetOpt && targetOpt.value && (
                                            <div style={{ fontSize: '12.5px', color: 'var(--mac-blue)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span>Opens: {targetOpt.label}</span>
                                                <RiArrowRightLine size={13} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button 
                                        title={banner.enabled ? "Disable" : "Enable"}
                                        onClick={() => handleToggleBannerEnabled(banner.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: banner.enabled ? 'var(--mac-blue)' : '#888', padding: '6px' }}
                                    >
                                        {banner.enabled ? <RiEyeLine size={18} /> : <RiEyeOffLine size={18} />}
                                    </button>
                                    <button 
                                        title="Edit"
                                        onClick={() => openEditModal(banner)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mac-text)', padding: '6px' }}
                                    >
                                        <RiEdit2Line size={18} />
                                    </button>
                                    <button 
                                        title="Delete"
                                        onClick={() => handleDeleteBanner(banner.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff453a', padding: '6px' }}
                                    >
                                        <RiDeleteBinLine size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pure Single Language Add / Edit Modal with Settings Mapper */}
            {editModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9999,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'var(--mac-card-bg)',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '460px',
                        padding: '24px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        border: '1px solid var(--mac-border)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                                {editModal === 'new' ? 'New Banner' : 'Edit Banner'}
                            </h2>
                            <button 
                                onClick={() => setEditModal(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mac-subtext)' }}
                            >
                                <RiCloseLine size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveModal}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {/* 1. Type Selector */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--mac-text)' }}>
                                        Type
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <select 
                                            value={formType}
                                            onChange={e => setFormType(e.target.value)}
                                            style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--mac-border)', background: 'var(--mac-bg)', color: 'var(--mac-text)', fontSize: '13.5px' }}
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
                                                style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--mac-border)', background: 'var(--mac-bg)', color: 'var(--mac-text)', fontSize: '13.5px' }}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* 2. Single Message Field */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--mac-text)' }}>
                                        Message *
                                    </label>
                                    <textarea 
                                        rows={3}
                                        required
                                        value={formMessage}
                                        onChange={e => setFormMessage(e.target.value)}
                                        placeholder="Type the message to display..."
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--mac-border)', background: 'var(--mac-bg)', color: 'var(--mac-text)', fontSize: '13.5px', resize: 'vertical' }}
                                    />
                                </div>

                                {/* 3. Destination Page / Settings Mapper */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--mac-text)' }}>
                                        Open Page on Click (Optional)
                                    </label>
                                    <select 
                                        value={formActionRoute}
                                        onChange={e => setFormActionRoute(e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--mac-border)', background: 'var(--mac-bg)', color: 'var(--mac-text)', fontSize: '13.5px' }}
                                    >
                                        {ROUTE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>

                                {/* Active Checkbox */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                    <input 
                                        type="checkbox"
                                        id="formEnabledCheck"
                                        checked={formEnabled}
                                        onChange={e => setFormEnabled(e.target.checked)}
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                    />
                                    <label htmlFor="formEnabledCheck" style={{ fontSize: '13.5px', fontWeight: '500', cursor: 'pointer' }}>
                                        Active
                                    </label>
                                </div>
                            </div>

                            {/* Modal Buttons */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button 
                                    type="button"
                                    onClick={() => setEditModal(null)}
                                    style={{
                                        background: 'var(--mac-card-bg)',
                                        border: '1px solid var(--mac-border)',
                                        color: 'var(--mac-text)',
                                        padding: '9px 18px',
                                        borderRadius: '50px',
                                        fontWeight: '600',
                                        fontSize: '13.5px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    style={{
                                        background: 'var(--mac-blue)',
                                        border: 'none',
                                        color: '#fff',
                                        padding: '9px 20px',
                                        borderRadius: '50px',
                                        fontWeight: '600',
                                        fontSize: '13.5px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BannerManager;
