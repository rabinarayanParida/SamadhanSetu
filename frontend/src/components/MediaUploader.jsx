import { useState, useRef } from 'react';
import API from '../api/axios';

const FILE_CONFIGS = {
  photo: {
    accept: 'image/jpeg,image/png,image/webp,image/gif',
    maxSize: 5 * 1024 * 1024,
    maxSizeLabel: '5MB',
    icon: '🖼️',
    label: 'Photos',
  },
  video: {
    accept: 'video/mp4,video/webm,video/quicktime',
    maxSize: 50 * 1024 * 1024,
    maxSizeLabel: '50MB',
    icon: '🎥',
    label: 'Videos',
  },
  document: {
    accept: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    maxSize: 10 * 1024 * 1024,
    maxSizeLabel: '10MB',
    icon: '📄',
    label: 'Documents',
  },
};

/**
 * MediaUploader Component
 *
 * Props:
 * - challengeId: string — challenge UUID
 * - media: Array — existing media files
 * - onMediaChange: (updatedMedia) => void
 * - disabled: boolean — prevent uploads (e.g., non-DRAFT challenge)
 */
export default function MediaUploader({ challengeId, media = [], onMediaChange, disabled = false }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('photo');
  const fileInputRef = useRef(null);

  const config = FILE_CONFIGS[activeTab];
  const filteredMedia = media.filter((m) => m.file_type === activeTab);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowedTypes = config.accept.split(',');
    if (!allowedTypes.includes(file.type)) {
      setError(`Invalid file type. Accepted: ${config.accept.replace(/[a-z]+\//g, '').replace(/,/g, ', ')}`);
      return;
    }

    if (file.size > config.maxSize) {
      setError(`File too large. Maximum size: ${config.maxSizeLabel}.`);
      return;
    }

    setError('');
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await API.post(`/challenges/${challengeId}/media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(pct);
        },
      });

      if (data.success) {
        onMediaChange([...media, data.data]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (mediaId) => {
    if (!confirm('Delete this file?')) return;

    try {
      await API.delete(`/challenges/${challengeId}/media/${mediaId}`);
      onMediaChange(media.filter((m) => m.id !== mediaId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete file.');
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getPreviewUrl = (item) => {
    const base = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
    return `${base}/${item.file_path}`;
  };

  return (
    <div className="media-uploader">
      {/* Tabs */}
      <div className="media-tabs">
        {Object.entries(FILE_CONFIGS).map(([type, cfg]) => {
          const count = media.filter((m) => m.file_type === type).length;
          return (
            <button
              key={type}
              type="button"
              className={`media-tab ${activeTab === type ? 'media-tab-active' : ''}`}
              onClick={() => { setActiveTab(type); setError(''); }}
            >
              {cfg.icon} {cfg.label}
              {count > 0 && <span className="media-tab-count">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Upload Area */}
      {!disabled && (
        <div className="media-upload-area">
          <input
            ref={fileInputRef}
            type="file"
            accept={config.accept}
            onChange={handleFileSelect}
            className="media-file-input"
            id="media-file-input"
            disabled={uploading}
          />
          <label htmlFor="media-file-input" className={`media-dropzone ${uploading ? 'media-dropzone-disabled' : ''}`}>
            {uploading ? (
              <div className="upload-progress">
                <div className="upload-progress-bar">
                  <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
                <span>Uploading... {uploadProgress}%</span>
              </div>
            ) : (
              <>
                <span className="dropzone-icon">{config.icon}</span>
                <span className="dropzone-text">Click to upload {config.label.toLowerCase()}</span>
                <span className="dropzone-hint">Max {config.maxSizeLabel} per file</span>
              </>
            )}
          </label>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginTop: '8px' }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* File List */}
      {filteredMedia.length > 0 ? (
        <div className="media-grid">
          {filteredMedia.map((item) => (
            <div key={item.id} className="media-card">
              {item.file_type === 'photo' ? (
                <div className="media-preview">
                  <img src={getPreviewUrl(item)} alt={item.file_name} loading="lazy" />
                </div>
              ) : item.file_type === 'video' ? (
                <div className="media-preview">
                  <video src={getPreviewUrl(item)} controls preload="metadata" />
                </div>
              ) : (
                <div className="media-preview media-preview-doc">
                  <span className="doc-icon">📄</span>
                </div>
              )}
              <div className="media-info">
                <span className="media-name" title={item.file_name}>
                  {item.file_name.length > 25
                    ? item.file_name.slice(0, 22) + '...'
                    : item.file_name}
                </span>
                <span className="media-size">{formatSize(item.file_size)}</span>
              </div>
              {!disabled && (
                <button
                  type="button"
                  className="media-delete-btn"
                  onClick={() => handleDelete(item.id)}
                  title="Delete file"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="media-empty">
          <span>{config.icon}</span>
          <p>No {config.label.toLowerCase()} uploaded yet</p>
        </div>
      )}
    </div>
  );
}
