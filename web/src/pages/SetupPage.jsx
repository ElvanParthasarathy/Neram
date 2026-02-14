import React, { useState, useEffect } from 'react';
import { AuthLayout, AuthHeader, AuthSelect, AuthButton } from '../components/auth/AuthComponents';
import { RiUserLine } from 'react-icons/ri';
import { db } from '../firebase';
import { ref, onValue, update } from 'firebase/database';
import { useNavigate } from 'react-router-dom';

const SetupPage = ({ user, onComplete }) => {
    const [hierarchy, setHierarchy] = useState({});
    const [batch, setBatch] = useState("");
    const [dept, setDept] = useState("");
    const [sec, setSec] = useState("");
    const [loading, setLoading] = useState(false);
    const [hierarchyLoading, setHierarchyLoading] = useState(true);

    const navigate = useNavigate();

    // Fetch Hierarchy
    useEffect(() => {
        const hierarchyRef = ref(db, 'academic_hierarchy');
        const unsub = onValue(hierarchyRef, (snap) => {
            if (snap.exists()) {
                setHierarchy(snap.val());
            }
            setHierarchyLoading(false);
        });
        return () => unsub();
    }, []);

    const handleSave = async () => {
        if (!batch || !dept || !sec) return;
        setLoading(true);
        try {
            await update(ref(db, `users/${user.uid}`), {
                batch: batch,
                department: dept,
                section: sec
            });
            if (onComplete) {
                onComplete();
            } else {
                navigate('/');
            }
        } catch (error) {
            alert("Error saving profile: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Derived Options
    const batches = Object.keys(hierarchy).filter(k => k !== 'initialized').sort().reverse();
    const departments = batch ? Object.keys(hierarchy[batch] || {}).filter(k => k !== 'initialized').sort() : [];
    const sections = (batch && dept) ? (hierarchy[batch][dept] || []).sort() : [];

    return (
        <AuthLayout>
            <div style={{ height: '48px' }} />

            {/* Animated Icon */}
            <div className="animate-enter" style={{
                width: '80px', height: '80px',
                background: 'rgba(0, 122, 255, 0.15)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 32px auto',
                animation: 'float 2s ease-in-out infinite alternate'
            }}>
                <RiUserLine size={40} color="#007AFF" />
            </div>

            <AuthHeader
                title="Profile Setup"
                subtitle="Select your academic details below"
            />

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '48px' }}>
                <AuthSelect
                    label="ACADEMIC BATCH"
                    placeholder="Select Year"
                    value={batch}
                    onChange={(e) => {
                        setBatch(e.target.value);
                        setDept("");
                        setSec("");
                    }}
                    options={batches}
                    loading={hierarchyLoading}
                />

                {batch && (
                    <AuthSelect
                        label="DEPARTMENT"
                        placeholder="Select Department"
                        value={dept}
                        onChange={(e) => {
                            setDept(e.target.value);
                            setSec("");
                        }}
                        options={departments}
                    />
                )}

                {dept && (
                    <AuthSelect
                        label="SECTION"
                        placeholder="Select Section"
                        value={sec}
                        onChange={(e) => setSec(e.target.value)}
                        options={sections}
                    />
                )}
            </div>

            <div style={{ flex: 1 }} />

            {(batch && dept && sec) && (
                <div style={{ width: '100%', marginTop: '40px', paddingBottom: '40px' }}>
                    <AuthButton
                        onClick={handleSave}
                        loading={loading}
                    >
                        Complete Setup
                    </AuthButton>
                </div>
            )}
        </AuthLayout>
    );
};

export default SetupPage;
