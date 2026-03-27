import React, { useState, useEffect } from "react";
import { db } from "../../../firebase";
import { ref, onValue, get } from "firebase/database";
import {
    RiUser3Line,
    RiFolderLine,
    RiArrowRightSLine,
} from "react-icons/ri";
import { SubHeader } from "./SettingsShared";
import { DirectorySkeleton, AdminPageSkeleton } from "../../../components/ui/AdminSkeletons";


const DirectoryFolderItem = ({ name, onClick }) => (
    <button className="s2-dir-folder" onClick={onClick}>
        <div className="s2-dir-folder-icon">
            <RiFolderLine size={28} />
        </div>
        <span className="s2-dir-folder-name">{name}</span>
        <RiArrowRightSLine className="s2-dir-chevron" size={20} />
    </button>
);

const DirectoryUserCard = ({ user }) => {
    const photoUrl = user.photoURL;
    return (
        <div className="s2-dir-user">
            {photoUrl ? (
                <img
                    src={photoUrl}
                    alt={user.displayName || "User"}
                    className="s2-dir-avatar"
                />
            ) : (
                <div className="s2-dir-avatar-placeholder">
                    <RiUser3Line size={20} />
                </div>
            )}
            <div className="s2-dir-user-info">
                <div className="s2-dir-user-name">{user.displayName || "Unknown"}</div>
                <div className="s2-dir-user-reg">{user.registerNo || "No Register No"}</div>
            </div>
        </div>
    );
};

const UserDirectoryView = ({ onBack }) => {
    const [hierarchy, setHierarchy] = useState({});
    const [path, setPath] = useState([]); // [] = batches, [batch] = depts, [batch,dept] = sections, [b,d,s] = users
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [hierarchyLoading, setHierarchyLoading] = useState(true);

    // Load academic hierarchy once
    useEffect(() => {
        const hierarchyRef = ref(db, "academic_hierarchy");
        const unsub = onValue(hierarchyRef, (snapshot) => {
            try {
                const result = {};
                snapshot.forEach((batchSnap) => {
                    const batch = batchSnap.key;
                    const depts = {};
                    batchSnap.forEach((deptSnap) => {
                        const dept = deptSnap.key;
                        const sections = [];
                        deptSnap.forEach((secSnap) => {
                            sections.push(secSnap.val());
                        });
                        depts[dept] = sections;
                    });
                    result[batch] = depts;
                });
                setHierarchy(result);
            } catch (e) {
                console.error("Error parsing hierarchy", e);
            } finally {
                setHierarchyLoading(false);
            }
        });
        return () => unsub();
    }, []);

    // Fetch users when at section level (path.length === 3)
    useEffect(() => {
        if (path.length === 3) {
            setUsersLoading(true);
            const [batch, dept, section] = path;
            get(ref(db, "users")).then((snapshot) => {
                try {
                    const filtered = [];
                    snapshot.forEach((child) => {
                        const data = {};
                        child.forEach((field) => {
                            if (typeof field.val() === "string") {
                                data[field.key] = field.val();
                            }
                        });
                        if (data.batch === batch && data.department === dept && data.section === section) {
                            filtered.push(data);
                        }
                    });
                    filtered.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
                    setUsers(filtered);
                } catch (e) {
                    console.error("Error fetching users", e);
                    setUsers([]);
                } finally {
                    setUsersLoading(false);
                }
            }).catch(() => {
                setUsersLoading(false);
                setUsers([]);
            });
        } else {
            setUsers([]);
        }
    }, [path]);

    // System Back Button Support
    useEffect(() => {
        const handlePopState = (e) => {
            const state = e.state;
            if (state && state.dirPath) {
                setPath(state.dirPath);
            } else {
                setPath([]);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Navigation Helper
    const navigateTo = (newPath) => {
        if (window.innerWidth <= 768) {
            window.history.pushState({ settingsView: "directory", dirPath: newPath }, '');
        }
        setPath(newPath);
    };

    // Back handler: go up one level or exit
    const handleBack = () => {
        if (path.length > 0) {
            if (window.innerWidth <= 768) {
                window.history.back();
            } else {
                setPath(path.slice(0, -1));
            }
        } else {
            onBack();
        }
    };

    // Build title based on depth
    const getTitle = () => {
        if (path.length === 0) return "User Directory";
        if (path.length === 1) return `Batch ${path[0]}`;
        if (path.length === 2) return path[1];
        return `Section ${path[2]}`;
    };

    const level = path.length;

    return (
        <>
            <SubHeader title={getTitle()} onBack={handleBack} />

            {hierarchyLoading ? (
                <DirectorySkeleton />
            ) : level === 0 ? (

                <>
                    <div className="s2-section-label">Select Batch</div>
                    <div className="s2-dir-list" key={`list-0`}>
                        {Object.keys(hierarchy).sort().map((batch) => (
                            <DirectoryFolderItem
                                key={`batch-${batch}`}
                                name={`Batch ${batch}`}
                                onClick={() => navigateTo([...path, batch])}
                            />
                        ))}
                    </div>
                </>
            ) : level === 1 ? (
                <>
                    <div className="s2-section-label">Select Department</div>
                    <div className="s2-dir-list" key={`list-1`}>
                        {Object.keys(hierarchy[path[0]] || {}).sort().map((dept) => (
                            <DirectoryFolderItem
                                key={`dept-${dept}`}
                                name={dept}
                                onClick={() => navigateTo([...path, dept])}
                            />
                        ))}
                    </div>
                </>
            ) : level === 2 ? (
                <>
                    <div className="s2-section-label">Select Section</div>
                    <div className="s2-dir-list" key={`list-2`}>
                        {(hierarchy[path[0]]?.[path[1]] || []).sort().map((section) => (
                            <DirectoryFolderItem
                                key={`sec-${section}`}
                                name={`Section ${section}`}
                                onClick={() => navigateTo([...path, section])}
                            />
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <div className="s2-section-label">
                        {usersLoading ? "Loading..." : `${users.length} Student${users.length !== 1 ? "s" : ""}`}
                    </div>
                    {usersLoading ? (
                        <AdminPageSkeleton />
                    ) : users.length === 0 ? (

                        <div className="s2-dir-empty">
                            No users found in this section.
                        </div>
                    ) : (
                        <div className="s2-dir-list" key={`list-3`}>
                            {users.map((user, i) => (
                                <DirectoryUserCard key={`user-${user.registerNo || i}`} user={user} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </>
    );
};

export default UserDirectoryView;
