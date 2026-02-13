import React, { useState, useEffect } from 'react';
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
  RiEyeOffLine,
  RiKey2Line,
  RiLink,
  RiErrorWarningLine,
  RiMailLine,
  RiCheckboxCircleLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiLoader4Line
} from 'react-icons/ri';

const Security = () => {
  const [currentView, setCurrentView] = useState('hub'); // hub, password, create_password, linked_accounts, delete
  const user = auth.currentUser;

  const renderView = () => {
    switch (currentView) {
      case 'password':
        return <ChangePasswordFlow onBack={() => setCurrentView('hub')} />;
      case 'create_password':
        return <CreatePasswordFlow onBack={() => setCurrentView('hub')} />;
      case 'linked_accounts':
        return <LinkedAccountsView onBack={() => setCurrentView('hub')} />;
      case 'delete':
        return <DeleteAccountFlow onBack={() => setCurrentView('hub')} />;
      default:
        return <SecurityHub onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="security-settings-container">
      {renderView()}
    </div>
  );
};

// --- SUB-COMPONENTS ---

const SecurityHub = ({ onNavigate }) => {
  const user = auth.currentUser;
  const hasPasswordProvider = user?.providerData.some(p => p.providerId === 'password');

  return (
    <div className="settings-section-content">
      <div className="settings-header-card">
        <div className="header-info">
          <h2>Security</h2>
          <p>Manage password & account</p>
        </div>
      </div>

      <div className="settings-sub-label">ACCOUNT</div>
      <div className="settings-group-card no-padding">
        <button className="settings-list-item" onClick={() => onNavigate(hasPasswordProvider ? 'password' : 'create_password')}>
          <div className="item-icon-wrapper purple">
            <RiKey2Line />
          </div>
          <div className="item-content">
            <div className="item-title">{hasPasswordProvider ? 'Change Password' : 'Create Password'}</div>
            <div className="item-description">{hasPasswordProvider ? 'Update your login password' : 'Set a password for email login'}</div>
          </div>
          <RiArrowRightSLine className="chevron-right" />
        </button>

        <div className="item-divider-inset"></div>

        <button className="settings-list-item" onClick={() => onNavigate('linked_accounts')}>
          <div className="item-icon-wrapper blue">
            <RiLink />
          </div>
          <div className="item-content">
            <div className="item-title">Linked Accounts</div>
            <div className="item-description">Manage Google sign-in</div>
          </div>
          <RiArrowRightSLine className="chevron-right" />
        </button>
      </div>

      <div className="settings-sub-label danger">DANGER ZONE</div>
      <div className="settings-group-card no-padding">
        <button className="settings-list-item danger" onClick={() => onNavigate('delete')}>
          <div className="item-icon-wrapper red">
            <RiErrorWarningLine />
          </div>
          <div className="item-content">
            <div className="item-title">Delete Account</div>
            <div className="item-description">Permanently remove your account</div>
          </div>
          <RiArrowRightSLine className="chevron-right" />
        </button>
      </div>
    </div>
  );
};

const ChangePasswordFlow = ({ onBack }) => {
  const [step, setStep] = useState(1); // 1: Verify, 2: New Password, 3: Success
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const user = auth.currentUser;

  const handleVerify = async () => {
    if (!passwords.current) return setError("Please enter your current password");
    setIsProcessing(true);
    setError(null);
    try {
      const cred = EmailAuthProvider.credential(user.email, passwords.current);
      await reauthenticateWithCredential(user, cred);
      setStep(2);
    } catch (err) {
      setError("Incorrect password");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (passwords.next.length < 6) return setError("Password must be at least 6 characters");
    if (passwords.next !== passwords.confirm) return setError("Passwords do not match");

    setIsProcessing(true);
    setError(null);
    try {
      await updatePassword(user, passwords.next);
      setStep(3);
      setTimeout(onBack, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="settings-section-content">
      <div className="flow-header">
        <button className="btn-icon-circular" onClick={step === 1 ? onBack : () => setStep(1)}>
          <RiArrowLeftSLine />
        </button>
        <div className="header-info">
          <h2>Change Password</h2>
          <p>{step === 1 ? "Step 1: Verify your identity" : step === 2 ? "Step 2: Set new password" : "Password updated!"}</p>
        </div>
      </div>

      <div className="flow-progress">
        <div className={`progress-dot ${step >= 1 ? 'active' : ''}`}></div>
        <div className={`progress-dot ${step >= 2 ? 'active' : ''}`}></div>
        <div className={`progress-dot ${step >= 3 ? 'active' : ''}`}></div>
      </div>

      <div className="settings-group-card">
        {step === 1 && (
          <div className="flow-step">
            <div className="input-field">
              <label>Current Password</label>
              <div className="input-with-icon">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Enter current password"
                  value={passwords.current}
                  onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                />
                <button className="eye-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>
            {error && <div className="error-message">{error}</div>}
            <button className="btn-primary full-width" onClick={handleVerify} disabled={isProcessing}>
              {isProcessing ? <RiLoader4Line className="spin" /> : "Verify & Continue"}
            </button>
            <button className="btn-text" onClick={() => sendPasswordResetEmail(auth, user.email).then(() => alert("Reset email sent!"))}>
              Forgot Password?
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flow-step">
            <div className="input-field">
              <label>New Password</label>
              <div className="input-with-icon">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={passwords.next}
                  onChange={e => setPasswords({ ...passwords, next: e.target.value })}
                />
              </div>
            </div>
            <div className="input-field">
              <label>Confirm Password</label>
              <div className="input-with-icon">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Repeat new password"
                  value={passwords.confirm}
                  onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                />
                <button className="eye-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>
            <div className="validation-box">
              <div className={`validation-row ${passwords.next.length >= 6 ? 'valid' : ''}`}>
                <RiCheckboxCircleLine /> At least 6 characters
              </div>
              <div className={`validation-row ${passwords.next && passwords.next === passwords.confirm ? 'valid' : ''}`}>
                <RiCheckboxCircleLine /> Passwords match
              </div>
            </div>
            {error && <div className="error-message">{error}</div>}
            <button className="btn-primary full-width" onClick={handleUpdate} disabled={isProcessing || passwords.next.length < 6 || passwords.next !== passwords.confirm}>
              {isProcessing ? <RiLoader4Line className="spin" /> : "Update Password"}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="flow-success">
            <RiCheckboxCircleLine className="success-icon" />
            <h3>Password Updated!</h3>
            <p>Returning to security hub...</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CreatePasswordFlow = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [passwords, setPasswords] = useState({ next: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const user = auth.currentUser;

  const handleCreate = async () => {
    if (passwords.next.length < 6) return setError("Password must be at least 6 characters");
    if (passwords.next !== passwords.confirm) return setError("Passwords do not match");

    setIsProcessing(true);
    setError(null);
    try {
      await updatePassword(user, passwords.next);
      setStep(2);
      setTimeout(onBack, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="settings-section-content">
      <div className="flow-header">
        <button className="btn-icon-circular" onClick={onBack}>
          <RiArrowLeftSLine />
        </button>
        <div className="header-info">
          <h2>Create Password</h2>
          <p>{step === 1 ? "Set a password for email login" : "Password created!"}</p>
        </div>
      </div>

      <div className="settings-group-card">
        {step === 1 && (
          <div className="flow-step">
            <div className="info-box accent">
              <RiInformationLine />
              <p>You signed in with Google. Create a password to also sign in with email.</p>
            </div>
            <div className="input-field">
              <label>New Password</label>
              <div className="input-with-icon">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={passwords.next}
                  onChange={e => setPasswords({ ...passwords, next: e.target.value })}
                />
                <button className="eye-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>
            <div className="input-field">
              <label>Confirm Password</label>
              <div className="input-with-icon">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Repeat password"
                  value={passwords.confirm}
                  onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                />
                <button className="eye-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>
            {error && <div className="error-message">{error}</div>}
            <button className="btn-primary full-width" onClick={handleCreate} disabled={isProcessing || passwords.next.length < 6 || passwords.next !== passwords.confirm}>
              {isProcessing ? <RiLoader4Line className="spin" /> : "Create Password"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flow-success">
            <RiCheckboxCircleLine className="success-icon" />
            <h3>Password Created!</h3>
            <p>You can now sign in with email too.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const LinkedAccountsView = ({ onBack }) => {
  const user = auth.currentUser;
  const googleProvider = user?.providerData.find(p => p.providerId === 'google.com');
  const isGoogleLinked = !!googleProvider;
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLink = async () => {
    setIsProcessing(true);
    try {
      if (isGoogleLinked) {
        await unlink(user, 'google.com');
      } else {
        await linkWithPopup(user, new GoogleAuthProvider());
      }
      window.location.reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="settings-section-content">
      <div className="flow-header">
        <button className="btn-icon-circular" onClick={onBack}>
          <RiArrowLeftSLine />
        </button>
        <div className="header-info">
          <h2>Linked Accounts</h2>
          <p>Manage sign-in methods</p>
        </div>
      </div>

      <div className="settings-sub-label">SIGN-IN METHODS</div>
      <div className="settings-group-card no-padding">
        <div className="account-card">
          <div className="account-info">
            <div className="account-icon-google">
              <RiGoogleFill />
            </div>
            <div className="item-content">
              <div className="item-title">Google</div>
              <div className="item-description">{isGoogleLinked ? googleProvider.email : 'Not connected'}</div>
            </div>
            <div className={`status-pill ${isGoogleLinked ? 'active' : ''}`}>
              {isGoogleLinked ? 'Connected' : 'Not linked'}
            </div>
          </div>
          <div className="item-divider-inset"></div>
          <button className={`account-action-btn ${isGoogleLinked ? 'danger' : ''}`} onClick={handleLink} disabled={isProcessing}>
            {isProcessing ? <RiLoader4Line className="spin" /> : isGoogleLinked ? 'Unlink Google Account' : 'Link Google Account'}
          </button>
        </div>
      </div>

      <div className="settings-group-card info-flat">
        <RiInformationLine />
        <p>Linking multiple sign-in methods gives you more ways to access your account securely.</p>
      </div>
    </div>
  );
};

const DeleteAccountFlow = ({ onBack }) => {
  const [step, setStep] = useState(1); // 1: Warning, 2: Final Confirm, 3: Success
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const user = auth.currentUser;

  const handleDelete = async () => {
    if (!password) return setError("Please enter your password to confirm");
    setIsProcessing(true);
    setError(null);
    try {
      const cred = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, cred);
      await remove(ref(db, `users/${user.uid}`));
      await deleteUser(user);
      window.location.href = "/login";
    } catch (err) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="settings-section-content">
      <div className="flow-header">
        <button className="btn-icon-circular" onClick={onBack}>
          <RiArrowLeftSLine />
        </button>
        <div className="header-info">
          <h2>Delete Account</h2>
          <p>{step === 1 ? "Step 1: Understand the consequences" : "Step 2: Confirm your decision"}</p>
        </div>
      </div>

      <div className="settings-group-card">
        {step === 1 && (
          <div className="flow-step">
            <div className="danger-box">
              <div className="danger-header">
                <RiErrorWarningLine />
                <h3>This action is permanent</h3>
              </div>
              <ul className="danger-list">
                <li>All your data will be permanently deleted</li>
                <li>Your schedule and preferences will be lost</li>
                <li>You will not be able to recover your account</li>
                <li>You can create a new account anytime</li>
              </ul>
            </div>
            <button className="btn-danger full-width" onClick={() => setStep(2)}>
              I understand, continue
            </button>
            <button className="btn-text" onClick={onBack}>Cancel</button>
          </div>
        )}

        {step === 2 && (
          <div className="flow-step">
            <p className="confirm-text">Please enter your current password to permanently delete your account.</p>
            <div className="input-field">
              <div className="input-with-icon">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Enter current password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button className="eye-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>
            {error && <div className="error-message">{error}</div>}
            <button className="btn-danger full-width" onClick={handleDelete} disabled={isProcessing}>
              {isProcessing ? <RiLoader4Line className="spin" /> : "Delete My Account Forever"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Security;