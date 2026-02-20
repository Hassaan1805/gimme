import { useState } from 'react';
import { useRoom } from '../context/RoomContext';

const FOLDERS = [
  { name: 'guest', password: '', emoji: '🌐', noPassword: true },
  { name: 'hassaan', password: 'hassaan', emoji: '👤' },
  { name: 'zaid', password: 'zaid', emoji: '👤' }
];

export default function FolderSelector() {
  const [selectedFolder, setSelectedFolder] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setFolder } = useRoom();

  const handleFolderSelect = (folderName) => {
    setSelectedFolder(folderName);
    setPassword('');
    setError('');
    
    // Auto-submit for guest folder
    const folder = FOLDERS.find(f => f.name === folderName);
    if (folder?.noPassword) {
      setFolder(folderName);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const folder = FOLDERS.find(f => f.name === selectedFolder);
    
    if (!folder) {
      setError('Please select a folder');
      return;
    }

    // Guest folder doesn't require password
    if (folder.noPassword) {
      setFolder(selectedFolder);
      return;
    }

    if (password !== folder.password) {
      setError('Incorrect password');
      return;
    }

    setFolder(selectedFolder);
  };

  return (
    <div className="folder-selector">
      <div className="folder-selector-card glass-card">
        <h2 className="folder-title">🗂️ Select Your Folder</h2>
        <p className="folder-subtitle">Guest is open to all • Private folders require passwords</p>

        <div className="folder-grid">
          {FOLDERS.map((folder) => (
            <button
              key={folder.name}
              className={`folder-button ${selectedFolder === folder.name ? 'selected' : ''}`}
              onClick={() => handleFolderSelect(folder.name)}
            >
              <span className="folder-emoji">{folder.emoji}</span>
              <span className="folder-name">{folder.name}</span>
            </button>
          ))}
        </div>

        {selectedFolder && !FOLDERS.find(f => f.name === selectedFolder)?.noPassword && (
          <form onSubmit={handleSubmit} className="folder-auth-form">
            <div className="input-group">
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="input-field"
                autoFocus
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="btn btn-primary btn-full">
              🔓 Unlock {selectedFolder}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
