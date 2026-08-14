import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import ImageUpload from '../../components/ImageUpload';
import Image from '../../components/Image';
import { Plus, Save, X, Pencil, Trash2 } from 'lucide-react';
import CustomCheckbox from '../../components/CustomCheckbox';
import './AdminCRUD.css';

export default function AdminGallery() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ kategori: '', caption: '', image_url: '', thumbnail_url: '', alt_text: '', sort_order: 0, is_active: true });
    const [brokenImages, setBrokenImages] = useState({});

    useEffect(() => { load(); }, []);

    function load() {
        setLoading(true);
        adminApi.gallery.list().then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false));
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (editing) {
            adminApi.gallery.update(editing.id, form).then(load).then(() => setEditing(null)).catch(() => {});
        } else {
            adminApi.gallery.create(form).then(load).then(() => resetForm()).catch(() => {});
        }
    }

    function resetForm() {
        setForm({ kategori: '', caption: '', image_url: '', thumbnail_url: '', alt_text: '', sort_order: 0, is_active: true });
        setEditing(null);
    }

    function startEdit(item) {
        setEditing(item);
        setForm(item);
    }

    function handleDelete(id) {
        if (!confirm('Apakah Anda yakin?')) return;
        adminApi.gallery.delete(id).then(load).catch(() => {});
    }

    if (loading) return <div className="container"><p className="loading">Memuat...</p></div>;

    return (
        <div className="admin-crud">
            <h1>Galeri</h1>
            <form onSubmit={handleSubmit} className="crud-form">
                <div className="form-section">
                    <h3 className="form-section-title">Informasi Galeri</h3>
                    <div className="form-group">
                        <label htmlFor="kategori">Kategori</label>
                        <input id="kategori" placeholder="contoh: Acara, Fasilitas" value={form.kategori} onChange={e => setForm({ ...form, kategori: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="caption">Keterangan</label>
                        <input id="caption" placeholder="Deskripsi singkat gambar" value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })} />
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Media</h3>
                    <div className="form-group">
                        <label>Gambar Utama</label>
                        <ImageUpload
                            label="URL Gambar"
                            value={form.image_url}
                            onChange={url => setForm({ ...form, image_url: url })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Thumbnail</label>
                        <ImageUpload
                            label="URL Thumbnail"
                            value={form.thumbnail_url}
                            onChange={url => setForm({ ...form, thumbnail_url: url })}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="alt_text">Teks Alt</label>
                        <input id="alt_text" placeholder="Deskripsi untuk aksesibilitas" value={form.alt_text} onChange={e => setForm({ ...form, alt_text: e.target.value })} />
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Pengaturan</h3>
                    <div className="form-group">
                        <CustomCheckbox id="is_active" checked={form.is_active} onChange={is_active => setForm({ ...form, is_active })}>
                            Aktif
                        </CustomCheckbox>
                    </div>
                    <div className="form-group">
                        <label htmlFor="sort_order">Urutan</label>
                        <input id="sort_order" type="number" placeholder="0" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">{editing ? <><Save size={16} /> Perbarui</> : <><Plus size={16} /> Tambah</>}</button>
                    {editing && <button type="button" onClick={resetForm} className="btn btn-secondary"><X size={16} /> Batal</button>}
                </div>
            </form>
            <div className="items-list gallery-grid">
                {items.map(item => (
                    <div key={item.id} className="gallery-card">
                        <div className="gallery-card-preview">
                            {brokenImages[item.id] ? (
                                <div className="gallery-placeholder">Tidak ada gambar</div>
                            ) : item.image_url ? (
                                <Image src={item.image_url} alt={item.alt_text || item.caption || 'Galeri'} loading="lazy" onError={() => setBrokenImages(prev => ({ ...prev, [item.id]: true }))} />
                            ) : (
                                <div className="gallery-placeholder">Tidak ada gambar</div>
                            )}
                        </div>
                        <div className="gallery-card-body">
                            <h3>{item.caption || 'Tanpa keterangan'}</h3>
                            <p>{item.kategori}</p>
                            <div className="generic-card-actions">
                                <button onClick={() => startEdit(item)} className="btn btn-small btn-primary"><Pencil size={14} /> Edit</button>
                                <button onClick={() => handleDelete(item.id)} className="btn btn-small btn-danger"><Trash2 size={14} /> Hapus</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
