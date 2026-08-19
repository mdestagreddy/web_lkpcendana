import { useState, useRef } from 'react';
import ImageComponent from './Image';
import { Upload, Trash2, Plus } from 'lucide-react';
import './MultiImageUpload.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function MultiImageUpload({ value = [], onChange, label = 'Gambar', disabled = false }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const images = Array.isArray(value) ? value : [];

    function handleFileChange(e) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        uploadFiles(files);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    async function uploadFiles(files) {
        setUploading(true);
        setError('');
        const token = localStorage.getItem('admin_token');
        const uploaded = [];

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);

                const res = await fetch(`${API_BASE_URL}/upload/upload`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });

                const data = await res.json();
                if (!res.ok || !data.url) {
                    throw new Error(data.error || `Upload ${file.name} failed`);
                }
                uploaded.push(data.url);
            }

            onChange([...images, ...uploaded]);
        } catch (err) {
            console.error('Multi upload error:', err);
            setError(err.message || 'Gagal mengunggah gambar');
        } finally {
            setUploading(false);
        }
    }

    async function handleRemove(index) {
        const urlToRemove = images[index];
        const token = localStorage.getItem('admin_token');

        if (urlToRemove) {
            try {
                const res = await fetch(`${API_BASE_URL}/upload/upload`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url: urlToRemove }),
                });

                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error(data.error || `Gagal menghapus gambar (status ${res.status})`);
                }
            } catch (err) {
                console.error('Delete error:', err);
                setError(err.message || 'Gagal menghapus gambar');
                return;
            }
        }

        const next = images.filter((_, i) => i !== index);
        onChange(next);
    }

    function handleUrlAdd() {
        const url = prompt('Masukkan URL gambar:');
        if (url && url.trim()) {
            onChange([...images, url.trim()]);
        }
    }

    function handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOver(true);
        }
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOver(false);
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files || []);
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        if (imageFiles.length) {
            uploadFiles(imageFiles);
        }
    }

    function handleDragEnd() {
        setDragOver(false);
    }

    return (
        <div className="multi-image-upload">
            {label && <label className="upload-label">{label}</label>}
            {error && <div className="upload-error">{error}</div>}

            <div
                className={`upload-grid${dragOver ? ' drag-over' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
            >
                {images.map((url, idx) => (
                    <div key={idx} className="upload-thumb">
                        <ImageComponent src={url} alt={`Upload ${idx + 1}`} />
                        <button
                            type="button"
                            onClick={() => handleRemove(idx)}
                            disabled={disabled}
                            className="thumb-remove"
                            title="Hapus"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || uploading}
                    className="upload-add-btn"
                >
                    <Plus size={24} />
                    <span>{uploading ? 'Mengupload...' : 'Tambah Gambar'}</span>
                </button>
            </div>

            <div className="upload-actions-row">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || uploading}
                    className="btn-upload-secondary"
                >
                    <Upload size={16} /> Upload dari Komputer
                </button>
                <button
                    type="button"
                    onClick={handleUrlAdd}
                    disabled={disabled || uploading}
                    className="btn-upload-secondary"
                >
                    <Plus size={16} /> Tambah via URL
                </button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={disabled || uploading}
                className="upload-input-hidden"
            />

            {images.length > 0 && (
                <div className="upload-url-list">
                    <label>Daftar URL:</label>
                    <textarea
                        readOnly
                        value={images.join('\n')}
                        rows={Math.max(2, Math.min(images.length, 6))}
                        className="upload-url-textarea"
                    />
                </div>
            )}
        </div>
    );
}
