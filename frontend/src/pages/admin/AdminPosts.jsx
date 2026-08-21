import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Plus, Save, X, Pencil, Trash2 } from 'lucide-react';
import TextEditor from '../../components/TextEditor';
import Image from '../../components/Image';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormField from '../../components/FormField';
import './AdminCRUD.css';

export default function AdminPosts() {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ title: '', slug: '', content: '', excerpt: '', featured_image: '', category_id: '', author_id: '', status: 'draft', published_at: '' });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

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
        setDeleteDialog({ open: true, id });
    }

    function confirmDelete() {
        if (deleteDialog.id) {
            adminApi.posts.delete(deleteDialog.id).then(load).catch(err => setError(err?.data?.error || err?.message || 'Gagal menghapus postingan'));
        }
        setDeleteDialog({ open: false, id: null });
    }

    if (loading) return <div className="container"><LoadingSpinner /></div>;

    return (
        <div className="admin-crud">
            <h1>Artikel</h1>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit} className="crud-form">
                <div className="form-section">
                    <h3 className="form-section-title">Informasi Artikel</h3>
                    <FormField id="title" label="Judul" value={form.title} onChange={title => setForm({ ...form, title })} placeholder="Judul artikel" required />
                    <FormField id="slug" label="Slug" value={form.slug} onChange={slug => setForm({ ...form, slug })} placeholder="contoh: cara-belajar-coding" required />
                    <FormField id="status" label="Status" type="select" value={form.status} onChange={status => setForm({ ...form, status })} options={[
                        { value: 'draft', label: 'Draf' },
                        { value: 'published', label: 'Dipublikasikan' },
                        { value: 'archived', label: 'Diarsipkan' },
                    ]} />
                    <FormField id="published_at" label="Tanggal Publikasi" value={form.published_at} onChange={published_at => setForm({ ...form, published_at })} placeholder="YYYY-MM-DD" />
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
                    <FormField id="excerpt" label="Ringkasan" value={form.excerpt} onChange={excerpt => setForm({ ...form, excerpt })} placeholder="Ringkasan singkat" />
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Klasifikasi &amp; Media</h3>
                    <FormField id="category_id" label="Kategori" type="select" value={form.category_id} onChange={category_id => setForm({ ...form, category_id })} options={[
                        { value: '', label: 'Tanpa Kategori' },
                        ...categories.map(cat => ({ value: cat.id, label: cat.name })),
                    ]} />
                    <FormField id="author_id" label="ID Penulis" type="number" value={form.author_id} onChange={author_id => setForm({ ...form, author_id })} placeholder="1" />
                    <FormField id="featured_image" label="URL Gambar Unggulan" value={form.featured_image} onChange={featured_image => setForm({ ...form, featured_image })} placeholder="https://..." />
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
                        <div className="admin-post-thumb">
                            {item.featured_image ? (
                                <Image src={item.featured_image} alt={item.title} />
                            ) : (
                                <div className="admin-post-thumb-placeholder">Tidak ada gambar</div>
                            )}
                        </div>
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
            <ConfirmDialog
                open={deleteDialog.open}
                message="Apakah Anda yakin ingin menghapus postingan ini?"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteDialog({ open: false, id: null })}
            />
        </div>
    );
}
