import { useState, useEffect, useRef } from 'react';
import api from '../../api';

const base = process.env.REACT_APP_API_URL || '';

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const load = () => api.get('/api/settings/images').then(r => setImages(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const upload = async e => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    await Promise.all(files.map(file => {
      const fd = new FormData();
      fd.append('image', file);
      return api.post('/api/settings/upload-image', fd);
    }));
    setUploading(false);
    fileRef.current.value = '';
    load();
  };

  const del = async filename => {
    if (!window.confirm('Delete this file?')) return;
    await api.delete(`/api/settings/images/${filename}`);
    load();
  };

  const isVideo = f => /\.(mp4|webm|ogg|mov)$/i.test(f);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>🖼️ Gallery ({images.length})</h2>
        <button className="btn btn-primary" onClick={() => fileRef.current.click()} disabled={uploading}>
          {uploading ? 'Uploading…' : '⬆ Upload'}
        </button>
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={upload} />
      </div>

      {images.length === 0 && <p style={{ color: '#aaa' }}>No files yet.</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {images.map(img => (
          <div key={img.filename} style={{ position: 'relative', border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden', width: 140 }}>
            {isVideo(img.filename)
              ? <video src={`${base}${img.url}`} style={{ width: 140, height: 100, objectFit: 'cover', display: 'block' }} muted />
              : <img src={`${base}${img.url}`} alt={img.filename} style={{ width: 140, height: 100, objectFit: 'cover', display: 'block' }} />
            }
            <div style={{ padding: '4px 6px', background: '#f9f9f9', fontSize: 11, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {img.filename.replace(/^\d+-/, '')}
            </div>
            <button onClick={() => del(img.filename)}
              style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 12 }}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
