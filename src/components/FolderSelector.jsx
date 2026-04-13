import { useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { StarButton } from '@/components/ui/star-button';

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
            <StarButton
              type="button"
              key={folder.name}
              className={`folder-button ${selectedFolder === folder.name ? 'selected' : ''}`}
              backgroundColor={selectedFolder === folder.name ? '#0f766e' : '#334155'}
              lightColor={selectedFolder === folder.name ? '#ccfbf1' : '#f8fafc'}
              onClick={() => handleFolderSelect(folder.name)}
            >
              <span className="folder-emoji">{folder.emoji}</span>
              <span className="folder-name">{folder.name}</span>
            </StarButton>
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
            <StarButton
              type="submit"
              className="w-full"
              backgroundColor="#7c3aed"
              lightColor="#f5f3ff"
            >
              🔓 Unlock {selectedFolder}
            </StarButton>
          </form>
        )}
      </div>
    </div>
  );
}
