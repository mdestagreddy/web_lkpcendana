import { useState, useEffect } from 'react';
import { publicApi } from '../../services/api';
import { Shield } from 'lucide-react';
import './PrivacyPolicy.css';

function formatDate(value) {
    if (!value) return '-';
    if (typeof value !== 'string') return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

function renderContent(content) {
    if (!content) return '';
    const trimmed = content.trim();
    if (/<[a-z][\s\S]*>/i.test(trimmed)) {
        return trimmed;
    }
    return trimmed.replace(/\n/g, '<br/>');
}

export default function PrivacyPolicy() {
    const [policy, setPolicy] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        publicApi.getPrivacyPolicy().then(data => {
            setPolicy(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="container"><p>Memuat...</p></div>;
    if (!policy) return <div className="container"><p>Kebijakan privasi tidak ditemukan</p></div>;

    return (
        <div className="privacy-page">
            <div className="container">
                <h1><Shield size={28} /> Kebijakan Privasi</h1>
                <div className="privacy-content">
                    <div dangerouslySetInnerHTML={{ __html: renderContent(policy.content) }} />
                    <p><strong>Versi:</strong> {policy.version}</p>
                    <p><strong>Tanggal Berlaku:</strong> {formatDate(policy.effective_date)}</p>
                </div>
            </div>
        </div>
    );
}
