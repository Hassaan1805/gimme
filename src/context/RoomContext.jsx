import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const RoomContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SHARED_ROOM_PIN = '1234'; // Single shared room for all users

export function RoomProvider({ children }) {
  const [role, setRole] = useState(null);
  const [files, setFiles] = useState([]);
  const [texts, setTexts] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Add toast notification (defined first so it can be used in effects)
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(API_URL);
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  // Join/leave room on socket
  useEffect(() => {
    if (socket) {
      socket.emit('join-room', SHARED_ROOM_PIN);
      return () => socket.emit('leave-room', SHARED_ROOM_PIN);
    }
  }, [socket]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.on('file-added', (file) => {
      setFiles(prev => [...prev, file]);
      addToast('New file uploaded!', 'success');
    });

    socket.on('file-deleted', (fileId) => {
      setFiles(prev => prev.filter(f => f.id !== fileId));
    });

    socket.on('text-added', (text) => {
      setTexts(prev => [...prev, text]);
      addToast('New text added!', 'success');
    });

    socket.on('text-deleted', (textId) => {
      setTexts(prev => prev.filter(t => t.id !== textId));
    });

    return () => {
      socket.off('file-added');
      socket.off('file-deleted');
      socket.off('text-added');
      socket.off('text-deleted');
    };
  }, [socket, addToast]);

  // Load room content
  const loadRoomContent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/rooms/${SHARED_ROOM_PIN}/contents`);
      const data = await res.json();
      setFiles(data.files || []);
      setTexts(data.texts || []);
    } catch (error) {
      console.error('Error loading room content:', error);
      addToast('Failed to load room content', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Upload files
  const uploadFiles = async (fileList) => {
    if (role !== 'uploader') return false;
    
    try {
      // Upload files one by one since backend expects single file
      const uploadPromises = Array.from(fileList).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch(`${API_URL}/api/rooms/${SHARED_ROOM_PIN}/files`, {
          method: 'POST',
          body: formData
        });
        return res.json();
      });
      
      const results = await Promise.all(uploadPromises);
      const uploadedFiles = results.filter(r => r.id); // Filter successful uploads
      
      if (uploadedFiles.length > 0) {
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
    if (role !== 'uploader' || !content.trim()) return false;
    
    try {
      const res = await fetch(`${API_URL}/api/rooms/${SHARED_ROOM_PIN}/texts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      if (data.id) {
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
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting text:', error);
      addToast('Failed to delete text', 'error');
      return false;
    }
  };

  // Get file preview URL
  const getFilePreviewUrl = (fileId) => {
    return `${API_URL}/api/files/${fileId}`;
  };

  // Get file download URL
  const getFileDownloadUrl = (fileId) => {
    return `${API_URL}/api/files/${fileId}/download`;
  };

  // Leave room (now just resets role)
  const leaveRoom = () => {
    setRole(null);
    setFiles([]);
    setTexts([]);
  };

  const value = {
    role,
    files,
    texts,
    loading,
    toasts,
    setRole,
    loadRoomContent,
    uploadFiles,
    uploadText,
    deleteFile,
    deleteText,
    getFilePreviewUrl,
    getFileDownloadUrl,
    leaveRoom,
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
