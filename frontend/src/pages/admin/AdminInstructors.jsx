import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/api';
import ImageUpload from '../../components/ImageUpload';
import { Plus, Save, X, Pencil, Trash2, User } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import { FaFacebook, FaInstagram, FaYoutube } from 'react-icons/fa';
import { SiX } from 'react-icons/si';
import Image from '../../components/Image';
import CustomCheckbox from '../../components/CustomCheckbox';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormField from '../../components/FormField';
import DataList from '../../components/DataList';
import './AdminCRUD.css';

const PAGE_SIZE = 10;

export default function AdminInstructors() {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ nama: '', slug: '', role: '', bio: '', foto: '', facebook_url: '', twitter_url: '', instagram_url: '', youtube_url: '', sort_order: 0, is_active: true });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

    const load = useCallback(() => {
        setLoading(true);
        adminApi.instructors.list({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }).then(result => {
            if (result && typeof result === 'object' && 'data' in result) {
                setItems(result.data);
                setTotal(result.total);
            } else {
                setItems(result);
                setTotal(result?.length || 0);
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [page]);

    useEffect(() => { load(); }, [load]);

    function handleSubmit(e) {
        e.preventDefault();
        if (editing) {
            adminApi.instructors.update(editing.id, form).then(() => { load(); setEditing(null); }).catch(() => { });
        } else {
            adminApi.instructors.create(form).then(() => { load(); resetForm(); }).catch(() => { });
        }
    }

    function resetForm() {
        setForm({ nama: '', slug: '', role: '', bio: '', foto: '', facebook_url: '', twitter_url: '', instagram_url: '', youtube_url: '', sort_order: 0, is_active: true });
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
            adminApi.instructors.delete(deleteDialog.id).then(() => { load(); }).catch(() => { });
        }
        setDeleteDialog({ open: false, id: null });
    }

    if (loading) return <div className="container"><LoadingSpinner /></div>;

    return (
        <div className="admin-crud">
            <h1>Instruktur</h1>
            <form onSubmit={handleSubmit} className="crud-form">
                <div className="form-section">
                    <h3 className="form-section-title">Informasi Dasar</h3>
                    <FormField id="nama" label="Nama" value={form.nama} onChange={nama => setForm({ ...form, nama })} placeholder="Nama lengkap" required />
                    <FormField id="slug" label="Slug" value={form.slug} onChange={slug => setForm({ ...form, slug })} placeholder="contoh: john-doe" required />
                    <FormField id="role" label="Peran" value={form.role} onChange={role => setForm({ ...form, role })} placeholder="contoh: Instruktur Senior" />
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Biografi &amp; Foto</h3>
                    <FormField id="bio" label="Biografi" type="textarea" value={form.bio} onChange={bio => setForm({ ...form, bio })} placeholder="Deskripsi singkat tentang instruktur" fullWidth />
                    <div className="form-group instructor-image-upload">
                        <label>Foto Instruktur</label>
                        <ImageUpload
                            label="URL Foto"
                            value={form.foto}
                            onChange={url => setForm({ ...form, foto: url })}
                        />
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Media Sosial</h3>
                    <FormField id="facebook_url" label={<><FlexIcon Icon={FaFacebook} size={16}>Facebook</FlexIcon></>} value={form.facebook_url} onChange={facebook_url => setForm({ ...form, facebook_url })} placeholder="https://facebook.com/username" className="url-input" />
                    <FormField id="twitter_url" label={<><FlexIcon Icon={SiX} size={16}>X</FlexIcon></>} value={form.twitter_url} onChange={twitter_url => setForm({ ...form, twitter_url })} placeholder="https://x.com/username" className="url-input" />
                    <FormField id="instagram_url" label={<><FlexIcon Icon={FaInstagram} size={16}>Instagram</FlexIcon></>} value={form.instagram_url} onChange={instagram_url => setForm({ ...form, instagram_url })} placeholder="https://instagram.com/username" className="url-input" />
                    <FormField id="youtube_url" label={<><FlexIcon Icon={FaYoutube} size={16}>YouTube</FlexIcon></>} value={form.youtube_url} onChange={youtube_url => setForm({ ...form, youtube_url })} placeholder="https://youtube.com/@username" className="url-input" />
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Pengaturan</h3>
                    <FormField id="sort_order" label="Urutan" type="number" value={form.sort_order} onChange={sort_order => setForm({ ...form, sort_order: parseInt(sort_order) || 0 })} placeholder="0" />
                    <div className="form-group">
                        <CustomCheckbox id="is_active" checked={form.is_active} onChange={is_active => setForm({ ...form, is_active })}>
                            Aktif
                        </CustomCheckbox>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">{editing ? <><FlexIcon Icon={Save} size={16}>Perbarui</FlexIcon></> : <><FlexIcon Icon={Plus} size={16}>Tambah</FlexIcon></>}</button>
                    {(editing || form.nama || form.slug) && <button type="button" onClick={resetForm} className="btn btn-secondary"><FlexIcon Icon={X} size={16}>Batal</FlexIcon></button>}
                </div>
            </form>
            <DataList
                items={items}
                total={total}
                page={page}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                emptyMessage="Tidak ada data Instruktur"
            >
                {items.map(item => (
                    <div key={item.id} className="generic-card">
                        <div className="admin-instructor-photo">
                            {item.foto ? (
                                <Image src={item.foto} alt={item.nama} />
                            ) : (
                                <div className="admin-instructor-avatar"><FlexIcon Icon={User} size={28} strokeWidth={1.5} /></div>
                            )}
                        </div>
                        <div className="generic-card-header">
                            <div className="generic-card-title">
                                <h3>{item.nama}</h3>
                                <span className="generic-card-sub">{item.role || 'Tanpa peran'}</span>
                            </div>
                            <div className="generic-card-actions">
                                <button onClick={() => startEdit(item)} className="btn btn-small btn-primary"><FlexIcon Icon={Pencil} size={14}>Edit</FlexIcon></button>
                                <button onClick={() => handleDelete(item.id)} className="btn btn-small btn-danger"><FlexIcon Icon={Trash2} size={14}>Hapus</FlexIcon></button>
                            </div>
                        </div>
                        <div className="generic-card-meta">
                            {item.bio && <span className="meta-text">{item.bio}</span>}
                        </div>
                        {(item.facebook_url || item.twitter_url || item.instagram_url || item.youtube_url) && (
                            <div className="generic-card-links">
                                {item.facebook_url && <span className="link-pill">Facebook</span>}
                                {item.twitter_url && <span className="link-pill">X</span>}
                                {item.instagram_url && <span className="link-pill">Instagram</span>}
                                {item.youtube_url && <span className="link-pill">YouTube</span>}
                            </div>
                        )}
                    </div>
                ))}
            </DataList>
            <ConfirmDialog
                open={deleteDialog.open}
                message="Apakah Anda yakin ingin menghapus instruktur ini?"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteDialog({ open: false, id: null })}
            />
        </div>
    );
}
