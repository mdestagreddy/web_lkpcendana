import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import ImageUpload from '../../components/ImageUpload';
import { Plus, Save, X, Pencil, Trash2 } from 'lucide-react';
import './AdminCRUD.css';

export default function AdminOrgChart() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ nama: '', role: '', parent_id: '', foto: '', sort_order: 0 });

    useEffect(() => { load(); }, []);

    function load() {
        setLoading(true);
        adminApi.orgChart.list().then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false));
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (editing) {
            adminApi.orgChart.update(editing.id, form).then(load).then(() => setEditing(null)).catch(() => {});
        } else {
            adminApi.orgChart.create(form).then(load).then(() => resetForm()).catch(() => {});
        }
    }

    function resetForm() {
        setForm({ nama: '', role: '', parent_id: '', foto: '', sort_order: 0 });
        setEditing(null);
    }

    function startEdit(item) {
        setEditing(item);
        setForm(item);
    }

    function handleDelete(id) {
        if (!confirm('Apakah Anda yakin?')) return;
        adminApi.orgChart.delete(id).then(load).catch(() => {});
    }

    if (loading) return <div className="container"><p className="loading">Memuat...</p></div>;

    return (
        <div className="admin-crud">
            <h1>Struktur Organisasi</h1>
            <form onSubmit={handleSubmit} className="crud-form">
                <div className="form-section">
                    <h3 className="form-section-title">Informasi Anggota</h3>
                    <div className="form-group">
                        <label htmlFor="nama">Nama</label>
                        <input id="nama" placeholder="Nama lengkap" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="role">Peran / Jabatan</label>
                        <input id="role" placeholder="contoh: Ketua, Sekretaris" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="parent_id">ID Induk</label>
                        <input id="parent_id" type="number" placeholder="Kosongkan jika tidak ada induk" value={form.parent_id} onChange={e => setForm({ ...form, parent_id: e.target.value })} />
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Foto &amp; Urutan</h3>
                    <div className="form-group">
                        <label>Foto</label>
                        <ImageUpload
                            label="URL Foto"
                            value={form.foto}
                            onChange={url => setForm({ ...form, foto: url })}
                        />
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
            {items.length === 0 && <p className="items-empty">Tidak ada data Organisasi</p>}

            <div className={`items-list${items.length === 0 ? ' is-empty' : ''}`}>
                {items.map(item => (
                    <div key={item.id} className="generic-card">
                        <div className="generic-card-header">
                            <div className="generic-card-title">
                                <h3>{item.nama}</h3>
                                <span className="generic-card-sub">{item.role || 'Tanpa jabatan'}</span>
                            </div>
                            <div className="generic-card-actions">
                                <button onClick={() => startEdit(item)} className="btn btn-small btn-primary"><Pencil size={14} /> Edit</button>
                                <button onClick={() => handleDelete(item.id)} className="btn btn-small btn-danger"><Trash2 size={14} /> Hapus</button>
                            </div>
                        </div>
                        <div className="generic-card-meta">
                            <span className="meta-text">ID Induk: {item.parent_id || 'Tidak Ada'}</span>
                            <span className="meta-text">Urutan: {item.sort_order}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
