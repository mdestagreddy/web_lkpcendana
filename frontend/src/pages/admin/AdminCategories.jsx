import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Plus, Save, X, Pencil, Trash2 } from 'lucide-react';
import './AdminCRUD.css';

export default function AdminCategories() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', slug: '', description: '' });

    useEffect(() => { load(); }, []);

    function load() {
        setLoading(true);
        adminApi.categories.list().then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false));
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (editing) {
            adminApi.categories.update(editing.id, form).then(load).then(() => setEditing(null)).catch(() => {});
        } else {
            adminApi.categories.create(form).then(load).then(() => resetForm()).catch(() => {});
        }
    }

    function resetForm() {
        setForm({ name: '', slug: '', description: '' });
        setEditing(null);
    }

    function startEdit(item) {
        setEditing(item);
        setForm(item);
    }

    function handleDelete(id) {
        if (!confirm('Apakah Anda yakin?')) return;
        adminApi.categories.delete(id).then(load).catch(() => {});
    }

    if (loading) return <div className="container"><p>Memuat...</p></div>;

    return (
        <div className="admin-crud">
            <h1>Kategori</h1>
            <form onSubmit={handleSubmit} className="crud-form">
                <div className="form-section">
                    <h3 className="form-section-title">Informasi Kategori</h3>
                    <div className="form-group">
                        <label htmlFor="name">Nama</label>
                        <input id="name" placeholder="Nama kategori" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="slug">Slug</label>
                        <input id="slug" placeholder="contoh: teknologi" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Deskripsi</label>
                        <input id="description" placeholder="Deskripsi singkat" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
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
                                <h3>{item.name}</h3>
                                <span className="generic-card-sub">/{item.slug}</span>
                            </div>
                            <div className="generic-card-actions">
                                <button onClick={() => startEdit(item)} className="btn btn-small btn-primary"><Pencil size={14} /> Edit</button>
                                <button onClick={() => handleDelete(item.id)} className="btn btn-small btn-danger"><Trash2 size={14} /> Hapus</button>
                            </div>
                        </div>
                        {item.description && <p className="generic-card-desc">{item.description}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}
