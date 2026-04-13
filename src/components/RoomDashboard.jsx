import { useEffect, useState } from 'react';
import { useRoom } from '../context/RoomContext';
import FileUploader from './FileUploader';
import TextUploader from './TextUploader';
import FileList from './FileList';
import { StarButton } from '@/components/ui/star-button';

const DEFAULT_ROOMS = [
  {
    key: 'guest',
    label: 'guest',
    emoji: '🌐',
    noPassword: true,
    candidatePins: ['1234', 'guest']
  },
  {
    key: 'hassaan',
    label: 'hassaan',
    emoji: '👤',
    password: 'hassaan',
    candidatePins: ['2345', 'hassaan']
  },
  {
    key: 'zaid',
    label: 'zaid',
    emoji: '👤',
    password: 'zaid',
    candidatePins: ['3456', 'zaid']
  }
];

const normalizeValue = (value) => String(value || '').toLowerCase();

export default function RoomDashboard() {
  const {
    role,
    setRole,
    rooms,
    roomsLoading,
    roomPin,
    currentRoom,
    loading,
    loadRoomContent,
    joinRoom,
    createRoom,
    toasts
  } = useRoom();

  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingRoom, setPendingRoom] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPin, setNewRoomPin] = useState('');
  const [createRoomError, setCreateRoomError] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);

  const defaultRooms = DEFAULT_ROOMS.map((spec) => {
    const matchedRoom = rooms.find((room) => {
      const pin = normalizeValue(room.pin);
      const name = normalizeValue(room.name);
      return spec.candidatePins.includes(pin) || name === spec.key;
    });

    return {
      ...spec,
      pin: matchedRoom?.pin || spec.candidatePins[0],
      name: spec.label
    };
  });

  const customRooms = rooms.filter((room) => {
    const pin = normalizeValue(room.pin);
    const name = normalizeValue(room.name);

    return !DEFAULT_ROOMS.some(spec =>
      spec.key === name || spec.candidatePins.includes(pin)
    );
  });

  useEffect(() => {
    if (roomPin) {
      loadRoomContent();
    }
  }, [roomPin, loadRoomContent]);

  const handleCreateRoomSubmit = async (e) => {
    e.preventDefault();

    if (!newRoomName.trim()) {
      setCreateRoomError('Room name is required');
      return;
    }

    setCreatingRoom(true);
    setCreateRoomError('');

    const created = await createRoom({
      roomName: newRoomName.trim(),
      pin: newRoomPin.trim() || undefined
    });

    if (created) {
      closeCreateRoomModal();
    } else {
      setCreateRoomError('Could not create room. Try another name or PIN.');
    }

    setCreatingRoom(false);
  };

  const closeCreateRoomModal = () => {
    setShowCreateRoomModal(false);
    setNewRoomName('');
    setNewRoomPin('');
    setCreateRoomError('');
  };

  const closePasswordPrompt = () => {
    setShowPasswordPrompt(false);
    setPendingRoom(null);
    setPasswordInput('');
    setPasswordError('');
  };

  const handleRoomSwitch = (room) => {
    if (room.pin === roomPin) return;

    if (room.noPassword) {
      joinRoom(room.pin);
      return;
    }

    setPendingRoom(room);
    setShowPasswordPrompt(true);
    setPasswordInput('');
    setPasswordError('');
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    if (passwordInput === pendingRoom?.password) {
      joinRoom(pendingRoom.pin);
      closePasswordPrompt();
      return;
    }

    setPasswordError('Incorrect password');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <span className="header-logo">shareto.me</span>
          {currentRoom && <span className="folder-badge">📁 {currentRoom.name}</span>}
        </div>
        
        <div className="header-right">
          <div className={`role-badge ${role}`}>
            <span>{role === 'uploader' ? '🔼' : '👀'}</span>
            {role === 'uploader' ? 'Uploader' : 'Viewer'}
          </div>
          <StarButton
            type="button"
            className="btn-leave"
            backgroundColor="#334155"
            lightColor="#f8fafc"
            onClick={() => setRole(null)}
          >
            Switch Role
          </StarButton>
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
          {defaultRooms.map((room) => (
            <StarButton
              type="button"
              key={room.pin}
              className={`folder-tab room-tab ${roomPin === room.pin ? 'active' : ''}`}
              backgroundColor={roomPin === room.pin ? '#0f766e' : '#334155'}
              lightColor={roomPin === room.pin ? '#ccfbf1' : '#f8fafc'}
              onClick={() => handleRoomSwitch(room)}
            >
              <span className="folder-tab-emoji">{room.emoji}</span>
              <span className="folder-tab-label room-tab-name">{room.label}</span>
            </StarButton>
          ))}

          {customRooms.map((room) => (
            <StarButton
              type="button"
              key={room.pin}
              className={`folder-tab room-tab ${roomPin === room.pin ? 'active' : ''}`}
              backgroundColor={roomPin === room.pin ? '#0f766e' : '#334155'}
              lightColor={roomPin === room.pin ? '#ccfbf1' : '#f8fafc'}
              onClick={() => joinRoom(room.pin)}
            >
              <span className="folder-tab-emoji">🗂️</span>
              <span className="folder-tab-label room-tab-name">{room.name}</span>
            </StarButton>
          ))}

          <StarButton
            type="button"
            className="folder-tab create-room-tab"
            backgroundColor="#0e7490"
            lightColor="#ecfeff"
            onClick={() => setShowCreateRoomModal(true)}
          >
            <span className="folder-tab-emoji">➕</span>
            <span className="folder-tab-label">Create Room</span>
          </StarButton>
        </div>

        {roomsLoading && rooms.length === 0 && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>Loading rooms...</span>
          </div>
        )}

        {!roomPin && !roomsLoading ? (
          <div className="empty-state">
            <div className="empty-icon">🗂️</div>
            <h3>No room selected</h3>
            <p>Select a room or create one to start sharing files and text.</p>
          </div>
        ) : loading ? (
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

      {/* Create Room Modal */}
      {showCreateRoomModal && (
        <div className="modal-overlay" onClick={closeCreateRoomModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">➕ Create Room</h3>
            <p className="modal-subtitle">Create a new isolated room for files and text</p>
            <form onSubmit={handleCreateRoomSubmit}>
              <input
                type="text"
                className="input-field"
                placeholder="Room name"
                value={newRoomName}
                onChange={(e) => {
                  setNewRoomName(e.target.value);
                  setCreateRoomError('');
                }}
                autoFocus
              />

              <input
                type="text"
                className="input-field"
                placeholder="Custom PIN (optional)"
                value={newRoomPin}
                onChange={(e) => {
                  setNewRoomPin(e.target.value.trim());
                  setCreateRoomError('');
                }}
              />

              {createRoomError && <div className="error-message">{createRoomError}</div>}

              <div className="modal-actions">
                <StarButton
                  type="button"
                  className="w-full"
                  backgroundColor="#334155"
                  lightColor="#f8fafc"
                  onClick={closeCreateRoomModal}
                >
                  Cancel
                </StarButton>
                <StarButton
                  type="submit"
                  className="w-full"
                  backgroundColor="#7c3aed"
                  lightColor="#f5f3ff"
                  disabled={creatingRoom}
                >
                  {creatingRoom ? 'Creating...' : 'Create & Join'}
                </StarButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <div className="modal-overlay" onClick={closePasswordPrompt}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">🔒 Enter Password</h3>
            <p className="modal-subtitle">Password required for {pendingRoom?.label}</p>
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
                <StarButton
                  type="button"
                  className="w-full"
                  backgroundColor="#334155"
                  lightColor="#f8fafc"
                  onClick={closePasswordPrompt}
                >
                  Cancel
                </StarButton>
                <StarButton
                  type="submit"
                  className="w-full"
                  backgroundColor="#7c3aed"
                  lightColor="#f5f3ff"
                >
                  Unlock
                </StarButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
