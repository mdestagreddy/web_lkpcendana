import { adminApi } from '../../services/api';
import { Plus, Save, X } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormField from '../../components/FormField';
import CRUDCard from '../../components/CRUDCard';
import useCRUD from '../../hooks/useCRUD';
import './AdminCRUD.css';

export default function AdminVisionMission() {
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
        api: adminApi.visionMission,
        initialForm: { type: 'vision', content: '', sort_order: 0 },
    });

    if (loading) return <div className="container"><LoadingSpinner /></div>;

    return (
        <div className="admin-crud">
            <h1>Visi &amp; Misi</h1>
            <form onSubmit={handleSubmit} className="crud-form">
                <div className="form-section">
                    <h3 className="form-section-title">Konten</h3>
                    <FormField id="type" label="Tipe" type="select" value={form.type} onChange={type => setForm({ ...form, type })} options={[
                        { value: 'vision', label: 'Visi' },
                        { value: 'mission', label: 'Misi' },
                    ]} />
                    <FormField id="content" label="Konten" type="textarea" value={form.content} onChange={content => setForm({ ...form, content })} placeholder="Tulis visi atau misi..." required fullWidth />
                    <FormField id="sort_order" label="Urutan" type="number" value={form.sort_order} onChange={sort_order => setForm({ ...form, sort_order: parseInt(sort_order) || 0 })} placeholder="0" />
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">{editing ? <><Save size={16} /> Perbarui</> : <><Plus size={16} /> Tambah</>}</button>
                    {editing && <button type="button" onClick={resetForm} className="btn btn-secondary"><X size={16} /> Batal</button>}
                </div>
            </form>
            {items.length === 0 && <p className="items-empty">Tidak ada data Visi & Misi</p>}

            <div className={`items-list${items.length === 0 ? ' is-empty' : ''}`}>
                {items.map(item => (
                    <CRUDCard
                        key={item.id}
                        item={item}
                        onEdit={startEdit}
                        onDelete={handleDelete}
                        title={<h3>{item.type === 'vision' ? 'Visi' : 'Misi'}</h3>}
                        subtitle={<span>Urutan: {item.sort_order}</span>}
                        description={item.content}
                    />
                ))}
            </div>
            <ConfirmDialog
                open={deleteDialog.open}
                message="Apakah Anda yakin ingin menghapus data ini?"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteDialog({ open: false, id: null })}
            />
        </div>
    );
}
