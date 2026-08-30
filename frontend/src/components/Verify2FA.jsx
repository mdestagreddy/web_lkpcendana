import { useState } from 'react';
import { Shield } from 'lucide-react';
import FlexIcon from './FlexIcon';
import Alert from './Alert';
import { publicApi } from '../services/api';
import './Verify2FA.css';

export default function Verify2FA({
    tempToken,
    onVerified,
    title = 'Verifikasi Dua Faktor (2FA)',
    description = 'Masukkan 6 digit kode dari aplikasi Authenticator.',
    submitLabel = 'Verifikasi 2FA',
    loading = false,
    disabled = false,
    error = '',
    icon: Icon = Shield,
}) {
    const [code, setCode] = useState('');
    const [localError, setLocalError] = useState('');
    const [touched, setTouched] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        e.stopPropagation();
        setLocalError('');
        setTouched(true);

        const trimmed = code.trim();
        if (!trimmed) {
            setLocalError('Kode 2FA wajib diisi');
            return;
        }

        onVerified?.('loading');
        try {
            let data;
            if (tempToken === 'setup') {
                data = await publicApi.enableTwoFactor({ code: trimmed });
            } else if (tempToken === 'disable') {
                data = await publicApi.disableTwoFactor({ code: trimmed });
            } else {
                data = await publicApi.verifyTwoFactor({ tempToken, code: trimmed });
            }
            onVerified?.(data || { success: true });
        } catch (err) {
            setLocalError(err.message || 'Verifikasi 2FA gagal');
            onVerified?.('error');
        }
    }

    const displayError = touched && !code.trim() ? 'Kode 2FA wajib diisi' : localError || error;
    const isSubmitDisabled = disabled || loading || code.trim().length !== 6;

    return (
        <div className="verify-2fa">
            <div className="verify-2fa-header">
                <FlexIcon Icon={Icon} size={20}>{title}</FlexIcon>
            </div>
            <p className="verify-2fa-description">{description}</p>

            {displayError && <Alert type="error">{displayError}</Alert>}

            <div className="verify-2fa-form">
                <div className="form-group">
                    <label htmlFor="twoFactorCode">Kode 2FA</label>
                    <input
                        id="twoFactorCode"
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        placeholder="123456"
                        value={code}
                        onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        onBlur={() => setTouched(true)}
                        required
                        maxLength={6}
                        autoComplete="off"
                    />
                </div>
                <button type="button" onClick={handleSubmit} className="btn btn-primary" disabled={isSubmitDisabled}>
                    {loading ? 'Memverifikasi...' : <FlexIcon Icon={Shield} size={16}>{submitLabel}</FlexIcon>}
                </button>
            </div>
        </div>
    );
}
