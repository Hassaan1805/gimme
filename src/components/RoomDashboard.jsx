import { useEffect } from 'react';
import { useRoom } from '../context/RoomContext';
import FileUploader from './FileUploader';
import TextUploader from './TextUploader';
import FileList from './FileList';

export default function RoomDashboard() {
  const { role, loading, loadRoomContent, leaveRoom, toasts } = useRoom();

  useEffect(() => {
    loadRoomContent();
  }, []);

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
        </div>
        
        <div className="header-right">
          <div className={`role-badge ${role}`}>
            <span>{role === 'uploader' ? '🔼' : '👀'}</span>
            {role === 'uploader' ? 'Uploader' : 'Viewer'}
          </div>
          <button className="btn btn-secondary btn-leave" onClick={leaveRoom}>
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
    </div>
  );
}
