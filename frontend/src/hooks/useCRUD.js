import { useState, useEffect, useCallback } from 'react';

function useCRUD({ api, initialForm, onSuccess, onDeleteError, startEdit: customStartEdit, pageSize = 10 }) {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
    const [error, setError] = useState('');

    const load = useCallback(() => {
        setLoading(true);
        setError('');
        const params = { limit: pageSize, offset: (page - 1) * pageSize };
        api.list(params)
            .then(result => {
                if (result && typeof result === 'object' && 'data' in result) {
                    setItems(result.data || []);
                    setTotal(result.total || 0);
                } else {
                    setItems(result || []);
                    setTotal(result?.length || 0);
                }
                setLoading(false);
            })
            .catch(err => { setError(err?.message || 'Gagal memuat data'); setLoading(false); });
    }, [api, page, pageSize]);

    useEffect(() => { load(); }, [load]);

    function handlePageChange(newPage) {
        setPage(newPage);
    }

    function handleSubmit(e) {
        e.preventDefault();
        setError('');
        if (editing) {
            api.update(editing.id, form)
                .then(() => { load(); setEditing(null); onSuccess?.('Berhasil memperbarui data'); })
                .catch(err => setError(err?.data?.error || err?.message || 'Gagal memperbarui data'));
        } else {
            api.create(form)
                .then(() => { load(); resetForm(); onSuccess?.('Berhasil menambahkan data'); })
                .catch(err => setError(err?.data?.error || err?.message || 'Gagal menambahkan data'));
        }
    }

    function resetForm() {
        setForm(initialForm);
        setEditing(null);
    }

    function startEdit(item) {
        if (customStartEdit) {
            customStartEdit(item, setForm, setEditing);
        } else {
            setEditing(item);
            setForm(item);
        }
    }

    function handleDelete(id) {
        setDeleteDialog({ open: true, id });
    }

    function confirmDelete() {
        if (deleteDialog.id) {
            api.delete(deleteDialog.id)
                .then(() => { load(); onSuccess?.('Berhasil menghapus data'); })
                .catch(err => { onDeleteError?.(err); });
        }
        setDeleteDialog({ open: false, id: null });
    }

    return {
        items,
        total,
        loading,
        page,
        pageSize,
        setPage,
        editing,
        form,
        setForm,
        deleteDialog,
        setDeleteDialog,
        error,
        setError,
        load,
        handleSubmit,
        resetForm,
        startEdit,
        handleDelete,
        confirmDelete,
        handlePageChange,
    };
}

export default useCRUD;
