import { useState, useRef } from 'react';
import { useRoom } from '../context/RoomContext';

export default function FileUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { uploadFiles } = useRoom();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleUpload(files);
    }
  };

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      await handleUpload(files);
    }
    // Reset input
    e.target.value = '';
  };

  const handleUpload = async (files) => {
    setUploading(true);
    await uploadFiles(files);
    setUploading(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      className={`upload-zone ${isDragging ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
      />
      
      {uploading ? (
        <>
          <div className="upload-icon">
            <div className="spinner" style={{ width: 48, height: 48 }}></div>
          </div>
          <h3>Uploading...</h3>
          <p>Please wait while your files are being uploaded</p>
        </>
      ) : (
        <>
          <div className="upload-icon">📁</div>
          <h3>Drag & Drop Files Here</h3>
          <p>or click to browse • Images, Documents, Text files (max 50MB)</p>
        </>
      )}
    </div>
  );
}
