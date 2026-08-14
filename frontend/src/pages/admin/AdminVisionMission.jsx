import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Plus, Save, X, Pencil, Trash2 } from 'lucide-react';
import './AdminCRUD.css';

export default function AdminVisionMission() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ type: 'vision', content: '', sort_order: 0 });

    useEffect(() => { load(); }, []);

    function load() {
        setLoading(true);
        adminApi.visionMission.list().then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false));
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (editing) {
            adminApi.visionMission.update(editing.id, form).then(load).then(() => setEditing(null)).catch(() => {});
        } else {
            adminApi.visionMission.create(form).then(load).then(() => resetForm()).catch(() => {});
        }
    }

    function resetForm() {
        setForm({ type: 'vision', content: '', sort_order: 0 });
        setEditing(null);
    }

    function startEdit(item) {
        setEditing(item);
        setForm(item);
    }

    function handleDelete(id) {
        if (!confirm('Apakah Anda yakin?')) return;
        adminApi.visionMission.delete(id).then(load).catch(() => {});
    }

    if (loading) return <div className="container"><p className="loading">Memuat...</p></div>;

    return (
        <div className="admin-crud">
            <h1>Visi &amp; Misi</h1>
            <form onSubmit={handleSubmit} className="crud-form">
                <div className="form-section">
                    <h3 className="form-section-title">Konten</h3>
                    <div className="form-group">
                        <label htmlFor="type">Tipe</label>
                        <select id="type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                            <option value="vision">Visi</option>
                            <option value="mission">Misi</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="content">Konten</label>
                        <textarea id="content" placeholder="Tulis visi atau misi..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required />
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
                                <h3>{item.type === 'vision' ? 'Visi' : 'Misi'}</h3>
                                <span className="generic-card-sub">Urutan: {item.sort_order}</span>
                            </div>
                            <div className="generic-card-actions">
                                <button onClick={() => startEdit(item)} className="btn btn-small btn-primary"><Pencil size={14} /> Edit</button>
                                <button onClick={() => handleDelete(item.id)} className="btn btn-small btn-danger"><Trash2 size={14} /> Hapus</button>
                            </div>
                        </div>
                        <p className="generic-card-desc">{item.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
