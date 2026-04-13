import { useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { StarButton } from '@/components/ui/star-button';

export default function LandingPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const { checkRoom, createRoom, joinRoom } = useRoom();

  const handlePinChange = (e) => {
    // Only allow numbers
    const value = e.target.value.replace(/\D/g, '');
    setPin(value.slice(0, 6)); // Max 6 digits
    setError('');
    setShowCreate(false);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      setError('Please enter a valid PIN (4-6 digits)');
      return;
    }

    setLoading(true);
    setError('');
    
    const exists = await checkRoom(pin);
    
    if (exists) {
      joinRoom(pin);
    } else {
      setShowCreate(true);
    }
    
    setLoading(false);
  };

  const handleCreate = async () => {
    setLoading(true);
    const success = await createRoom(pin);
    if (success) {
      joinRoom(pin);
    } else {
      setError('Failed to create room');
    }
    setLoading(false);
  };

  return (
    <div className="landing-page">
      <div className="bg-orb bg-orb-1"></div>
      <div className="bg-orb bg-orb-2"></div>
      
      <div className="landing-content">
        <div className="logo">
          <h1>gimme</h1>
          <p>Anonymous file sharing, zero friction</p>
        </div>

        <form className="pin-form glass-card" onSubmit={handleJoin}>
          <div className="pin-input-wrapper">
            <input
              type="text"
              className="pin-input"
              placeholder="Enter PIN"
              value={pin}
              onChange={handlePinChange}
              maxLength={6}
              autoFocus
            />
          </div>
          
          {error && <p className="error-message">{error}</p>}
          
          <StarButton
            type="submit"
            className="w-full"
            backgroundColor="#7c3aed"
            lightColor="#f5f3ff"
            disabled={loading || pin.length < 4}
          >
            {loading ? 'Checking...' : '🚀 Join Room'}
          </StarButton>

          {showCreate && (
            <div className="create-room-prompt">
              <p>Room <strong>{pin}</strong> doesn't exist yet.</p>
              <StarButton
                type="button"
                className="w-full"
                backgroundColor="#334155"
                lightColor="#f8fafc"
                onClick={handleCreate}
                disabled={loading}
              >
                {loading ? 'Creating...' : '✨ Create New Room'}
              </StarButton>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
