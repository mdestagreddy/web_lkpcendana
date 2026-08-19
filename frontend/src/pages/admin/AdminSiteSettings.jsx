import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import ImageUpload from '../../components/ImageUpload';
import { Plus, Save, X, Pencil } from 'lucide-react';
import './AdminCRUD.css';

export default function AdminSiteSettings() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ key_name: '', value: '' });
    const [imageSettings, setImageSettings] = useState({ logo_image: '', header_image: '', header_image_mobile: '', favicon: '' });
    const [savingKey, setSavingKey] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => { load(); }, []);

    function load() {
        setLoading(true);
        setError('');
        adminApi.siteSettings.list().then(data => {
            setItems(data);
            const imageMap = {};
            data.forEach(item => {
                if (item.key_name === 'logo_image' || item.key_name === 'header_image' || item.key_name === 'header_image_mobile' || item.key_name === 'favicon') {
                    imageMap[item.key_name] = item.value;
                }
            });
            setImageSettings(imageMap);
            setLoading(false);
        }).catch(err => {
            console.error('Failed to load site settings:', err);
            setError('Gagal memuat pengaturan situs');
            setLoading(false);
        });
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (editing) {
            adminApi.siteSettings.update(editing.key_name, { value: form.value })
                .then(() => {
                    load();
                    setEditing(null);
                    setForm({ key_name: '', value: '' });
                })
                .catch(err => {
                    console.error('Failed to update setting:', err);
                    setError('Gagal memperbarui pengaturan: ' + (err.message || 'Unknown error'));
                });
        } else {
            adminApi.siteSettings.update(form.key_name, { value: form.value })
                .then(() => {
                    load();
                    resetForm();
                })
                .catch(err => {
                    console.error('Failed to create setting:', err);
                    setError('Gagal membuat pengaturan: ' + (err.message || 'Unknown error'));
                });
        }
    }

    function handleImageChange(key, url) {
        setImageSettings({ ...imageSettings, [key]: url });
        setSavingKey(key);
        setError('');
        adminApi.siteSettings.update(key, { value: url })
            .then(() => {
                load();
            })
            .catch(err => {
                console.error('Failed to save image setting:', err);
                setError('Gagal menyimpan gambar: ' + (err.message || 'Unknown error'));
            })
            .finally(() => {
                setSavingKey(null);
            });
    }

    function resetForm() {
        setForm({ key_name: '', value: '' });
        setEditing(null);
    }

    function startEdit(item) {
        setEditing(item);
        setForm({ key_name: item.key_name, value: item.value });
    }

    if (loading) return <div className="container"><p className="loading">Memuat...</p></div>;

    const filteredSettings = items.filter(item => !['logo_image', 'header_image', 'header_image_mobile', 'favicon'].includes(item.key_name));

    return (
        <div className="admin-crud">
            <h1>Pengaturan Situs</h1>

            {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

            <div className="image-settings-section">
                <h2>Gambar Situs</h2>
                <div className="image-settings-grid">
                    <ImageUpload
                        label="Logo"
                        value={imageSettings.logo_image}
                        onChange={url => handleImageChange('logo_image', url)}
                    />
                    <ImageUpload
                        label="Favicon"
                        value={imageSettings.favicon}
                        onChange={url => handleImageChange('favicon', url)}
                    />
                    <ImageUpload
                        label="Gambar Header (Desktop)"
                        value={imageSettings.header_image}
                        onChange={url => handleImageChange('header_image', url)}
                    />
                    <ImageUpload
                        label="Gambar Header (Mobile)"
                        value={imageSettings.header_image_mobile}
                        onChange={url => handleImageChange('header_image_mobile', url)}
                    />
                </div>
                {savingKey && <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Menyimpan...</p>}
            </div>

            <div className="text-settings-section">
                <h2>Pengaturan Teks</h2>
                <form onSubmit={handleSubmit} className="crud-form">
                    <input placeholder="Kunci" value={form.key_name} onChange={e => setForm({ ...form, key_name: e.target.value })} required disabled={!!editing} />
                    <input placeholder="Nilai" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} required />
                    <button type="submit" className="btn btn-primary">{editing ? <><Save size={16} /> Perbarui</> : <><Plus size={16} /> Buat/Perbarui</>}</button>
                    {editing && <button type="button" onClick={resetForm} className="btn btn-secondary"><X size={16} /> Batal</button>}
                </form>
                {filteredSettings.length === 0 ? (
                    <p className="items-empty">Tidak ada data Pengaturan</p>
                ) : (
                    <div className="items-list">
                        {filteredSettings.map(item => (
                            <div key={item.id} className="generic-card">
                                <div className="generic-card-header">
                                    <div className="generic-card-title">
                                        <h3>{item.key_name}</h3>
                                        <span className="generic-card-sub">{item.value}</span>
                                    </div>
                                    <div className="generic-card-actions">
                                        <button onClick={() => startEdit(item)} className="btn btn-small btn-primary"><Pencil size={14} /> Edit</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
