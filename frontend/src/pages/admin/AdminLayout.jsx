import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useTheme } from '../../context/useTheme';
import { ThemeProvider } from '../../context/ThemeContext';
import { LayoutDashboard, GraduationCap, Users, MessageSquare, Star, Image, UserCog, Building2, Target, Settings, FileText, Tag, GitBranch, Shield, LogOut, Sun, Moon, Monitor } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import LoadingSpinner from '../../components/LoadingSpinner';
import { publicApi } from '../../services/api';
import './AdminLayout.css';

function AdminLayoutInner() {
    const { user, logout, loading } = useAuth();
    const { themeMode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [scrollY, setScrollY] = useState(window.pageYOffset);
    const location = useLocation();
    const [siteSettings, setSiteSettings] = useState({});
    const [institution, setInstitution] = useState({});

    const routeTitles = {
        '/admin': 'Dasbor',
        '/admin/programs': 'Program',
        '/admin/instructors': 'Instruktur',
        '/admin/testimonials': 'Testimoni',
        '/admin/reviews': 'Ulasan',
        '/admin/gallery': 'Galeri',
        '/admin/users': 'Pengguna',
        '/admin/institution': 'Institusi',
        '/admin/vision-mission': 'Visi/Misi',
        '/admin/site-settings': 'Pengaturan Situs',
        '/admin/posts': 'Artikel',
        '/admin/categories': 'Kategori',
        '/admin/org-chart': 'Struktur Organisasi',
        '/admin/privacy-policies': 'Kebijakan Privasi',
    };

    const pageTitle = routeTitles[location.pathname] || '';

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [location.pathname]);

    useEffect(() => {
        publicApi.getSiteSettings().then(data => {
            if (Array.isArray(data)) {
                const map = {};
                data.forEach(item => { map[item.key_name] = item.value; });
                setSiteSettings(map);
            } else if (data && typeof data === 'object') {
                setSiteSettings(data);
            }
        });
        publicApi.getInstitution().then(data => {
            if (Array.isArray(data)) {
                const map = {};
                data.forEach(item => { map[item.key_name] = item.value; });
                setInstitution(map);
            } else if (data && typeof data === 'object') {
                setInstitution(data);
            }
        });
    }, []);

    useEffect(() => {
        window.addEventListener("scroll", () => {
            setScrollY(window.pageYOffset);
        });
    }, [])

    const sidebarOpenRef = useRef(false);

    const handleResize = () => {
        if (window.innerWidth >= 768 && sidebarOpenRef.current) {
            setSidebarOpen(false);
        }
    };

    useEffect(() => {
        sidebarOpenRef.current = sidebarOpen;

        handleResize();

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [sidebarOpen]);

    if (loading) {
        return <div className="admin-layout"><main className="admin-content"><LoadingSpinner /></main></div>;
    }

    if (!user) {
        return <Navigate to="/admin/login" replace />;
    }

    function handleLogout() {
        logout();
        navigate('/admin/login');
    }

    return (
        <div className="admin-layout">
            <aside className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-header-row">
                        <div className="sidebar-brand">
                            {siteSettings.logo_image && (
                                <img src={siteSettings.logo_image.startsWith('http') ? siteSettings.logo_image : `${import.meta.env.VITE_BACKEND || 'http://localhost:5000'}/uploads/${siteSettings.logo_image}`} alt="Logo" className="sidebar-logo" />
                            )}
                            <h2>{institution.name || 'LKP Cendana'}</h2>
                        </div>
                        <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle dark mode">
                            {themeMode === 'system' ? <FlexIcon Icon={Monitor} size={18} /> : themeMode === 'dark' ? <FlexIcon Icon={Sun} size={18} /> : <FlexIcon Icon={Moon} size={18} />}
                        </button>
                    </div>
                    <p className="user-name">Panel Admin</p>
                </div>
                <nav className="sidebar-nav">
                    <NavLink to="/admin" end className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><FlexIcon Icon={LayoutDashboard} size={18}>Dasbor</FlexIcon></NavLink>
                    <NavLink to="/admin/programs" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><FlexIcon Icon={GraduationCap} size={18}>Program</FlexIcon></NavLink>
                    <NavLink to="/admin/instructors" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><FlexIcon Icon={Users} size={18}>Instruktur</FlexIcon></NavLink>
                    <NavLink to="/admin/testimonials" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><FlexIcon Icon={MessageSquare} size={18}>Testimoni</FlexIcon></NavLink>
                    <NavLink to="/admin/reviews" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><FlexIcon Icon={Star} size={18}>Ulasan</FlexIcon></NavLink>
                    <NavLink to="/admin/gallery" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><FlexIcon Icon={Image} size={18}>Galeri</FlexIcon></NavLink>
                    <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><FlexIcon Icon={UserCog} size={18}>Pengguna</FlexIcon></NavLink>
                    <NavLink to="/admin/institution" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><FlexIcon Icon={Building2} size={18}>Institusi</FlexIcon></NavLink>
                    <NavLink to="/admin/vision-mission" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><FlexIcon Icon={Target} size={18}>Visi/Misi</FlexIcon></NavLink>
                    <NavLink to="/admin/site-settings" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><FlexIcon Icon={Settings} size={18}>Pengaturan Situs</FlexIcon></NavLink>
                    <NavLink to="/admin/posts" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><FlexIcon Icon={FileText} size={18}>Artikel</FlexIcon></NavLink>
                    <NavLink to="/admin/categories" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><FlexIcon Icon={Tag} size={18}>Kategori</FlexIcon></NavLink>
                    <NavLink to="/admin/org-chart" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><FlexIcon Icon={GitBranch} size={18}>Struktur Organisasi</FlexIcon></NavLink>
                    <NavLink to="/admin/privacy-policies" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><FlexIcon Icon={Shield} size={18}>Kebijakan Privasi</FlexIcon></NavLink>
                    <NavLink to="/admin/security" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><FlexIcon Icon={Shield} size={18}>Keamanan</FlexIcon></NavLink>
                </nav>
                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="logout-btn"><FlexIcon Icon={LogOut} size={18}>Keluar</FlexIcon></button>
                </div>
            </aside>
            {sidebarOpen && <div className="sidebar-overlay visible" onClick={() => setSidebarOpen(false)} />}
            <main className="admin-content">
                <div className="header">
                    <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                    <h1 className="header-page-title" style={{ opacity: Math.min(scrollY / 120, 1) }}>{pageTitle}</h1>
                </div>
                <Outlet />
            </main>
        </div>
    );
}

export default function AdminLayout() {
    return (
        <ThemeProvider storageKey="admin-theme">
            <AdminLayoutInner />
        </ThemeProvider>
    );
}
