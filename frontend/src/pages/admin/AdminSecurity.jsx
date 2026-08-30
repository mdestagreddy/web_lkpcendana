import { useState, useEffect } from 'react';
import { publicApi } from '../../services/api';
import { Shield, Copy, Check } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';
import Verify2FA from '../../components/Verify2FA';
import './AdminSecurity.css';

export default function AdminSecurity() {
    const [secret, setSecret] = useState('');
    const [otpauth, setOtpauth] = useState('');
    const [twofaEnabled, setTwofaEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => { loadStatus(); }, []);

    function loadStatus() {
        setLoading(true);
        setError('');
        publicApi.getTwoFactorStatus()
            .then(data => {
                setTwofaEnabled(!!data.twofaEnabled);
                setLoading(false);
            })
            .catch(() => {
                setError('Gagal memuat pengaturan 2FA');
                setLoading(false);
            });
    }

    function startSetup() {
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

    function handleReset() {
        setLoading(true);
        setError('');
        publicApi.resetTwoFactor()
            .then(() => {
                setTwofaEnabled(false);
                setSecret('');
                setOtpauth('');
                setSuccess('2FA berhasil direset. Silakan setup ulang.');
                setLoading(false);
            })
            .catch(err => {
                setError(err.message || 'Gagal mereset 2FA');
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

                {!twofaEnabled && !secret && (
                    <div className="security-actions">
                        <button type="button" className="btn btn-primary" onClick={startSetup} disabled={loading}>
                            <FlexIcon Icon={Shield} size={16}>Mulai Setup 2FA</FlexIcon>
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={handleReset} disabled={loading}>
                            Reset 2FA
                        </button>
                    </div>
                )}

                {!twofaEnabled && secret && (
                    <Verify2FA
                        tempToken="setup"
                        onVerified={(result) => {
                            if (result && (result.token || result.message)) {
                                setTwofaEnabled(true);
                                setSuccess(result.message || '2FA berhasil diaktifkan');
                                setSecret('');
                                setOtpauth('');
                            }
                        }}
                        title="Verifikasi 2FA"
                        description="Masukkan 6 digit kode dari aplikasi Authenticator untuk mengaktifkan 2FA."
                        submitLabel="Aktifkan 2FA"
                        error={error}
                    />
                )}

                {twofaEnabled && (
                    <Verify2FA
                        tempToken="disable"
                        onVerified={(result) => {
                            if (result && (result.token || result.message)) {
                                setTwofaEnabled(false);
                                setSuccess(result.message || '2FA berhasil dinonaktifkan');
                                setSecret('');
                                setOtpauth('');
                            }
                        }}
                        title="Nonaktifkan 2FA"
                        description="Masukkan kode 2FA saat ini untuk menonaktifkan verifikasi dua faktor."
                        submitLabel="Nonaktifkan 2FA"
                        error={error}
                    />
                )}
            </div>
        </div>
    );
}
