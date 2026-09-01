import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/api';
import { CreditCard, ChevronDown, ChevronUp, Search } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import LoadingSpinner from '../../components/LoadingSpinner';
import './AdminCRUD.css';

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
    { value: '', label: 'Semua Status' },
    { value: 'pending', label: 'Menunggu Pembayaran' },
    { value: 'success', label: 'Berhasil' },
    { value: 'failed', label: 'Gagal' },
    { value: 'challenge', label: 'Challenge' },
    { value: 'cancelled', label: 'Dibatalkan' },
];

function formatRupiah(value) {
    const number = parseInt(value, 10);
    if (isNaN(number)) return 'Rp 0';
    return 'Rp ' + number.toLocaleString('id-ID');
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function statusBadgeClass(status) {
    switch (status) {
        case 'success':
            return 'badge-success';
        case 'pending':
            return 'badge-warning';
        case 'failed':
        case 'cancelled':
            return 'badge-danger';
        case 'challenge':
            return 'badge-info';
        default:
            return 'badge-neutral';
    }
}

function statusLabel(status) {
    switch (status) {
        case 'success':
            return 'Berhasil';
        case 'pending':
            return 'Menunggu';
        case 'failed':
            return 'Gagal';
        case 'cancelled':
            return 'Dibatalkan';
        case 'challenge':
            return 'Challenge';
        default:
            return status;
    }
}

export default function AdminPayments() {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchOrderId, setSearchOrderId] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState({});

    const load = useCallback(() => {
        setLoading(true);
        const params = { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE };
        if (statusFilter) params.status = statusFilter;

        adminApi.payments.list(params).then(result => {
            if (result && typeof result === 'object' && 'data' in result) {
                setItems(result.data);
                setTotal(result.total);
            } else {
                setItems(result);
                setTotal(result?.length || 0);
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [page, statusFilter]);

    useEffect(() => { load(); }, [load]);

    function handleSearch(e) {
        e.preventDefault();
        if (!searchOrderId.trim()) {
            load();
            return;
        }
        setLoading(true);
        adminApi.payments.getByOrderId(searchOrderId.trim()).then(data => {
            setItems([data]);
            setTotal(1);
            setLoading(false);
        }).catch(() => setLoading(false));
    }

    function toggleExpand(id) {
        setExpandedId(expandedId === id ? null : id);
    }

    function handleStatusChange(id, newStatus) {
        setSelectedStatus({ ...selectedStatus, [id]: newStatus });
    }

    function submitStatusUpdate(id) {
        const newStatus = selectedStatus[id];
        if (!newStatus) return;
        setUpdatingId(id);
        adminApi.payments.update(id, { status: newStatus }).then(() => {
            load();
            setUpdatingId(null);
        }).catch(() => setUpdatingId(null));
    }

    return (
        <div className="admin-crud">
            <h1>Pembayaran</h1>

            <form onSubmit={handleSearch} className="search-form">
                <div className="search-input-wrap">
                    <Search size={16} />
                    <input
                        type="text"
                        value={searchOrderId}
                        onChange={(e) => setSearchOrderId(e.target.value)}
                        placeholder="Cari berdasarkan Order ID..."
                    />
                </div>
                <button type="submit" className="btn btn-secondary">Cari</button>
                <button type="button" className="btn btn-secondary" onClick={() => { setSearchOrderId(''); load(); }}>Reset</button>
            </form>

            <div className="filter-bar">
                <label>Filter Status:</label>
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                    {STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="container"><LoadingSpinner /></div>
            ) : items.length === 0 ? (
                <div className="empty-state">Tidak ada data pembayaran</div>
            ) : (
                <div className="payments-list">
                    {items.map(item => (
                        <div key={item.id} className="payment-item">
                            <div className="payment-item-header" onClick={() => toggleExpand(item.id)}>
                                <div className="payment-item-main">
                                    <div className="payment-item-title">
                                        <CreditCard size={18} />
                                        <span>{item.program_title || `Program #${item.program_id}`}</span>
                                    </div>
                                    <div className="payment-item-meta">
                                        <span className={`badge ${statusBadgeClass(item.status)}`}>{statusLabel(item.status)}</span>
                                        <span className="payment-amount">{formatRupiah(item.amount)}</span>
                                    </div>
                                </div>
                                <div className="payment-item-actions">
                                    <span className="payment-order-id">{item.order_id}</span>
                                    {expandedId === item.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </div>
                            </div>

                            {expandedId === item.id && (
                                <div className="payment-item-detail">
                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <label>Nama</label>
                                            <span>{item.customer_name}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Email</label>
                                            <span>{item.customer_email}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Telepon</label>
                                            <span>{item.customer_phone}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Order ID</label>
                                            <span>{item.order_id}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Midtrans TX ID</label>
                                            <span>{item.midtrans_transaction_id || '-'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Dibuat</label>
                                            <span>{formatDate(item.created_at)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Diperbarui</label>
                                            <span>{formatDate(item.updated_at)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Status</label>
                                            <span className={`badge ${statusBadgeClass(item.status)}`}>{statusLabel(item.status)}</span>
                                        </div>
                                    </div>

                                    <div className="status-update">
                                        <label>Ubah Status:</label>
                                        <select
                                            value={selectedStatus[item.id] || item.status}
                                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                        >
                                            {STATUS_OPTIONS.filter(o => o.value).map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                        <button
                                            className="btn btn-primary"
                                            disabled={updatingId === item.id || selectedStatus[item.id] === item.status}
                                            onClick={() => submitStatusUpdate(item.id)}
                                        >
                                            {updatingId === item.id ? 'Menyimpan...' : 'Simpan'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {!searchOrderId && total > PAGE_SIZE && (
                <div className="pagination">
                    <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Sebelumnya</button>
                    <span>Halaman {page} dari {Math.ceil(total / PAGE_SIZE)}</span>
                    <button className="btn btn-secondary" disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => setPage(page + 1)}>Berikutnya</button>
                </div>
            )}
        </div>
    );
}
