import { Link } from 'react-router-dom';
import { publicApi } from '../../services/api';
import { useState, useEffect } from 'react';
import { Star, Wifi, MessageSquare, ArrowRight, Building2, User } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import Image from '../../components/Image';
import LoadingSpinner from '../../components/LoadingSpinner';
import './Home.css';

export default function Home() {
    const [featuredPrograms, setFeaturedPrograms] = useState([]);
    const [onlinePrograms, setOnlinePrograms] = useState([]);
    const [testimonials, setTestimonials] = useState([]);
    const [institution, setInstitution] = useState({});
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [headerError, setHeaderError] = useState('');
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1080);

    useEffect(() => {
        function handleResize() {
            setWindowWidth(window.innerWidth);
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const results = await Promise.allSettled([
                    publicApi.getFeaturedPrograms(),
                    publicApi.getPrograms({ type: 'online' }),
                    publicApi.getTestimonials({ featured: 'true' }),
                    publicApi.getInstitution(),
                    publicApi.getSiteSettings(),
                ]);

                if (cancelled) return;

                const [featuredResult, onlineResult, testiResult, instResult, setResult] = results;

                if (featuredResult.status === 'fulfilled') setFeaturedPrograms(featuredResult.value);
                if (onlineResult.status === 'fulfilled') setOnlinePrograms(onlineResult.value);
                if (testiResult.status === 'fulfilled') setTestimonials(testiResult.value);
                if (instResult.status === 'fulfilled') {
                    setInstitution(instResult.value || {});
                }
                if (setResult.status === 'fulfilled') {
                    console.log('Home page site settings:', setResult.value);
                    setSettings(setResult.value);
                } else {
                    console.warn('Home page site settings failed:', setResult.reason);
                }
            } catch (err) {
                console.error('Failed to load home data:', err);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) return <div className="container"><LoadingSpinner /></div>;

    const headerImage = settings.header_image || '';
    const headerImageMobile = settings.header_image_mobile || '';
    const siteName = institution.name || 'LKP Cendana';
    const welcomeMessage = institution.welcome_message || `Selamat Datang di ${siteName}`;

    return (
        <div className="home">
            <div className="header-image">
                {headerImage ? (
                    <Image
                        src={windowWidth >= 1080 ? headerImage : (headerImageMobile || headerImage)}
                        alt={siteName}
                        onError={(e) => {
                            console.error('Failed to load header image:', headerImage);
                            setHeaderError('Gagal memuat gambar header');
                            e.target.style.display = 'none';
                        }}
                    />
                ) : (
                    <div className="header-placeholder">
                        <FlexIcon Icon={Building2} size={64} strokeWidth={1} />
                        <p className="header-placeholder-text">{siteName}</p>
                    </div>
                )}
                {headerError && (
                    <div className="header-error">
                        {headerError}
                    </div>
                )}
            </div>

            <section className="hero">
                <div className="hero-content">
                    <h1>{welcomeMessage}</h1>
                    <p>{institution.hero_tagline}</p>
                </div>
            </section>

            {featuredPrograms.length > 0 && (
                <section className="featured-section">
                    <div className="container">
                        <h2><FlexIcon Icon={Star} size={24}>Program Unggulan</FlexIcon></h2>
                        <div className="programs-grid">
                            {featuredPrograms.map(program => (
                                <div key={program.id} className="program-card featured">
                                    <div className="program-image-wrapper">
                                        {program.image_url ? (
                                            <Image src={program.image_url} alt={program.title} className="program-image" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
                                        ) : (
                                            <div className="program-image-placeholder">Tidak ada gambar</div>
                                        )}
                                    </div>
                                    <h3>{program.title}</h3>
                                    <p>{program.description}</p>
                                    <Link to="/registration" className="btn btn-primary"><FlexIcon Icon={ArrowRight} size={18}>Daftar Sekarang</FlexIcon></Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {onlinePrograms.length > 0 && (
                <section className="online-section">
                    <div className="container">
                        <h2><FlexIcon Icon={Wifi} size={24}>Pelatihan Online</FlexIcon></h2>
                        <div className="programs-grid">
                            {onlinePrograms.map(program => (
                                <div key={program.id} className="program-card">
                                    <div className="program-image-wrapper">
                                        {program.image_url ? (
                                            <Image src={program.image_url} alt={program.title} className="program-image" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
                                        ) : (
                                            <div className="program-image-placeholder">Tidak ada gambar</div>
                                        )}
                                    </div>
                                    <span className="badge">{program.category.toUpperCase()}</span>
                                    <h3>{program.title}</h3>
                                    <p className="level">Level: {program.level}</p>
                                    <p className="duration">{Math.floor(program.duration_minutes / 60)}h {program.duration_minutes % 60}m</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {testimonials.length > 0 && (
                <section className="testimonials-section">
                    <div className="container">
                        <h2><FlexIcon Icon={MessageSquare} size={24}>Testimoni Alumni</FlexIcon></h2>
                        <div className="testimonials-grid">
                            {testimonials.map(item => (
                                <div key={item.id} className="testimonial-card">
                                    {item.foto ? (
                                        <Image src={item.foto} alt={item.nama} className="testimonial-photo" />
                                    ) : (
                                        <div className="testimonial-avatar">
                                            <FlexIcon Icon={User} size={40} strokeWidth={1.5} />
                                        </div>
                                    )}
                                    <p>"{item.isi}"</p>
                                    <h4>{item.nama} - {item.lokasi}</h4>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
