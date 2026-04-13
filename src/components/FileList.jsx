import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRoom } from '../context/RoomContext';
import { StarButton } from '@/components/ui/star-button';

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'heic', 'heif']);
const PDF_EXTENSIONS = new Set(['pdf']);
const WORD_EXTENSIONS = new Set(['doc', 'docx']);
const TEXT_EXTENSIONS = new Set(['txt', 'md', 'json', 'csv', 'xml', 'log']);
const ARCHIVE_EXTENSIONS = new Set(['zip', 'rar', '7z', 'tar', 'gz']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'mkv', 'avi', 'webm']);
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'm4a', 'aac']);

const getFileExtension = (name) => {
  const parts = (name || '').split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

const getFileKind = (originalName, fileType) => {
  const normalizedType = (fileType || '').toLowerCase();

  if (normalizedType.startsWith('image/')) return 'image';
  if (normalizedType.includes('pdf')) return 'pdf';
  if (normalizedType.includes('word') || normalizedType.includes('doc')) return 'word';
  if (normalizedType.startsWith('text/') || normalizedType.includes('txt')) return 'text';
  if (normalizedType.startsWith('video/')) return 'video';
  if (normalizedType.startsWith('audio/')) return 'audio';
  if (normalizedType.includes('zip') || normalizedType.includes('rar') || normalizedType.includes('7z')) return 'archive';

  const extension = getFileExtension(originalName);
  if (IMAGE_EXTENSIONS.has(extension)) return 'image';
  if (PDF_EXTENSIONS.has(extension)) return 'pdf';
  if (WORD_EXTENSIONS.has(extension)) return 'word';
  if (TEXT_EXTENSIONS.has(extension)) return 'text';
  if (ARCHIVE_EXTENSIONS.has(extension)) return 'archive';
  if (VIDEO_EXTENSIONS.has(extension)) return 'video';
  if (AUDIO_EXTENSIONS.has(extension)) return 'audio';

  return 'other';
};

const isPreviewableKind = (kind) => kind === 'image' || kind === 'pdf' || kind === 'word' || kind === 'text';

export default function FileList() {
  const {
    files,
    texts,
    role,
    hasMore,
    loadingMore,
    loadMoreContent,
    deleteFile,
    deleteText,
    fetchFileAccessInfo
  } = useRoom();

  const [previewImage, setPreviewImage] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [sortBy, setSortBy] = useState('date-desc');
  const [filterType, setFilterType] = useState('all');
  const [fileActionLoading, setFileActionLoading] = useState({});
  const loadMoreRef = useRef(null);

  const setFileLoadingState = useCallback((fileId, isLoading) => {
    setFileActionLoading(prev => {
      if (isLoading) {
        return { ...prev, [fileId]: true };
      }

      const next = { ...prev };
      delete next[fileId];
      return next;
    });
  }, []);

  const isFileLoading = useCallback((fileId) => Boolean(fileActionLoading[fileId]), [fileActionLoading]);

  useEffect(() => {
    if (!hasMore || !loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreContent();
        }
      },
      {
        root: null,
        rootMargin: '250px 0px',
        threshold: 0.1
      }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMoreContent]);

  const formatFileSize = (bytes) => {
    const numericBytes = Number(bytes) || 0;
    if (numericBytes < 1024) return numericBytes + ' B';
    if (numericBytes < 1024 * 1024) return (numericBytes / 1024).toFixed(1) + ' KB';
    return (numericBytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
      ' · ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFileIcon = (kind) => {
    if (kind === 'pdf') return '📕';
    if (kind === 'word') return '📘';
    if (kind === 'text') return '📄';
    if (kind === 'archive') return '🗜️';
    if (kind === 'video') return '🎬';
    if (kind === 'audio') return '🎵';
    if (kind === 'image') return '🖼️';
    return '📎';
  };

  const handleDownload = async (file) => {
    setFileLoadingState(file.id, true);
    try {
      const accessInfo = await fetchFileAccessInfo(file.id);
      if (!accessInfo?.url) {
        throw new Error('Missing download URL');
      }

      const link = document.createElement('a');
      link.href = accessInfo.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = file.originalName || accessInfo.originalName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setFileLoadingState(file.id, false);
    }
  };

  const openDocPreview = async (file) => {
    const initialKind = getFileKind(file.originalName, file.fileType);
    if (!isPreviewableKind(initialKind)) {
      return;
    }

    setPreviewImage(null);
    if (initialKind !== 'image') {
      setPreviewDoc({ type: 'loading', name: file.originalName });
    }

    setFileLoadingState(file.id, true);

    try {
      const accessInfo = await fetchFileAccessInfo(file.id);
      if (!accessInfo?.url) {
        throw new Error('Missing preview URL');
      }

      const resolvedName = accessInfo.originalName || file.originalName;
      const resolvedKind = getFileKind(resolvedName, accessInfo.fileType);

      if (resolvedKind === 'image') {
        setPreviewDoc(null);
        setPreviewImage({ url: accessInfo.url, name: resolvedName });
        return;
      }

      if (resolvedKind === 'pdf') {
        setPreviewDoc({ type: 'pdf', url: accessInfo.url, name: resolvedName });
        return;
      }

      if (resolvedKind === 'text') {
        const response = await fetch(accessInfo.url);
        const textContent = await response.text();
        setPreviewDoc({ type: 'text', content: textContent, name: resolvedName });
        return;
      }

      if (resolvedKind === 'word') {
        const response = await fetch(accessInfo.url);
        const arrayBuffer = await response.arrayBuffer();
        const mammoth = (await import('mammoth')).default;
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setPreviewDoc({ type: 'word', html: result.value, name: resolvedName });
        return;
      }

      setPreviewDoc({ type: 'error', name: resolvedName });
    } catch (error) {
      console.error('Failed to load preview:', error);
      setPreviewDoc({ type: 'error', name: file.originalName });
    } finally {
      setFileLoadingState(file.id, false);
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
    } catch (error) {
      console.error('Failed to copy text:', error);
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
    const getDateValue = (item) => item.uploadedAt ? new Date(item.uploadedAt).getTime() : 0;

    return [...arr].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc': return getDateValue(b) - getDateValue(a);
        case 'date-asc':  return getDateValue(a) - getDateValue(b);
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
  const grouped = useMemo(() => {
    const buckets = {
      pdf: [],
      word: [],
      textFile: [],
      image: [],
      other: []
    };

    files.forEach((file) => {
      const kind = getFileKind(file.originalName, file.fileType);
      if (kind === 'pdf') {
        buckets.pdf.push(file);
        return;
      }
      if (kind === 'word') {
        buckets.word.push(file);
        return;
      }
      if (kind === 'text') {
        buckets.textFile.push(file);
        return;
      }
      if (kind === 'image') {
        buckets.image.push(file);
        return;
      }
      buckets.other.push(file);
    });

    return {
      pdf: applySort(buckets.pdf),
      word: applySort(buckets.word),
      textFile: applySort(buckets.textFile),
      image: applySort(buckets.image),
      other: applySort(buckets.other)
    };
  }, [files, applySort]);

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

  const renderFileCard = (file) => {
    const fileKind = getFileKind(file.originalName, file.fileType);
    const isPreviewable = isPreviewableKind(fileKind);
    const actionLoading = isFileLoading(file.id);

    return (
      <div
        key={file.id}
        className="file-card glass-card card-3d"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={`file-preview ${isPreviewable ? 'clickable doc-previewable' : ''} ${actionLoading ? 'loading' : ''}`}
          onClick={() => isPreviewable && !actionLoading && openDocPreview(file)}
        >
          {actionLoading ? (
            <div className="file-preview-placeholder">
              <div className="spinner"></div>
              <span>Loading...</span>
            </div>
          ) : (
            <>
              <span className="file-preview-icon">{getFileIcon(fileKind)}</span>
              {isPreviewable && (
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
            {file.uploadedAt && (
              <>
                <span>•</span>
                <span>{formatDate(file.uploadedAt)}</span>
              </>
            )}
          </div>
        </div>

        <div className="file-actions">
          {isPreviewable && (
            <StarButton
              type="button"
              className="btn-icon preview"
              title={actionLoading ? 'Loading...' : 'Preview'}
              onClick={() => openDocPreview(file)}
              disabled={actionLoading}
              backgroundColor="#334155"
              lightColor="#f8fafc"
            >
              {actionLoading ? '⏳' : '👁'}
            </StarButton>
          )}
          <StarButton
            type="button"
            className="btn-icon download"
            title={actionLoading ? 'Loading...' : 'Download'}
            onClick={() => handleDownload(file)}
            disabled={actionLoading}
            backgroundColor="#0f766e"
            lightColor="#ccfbf1"
          >
            {actionLoading ? '⏳' : '⬇️'}
          </StarButton>
          {role === 'uploader' && (
            <StarButton
              type="button"
              className="btn-icon delete"
              title="Delete"
              onClick={() => deleteFile(file.id)}
              disabled={actionLoading}
              backgroundColor="#991b1b"
              lightColor="#fee2e2"
            >
              🗑️
            </StarButton>
          )}
        </div>
      </div>
    );
  };

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
        <StarButton
          type="button"
          className="btn-icon copy"
          title={copiedId === text.id ? 'Copied!' : 'Copy text'}
          onClick={() => handleCopyText(text.id, text.content)}
          backgroundColor="#334155"
          lightColor="#f8fafc"
        >
          {copiedId === text.id ? '✓' : '📋'}
        </StarButton>
        {role === 'uploader' && (
          <StarButton
            type="button"
            className="btn-icon delete"
            title="Delete"
            onClick={() => deleteText(text.id)}
            backgroundColor="#991b1b"
            lightColor="#fee2e2"
          >
            🗑️
          </StarButton>
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
            <StarButton
              type="button"
              key={tab.key}
              className={`format-tab${filterType === tab.key ? ' active' : ''}`}
              backgroundColor={filterType === tab.key ? '#0f766e' : '#334155'}
              lightColor={filterType === tab.key ? '#ccfbf1' : '#f8fafc'}
              onClick={() => setFilterType(tab.key)}
            >
              <span className="format-tab-icon">{tab.icon}</span>
              <span className="format-tab-label">{tab.label}</span>
              <span className="format-tab-count">{tab.count}</span>
            </StarButton>
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
              <StarButton
                type="button"
                key={opt.key}
                className={`sort-pill${sortBy === opt.key ? ' active' : ''}`}
                backgroundColor={sortBy === opt.key ? '#7c3aed' : '#334155'}
                lightColor={sortBy === opt.key ? '#f5f3ff' : '#f8fafc'}
                onClick={() => setSortBy(opt.key)}
              >
                {opt.label}
              </StarButton>
            ))}
          </div>
        </div>

        {renderContent()}

        <div className="infinite-status-wrap">
          {hasMore ? (
            <div ref={loadMoreRef} className="infinite-status">
              {loadingMore ? (
                <>
                  <div className="spinner"></div>
                  <span>Loading more content...</span>
                </>
              ) : (
                <span>Scroll down to load more</span>
              )}
            </div>
          ) : (
            <div className="infinite-status done">
              <span>All content loaded</span>
            </div>
          )}
        </div>
      </section>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="preview-modal" onClick={closePreview}>
          <div className="preview-modal-content" onClick={e => e.stopPropagation()}>
            <StarButton
              type="button"
              className="preview-close"
              backgroundColor="#334155"
              lightColor="#f8fafc"
              onClick={closePreview}
            >
              ✕
            </StarButton>
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
              <StarButton
                type="button"
                className="preview-close doc-close-btn"
                backgroundColor="#334155"
                lightColor="#f8fafc"
                onClick={closePreview}
              >
                ✕
              </StarButton>
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
                  <span>Loading preview...</span>
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
