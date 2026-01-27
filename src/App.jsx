import { RoomProvider, useRoom } from './context/RoomContext';
import RoleSelector from './components/RoleSelector';
import RoomDashboard from './components/RoomDashboard';
import './index.css';

function AppContent() {
  const { role } = useRoom();

  // Show role selector if no role selected
  if (!role) {
    return <RoleSelector />;
  }

  // Show dashboard when role is selected
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
