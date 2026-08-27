import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Plus, Save, X } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormField from '../../components/FormField';
import CRUDCard from '../../components/CRUDCard';
import DataList from '../../components/DataList';
import './AdminCRUD.css';

const PAGE_SIZE = 10;

export default function AdminUsers() {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ nama: '', email: '', password: '', role: 'admin', avatar: '' });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

    function load() {
        setLoading(true);
        adminApi.users.list({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }).then(result => {
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
            adminApi.users.update(editing.id, form).then(() => { load(); setEditing(null); }).catch(() => {});
        } else {
            adminApi.users.create(form).then(() => { load(); resetForm(); }).catch(() => {});
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
        setDeleteDialog({ open: true, id });
    }

    function confirmDelete() {
        if (deleteDialog.id) {
            adminApi.users.delete(deleteDialog.id).then(() => { load(); }).catch(() => {});
        }
        setDeleteDialog({ open: false, id: null });
    }

    if (loading) return <div className="container"><LoadingSpinner /></div>;

    return (
        <div className="admin-crud">
            <h1>Pengguna</h1>
            <form onSubmit={handleSubmit} className="crud-form">
                <div className="form-section">
                    <h3 className="form-section-title">Informasi Akun</h3>
                    <FormField id="nama" label="Nama" value={form.nama} onChange={nama => setForm({ ...form, nama })} placeholder="Nama lengkap" required />
                    <FormField id="email" label="Email" type="email" value={form.email} onChange={email => setForm({ ...form, email })} placeholder="nama@email.com" required />
                    <FormField id="password" label="Kata Sandi" type="password" value={form.password} onChange={password => setForm({ ...form, password })} placeholder={editing ? 'Kosongkan jika tidak diubah' : 'Kata sandi'} required={!editing} />
                    <FormField id="role" label="Peran" type="select" value={form.role} onChange={role => setForm({ ...form, role })} options={[
                        { value: 'admin', label: 'Admin' },
                        { value: 'superadmin', label: 'Superadmin' },
                    ]} />
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Profil</h3>
                    <FormField id="avatar" label="URL Avatar" value={form.avatar} onChange={avatar => setForm({ ...form, avatar })} placeholder="https://..." />
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
                emptyMessage="Tidak ada data Pengguna"
            >
                {items.map(item => (
                    <CRUDCard
                        key={item.id}
                        item={item}
                        onEdit={startEdit}
                        onDelete={handleDelete}
                        title={<h3>{item.nama}</h3>}
                        subtitle={<span>{item.email}</span>}
                        meta={
                            <span className={`badge badge-status ${item.role === 'superadmin' ? 'active' : 'inactive'}`}>{item.role}</span>
                        }
                    />
                ))}
            </DataList>
            <ConfirmDialog
                open={deleteDialog.open}
                message="Apakah Anda yakin ingin menghapus pengguna ini?"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteDialog({ open: false, id: null })}
            />
        </div>
    );
}
