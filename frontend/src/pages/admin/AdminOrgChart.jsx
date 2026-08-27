import { adminApi } from '../../services/api';
import ImageUpload from '../../components/ImageUpload';
import { Plus, Save, X } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormField from '../../components/FormField';
import CRUDCard from '../../components/CRUDCard';
import DataList from '../../components/DataList';
import useCRUD from '../../hooks/useCRUD';
import './AdminCRUD.css';

const PAGE_SIZE = 10;

export default function AdminOrgChart() {
    const {
        items,
        total,
        page,
        handlePageChange,
        loading,
        editing,
        form,
        setForm,
        deleteDialog,
        setDeleteDialog,
        handleSubmit,
        resetForm,
        startEdit,
        handleDelete,
        confirmDelete,
    } = useCRUD({
        api: adminApi.orgChart,
        initialForm: { nama: '', role: '', parent_id: '', foto: '', sort_order: 0 },
        pageSize: PAGE_SIZE,
    });

    if (loading) return <div className="container"><LoadingSpinner /></div>;

    return (
        <div className="admin-crud">
            <h1>Struktur Organisasi</h1>
            <form onSubmit={handleSubmit} className="crud-form">
                <div className="form-section">
                    <h3 className="form-section-title">Informasi Anggota</h3>
                    <FormField id="nama" label="Nama" value={form.nama} onChange={nama => setForm({ ...form, nama })} placeholder="Nama lengkap" required />
                    <FormField id="role" label="Peran / Jabatan" value={form.role} onChange={role => setForm({ ...form, role })} placeholder="contoh: Ketua, Sekretaris" />
                    <FormField id="parent_id" label="ID Induk" type="number" value={form.parent_id} onChange={parent_id => setForm({ ...form, parent_id })} placeholder="Kosongkan jika tidak ada induk" />
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
                    <button type="submit" className="btn btn-primary">{editing ? <><FlexIcon Icon={Save} size={16}>Perbarui</FlexIcon></> : <><FlexIcon Icon={Plus} size={16}>Tambah</FlexIcon></>}</button>
                    {editing && <button type="button" onClick={resetForm} className="btn btn-secondary"><FlexIcon Icon={X} size={16}>Batal</FlexIcon></button>}
                </div>
            </form>
            <DataList
                items={items}
                total={total}
                page={page}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
                emptyMessage="Tidak ada data Organisasi"
            >
                {items.map(item => (
                    <CRUDCard
                        key={item.id}
                        item={item}
                        onEdit={startEdit}
                        onDelete={handleDelete}
                        title={<h3>{item.nama}</h3>}
                        subtitle={<span>{item.role || 'Tanpa jabatan'}</span>}
                        meta={
                            <>
                                <span className="meta-text">ID Induk: {item.parent_id || 'Tidak Ada'}</span>
                                <span className="meta-text">Urutan: {item.sort_order}</span>
                            </>
                        }
                    />
                ))}
            </DataList>
            <ConfirmDialog
                open={deleteDialog.open}
                message="Apakah Anda yakin ingin menghapus data organisasi ini?"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteDialog({ open: false, id: null })}
            />
        </div>
    );
}
