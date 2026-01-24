import { RoomProvider, useRoom } from './context/RoomContext';
import LandingPage from './components/LandingPage';
import RoleSelector from './components/RoleSelector';
import RoomDashboard from './components/RoomDashboard';
import './index.css';

function AppContent() {
  const { roomPin, role } = useRoom();

  // Show landing page if no room
  if (!roomPin) {
    return <LandingPage />;
  }

  // Show role selector if in room but no role selected
  if (!role) {
    return <RoleSelector />;
  }

  // Show dashboard if both pin and role are set
  return <RoomDashboard />;
}

function App() {
  return (
    <RoomProvider>
      <div className="app">
        <AppContent />
      </div>
    </RoomProvider>
  );
}

export default App;
