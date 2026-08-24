import { Monitor, Car } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
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

export default function Registration() {
    return (
        <div className="registration-page">
            <div className="container">
                <h1>Pendaftaran</h1>
                <p className="registration-subtitle">Pilih formulir pendaftaran sesuai program yang Anda inginkan</p>
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
            </div>
        </div>
    );
}
