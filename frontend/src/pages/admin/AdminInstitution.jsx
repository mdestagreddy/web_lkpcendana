import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Plus, Save, X, Pencil } from 'lucide-react';
import './AdminCRUD.css';

export default function AdminInstitution() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ key_name: '', value: '' });
    const [welcomeMessage, setWelcomeMessage] = useState('');
    const [heroTagline, setHeroTagline] = useState('');
    const [savingWelcome, setSavingWelcome] = useState(false);
    const [savingHero, setSavingHero] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { load(); }, []);

    function load() {
        setLoading(true);
        setError('');
        adminApi.institutionInfo.list().then(data => {
            setItems(data);
            const welcome = data.find(item => item.key_name === 'welcome_message');
            if (welcome) setWelcomeMessage(welcome.value);
            const hero = data.find(item => item.key_name === 'hero_tagline');
            if (hero) setHeroTagline(hero.value);
            setLoading(false);
        }).catch(err => {
            console.error('Failed to load institution info:', err);
            setError('Gagal memuat data institusi');
            setLoading(false);
        });
    }

    function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSaving(true);
        const updatePromise = editing
            ? adminApi.institutionInfo.update(editing.key_name, { value: form.value })
            : adminApi.institutionInfo.update(form.key_name, { value: form.value });

        updatePromise
            .then(() => {
                load();
                resetForm();
            })
            .catch(err => {
                console.error('Failed to save institution info:', err);
                setError('Gagal menyimpan: ' + (err.message || 'Unknown error'));
            })
            .finally(() => {
                setSaving(false);
            });
    }

    function resetForm() {
        setForm({ key_name: '', value: '' });
        setEditing(null);
    }

    function startEdit(item) {
        setEditing(item);
        setForm({ key_name: item.key_name, value: item.value });
    }

    function handleSaveWelcome() {
        setSavingWelcome(true);
        setError('');
        adminApi.institutionInfo.update('welcome_message', { value: welcomeMessage })
            .then(() => {
                load();
            })
            .catch(err => {
                console.error('Failed to save welcome message:', err);
                setError('Gagal menyimpan sambutan: ' + (err.message || 'Unknown error'));
            })
            .finally(() => {
                setSavingWelcome(false);
            });
    }

    function handleSaveHero() {
        setSavingHero(true);
        setError('');
        adminApi.institutionInfo.update('hero_tagline', { value: heroTagline })
            .then(() => {
                load();
            })
            .catch(err => {
                console.error('Failed to save hero tagline:', err);
                setError('Gagal menyimpan tagline: ' + (err.message || 'Unknown error'));
            })
            .finally(() => {
                setSavingHero(false);
            });
    }

    if (loading) return <div className="container"><p>Memuat...</p></div>;

    return (
        <div className="admin-crud">
            <h1>Info Institusi</h1>
            {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
            <form onSubmit={handleSubmit} className="crud-form">
                <div className="form-section">
                    <h3 className="form-section-title">Sambutan Selamat Datang</h3>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="welcome_message">Pesan Sambutan (ditampilkan di halaman utama)</label>
                        <textarea
                            id="welcome_message"
                            placeholder="Selamat Datang di LKP Cendana"
                            value={welcomeMessage}
                            onChange={e => setWelcomeMessage(e.target.value)}
                            rows={2}
                        />
                        <button type="button" onClick={handleSaveWelcome} className="btn btn-primary" disabled={savingWelcome || saving}>
                            {(savingWelcome || saving) ? 'Menyimpan...' : <><Save size={16} /> Simpan Sambutan</>}
                        </button>
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="hero_tagline">Tagline Hero (ditampilkan di bawah sambutan di halaman utama)</label>
                        <textarea
                            id="hero_tagline"
                            placeholder="Menjadi sebuah komitmen bagi kami..."
                            value={heroTagline}
                            onChange={e => setHeroTagline(e.target.value)}
                            rows={2}
                        />
                        <button type="button" onClick={handleSaveHero} className="btn btn-primary" disabled={savingHero || saving}>
                            {(savingHero || saving) ? 'Menyimpan...' : <><Save size={16} /> Simpan Tagline</>}
                        </button>
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Data Informasi</h3>
                    <div className="form-group">
                        <label htmlFor="key_name">Kunci</label>
                        <input id="key_name" placeholder="contoh: nama_sekolah" value={form.key_name} onChange={e => setForm({ ...form, key_name: e.target.value })} required disabled={!!editing} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="value">Nilai</label>
                        <input id="value" placeholder="Nilai informasi" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} required />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={saving}>{editing ? <><Save size={16} /> Perbarui</> : <><Plus size={16} /> Buat/Perbarui</>}</button>
                    {editing && <button type="button" onClick={resetForm} className="btn btn-secondary" disabled={saving}><X size={16} /> Batal</button>}
                </div>
            </form>
            <div className="items-list">
                {items.map(item => (
                    <div key={item.id} className="item-card">
                        <div className="item-info">
                            <h3>{item.key_name}</h3>
                            <p>{item.value}</p>
                        </div>
                        <div className="item-actions">
                            <button onClick={() => startEdit(item)} className="btn btn-small btn-primary"><Pencil size={14} /> Edit</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
