import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRoom } from '../context/RoomContext';

// Component to handle image thumbnails with signed URLs
function ImageThumbnail({ fileId, alt, getFilePreviewUrl }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    async function loadImage() {
      try {
        const res = await fetch(getFilePreviewUrl(fileId));
        const data = await res.json();
        if (mounted) {
          setImageUrl(data.url);
        }
      } catch (err) {
        if (mounted) {
          setError(true);
        }
      }
    }
    
    loadImage();
    
    return () => {
      mounted = false;
    };
  }, [fileId, getFilePreviewUrl]);

  if (error) {
    return <span className="file-preview-icon">🖼️</span>;
  }

  if (!imageUrl) {
    return <span className="file-preview-icon loading">⏳</span>;
  }

  return <img src={imageUrl} alt={alt} loading="lazy" />;
}

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
  const [previewDoc, setPreviewDoc] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [sortBy, setSortBy] = useState('date-desc');
  const [filterType, setFilterType] = useState('all');

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
      ' · ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isImage = (t) => t?.startsWith('image/');
  const isPDF = (t) => t?.includes('pdf');
  const isWord = (t) => t?.includes('word') || t?.includes('docx') || t?.includes('doc');
  const isTextFile = (t) => t?.includes('text') || t?.includes('txt');
  const isPreviewable = (t) => isImage(t) || isPDF(t) || isWord(t) || isTextFile(t);

  const getFileIcon = (fileType) => {
    if (isPDF(fileType)) return '📕';
    if (isWord(fileType)) return '📘';
    if (isTextFile(fileType)) return '📄';
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

  const openDocPreview = async (file) => {
    if (isImage(file.fileType)) {
      try {
        // Fetch the signed URL from the API
        const res = await fetch(getFilePreviewUrl(file.id));
        const data = await res.json();
        setPreviewImage({ url: data.url, name: file.originalName });
      } catch (error) {
        console.error('Failed to load image:', error);
      }
      return;
    }
    setPreviewDoc({ type: 'loading', name: file.originalName });

    if (isPDF(file.fileType)) {
      try {
        const res = await fetch(getFilePreviewUrl(file.id));
        const data = await res.json();
        setPreviewDoc({ type: 'pdf', url: data.url, name: file.originalName });
      } catch {
        setPreviewDoc({ type: 'error', name: file.originalName });
      }
      return;
    }
    if (isTextFile(file.fileType)) {
      try {
        const res = await fetch(getFileDownloadUrl(file.id));
        const text = await res.text();
        setPreviewDoc({ type: 'text', content: text, name: file.originalName });
      } catch {
        setPreviewDoc({ type: 'error', name: file.originalName });
      }
      return;
    }
    if (isWord(file.fileType)) {
      try {
        const res = await fetch(getFileDownloadUrl(file.id));
        const arrayBuffer = await res.arrayBuffer();
        const mammoth = (await import('mammoth')).default;
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setPreviewDoc({ type: 'word', html: result.value, name: file.originalName });
      } catch {
        setPreviewDoc({ type: 'error', name: file.originalName });
      }
    }
  };

  const closePreview = () => {
    setPreviewImage(null);
    setPreviewDoc(null);
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

  // 3D tilt effect
  const handleMouseMove = useCallback((e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotX = (y / rect.height - 0.5) * -20;
    const rotY = (x / rect.width - 0.5) * 20;
    card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(12px) scale(1.02)`;
    card.style.boxShadow = `${-rotY * 2}px ${rotX * 2}px 40px rgba(124,58,237,0.35), 0 20px 60px rgba(0,0,0,0.5)`;
    card.style.borderColor = 'var(--primary)';
  }, []);

  const handleMouseLeave = useCallback((e) => {
    const card = e.currentTarget;
    card.style.transform = '';
    card.style.boxShadow = '';
    card.style.borderColor = '';
  }, []);

  // Sort functions
  const applySort = useCallback((arr) => {
    return [...arr].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc': return new Date(b.uploadedAt) - new Date(a.uploadedAt);
        case 'date-asc':  return new Date(a.uploadedAt) - new Date(b.uploadedAt);
        case 'size-desc': return (b.size || 0) - (a.size || 0);
        case 'size-asc':  return (a.size || 0) - (b.size || 0);
        case 'name-asc':  return (a.originalName || '').toLowerCase().localeCompare((b.originalName || '').toLowerCase());
        case 'name-desc': return (b.originalName || '').toLowerCase().localeCompare((a.originalName || '').toLowerCase());
        default: return 0;
      }
    });
  }, [sortBy]);

  const applySortTexts = useCallback((arr) => {
    return [...arr].sort((a, b) => {
      switch (sortBy) {
        case 'date-asc': return new Date(a.uploadedAt) - new Date(b.uploadedAt);
        default:         return new Date(b.uploadedAt) - new Date(a.uploadedAt);
      }
    });
  }, [sortBy]);

  // Grouped & sorted data
  const grouped = useMemo(() => ({
    pdf:      applySort(files.filter(f => isPDF(f.fileType))),
    word:     applySort(files.filter(f => isWord(f.fileType))),
    textFile: applySort(files.filter(f => isTextFile(f.fileType))),
    image:    applySort(files.filter(f => isImage(f.fileType))),
    other:    applySort(files.filter(f =>
      !isPDF(f.fileType) && !isWord(f.fileType) &&
      !isTextFile(f.fileType) && !isImage(f.fileType)
    )),
  }), [files, applySort]);

  const sortedTexts = useMemo(() => applySortTexts(texts), [texts, applySortTexts]);

  const totalItems = files.length + texts.length;

  // Format filter tab definitions (only show tabs that have items)
  const formatTabs = useMemo(() => [
    { key: 'all',      label: 'All',        icon: '🗂️', count: totalItems },
    { key: 'pdf',      label: 'PDFs',       icon: '📕', count: grouped.pdf.length },
    { key: 'word',     label: 'Word',       icon: '📘', count: grouped.word.length },
    { key: 'text',     label: 'Text Files', icon: '📄', count: grouped.textFile.length },
    { key: 'image',    label: 'Images',     icon: '🖼️', count: grouped.image.length },
    { key: 'other',    label: 'Other',      icon: '📎', count: grouped.other.length },
    { key: 'snippet',  label: 'Snippets',   icon: '📝', count: sortedTexts.length },
  ].filter(t => t.key === 'all' || t.count > 0), [grouped, sortedTexts, totalItems]);

  if (totalItems === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <h3>No content yet</h3>
        <p>{role === 'uploader' ? 'Upload files or share text to get started' : 'Waiting for content to be shared...'}</p>
      </div>
    );
  }

  const renderFileCard = (file) => (
    <div
      key={file.id}
      className="file-card glass-card card-3d"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`file-preview ${isImage(file.fileType) ? 'clickable' : isPreviewable(file.fileType) ? 'clickable doc-previewable' : ''}`}
        onClick={() => isPreviewable(file.fileType) && openDocPreview(file)}
      >
        {isImage(file.fileType) ? (
          <>
            <ImageThumbnail 
              fileId={file.id} 
              alt={file.originalName} 
              getFilePreviewUrl={getFilePreviewUrl}
            />
            <div className="preview-overlay"><span>🔍</span></div>
          </>
        ) : (
          <>
            <span className="file-preview-icon">{getFileIcon(file.fileType)}</span>
            {isPreviewable(file.fileType) && (
              <div className="preview-overlay">
                <span className="doc-preview-hint">👁 Preview</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="file-info">
        <h4 title={file.originalName}>{file.originalName}</h4>
        <div className="file-meta">
          <span>{formatFileSize(file.size)}</span>
          <span>•</span>
          <span>{formatDate(file.uploadedAt)}</span>
        </div>
      </div>

      <div className="file-actions">
        {isPreviewable(file.fileType) && (
          <button className="btn-icon preview" title="Preview" onClick={() => openDocPreview(file)}>
            👁
          </button>
        )}
        <button className="btn-icon download" title="Download" onClick={() => handleDownload(file)}>
          ⬇️
        </button>
        {role === 'uploader' && (
          <button className="btn-icon delete" title="Delete" onClick={() => deleteFile(file.id)}>
            🗑️
          </button>
        )}
      </div>
    </div>
  );

  const renderTextCard = (text) => (
    <div
      key={text.id}
      className="text-card glass-card card-3d"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="text-card-content">{text.content}</div>
      <div className="file-meta">
        <span>📝 Snippet</span>
        <span>•</span>
        <span>{formatDate(text.uploadedAt)}</span>
      </div>
      <div className="file-actions">
        <button
          className="btn-icon copy"
          title={copiedId === text.id ? 'Copied!' : 'Copy text'}
          onClick={() => handleCopyText(text.id, text.content)}
        >
          {copiedId === text.id ? '✓' : '📋'}
        </button>
        {role === 'uploader' && (
          <button className="btn-icon delete" title="Delete" onClick={() => deleteText(text.id)}>
            🗑️
          </button>
        )}
      </div>
    </div>
  );

  const CategorySection = ({ title, icon, items, color, renderCard = renderFileCard }) => {
    if (items.length === 0) return null;
    return (
      <div className="category-section">
        <div className="category-header" style={{ '--cat-color': color }}>
          <span className="category-icon">{icon}</span>
          <span className="category-title">{title}</span>
          <span className="category-count">{items.length}</span>
        </div>
        <div className="file-grid">{items.map(renderCard)}</div>
      </div>
    );
  };

  // What to render based on active format filter
  const renderContent = () => {
    if (filterType === 'all') {
      return (
        <>
          <CategorySection title="PDF Documents" icon="📕" items={grouped.pdf} color="var(--danger)" />
          <CategorySection title="Word Documents" icon="📘" items={grouped.word} color="#2B7BB9" />
          <CategorySection title="Text Files" icon="📄" items={grouped.textFile} color="var(--success)" />
          <CategorySection title="Images" icon="🖼️" items={grouped.image} color="var(--accent)" />
          <CategorySection title="Other Files" icon="📎" items={grouped.other} color="var(--text-muted)" />
          {sortedTexts.length > 0 && (
            <CategorySection title="Text Snippets" icon="📝" items={sortedTexts} color="var(--warning)" renderCard={renderTextCard} />
          )}
        </>
      );
    }
    // Filtered view — flat grid, no category header needed
    const MAP = {
      pdf:     { items: grouped.pdf,      render: renderFileCard },
      word:    { items: grouped.word,     render: renderFileCard },
      text:    { items: grouped.textFile, render: renderFileCard },
      image:   { items: grouped.image,    render: renderFileCard },
      other:   { items: grouped.other,    render: renderFileCard },
      snippet: { items: sortedTexts,      render: renderTextCard },
    };
    const { items, render } = MAP[filterType] || { items: [], render: renderFileCard };
    return (
      <div className="file-grid filter-grid">
        {items.map(render)}
      </div>
    );
  };

  return (
    <>
      <section className="file-list-section">
        <div className="section-header">
          <h2>Shared Content</h2>
          <span className="file-count">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
        </div>

        {/* Format filter tabs */}
        <div className="format-tabs">
          {formatTabs.map(tab => (
            <button
              key={tab.key}
              className={`format-tab${filterType === tab.key ? ' active' : ''}`}
              onClick={() => setFilterType(tab.key)}
            >
              <span className="format-tab-icon">{tab.icon}</span>
              <span className="format-tab-label">{tab.label}</span>
              <span className="format-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Sort bar */}
        <div className="sort-bar">
          <span className="sort-label">Sort</span>
          <div className="sort-pills">
            {[
              { key: 'date-desc', label: 'Newest' },
              { key: 'date-asc',  label: 'Oldest' },
              { key: 'size-desc', label: 'Largest' },
              { key: 'size-asc',  label: 'Smallest' },
              { key: 'name-asc',  label: 'A → Z' },
              { key: 'name-desc', label: 'Z → A' },
            ].map(opt => (
              <button
                key={opt.key}
                className={`sort-pill${sortBy === opt.key ? ' active' : ''}`}
                onClick={() => setSortBy(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {renderContent()}
      </section>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="preview-modal" onClick={closePreview}>
          <div className="preview-modal-content" onClick={e => e.stopPropagation()}>
            <button className="preview-close" onClick={closePreview}>✕</button>
            <img src={previewImage.url} alt={previewImage.name} />
            <div className="preview-filename">{previewImage.name}</div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="preview-modal doc-preview-modal" onClick={closePreview}>
          <div className="doc-preview-content" onClick={e => e.stopPropagation()}>
            <div className="doc-preview-header">
              <span className="doc-preview-name">{previewDoc.name}</span>
              <button className="preview-close doc-close-btn" onClick={closePreview}>✕</button>
            </div>
            <div className="doc-preview-body">
              {previewDoc.type === 'pdf' && (
                <iframe src={previewDoc.url} title={previewDoc.name} className="doc-iframe" />
              )}
              {previewDoc.type === 'text' && (
                <pre className="doc-text-preview">{previewDoc.content}</pre>
              )}
              {previewDoc.type === 'word' && (
                <div className="doc-word-preview" dangerouslySetInnerHTML={{ __html: previewDoc.html }} />
              )}
              {previewDoc.type === 'loading' && (
                <div className="doc-loading">
                  <div className="spinner"></div>
                  <span>Loading preview…</span>
                </div>
              )}
              {previewDoc.type === 'error' && (
                <div className="doc-error">
                  <span>⚠️</span>
                  <p>Preview unavailable for this file.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
