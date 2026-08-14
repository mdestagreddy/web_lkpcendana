import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Plus, Save, X, Pencil, Trash2 } from 'lucide-react';
import './AdminCRUD.css';

export default function AdminUsers() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ nama: '', email: '', password: '', role: 'admin', avatar: '' });

    useEffect(() => { load(); }, []);

    function load() {
        setLoading(true);
        adminApi.users.list().then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false));
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (editing) {
            adminApi.users.update(editing.id, form).then(load).then(() => setEditing(null)).catch(() => {});
        } else {
            adminApi.users.create(form).then(load).then(() => resetForm()).catch(() => {});
        }
    }

    function resetForm() {
        setForm({ nama: '', email: '', password: '', role: 'admin', avatar: '' });
        setEditing(null);
    }

    function startEdit(item) {
        setEditing(item);
        setForm({ nama: item.nama, email: item.email, password: '', role: item.role, avatar: item.avatar || '' });
    }

    function handleDelete(id) {
        if (!confirm('Apakah Anda yakin?')) return;
        adminApi.users.delete(id).then(load).catch(() => {});
    }

    if (loading) return <div className="container"><p>Memuat...</p></div>;

    return (
        <div className="admin-crud">
            <h1>Pengguna</h1>
            <form onSubmit={handleSubmit} className="crud-form">
                <div className="form-section">
                    <h3 className="form-section-title">Informasi Akun</h3>
                    <div className="form-group">
                        <label htmlFor="nama">Nama</label>
                        <input id="nama" placeholder="Nama lengkap" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input id="email" type="email" placeholder="nama@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Kata Sandi</label>
                        <input id="password" type="password" placeholder={editing ? 'Kosongkan jika tidak diubah' : 'Kata sandi'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editing} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="role">Peran</label>
                        <select id="role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                            <option value="admin">Admin</option>
                            <option value="superadmin">Superadmin</option>
                        </select>
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Profil</h3>
                    <div className="form-group">
                        <label htmlFor="avatar">URL Avatar</label>
                        <input id="avatar" placeholder="https://..." value={form.avatar} onChange={e => setForm({ ...form, avatar: e.target.value })} />
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
                                <h3>{item.nama}</h3>
                                <span className="generic-card-sub">{item.email}</span>
                            </div>
                            <div className="generic-card-actions">
                                <button onClick={() => startEdit(item)} className="btn btn-small btn-primary"><Pencil size={14} /> Edit</button>
                                <button onClick={() => handleDelete(item.id)} className="btn btn-small btn-danger"><Trash2 size={14} /> Hapus</button>
                            </div>
                        </div>
                        <div className="generic-card-meta">
                            <span className={`badge badge-status ${item.role === 'superadmin' ? 'active' : 'inactive'}`}>{item.role}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
