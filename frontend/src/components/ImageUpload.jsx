import { useState, useRef, useEffect } from 'react';
import { Camera, MoveHorizontal, MoveVertical, Gauge, Image, Upload, Trash2, FileText } from 'lucide-react';
import ImageComponent from './Image';
import './ImageUpload.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ImageUpload({
    value,
    onChange,
    label = 'Gambar',
    disabled = false,
}) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(value || '');
    const [error, setError] = useState('');
    const [settings, setSettings] = useState({
        custom_filename: '',
        resize_width: '',
        resize_height: '',
        quality: 80,
        format: 'jpeg',
    });
    const fileInputRef = useRef(null);

    useEffect(() => {
        setPreview(value || '');
    }, [value]);

    function handleFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
            setError('');
        };
        reader.readAsDataURL(file);
    }

    function handleUpload() {
        const file = fileInputRef.current?.files?.[0];
        if (!file) return;

        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('custom_filename', settings.custom_filename || '');
        formData.append('resize_width', settings.resize_width || '');
        formData.append('resize_height', settings.resize_height || '');
        formData.append('quality', settings.quality);
        formData.append('format', settings.format);

        const token = localStorage.getItem('admin_token');

        fetch(`${API_BASE_URL}/upload/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        })
            .then(res => res.json().then(data => ({ status: res.status, data })))
            .then(({ data }) => {
                if (data.url) {
                    onChange(data.url);
                    setPreview(data.url);
                } else if (data.error) {
                    setError(data.error);
                    console.error('Upload error:', data.error);
                } else {
                    setError('Gagal upload gambar');
                }
                setUploading(false);
            })
            .catch(err => {
                console.error('Upload error:', err);
                setError('Gagal upload gambar: ' + (err.message || 'Network error'));
                setUploading(false);
            });
    }

    function handleRemove() {
        setPreview('');
        onChange('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    return (
        <div className="image-upload">
            {label && <label className="upload-label">{label}</label>}

            {error && <div className="upload-error">{error}</div>}

            <div className="upload-preview">
                {preview ? (
                    <ImageComponent src={preview} alt="Preview" />
                ) : (
                    <div className="upload-placeholder">
                        <Camera size={48} strokeWidth={1} />
                        <p>Belum ada gambar</p>
                    </div>
                )}
            </div>

            <div className="upload-controls">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={disabled || uploading}
                    className="upload-input"
                />

                <div className="upload-settings">
                    <div className="setting-group">
                        <label><FileText size={16} /> Nama File</label>
                        <input
                            type="text"
                            value={settings.custom_filename}
                            onChange={e => setSettings({ ...settings, custom_filename: e.target.value })}
                            placeholder="Otomatis dari nama file asli"
                        />
                    </div>
                    <div className="setting-group">
                        <label><MoveHorizontal size={16} /> Lebar (px)</label>
                        <input
                            type="number"
                            value={settings.resize_width}
                            onChange={e => setSettings({ ...settings, resize_width: e.target.value })}
                            placeholder="Otomatis"
                            min="0"
                        />
                    </div>
                    <div className="setting-group">
                        <label><MoveVertical size={16} /> Tinggi (px)</label>
                        <input
                            type="number"
                            value={settings.resize_height}
                            onChange={e => setSettings({ ...settings, resize_height: e.target.value })}
                            placeholder="Otomatis"
                            min="0"
                        />
                    </div>
                    <div className="setting-group">
                        <label><Gauge size={16} /> Kualitas (%)</label>
                        <input
                            type="number"
                            value={settings.quality}
                            onChange={e => setSettings({ ...settings, quality: parseInt(e.target.value) || 80 })}
                            min="1"
                            max="100"
                        />
                    </div>
                    <div className="setting-group">
                        <label><Image size={16} /> Format</label>
                        <select
                            value={settings.format}
                            onChange={e => setSettings({ ...settings, format: e.target.value })}
                        >
                            <option value="jpeg">JPEG</option>
                            <option value="png">PNG</option>
                            <option value="webp">WebP</option>
                        </select>
                    </div>
                </div>

                <div className="upload-actions">
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={!fileInputRef.current?.files?.[0] || uploading || disabled}
                        className="btn-upload"
                    >
                        {uploading ? 'Mengupload...' : <><Upload size={16} /> Upload</>}
                    </button>
                    {preview && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            disabled={disabled}
                            className="btn-remove"
                        >
                            <Trash2 size={16} /> Hapus
                        </button>
                    )}
                </div>
            </div>

            {value && (
                <div className="upload-url">
                    <label>URL Gambar:</label>
                    <input
                        type="text"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        disabled={disabled}
                    />
                </div>
            )}
        </div>
    );
}
