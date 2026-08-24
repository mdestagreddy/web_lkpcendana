import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api';
import { GraduationCap, Users, MessageSquare, Star, UserCog, FileText, Image } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import LoadingSpinner from '../../components/LoadingSpinner';
import './AdminDashboard.css';

export default function AdminDashboard() {
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const requests = [
            adminApi.programs.list(),
            adminApi.instructors.list(),
            adminApi.testimonials.list(),
            adminApi.users.list(),
            adminApi.posts.list(),
            adminApi.gallery.list(),
            adminApi.reviews.list(),
        ].map(p => p.catch(() => []));

        Promise.all(requests).then(([programs, instructors, testimonials, users, posts, gallery, reviews]) => {
            setStats({
                programs: programs.length,
                instructors: instructors.length,
                testimonials: testimonials.length,
                users: users.length,
                posts: posts.length,
                gallery: gallery.length,
                reviews: reviews.length,
            });
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="container"><LoadingSpinner /></div>;

    const statCards = [
        { label: 'Program', value: stats.programs, link: '/admin/programs', accent: 'var(--accent-1)', icon: GraduationCap },
        { label: 'Instruktur', value: stats.instructors, link: '/admin/instructors', accent: 'var(--accent-2)', icon: Users },
        { label: 'Testimoni', value: stats.testimonials, link: '/admin/testimonials', accent: 'var(--accent-3)', icon: MessageSquare },
        { label: 'Ulasan', value: stats.reviews, link: '/admin/reviews', accent: '#f59e0b', icon: Star },
        { label: 'Pengguna', value: stats.users, link: '/admin/users', accent: 'var(--accent-2)', icon: UserCog },
        { label: 'Artikel', value: stats.posts, link: '/admin/posts', accent: 'var(--accent-3)', icon: FileText },
        { label: 'Galeri', value: stats.gallery, link: '/admin/gallery', accent: 'var(--accent-1)', icon: Image },
    ];

    return (
        <div className="admin-dashboard">
            <h1>Dasbor</h1>
            <div className="stats-grid">
                {statCards.map(card => {
                    const Icon = card.icon;
                    return (
                        <Link key={card.label} to={card.link} className="stat-card" style={{ '--card-accent': card.accent } }>
                            <FlexIcon Icon={Icon} size={32} strokeWidth={1.5} />
                            <h3>{card.value}</h3>
                            <p>{card.label}</p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

