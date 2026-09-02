import { useState, useEffect, useCallback, useRef } from 'react';
import { adminApi } from '../../services/api';
import { CreditCard, ChevronDown, ChevronUp, Search, Bell } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import LoadingSpinner from '../../components/LoadingSpinner';
import './AdminCRUD.css';

const PAGE_SIZE = 10;
const POLL_INTERVAL_MS = 15000;

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
    const [newItemIds, setNewItemIds] = useState(new Set());
    const [lastUpdated, setLastUpdated] = useState(null);
    const [pendingCount, setPendingCount] = useState(0);
    const [toasts, setToasts] = useState([]);
    const [notificationPermission, setNotificationPermission] = useState('default');
    const previousItemIdsRef = useRef(new Set());
    const previousStatusRef = useRef({});
    const audioRef = useRef(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
    }, []);

    function playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (err) {
            console.error('Notification sound error:', err);
        }
    }

    function requestNotificationPermission() {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                setNotificationPermission(permission);
            });
        }
    }

    function sendBrowserNotification(title, body) {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification(title, {
                    body,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    tag: 'payment-notification',
                });
            } catch (err) {
                console.error('Browser notification error:', err);
            }
        }
    }

    function addToast(message, type = 'info') {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 5000);
    }

    const load = useCallback(() => {
        setLoading(true);
        const params = { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE };
        if (statusFilter) params.status = statusFilter;

        adminApi.payments.list(params).then(result => {
            let paymentList = [];
            let totalCount = 0;

            if (result && typeof result === 'object' && 'data' in result) {
                paymentList = result.data;
                totalCount = result.total;
            } else {
                paymentList = result;
                totalCount = result?.length || 0;
            }

            const currentIds = new Set(paymentList.map(item => item.id));
            const prevIds = previousItemIdsRef.current;
            const currentStatuses = {};
            paymentList.forEach(item => {
                currentStatuses[item.id] = item.status;
            });

            if (prevIds.size > 0) {
                const newItems = paymentList.filter(item => !prevIds.has(item.id));
                const pendingItems = paymentList.filter(item => item.status === 'pending');

                if (newItems.length > 0) {
                    setNewItemIds(currentIds);
                    setTimeout(() => setNewItemIds(new Set()), 3000);

                    newItems.forEach(item => {
                        const message = `Pembayaran baru: ${item.program_title || `Program #${item.program_id}`} - ${formatRupiah(item.amount)}`;
                        addToast(message, 'success');
                        playNotificationSound();
                        sendBrowserNotification('Pembayaran Baru', message);
                    });
                }

                paymentList.forEach(item => {
                    const prevStatus = previousStatusRef.current[item.id];
                    if (prevStatus && prevStatus !== item.status) {
                        if (item.status === 'success') {
                            const message = `Pembayaran berhasil: ${item.program_title || `Program #${item.program_id}`}`;
                            addToast(message, 'success');
                            playNotificationSound();
                            sendBrowserNotification('Pembayaran Berhasil', message);
                        } else if (item.status === 'failed' || item.status === 'cancelled') {
                            const message = `Pembayaran ${statusLabel(item.status)}: ${item.program_title || `Program #${item.program_id}`}`;
                            addToast(message, 'danger');
                            playNotificationSound();
                            sendBrowserNotification('Pembayaran Gagal', message);
                        }
                    }
                });
            }

            previousItemIdsRef.current = currentIds;
            previousStatusRef.current = currentStatuses;
            setPendingCount(paymentList.filter(item => item.status === 'pending').length);
            setItems(paymentList);
            setTotal(totalCount);
            setLastUpdated(new Date());
            setLoading(false);
        }).catch(() => {
            setLoading(false);
        });
    }, [page, statusFilter]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        const timer = setInterval(() => {
            load();
        }, POLL_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [load]);

    useEffect(() => {
        requestNotificationPermission();
    }, []);

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <h1 style={{ margin: 0 }}>Pembayaran</h1>
                    {pendingCount > 0 && (
                        <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Bell size={14} />
                            {pendingCount} menunggu
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <span>Auto-refresh: 15 detik</span>
                    {lastUpdated && <span>• Terakhir diperbarui: {lastUpdated.toLocaleTimeString('id-ID')}</span>}
                </div>
            </div>

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
                        <div key={item.id} className={`payment-item ${newItemIds.has(item.id) ? 'new-item' : ''}`}>
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

            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        {toast.message}
                    </div>
                ))}
            </div>
        </div>
    );
}
