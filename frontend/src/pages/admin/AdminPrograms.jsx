import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import ImageUpload from '../../components/ImageUpload';
import { Plus, Save, X, Pencil, Trash2, ClipboardList } from 'lucide-react';
import CustomCheckbox from '../../components/CustomCheckbox';
import './AdminCRUD.css';

export default function AdminPrograms() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ title: '', slug: '', category: '', level: 'Pemula', duration_minutes: 0, description: '', type: 'offline', is_featured: false, is_active: true, sort_order: 0, image_url: '' });
    const [modules, setModules] = useState({});
    const [newModule, setNewModule] = useState({});

    useEffect(() => {
        load();
    }, []);

    function load() {
        setLoading(true);
        adminApi.programs.list().then(data => {
            setItems(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (editing) {
            adminApi.programs.update(editing.id, form).then(load).then(() => setEditing(null)).catch(() => {});
        } else {
            adminApi.programs.create(form).then(load).then(() => resetForm()).catch(() => {});
        }
    }

    function resetForm() {
        setForm({ title: '', slug: '', category: '', level: 'Pemula', duration_minutes: 0, description: '', type: 'offline', is_featured: false, is_active: true, sort_order: 0, image_url: '' });
        setEditing(null);
    }

    function startEdit(item) {
        setEditing(item);
        setForm(item);
    }

    function handleDelete(id) {
        if (!confirm('Apakah Anda yakin?')) return;
        adminApi.programs.delete(id).then(load).catch(() => {});
    }

    function addModule(programId) {
        if (!newModule[programId]?.name) return;
        adminApi.programModules.create(programId, newModule[programId]).then(() => {
            setNewModule({ ...newModule, [programId]: { name: '' } });
            load();
        }).catch(() => {});
    }

    function deleteModule(programId, moduleId) {
        adminApi.programModules.delete(programId, moduleId).then(load).catch(() => {});
    }

    function loadModules(programId) {
        adminApi.programModules.list(programId).then(data => {
            setModules({ ...modules, [programId]: data });
        }).catch(() => {});
    }

    if (loading) return <div className="container"><p className="loading">Memuat...</p></div>;

    return (
        <div className="admin-crud">
            <h1>Program</h1>
            <form onSubmit={handleSubmit} className="crud-form">
                <div className="form-section">
                    <h3 className="form-section-title">Informasi Program</h3>
                    <div className="form-group">
                        <label htmlFor="title">Judul</label>
                        <input id="title" placeholder="Judul program" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="slug">Slug</label>
                        <input id="slug" placeholder="contoh: program-web-development" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="category">Kategori</label>
                        <input id="category" placeholder="contoh: Teknologi" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="level">Level</label>
                        <select id="level" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
                            <option value="Pemula">Pemula</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Expert">Expert</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="type">Tipe</label>
                        <select id="type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                            <option value="offline">Offline</option>
                            <option value="online">Online</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="duration_minutes">Durasi (menit)</label>
                        <input id="duration_minutes" type="number" placeholder="0" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 0 })} />
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Deskripsi &amp; Gambar</h3>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="description">Deskripsi</label>
                        <textarea id="description" placeholder="Deskripsi lengkap program" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Gambar Program</label>
                        <ImageUpload
                            label="URL Gambar"
                            value={form.image_url}
                            onChange={url => setForm({ ...form, image_url: url })}
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

            {items.length === 0 && <p className="items-empty">Tidak ada data Program</p>}

            <div className={`items-list${items.length === 0 ? ' is-empty' : ''}`}>
                {items.map(item => (
                    <div key={item.id} className="program-card">
                        <div className="program-card-header">
                            <div className="program-card-title">
                                <h3>{item.title}</h3>
                                <span className="program-slug">/{item.slug}</span>
                            </div>
                            <div className="program-card-actions">
                                <button onClick={() => startEdit(item)} className="btn btn-small btn-primary"><Pencil size={14} /> Edit</button>
                                <button onClick={() => handleDelete(item.id)} className="btn btn-small btn-danger"><Trash2 size={14} /> Hapus</button>
                                <button onClick={() => loadModules(item.id)} className="btn btn-small btn-secondary"><ClipboardList size={14} /> Modul</button>
                            </div>
                        </div>
                        <div className="program-card-meta">
                            {item.category && <span className="badge badge-category">{item.category}</span>}
                            <span className="badge badge-level">{item.level}</span>
                            <span className="badge badge-type">{item.type === 'online' ? 'Online' : 'Offline'}</span>
                            {item.is_featured && <span className="badge badge-featured">Unggulan</span>}
                            <span className={`badge badge-status ${item.is_active ? 'active' : 'inactive'}`}>{item.is_active ? 'Aktif' : 'Nonaktif'}</span>
                            {item.duration_minutes > 0 && <span className="badge badge-duration">{item.duration_minutes} menit</span>}
                        </div>
                        {item.description && <p className="program-card-desc">{item.description}</p>}
                        {modules[item.id] && (
                            <div className="modules-panel">
                                <h4>Modul</h4>
                                {modules[item.id].length === 0 ? (
                                    <p className="modules-empty">Belum ada modul</p>
                                ) : (
                                    <div className="modules-list">
                                        {modules[item.id].map(mod => (
                                            <div key={mod.id} className="module-item">
                                                <span>{mod.name}</span>
                                                <button onClick={() => deleteModule(item.id, mod.id)} className="btn btn-small btn-danger"><Trash2 size={14} /> Hapus</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="add-module">
                                    <input
                                        placeholder="Nama modul baru"
                                        value={newModule[item.id]?.name || ''}
                                        onChange={e => setNewModule({ ...newModule, [item.id]: { name: e.target.value } })}
                                    />
                                    <button onClick={() => addModule(item.id)} className="btn btn-small btn-primary"><Plus size={14} /> Tambah</button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
