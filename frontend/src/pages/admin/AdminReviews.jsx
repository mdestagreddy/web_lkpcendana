import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Plus, Save, X, Pencil, Trash2, Star, Calendar } from 'lucide-react';
import CustomCheckbox from '../../components/CustomCheckbox';
import MultiImageUpload from '../../components/MultiImageUpload';
import ImageLightbox from '../../components/ImageLightbox';
import './AdminCRUD.css';

export default function AdminReviews() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        nama: '',
        email: '',
        rating: 5,
        isi: '',
        images: [],
        is_active: true,
        created_at: '',
    });

    useEffect(() => { load(); }, []);

    function load() {
        setLoading(true);
        adminApi.reviews.list().then(data => {
            setItems(data);
            setLoading(false);
        }).catch(() => {
            setLoading(false);
        });
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (editing) {
            adminApi.reviews.update(editing.id, form).then(load).then(() => setEditing(null)).catch(() => {});
        } else {
            adminApi.reviews.create(form).then(load).then(() => resetForm()).catch(() => {});
        }
    }

    function resetForm() {
        setForm({ nama: '', email: '', rating: 5, isi: '', images: [], is_active: true, created_at: '' });
        setEditing(null);
    }

    function startEdit(item) {
        setEditing(item);
        let imagesArr = [];
        if (item.images) {
            if (Array.isArray(item.images)) {
                imagesArr = item.images;
            } else if (typeof item.images === 'string') {
                try { imagesArr = JSON.parse(item.images); } catch { imagesArr = []; }
            }
        }
        setForm({
            nama: item.nama || '',
            email: item.email || '',
            rating: item.rating || 5,
            isi: item.isi || '',
            images: imagesArr,
            is_active: item.is_active !== false,
            created_at: item.created_at ? new Date(item.created_at).toISOString().slice(0, 10) : '',
        });
    }

    function handleDelete(id) {
        if (!confirm('Apakah Anda yakin?')) return;
        adminApi.reviews.delete(id).then(load).catch(() => {});
    }

    if (loading) return <div className="container"><p className="loading">Memuat...</p></div>;

    function renderStars(rating, interactive = false) {
        return Array.from({ length: 5 }, (_, i) => (
            <button
                key={i}
                type={interactive ? 'button' : 'button'}
                className={`star-btn ${interactive ? 'interactive' : ''} ${i < rating ? 'filled' : ''}`}
                onClick={interactive ? () => setForm({ ...form, rating: i + 1 }) : undefined}
                disabled={!interactive}
            >
                <Star size={interactive ? 28 : 16} fill={i < rating ? 'currentColor' : 'none'} />
            </button>
        ));
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    return (
        <div className="admin-crud">
            <h1>Ulasan</h1>
            <form onSubmit={handleSubmit} className="crud-form">
                <div className="form-section">
                    <h3 className="form-section-title">Informasi Reviewer</h3>
                    <div className="form-group">
                        <label htmlFor="nama">Nama *</label>
                        <input id="nama" placeholder="Nama lengkap" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input id="email" type="email" placeholder="email@contoh.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="created_at">Tanggal Unggah</label>
                        <input id="created_at" type="date" value={form.created_at} onChange={e => setForm({ ...form, created_at: e.target.value })} />
                        <span className="form-help">Kosongkan untuk gunakan tanggal hari ini.</span>
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Ulasan & Rating</h3>
                    <div className="form-group">
                        <label>Rating</label>
                        <div className="star-rating">{renderStars(form.rating, true)}</div>
                        <span className="rating-label">{form.rating} / 5</span>
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="isi">Ulasan *</label>
                        <textarea id="isi" placeholder="Ketik ulasan di sini..." value={form.isi} onChange={e => setForm({ ...form, isi: e.target.value })} required rows={4} />
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Gambar &amp; Pengaturan</h3>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <MultiImageUpload
                            label="Gambar Ulasan"
                            value={form.images}
                            onChange={images => setForm({ ...form, images })}
                            disabled={false}
                        />
                    </div>
                    <div className="form-group">
                        <CustomCheckbox id="is_active" checked={form.is_active} onChange={is_active => setForm({ ...form, is_active })}>
                            Aktif (tampilkan di halaman publik)
                        </CustomCheckbox>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">{editing ? <><Save size={16} /> Perbarui</> : <><Plus size={16} /> Tambah</>}</button>
                    {editing && <button type="button" onClick={resetForm} className="btn btn-secondary"><X size={16} /> Batal</button>}
                </div>
            </form>
            {items.length === 0 && <p className="items-empty">Tidak ada data Ulasan</p>}

            <div className={`items-list${items.length === 0 ? ' is-empty' : ''}`}>
                {items.map(item => {
                    let imgs = [];
                    if (item.images) {
                        if (Array.isArray(item.images)) {
                            imgs = item.images;
                        } else if (typeof item.images === 'string') {
                            try { imgs = JSON.parse(item.images); } catch { imgs = []; }
                        }
                    }
                    return (
                        <div key={item.id} className="generic-card">
                            <div className="generic-card-header">
                                <div className="generic-card-title">
                                    <h3>{item.nama} <span className="generic-card-sub">⭐ {item.rating}/5</span></h3>
                                </div>
                                <div className="generic-card-actions">
                                    <button onClick={() => startEdit(item)} className="btn btn-small btn-primary"><Pencil size={14} /> Edit</button>
                                    <button onClick={() => handleDelete(item.id)} className="btn btn-small btn-danger"><Trash2 size={14} /> Hapus</button>
                                </div>
                            </div>
                            <p className="generic-card-desc">{item.isi}</p>
                            {imgs.length > 0 && (
                                <ImageLightbox items={imgs.map(url => ({ src: url, author: item.nama, text: item.isi }))} />
                            )}
                            <div className="generic-card-meta">
                                {imgs.length > 0 && <span className="badge badge-info">📷 {imgs.length} gambar</span>}
                                <span className={`badge badge-status ${item.is_active ? 'active' : 'inactive'}`}>{item.is_active ? 'Aktif' : 'Nonaktif'}</span>
                                {item.created_at && <span className="badge badge-date"><Calendar size={14} /> {formatDate(item.created_at)}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
