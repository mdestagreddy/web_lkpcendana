import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Plus, Save, X, Pencil, Trash2 } from 'lucide-react';
import TextEditor from '../../components/TextEditor';
import './AdminCRUD.css';

export default function AdminPosts() {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ title: '', slug: '', content: '', excerpt: '', featured_image: '', category_id: '', author_id: '', status: 'draft', published_at: '' });

    useEffect(() => {
        Promise.all([
            adminApi.posts.list(),
            adminApi.categories.list(),
        ]).then(([posts, cats]) => {
            setItems(posts);
            setCategories(cats);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    function handleSubmit(e) {
        e.preventDefault();
        setError('');
        if (!form.title.trim() || !form.slug.trim()) {
            setError('Judul dan slug harus diisi');
            return;
        }
        if (form.published_at && form.published_at.trim()) {
            const d = new Date(form.published_at);
            if (isNaN(d.getTime())) {
                setError('Format tanggal publikasi tidak valid. Gunakan YYYY-MM-DD atau format ISO 8601');
                return;
            }
        }
        setSubmitting(true);
        const promise = editing ? adminApi.posts.update(editing.id, form) : adminApi.posts.create(form);
        promise.then(load).then(() => {
            resetForm();
            setSubmitting(false);
        }).catch(err => {
            setError(err?.data?.error || err?.message || 'Gagal menyimpan postingan');
            setSubmitting(false);
        });
    }

    function load() {
        setLoading(true);
        adminApi.posts.list().then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false));
    }

    function resetForm() {
        setForm({ title: '', slug: '', content: '', excerpt: '', featured_image: '', category_id: '', author_id: '', status: 'draft', published_at: '' });
        setEditing(null);
    }

    function startEdit(item) {
        setEditing(item);
        setForm({
            title: item.title || '',
            slug: item.slug || '',
            content: item.content || '',
            excerpt: item.excerpt || '',
            featured_image: item.featured_image || '',
            category_id: item.category_id || '',
            author_id: item.author_id ?? '',
            status: item.status || 'draft',
            published_at: item.published_at || '',
        });
    }

    function handleDelete(id) {
        if (!confirm('Apakah Anda yakin?')) return;
        adminApi.posts.delete(id).then(load).catch(err => setError(err?.data?.error || err?.message || 'Gagal menghapus postingan'));
    }

    if (loading) return <div className="container"><p className="loading">Memuat...</p></div>;

    return (
        <div className="admin-crud">
            <h1>Artikel</h1>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit} className="crud-form">
                <div className="form-section">
                    <h3 className="form-section-title">Informasi Artikel</h3>
                    <div className="form-group">
                        <label htmlFor="title">Judul</label>
                        <input id="title" placeholder="Judul artikel" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="slug">Slug</label>
                        <input id="slug" placeholder="contoh: cara-belajar-coding" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="status">Status</label>
                        <select id="status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                            <option value="draft">Draf</option>
                            <option value="published">Dipublikasikan</option>
                            <option value="archived">Diarsipkan</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="published_at">Tanggal Publikasi</label>
                        <input id="published_at" placeholder="YYYY-MM-DD" value={form.published_at} onChange={e => setForm({ ...form, published_at: e.target.value })} />
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Konten &amp; Ringkasan</h3>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="content">Konten</label>
                        <TextEditor
                            id="content"
                            value={form.content}
                            onChange={content => setForm({ ...form, content })}
                            placeholder="Tulis konten artikel..."
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="excerpt">Ringkasan</label>
                        <input id="excerpt" placeholder="Ringkasan singkat" value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} />
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Klasifikasi &amp; Media</h3>
                    <div className="form-group">
                        <label htmlFor="category_id">Kategori</label>
                        <select id="category_id" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                            <option value="">Tanpa Kategori</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="author_id">ID Penulis</label>
                        <input id="author_id" type="number" placeholder="1" value={form.author_id} onChange={e => setForm({ ...form, author_id: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="featured_image">URL Gambar Unggulan</label>
                        <input id="featured_image" placeholder="https://..." value={form.featured_image} onChange={e => setForm({ ...form, featured_image: e.target.value })} />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={submitting}>{editing ? <><Save size={16} /> Perbarui</> : <><Plus size={16} /> Tambah</>}</button>
                    {editing && <button type="button" onClick={resetForm} className="btn btn-secondary"><X size={16} /> Batal</button>}
                </div>
            </form>
            {items.length === 0 && <p className="items-empty">Tidak ada data Artikel</p>}

            <div className={`items-list${items.length === 0 ? ' is-empty' : ''}`}>
                {items.map(item => (
                    <div key={item.id} className="generic-card">
                        <div className="generic-card-header">
                            <div className="generic-card-title">
                                <h3>{item.title}</h3>
                                <span className="generic-card-sub">{item.category_name || 'Tanpa kategori'} · {item.status}</span>
                            </div>
                            <div className="generic-card-actions">
                                <button onClick={() => startEdit(item)} className="btn btn-small btn-primary"><Pencil size={14} /> Edit</button>
                                <button onClick={() => handleDelete(item.id)} className="btn btn-small btn-danger"><Trash2 size={14} /> Hapus</button>
                            </div>
                        </div>
                        {(item.excerpt || item.content) && (
                            <p className="generic-card-desc">{item.excerpt || item.content}</p>
                        )}
                        <div className="generic-card-meta">
                            {item.published_at && <span className="meta-text">Publikasi: {new Date(item.published_at).toLocaleDateString('id-ID')}</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
