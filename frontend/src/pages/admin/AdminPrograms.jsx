import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import ImageUpload from '../../components/ImageUpload';
import { Plus, Save, X, Pencil, Trash2, ClipboardList } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import CustomCheckbox from '../../components/CustomCheckbox';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormField from '../../components/FormField';
import DataList from '../../components/DataList';
import './AdminCRUD.css';

const PAGE_SIZE = 10;

export default function AdminPrograms() {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ title: '', slug: '', category: '', level: 'Pemula', duration_minutes: 0, description: '', type: 'offline', is_featured: false, is_active: true, sort_order: 0, image_url: '' });
    const [modules, setModules] = useState({});
    const [newModule, setNewModule] = useState({});
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

    function load() {
        setLoading(true);
        adminApi.programs.list({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }).then(result => {
            if (result && typeof result === 'object' && 'data' in result) {
                setItems(result.data);
                setTotal(result.total);
            } else {
                setItems(result);
                setTotal(result?.length || 0);
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }

    useEffect(() => { load(); }, [page]);

    function handleSubmit(e) {
        e.preventDefault();
        if (editing) {
            adminApi.programs.update(editing.id, form).then(() => { load(); setEditing(null); }).catch(() => {});
        } else {
            adminApi.programs.create(form).then(() => { load(); resetForm(); }).catch(() => {});
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
        setDeleteDialog({ open: true, id });
    }

    function confirmDelete() {
        if (deleteDialog.id) {
            adminApi.programs.delete(deleteDialog.id).then(() => { load(); }).catch(() => {});
        }
        setDeleteDialog({ open: false, id: null });
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

    if (loading) return <div className="container"><LoadingSpinner /></div>;

    return (
        <div className="admin-crud">
            <h1>Program</h1>
            <form onSubmit={handleSubmit} className="crud-form">
                <div className="form-section">
                    <h3 className="form-section-title">Informasi Program</h3>
                    <FormField id="title" label="Judul" value={form.title} onChange={title => setForm({ ...form, title })} placeholder="Judul program" required />
                    <FormField id="slug" label="Slug" value={form.slug} onChange={slug => setForm({ ...form, slug })} placeholder="contoh: program-web-development" required />
                    <FormField id="category" label="Kategori" value={form.category} onChange={category => setForm({ ...form, category })} placeholder="contoh: Teknologi" />
                    <FormField id="level" label="Level" type="select" value={form.level} onChange={level => setForm({ ...form, level })} options={[
                        { value: 'Pemula', label: 'Pemula' },
                        { value: 'Intermediate', label: 'Intermediate' },
                        { value: 'Expert', label: 'Expert' },
                    ]} />
                    <FormField id="type" label="Tipe" type="select" value={form.type} onChange={type => setForm({ ...form, type })} options={[
                        { value: 'offline', label: 'Offline' },
                        { value: 'online', label: 'Online' },
                    ]} />
                    <FormField id="duration_minutes" label="Durasi (menit)" type="number" value={form.duration_minutes} onChange={duration_minutes => setForm({ ...form, duration_minutes: parseInt(duration_minutes) || 0 })} placeholder="0" />
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Deskripsi &amp; Gambar</h3>
                    <FormField id="description" label="Deskripsi" type="textarea" value={form.description} onChange={description => setForm({ ...form, description })} placeholder="Deskripsi lengkap program" fullWidth />
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
                    <FormField id="sort_order" label="Urutan" type="number" value={form.sort_order} onChange={sort_order => setForm({ ...form, sort_order: parseInt(sort_order) || 0 })} placeholder="0" />
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">{editing ? <><FlexIcon Icon={Save} size={16}>Perbarui</FlexIcon></> : <><FlexIcon Icon={Plus} size={16}>Tambah</FlexIcon></>}</button>
                    {editing && <button type="button" onClick={resetForm} className="btn btn-secondary"><FlexIcon Icon={X} size={16} /> Batal</button>}
                </div>
            </form>

            <DataList
                items={items}
                total={total}
                page={page}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                emptyMessage="Tidak ada data Program"
            >
                {items.map(item => (
                    <div key={item.id} className="program-card">
                        <div className="program-card-header">
                            <div className="program-card-title">
                                <h3>{item.title}</h3>
                                <span className="program-slug">/{item.slug}</span>
                            </div>
                            <div className="program-card-actions">
                                <button onClick={() => startEdit(item)} className="btn btn-small btn-primary"><FlexIcon Icon={Pencil} size={14}>Edit</FlexIcon></button>
                                <button onClick={() => handleDelete(item.id)} className="btn btn-small btn-danger"><FlexIcon Icon={Trash2} size={14}>Hapus</FlexIcon></button>
                                <button onClick={() => loadModules(item.id)} className="btn btn-small btn-secondary"><FlexIcon Icon={ClipboardList} size={14}>Modul</FlexIcon></button>
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
                                                <button onClick={() => deleteModule(item.id, mod.id)} className="btn btn-small btn-danger"><FlexIcon Icon={Trash2} size={14} /> Hapus</button>
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
                                    <button onClick={() => addModule(item.id)} className="btn btn-small btn-primary"><FlexIcon Icon={Plus} size={14} /> Tambah</button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </DataList>
            <ConfirmDialog
                open={deleteDialog.open}
                message="Apakah Anda yakin ingin menghapus program ini?"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteDialog({ open: false, id: null })}
            />
        </div>
    );
}
