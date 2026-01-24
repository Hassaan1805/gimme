import { useRoom } from '../context/RoomContext';

export default function RoleSelector() {
  const { roomPin, setRole } = useRoom();

  const handleSelectRole = (selectedRole) => {
    setRole(selectedRole);
  };

  return (
    <div className="role-selector">
      <div className="bg-orb bg-orb-1"></div>
      <div className="bg-orb bg-orb-2"></div>
      
      <div className="role-content">
        <div className="room-pin-badge">
          <span>🔑</span>
          Room PIN: <strong>{roomPin}</strong>
        </div>
        
        <h2>Choose Your Role</h2>
        <p>Select how you want to participate in this room</p>
        
        <div className="role-cards">
          <div 
            className="role-card glass-card uploader"
            onClick={() => handleSelectRole('uploader')}
          >
            <div className="role-icon">🔼</div>
            <h3>Uploader</h3>
            <p>Upload files, share text, and manage your content</p>
          </div>
          
          <div 
            className="role-card glass-card viewer"
            onClick={() => handleSelectRole('viewer')}
          >
            <div className="role-icon">👀</div>
            <h3>Viewer</h3>
            <p>View shared files and download content</p>
          </div>
        </div>
      </div>
    </div>
  );
}
