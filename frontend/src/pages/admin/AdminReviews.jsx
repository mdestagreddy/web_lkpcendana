import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Plus, Save, X, Pencil, Trash2, Calendar, Image, Star } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import CustomCheckbox from '../../components/CustomCheckbox';
import MultiImageUpload from '../../components/MultiImageUpload';
import ImageLightbox from '../../components/ImageLightbox';
import LoadingSpinner from '../../components/LoadingSpinner';
import StarRating from '../../components/StarRating';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormField from '../../components/FormField';
import DataList from '../../components/DataList';
import './AdminCRUD.css';

const PAGE_SIZE = 10;

export default function AdminReviews() {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        nama: '',
        email: '',
        rating: 5,
        isi: '',
        images: [],
        is_active: true,
        created_at: '',
    });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

    function load() {
        setLoading(true);
        adminApi.reviews.list({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }).then(result => {
            if (result && typeof result === 'object' && 'data' in result) {
                setItems(result.data);
                setTotal(result.total);
            } else {
                setItems(result);
                setTotal(result?.length || 0);
            }
            setLoading(false);
        }).catch(() => {
            setLoading(false);
        });
    }

    useEffect(() => { load(); }, [page]);

    function handleSubmit(e) {
        e.preventDefault();
        if (editing) {
            adminApi.reviews.update(editing.id, form).then(() => { load(); setEditing(null); }).catch(() => {});
        } else {
            adminApi.reviews.create(form).then(() => { load(); resetForm(); }).catch(() => {});
        }
    }

    function resetForm() {
        setForm({ nama: '', email: '', rating: 5, isi: '', images: [], is_active: true, created_at: '' });
        setEditing(null);
    }

    function startEdit(item) {
        setEditing(item);
        let imagesArr = [];
        if (item.images) {
            if (Array.isArray(item.images)) {
                imagesArr = item.images;
            } else if (typeof item.images === 'string') {
                try { imagesArr = JSON.parse(item.images); } catch { imagesArr = []; }
            }
        }
        setForm({
            nama: item.nama || '',
            email: item.email || '',
            rating: item.rating || 5,
            isi: item.isi || '',
            images: imagesArr,
            is_active: item.is_active !== false,
            created_at: item.created_at ? new Date(item.created_at).toISOString().slice(0, 10) : '',
        });
    }

    function handleDelete(id) {
        setDeleteDialog({ open: true, id });
    }

    function confirmDelete() {
        if (deleteDialog.id) {
            adminApi.reviews.delete(deleteDialog.id).then(() => { load(); }).catch(() => {});
        }
        setDeleteDialog({ open: false, id: null });
    }

    if (loading) return <div className="container"><LoadingSpinner /></div>;

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    return (
        <div className="admin-crud">
            <h1>Ulasan</h1>
            <form onSubmit={handleSubmit} className="crud-form">
                <div className="form-section">
                    <h3 className="form-section-title">Informasi Reviewer</h3>
                    <FormField id="nama" label="Nama *" value={form.nama} onChange={nama => setForm({ ...form, nama })} placeholder="Nama lengkap" required />
                    <FormField id="email" label="Email" type="email" value={form.email} onChange={email => setForm({ ...form, email })} placeholder="email@contoh.com" />
                    <FormField id="created_at" label="Tanggal Unggah" type="date" value={form.created_at} onChange={created_at => setForm({ ...form, created_at })} />
                    <span className="form-help">Kosongkan untuk gunakan tanggal hari ini.</span>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Ulasan &amp; Rating</h3>
                    <div className="form-group">
                        <label>Rating</label>
                        <div className="star-rating"><StarRating rating={form.rating} onChange={rating => setForm({ ...form, rating })} /></div>
                        <span className="rating-label">{form.rating} / 5</span>
                    </div>
                    <FormField id="isi" label="Ulasan *" type="textarea" value={form.isi} onChange={isi => setForm({ ...form, isi })} placeholder="Ketik ulasan di sini..." required fullWidth rows={4} />
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Gambar &amp; Pengaturan</h3>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <MultiImageUpload
                            label="Gambar Ulasan"
                            value={form.images}
                            onChange={images => setForm({ ...form, images })}
                            disabled={false}
                        />
                    </div>
                    <div className="form-group">
                        <CustomCheckbox id="is_active" checked={form.is_active} onChange={is_active => setForm({ ...form, is_active })}>
                            Aktif (tampilkan di halaman publik)
                        </CustomCheckbox>
                    </div>
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
                emptyMessage="Tidak ada data Ulasan"
            >
                {items.map(item => {
                    let imgs = [];
                    if (item.images) {
                        if (Array.isArray(item.images)) {
                            imgs = item.images;
                        } else if (typeof item.images === 'string') {
                            try { imgs = JSON.parse(item.images); } catch { imgs = []; }
                        }
                    }
                    return (
                        <div key={item.id} className="generic-card">
                            <div className="generic-card-header">
                                <div className="generic-card-title">
                                    <h3>{item.nama}<span className="generic-card-sub" style={{ marginLeft: '0.5rem' }}><FlexIcon Icon={Star} color={'#f59e0b'} fill={'#f59e0b'}>{item.rating}/5</FlexIcon></span></h3>
                                </div>
                                <div className="generic-card-actions">
                                    <button onClick={() => startEdit(item)} className="btn btn-small btn-primary"><FlexIcon Icon={Pencil} size={14}>Edit</FlexIcon></button>
                                    <button onClick={() => handleDelete(item.id)} className="btn btn-small btn-danger"><FlexIcon Icon={Trash2} size={14}>Hapus</FlexIcon></button>
                                </div>
                            </div>
                            <p className="generic-card-desc">{item.isi}</p>
                            {imgs.length > 0 && (
                                <ImageLightbox items={imgs.map(url => ({ src: url, author: item.nama, text: item.isi }))} className="admin-review-images" />
                            )}
                            <div className="generic-card-meta">
                                {imgs.length > 0 && <span className="badge badge-info"><FlexIcon Icon={Image} size={14}>{imgs.length} gambar</FlexIcon></span>}
                                <span className={`badge badge-status ${item.is_active ? 'active' : 'inactive'}`}>{item.is_active ? 'Aktif' : 'Nonaktif'}</span>
                                {item.created_at && <span className="badge badge-date"><FlexIcon Icon={Calendar} size={14}>{formatDate(item.created_at)}</FlexIcon></span>}
                            </div>
                        </div>
                    );
                })}
            </DataList>
            <ConfirmDialog
                open={deleteDialog.open}
                message="Apakah Anda yakin ingin menghapus ulasan ini?"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteDialog({ open: false, id: null })}
            />
        </div>
    );
}
