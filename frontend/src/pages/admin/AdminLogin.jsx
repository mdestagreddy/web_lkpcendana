import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { publicApi } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { Mail, Lock, LogIn, RefreshCw } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import Alert from '../../components/Alert';
import SecurityCaptcha from '../../components/SecurityCaptcha';
import './AdminLogin.css';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [captchaId, setCaptchaId] = useState(null); // eslint-disable-line no-unused-vars
    const [captchaSvg, setCaptchaSvg] = useState(''); // eslint-disable-line no-unused-vars
    const [captchaInput, setCaptchaInput] = useState('');
    const [hpConfirm, setHpConfirm] = useState('');
    const [hpToken, setHpToken] = useState(null);
    const { login, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    function loadCaptcha() {
        publicApi.getLoginCaptcha().then(data => {
            setCaptchaId(data.captchaId);
            setCaptchaSvg(data.svg);
            setCaptchaInput('');
            setHpToken(data.hpToken || null);
        }).catch(() => {});
    }

    useEffect(() => {
        loadCaptcha();
    }, []);

    if (!authLoading && user) {
        return <Navigate to="/admin" replace />;
    }

    function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!captchaInput || !captchaId) {
            setError('Silakan isi kode captcha');
            setLoading(false);
            return;
        }

        publicApi.login({ email, password, captchaId, captchaText: captchaInput, hp_confirm: hpConfirm, hp_token: hpToken })
            .then(data => {
                login(data.user, data.token);
                navigate('/admin');
            })
            .catch(err => {
                setError(err.message || 'Login gagal');
                setLoading(false);
                loadCaptcha();
            });
    }

    return (
        <div className="login-page">
            <form onSubmit={handleSubmit} className="login-form">
                <h1>Login Admin</h1>
                <p className="login-subtitle">LKP Cendana Samarinda</p>

                {error && <Alert type="error">{error}</Alert>}

                <div className="form-group">
                    <label htmlFor="email"><FlexIcon Icon={Mail} size={16}>Email</FlexIcon></label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        autoFocus
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password"><FlexIcon Icon={Lock} size={16}>Kata Sandi</FlexIcon></label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="captcha">Kode Captcha *</label>
                    <SecurityCaptcha
                        loadCaptcha={loadCaptcha}
                        captchaSvg={captchaSvg}
                        captchaInput={captchaInput}
                        onCaptchaChange={e => setCaptchaInput(e.target.value)}
                        inputId="captcha"
                        refreshLabel="Refresh"
                        refreshIcon={RefreshCw}
                        loading={loading}
                    />
                </div>

                <input type="text" name="hp_confirm" value={hpConfirm} onChange={e => setHpConfirm(e.target.value)} style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }} tabIndex={-1} autoComplete="off" />
                <input type="hidden" name="hp_token" value={JSON.stringify(hpToken || '')} />
                <button type="submit" className="btn-login" disabled={loading}>
                    <FlexIcon Icon={LogIn} size={18} /> {loading ? 'Sedang masuk...' : 'Masuk'}
                </button>
            </form>
        </div>
    );
}
