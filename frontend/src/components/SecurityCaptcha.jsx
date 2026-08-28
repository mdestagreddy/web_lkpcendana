import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import FlexIcon from './FlexIcon';
import './SecurityCaptcha.css';

export default function SecurityCaptcha({
    loadCaptcha,
    captchaSvg,
    captchaInput,
    onCaptchaChange,
    inputId = 'captcha',
    refreshLabel = 'Refresh',
    refreshIcon: RefreshIcon = Send,
    loading = false,
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="security-captcha">
                <div className="sc-captcha-container">
                    <div className="sc-captcha-loading">Memuat captcha...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="security-captcha">
            <div className="sc-captcha-container">
                {captchaSvg ? (
                    <div className="sc-captcha-display" dangerouslySetInnerHTML={{ __html: captchaSvg }} />
                ) : (
                    <div className="sc-captcha-loading">Memuat captcha...</div>
                )}
                <button
                    type="button"
                    className="sc-btn-refresh"
                    onClick={loadCaptcha}
                    title="Muat ulang captcha"
                    disabled={loading}
                >
                    <FlexIcon Icon={RefreshIcon} size={14}>{refreshLabel}</FlexIcon>
                </button>
            </div>
            <input
                id={inputId}
                className="sc-captcha-input"
                placeholder="Masukkan kode captcha"
                value={captchaInput}
                onChange={onCaptchaChange}
                required
            />
        </div>
    );
}
