import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Plus, Save, X } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import TextEditor from '../../components/TextEditor';
import CustomCheckbox from '../../components/CustomCheckbox';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormField from '../../components/FormField';
import CRUDCard from '../../components/CRUDCard';
import DataList from '../../components/DataList';
import './AdminCRUD.css';

const PAGE_SIZE = 10;

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
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ content: '', version: '', effective_date: '', is_current: true });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

    function load() {
        setLoading(true);
        adminApi.privacyPolicies.list({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }).then(result => {
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
        const payload = {
            ...form,
            effective_date: form.effective_date ? form.effective_date.split('T')[0] : null,
        };
        if (editing) {
            adminApi.privacyPolicies.update(editing.id, payload)
                .then(() => { load(); setEditing(null); })
                .catch(err => alert('Gagal memperbarui: ' + (err.data?.error || err.message)));
        } else {
            adminApi.privacyPolicies.create(payload)
                .then(() => { load(); resetForm(); })
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
        setDeleteDialog({ open: true, id });
    }

    function confirmDelete() {
        if (deleteDialog.id) {
            adminApi.privacyPolicies.delete(deleteDialog.id).then(() => { load(); }).catch(() => {});
        }
        setDeleteDialog({ open: false, id: null });
    }

    if (loading) return <div className="container"><LoadingSpinner /></div>;

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
                    <FormField id="version" label="Versi" value={form.version} onChange={version => setForm({ ...form, version })} placeholder="contoh: 1.0" />
                    <FormField id="effective_date" label="Tanggal Berlaku" type="date" value={form.effective_date} onChange={effective_date => setForm({ ...form, effective_date })} placeholder="YYYY-MM-DD" />
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
                emptyMessage="Tidak ada data Kebijakan Privasi"
            >
                {items.map(item => (
                    <CRUDCard
                        key={item.id}
                        item={item}
                        onEdit={startEdit}
                        onDelete={handleDelete}
                        title={<h3>Versi {item.version || '-'}</h3>}
                        subtitle={<span>Berlaku: {formatDate(item.effective_date)}</span>}
                        description={<span dangerouslySetInnerHTML={{ __html: renderContent(item.content) }} />}
                        meta={
                            item.is_current
                                ? <span className="badge badge-status active">Versi Saat Ini</span>
                                : <span className="badge badge-status inactive">Arsip</span>
                        }
                    />
                ))}
            </DataList>
            <ConfirmDialog
                open={deleteDialog.open}
                message="Apakah Anda yakin ingin menghapus kebijakan privasi ini?"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteDialog({ open: false, id: null })}
            />
        </div>
    );
}
