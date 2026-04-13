import { RoomProvider, useRoom } from './context/RoomContext';
import RoleSelector from './components/RoleSelector';
import RoomDashboard from './components/RoomDashboard';
import { SparklesCore } from '@/components/ui/sparkles';
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
      <div className="relative min-h-screen w-full bg-black">
        <div className="pointer-events-none fixed inset-0 z-0">
          <SparklesCore
            id="gimme-app-sparkles"
            background="transparent"
            minSize={0.6}
            maxSize={1.4}
            particleDensity={100}
            className="h-full w-full"
            particleColor="#FFFFFF"
            speed={1}
          />
        </div>
        <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.12),transparent_55%)]" />
        <div className="app relative z-10">
          <AppContent />
        </div>
      </div>
    </RoomProvider>
  );
}

export default App;
