import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { publicApi } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { Mail, Lock, LogIn } from 'lucide-react';
import './AdminLogin.css';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    if (!authLoading && user) {
        return <Navigate to="/admin" replace />;
    }

    function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        publicApi.login({ email, password })
            .then(data => {
                login(data.user, data.token);
                navigate('/admin');
            })
            .catch(err => {
                setError(err.message || 'Login gagal');
                setLoading(false);
            });
    }

    return (
        <div className="login-page">
            <form onSubmit={handleSubmit} className="login-form">
                <h1>Login Admin</h1>
                <p className="login-subtitle">LKP Cendana Samarinda</p>

                {error && <div className="alert alert-error">{error}</div>}

                <div className="form-group">
                    <label htmlFor="email"><Mail size={16} /> Email</label>
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
                    <label htmlFor="password"><Lock size={16} /> Kata Sandi</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="btn-login" disabled={loading}>
                    <LogIn size={18} /> {loading ? 'Sedang masuk...' : 'Masuk'}
                </button>
            </form>
        </div>
    );
}
