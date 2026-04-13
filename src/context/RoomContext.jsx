import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';

const RoomContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const PAGE_SIZE = 20;
const ROOM_CACHE_KEY_PREFIX = 'gimme-room-cache-v2';
const SYSTEM_ROOM_ORDER = ['guest', 'hassaan', 'zaid'];
const SYSTEM_ROOM_NAME_BY_PIN = {
  guest: 'guest',
  hassaan: 'hassaan',
  zaid: 'zaid',
  '1234': 'guest',
  '2345': 'hassaan',
  '3456': 'zaid'
};
const DEFAULT_ROOM_SEEDS = [
  { name: 'Guest', pin: '1234' },
  { name: 'Hassaan', pin: '2345' },
  { name: 'Zaid', pin: '3456' }
];

const getSystemRoomName = (pin) => {
  return SYSTEM_ROOM_NAME_BY_PIN[String(pin || '').toLowerCase()] || null;
};

const sortRooms = (rooms) => {
  const getPriority = (room) => {
    const key = String(room.name || '').toLowerCase();
    const index = SYSTEM_ROOM_ORDER.indexOf(key);
    return index === -1 ? Number.POSITIVE_INFINITY : index;
  };

  return [...rooms].sort((a, b) => {
    const aPriority = getPriority(a);
    const bPriority = getPriority(b);

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return aTime - bTime;
  });
};

const normalizeRoom = (room) => {
  const pin = String(room?.pin || '');
  const name = room?.name || room?.room_name || getSystemRoomName(pin) || pin;
  const createdAt = room?.createdAt || room?.created_at || null;

  return { pin, name, createdAt };
};

const getRoomCacheKey = (pin) => {
  return `${ROOM_CACHE_KEY_PREFIX}:${pin}`;
};

const readCachedRoomData = (pin) => {
  if (typeof window === 'undefined' || !pin) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getRoomCacheKey(pin));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.files) || !Array.isArray(parsed.texts)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const writeCachedRoomData = (pin, payload) => {
  if (typeof window === 'undefined' || !pin) {
    return;
  }

  try {
    window.localStorage.setItem(
      getRoomCacheKey(pin),
      JSON.stringify({
        ...payload,
        cachedAt: Date.now()
      })
    );
  } catch {
    // Ignore localStorage write issues (quota, privacy mode, etc.).
  }
};

const invalidateCachedRoomData = (pin) => {
  if (typeof window === 'undefined' || !pin) {
    return;
  }

  try {
    window.localStorage.removeItem(getRoomCacheKey(pin));
  } catch {
    // Ignore localStorage removal issues.
  }
};

export function RoomProvider({ children }) {
  const [role, setRole] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomPin, setRoomPin] = useState(null);
  const [files, setFiles] = useState([]);
  const [texts, setTexts] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  // Add toast notification (defined first so it can be used in effects)
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const joinRoom = useCallback((pin) => {
    if (!pin) return;
    setRoomPin(String(pin));
  }, []);

  const loadRooms = useCallback(async (showErrorToast = true) => {
    setRoomsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/rooms`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load rooms');
      }

      const nextRooms = sortRooms((data.rooms || []).map(normalizeRoom));
      setRooms(nextRooms);
      setRoomPin(prevPin => {
        if (prevPin && nextRooms.some(room => room.pin === prevPin)) {
          return prevPin;
        }
        return nextRooms[0]?.pin || null;
      });

      return nextRooms;
    } catch (error) {
      console.error('Error loading rooms:', error);
      if (showErrorToast) {
        addToast('Failed to load rooms', 'error');
      }
      return [];
    } finally {
      setRoomsLoading(false);
    }
  }, [addToast]);

  const createRoom = useCallback(async (input = {}) => {
    const roomName = typeof input === 'string' ? '' : input?.roomName;
    const pin = typeof input === 'string' ? input : input?.pin;
    const payload = {};

    if (roomName?.trim()) {
      payload.roomName = roomName.trim();
    }

    if (pin?.trim()) {
      payload.pin = pin.trim();
    }

    try {
      const res = await fetch(`${API_URL}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to create room');
      }

      const createdRoom = normalizeRoom(data.room || {});
      setRooms(prev => {
        const exists = prev.some(room => room.pin === createdRoom.pin);
        const next = exists
          ? prev.map(room => room.pin === createdRoom.pin ? createdRoom : room)
          : [...prev, createdRoom];
        return sortRooms(next);
      });

      setRoomPin(createdRoom.pin);
      addToast(`Room "${createdRoom.name}" created`, 'success');
      return createdRoom;
    } catch (error) {
      console.error('Error creating room:', error);
      addToast(error.message || 'Failed to create room', 'error');
      return null;
    }
  }, [addToast]);

  const checkRoom = useCallback(async (pin) => {
    if (!pin) return false;

    try {
      const res = await fetch(`${API_URL}/api/rooms/${pin}`);
      const data = await res.json();
      return Boolean(data?.exists);
    } catch {
      return false;
    }
  }, []);

  // Seed default quick-access rooms and then load list.
  useEffect(() => {
    let mounted = true;

    async function seedAndLoadRooms() {
      try {
        await Promise.all(
          DEFAULT_ROOM_SEEDS.map(seed =>
            fetch(`${API_URL}/api/rooms`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pin: seed.pin, roomName: seed.name })
            }).catch(() => null)
          )
        );
      } finally {
        if (mounted) {
          await loadRooms(false);
        }
      }
    }

    seedAndLoadRooms();

    return () => {
      mounted = false;
    };
  }, [loadRooms]);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(API_URL);
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  // Join/leave selected room on socket
  useEffect(() => {
    if (!socket || !roomPin) {
      return;
    }

    socket.emit('join-room', roomPin);
    return () => socket.emit('leave-room', roomPin);
  }, [socket, roomPin]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket || !roomPin) return;

    socket.on('file-added', (file) => {
      invalidateCachedRoomData(roomPin);
      const nextFile = {
        id: file.id,
        originalName: file.originalName,
        size: file.size
      };
      setFiles(prev => [nextFile, ...prev]);
      setTotalCount(prev => prev + 1);
      addToast('New file uploaded!', 'success');
    });

    socket.on('file-deleted', (fileId) => {
      invalidateCachedRoomData(roomPin);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      setTotalCount(prev => Math.max(0, prev - 1));
    });

    socket.on('text-added', (text) => {
      invalidateCachedRoomData(roomPin);
      setTexts(prev => [text, ...prev]);
      setTotalCount(prev => prev + 1);
      addToast('New text added!', 'success');
    });

    socket.on('text-deleted', (textId) => {
      invalidateCachedRoomData(roomPin);
      setTexts(prev => prev.filter(t => t.id !== textId));
      setTotalCount(prev => Math.max(0, prev - 1));
    });

    return () => {
      socket.off('file-added');
      socket.off('file-deleted');
      socket.off('text-added');
      socket.off('text-deleted');
    };
  }, [socket, roomPin, addToast]);

  // Keep hasMore in sync with current pagination progress.
  useEffect(() => {
    setHasMore((files.length + texts.length) < totalCount);
  }, [files.length, texts.length, totalCount]);

  // Load selected room content.
  const loadRoomContent = useCallback(async () => {
    if (!roomPin) return;

    const cachedData = readCachedRoomData(roomPin);
    const hasCachedData = Boolean(cachedData);

    if (cachedData) {
      const cachedFiles = cachedData.files || [];
      const cachedTexts = cachedData.texts || [];
      const cachedTotalCount = typeof cachedData.totalCount === 'number'
        ? cachedData.totalCount
        : (cachedFiles.length + cachedTexts.length);

      setFiles(cachedFiles);
      setTexts(cachedTexts);
      setTotalCount(cachedTotalCount);
      setLoading(false);
    } else {
      setLoading(true);
      setFiles([]);
      setTexts([]);
      setTotalCount(0);
    }

    setLoadingMore(false);

    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: '0'
      });

      const res = await fetch(`${API_URL}/api/rooms/${roomPin}/contents?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load room content');
      }

      const nextFiles = data.files || [];
      const nextTexts = data.texts || [];
      const nextTotalCount = typeof data.totalCount === 'number'
        ? data.totalCount
        : (nextFiles.length + nextTexts.length);

      setFiles(nextFiles);
      setTexts(nextTexts);
      setTotalCount(nextTotalCount);

      writeCachedRoomData(roomPin, {
        files: nextFiles,
        texts: nextTexts,
        totalCount: nextTotalCount
      });
    } catch (error) {
      console.error('Error loading room content:', error);
      if (!hasCachedData) {
        addToast('Failed to load room content', 'error');
      }
    } finally {
      if (!hasCachedData) {
        setLoading(false);
      }
    }
  }, [roomPin, addToast]);

  const loadMoreContent = useCallback(async () => {
    if (!roomPin || loading || loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);

    try {
      const offset = files.length + texts.length;
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset)
      });

      const res = await fetch(`${API_URL}/api/rooms/${roomPin}/contents?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load more room content');
      }

      const nextFiles = data.files || [];
      const nextTexts = data.texts || [];
      const mergedFiles = [...files, ...nextFiles];
      const mergedTexts = [...texts, ...nextTexts];
      const mergedTotalCount = typeof data.totalCount === 'number'
        ? data.totalCount
        : totalCount;

      setFiles(mergedFiles);
      setTexts(mergedTexts);
      setTotalCount(mergedTotalCount);

      writeCachedRoomData(roomPin, {
        files: mergedFiles,
        texts: mergedTexts,
        totalCount: mergedTotalCount
      });
    } catch (error) {
      console.error('Error loading more room content:', error);
      addToast('Failed to load more content', 'error');
    } finally {
      setLoadingMore(false);
    }
  }, [roomPin, loading, loadingMore, hasMore, files, texts, totalCount, addToast]);

  // Upload files
  const uploadFiles = async (fileList) => {
    if (role !== 'uploader' || !roomPin) return false;

    try {
      // Upload files one by one since backend expects single file
      const uploadPromises = Array.from(fileList).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'general');

        const res = await fetch(`${API_URL}/api/rooms/${roomPin}/files`, {
          method: 'POST',
          body: formData
        });
        return res.json();
      });

      const results = await Promise.all(uploadPromises);
      const uploadedFiles = results.filter(r => r.id); // Filter successful uploads

      if (uploadedFiles.length > 0) {
        invalidateCachedRoomData(roomPin);
        addToast(`${uploadedFiles.length} file(s) uploaded successfully!`, 'success');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error uploading files:', error);
      addToast('Upload failed', 'error');
      return false;
    }
  };

  // Upload text
  const uploadText = async (content) => {
    if (role !== 'uploader' || !content.trim() || !roomPin) return false;

    try {
      const res = await fetch(`${API_URL}/api/rooms/${roomPin}/texts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, folder: 'general' })
      });
      const data = await res.json();
      if (data.id) {
        invalidateCachedRoomData(roomPin);
        addToast('Text added!', 'success');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error uploading text:', error);
      addToast('Failed to add text', 'error');
      return false;
    }
  };

  // Delete file
  const deleteFile = async (fileId) => {
    if (role !== 'uploader') return false;

    try {
      const res = await fetch(`${API_URL}/api/files/${fileId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        invalidateCachedRoomData(roomPin);
        addToast('File deleted', 'success');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      addToast('Failed to delete file', 'error');
      return false;
    }
  };

  // Delete text
  const deleteText = async (textId) => {
    if (role !== 'uploader') return false;

    try {
      const res = await fetch(`${API_URL}/api/texts/${textId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        invalidateCachedRoomData(roomPin);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting text:', error);
      addToast('Failed to delete text', 'error');
      return false;
    }
  };

  // Fetch signed URL and metadata for file actions on demand.
  const fetchFileAccessInfo = async (fileId) => {
    const res = await fetch(`${API_URL}/api/files/${fileId}`);
    if (!res.ok) {
      throw new Error('Failed to fetch file URL');
    }
    return res.json();
  };

  const currentRoom = useMemo(() => {
    if (!roomPin) return null;
    return rooms.find(room => room.pin === roomPin) || {
      pin: roomPin,
      name: `Room ${roomPin}`,
      createdAt: null
    };
  }, [rooms, roomPin]);

  const value = {
    role,
    rooms,
    roomsLoading,
    roomPin,
    currentRoom,
    files,
    texts,
    loading,
    loadingMore,
    hasMore,
    toasts,
    setRole,
    joinRoom,
    createRoom,
    checkRoom,
    loadRooms,
    loadRoomContent,
    loadMoreContent,
    uploadFiles,
    uploadText,
    deleteFile,
    deleteText,
    fetchFileAccessInfo,
    addToast
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
}
