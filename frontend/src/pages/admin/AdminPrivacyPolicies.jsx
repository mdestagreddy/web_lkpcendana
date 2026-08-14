import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Plus, Save, X, Pencil, Trash2 } from 'lucide-react';
import TextEditor from '../../components/TextEditor';
import CustomCheckbox from '../../components/CustomCheckbox';
import './AdminCRUD.css';

function formatDate(value) {
    if (!value) return '-';
    if (typeof value !== 'string') return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

function renderContent(content) {
    if (!content) return '';
    const trimmed = content.trim();
    if (/<[a-z][\s\S]*>/i.test(trimmed)) {
        return trimmed;
    }
    return trimmed.replace(/\n/g, '<br/>');
}

export default function AdminPrivacyPolicies() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ content: '', version: '', effective_date: '', is_current: true });

    useEffect(() => { load(); }, []);

    function load() {
        setLoading(true);
        adminApi.privacyPolicies.list().then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false));
    }

    function handleSubmit(e) {
        e.preventDefault();
        const payload = {
            ...form,
            effective_date: form.effective_date ? form.effective_date.split('T')[0] : null,
        };
        if (editing) {
            adminApi.privacyPolicies.update(editing.id, payload)
                .then(load)
                .then(() => setEditing(null))
                .catch(err => alert('Gagal memperbarui: ' + (err.data?.error || err.message)));
        } else {
            adminApi.privacyPolicies.create(payload)
                .then(load)
                .then(() => resetForm())
                .catch(err => alert('Gagal menambah: ' + (err.data?.error || err.message)));
        }
    }

    function resetForm() {
        setForm({ content: '', version: '', effective_date: '', is_current: true });
        setEditing(null);
    }

    function startEdit(item) {
        setEditing(item);
        setForm({
            content: item.content,
            version: item.version || '',
            effective_date: item.effective_date ? item.effective_date.split('T')[0] : '',
            is_current: !!item.is_current,
        });
    }

    function handleDelete(id) {
        if (!confirm('Apakah Anda yakin?')) return;
        adminApi.privacyPolicies.delete(id).then(load).catch(() => {});
    }

    if (loading) return <div className="container"><p className="loading">Memuat...</p></div>;

    return (
        <div className="admin-crud">
            <h1>Kebijakan Privasi</h1>
            <form onSubmit={handleSubmit} className="crud-form">
                <div className="form-section">
                    <h3 className="form-section-title">Konten &amp; Versi</h3>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="content">Konten</label>
                        <TextEditor
                            id="content"
                            value={form.content}
                            onChange={content => setForm({ ...form, content })}
                            placeholder="Tulis isi kebijakan privasi..."
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="version">Versi</label>
                        <input id="version" placeholder="contoh: 1.0" value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="effective_date">Tanggal Berlaku</label>
                        <input id="effective_date" type="date" placeholder="YYYY-MM-DD" value={form.effective_date} onChange={e => setForm({ ...form, effective_date: e.target.value })} />
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Pengaturan</h3>
                    <div className="form-group">
                        <CustomCheckbox id="is_current" checked={form.is_current} onChange={is_current => setForm({ ...form, is_current })}>
                            Aktif (Versi Saat Ini)
                        </CustomCheckbox>
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
                                <h3>Versi {item.version || '-'}</h3>
                                <span className="generic-card-sub">Berlaku: {formatDate(item.effective_date)}</span>
                            </div>
                            <div className="generic-card-actions">
                                <button onClick={() => startEdit(item)} className="btn btn-small btn-primary"><Pencil size={14} /> Edit</button>
                                <button onClick={() => handleDelete(item.id)} className="btn btn-small btn-danger"><Trash2 size={14} /> Hapus</button>
                            </div>
                        </div>
                        <p className="generic-card-desc" dangerouslySetInnerHTML={{ __html: renderContent(item.content) }} />
                        <div className="generic-card-meta">
                            {item.is_current ? <span className="badge badge-status active">Versi Saat Ini</span> : <span className="badge badge-status inactive">Arsip</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
