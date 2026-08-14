import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import ImageUpload from '../../components/ImageUpload';
import { Plus, Save, X, Pencil, Trash2, User } from 'lucide-react';
import CustomCheckbox from '../../components/CustomCheckbox';
import './AdminCRUD.css';

export default function AdminTestimonials() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ nama: '', lokasi: '', isi: '', foto: '', is_featured: false, sort_order: 0, is_active: true });

    useEffect(() => { load(); }, []);

    function load() {
        setLoading(true);
        adminApi.testimonials.list().then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false));
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (editing) {
            adminApi.testimonials.update(editing.id, form).then(load).then(() => setEditing(null)).catch(() => {});
        } else {
            adminApi.testimonials.create(form).then(load).then(() => resetForm()).catch(() => {});
        }
    }

    function resetForm() {
        setForm({ nama: '', lokasi: '', isi: '', foto: '', is_featured: false, sort_order: 0, is_active: true });
        setEditing(null);
    }

    function startEdit(item) {
        setEditing(item);
        setForm(item);
    }

    function handleDelete(id) {
        if (!confirm('Apakah Anda yakin?')) return;
        adminApi.testimonials.delete(id).then(load).catch(() => {});
    }

    if (loading) return <div className="container"><p>Memuat...</p></div>;

    return (
        <div className="admin-crud">
            <h1>Testimoni</h1>
            <form onSubmit={handleSubmit} className="crud-form">
                <div className="form-section">
                    <h3 className="form-section-title">Informasi Testimoni</h3>
                    <div className="form-group">
                        <label htmlFor="nama">Nama</label>
                        <input id="nama" placeholder="Nama lengkap" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="lokasi">Lokasi</label>
                        <input id="lokasi" placeholder="Kota, Provinsi" value={form.lokasi} onChange={e => setForm({ ...form, lokasi: e.target.value })} />
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Isi &amp; Foto</h3>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="isi">Testimoni</label>
                        <textarea id="isi" placeholder="Ketik testimoni di sini..." value={form.isi} onChange={e => setForm({ ...form, isi: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Foto</label>
                        <ImageUpload
                            label="URL Foto"
                            value={form.foto}
                            onChange={url => setForm({ ...form, foto: url })}
                        />
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Pengaturan</h3>
                    <div className="form-group">
                        <CustomCheckbox id="is_featured" checked={form.is_featured} onChange={is_featured => setForm({ ...form, is_featured })}>
                            Unggulan
                        </CustomCheckbox>
                    </div>
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
            <div className="items-list">
                {items.map(item => (
                    <div key={item.id} className="generic-card">
                        <div className="generic-card-header">
                            <div className="generic-card-title">
                                <div className="admin-testimonial-header">
                                    {item.foto ? (
                                        <img src={item.foto} alt={item.nama} className="admin-testimonial-photo" />
                                    ) : (
                                        <div className="admin-testimonial-avatar"><User size={20} /></div>
                                    )}
                                    <div>
                                        <h3>{item.nama} <span className="generic-card-sub">{item.lokasi}</span></h3>
                                    </div>
                                </div>
                            </div>
                            <div className="generic-card-actions">
                                <button onClick={() => startEdit(item)} className="btn btn-small btn-primary"><Pencil size={14} /> Edit</button>
                                <button onClick={() => handleDelete(item.id)} className="btn btn-small btn-danger"><Trash2 size={14} /> Hapus</button>
                            </div>
                        </div>
                        <p className="generic-card-desc">{item.isi}</p>
                        <div className="generic-card-meta">
                            {item.is_featured && <span className="badge badge-featured">Unggulan</span>}
                            <span className={`badge badge-status ${item.is_active ? 'active' : 'inactive'}`}>{item.is_active ? 'Aktif' : 'Nonaktif'}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
