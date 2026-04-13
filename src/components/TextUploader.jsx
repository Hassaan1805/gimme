import { useState, useRef } from 'react';
import { useRoom } from '../context/RoomContext';
import { StarButton } from '@/components/ui/star-button';

export default function TextUploader() {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pastedImage, setPastedImage] = useState(null);
  const [pastedImageBlob, setPastedImageBlob] = useState(null);
  const textareaRef = useRef(null);
  const { uploadText, uploadFiles } = useRoom();
  const maxChars = 5000;

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // Check if clipboard has an image
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault(); // Prevent default paste behavior for images
        const blob = items[i].getAsFile();
        
        if (blob) {
          // Store the blob for later upload
          setPastedImageBlob(blob);
          
          // Create preview
          const reader = new FileReader();
          reader.onload = (e) => {
            setPastedImage(e.target.result);
          };
          reader.readAsDataURL(blob);
        }
        return;
      }
    }
  };

  const handleUploadImage = async () => {
    if (!pastedImageBlob) return;
    
    setUploading(true);
    const success = await uploadFiles([pastedImageBlob]);
    setUploading(false);
    
    if (success) {
      setPastedImage(null);
      setPastedImageBlob(null);
    }
  };

  const handleCancelImage = () => {
    setPastedImage(null);
    setPastedImageBlob(null);
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    
    setUploading(true);
    const success = await uploadText(text);
    if (success) {
      setText('');
    }
    setUploading(false);
  };

  return (
    <div className="text-uploader">
      {pastedImage && (
        <div className="pasted-image-preview">
          <div className="pasted-image-content">
            <StarButton
              type="button"
              className="pasted-image-remove"
              backgroundColor="#dc2626"
              lightColor="#fee2e2"
              onClick={handleCancelImage}
              disabled={uploading}
              title="Remove image"
            >
              ✕
            </StarButton>
            <img src={pastedImage} alt="Pasted screenshot" />
            <div className="pasted-image-actions">
              <StarButton
                type="button"
                className="btn-sm"
                backgroundColor="#334155"
                lightColor="#f8fafc"
                onClick={handleCancelImage}
                disabled={uploading}
              >
                Cancel
              </StarButton>
              <StarButton
                type="button"
                className="btn-sm"
                backgroundColor="#7c3aed"
                lightColor="#f5f3ff"
                onClick={handleUploadImage}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : '📤 Upload Screenshot'}
              </StarButton>
            </div>
          </div>
        </div>
      )}
      
      <div className="text-input-wrapper">
        <textarea
          ref={textareaRef}
          className="text-input"
          placeholder="Paste or type text content to share... (You can also paste images from clipboard!)"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, maxChars))}
          onPaste={handlePaste}
          disabled={uploading}
        />
      </div>
      <div className="text-submit-row">
        <span className="char-count">
          {text.length} / {maxChars}
        </span>
        <StarButton
          type="button"
          className="btn-submit-text"
          backgroundColor="#7c3aed"
          lightColor="#f5f3ff"
          onClick={handleSubmit}
          disabled={!text.trim() || uploading}
        >
          {uploading ? 'Posting...' : '📝 Post Text'}
        </StarButton>
      </div>
    </div>
  );
}
