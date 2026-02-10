import React, { useState } from 'react';
import { auth, db } from "../../firebase";
import { ref, remove } from "firebase/database";
import { 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider, 
  unlink, 
  linkWithPopup, 
  GoogleAuthProvider, 
  deleteUser, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { 
  RiGoogleFill, 
  RiDeleteBin6Line, 
  RiInformationLine,
  RiEyeLine, 
  RiEyeOffLine 
} from 'react-icons/ri';

const Security = () => {
  const user = auth.currentUser;
  
  const [passwords, setPasswords] = useState({ current: '', next: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const isGoogleLinked = user?.providerData.some(p => p.providerId === 'google.com');

  const handleForgotPassword = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert(`A password reset link has been sent to: ${user.email}`);
    } catch (err) { alert("Error: " + err.message); }
  };

  const handlePasswordUpdate = async () => {
    if (!passwords.current || !passwords.next) return alert("Please fill both fields.");
    setIsProcessing(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, passwords.current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, passwords.next);
      alert("Password Updated Successfully!");
      setPasswords({ current: '', next: '' });
    } catch (err) { alert("Error: " + err.message); }
    finally { setIsProcessing(false); }
  };

  const handleAccountDeletion = async () => {
    if (!passwords.current) return alert("Enter password to confirm.");
    if (!window.confirm("This will permanently delete ALL your data. Proceed?")) return;

    setIsProcessing(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, passwords.current);
      await reauthenticateWithCredential(user, cred);
      await remove(ref(db, `users/${user.uid}`));
      await deleteUser(user);
      window.location.href = "/login";
    } catch (err) { alert("Deletion failed: " + err.message); }
    finally { setIsProcessing(false); }
  };

  return (
    <div className="settings-section-content">
      {/* 1. PASSWORD MANAGEMENT */}
      <section className="security-module">
        <h3>Change Password</h3>
        
        <div className="password-stack">
          <div className="input-field">
            <label>Current Password</label>
            <div className="input-with-icon">
              <input 
                type={showCurrent ? "text" : "password"} 
                placeholder="••••••••" 
                value={passwords.current}
                onChange={e => setPasswords({...passwords, current: e.target.value})} 
              />
              <button className="eye-toggle" onClick={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? <RiEyeOffLine /> : <RiEyeLine />}
              </button>
            </div>
          </div>

          <div className="input-field">
            <label>New Password</label>
            <div className="input-with-icon">
              <input 
                type={showNext ? "text" : "password"} 
                placeholder="••••••••" 
                value={passwords.next}
                onChange={e => setPasswords({...passwords, next: e.target.value})} 
              />
              <button className="eye-toggle" onClick={() => setShowNext(!showNext)}>
                {showNext ? <RiEyeOffLine /> : <RiEyeLine />}
              </button>
            </div>
          </div>

          {/* Action Row: Update Button next to Forgot Password */}
          <div className="password-actions-row">
            <button className="btn-primary" onClick={handlePasswordUpdate} disabled={isProcessing}>
              {isProcessing ? "Updating..." : "Update Password"}
            </button>
            
            <button className="text-link-btn" onClick={handleForgotPassword}>
              Forgot Password?
            </button>
          </div>
        </div>
        
        <div className="info-box">
          <RiInformationLine />
          <p>Passwords must be at least 6 characters with a mix of letters and numbers.</p>
        </div>
      </section>

      {/* 2. SOCIAL LOGINS */}
      <section className="security-module">
        <h3>Social Authentication</h3>
        <div className="social-auth-row">
          <div className="status-label">
            <RiGoogleFill className={isGoogleLinked ? "icon-active" : "icon-inactive"} />
            <span>Google Status: <strong>{isGoogleLinked ? "Linked" : "Not Linked"}</strong></span>
          </div>
          
          {/* Horizontal Action Button */}
          <button 
            className={isGoogleLinked ? "btn-outline-danger" : "btn-outline-primary"} 
            onClick={async () => {
              try {
                if (isGoogleLinked) await unlink(user, 'google.com');
                else await linkWithPopup(user, new GoogleAuthProvider());
                window.location.reload();
              } catch (err) { alert(err.message); }
            }}
          >
            {isGoogleLinked ? "Unlink Account" : "Link Google"}
          </button>
        </div>
      </section>

            {/* 3. DANGER ZONE */}
      <section className="danger-zone">
        <h3>Delete Account</h3>
        {!showDelete ? (
          /* Added horizontal alignment class */
          <div className="danger-action-row"> 
            <span>Permanently delete account?</span>
            <button className="btn-danger" onClick={() => setShowDelete(true)}>
              <RiDeleteBin6Line /> Delete Account
            </button>
          </div>
        ) : (
          <div className="delete-confirm-box">
            <p className="warning-text">Enter current password to confirm deletion:</p>
            <div className="input-with-icon">
              <input 
                type={showCurrent ? "text" : "password"} 
                placeholder="Confirm Password"
                value={passwords.current}
                onChange={e => setPasswords({...passwords, current: e.target.value})} 
              />
              <button className="eye-toggle" onClick={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? <RiEyeOffLine /> : <RiEyeLine />}
              </button>
            </div>
            <div className="action-btns">
              <button className="btn-final-delete" onClick={handleAccountDeletion} disabled={isProcessing}>
                {isProcessing ? "Deleting..." : "Confirm Deletion"}
              </button>
              <button className="btn-cancel" onClick={() => setShowDelete(false)}>Cancel</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Security;