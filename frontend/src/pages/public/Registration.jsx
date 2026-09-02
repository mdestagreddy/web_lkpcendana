import { Monitor, Car, CreditCard } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import FlexIcon from '../../components/FlexIcon';
import { publicApi } from '../../services/api';
import './Registration.css';

const FORMS = [
    {
        title: 'Formulir Komputer Cendana',
        description: 'Daftar untuk program komputer dan IT',
        icon: Monitor,
        url: 'https://docs.google.com/forms/d/e/1FAIpQLSdOV9ABjM1io3IxbdRHaqTP0OJyWEgPkgTk_1qnmJMMUAnbtw/viewform?embedded=true',
    },
    {
        title: 'Formulir Mengemudi Cendana',
        description: 'Daftar untuk program mengemudi',
        icon: Car,
        url: 'https://docs.google.com/forms/d/e/1FAIpQLScYnRQ4nsdHtshgIvF8D1KFx0tq2RMQNx3rsB6jUgfxJJlNXQ/viewform?embedded=true',
    },
];

const POLL_INTERVAL_MS = 15000;

function formatRupiah(value) {
    const number = parseInt(value, 10);
    if (isNaN(number) || number <= 0) return '';
    return 'Rp ' + number.toLocaleString('id-ID');
}

function parseNumericInput(rawValue) {
    const digits = rawValue.replace(/[^0-9]/g, '');
    return digits ? parseInt(digits, 10) : '';
}

function getQueryParams() {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    return {
        payment: params.get('payment'),
        order_id: params.get('order_id'),
        status_code: params.get('status_code'),
        transaction_status: params.get('transaction_status'),
    };
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

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Registration() {
    const [activeTab, setActiveTab] = useState('form');
    const [programs, setPrograms] = useState([]);
    const [loadingPrograms, setLoadingPrograms] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [snapScriptLoaded, setSnapScriptLoaded] = useState(false);
    const [paymentMessage, setPaymentMessage] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [notificationPermission, setNotificationPermission] = useState('default');
    const [lastUpdated, setLastUpdated] = useState(null);
    const [orderIdToTrack, setOrderIdToTrack] = useState('');
    const [ongoingTransaction, setOngoingTransaction] = useState(null);
    const previousStatusRef = useRef({});
    const toastTimerRef = useRef(null);
    const payingRef = useRef(false);

    const [selectedProgramId, setSelectedProgramId] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [amount, setAmount] = useState('');
    const [amountDisplay, setAmountDisplay] = useState('');

    useEffect(() => {
        const loadPrograms = async () => {
            setLoadingPrograms(true);
            try {
                const data = await publicApi.getPrograms({ is_active: 1 });
                const activePrograms = data.data || data;
                setPrograms(activePrograms);
            } catch (err) {
                console.error('Failed to load programs:', err);
            } finally {
                setLoadingPrograms(false);
            }
        };
        loadPrograms();
    }, []);

    useEffect(() => {
        const { payment, order_id, transaction_status } = getQueryParams();
        if (payment && order_id) {
            if (payment === 'finish' && (transaction_status === 'capture' || transaction_status === 'settlement')) {
                setPaymentMessage({ type: 'success', text: `Pembayaran berhasil untuk Order ID: ${order_id}` });
            } else if (payment === 'finish' && transaction_status === 'pending') {
                setPaymentMessage({ type: 'warning', text: `Menunggu pembayaran untuk Order ID: ${order_id}` });
            } else if (payment === 'error') {
                setPaymentMessage({ type: 'danger', text: `Pembayaran gagal untuk Order ID: ${order_id}` });
            } else if (payment === 'unfinish') {
                setPaymentMessage({ type: 'warning', text: `Pembayaran belum selesai untuk Order ID: ${order_id}` });
            }

            setOrderIdToTrack(order_id);
            previousStatusRef.current[order_id] = transaction_status || 'pending';
        }
    }, []);

    useEffect(() => {
        const savedOrderId = typeof window !== 'undefined' ? localStorage.getItem('pending_payment_order_id') : null;
        if (savedOrderId && !orderIdToTrack) {
            setOrderIdToTrack(savedOrderId);
            previousStatusRef.current[savedOrderId] = 'pending';
        }
    }, [orderIdToTrack]);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
    }, []);

    useEffect(() => {
        requestNotificationPermission();
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
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        toastTimerRef.current = setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 5000);
    }

    function requestNotificationPermission() {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                setNotificationPermission(permission);
            });
        }
    }

    const checkPaymentStatus = useCallback(async () => {
        if (!orderIdToTrack) return;
        try {
            const data = await publicApi.getPaymentStatus(orderIdToTrack);
            const currentStatus = data.status;
            const prevStatus = previousStatusRef.current[orderIdToTrack];

            setOngoingTransaction(data);

            if (prevStatus && prevStatus !== currentStatus) {
                if (currentStatus === 'success') {
                    const message = `Pembayaran berhasil untuk Order ID: ${orderIdToTrack}`;
                    setPaymentMessage({ type: 'success', text: message });
                    addToast(message, 'success');
                    playNotificationSound();
                    sendBrowserNotification('Pembayaran Berhasil', message);
                    localStorage.removeItem('pending_payment_order_id');
                } else if (currentStatus === 'failed' || currentStatus === 'cancelled') {
                    const message = `Pembayaran ${currentStatus === 'failed' ? 'gagal' : 'dibatalkan'} untuk Order ID: ${orderIdToTrack}`;
                    setPaymentMessage({ type: 'danger', text: message });
                    addToast(message, 'danger');
                    playNotificationSound();
                    sendBrowserNotification('Pembayaran Gagal', message);
                    localStorage.removeItem('pending_payment_order_id');
                } else if (currentStatus === 'challenge') {
                    const message = `Pembayaran challenge untuk Order ID: ${orderIdToTrack}`;
                    setPaymentMessage({ type: 'warning', text: message });
                    addToast(message, 'warning');
                    playNotificationSound();
                    sendBrowserNotification('Pembayaran Challenge', message);
                }
            }

            previousStatusRef.current[orderIdToTrack] = currentStatus;
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Failed to check payment status:', err);
        }
    }, [orderIdToTrack]);

    useEffect(() => {
        requestNotificationPermission();
    }, []);

    useEffect(() => {
        if (!orderIdToTrack) return;
        localStorage.setItem('pending_payment_order_id', orderIdToTrack);
        checkPaymentStatus();
        const timer = setInterval(() => {
            checkPaymentStatus();
        }, POLL_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [checkPaymentStatus, orderIdToTrack]);

    useEffect(() => {
        if (!snapScriptLoaded) {
            const script = document.createElement('script');
            const isProduction = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';
            script.src = isProduction
                ? 'https://app.midtrans.com/snap/snap.js'
                : 'https://app.sandbox.midtrans.com/snap/snap.js';
            script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '');
            script.async = true;
            script.onload = () => setSnapScriptLoaded(true);
            script.onerror = () => console.error('Failed to load MidTrans Snap script');
            document.body.appendChild(script);
        }
    }, [snapScriptLoaded]);

    const handleProgramChange = (e) => {
        const id = e.target.value;
        setSelectedProgramId(id);
        const program = programs.find(p => p.id === parseInt(id, 10));
        if (program && program.price) {
            const priceString = String(program.price);
            setAmount(priceString);
            setAmountDisplay(formatRupiah(priceString));
        } else {
            setAmount('');
            setAmountDisplay('');
        }
    };

    const handleAmountChange = (e) => {
        const rawValue = e.target.value;
        const numericValue = parseNumericInput(rawValue);
        setAmount(String(numericValue));
        setAmountDisplay(formatRupiah(numericValue));
    };

    const handlePay = async (e) => {
        e.preventDefault();
        if (!selectedProgramId || !customerName || !customerEmail || !customerPhone || !amount) {
            alert('Semua field wajib diisi');
            return;
        }
        if (payingRef.current) return;

        setSubmitting(true);
        try {
            const result = await publicApi.createPayment({
                program_id: parseInt(selectedProgramId, 10),
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                amount: parseInt(amount, 10),
                redirect_url: window.location.href,
            });

            if (result.order_id) {
                setOrderIdToTrack(result.order_id);
                previousStatusRef.current[result.order_id] = 'pending';
                localStorage.setItem('pending_payment_order_id', result.order_id);
                setOngoingTransaction({
                    order_id: result.order_id,
                    program_title: programs.find(p => p.id === parseInt(selectedProgramId, 10))?.title || `Program #${selectedProgramId}`,
                    amount: parseInt(amount, 10),
                    created_at: new Date(),
                    status: 'pending',
                    token: result.token,
                    redirect_url: result.redirect_url,
                });
            }

            if (window.snap && result.token) {
                payingRef.current = true;
                window.snap.pay(result.token, {
                    onSuccess: (paymentResult) => {
                        payingRef.current = false;
                        alert('Pembayaran berhasil!');
                        console.log('Payment success:', paymentResult);
                    },
                    onPending: (paymentResult) => {
                        payingRef.current = false;
                        alert('Menunggu pembayaran Anda.');
                        console.log('Payment pending:', paymentResult);
                    },
                    onError: (paymentResult) => {
                        payingRef.current = false;
                        alert('Pembayaran gagal.');
                        console.log('Payment error:', paymentResult);
                    },
                    onClose: () => {
                        payingRef.current = false;
                        alert('Popup pembayaran ditutup.');
                    },
                });
            } else if (result.redirect_url) {
                window.location.href = result.redirect_url;
            } else {
                alert('Gagal memulai pembayaran');
            }
        } catch (err) {
            alert(err.message || 'Gagal membuat transaksi pembayaran');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="registration-page">
            <div className="container">
                <h1>Pendaftaran</h1>
                <p className="registration-subtitle">Pilih formulir pendaftaran sesuai program yang Anda inginkan</p>

                {paymentMessage && (
                    <div className={`payment-message payment-message-${paymentMessage.type}`}>
                        {paymentMessage.text}
                    </div>
                )}

                <div className="registration-tabs">
                    <button
                        className={`registration-tab ${activeTab === 'form' ? 'active' : ''}`}
                        onClick={() => setActiveTab('form')}
                    >
                        Formulir Pendaftaran
                    </button>
                    <button
                        className={`registration-tab ${activeTab === 'payment' ? 'active' : ''}`}
                        onClick={() => setActiveTab('payment')}
                    >
                        <FlexIcon Icon={CreditCard} size={16} />
                        Pembayaran
                    </button>
                </div>

                {activeTab === 'form' && (
                    <div className="iframe-forms-grid">
                        {FORMS.map(form => {
                            const Icon = form.icon;
                            return (
                                <div key={form.title} className="iframe-card">
                                    <div className="iframe-card-header">
                                        <div className="iframe-icon">
                                            <FlexIcon Icon={Icon} size={24} />
                                        </div>
                                        <div>
                                            <h3>{form.title}</h3>
                                            <p>{form.description}</p>
                                        </div>
                                    </div>
                                    <iframe
                                        src={form.url}
                                        title={form.title}
                                        className="registration-iframe"
                                        allow="geolocation"
                                    >
                                        Memuat formulir...
                                    </iframe>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'payment' && (
                    <div className="payment-card">
                        <div className="payment-card-header">
                            <div className="iframe-icon">
                                <FlexIcon Icon={CreditCard} size={24} />
                            </div>
                            <div>
                                <h3>Pembayaran Pendaftaran</h3>
                                <p>Selesaikan pembayaran untuk program yang Anda pilih</p>
                            </div>
                        </div>

                        {ongoingTransaction && ongoingTransaction.status === 'pending' ? (
                            <div className="ongoing-payment">
                                <div className="ongoing-payment-header">
                                    <h4>Transaksi Sedang Berjalan</h4>
                                    <span className={`badge ${statusBadgeClass(ongoingTransaction.status)}`}>{statusLabel(ongoingTransaction.status)}</span>
                                </div>
                                <div className="ongoing-payment-body">
                                    <div className="ongoing-payment-row">
                                        <span>Order ID</span>
                                        <span>{ongoingTransaction.order_id}</span>
                                    </div>
                                    <div className="ongoing-payment-row">
                                        <span>Program</span>
                                        <span>{ongoingTransaction.program_title || `Program #${ongoingTransaction.program_id}`}</span>
                                    </div>
                                    <div className="ongoing-payment-row">
                                        <span>Nominal</span>
                                        <span>{formatRupiah(ongoingTransaction.amount)}</span>
                                    </div>
                                    <div className="ongoing-payment-row">
                                        <span>Dibuat</span>
                                        <span>{formatDate(ongoingTransaction.created_at)}</span>
                                    </div>
                                </div>
                                <div className="ongoing-payment-actions">
                                    <button
                                        type="button"
                                        className="btn-pay"
                                        disabled={payingRef.current}
                                        onClick={() => {
                                            if (payingRef.current) return;
                                            if (!window.snap) {
                                                alert('Sistem pembayaran sedang dimuat. Silakan tunggu sebentar.');
                                                return;
                                            }
                                            if (!ongoingTransaction.token) {
                                                alert('Token pembayaran tidak ditemukan. Silakan muat ulang halaman.');
                                                return;
                                            }
                                            payingRef.current = true;
                                            window.snap.pay(ongoingTransaction.token, {
                                                onSuccess: (paymentResult) => {
                                                    payingRef.current = false;
                                                    alert('Pembayaran berhasil!');
                                                    console.log('Payment success:', paymentResult);
                                                },
                                                onPending: (paymentResult) => {
                                                    payingRef.current = false;
                                                    alert('Menunggu pembayaran Anda.');
                                                    console.log('Payment pending:', paymentResult);
                                                },
                                                onError: (paymentResult) => {
                                                    payingRef.current = false;
                                                    alert('Pembayaran gagal.');
                                                    console.log('Payment error:', paymentResult);
                                                },
                                                onClose: () => {
                                                    payingRef.current = false;
                                                    alert('Popup pembayaran ditutup.');
                                                },
                                            });
                                        }}
                                    >
                                        Lanjutkan Pembayaran
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form className="payment-form" onSubmit={handlePay}>
                                <div className="form-group">
                                    <label htmlFor="program">Program Pelatihan</label>
                                    <select
                                        id="program"
                                        value={selectedProgramId}
                                        onChange={handleProgramChange}
                                        required
                                    >
                                        <option value="">-- Pilih Program --</option>
                                        {loadingPrograms && <option value="">Memuat program...</option>}
                                        {programs.map(program => (
                                            <option key={program.id} value={program.id}>
                                                {program.title} {program.price ? `- ${formatRupiah(program.price)}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="amount">Nominal Pembayaran</label>
                                    <input
                                        id="amount"
                                        type="text"
                                        inputMode="numeric"
                                        value={amountDisplay}
                                        onChange={handleAmountChange}
                                        placeholder="Contoh: 2500000"
                                        required
                                    />
                                    {amount && (
                                        <input type="hidden" name="amount" value={amount} readOnly />
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="name">Nama Lengkap</label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Masukkan nama lengkap"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={customerEmail}
                                        onChange={(e) => setCustomerEmail(e.target.value)}
                                        placeholder="contoh@email.com"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phone">Nomor Telepon</label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        placeholder="0812-3456-7890"
                                        required
                                    />
                                </div>

                                <button type="submit" className="btn-pay" disabled={submitting}>
                                    {submitting ? 'Memproses...' : 'Bayar Sekarang'}
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>

            <div className="registration-toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`registration-toast registration-toast-${toast.type}`}>
                        {toast.message}
                    </div>
                ))}
            </div>
        </div>
    );
}
