import { useRoom } from '../context/RoomContext';

export default function RoleSelector() {
  const { setRole } = useRoom();

  const handleSelectRole = (selectedRole) => {
    setRole(selectedRole);
  };

  return (
    <div className="role-selector">
      <div className="role-content">
        <div className="logo">
          <h1>shareto.me</h1>
          <p>Choose your role to get started</p>
        </div>
        
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
