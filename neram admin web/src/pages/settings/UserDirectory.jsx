import React, { useState, useEffect } from 'react';
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";
import { RiSearchLine, RiUserLine } from 'react-icons/ri';

const UserDirectory = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const userList = Object.values(data).sort((a, b) => {
          const nameA = (a.displayName || "ZZZ").toLowerCase();
          const nameB = (b.displayName || "ZZZ").toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setUsers(userList);
      }
      setLoading(false);
    });
  }, []);

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.registerNo?.toLowerCase().includes(searchTerm.toLowerCase()) // Match the database key
  );

  if (loading) return <div className="settings-loader">Loading Directory...</div>;

  return (
    <div className="settings-section-content">
      <div className="directory-search">
        <RiSearchLine />
        <input 
          type="text" 
          placeholder="Search by name or register number..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="public-user-grid">
        {filteredUsers.map((u, index) => (
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
              {/* Corrected key from u.regNo to u.registerNo */}
              <span className="user-reg-label">{u.registerNo || "No Reg No"}</span>
              <span className="user-batch-label">{u.batch || "Student"}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="empty-state">No users found matching "{searchTerm}"</div>
      )}
    </div>
  );
};

export default UserDirectory;