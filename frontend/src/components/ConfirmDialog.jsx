import { useState, useEffect, useCallback } from 'react';
import './ConfirmDialog.css';

function ConfirmDialog({ open, title = 'Konfirmasi', message = 'Apakah Anda yakin?', confirmLabel = 'Ya, Hapus', cancelLabel = 'Batal', onConfirm, onCancel, variant = 'danger' }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (open) {
            setVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setVisible(false), 200);
            document.body.style.overflow = '';
            return () => clearTimeout(timer);
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    const handleBackdropClick = useCallback((e) => {
        if (e.target === e.currentTarget) onCancel?.();
    }, [onCancel]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') onCancel?.();
    }, [onCancel]);

    useEffect(() => {
        if (open) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, handleKeyDown]);

    if (!open && !visible) return null;

    return (
        <div className={`confirm-overlay ${visible ? 'open' : ''}`} onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <div className={`confirm-dialog ${variant}`}>
                <h3 id="confirm-title" className="confirm-title">{title}</h3>
                <p className="confirm-message">{message}</p>
                <div className="confirm-actions">
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>{cancelLabel}</button>
                    <button type="button" className={`btn btn-${variant}`} onClick={onConfirm}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDialog;
