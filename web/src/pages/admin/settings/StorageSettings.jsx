import React, { useState, useEffect } from "react";
import { db } from "../../../firebase";
import { ref, get, update, query, orderByKey, startAt, endAt } from "firebase/database";
import { formatDateDDMMYYYY, handleAutoSlash, parseDMYToISO } from "../../../utils/timeUtils";
import HybridDateInput from '../../../components/ui/HybridDateInput';
import {
    RiDeleteBinLine,
    RiCalendarLine,
    RiFilter3Line
} from "react-icons/ri";
import { SubHeader, SettingsGroup, SettingsDivider, SettingsItem } from "../../student/settings/SettingsShared";

const StorageSettings = ({ userProfile, onBack }) => {
    const [isMobile, setIsMobile] = useState(window.matchMedia("(max-width: 768px)").matches);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showRange, setShowRange] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
    const [statusMsg, setStatusMsg] = useState("");

    // Admin context (from dashboard or user profile)
    const adminContext = JSON.parse(localStorage.getItem('admin_dashboard_context') || '{}');
    const [targetBatch, setTargetBatch] = useState(userProfile?.batch || adminContext.batch || "");
    const [targetDept, setTargetDept] = useState(userProfile?.department || adminContext.dept || "");
    const [targetSec, setTargetSec] = useState(userProfile?.section || adminContext.sec || "");

    const role = userProfile?.role || 'student';
    const isRep = role === 'rep';

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.matchMedia("(max-width: 768px)").matches);
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const ctx = JSON.parse(localStorage.getItem('admin_dashboard_context') || '{}');
        if (userProfile?.batch || ctx.batch) setTargetBatch(userProfile?.batch || ctx.batch || "");
        if (userProfile?.department || ctx.dept) setTargetDept(userProfile?.department || ctx.dept || "");
        if (userProfile?.section || ctx.sec) setTargetSec(userProfile?.section || ctx.sec || "");
    }, [userProfile]);

    const cleanupOldUpdates = async () => {
        if (!targetBatch || !targetDept || !targetSec) {
            setStatus("error");
            setStatusMsg("Target scope missing Batch / Department / Section.");
            setShowConfirm(false);
            return;
        }
        setStatus("loading");
        setStatusMsg("Cleaning up updates older than 30 days...");
        setShowConfirm(false);

        try {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 30);
            const cutoffStr = cutoff.toISOString().slice(0, 10); // YYYY-MM-DD

            const dbRef = ref(db, `updates/${targetBatch}/${targetDept}/${targetSec}/daily_update`);
            const q = query(dbRef, orderByKey(), endAt(cutoffStr));
            const snapshot = await get(q);

            if (snapshot.exists()) {
                const updates = {};
                snapshot.forEach((child) => {
                    if (child.key < cutoffStr) {
                        updates[child.key] = null;
                    }
                });
                if (Object.keys(updates).length > 0) {
                    await update(ref(db, `updates/${targetBatch}/${targetDept}/${targetSec}/daily_update`), updates);
                    setStatus("success");
                    setStatusMsg(`Deleted ${Object.keys(updates).length} old update(s) from ${targetBatch} ${targetDept}-${targetSec}.`);
                } else {
                    setStatus("success");
                    setStatusMsg(`No updates older than 30 days found for ${targetBatch} ${targetDept}-${targetSec}.`);
                }
            } else {
                setStatus("success");
                setStatusMsg(`No old updates found for ${targetBatch} ${targetDept}-${targetSec}.`);
            }
        } catch (e) {
            console.error("Cleanup failed:", e);
            setStatus("error");
            setStatusMsg("Cleanup failed. Please check permissions and try again.");
        }
    };

    const cleanupRange = async () => {
        if (!targetBatch || !targetDept || !targetSec) {
            setStatus("error");
            setStatusMsg("Target scope missing Batch / Department / Section.");
            setShowRange(false);
            return;
        }
        if (!startDate || !endDate) {
            setStatus("error");
            setStatusMsg("Please select both start and end dates.");
            return;
        }
        if (startDate > endDate) {
            setStatus("error");
            setStatusMsg("Start date must be before end date.");
            return;
        }

        setStatus("loading");
        setStatusMsg("Deleting updates in date range...");
        setShowRange(false);

        try {
            const dbRef = ref(db, `updates/${targetBatch}/${targetDept}/${targetSec}/daily_update`);
            const q = query(dbRef, orderByKey(), startAt(startDate), endAt(endDate));
            const snapshot = await get(q);

            if (snapshot.exists()) {
                const updates = {};
                snapshot.forEach((child) => {
                    if (child.key >= startDate && child.key <= endDate) {
                        updates[child.key] = null;
                    }
                });
                if (Object.keys(updates).length > 0) {
                    await update(ref(db, `updates/${targetBatch}/${targetDept}/${targetSec}/daily_update`), updates);
                    setStatus("success");
                    setStatusMsg(`Deleted ${Object.keys(updates).length} update(s) from ${startDate} to ${endDate} (${targetBatch} ${targetDept}-${targetSec}).`);
                } else {
                    setStatus("success");
                    setStatusMsg(`No updates found in that date range for ${targetBatch} ${targetDept}-${targetSec}.`);
                }
            } else {
                setStatus("success");
                setStatusMsg(`No updates found in that range for ${targetBatch} ${targetDept}-${targetSec}.`);
            }
        } catch (e) {
            console.error("Range cleanup failed:", e);
            setStatus("error");
            setStatusMsg("Range cleanup failed. Please try again.");
        }
    };

    return (
        <>
            <SubHeader title="Storage & Data" onBack={onBack} />

            {/* Scope info indicator */}
            <div style={{
                background: 'var(--mac-card-bg, rgba(255,255,255,0.05))',
                border: '1px solid var(--mac-card-border, rgba(255,255,255,0.1))',
                borderRadius: '16px',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <RiFilter3Line size={18} style={{ color: '#2196F3' }} />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                        Target Scope: <strong>{targetBatch || "—"} / {targetDept || "—"} - {targetSec || "—"}</strong>
                    </span>
                </div>
                {!isRep && (
                    <span style={{ fontSize: '12px', color: 'var(--mac-text-secondary, rgba(255,255,255,0.5))' }}>
                        Admin Controlled
                    </span>
                )}
            </div>

            <div className="s2-section-label">Cleanup Options</div>

            <SettingsGroup>
                <SettingsItem
                    icon={<RiDeleteBinLine />}
                    iconColor="blue"
                    title="Clear Old Updates"
                    desc="Remove news & notices older than 30 days"
                    onClick={() => setShowConfirm(true)}
                />
                <SettingsDivider />
                <SettingsItem
                    icon={<RiCalendarLine />}
                    iconColor="orange"
                    title="Custom Range Deletion"
                    desc="Select a date range to wipe updates"
                    onClick={() => setShowRange(true)}
                />
            </SettingsGroup>

            <div className="s2-spacer-md" />

            {status && (
                <p className="s2-info-text" style={{
                    color: status === "error" ? "#F44336" : status === "success" ? "#4CAF50" : "var(--mac-text-secondary)"
                }}>
                    {statusMsg}
                </p>
            )}

            <p className="s2-info-text">
                Administrative database optimization removes stale records and media from Firebase Realtime Database to ensure peak app speed.
            </p>

            {/* Clear Old Updates Dialog */}
            {showConfirm && (
                <div className="modal-overlay animate-fade-in" onClick={() => setShowConfirm(false)}>
                    <div className="modal-content animate-pop-in" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <RiDeleteBinLine className="modal-icon-danger" style={{ color: '#2196F3', background: 'rgba(33, 150, 243, 0.1)' }} />
                            <h3>Clear Old Updates</h3>
                        </div>
                        <p className="modal-message">
                            This will delete all live updates and notices older than 30 days for <strong>{targetBatch} {targetDept}-{targetSec}</strong>. This action cannot be undone.
                        </p>
                        <div className="modal-footer">
                            <button className="btn-modal-cancel" onClick={() => setShowConfirm(false)}>
                                Cancel
                            </button>
                            <button className="btn-modal-confirm" style={{ color: '#2196F3', background: 'rgba(33, 150, 243, 0.15)' }} onClick={cleanupOldUpdates}>
                                Clear Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Range Dialog */}
            {showRange && (
                <div className="modal-overlay animate-fade-in" onClick={() => setShowRange(false)}>
                    <div className="modal-content animate-pop-in" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <RiCalendarLine className="modal-icon-danger" style={{ color: '#FF9500', background: 'rgba(255, 149, 0, 0.1)' }} />
                            <h3>Custom Range Deletion</h3>
                        </div>
                        <div className="modal-message">
                            Select a date range for <strong>{targetBatch} {targetDept}-{targetSec}</strong>. All updates within this range will be permanently deleted from Firebase.
                            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                                <HybridDateInput
                                    value={startDate}
                                    onChange={(val) => setStartDate(val)}
                                    placeholder="Start Date"
                                />
                                <HybridDateInput
                                    value={endDate}
                                    onChange={(val) => setEndDate(val)}
                                    placeholder="End Date"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-modal-cancel" onClick={() => setShowRange(false)}>
                                Cancel
                            </button>
                            <button className="btn-modal-confirm" onClick={cleanupRange}>
                                Delete Range
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default StorageSettings;
