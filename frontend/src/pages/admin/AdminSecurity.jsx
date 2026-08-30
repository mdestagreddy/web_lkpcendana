import { useState, useEffect } from 'react';
import { publicApi } from '../../services/api';
import { Shield, Smartphone, Copy, Check } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';
import './AdminSecurity.css';

export default function AdminSecurity() {
    const [secret, setSecret] = useState('');
    const [otpauth, setOtpauth] = useState('');
    const [code, setCode] = useState('');
    const [twofaEnabled, setTwofaEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => { load(); }, []);

    function load() {
        setLoading(true);
        setError('');
        publicApi.setupTwoFactor()
            .then(data => {
                setSecret(data.secret);
                setOtpauth(data.otpauth || '');
                setLoading(false);
            })
            .catch(() => {
                setError('Gagal memuat pengaturan 2FA');
                setLoading(false);
            });
    }

    function copySecret() {
        if (secret) {
            navigator.clipboard.writeText(secret);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    function handleEnable(e) {
        e.preventDefault();
        setError('');
        setSaving(true);
        publicApi.enableTwoFactor({ code })
            .then(() => {
                setTwofaEnabled(true);
                setSuccess('2FA berhasil diaktifkan');
                setCode('');
                setSecret('');
                setOtpauth('');
                setSaving(false);
            })
            .catch(err => {
                setError(err.message || 'Gagal mengaktifkan 2FA');
                setSaving(false);
            });
    }

    if (loading) return <div className="container"><LoadingSpinner /></div>;

    return (
        <div className="admin-security">
            <h1>Keamanan Akun</h1>
            <p className="page-subtitle">Kelola keamanan akun admin Anda</p>

            {error && <Alert type="error">{error}</Alert>}
            {success && <Alert type="success">{success}</Alert>}

            <div className="security-card">
                <div className="security-card-header">
                    <FlexIcon Icon={Shield} size={20}>Verifikasi Dua Faktor (2FA)</FlexIcon>
                </div>
                <p className="security-description">
                    Tambahkan lapisan keamanan ekstra dengan verifikasi dua faktor menggunakan aplikasi Authenticator.
                </p>

                {!twofaEnabled && (
                    <form onSubmit={handleEnable} className="twofa-form">
                        {secret && (
                            <div className="form-section">
                                <h3 className="form-section-title">Langkah 1: Pindai QR Code</h3>
                                <p className="security-hint">
                                    Buka aplikasi Authenticator di ponsel Anda, lalu pindai QR code di bawah ini.
                                </p>

                                {otpauth && (
                                    <div className="qr-placeholder">
                                        <div className="qr-info">
                                            <p><strong>Atau masukkan kunci ini:</strong></p>
                                            <div className="secret-box">
                                                <code>{secret}</code>
                                                <button type="button" className="btn-icon" onClick={copySecret} title="Salin kunci">
                                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        <img
                                            className="qr-image"
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otpauth)}`}
                                            alt="QR Code 2FA"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="form-section">
                            <h3 className="form-section-title">Langkah 2: Verifikasi Kode</h3>
                            <p className="security-hint">
                                Masukkan 6 digit kode dari aplikasi Authenticator untuk mengaktifkan 2FA.
                            </p>
                            <div className="form-group">
                                <label htmlFor="code">Kode Verifikasi</label>
                                <input
                                    id="code"
                                    type="text"
                                    placeholder="123456"
                                    value={code}
                                    onChange={e => setCode(e.target.value)}
                                    required
                                    maxLength={6}
                                    autoComplete="off"
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={saving || code.length !== 6}>
                                <FlexIcon Icon={Shield} size={16}>Aktifkan 2FA</FlexIcon>
                            </button>
                        </div>
                    </form>
                )}

                {twofaEnabled && (
                    <div className="twofa-active">
                        <FlexIcon Icon={Shield} size={20}>2FA Aktif</FlexIcon>
                        <p>Verifikasi dua faktor sudah diaktifkan untuk akun Anda.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
