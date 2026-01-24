import { useEffect } from 'react';
import { useRoom } from '../context/RoomContext';
import FileUploader from './FileUploader';
import TextUploader from './TextUploader';
import FileList from './FileList';

export default function RoomDashboard() {
  const { roomPin, role, loading, loadRoomContent, leaveRoom, toasts } = useRoom();

  useEffect(() => {
    loadRoomContent();
  }, [roomPin]);

  return (
    <div className="dashboard">
      <div className="bg-orb bg-orb-1"></div>
      <div className="bg-orb bg-orb-2"></div>
      
      <header className="dashboard-header">
        <div className="header-left">
          <span className="header-logo">gimme</span>
          <div className="room-pin-badge">
            <span>🔑</span>
            Room: <strong>{roomPin}</strong>
          </div>
        </div>
        
        <div className="header-right">
          <div className={`role-badge ${role}`}>
            <span>{role === 'uploader' ? '🔼' : '👀'}</span>
            {role === 'uploader' ? 'Uploader' : 'Viewer'}
          </div>
          <button className="btn btn-secondary btn-leave" onClick={leaveRoom}>
            Leave Room
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

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>Loading room content...</span>
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
    </div>
  );
}
