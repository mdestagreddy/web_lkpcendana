import { adminApi } from '../../services/api';
import { Plus, Save, X } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormField from '../../components/FormField';
import CRUDCard from '../../components/CRUDCard';
import useCRUD from '../../hooks/useCRUD';
import './AdminCRUD.css';

export default function AdminCategories() {
    const {
        items,
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
        api: adminApi.categories,
        initialForm: { name: '', slug: '', description: '' },
    });

    if (loading) return <div className="container"><LoadingSpinner /></div>;

    return (
        <div className="admin-crud">
            <h1>Kategori</h1>
            <form onSubmit={handleSubmit} className="crud-form">
                <div className="form-section">
                    <h3 className="form-section-title">Informasi Kategori</h3>
                    <FormField id="name" label="Nama" value={form.name} onChange={name => setForm({ ...form, name })} placeholder="Nama kategori" required />
                    <FormField id="slug" label="Slug" value={form.slug} onChange={slug => setForm({ ...form, slug })} placeholder="contoh: teknologi" required />
                    <FormField id="description" label="Deskripsi" value={form.description} onChange={description => setForm({ ...form, description })} placeholder="Deskripsi singkat" />
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">{editing ? <><FlexIcon Icon={Save} size={16}>Perbarui</FlexIcon></> : <><FlexIcon Icon={Plus} size={16}>Tambah</FlexIcon></>}</button>
                    {editing && <button type="button" onClick={resetForm} className="btn btn-secondary"><FlexIcon Icon={X} size={16}>Batal</FlexIcon></button>}
                </div>
            </form>
            {items.length === 0 && <p className="items-empty">Tidak ada data Kategori</p>}

            <div className={`items-list${items.length === 0 ? ' is-empty' : ''}`}>
                {items.map(item => (
                    <CRUDCard
                        key={item.id}
                        item={item}
                        onEdit={startEdit}
                        onDelete={handleDelete}
                        title={<h3>{item.name}</h3>}
                        subtitle={<span>/{item.slug}</span>}
                        description={item.description}
                    />
                ))}
            </div>
            <ConfirmDialog
                open={deleteDialog.open}
                message="Apakah Anda yakin ingin menghapus kategori ini?"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteDialog({ open: false, id: null })}
            />
        </div>
    );
}
