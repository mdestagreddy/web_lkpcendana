import { useState, useRef, useEffect } from 'react';
import { Camera, MoveHorizontal, MoveVertical, Gauge, Image, Upload, Trash2, FileText } from 'lucide-react';
import FlexIcon from './FlexIcon';
import ImageComponent from './Image';
import { compressImage } from '../utils/imageCompress';
import './ImageUpload.css';
import './FormField.css';

const API_BASE_URL = import.meta.env.VITE_BACKEND || 'http://localhost:5000';

export default function ImageUpload({
    value,
    onChange,
    label = 'Gambar',
    disabled = false,
}) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(value || '');
    const [error, setError] = useState('');
    const [dragOver, setDragOver] = useState(false);
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

    async function handleUpload() {
        const file = fileInputRef.current?.files?.[0];
        if (!file) return;

        setUploading(true);
        setError('');

        try {
            const format = settings.format || 'jpeg';
            const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;
            const fileToUpload = await compressImage(file, {
                maxWidth: 1920,
                maxHeight: 1920,
                maxSizeBytes: 4.5 * 1024 * 1024,
                mimeType: mimeType,
            });
            const formData = new FormData();
            formData.append('file', fileToUpload);
            formData.append('custom_filename', settings.custom_filename || '');
            formData.append('resize_width', settings.resize_width || '');
            formData.append('resize_height', settings.resize_height || '');
            formData.append('quality', settings.quality);
            formData.append('format', format);

            const token = localStorage.getItem('admin_token');

            const res = await fetch(`${API_BASE_URL}/api/upload/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            if (data.url) {
                onChange(data.url);
                setPreview(data.url);
            } else {
                setError('Gagal upload gambar');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError('Gagal upload gambar: ' + (err.message || 'Network error'));
        } finally {
            setUploading(false);
        }
    }

    async function handleRemove() {
        const currentUrl = preview;
        const token = localStorage.getItem('admin_token');

        if (currentUrl) {
            try {
                const res = await fetch(`${API_BASE_URL}/api/upload/upload`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url: currentUrl }),
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

        setPreview('');
        onChange('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
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
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
                setError('');
            };
            reader.readAsDataURL(file);
            if (fileInputRef.current) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInputRef.current.files = dataTransfer.files;
            }
        }
    }

    function handleDragEnd() {
        setDragOver(false);
    }

    return (
        <div className="image-upload">
            {label && <label className="upload-label">{label}</label>}

            {error && <div className="upload-error">{error}</div>}

            <div
                className={`upload-preview${dragOver ? ' drag-over' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
            >
                {preview ? (
                    <ImageComponent src={preview} alt="Preview" />
                ) : (
                    <div className="upload-placeholder">
                        <FlexIcon Icon={Camera} size={48} strokeWidth={1} />
                        <p>Belum ada gambar</p>
                        <p className="upload-drag-hint">Drag & drop gambar di sini</p>
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
                        <label><FlexIcon Icon={FileText} size={16}>Nama File</FlexIcon></label>
                        <input
                            type="text"
                            value={settings.custom_filename}
                            onChange={e => setSettings({ ...settings, custom_filename: e.target.value })}
                            placeholder="Otomatis dari nama file asli"
                        />
                    </div>
                    <div className="setting-group">
                        <label><FlexIcon Icon={MoveHorizontal} size={16}>Lebar (px)</FlexIcon></label>
                        <input
                            type="number"
                            value={settings.resize_width}
                            onChange={e => setSettings({ ...settings, resize_width: e.target.value })}
                            placeholder="Otomatis"
                            min="0"
                        />
                    </div>
                    <div className="setting-group">
                        <label><FlexIcon Icon={MoveVertical} size={16}>Tinggi (px)</FlexIcon></label>
                        <input
                            type="number"
                            value={settings.resize_height}
                            onChange={e => setSettings({ ...settings, resize_height: e.target.value })}
                            placeholder="Otomatis"
                            min="0"
                        />
                    </div>
                    <div className="setting-group">
                        <label><FlexIcon Icon={Gauge} size={16}>Kualitas (%)</FlexIcon></label>
                        <input
                            type="number"
                            value={settings.quality}
                            onChange={e => setSettings({ ...settings, quality: parseInt(e.target.value) || 80 })}
                            min="1"
                            max="100"
                        />
                    </div>
                    <div className="setting-group">
                        <label><FlexIcon Icon={Image} size={16}>Format</FlexIcon></label>
                        <select
                            value={settings.format}
                            onChange={e => setSettings({ ...settings, format: e.target.value })}
                            className="form-field-input"
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
                            {uploading ? 'Mengupload...' : <><FlexIcon Icon={Upload} size={16}>Upload</FlexIcon></>}
                    </button>
                    {preview && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            disabled={disabled}
                            className="btn-remove"
                        >
                            <FlexIcon Icon={Trash2} size={16}>Hapus</FlexIcon>
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
