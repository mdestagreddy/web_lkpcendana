import { useState, useEffect, useMemo, useRef } from 'react';
import { adminApi } from '../../services/api';
import ImageUpload from '../../components/ImageUpload';
import { Plus, Save, X, Pencil, Trash2, ZoomIn } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import CustomCheckbox from '../../components/CustomCheckbox';
import ImageLightbox from '../../components/ImageLightbox';
import Image from '../../components/Image';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormField from '../../components/FormField';
import DataList from '../../components/DataList';
import './AdminCRUD.css';

const PAGE_SIZE = 10;

export default function AdminGallery() {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ kategori: '', caption: '', image_url: '', thumbnail_url: '', alt_text: '', sort_order: 0, is_active: true });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
    const lightboxRef = useRef(null);

    function load() {
        setLoading(true);
        adminApi.gallery.list({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }).then(result => {
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
            adminApi.gallery.update(editing.id, form).then(() => { load(); setEditing(null); }).catch(() => {});
        } else {
            adminApi.gallery.create(form).then(() => { load(); resetForm(); }).catch(() => {});
        }
    }

    function resetForm() {
        setForm({ kategori: '', caption: '', image_url: '', thumbnail_url: '', alt_text: '', sort_order: 0, is_active: true });
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
            adminApi.gallery.delete(deleteDialog.id).then(() => { load(); }).catch(() => {});
        }
        setDeleteDialog({ open: false, id: null });
    }

    const lightboxItems = useMemo(() => items.map((item, _idx) => ({ src: item.image_url, author: item.kategori || '', text: item.caption || '' })), [items]);

    if (loading) return <div className="container"><LoadingSpinner /></div>;

    return (
        <div className="admin-crud">
            <h1>Galeri</h1>
            <form onSubmit={handleSubmit} className="crud-form">
                <div className="form-section">
                    <h3 className="form-section-title">Informasi Galeri</h3>
                    <FormField id="kategori" label="Kategori" value={form.kategori} onChange={kategori => setForm({ ...form, kategori })} placeholder="contoh: Acara, Fasilitas" required />
                    <FormField id="caption" label="Keterangan" value={form.caption} onChange={caption => setForm({ ...form, caption })} placeholder="Deskripsi singkat gambar" />
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Media</h3>
                    <div className="form-group">
                        <label>Gambar Utama</label>
                        <ImageUpload
                            label="URL Gambar"
                            value={form.image_url}
                            onChange={url => setForm({ ...form, image_url: url })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Thumbnail</label>
                        <ImageUpload
                            label="URL Thumbnail"
                            value={form.thumbnail_url}
                            onChange={url => setForm({ ...form, thumbnail_url: url })}
                        />
                    </div>
                    <FormField id="alt_text" label="Teks Alt" value={form.alt_text} onChange={alt_text => setForm({ ...form, alt_text })} placeholder="Deskripsi untuk aksesibilitas" />
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Pengaturan</h3>
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
                emptyMessage="Tidak ada data Galeri"
            >
                {items.map((item, mapIdx) => (
                    <div key={item.id} className="gallery-card">
                        <div className="gallery-card-preview">
                            {item.image_url ? (
                                <div className="gallery-card-image" onClick={() => lightboxRef.current?.openLightbox(lightboxItems, mapIdx)}>
                                    <Image src={item.image_url} alt={item.alt_text || item.caption || 'Galeri'} loading="lazy" />
                                    <div className="gallery-card-overlay">
                                        <FlexIcon Icon={ZoomIn} size={20} />
                                    </div>
                                </div>
                            ) : (
                                <div className="gallery-placeholder">Tidak ada gambar</div>
                            )}
                        </div>
                        <div className="gallery-card-body">
                            <h3>{item.caption || 'Tanpa keterangan'}</h3>
                            <p>{item.kategori}</p>
                            <div className="generic-card-actions">
                                <button onClick={() => startEdit(item)} className="btn btn-small btn-primary"><FlexIcon Icon={Pencil} size={14}>Edit</FlexIcon></button>
                                <button onClick={() => handleDelete(item.id)} className="btn btn-small btn-danger"><FlexIcon Icon={Trash2} size={14}>Hapus</FlexIcon></button>
                            </div>
                        </div>
                    </div>
                ))}
            </DataList>
            <ImageLightbox ref={lightboxRef} multiTrigger items={lightboxItems} />
            <ConfirmDialog
                open={deleteDialog.open}
                message="Apakah Anda yakin ingin menghapus gambar ini?"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteDialog({ open: false, id: null })}
            />
        </div>
    );
}
