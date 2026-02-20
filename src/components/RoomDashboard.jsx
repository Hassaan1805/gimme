import { useEffect, useState } from 'react';
import { useRoom } from '../context/RoomContext';
import FileUploader from './FileUploader';
import TextUploader from './TextUploader';
import FileList from './FileList';
import FolderSelector from './FolderSelector';

const FOLDERS = [
  { name: 'guest', emoji: '🌐', label: 'Guest', noPassword: true },
  { name: 'hassaan', emoji: '👤', label: 'Hassaan', password: 'hassaan' },
  { name: 'zaid', emoji: '👤', label: 'Zaid', password: 'zaid' }
];

export default function RoomDashboard() {
  const { role, setRole, folder, loading, loadRoomContent, setFolder, toasts } = useRoom();
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingFolder, setPendingFolder] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    // Auto-select guest folder if none selected
    if (!folder) {
      setFolder('guest');
    }
  }, [folder, setFolder]);

  useEffect(() => {
    if (folder) {
      loadRoomContent();
    }
  }, [folder]);

  const handleFolderSwitch = (folderName) => {
    const folderConfig = FOLDERS.find(f => f.name === folderName);
    
    // If same folder, do nothing
    if (folderName === folder) return;
    
    // If no password required, switch immediately
    if (folderConfig.noPassword) {
      setFolder(folderName);
      return;
    }
    
    // Show password prompt
    setPendingFolder(folderConfig);
    setShowPasswordPrompt(true);
    setPasswordInput('');
    setPasswordError('');
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (passwordInput === pendingFolder.password) {
      setFolder(pendingFolder.name);
      setShowPasswordPrompt(false);
      setPendingFolder(null);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
    }
  };

  const closePasswordPrompt = () => {
    setShowPasswordPrompt(false);
    setPendingFolder(null);
    setPasswordInput('');
    setPasswordError('');
  };

  return (
    <div className="dashboard">
      {/* Gradient orbs */}
      <div className="bg-orb bg-orb-1"></div>
      <div className="bg-orb bg-orb-2"></div>
      <div className="bg-orb bg-orb-3"></div>
      <div className="bg-orb bg-orb-4"></div>

      {/* Twinkling stars */}
      <div className="bg-stars" aria-hidden="true">
        {Array.from({ length: 55 }).map((_, i) => (
          <div key={i} className="bg-star" style={{ '--s': i }} />
        ))}
      </div>
      
      <header className="dashboard-header">
        <div className="header-left">
          <span className="header-logo">shareto.me</span>
          <span className="folder-badge">📁 {folder}</span>
        </div>
        
        <div className="header-right">
          <div className={`role-badge ${role}`}>
            <span>{role === 'uploader' ? '🔼' : '👀'}</span>
            {role === 'uploader' ? 'Uploader' : 'Viewer'}
          </div>
          <button className="btn btn-secondary btn-leave" onClick={() => setRole(null)}>
            Switch Role
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {role === 'uploader' && (
          <section className="upload-panel">
            <FileUploader />
            <TextUploader />
          </section>
        )}

        {/* Folder Tabs */}
        <div className="folder-tabs">
          {FOLDERS.map((f) => (
            <button
              key={f.name}
              className={`folder-tab ${folder === f.name ? 'active' : ''}`}
              onClick={() => handleFolderSwitch(f.name)}
            >
              <span className="folder-tab-emoji">{f.emoji}</span>
              <span className="folder-tab-label">{f.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>Loading content...</span>
          </div>
        ) : (
          <FileList />
        )}
      </main>

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>

      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <div className="modal-overlay" onClick={closePasswordPrompt}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">🔒 Enter Password</h3>
            <p className="modal-subtitle">Password required for {pendingFolder?.label}</p>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                className="input-field"
                placeholder="Enter password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError('');
                }}
                autoFocus
              />
              {passwordError && <div className="error-message">{passwordError}</div>}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closePasswordPrompt}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
