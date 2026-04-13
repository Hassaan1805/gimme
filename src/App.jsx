import { useEffect, useState } from 'react';
import { RoomProvider, useRoom } from './context/RoomContext';
import RoleSelector from './components/RoleSelector';
import RoomDashboard from './components/RoomDashboard';
import { SparklesCore } from '@/components/ui/sparkles';
import CamouflageMode from './components/CamouflageMode';
import './index.css';

const CAMOUFLAGE_SHORTCUT_KEY = 'x';

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
  const [isCamouflageMode, setIsCamouflageMode] = useState(false);

  useEffect(() => {
    const handleShortcut = (event) => {
      const isCamouflageShortcut =
        event.ctrlKey &&
        event.shiftKey &&
        String(event.key || '').toLowerCase() === CAMOUFLAGE_SHORTCUT_KEY;

      if (!isCamouflageShortcut) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setIsCamouflageMode((prev) => !prev);
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (isCamouflageMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCamouflageMode]);

  return (
    <RoomProvider>
      <div className="relative min-h-screen w-full bg-black">
        <div
          aria-hidden={isCamouflageMode}
          className={isCamouflageMode ? 'pointer-events-none select-none opacity-0' : 'opacity-100'}
        >
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
        {isCamouflageMode && <CamouflageMode />}
      </div>
    </RoomProvider>
  );
}

export default App;
