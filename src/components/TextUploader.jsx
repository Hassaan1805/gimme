import { useState } from 'react';
import { useRoom } from '../context/RoomContext';

export default function TextUploader() {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const { uploadText } = useRoom();
  const maxChars = 5000;

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
      <div className="text-input-wrapper">
        <textarea
          className="text-input"
          placeholder="Paste or type text content to share..."
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, maxChars))}
          disabled={uploading}
        />
      </div>
      <div className="text-submit-row">
        <span className="char-count">
          {text.length} / {maxChars}
        </span>
        <button 
          className="btn btn-primary btn-submit-text"
          onClick={handleSubmit}
          disabled={!text.trim() || uploading}
        >
          {uploading ? 'Posting...' : '📝 Post Text'}
        </button>
      </div>
    </div>
  );
}
