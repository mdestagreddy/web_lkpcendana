import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import ImageUpload from '../../components/ImageUpload';
import Image from '../../components/Image';
import { Plus, Save, X, Pencil, Trash2, User } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import CustomCheckbox from '../../components/CustomCheckbox';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormField from '../../components/FormField';
import DataList from '../../components/DataList';
import './AdminCRUD.css';

const PAGE_SIZE = 10;

export default function AdminTestimonials() {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ nama: '', lokasi: '', isi: '', foto: '', is_featured: false, sort_order: 0, is_active: true });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

    function load() {
        setLoading(true);
        adminApi.testimonials.list({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }).then(result => {
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
            adminApi.testimonials.update(editing.id, form).then(() => { load(); setEditing(null); }).catch(() => {});
        } else {
            adminApi.testimonials.create(form).then(() => { load(); resetForm(); }).catch(() => {});
        }
    }

    function resetForm() {
        setForm({ nama: '', lokasi: '', isi: '', foto: '', is_featured: false, sort_order: 0, is_active: true });
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
            adminApi.testimonials.delete(deleteDialog.id).then(() => { load(); }).catch(() => {});
        }
        setDeleteDialog({ open: false, id: null });
    }

    if (loading) return <div className="container"><LoadingSpinner /></div>;

    return (
        <div className="admin-crud">
            <h1>Testimoni</h1>
            <form onSubmit={handleSubmit} className="crud-form">
                <div className="form-section">
                    <h3 className="form-section-title">Informasi Testimoni</h3>
                    <FormField id="nama" label="Nama" value={form.nama} onChange={nama => setForm({ ...form, nama })} placeholder="Nama lengkap" required />
                    <FormField id="lokasi" label="Lokasi" value={form.lokasi} onChange={lokasi => setForm({ ...form, lokasi })} placeholder="Kota, Provinsi" />
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Isi &amp; Foto</h3>
                    <FormField id="isi" label="Testimoni" type="textarea" value={form.isi} onChange={isi => setForm({ ...form, isi })} placeholder="Ketik testimoni di sini..." required fullWidth />
                    <div className="form-group">
                        <label>Foto</label>
                        <ImageUpload
                            label="URL Foto"
                            value={form.foto}
                            onChange={url => setForm({ ...form, foto: url })}
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
                    {editing && <button type="button" onClick={resetForm} className="btn btn-secondary"><FlexIcon Icon={X} size={16}>Batal</FlexIcon></button>}
                </div>
            </form>
            <DataList
                items={items}
                total={total}
                page={page}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                emptyMessage="Tidak ada data Testimoni"
            >
                {items.map(item => (
                    <div key={item.id} className="generic-card">
                        <div className="generic-card-header">
                            <div className="generic-card-title">
                                <div className="admin-testimonial-header">
                                    {item.foto ? (
                                        <Image src={item.foto} alt={item.nama} className="admin-testimonial-photo" />
                                    ) : (
                                        <div className="admin-testimonial-avatar"><FlexIcon Icon={User} size={20} /></div>
                                    )}
                                    <div>
                                        <h3>{item.nama} <span className="generic-card-sub">{item.lokasi}</span></h3>
                                    </div>
                                </div>
                            </div>
                            <div className="generic-card-actions">
                                <button onClick={() => startEdit(item)} className="btn btn-small btn-primary"><FlexIcon Icon={Pencil} size={14}>Edit</FlexIcon></button>
                                <button onClick={() => handleDelete(item.id)} className="btn btn-small btn-danger"><FlexIcon Icon={Trash2} size={14}>Hapus</FlexIcon></button>
                            </div>
                        </div>
                        <p className="generic-card-desc">{item.isi}</p>
                        <div className="generic-card-meta">
                            {item.is_featured && <span className="badge badge-featured">Unggulan</span>}
                            <span className={`badge badge-status ${item.is_active ? 'active' : 'inactive'}`}>{item.is_active ? 'Aktif' : 'Nonaktif'}</span>
                        </div>
                    </div>
                ))}
            </DataList>
            <ConfirmDialog
                open={deleteDialog.open}
                message="Apakah Anda yakin ingin menghapus testimonial ini?"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteDialog({ open: false, id: null })}
            />
        </div>
    );
}
