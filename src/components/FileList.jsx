import { useState } from 'react';
import { useRoom } from '../context/RoomContext';

export default function FileList() {
  const { 
    files, 
    texts, 
    role, 
    deleteFile, 
    deleteText,
    getFilePreviewUrl,
    getFileDownloadUrl 
  } = useRoom();

  const [previewImage, setPreviewImage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isImage = (fileType) => {
    return fileType?.startsWith('image/');
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return '📕';
    if (fileType?.includes('word') || fileType?.includes('doc')) return '📘';
    if (fileType?.includes('text')) return '📄';
    if (fileType?.includes('zip') || fileType?.includes('rar')) return '🗜️';
    if (fileType?.includes('video')) return '🎬';
    if (fileType?.includes('audio')) return '🎵';
    return '📎';
  };

  const handleDownload = async (file) => {
    try {
      const response = await fetch(getFileDownloadUrl(file.id));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const openPreview = (file) => {
    setPreviewImage({
      url: getFilePreviewUrl(file.id),
      name: file.originalName
    });
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  const handleCopyText = async (textId, content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(textId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const totalItems = files.length + texts.length;

  if (totalItems === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <h3>No content yet</h3>
        <p>{role === 'uploader' ? 'Upload files or share text to get started' : 'Waiting for content to be shared...'}</p>
      </div>
    );
  }

  return (
    <>
      <section className="file-list-section">
        <div className="section-header">
          <h2>Shared Content</h2>
          <span className="file-count">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
        </div>

        <div className="file-grid">
          {/* Files */}
          {files.map(file => (
            <div key={file.id} className="file-card glass-card">
              <div 
                className={`file-preview ${isImage(file.fileType) ? 'clickable' : ''}`}
                onClick={() => isImage(file.fileType) && openPreview(file)}
              >
                {isImage(file.fileType) ? (
                  <>
                    <img 
                      src={getFilePreviewUrl(file.id)} 
                      alt={file.originalName}
                      loading="lazy"
                    />
                    <div className="preview-overlay">
                      <span>🔍</span>
                    </div>
                  </>
                ) : (
                  <span className="file-preview-icon">{getFileIcon(file.fileType)}</span>
                )}
              </div>
              
              <div className="file-info">
                <h4 title={file.originalName}>{file.originalName}</h4>
                <div className="file-meta">
                  <span>{formatFileSize(file.size)}</span>
                  <span>•</span>
                  <span>{formatTime(file.uploadedAt)}</span>
                  <span>•</span>
                  <span>{file.uploadedBy}</span>
                </div>
              </div>
              
              <div className="file-actions">
                <button 
                  className="btn-icon download"
                  title="Download"
                  onClick={() => handleDownload(file)}
                >
                  ⬇️
                </button>
                {role === 'uploader' && (
                  <button 
                    className="btn-icon delete"
                    title="Delete"
                    onClick={() => deleteFile(file.id)}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Text entries */}
          {texts.map(text => (
            <div key={text.id} className="text-card glass-card">
              <div className="text-card-content">
                {text.content}
              </div>
              
              <div className="file-meta">
                <span>📝 Text</span>
                <span>•</span>
                <span>{formatTime(text.uploadedAt)}</span>
                <span>•</span>
                <span>{text.uploadedBy}</span>
              </div>
              
              <div className="file-actions">
                <button 
                  className="btn-icon copy"
                  title={copiedId === text.id ? "Copied!" : "Copy text"}
                  onClick={() => handleCopyText(text.id, text.content)}
                >
                  {copiedId === text.id ? '✓' : '📋'}
                </button>
                {role === 'uploader' && (
                  <button 
                    className="btn-icon delete"
                    title="Delete"
                    onClick={() => deleteText(text.id)}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fullscreen Image Preview Modal */}
      {previewImage && (
        <div className="preview-modal" onClick={closePreview}>
          <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="preview-close" onClick={closePreview}>✕</button>
            <img src={previewImage.url} alt={previewImage.name} />
            <div className="preview-filename">{previewImage.name}</div>
          </div>
        </div>
      )}
    </>
  );
}
