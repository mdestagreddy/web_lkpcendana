import { useState, useEffect, useCallback } from 'react';

function useCRUD({ api, initialForm, onSuccess, onDeleteError, startEdit: customStartEdit }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
    const [error, setError] = useState('');

    const load = useCallback(() => {
        setLoading(true);
        setError('');
        api.list()
            .then(data => { setItems(data); setLoading(false); })
            .catch(err => { setError(err?.message || 'Gagal memuat data'); setLoading(false); });
    }, [api]);

    useEffect(() => { load(); }, [load]);

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
        loading,
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
    };
}

export default useCRUD;
