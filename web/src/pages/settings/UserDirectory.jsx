import React, { useState, useEffect } from 'react';
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";
import {
  RiSearchLine, RiUserLine, RiTeamLine, RiLayoutGridLine,
  RiArrowRightSLine, RiArrowLeftLine, RiGoogleFill, RiMailLine
} from 'react-icons/ri';

const UserDirectory = () => {
  // Data States
  const [users, setUsers] = useState({});
  const [hierarchy, setHierarchy] = useState({});
  const [loading, setLoading] = useState(true);

  // Navigation States
  const [viewLevel, setViewLevel] = useState('batches'); // batches, depts, secs, students
  const [currentPath, setCurrentPath] = useState({ batch: '', dept: '', sec: '' });
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Fetch Data (Users + Hierarchy)
  useEffect(() => {
    const hierarchyRef = ref(db, 'academic_hierarchy');
    const usersRef = ref(db, 'users');

    const unsubHierarchy = onValue(hierarchyRef, (snapshot) => {
      setHierarchy(snapshot.exists() ? snapshot.val() : {});
    });

    const unsubUsers = onValue(usersRef, (snapshot) => {
      setUsers(snapshot.exists() ? snapshot.val() : {});
      setLoading(false);
    });

    return () => {
      unsubHierarchy();
      unsubUsers();
    };
  }, []);

  // --- NAVIGATION LOGIC ---
  const handleDrillDown = (level, value) => {
    setCurrentPath(prev => ({ ...prev, [level]: value }));
    if (level === 'batch') setViewLevel('depts');
    if (level === 'dept') setViewLevel('secs');
    if (level === 'sec') setViewLevel('students');
  };

  const navigateBack = () => {
    if (viewLevel === 'students') setViewLevel('secs');
    else if (viewLevel === 'secs') setViewLevel('depts');
    else if (viewLevel === 'depts') setViewLevel('batches');
  };

  const resetToRoot = () => {
    setCurrentPath({ batch: '', dept: '', sec: '' });
    setViewLevel('batches');
    setSearchTerm("");
  };

  const getProviderIcon = (u) => {
    if (u.photoURL?.includes('googleusercontent') || u.email?.endsWith('@rmd.ac.in')) {
      return <RiGoogleFill className="provider-icon google" title="Google Account" />;
    }
    return <RiMailLine className="provider-icon email" title="Email Account" />;
  };

  if (loading) return <div className="settings-loader">Loading Directory...</div>;

  return (
    <div className="settings-section-content">

      {/* HEADER: Breadcrumbs & Back Nav */}
      <header className="directory-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="breadcrumb-nav" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          <span
            className={`crumb-btn ${viewLevel !== 'batches' ? 'active-link' : ''}`}
            onClick={resetToRoot}
            style={{ cursor: 'pointer', fontWeight: viewLevel === 'batches' ? 'bold' : 'normal', color: viewLevel === 'batches' ? 'var(--text-primary)' : 'inherit' }}
          >
            Directory
          </span>

          {currentPath.batch && (
            <>
              <RiArrowRightSLine />
              <span
                className="crumb-btn"
                onClick={() => setViewLevel('depts')}
                style={{ cursor: 'pointer', fontWeight: viewLevel === 'depts' ? 'bold' : 'normal', color: viewLevel === 'depts' ? 'var(--text-primary)' : 'inherit' }}
              >
                {currentPath.batch}
              </span>
            </>
          )}

          {currentPath.dept && (
            <>
              <RiArrowRightSLine />
              <span
                className="crumb-btn"
                onClick={() => setViewLevel('secs')}
                style={{ cursor: 'pointer', fontWeight: viewLevel === 'secs' ? 'bold' : 'normal', color: viewLevel === 'secs' ? 'var(--text-primary)' : 'inherit' }}
              >
                {currentPath.dept}
              </span>
            </>
          )}

          {currentPath.sec && (
            <>
              <RiArrowRightSLine />
              <span className="crumb-static" style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                Sec {currentPath.sec}
              </span>
            </>
          )}
        </div>

        {viewLevel !== 'batches' && (
          <button
            className="explorer-back-btn"
            onClick={navigateBack}
            style={{
              background: 'none', border: 'none', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '14px'
            }}
          >
            <RiArrowLeftLine /> Back
          </button>
        )}
      </header>

      {/* SEARCH BAR: Only visible in Student View */}
      {viewLevel === 'students' && (
        <div className="directory-search" style={{ marginBottom: '20px' }}>
          <RiSearchLine />
          <input
            type="text"
            placeholder={`Search students in ${currentPath.batch} - ${currentPath.dept} - ${currentPath.sec}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {/* --- VIEWS --- */}
      <div className="explorer-view animate-fade-in">

        {/* 1. BATCHES VIEW */}
        {viewLevel === 'batches' && (
          <div className="explorer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
            {Object.keys(hierarchy).sort().reverse().map(batch => (
              <div
                key={batch}
                className="explorer-card"
                onClick={() => handleDrillDown('batch', batch)}
                style={{
                  background: 'var(--bg-card)', padding: '20px', borderRadius: '12px',
                  cursor: 'pointer', border: '1px solid var(--border-color)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px'
                }}
              >
                <RiTeamLine style={{ fontSize: '24px', color: 'var(--accent-color)' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px' }}>Batch {batch}</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>View Departments</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. DEPARTMENTS VIEW */}
        {viewLevel === 'depts' && (
          <div className="explorer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
            {Object.keys(hierarchy[currentPath.batch] || {})
              .filter(k => k !== 'initialized')
              .map(dept => (
                <div
                  key={dept}
                  className="explorer-card"
                  onClick={() => handleDrillDown('dept', dept)}
                  style={{
                    background: 'var(--bg-card)', padding: '20px', borderRadius: '12px',
                    cursor: 'pointer', border: '1px solid var(--border-color)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px'
                  }}
                >
                  <RiLayoutGridLine style={{ fontSize: '24px', color: 'var(--accent-color)' }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>{dept}</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Select Section</p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* 3. SECTIONS VIEW */}
        {viewLevel === 'secs' && (
          <div className="explorer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px' }}>
            {hierarchy[currentPath.batch][currentPath.dept]?.map(sec => (
              <div
                key={sec}
                className="explorer-card"
                onClick={() => handleDrillDown('sec', sec)}
                style={{
                  background: 'var(--bg-card)', padding: '20px', borderRadius: '12px',
                  cursor: 'pointer', border: '1px solid var(--border-color)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px'
                }}
              >
                <div className="card-initial" style={{ fontSize: '20px', fontWeight: 'bold' }}>{sec}</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '14px' }}>Section {sec}</h3>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. STUDENTS LIST VIEW */}
        {viewLevel === 'students' && (
          <div className="public-user-grid">
            {Object.values(users)
              .filter(u => u.batch === currentPath.batch && u.department === currentPath.dept && u.section === currentPath.sec)
              .filter(u => u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || u.registerNo?.toLowerCase().includes(searchTerm.toLowerCase()))
              .sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""))
              .map((u, index) => (
                <div key={index} className="public-user-pill">
                  <div className="user-avatar-small">
                    {u.photoURL ? (
                      <img src={u.photoURL} alt="" />
                    ) : (
                      <RiUserLine />
                    )}
                  </div>
                  <div className="user-info-simple">
                    <span className="user-name-label">{u.displayName || "Unnamed User"}</span>
                    <span className="user-reg-label">{u.registerNo || "No Reg No"}</span>
                    <span className="user-batch-label">{u.batch} - {u.department} - {u.section}</span>
                  </div>
                </div>
              ))}

            {/* Empty State */}
            {Object.values(users)
              .filter(u => u.batch === currentPath.batch && u.department === currentPath.dept && u.section === currentPath.sec).length === 0 && (
                <div className="empty-state">No students found in this section.</div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDirectory;