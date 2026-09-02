import { Monitor, Car, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';
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

export default function Registration() {
    const [activeTab, setActiveTab] = useState('form');
    const [programs, setPrograms] = useState([]);
    const [loadingPrograms, setLoadingPrograms] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [snapScriptLoaded, setSnapScriptLoaded] = useState(false);
    const [paymentMessage, setPaymentMessage] = useState(null);

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
        }
    }, []);

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

            if (window.snap && result.token) {
                window.snap.pay(result.token, {
                    onSuccess: (paymentResult) => {
                        alert('Pembayaran berhasil!');
                        console.log('Payment success:', paymentResult);
                    },
                    onPending: (paymentResult) => {
                        alert('Menunggu pembayaran Anda.');
                        console.log('Payment pending:', paymentResult);
                    },
                    onError: (paymentResult) => {
                        alert('Pembayaran gagal.');
                        console.log('Payment error:', paymentResult);
                    },
                    onClose: () => {
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
                    </div>
                )}
            </div>
        </div>
    );
}
