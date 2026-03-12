import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiNotification3Line, RiCheckDoubleLine, RiDeleteBin7Line, RiArrowLeftLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationProvider';
import '../styles/settings2.css'; // Reusing settings header styles for consistency

const NotificationsPage = () => {
    const navigate = useNavigate();
    const { history, clearHistory } = useNotification();

    return (
        <div className="s2-page-view" style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--mac-bg-primary)',
            color: 'var(--mac-text)'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--mac-glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--mac-surface)',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--mac-blue)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                    >
                        <RiArrowLeftLine size={24} />
                    </button>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Notifications</h2>
                </div>
                {history.length > 0 && (
                    <button
                        onClick={clearHistory}
                        style={{
                            background: 'var(--mac-glass-border)',
                            border: 'none',
                            color: 'var(--mac-text)',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <RiCheckDoubleLine size={16} />
                        Clear All
                    </button>
                )}
            </div>

            {/* Feed */}
            <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
                <AnimatePresence>
                    {history.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '60vh',
                                color: 'var(--mac-text-secondary)',
                                textAlign: 'center'
                            }}
                        >
                            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--mac-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                <RiNotification3Line size={40} opacity={0.5} />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px', color: 'var(--mac-text)' }}>You're all caught up!</h3>
                            <p style={{ fontSize: '14px', margin: 0 }}>No new notifications right now.</p>
                        </motion.div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Sort history by timestamp descending */}
                            {[...history].sort((a, b) => b.timestamp - a.timestamp).map((notif) => (
                                <motion.div
                                    key={notif.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    style={{
                                        background: 'var(--mac-surface)',
                                        borderRadius: '16px',
                                        padding: '16px',
                                        display: 'flex',
                                        gap: '16px',
                                        border: '1px solid var(--mac-glass-border)'
                                    }}
                                >
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: 'var(--mac-blue)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        {notif.icon ? notif.icon : <img src="/neramv.svg" width={28} height={28} alt="logo" />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--mac-text)' }}>
                                                {notif.title}
                                            </h4>
                                            <span style={{ fontSize: '12px', color: 'var(--mac-text-secondary)' }}>
                                                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--mac-text-secondary)', lineHeight: 1.5 }}>
                                            {notif.body}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default NotificationsPage;
