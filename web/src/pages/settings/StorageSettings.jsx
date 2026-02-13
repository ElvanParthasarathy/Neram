import React, { useState } from "react";
import { db } from "../../firebase";
import { ref, get, update, query, orderByKey, startAt, endAt } from "firebase/database";
import {
    RiDeleteBinLine,
    RiCalendarLine,
} from "react-icons/ri";
import { SubHeader, SettingsGroup, SettingsDivider, SettingsItem } from "./SettingsShared";

const StorageSettings = ({ userProfile, onBack }) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [showRange, setShowRange] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
    const [statusMsg, setStatusMsg] = useState("");

    const batch = userProfile?.batch || "";
    const dept = userProfile?.department || "";
    const section = userProfile?.section || "";

    const cleanupOldUpdates = async () => {
        if (!batch || !dept || !section) {
            setStatus("error");
            setStatusMsg("Profile missing batch/department/section.");
            setShowConfirm(false);
            return;
        }
        setStatus("loading");
        setStatusMsg("Cleaning up...");
        setShowConfirm(false);

        try {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 30);
            const cutoffStr = cutoff.toISOString().slice(0, 10); // YYYY-MM-DD

            const dbRef = ref(db, `updates/${batch}/${dept}/${section}/daily_update`);
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
                    await update(ref(db, `updates/${batch}/${dept}/${section}/daily_update`), updates);
                    setStatus("success");
                    setStatusMsg(`Deleted ${Object.keys(updates).length} old update(s).`);
                } else {
                    setStatus("success");
                    setStatusMsg("No old updates to delete.");
                }
            } else {
                setStatus("success");
                setStatusMsg("No old updates found.");
            }
        } catch (e) {
            console.error("Cleanup failed:", e);
            setStatus("error");
            setStatusMsg("Cleanup failed. Please try again.");
        }
    };

    const cleanupRange = async () => {
        if (!batch || !dept || !section) {
            setStatus("error");
            setStatusMsg("Profile missing batch/department/section.");
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
        setStatusMsg("Deleting updates in range...");
        setShowRange(false);

        try {
            const dbRef = ref(db, `updates/${batch}/${dept}/${section}/daily_update`);
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
                    await update(ref(db, `updates/${batch}/${dept}/${section}/daily_update`), updates);
                    setStatus("success");
                    setStatusMsg(`Deleted ${Object.keys(updates).length} update(s) from ${startDate} to ${endDate}.`);
                } else {
                    setStatus("success");
                    setStatusMsg("No updates found in that range.");
                }
            } else {
                setStatus("success");
                setStatusMsg("No updates found in that range.");
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
                Optimization helps keep the app responsive and saves local
                storage by removing old media and text records.
            </p>

            {/* Clear Old Updates Dialog */}
            {showConfirm && (
                <div className="s2-dialog-overlay" onClick={() => setShowConfirm(false)}>
                    <div className="s2-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="s2-dialog-title">Clear Old Updates</div>
                        <div className="s2-dialog-text">
                            This will delete all live updates and notices older
                            than 30 days. This action cannot be undone.
                        </div>
                        <div className="s2-dialog-actions">
                            <button className="s2-dialog-btn cancel" onClick={() => setShowConfirm(false)}>
                                Cancel
                            </button>
                            <button className="s2-dialog-btn confirm" style={{ background: "#2196F3" }} onClick={cleanupOldUpdates}>
                                Clear Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Range Dialog */}
            {showRange && (
                <div className="s2-dialog-overlay" onClick={() => setShowRange(false)}>
                    <div className="s2-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="s2-dialog-title">Custom Range Deletion</div>
                        <div className="s2-dialog-text">
                            Select a date range. All updates within this range will be permanently deleted.
                        </div>
                        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{
                                    flex: 1, padding: "10px 12px", borderRadius: 12,
                                    border: "1px solid var(--mac-divider)",
                                    background: "var(--mac-bg)", color: "var(--mac-text)",
                                    fontFamily: "inherit", fontSize: 14
                                }}
                            />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{
                                    flex: 1, padding: "10px 12px", borderRadius: 12,
                                    border: "1px solid var(--mac-divider)",
                                    background: "var(--mac-bg)", color: "var(--mac-text)",
                                    fontFamily: "inherit", fontSize: 14
                                }}
                            />
                        </div>
                        <div className="s2-dialog-actions">
                            <button className="s2-dialog-btn cancel" onClick={() => setShowRange(false)}>
                                Cancel
                            </button>
                            <button className="s2-dialog-btn confirm" onClick={cleanupRange}>
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
