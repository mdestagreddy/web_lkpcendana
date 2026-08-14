import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import ImageUpload from '../../components/ImageUpload';
import { Plus, Save, X, Pencil, Trash2 } from 'lucide-react';
import { FaFacebook, FaInstagram, FaYoutube } from 'react-icons/fa';
import { SiX } from 'react-icons/si';
import CustomCheckbox from '../../components/CustomCheckbox';
import './AdminCRUD.css';

export default function AdminInstructors() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ nama: '', slug: '', role: '', bio: '', foto: '', facebook_url: '', twitter_url: '', instagram_url: '', youtube_url: '', sort_order: 0, is_active: true });

    useEffect(() => { load(); }, []);

    function load() {
        setLoading(true);
        adminApi.instructors.list().then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false));
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (editing) {
            adminApi.instructors.update(editing.id, form).then(load).then(() => setEditing(null)).catch(() => { });
        } else {
            adminApi.instructors.create(form).then(load).then(() => resetForm()).catch(() => { });
        }
    }

    function resetForm() {
        setForm({ nama: '', slug: '', role: '', bio: '', foto: '', facebook_url: '', twitter_url: '', instagram_url: '', youtube_url: '', sort_order: 0, is_active: true });
        setEditing(null);
    }

    function startEdit(item) {
        setEditing(item);
        setForm(item);
    }

    function handleDelete(id) {
        if (!confirm('Apakah Anda yakin?')) return;
        adminApi.instructors.delete(id).then(load).catch(() => { });
    }

    if (loading) return <div className="container"><p className="loading">Memuat...</p></div>;

    return (
        <div className="admin-crud">
            <h1>Instruktur</h1>
            <form onSubmit={handleSubmit} className="crud-form">
                <div className="form-section">
                    <h3 className="form-section-title">Informasi Dasar</h3>
                    <div className="form-group">
                        <label htmlFor="nama">Nama</label>
                        <input id="nama" placeholder="Nama lengkap" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="slug">Slug</label>
                        <input id="slug" placeholder="contoh: john-doe" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="role">Peran</label>
                        <input id="role" placeholder="contoh: Instruktur Senior" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Biografi &amp; Foto</h3>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="bio">Biografi</label>
                        <textarea id="bio" placeholder="Deskripsi singkat tentang instruktur" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
                    </div>
                    <div className="form-group instructor-image-upload">
                        <label>Foto Instruktur</label>
                        <ImageUpload
                            label="URL Foto"
                            value={form.foto}
                            onChange={url => setForm({ ...form, foto: url })}
                        />
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Media Sosial</h3>
                <div className="form-group">
                    <label htmlFor="facebook_url"><FaFacebook size={16} /> Facebook</label>
                    <input id="facebook_url" className="url-input" placeholder="https://facebook.com/username" value={form.facebook_url} onChange={e => setForm({ ...form, facebook_url: e.target.value })} />
                </div>
                <div className="form-group">
                    <label htmlFor="twitter_url"><SiX size={16} /> X</label>
                    <input id="twitter_url" className="url-input" placeholder="https://x.com/username" value={form.twitter_url} onChange={e => setForm({ ...form, twitter_url: e.target.value })} />
                </div>
                <div className="form-group">
                    <label htmlFor="instagram_url"><FaInstagram size={16} /> Instagram</label>
                    <input id="instagram_url" className="url-input" placeholder="https://instagram.com/username" value={form.instagram_url} onChange={e => setForm({ ...form, instagram_url: e.target.value })} />
                </div>
                <div className="form-group">
                    <label htmlFor="youtube_url"><FaYoutube size={16} /> YouTube</label>
                    <input id="youtube_url" className="url-input" placeholder="https://youtube.com/@username" value={form.youtube_url} onChange={e => setForm({ ...form, youtube_url: e.target.value })} />
                </div>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Pengaturan</h3>
                    <div className="form-group">
                        <label htmlFor="sort_order">Urutan</label>
                        <input id="sort_order" type="number" placeholder="0" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="form-group">
                        <CustomCheckbox id="is_active" checked={form.is_active} onChange={is_active => setForm({ ...form, is_active })}>
                            Aktif
                        </CustomCheckbox>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">{editing ? <><Save size={16} /> Perbarui</> : <><Plus size={16} /> Tambah</>}</button>
                    {(editing || form.nama || form.slug) && <button type="button" onClick={resetForm} className="btn btn-secondary"><X size={16} /> Batal</button>}
                </div>
            </form>
            <div className="items-list">
                {items.map(item => (
                    <div key={item.id} className="generic-card">
                        <div className="generic-card-header">
                            <div className="generic-card-title">
                                <h3>{item.nama}</h3>
                                <span className="generic-card-sub">{item.role || 'Tanpa peran'}</span>
                            </div>
                            <div className="generic-card-actions">
                                <button onClick={() => startEdit(item)} className="btn btn-small btn-primary"><Pencil size={14} /> Edit</button>
                                <button onClick={() => handleDelete(item.id)} className="btn btn-small btn-danger"><Trash2 size={14} /> Hapus</button>
                            </div>
                        </div>
                        <div className="generic-card-meta">
                            {item.bio && <span className="meta-text">{item.bio}</span>}
                        </div>
                        {(item.facebook_url || item.twitter_url || item.instagram_url || item.youtube_url) && (
                            <div className="generic-card-links">
                                {item.facebook_url && <span className="link-pill">Facebook</span>}
                                {item.twitter_url && <span className="link-pill">X</span>}
                                {item.instagram_url && <span className="link-pill">Instagram</span>}
                                {item.youtube_url && <span className="link-pill">YouTube</span>}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
